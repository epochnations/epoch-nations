import { useState, useEffect, useRef } from "react";
import { TrendingUp, Shield, Users, Zap, DollarSign, Factory, BookOpen } from "lucide-react";
import StatTooltip from "../ui/StatTooltip";

const EPOCH_COLORS = {
  Industrial: "from-amber-500 to-orange-600",
  Information: "from-cyan-500 to-blue-600",
  Nano: "from-violet-500 to-purple-600"
};

const EPOCH_ICONS = {
  Industrial: "⚙️",
  Information: "💻",
  Nano: "🔬"
};

function StatRow({ icon: Icon, label, value, color = "text-cyan-400", suffix = "", tooltip = "" }) {
  const [flash, setFlash] = useState(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      const dir = value > prevRef.current ? "up" : "down";
      setFlash(dir);
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 1200);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <Icon size={12} className={color} />
        {label}
        {tooltip && <StatTooltip text={tooltip} />}
      </div>
      <div
        className={`text-sm font-mono font-bold ${color} transition-all duration-300 rounded px-1`}
        style={{
          boxShadow: flash === "up" ? "0 0 8px 2px rgba(34,197,94,0.5)" : flash === "down" ? "0 0 8px 2px rgba(239,68,68,0.5)" : "none",
          background: flash === "up" ? "rgba(34,197,94,0.08)" : flash === "down" ? "rgba(239,68,68,0.08)" : "transparent"
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}{suffix}
      </div>
    </div>
  );
}

export default function NationStatsPanel({ nation }) {
  if (!nation) return null;

  const stockValue = (nation.gdp + nation.stability) * nation.public_trust;

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 h-full">
      {/* Nation Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: (nation.flag_color || "#3b82f6") + "33" }}
        >
          {nation.flag_emoji || "🏴"}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-base truncate">{nation.name}</div>
          <div className="text-xs text-slate-400">Leader: {nation.leader}</div>
        </div>
        <div className={`ml-auto shrink-0 px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${EPOCH_COLORS[nation.epoch]} text-white`}>
          {EPOCH_ICONS[nation.epoch]} {nation.epoch}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-0">
        <StatRow icon={DollarSign} label="Treasury" value={nation.currency} color="text-green-400" suffix=" cr" tooltip="Your liquid reserve. Spent on tech, wars, and policies. Earned through GDP and budget cycles." />
        <StatRow icon={TrendingUp} label="GDP" value={nation.gdp} color="text-cyan-400" tooltip="Gross Domestic Product: total economic output. Higher GDP grows your treasury faster each cycle." />
        <StatRow icon={Shield} label="Stability" value={nation.stability} color="text-blue-400" suffix="%" tooltip="National cohesion (0–100). Low stability causes unrest. Wars and bad policy choices reduce it." />
        <StatRow icon={Users} label="Public Trust" value={(nation.public_trust * 100).toFixed(0)} color="text-violet-400" suffix="%" tooltip="Citizen confidence multiplier. Affects your stock index. Falls under martial law or poor decisions." />
        <StatRow icon={Factory} label="Manufacturing" value={nation.manufacturing} color="text-orange-400" suffix="%" tooltip="Industrial output capacity. Boosts GDP growth. Damaged by critical war strikes." />
        <StatRow icon={Zap} label="Tech Level" value={nation.tech_level} color="text-yellow-400" suffix={` (${nation.tech_points} TP)`} tooltip="Tech Points (TP) come from education spending. Spend TP to unlock technologies and advance epochs." />
        <StatRow icon={BookOpen} label="Edu. Spending" value={nation.education_spending} color="text-emerald-400" suffix="%" tooltip="% of budget on education. Generates ~0.5 TP per % per cycle. Higher = faster tech progression." />
      </div>

      {/* Tech Level Indicator */}
      <div className="mt-4 rounded-xl p-3 bg-violet-500/5 border border-violet-500/20">
        <div className="text-xs text-slate-500 mb-2 flex justify-between">
          <span>TECH LEVEL</span>
          <span className="text-violet-400 font-mono font-bold">Lv.{nation.tech_level}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(10, Math.max(1, nation.tech_level)) }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-violet-400" />
          ))}
          {Array.from({ length: Math.max(0, 10 - (nation.tech_level || 1)) }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-white/10" />
          ))}
        </div>
        <div className="text-xs text-slate-600 mt-1">{nation.epoch} Era · {nation.tech_points} TP banked</div>
      </div>

      {/* Stock Value */}
      <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: "#0f172a" }}>
        <div className="text-xs text-slate-500 mb-1">NATION STOCK INDEX</div>
        <div className="text-xl font-mono font-black text-cyan-300">
          {stockValue.toFixed(2)} <span className="text-xs font-normal text-slate-400">per unit</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Income: <span className="text-green-400">+{Math.floor(nation.gdp * 0.05)} cr/min</span>
        </div>
      </div>

      {/* War / Crash Status */}
      {nation.is_in_market_crash && (
        <div className="mt-3 rounded-xl p-3 bg-red-500/10 border border-red-500/30">
          <div className="text-xs font-bold text-red-400">⚠ MARKET CRASH ACTIVE</div>
          <div className="text-xs text-red-300/70 mt-1">Stocks devalued · Recovery in {nation.crash_turns_remaining} turns</div>
        </div>
      )}
      {nation.at_war_with?.length > 0 && (
        <div className="mt-3 rounded-xl p-3 bg-orange-500/10 border border-orange-500/30">
          <div className="text-xs font-bold text-orange-400">⚔ AT WAR</div>
          <div className="text-xs text-orange-300/70 mt-1">Conflicts: {nation.at_war_with.length}</div>
        </div>
      )}
    </div>
  );
}