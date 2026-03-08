import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StockTicker({ onSelectStock }) {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    loadStocks();
    const unsub = base44.entities.Stock.subscribe(() => loadStocks());
    return unsub;
  }, []);

  async function loadStocks() {
    const data = await base44.entities.Stock.list("-market_cap", 50);
    setStocks(data);
  }

  function trend(stock) {
    const hist = stock.price_history || [];
    if (hist.length < 2) return 0;
    return hist[hist.length - 1] - hist[hist.length - 2];
  }

  function pctChange(stock) {
    const hist = stock.price_history || [];
    if (hist.length < 2 || hist[hist.length - 2] === 0) return 0;
    return ((hist[hist.length - 1] - hist[hist.length - 2]) / hist[hist.length - 2]) * 100;
  }

  // Mini sparkline as inline SVG
  function Sparkline({ history, color }) {
    if (!history || history.length < 2) return null;
    const w = 48, h = 18;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const pts = history.map((v, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(" ");
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(16,185,129,0.05) 0%, rgba(4,8,16,0.97) 60%)",
        border: "1px solid rgba(16,185,129,0.14)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0 flex items-center gap-2"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(90deg, rgba(16,185,129,0.1) 0%, rgba(4,8,16,0) 100%)" }}>
        <span className="ep-live-dot" />
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ep-mono">Market Feed</span>
        <span className="ml-auto text-[10px] text-slate-600 ep-mono">{stocks.length} listed</span>
      </div>

      {/* Stock list */}
      <div className="flex-1 overflow-y-auto divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
        {stocks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-slate-600 text-xs ep-mono">No stocks listed</div>
        )}
        {stocks.map(stock => {
          const delta = trend(stock);
          const pct = pctChange(stock);
          const isUp = delta > 0;
          const isDown = delta < 0;
          const color = isUp ? "#4ade80" : isDown ? "#f87171" : "#94a3b8";
          const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
          const hist = (stock.price_history || []).slice(-12);

          return (
            <div
              key={stock.id}
              className="px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-all duration-150 hover:bg-white/5"
              onClick={() => onSelectStock?.(stock)}
            >
              {/* Ticker badge */}
              <div className="shrink-0 w-10 text-center rounded-lg px-1 py-0.5"
                style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                <span className="text-[9px] font-black ep-mono" style={{ color }}>{stock.ticker}</span>
              </div>

              {/* Name + nation */}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-white truncate leading-tight">{stock.company_name}</div>
                <div className="text-[10px] text-slate-500 truncate ep-mono">{stock.nation_name} · {stock.sector}</div>
              </div>

              {/* Sparkline */}
              <Sparkline history={hist} color={color} />

              {/* Price + change */}
              <div className="shrink-0 text-right">
                <div className="text-[13px] font-black ep-mono" style={{ color }}>
                  {(stock.current_price || 0).toFixed(2)}
                </div>
                <div className="flex items-center justify-end gap-0.5">
                  <Icon size={9} style={{ color }} />
                  <span className="text-[10px] font-bold ep-mono" style={{ color }}>
                    {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}