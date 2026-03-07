import { useState, useEffect } from "react";
import { Wifi, TrendingUp, TrendingDown } from "lucide-react";
import { WEATHER_EMOJIS, WEATHER_EFFECTS } from "./NewsEventConfig";
import { base44 } from "@/api/base44Client";

export default function NewsHeader({ nation, weather, edition, breakingEvent, onClickBreaking, onClickStock }) {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    base44.entities.Stock.list("-updated_date", 40).then(setStocks);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
  const weatherEmoji = WEATHER_EMOJIS[weather] || "☀️";
  const weatherFx = WEATHER_EFFECTS[weather] || {};

  const stability = nation?.stability || 75;
  const stabilityColor = stability > 70 ? "text-emerald-400" : stability > 40 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-3">
      {/* Breaking ticker */}
      {breakingEvent && (
        <button
          onClick={() => onClickBreaking && onClickBreaking(breakingEvent)}
          className="w-full relative overflow-hidden rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/20 hover:border-red-500/60 transition-all group cursor-pointer"
        >
          <div className="shrink-0 w-20 text-xs font-black text-red-400 tracking-wider uppercase animate-pulse text-left">BREAKING</div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm text-red-200 font-semibold whitespace-nowrap animate-[marquee_32s_linear_infinite]">
              {breakingEvent.headline} — {breakingEvent.body?.slice(0, 120)}...
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-bold text-red-300 border border-red-500/40 rounded-lg px-2 py-0.5 group-hover:bg-red-500/20 transition-all whitespace-nowrap">READ &amp; RESPOND →</span>
          <Wifi size={14} className="text-red-400 shrink-0 animate-pulse" />
          <style>{`@keyframes marquee { from{transform:translateX(100%)} to{transform:translateX(-200%)} }`}</style>
        </button>
      )}

      {/* Main header card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Flag + name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-3xl overflow-hidden"
              style={{ backgroundColor: (nation?.flag_color || "#3b82f6") + "33", border: `2px solid ${nation?.flag_color || "#3b82f6"}55` }}>
              {nation?.flag_image_url
                ? <img src={nation.flag_image_url} alt="flag" className="w-full h-full object-cover" />
                : <span>{nation?.flag_emoji || "🏴"}</span>}
            </div>
            <div className="min-w-0">
              <div className="text-xl font-black text-white truncate">{nation?.name || "..."} <span className="text-slate-400 text-sm font-normal">Nationwide News</span></div>
              <div className="text-xs text-slate-500">{dateStr} · {timeStr} · Edition #{edition}</div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-3 text-xs shrink-0">
            <div className="bg-black/30 rounded-xl px-3 py-2 text-center min-w-[70px]">
              <div className={`font-mono font-black text-base ${stabilityColor}`}>{Math.round(stability)}%</div>
              <div className="text-slate-500">Stability</div>
            </div>
            <div className="bg-black/30 rounded-xl px-3 py-2 text-center min-w-[70px]">
              <div className="font-mono font-black text-base text-violet-400">{(nation?.population || 0).toLocaleString()}</div>
              <div className="text-slate-500">Population</div>
            </div>
            <div className="bg-black/30 rounded-xl px-3 py-2 text-center min-w-[70px]">
              <div className="font-mono font-black text-base text-green-400">{(nation?.currency || 0).toLocaleString()}</div>
              <div className="text-slate-500">Treasury</div>
            </div>
            <div className="bg-black/30 rounded-xl px-3 py-2 text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1">
                <span className="text-base leading-none">{weatherEmoji}</span>
                <span className="text-slate-300 text-sm font-bold leading-none">{weather}</span>
              </div>
              {weatherFx.food !== 0 && <div className={`text-[10px] mt-0.5 ${weatherFx.food > 0 ? "text-green-400" : "text-red-400"}`}>{weatherFx.food > 0 ? "+" : ""}{weatherFx.food} food</div>}
              {!weatherFx.food && <div className="text-[10px] text-slate-500 mt-0.5">No impact</div>}
            </div>
          </div>
        </div>

        {/* Live stock ticker strip */}
        {stocks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 relative overflow-hidden h-7 flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-14 z-10 flex items-center gap-1 bg-[#080c14]/80">
              <span className="text-[9px] font-black text-green-400 tracking-widest">LIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div
              className="ml-14 flex items-center whitespace-nowrap"
              style={{ animation: `headerTickerScroll ${Math.max(25, stocks.length * 5)}s linear infinite` }}
            >
              {[...stocks, ...stocks].map((stock, i) => {
                const history = stock.price_history || [];
                const prev = history.length > 1 ? history[history.length - 2] : stock.base_price;
                const change = stock.current_price - prev;
                const changePct = prev > 0 ? (change / prev) * 100 : 0;
                const isUp = change >= 0;
                return (
                  <button
                    key={`${stock.id}-${i}`}
                    onClick={() => onClickStock && onClickStock(stock)}
                    className="inline-flex items-center gap-1.5 px-4 border-r border-white/10 h-7 hover:bg-white/10 transition-colors shrink-0"
                  >
                    <span className="font-mono font-black text-white text-[11px]">{stock.ticker}</span>
                    <span className="font-mono text-[11px] text-slate-300">{stock.current_price?.toFixed(2)}</span>
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono ${isUp ? "text-green-400" : "text-red-400"}`}>
                      {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {isUp ? "+" : ""}{changePct.toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>
            <style>{`@keyframes headerTickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}