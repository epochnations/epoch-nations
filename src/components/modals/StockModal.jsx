import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";

export default function StockModal({ stock, myNation, onClose, onRefresh }) {
  const [shares, setShares] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("buy");

  if (!stock || !myNation) return null;

  const totalCost = shares * stock.current_price;
  const canAfford = myNation.currency >= totalCost;

  async function handleBuy() {
    if (!canAfford || shares <= 0 || shares > stock.available_shares) return;
    setLoading(true);

    const newPrice = stock.current_price * (1 + 0.01 * Math.min(shares / 100, 0.5));
    const history = [...(stock.price_history || []), newPrice];

    await base44.entities.Stock.update(stock.id, {
      available_shares: stock.available_shares - shares,
      current_price: parseFloat(newPrice.toFixed(2)),
      price_history: history.slice(-20),
      market_cap: parseFloat((newPrice * stock.total_shares).toFixed(2))
    });

    await base44.entities.Nation.update(myNation.id, {
      currency: myNation.currency - totalCost
    });

    // Upsert holding
    const holdings = await base44.entities.StockHolding.filter({
      nation_id: myNation.id, stock_id: stock.id
    });
    if (holdings.length > 0) {
      const h = holdings[0];
      const newAvg = ((h.avg_buy_price * h.shares_owned) + totalCost) / (h.shares_owned + shares);
      await base44.entities.StockHolding.update(h.id, {
        shares_owned: h.shares_owned + shares,
        avg_buy_price: parseFloat(newAvg.toFixed(2))
      });
    } else {
      await base44.entities.StockHolding.create({
        nation_id: myNation.id,
        nation_name: myNation.name,
        stock_id: stock.id,
        stock_ticker: stock.ticker,
        company_name: stock.company_name,
        shares_owned: shares,
        avg_buy_price: stock.current_price
      });
    }

    await base44.entities.Transaction.create({
      type: "stock_buy",
      from_nation_id: myNation.id,
      from_nation_name: myNation.name,
      stock_id: stock.id,
      stock_ticker: stock.ticker,
      shares,
      price_per_share: stock.current_price,
      total_value: totalCost,
      description: `${myNation.name} bought ${shares}x ${stock.ticker} @ ${stock.current_price.toFixed(2)}`
    });

    // 3% commission goes to the issuing nation (if different from buyer)
    if (stock.nation_id && stock.nation_id !== myNation.id) {
      const commission = Math.floor(totalCost * 0.03);
      if (commission > 0) {
        const issuerNations = await base44.entities.Nation.filter({ id: stock.nation_id });
        if (issuerNations[0]) {
          await base44.entities.Nation.update(stock.nation_id, {
            currency: issuerNations[0].currency + commission
          });
        }
      }
    }

    setLoading(false);
    onRefresh?.();
    onClose();
  }

  async function handleSell() {
    const holdings = await base44.entities.StockHolding.filter({
      nation_id: myNation.id, stock_id: stock.id
    });
    if (holdings.length === 0 || holdings[0].shares_owned < shares) return;
    setLoading(true);
    const h = holdings[0];
    const revenue = shares * stock.current_price;
    const newPrice = stock.current_price * (1 - 0.008 * Math.min(shares / 100, 0.5));
    const history = [...(stock.price_history || []), newPrice];

    await base44.entities.Stock.update(stock.id, {
      available_shares: stock.available_shares + shares,
      current_price: parseFloat(newPrice.toFixed(2)),
      price_history: history.slice(-20),
      market_cap: parseFloat((newPrice * stock.total_shares).toFixed(2))
    });

    await base44.entities.Nation.update(myNation.id, {
      currency: myNation.currency + revenue
    });

    const remaining = h.shares_owned - shares;
    if (remaining <= 0) {
      await base44.entities.StockHolding.delete(h.id);
    } else {
      await base44.entities.StockHolding.update(h.id, { shares_owned: remaining });
    }

    await base44.entities.Transaction.create({
      type: "stock_sell",
      from_nation_id: myNation.id,
      from_nation_name: myNation.name,
      stock_id: stock.id,
      stock_ticker: stock.ticker,
      shares,
      price_per_share: stock.current_price,
      total_value: revenue,
      description: `${myNation.name} sold ${shares}x ${stock.ticker} @ ${stock.current_price.toFixed(2)}`
    });

    setLoading(false);
    onRefresh?.();
    onClose();
  }

  const priceHistory = stock.price_history || [];
  const maxP = Math.max(...priceHistory, 0.1);
  const minP = Math.min(...priceHistory, stock.current_price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">{stock.ticker}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${stock.is_crashed ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                {stock.is_crashed ? "CRASHED" : "LIVE"}
              </span>
            </div>
            <div className="text-sm text-slate-400">{stock.company_name}</div>
            <div className="text-xs text-slate-500">{stock.nation_name} · {stock.sector}</div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Price */}
        <div className="px-6 py-4">
          <div className="text-3xl font-black font-mono text-white">{stock.current_price?.toFixed(2)} <span className="text-sm text-slate-400">cr</span></div>
          <div className="text-xs text-slate-500 mt-1">
            {stock.available_shares} / {stock.total_shares} shares available
          </div>

          {/* Mini chart */}
          {priceHistory.length > 1 && (
            <div className="mt-3 h-16 flex items-end gap-0.5">
              {priceHistory.slice(-20).map((p, i) => {
                const height = maxP > minP ? ((p - minP) / (maxP - minP)) * 100 : 50;
                const isUp = i > 0 && p >= priceHistory[i - 1];
                return (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(height, 5)}%`, backgroundColor: isUp ? "#22c55e" : "#ef4444", opacity: 0.7 }} />
                );
              })}
            </div>
          )}
        </div>

        {/* Trade */}
        <div className="px-6 pb-6 space-y-4">
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button onClick={() => setMode("buy")} className={`flex-1 py-2 text-sm font-bold transition-all ${mode === "buy" ? "bg-green-500/20 text-green-400" : "text-slate-500 hover:bg-white/5"}`}>
              BUY
            </button>
            <button onClick={() => setMode("sell")} className={`flex-1 py-2 text-sm font-bold transition-all ${mode === "sell" ? "bg-red-500/20 text-red-400" : "text-slate-500 hover:bg-white/5"}`}>
              SELL
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Shares</label>
            <input
              type="number"
              min={1}
              max={mode === "buy" ? stock.available_shares : 999}
              value={shares}
              onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="rounded-xl bg-white/5 px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-slate-400">Total</span>
            <span className="font-mono font-bold text-white text-lg">{totalCost.toFixed(2)} cr</span>
          </div>

          <div className="text-xs text-slate-500">Your treasury: {myNation.currency?.toFixed(0)} cr</div>

          {mode === "buy" ? (
            <button
              onClick={handleBuy}
              disabled={loading || !canAfford || shares > stock.available_shares}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Processing..." : !canAfford ? "Insufficient Funds" : "EXECUTE BUY ORDER"}
            </button>
          ) : (
            <button
              onClick={handleSell}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Processing..." : "EXECUTE SELL ORDER"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}