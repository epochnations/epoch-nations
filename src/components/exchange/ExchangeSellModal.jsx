import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, AlertTriangle } from "lucide-react";

const ROYALTY_RATE = 0.015; // 1.5%
const SELF_TRADE_PENALTY = 0.26; // 26%

export default function ExchangeSellModal({ stock, myNation, onClose, onRefresh }) {
  const [shares, setShares] = useState(1);
  const [ownedShares, setOwnedShares] = useState(0);
  const [avgBuy, setAvgBuy] = useState(0);
  const [holding, setHolding] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingHolding, setLoadingHolding] = useState(true);

  const isSelfIssued = stock.nation_id === myNation?.id;
  const grossRevenue = shares * stock.current_price;
  const penalty = isSelfIssued ? grossRevenue * SELF_TRADE_PENALTY : 0;
  const netRevenue = grossRevenue - penalty;
  const sharesValid = shares > 0 && shares <= ownedShares;

  useEffect(() => {
    if (!stock || !myNation) return;
    setLoadingHolding(true);
    base44.entities.StockHolding.filter({ nation_id: myNation.id, stock_id: stock.id })
      .then(h => {
        const found = h[0];
        setHolding(found || null);
        setOwnedShares(found?.shares_owned || 0);
        setAvgBuy(found?.avg_buy_price || 0);
      })
      .finally(() => setLoadingHolding(false));
  }, [stock?.id, myNation?.id]);

  async function handleSell() {
    if (!sharesValid || loading) return;
    setLoading(true);

    const newPrice = stock.current_price * (1 - 0.008 * Math.min(shares / 100, 0.5));
    const history = [...(stock.price_history || []), newPrice];

    await base44.entities.Stock.update(stock.id, {
      available_shares: stock.available_shares + shares,
      current_price: parseFloat(newPrice.toFixed(2)),
      price_history: history.slice(-20),
      market_cap: parseFloat((newPrice * stock.total_shares).toFixed(2)),
    });

    await base44.entities.Nation.update(myNation.id, {
      currency: myNation.currency + netRevenue,
    });

    // Update or delete holding
    const remaining = ownedShares - shares;
    if (remaining <= 0) {
      if (holding) await base44.entities.StockHolding.delete(holding.id);
    } else {
      if (holding) await base44.entities.StockHolding.update(holding.id, { shares_owned: remaining });
    }

    const penaltyDesc = isSelfIssued
      ? ` (26% self-trade penalty: ${penalty.toFixed(0)} cr burned)`
      : "";

    await base44.entities.Transaction.create({
      type: "stock_sell",
      from_nation_id: myNation.id,
      from_nation_name: myNation.name,
      stock_id: stock.id,
      stock_ticker: stock.ticker,
      shares,
      price_per_share: stock.current_price,
      total_value: netRevenue,
      description: `${myNation.name} sold ${shares}× ${stock.ticker} @ ${stock.current_price.toFixed(2)}${penaltyDesc}`,
    });

    // Royalty to issuer for secondary sales (not self-issued)
    if (!isSelfIssued && stock.nation_id) {
      const royalty = Math.floor(grossRevenue * ROYALTY_RATE);
      if (royalty > 0) {
        const issuers = await base44.entities.Nation.filter({ id: stock.nation_id });
        if (issuers[0]) {
          await base44.entities.Nation.update(stock.nation_id, {
            currency: issuers[0].currency + royalty,
          });
          await base44.entities.Transaction.create({
            type: "stock_sell",
            from_nation_id: myNation.id,
            from_nation_name: myNation.name,
            to_nation_id: stock.nation_id,
            to_nation_name: stock.nation_name,
            stock_ticker: stock.ticker,
            total_value: royalty,
            description: `Royalty: ${stock.nation_name} earned ${royalty} cr from ${myNation.name}'s sale of ${stock.ticker}`,
          });
        }
      }
    }

    setLoading(false);
    onRefresh?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0f172a]/98 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">{stock.ticker}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400">SELL</span>
              {isSelfIssued && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400">SELF-ISSUED</span>
              )}
            </div>
            <div className="text-sm text-slate-400">{stock.company_name}</div>
            <div className="text-xs text-slate-500">{stock.nation_name} · {stock.sector}</div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Price info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <div className="text-xs text-slate-500 mb-1">Current Price</div>
              <div className="text-xl font-black font-mono text-white">{stock.current_price?.toFixed(2)} <span className="text-xs text-slate-400">cr</span></div>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <div className="text-xs text-slate-500 mb-1">You Own</div>
              {loadingHolding ? (
                <div className="text-slate-600 text-sm">Loading…</div>
              ) : (
                <div className="text-xl font-black font-mono text-white">{ownedShares} <span className="text-xs text-slate-400">shares</span></div>
              )}
            </div>
          </div>

          {avgBuy > 0 && (
            <div className="text-xs text-slate-500 flex justify-between">
              <span>Avg Buy Price: <span className="font-mono text-slate-300">{avgBuy.toFixed(2)} cr</span></span>
              <span>Est. P&L: <span className={`font-mono font-bold ${(stock.current_price - avgBuy) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {((stock.current_price - avgBuy) * shares).toFixed(0)} cr
              </span></span>
            </div>
          )}

          {/* Shares input */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Shares to Sell</label>
            <input
              type="number"
              min={1}
              max={ownedShares}
              value={shares}
              onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-cyan-400/50"
            />
            {shares > ownedShares && (
              <div className="text-xs text-red-400 mt-1">⚠ You only own {ownedShares} shares</div>
            )}
          </div>

          {/* Revenue breakdown */}
          <div className="rounded-xl bg-white/5 px-4 py-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Gross Revenue</span>
              <span className="font-mono text-white">{grossRevenue.toFixed(2)} cr</span>
            </div>
            {isSelfIssued && (
              <div className="flex justify-between text-xs">
                <span className="text-amber-400">Self-Trade Penalty (26%)</span>
                <span className="font-mono text-amber-400">−{penalty.toFixed(2)} cr</span>
              </div>
            )}
            {!isSelfIssued && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Issuer Royalty (1.5%)</span>
                <span className="font-mono text-slate-500">−{Math.floor(grossRevenue * ROYALTY_RATE)} cr</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="text-sm font-bold text-white">Net Received</span>
              <span className="font-mono font-bold text-white text-sm">{netRevenue.toFixed(2)} cr</span>
            </div>
          </div>

          {/* Self-trade warning */}
          {isSelfIssued && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-300">
                <div className="font-bold mb-0.5">26% Self-Trade Penalty</div>
                Selling your own issued shares incurs a penalty to prevent market manipulation. The penalty amount is permanently burned.
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 flex justify-between">
            <span>Your treasury: {Math.round(myNation?.currency || 0).toLocaleString()} cr</span>
          </div>

          <button
            onClick={handleSell}
            disabled={loading || !sharesValid || loadingHolding}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[44px]"
          >
            {loading ? "Processing…"
              : ownedShares === 0 ? "No Shares Owned"
              : shares > ownedShares ? `Only ${ownedShares} Shares Available`
              : "EXECUTE SELL ORDER"}
          </button>
        </div>
      </div>
    </div>
  );
}