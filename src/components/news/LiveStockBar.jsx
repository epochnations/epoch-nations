import { TrendingUp, TrendingDown } from "lucide-react";

export default function LiveStockBar({ stocks }) {
  const top5 = stocks.slice(0, 8);
  if (top5.length === 0) return null;

  const items = [...top5, ...top5]; // duplicate for infinite scroll effect

  return (
    <div className="w-full bg-black border-b border-white/10 overflow-hidden relative h-9 flex items-center">
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 flex items-center justify-center bg-black border-r border-white/10">
        <span className="text-xs font-black text-cyan-400 tracking-widest uppercase">LIVE</span>
        <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>
      <div className="ml-20 flex items-center animate-[scroll_30s_linear_infinite] whitespace-nowrap">
        {items.map((stock, i) => {
          const history = stock.price_history || [];
          const prev = history.length > 1 ? history[history.length - 2] : stock.base_price;
          const change = stock.current_price - prev;
          const changePct = prev > 0 ? (change / prev) * 100 : 0;
          const isUp = change >= 0;
          return (
            <span key={`${stock.id}-${i}`} className="flex items-center gap-2 px-5 border-r border-white/10">
              <span className="font-mono font-black text-white text-xs">{stock.ticker}</span>
              <span className="font-mono text-xs text-slate-300">{stock.current_price?.toFixed(2)}</span>
              <span className={`flex items-center gap-0.5 text-xs font-mono ${isUp ? "text-green-400" : "text-red-400"}`}>
                {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {isUp ? "+" : ""}{changePct.toFixed(1)}%
              </span>
            </span>
          );
        })}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}