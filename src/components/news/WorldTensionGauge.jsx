import { AlertTriangle, Flame } from "lucide-react";

export default function WorldTensionGauge({ wars, nations }) {
  const tension = nations > 0 ? Math.min(100, Math.round((wars / Math.max(nations * 0.5, 1)) * 100)) : 0;
  const level = tension < 25 ? "PEACE" : tension < 50 ? "TENSE" : tension < 75 ? "VOLATILE" : "CRITICAL";
  const color = tension < 25 ? "#22c55e" : tension < 50 ? "#f59e0b" : tension < 75 ? "#f97316" : "#ef4444";
  const textColor = tension < 25 ? "text-green-400" : tension < 50 ? "text-amber-400" : tension < 75 ? "text-orange-400" : "text-red-400";

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
      <Flame size={14} style={{ color }} />
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-widest">World Tension</div>
        <div className={`text-xs font-black ${textColor}`}>{level} · {tension}%</div>
      </div>
      {/* Thermometer */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-2 h-16 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
          <div
            className="w-full rounded-full transition-all duration-1000"
            style={{ height: `${tension}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}