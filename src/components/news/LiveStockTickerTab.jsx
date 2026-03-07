import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function LiveStockTickerTab() {
  const [stocks, setStocks] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadStocks();
    const unsub = base44.entities.Stock.subscribe(() => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(loadStocks, 2000);
    });
    return () => { unsub(); clearTimeout(debounceRef.current); };
  }, []);

  async function loadStocks() {
    const data = await base44.entities.Stock.list("-updated_date", 50);
    setStocks(data);
  }

  const items = stocks.length > 0 ? [...stocks, ...stocks, ...stocks] : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080c14]/90 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-green-900/20">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-black text-green-400 tracking-widest uppercase">Live Global Stock Feed</span>
        <span className="ml-auto text-[10px] text-slate-500">{stocks.length} listed stocks</span>
      </div>

      {/* Scrolling ticker */}
      {stocks.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">No stocks listed yet.</div>
      ) : (
        <div className="relative overflow-hidden bg-black/40" style={{ height: "48px" }}>
          {/* LIVE badge */}
          <div className="absolute left-0 top-0 bottom-0 w-16 z-10 flex items-center justify-center bg-black border-r border-white/10 shrink-0">
            <span className="text-[10px] font-black text-green-400 tracking-widest">LIVE</span>
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div
            className="ml-16 flex items-center h-full whitespace-nowrap"
            style={{ animation: `tickerScroll ${Math.max(20, items.length * 4)}s linear infinite` }}
          >
            {items.map((stock, i) => {
              const history = stock.price_history || [];
              const prev = history.length > 1 ? history[history.length - 2] : stock.base_price;
              const change = stock.current_price - prev;
              const changePct = prev > 0 ? (change / prev) * 100 : 0;
              const isUp = change >= 0;
              return (
                <span key={`${stock.id}-${i}`} className="inline-flex items-center gap-2 px-5 border-r border-white/10 h-full">
                  <span className="font-mono font-black text-white text-xs">{stock.ticker}</span>
                  <span className="font-mono text-xs text-slate-300">{stock.current_price?.toFixed(2)}</span>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-mono ${isUp ? "text-green-400" : "text-red-400"}`}>
                    {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {isUp ? "+" : ""}{changePct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-600">{stock.nation_name}</span>
                </span>
              );
            })}
          </div>
          <style>{`
            @keyframes tickerScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-33.333%); }
            }
          `}</style>
        </div>
      )}

      {/* Full grid of stocks below ticker */}
      <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
        {stocks.map(stock => {
          const history = stock.price_history || [];
          const prev = history.length > 1 ? history[history.length - 2] : stock.base_price;
          const change = stock.current_price - prev;
          const changePct = prev > 0 ? (change / prev) * 100 : 0;
          const isUp = change >= 0;
          return (
            <div key={stock.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-slate-300">{stock.ticker?.substring(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">{stock.ticker}</div>
                <div className="text-[10px] text-slate-500 truncate">{stock.nation_name} · {stock.sector}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono font-bold text-white">{stock.current_price?.toFixed(2)}</div>
                <div className={`text-xs font-mono flex items-center gap-0.5 justify-end ${isUp ? "text-green-400" : "text-red-400"}`}>
                  {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {isUp ? "+" : ""}{changePct.toFixed(1)}%
                </div>
              </div>
              {stock.is_crashed && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 shrink-0">CRASH</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}