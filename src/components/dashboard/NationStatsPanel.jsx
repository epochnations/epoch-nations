import { useState, useEffect, useRef } from "react";
import { TrendingUp, Shield, Users, Zap, DollarSign, Handshake } from "lucide-react";
import StatTooltip from "../ui/StatTooltip";
import { EPOCH_COLOR, EPOCH_EMOJI, EPOCHS } from "../game/EpochConfig";

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
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const techMult = 1 + epochIndex * 0.08;
  const pop = nation.population || 1;
  const farmFood = Math.floor((nation.workers_farmers || 0) * 8 * techMult);
  const huntFood = Math.floor((nation.workers_hunters || 0) * 5 * techMult);
  const fishFood = Math.floor((nation.workers_fishermen || 0) * 6 * techMult);
  const totalFoodProd = farmFood + huntFood + fishFood;
  const foodCons = Math.ceil(pop * 1.2);
  const netFood = totalFoodProd - foodCons;

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 h-full overflow-y-auto">
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
        <div className="ml-auto shrink-0 px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: (EPOCH_COLOR[nation.epoch] || "#3b82f6") + "44", border: `1px solid ${EPOCH_COLOR[nation.epoch] || "#3b82f6"}66` }}>
          {EPOCH_EMOJI[nation.epoch]} {nation.epoch}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-0">
        <StatRow icon={DollarSign} label="Treasury" value={nation.currency} color="text-green-400" tooltip="Your liquid reserve. Spent on tech, wars, and policies." />
        <StatRow icon={TrendingUp} label="GDP" value={nation.gdp} color="text-cyan-400" tooltip="Total economic output. Higher GDP grows treasury faster." />
        <StatRow icon={Shield} label="Stability" value={nation.stability} color="text-blue-400" suffix="%" tooltip="National cohesion (0–100). Wars and bad policy reduce it." />
        <StatRow icon={Users} label="Population" value={nation.population} color="text-violet-400" tooltip="Total citizens. Grows with food surplus and housing." />
        <StatRow icon={Zap} label="Tech Level" value={nation.tech_level} color="text-yellow-400" suffix={` (${nation.tech_points} TP)`} tooltip="Spend TP to unlock technologies and advance epochs." />
      </div>

      {/* Resources — 2×3 grid, no scroll */}
      <div className="mt-4 rounded-xl p-3 bg-white/3 border border-white/10">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Natural Resources</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "Wood", value: nation.res_wood, color: "text-amber-500", emoji: "🪵" },
            { label: "Stone", value: nation.res_stone, color: "text-slate-400", emoji: "🪨" },
            { label: "Gold", value: nation.res_gold, color: "text-yellow-400", emoji: "🥇" },
            { label: "Iron", value: nation.res_iron, color: "text-blue-400", emoji: "⚙️" },
            { label: "Oil", value: nation.res_oil, color: "text-gray-400", emoji: "🛢️" },
            { label: "Food", value: nation.res_food, color: "text-green-400", emoji: "🌾" },
          ].map(r => (
            <div key={r.label} className="flex flex-col items-center py-2 px-1 rounded-lg bg-white/5">
              <span className="text-sm leading-none mb-0.5">{r.emoji}</span>
              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase tracking-wide">{r.label}</span>
              <span className={`text-xs font-mono font-bold ${r.color} leading-none`}>{(r.value || 0) >= 1000 ? `${((r.value||0)/1000).toFixed(1)}k` : (r.value || 0)}</span>
            </div>
          ))}
        </div>
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

      {/* Ally count — below Tech Level */}
      <div className="mt-3 rounded-xl p-3 bg-blue-500/5 border border-blue-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Handshake size={12} className="text-blue-400" />
          Allies
        </div>
        <span className="text-blue-400 font-bold font-mono text-sm">{nation.allies?.length || 0}</span>
      </div>

      {/* Food / Population status */}
      <div className="mt-3 rounded-xl p-3 bg-green-500/5 border border-green-500/20">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Population Status</div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Food Production</span>
            <span className="text-green-400 font-mono font-bold">+{totalFoodProd}/min</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Food Consumption</span>
            <span className="text-red-400 font-mono font-bold">−{foodCons}/min</span>
          </div>
          <div className="border-t border-white/10 pt-1.5 flex justify-between text-xs">
            <span className="text-slate-400">Net Food</span>
            <span className={`font-mono font-bold ${netFood >= 0 ? "text-green-400" : "text-red-400"}`}>
              {netFood >= 0 ? "+" : ""}{netFood}/min
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Housing Cap</span>
            <span className="text-violet-400 font-mono">{pop} / {nation.housing_capacity || 20}</span>
          </div>
          {netFood < 0 && (
            <div className="text-xs text-red-400 font-bold bg-red-500/10 rounded-lg px-2 py-1 mt-1">
              ⚠ FAMINE RISK — Assign more farmers!
            </div>
          )}
          {netFood >= 0 && pop < (nation.housing_capacity || 20) && (
            <div className="text-xs text-green-400 bg-green-500/10 rounded-lg px-2 py-1 mt-1">
              ✓ Growing — food surplus & housing available
            </div>
          )}
          {pop >= (nation.housing_capacity || 20) && (
            <div className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1 mt-1">
              🏠 Housing full — build more to grow
            </div>
          )}
        </div>
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