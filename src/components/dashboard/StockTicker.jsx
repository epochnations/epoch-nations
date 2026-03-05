import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StockTicker({ onSelectStock }) {
  const [stocks, setStocks] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadStocks();
    const unsub = base44.entities.Stock.subscribe(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => loadStocks(), 2000);
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
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Global Exchange · Live</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {stocks.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No stocks listed yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {stocks.map((stock) => {
              const history = stock.price_history || [];
              const prev = history.length > 1 ? history[history.length - 2] : stock.base_price;
              const change = stock.current_price - prev;
              const changePct = prev > 0 ? (change / prev) * 100 : 0;
              const isUp = change >= 0;

              return (
                <button
                  key={stock.id}
                  onClick={() => onSelectStock?.(stock)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="text-xs font-black text-slate-300">{stock.ticker?.substring(0, 2)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{stock.ticker}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[120px]">{stock.nation_name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-white">{stock.current_price?.toFixed(2)}</div>
                    <div className={`text-xs font-mono flex items-center gap-1 justify-end ${isUp ? "text-green-400" : "text-red-400"}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isUp ? "+" : ""}{changePct.toFixed(1)}%
                    </div>
                  </div>

                  {stock.is_crashed && (
                    <div className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">CRASH</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}