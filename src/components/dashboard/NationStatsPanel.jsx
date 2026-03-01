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

function StatRow({ icon: Icon, label, value, color = "text-cyan-400", suffix = "" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <Icon size={12} className={color} />
        {label}
      </div>
      <div className={`text-sm font-mono font-bold ${color}`}>
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
        <StatRow icon={DollarSign} label="Treasury" value={nation.currency} color="text-green-400" suffix=" cr" />
        <StatRow icon={TrendingUp} label="GDP" value={nation.gdp} color="text-cyan-400" suffix="" />
        <StatRow icon={Shield} label="Stability" value={nation.stability} color="text-blue-400" suffix="%" />
        <StatRow icon={Users} label="Public Trust" value={(nation.public_trust * 100).toFixed(0)} color="text-violet-400" suffix="%" />
        <StatRow icon={Factory} label="Manufacturing" value={nation.manufacturing} color="text-orange-400" suffix="%" />
        <StatRow icon={Zap} label="Tech Level" value={nation.tech_level} color="text-yellow-400" suffix={` (${nation.tech_points} TP)`} />
        <StatRow icon={BookOpen} label="Edu. Spending" value={nation.education_spending} color="text-emerald-400" suffix="%" />
      </div>

      {/* Stock Value */}
      <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: "#0f172a" }}>
        <div className="text-xs text-slate-500 mb-1">NATION STOCK INDEX</div>
        <div className="text-xl font-mono font-black text-cyan-300">
          {stockValue.toFixed(2)} <span className="text-xs font-normal text-slate-400">per unit</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          ({nation.gdp} GDP + {nation.stability} Stability) × {nation.public_trust.toFixed(2)} trust
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