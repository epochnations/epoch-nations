import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown } from "lucide-react";

function Sparkline({ history = [], color }) {
  if (history.length < 2) return null;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const W = 48, H = 20;
  const pts = history.slice(-10).map((v, i, arr) => {
    const x = (i / (arr.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

export default function StockTicker({ onSelectStock }) {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    base44.entities.Stock.list("-current_price", 40).then(setStocks);
    const unsub = base44.entities.Stock.subscribe(() => {
      base44.entities.Stock.list("-current_price", 40).then(setStocks);
    });
    return unsub;
  }, []);

  return (
    <div className="h-full rounded-2xl flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, rgba(16,185,129,0.05) 0%, rgba(4,8,16,0.98) 60%)", border: "1px solid rgba(16,185,129,0.12)", backdropFilter: "blur(20px)" }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 shrink-0"
        style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.1) 0%, rgba(4,8,16,0.6) 100%)" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-green-400" />
          <span className="text-[10px] font-black text-white tracking-widest uppercase ep-mono">Live Markets</span>
          <span className="ep-live-dot ml-auto" />
        </div>
      </div>

      {/* Stock List */}
      <div className="flex-1 overflow-y-auto">
        {stocks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs ep-mono">No stocks listed</div>
        ) : stocks.map(stock => {
          const hist = stock.price_history || [];
          const prev = hist.length >= 2 ? hist[hist.length - 2] : stock.base_price;
          const curr = stock.current_price || stock.base_price;
          const pct = prev ? ((curr - prev) / prev * 100) : 0;
          const up = pct >= 0;
          const color = stock.is_crashed ? "#f87171" : up ? "#4ade80" : "#f87171";

          return (
            <button
              key={stock.id}
              onClick={() => onSelectStock?.(stock)}
              className="w-full flex items-center gap-2 px-3 py-2.5 border-b transition-all text-left hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              {/* Ticker + name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black ep-mono text-white">{stock.ticker}</span>
                  {stock.is_crashed && (
                    <span className="text-[8px] font-bold px-1 rounded" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>CRASH</span>
                  )}
                </div>
                <div className="text-[9px] text-slate-600 truncate">{stock.company_name}</div>
              </div>

              {/* Sparkline */}
              <Sparkline history={hist} color={color} />

              {/* Price */}
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold ep-mono" style={{ color }}>₵{curr.toFixed(1)}</div>
                <div className={`text-[9px] font-bold ep-mono flex items-center justify-end gap-0.5`} style={{ color }}>
                  {up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                  {up ? "+" : ""}{pct.toFixed(1)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}