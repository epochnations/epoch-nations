import { Shield } from "lucide-react";

const EPOCH_COLORS = {
  Industrial: { from: "from-amber-500", to: "to-orange-600", glow: "shadow-amber-500/20" },
  Information: { from: "from-cyan-500", to: "to-blue-600", glow: "shadow-cyan-500/20" },
  Nano: { from: "from-violet-500", to: "to-purple-600", glow: "shadow-violet-500/20" },
};

export default function IdentityHeader({ nation, theme }) {
  if (!nation) return null;
  const stockValue = ((nation.gdp + nation.stability) * nation.public_trust).toFixed(2);
  const epochColor = EPOCH_COLORS[nation.epoch] || EPOCH_COLORS.Industrial;

  return (
    <div className={`rounded-2xl border ${theme.border} ${theme.bg} p-6`}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
        {/* Flag */}
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-2xl ${epochColor.glow}`}
          style={{ backgroundColor: (nation.flag_color || "#3b82f6") + "33", border: `2px solid ${nation.flag_color || "#3b82f6"}55` }}
        >
          {nation.flag_emoji || "🏴"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-3xl font-black text-white">{nation.name}</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${epochColor.from} ${epochColor.to} text-white`}>
              {nation.epoch} Era
            </div>
          </div>
          <div className="text-slate-400 text-sm mb-3">Led by <span className="text-white font-semibold">{nation.leader}</span> · Tech Level {nation.tech_level}</div>

          {/* Stability Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Shield size={10} />
                <span>National Stability</span>
              </div>
              <span className="text-xs font-mono font-bold text-white">{nation.stability}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${nation.stability}%`,
                  background: nation.stability > 70 ? "linear-gradient(to right, #22c55e, #16a34a)" : nation.stability > 40 ? "linear-gradient(to right, #f59e0b, #d97706)" : "linear-gradient(to right, #ef4444, #dc2626)"
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {[
            { label: "Treasury", value: `${(nation.currency || 0).toLocaleString()} cr`, color: "text-green-400" },
            { label: "GDP", value: nation.gdp?.toLocaleString(), color: "text-cyan-400" },
            { label: "Public Trust", value: `${((nation.public_trust || 1) * 100).toFixed(0)}%`, color: "text-violet-400" },
            { label: "Stock Index", value: stockValue, color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="bg-black/30 rounded-xl p-3 text-center min-w-[90px]">
              <div className={`text-lg font-mono font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}