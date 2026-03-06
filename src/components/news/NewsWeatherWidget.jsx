import { WEATHER_EMOJIS, WEATHER_TYPES, WEATHER_EFFECTS } from "./NewsEventConfig";

export default function NewsWeatherWidget({ weather }) {
  const emoji = WEATHER_EMOJIS[weather] || "☀️";
  const fx = WEATHER_EFFECTS[weather] || {};

  const impacts = Object.entries(fx)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), val: v }));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">🌦 Weather Report</div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-4xl">{emoji}</div>
        <div>
          <div className="font-black text-white text-base">{weather}</div>
          <div className="text-xs text-slate-500">Today's conditions</div>
        </div>
      </div>
      <div className="space-y-1">
        {impacts.map(({ label, val }) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-slate-400">{label}</span>
            <span className={val > 0 ? "text-emerald-400 font-mono" : "text-red-400 font-mono"}>
              {val > 0 ? "+" : ""}{val}
            </span>
          </div>
        ))}
        {impacts.length === 0 && <div className="text-xs text-slate-500">No significant impact today.</div>}
      </div>
    </div>
  );
}