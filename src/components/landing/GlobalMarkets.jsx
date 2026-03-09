import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

const COMMODITIES = [
  { key: "res_oil",   label: "OIL",      unit: "$",  basePrice: 80,  color: "#fb923c", emoji: "🛢️" },
  { key: "res_iron",  label: "STEEL",    unit: "$",  basePrice: 220, color: "#94a3b8", emoji: "⚙️" },
  { key: "res_food",  label: "FOOD",     unit: "$",  basePrice: 110, color: "#4ade80", emoji: "🌾" },
  { key: "res_gold",  label: "GOLD",     unit: "$",  basePrice: 1820,color: "#fbbf24", emoji: "🥇" },
  { key: "res_wood",  label: "TIMBER",   unit: "$",  basePrice: 65,  color: "#84cc16", emoji: "🪵" },
  { key: "res_stone", label: "MINERALS", unit: "$",  basePrice: 45,  color: "#64748b", emoji: "💎" },
];

function sparkData(seed, points = 12) {
  let h = seed;
  return Array.from({ length: points }, (_, i) => {
    h = (h * 31 + i * 7) & 0xffff;
    return { v: 50 + (h % 50) };
  });
}

export default function GlobalMarkets() {
  const [nations, setNations] = useState([]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    load();
    const unsub = base44.entities.Nation.subscribe(() => load());
    return unsub;
  }, []);

  async function load() {
    try {
      const data = await base44.entities.Nation.list("-gdp", 50);
      setNations(data);

      // Calculate aggregate supply/demand per resource → affects price
      const aggregates = {};
      COMMODITIES.forEach(c => {
        const total = data.reduce((sum, n) => sum + (n[c.key] || 0), 0);
        const avg = total / Math.max(data.length, 1);
        aggregates[c.key] = avg;
      });

      const computed = {};
      COMMODITIES.forEach(c => {
        const avg = aggregates[c.key] || 0;
        // High supply = lower price; low supply = higher price
        const supplyFactor = avg > 100 ? 0.92 : avg < 30 ? 1.12 : 1;
        const noise = (Math.sin(Date.now() / 100000 + c.basePrice) + 1) * 0.03;
        const price = Math.round(c.basePrice * supplyFactor * (1 + noise));
        const change = ((supplyFactor - 1 + noise) * 100).toFixed(1);
        computed[c.key] = { price, change: parseFloat(change) };
      });
      setPrices(computed);
    } catch {}
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/08"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(4,8,16,0.95) 100%)" }}>
      <div className="px-4 py-3 border-b border-white/08 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-white tracking-widest">⚡ GLOBAL MARKETS</span>
        </div>
        <span className="text-[10px] text-slate-600 ep-mono">live pricing</span>
      </div>

      <div className="divide-y divide-white/04">
        {COMMODITIES.map(c => {
          const p = prices[c.key] || { price: c.basePrice, change: 0 };
          const up = p.change >= 0;
          const seed = c.basePrice + Math.floor(Date.now() / 300000);
          const spark = sparkData(seed);

          return (
            <div key={c.key} className="px-4 py-3 flex items-center gap-4">
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg">
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-black ep-mono text-white tracking-wider">{c.label}</span>
                  <span className="text-[10px] text-slate-600 ep-mono">{c.unit}{p.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-bold ep-mono" style={{ color: up ? "#4ade80" : "#f87171" }}>
                    {up ? "▲" : "▼"} {Math.abs(p.change)}%
                  </span>
                </div>
              </div>
              {/* Sparkline */}
              <div className="w-20 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spark}>
                    <Line type="monotone" dataKey="v" stroke={up ? "#4ade80" : "#f87171"}
                      strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2.5 text-[9px] text-slate-700 ep-mono border-t border-white/05">
        Prices driven by global supply aggregated from {nations.length} active nations.
      </div>
    </div>
  );
}