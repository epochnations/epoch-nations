/**
 * CitizenStatsPanel — Shows citizen vitals (happiness, health, hunger, energy, savings).
 */
const BAR_COLORS = {
  happiness: "#f59e0b",
  health:    "#4ade80",
  hunger:    "#f97316",
  energy:    "#60a5fa",
};

function StatBar({ label, value, color, emoji }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] text-slate-400">{emoji} {label}</span>
        <span className="text-[13px] font-bold ep-mono" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/08 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  );
}

export default function CitizenStatsPanel({ citizen, nation, netIncome }) {
  if (!citizen) return null;
  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
      {/* Identity */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
          👤
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white text-base truncate">{citizen.display_name}</div>
          <div className="text-[13px] text-slate-500 truncate">{citizen.job}</div>
          {nation && <div className="text-xs text-amber-400">{nation.flag_emoji} {nation.name}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-500">Savings</div>
          <div className="text-base font-black text-amber-400 ep-mono">{(citizen.savings || 0).toLocaleString()}</div>
          <div className="text-xs" style={{ color: netIncome >= 0 ? "#4ade80" : "#f87171" }}>
            {netIncome >= 0 ? "+" : ""}{netIncome}/tick
          </div>
        </div>
      </div>

      {/* Vitals */}
      <div className="space-y-2">
        <StatBar label="Happiness" value={citizen.happiness || 75} color="#f59e0b" emoji="😊" />
        <StatBar label="Health"    value={citizen.health    || 100} color="#4ade80" emoji="❤️" />
        <StatBar label="Hunger"    value={citizen.hunger    || 100} color="#f97316" emoji="🍖" />
        <StatBar label="Energy"    value={citizen.energy    || 100} color="#60a5fa" emoji="⚡" />
      </div>

      {/* Skills */}
      <div>
        <div className="text-xs text-slate-600 uppercase tracking-wider font-bold mb-2">Skills (Level {citizen.level || 1})</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(citizen.skills || {}).map(([skill, lvl]) => (
            <div key={skill} className="px-2 py-0.5 rounded-lg text-xs font-bold ep-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
              {skill} {lvl}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}