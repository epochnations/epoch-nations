import { EPOCH_COLOR, EPOCH_EMOJI } from "../game/EpochConfig";
import { getGameTime, TICK_MS, TICKS_PER_DAY } from "../game/GameClock";
import { Building2, Sword, TrendingUp, Users, Cpu } from "lucide-react";

export default function NationHistoryCard({ nation, rank, buildings, tradeRoutes, transactions, onClick }) {
  const epochColor = EPOCH_COLOR[nation.epoch] || "#94a3b8";
  const joinDate = new Date(nation.created_date);
  const joinStr = joinDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Timeline milestones derived from transactions + join date
  const milestones = buildMilestones(nation, transactions, joinDate);

  return (
    <button onClick={onClick}
      className="w-full text-left rounded-2xl border p-4 transition-all hover:scale-[1.002] group space-y-3"
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-6 text-center shrink-0">
          <span className="text-[10px] font-black text-slate-600 ep-mono">#{rank}</span>
        </div>
        <span className="text-2xl">{nation.flag_emoji || "🏴"}</span>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white text-sm group-hover:text-amber-300 transition-colors">{nation.name}</div>
          <div className="text-[10px] text-slate-500 ep-mono">{nation.leader} · {nation.government_type}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] ep-mono font-bold" style={{ color: epochColor }}>
            {EPOCH_EMOJI[nation.epoch]} {nation.epoch}
          </div>
          <div className="text-[9px] text-slate-600 ep-mono">Founded {joinStr}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {[
          { icon: "💹", label: "GDP", val: (nation.gdp || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) },
          { icon: "👥", label: "Pop", val: nation.population || 0 },
          { icon: <Building2 size={11} />, label: "Buildings", val: nation.buildingCount },
          { icon: "🤝", label: "Allies", val: nation.allyCount },
          { icon: <Sword size={11} />, label: "Kills", val: nation.kills, color: "#4ade80" },
          { icon: "💀", label: "Deaths", val: nation.deaths, color: "#f87171" },
          { icon: <Cpu size={11} />, label: "Techs", val: nation.techCount },
          { icon: "📅", label: "Age", val: `${nation.gameDaysAlive}d` },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-2 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-0.5" style={{ color: s.color || "#94a3b8" }}>
              {typeof s.icon === "string" ? s.icon : s.icon}
            </div>
            <div className="font-bold text-white text-xs ep-mono" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[9px] text-slate-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mini timeline */}
      {milestones.length > 0 && (
        <div className="space-y-1 mt-1">
          <div className="text-[9px] text-slate-600 ep-mono font-bold">KEY MILESTONES</div>
          <div className="flex flex-col gap-1 max-h-28 overflow-hidden">
            {milestones.slice(0, 4).map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: m.color || "#475569" }} />
                <span className="text-slate-600 ep-mono shrink-0">{m.date}</span>
                <span className="text-slate-400 truncate">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[9px] text-slate-700 ep-mono text-right">Click to view full history →</div>
    </button>
  );
}

function buildMilestones(nation, transactions, joinDate) {
  const milestones = [
    { date: joinDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), label: `${nation.name} was founded`, color: "#4ade80" },
  ];
  const warTx = transactions.filter(t => t.type === "war_attack").slice(0, 2);
  warTx.forEach(t => {
    const d = new Date(t.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (t.from_nation_id === nation.id) milestones.push({ date: d, label: `Attacked ${t.to_nation_name || "a nation"}`, color: "#f87171" });
    else milestones.push({ date: d, label: `Attacked by ${t.from_nation_name || "unknown"}`, color: "#fb923c" });
  });
  const techTx = transactions.filter(t => t.type === "tech_unlock").slice(0, 1);
  techTx.forEach(t => {
    const d = new Date(t.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    milestones.push({ date: d, label: `Unlocked tech: ${t.description || "breakthrough"}`, color: "#818cf8" });
  });
  return milestones.sort((a, b) => new Date(a.date) - new Date(b.date));
}