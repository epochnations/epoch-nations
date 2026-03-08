import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function StockTicker({ onSelectStock }) {
  const [stocks, setStocks] = useState([]);
  const [flashMap, setFlashMap] = useState({});
  const debounceRef = useRef(null);

  useEffect(() => {
    loadStocks();
    const unsub = base44.entities.Stock.subscribe((ev) => {
      if (ev.type === "update" && ev.data) {
        setStocks(prev => {
          const old = prev.find(s => s.id === ev.id);
          if (old && ev.data.current_price !== old.current_price) {
            const dir = ev.data.current_price > old.current_price ? "up" : "down";
            setFlashMap(f => ({ ...f, [ev.id]: dir }));
            setTimeout(() => setFlashMap(f => { const n = {...f}; delete n[ev.id]; return n; }), 1500);
          }
          return prev.map(s => s.id === ev.id ? ev.data : s);
        });
      } else {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadStocks(), 2000);
      }
    });
    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function loadStocks() {
    const data = await base44.entities.Stock.list("-updated_date", 50);
    setStocks(data);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(160deg, rgba(4,8,16,0.97) 0%, rgba(6,182,212,0.03) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)"
      }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/6 flex items-center gap-2 shrink-0"
        style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.08) 0%, transparent 100%)" }}>
        <Activity size={13} className="text-cyan-400" />
        <span className="text-xs font-black text-slate-200 tracking-widest uppercase">Market Feed</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="ep-live-dot" />
          <span className="text-[10px] text-green-400 font-bold ep-mono">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {stocks.length === 0 ? (
          <div className="p-8 text-center text-slate-600 text-xs ep-mono">No stocks listed</div>
        ) : (
          <div className="divide-y divide-white/4">
            {stocks.map((stock) => {
              const history = stock.price_history || [];
              const prev = history.length > 1 ? history[history.length - 2] : stock.base_price;
              const change = stock.current_price - prev;
              const changePct = prev > 0 ? (change / prev) * 100 : 0;
              const isUp = change >= 0;
              const flash = flashMap[stock.id];
              const miniHistory = history.slice(-8);

              return (
                <button
                  key={stock.id}
                  onClick={() => onSelectStock?.(stock)}
                  className="w-full px-3.5 py-3 flex items-center gap-2.5 text-left transition-all duration-200 group"
                  style={{
                    background: flash === "up"
                      ? "rgba(74,222,128,0.06)"
                      : flash === "down"
                      ? "rgba(248,113,113,0.06)"
                      : "transparent"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Ticker badge */}
                  <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black ep-mono"
                    style={{
                      background: `linear-gradient(135deg, ${stock.is_crashed ? "#ef444422" : isUp ? "#4ade8014" : "#f8717114"}, rgba(255,255,255,0.03))`,
                      border: `1px solid ${stock.is_crashed ? "#ef444440" : isUp ? "#4ade8030" : "#f8717130"}`,
                      color: stock.is_crashed ? "#ef4444" : isUp ? "#4ade80" : "#f87171"
                    }}>
                    {stock.ticker?.substring(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <span className="text-xs font-black text-white ep-mono shrink-0">{stock.ticker}</span>
                      {stock.is_crashed && (
                        <span className="shrink-0 px-1 py-0.5 rounded text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30">CRASH</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-0.5">{stock.nation_name} · {stock.sector}</div>

                    {/* Mini sparkline */}
                    {miniHistory.length > 2 && (
                      <svg width="50" height="12" className="mt-1 opacity-60">
                        {miniHistory.map((p, i) => {
                          if (i === 0) return null;
                          const min = Math.min(...miniHistory);
                          const max = Math.max(...miniHistory);
                          const range = max - min || 1;
                          const x1 = ((i - 1) / (miniHistory.length - 1)) * 50;
                          const x2 = (i / (miniHistory.length - 1)) * 50;
                          const y1 = 12 - ((miniHistory[i-1] - min) / range) * 10;
                          const y2 = 12 - ((p - min) / range) * 10;
                          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={isUp ? "#4ade80" : "#f87171"} strokeWidth="1.2"
                            strokeLinecap="round" />;
                        })}
                      </svg>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-sm ep-mono font-black transition-all duration-300 ${
                      flash === "up" ? "text-green-300" : flash === "down" ? "text-red-300" : "text-white"
                    }`}
                      style={{ textShadow: flash === "up" ? "0 0 12px rgba(74,222,128,0.7)" : flash === "down" ? "0 0 12px rgba(248,113,113,0.7)" : "none" }}>
                      {stock.current_price?.toFixed(2)}
                    </div>
                    <div className={`text-[10px] ep-mono flex items-center gap-0.5 justify-end ${isUp ? "text-green-400" : "text-red-400"}`}>
                      {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {isUp ? "+" : ""}{changePct.toFixed(1)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}