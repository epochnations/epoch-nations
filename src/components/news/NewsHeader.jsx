import { useState, useEffect } from "react";
import { Wifi, Wind } from "lucide-react";
import { WEATHER_EMOJIS, WEATHER_EFFECTS } from "./NewsEventConfig";

export default function NewsHeader({ nation, weather, edition, breakingEvent }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
  const weatherEmoji = WEATHER_EMOJIS[weather] || "☀️";
  const weatherFx = WEATHER_EFFECTS[weather] || {};

  const breakingTexts = breakingEvent
    ? [`⚡ BREAKING: ${breakingEvent.headline}`, `📍 Severity: ${breakingEvent.severity?.toUpperCase()}`, `🗞 Read full story below`]
    : ["📡 Live National Feed Active", `🌐 ${nation?.name || "..."} Nationwide News Network`, `📰 Edition #${edition}`];

  const breakingText = breakingTexts[tick % breakingTexts.length];

  const stability = nation?.stability || 75;
  const stabilityColor = stability > 70 ? "text-emerald-400" : stability > 40 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-3">
      {/* Breaking ticker */}
      {breakingEvent && (
        <div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 flex items-center gap-3">
          <div className="shrink-0 w-20 text-xs font-black text-red-400 tracking-wider uppercase animate-pulse">BREAKING</div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm text-red-200 font-semibold whitespace-nowrap animate-[marquee_18s_linear_infinite]">
              {breakingEvent.headline} — {breakingEvent.body?.slice(0, 120)}...
            </div>
          </div>
          <Wifi size={14} className="text-red-400 shrink-0 animate-pulse" />
          <style>{`@keyframes marquee { from{transform:translateX(100%)} to{transform:translateX(-200%)} }`}</style>
        </div>
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
            <div className="bg-black/30 rounded-xl px-3 py-2 text-center min-w-[80px]">
              <div className="text-base">{weatherEmoji}</div>
              <div className="text-slate-500">{weather}</div>
              {weatherFx.food !== 0 && <div className={`text-[10px] ${weatherFx.food > 0 ? "text-green-400" : "text-red-400"}`}>{weatherFx.food > 0 ? "+" : ""}{weatherFx.food} food</div>}
            </div>
          </div>
        </div>

        {/* Ticker marquee (non-breaking) */}
        {!breakingEvent && (
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-400 font-mono overflow-hidden">
            <span className="inline-block transition-all duration-700">{breakingText}</span>
          </div>
        )}
      </div>
    </div>
  );
}