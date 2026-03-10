import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShoppingCart, DollarSign } from "lucide-react";

const COMMODITY_META = {
  food:          { emoji: "🌾", label: "Food",          res: "res_food"  },
  wood:          { emoji: "🪵", label: "Wood",          res: "res_wood"  },
  stone:         { emoji: "🪨", label: "Stone",         res: "res_stone" },
  iron:          { emoji: "⚙️", label: "Iron",          res: "res_iron"  },
  steel:         { emoji: "🔩", label: "Steel",         res: null        },
  oil:           { emoji: "🛢️", label: "Oil",           res: "res_oil"   },
  energy:        { emoji: "⚡", label: "Energy",        res: null        },
  rare_minerals: { emoji: "💎", label: "Rare Minerals", res: null        },
};

export default function GlobalCommodityPanel({ nation, onRefresh }) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [selling, setSelling] = useState(null);
  const [amounts, setAmounts] = useState({});

  useEffect(() => {
    load();
    const unsub = base44.entities.GlobalMarket.subscribe(() => load());
    return unsub;
  }, []);

  async function load() {
    const m = await base44.entities.GlobalMarket.list();
    setMarkets(m);
    setLoading(false);
  }

  function priceChange(market) {
    const h = market.price_history || [];
    if (h.length < 2) return 0;
    return ((h[h.length - 1] - h[h.length - 2]) / h[h.length - 2]) * 100;
  }

  async function buyResource(market) {
    const qty = parseInt(amounts[market.commodity] || 0);
    if (!qty || qty <= 0) return;
    const meta = COMMODITY_META[market.commodity];
    if (!meta?.res) return; // can't hold steel/energy/rare_minerals as raw yet
    const totalCost = qty * market.current_price * (nation.resource_price_mod || 1);
    if ((nation.currency || 0) < totalCost) return;

    setBuying(market.commodity);
    const updates = {
      currency: Math.max(0, (nation.currency || 0) - totalCost),
      [meta.res]: (nation[meta.res] || 0) + qty,
    };
    await base44.entities.Nation.update(nation.id, updates);
    setAmounts(a => ({ ...a, [market.commodity]: "" }));
    // Update global supply: buying reduces global supply
    await base44.entities.GlobalMarket.update(market.id, {
      global_supply: Math.max(1, (market.global_supply || 1000) - qty),
    });
    setBuying(null);
    onRefresh?.();
  }

  async function sellResource(market) {
    const qty = parseInt(amounts[market.commodity] || 0);
    if (!qty || qty <= 0) return;
    const meta = COMMODITY_META[market.commodity];
    if (!meta?.res) return;
    if ((nation[meta.res] || 0) < qty) return;

    setSelling(market.commodity);
    const revenue = qty * market.current_price * (nation.resource_price_mod || 1);
    const updates = {
      currency: (nation.currency || 0) + revenue,
      [meta.res]: Math.max(0, (nation[meta.res] || 0) - qty),
    };
    await base44.entities.Nation.update(nation.id, updates);
    setAmounts(a => ({ ...a, [market.commodity]: "" }));
    // Update global supply: selling increases supply
    await base44.entities.GlobalMarket.update(market.id, {
      global_supply: (market.global_supply || 1000) + qty,
    });
    setSelling(null);
    onRefresh?.();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 mb-4">
        Live global commodity prices driven by supply &amp; demand across all nations.
        Prices update every 90 seconds. Inflation adjustments apply.
      </div>

      {markets.map(market => {
        const meta    = COMMODITY_META[market.commodity];
        if (!meta) return null;
        const change  = priceChange(market);
        const held    = meta.res ? (nation[meta.res] || 0) : 0;
        const canTrade = !!meta.res;
        const inflPrice = parseFloat((market.current_price * (nation.resource_price_mod || 1)).toFixed(2));
        const qty     = parseInt(amounts[market.commodity] || 0) || 0;
        const buyCost = qty * inflPrice;
        const sellRev = qty * inflPrice;

        return (
          <div key={market.commodity}
            className={`rounded-xl border p-4 transition-all ${market.shortage_active ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/5"}`}>

            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{meta.emoji}</span>
                <div>
                  <div className="font-bold text-white text-sm">{meta.label}</div>
                  {canTrade && <div className="text-xs text-slate-500">In reserve: {held.toLocaleString()}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white ep-mono text-sm">{inflPrice.toFixed(2)} cr</div>
                <div className={`text-xs flex items-center gap-1 justify-end ${change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-slate-500"}`}>
                  {change > 0 ? <TrendingUp size={10} /> : change < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                  {Math.abs(change).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Supply / Demand bar */}
            <div className="flex items-center gap-2 mb-3 text-xs">
              <span className="text-slate-500 w-14">S/D</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (market.global_supply / Math.max(1, market.global_demand)) * 50)}%`,
                    background: market.shortage_active ? "#ef4444" : "#22d3ee",
                  }} />
              </div>
              <span className="text-slate-500">{(market.global_supply / Math.max(1, market.global_demand)).toFixed(2)}×</span>
            </div>

            {/* Shortage warning */}
            {market.shortage_active && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 mb-3">
                <AlertTriangle size={11} />
                Shortage: {market.shortage_reason || "Supply disrupted"}
              </div>
            )}

            {/* Price sparkline */}
            {(market.price_history || []).length > 2 && (
              <div className="flex items-end gap-px h-8 mb-3">
                {market.price_history.slice(-24).map((p, i) => {
                  const max = Math.max(...market.price_history.slice(-24));
                  const min = Math.min(...market.price_history.slice(-24));
                  const pct = max === min ? 50 : ((p - min) / (max - min)) * 100;
                  return (
                    <div key={i} className="flex-1 rounded-sm"
                      style={{ height: `${Math.max(10, pct)}%`, background: change >= 0 ? "rgba(34,211,238,0.5)" : "rgba(248,113,113,0.5)" }} />
                  );
                })}
              </div>
            )}

            {/* Trade controls — only for tradeable commodities */}
            {canTrade && (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  value={amounts[market.commodity] || ""}
                  onChange={e => setAmounts(a => ({ ...a, [market.commodity]: e.target.value }))}
                  placeholder="Qty"
                  className="w-20 ep-input px-2 py-1.5 text-xs rounded-lg text-white placeholder-slate-600"
                />
                <button
                  onClick={() => buyResource(market)}
                  disabled={buying === market.commodity || !qty || (nation.currency || 0) < buyCost}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                >
                  <ShoppingCart size={10} />
                  {buying === market.commodity ? "..." : `Buy${qty > 0 ? ` (${buyCost.toLocaleString(undefined,{maximumFractionDigits:0})} cr)` : ""}`}
                </button>
                <button
                  onClick={() => sellResource(market)}
                  disabled={selling === market.commodity || !qty || held < qty}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                >
                  <DollarSign size={10} />
                  {selling === market.commodity ? "..." : `Sell${qty > 0 ? ` (+${sellRev.toLocaleString(undefined,{maximumFractionDigits:0})} cr)` : ""}`}
                </button>
              </div>
            )}
            {!canTrade && (
              <div className="text-xs text-slate-600 italic">Traded via production chains — not directly holdable yet</div>
            )}
          </div>
        );
      })}
    </div>
  );
}