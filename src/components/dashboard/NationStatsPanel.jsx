import { useState, useEffect, useRef } from "react";
import { TrendingUp, Shield, Users, Zap, DollarSign, Handshake, AlertTriangle } from "lucide-react";
import StatTooltip from "../ui/StatTooltip";
import { EPOCH_COLOR, EPOCH_EMOJI, EPOCHS } from "../game/EpochConfig";

function StatBar({ value, max = 100, color = "#22d3ee" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 6px ${color}66` }}
      />
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color = "text-cyan-400", barColor = "#22d3ee", suffix = "", tooltip = "", max }) {
  const [flash, setFlash] = useState(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(value > prevRef.current ? "up" : "down");
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 1400);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Icon size={11} className={color} />
          <span className="tracking-wide">{label}</span>
          {tooltip && <StatTooltip text={tooltip} />}
        </div>
        <div
          className={`text-sm ep-mono font-bold ${color} transition-all duration-300 px-1.5 py-0.5 rounded-lg`}
          style={{
            background: flash === "up" ? "rgba(74,222,128,0.1)" : flash === "down" ? "rgba(248,113,113,0.1)" : "transparent",
            boxShadow: flash === "up" ? "0 0 12px rgba(74,222,128,0.4)" : flash === "down" ? "0 0 12px rgba(248,113,113,0.4)" : "none",
          }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </div>
      </div>
      {max !== undefined && (
        <StatBar value={typeof value === "number" ? value : 0} max={max} color={barColor} />
      )}
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
  const epochColor = EPOCH_COLOR[nation.epoch] || "#3b82f6";
  const income = Math.floor(nation.gdp * 0.05);
  const spending = Math.round(((nation.education_spending || 20) + (nation.military_spending || 20)) * 0.5);

  return (
    <div className="ep-card h-full overflow-y-auto flex flex-col gap-0" style={{ background: "linear-gradient(160deg, rgba(6,182,212,0.04) 0%, rgba(4,8,16,0.95) 60%)" }}>
      {/* Nation Header */}
      <div className="p-5 pb-4 border-b border-white/8">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${epochColor}22, ${epochColor}08)`,
                border: `1.5px solid ${epochColor}44`,
                boxShadow: `0 0 20px ${epochColor}22, inset 0 1px 0 rgba(255,255,255,0.1)`
              }}
            >
              {nation.flag_image_url
                ? <img src={nation.flag_image_url} alt="flag" className="w-full h-full object-cover" />
                : <span>{nation.flag_emoji || "🏴"}</span>
              }
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#040810]"
              style={{ boxShadow: "0 0 6px rgba(74,222,128,0.7)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-black text-white text-base truncate tracking-tight">{nation.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">Leader: <span className="text-slate-300">{nation.leader}</span></div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{
                  background: `linear-gradient(90deg, ${epochColor}30, ${epochColor}15)`,
                  border: `1px solid ${epochColor}44`,
                  color: epochColor
                }}
              >
                {EPOCH_EMOJI[nation.epoch]} {nation.epoch}
              </span>
              {nation.at_war_with?.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
                  ⚔ AT WAR
                </span>
              )}
            </div>
          </div>
        </div>

        {/* GDP / Treasury quick stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Treasury", value: `${(nation.currency||0).toLocaleString()} cr`, color: "#4ade80", icon: "💰" },
            { label: "GDP", value: `${(nation.gdp||0).toLocaleString()}`, color: "#22d3ee", icon: "📈" },
          ].map(s => (
            <div key={s.label}
              className="rounded-xl p-2.5"
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}22` }}>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                <span>{s.icon}</span>{s.label}
              </div>
              <div className="ep-mono font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Stats */}
      <div className="px-5 py-1">
        <StatRow icon={Shield} label="Stability" value={Math.round(nation.stability || 0)} color="text-blue-400" barColor="#60a5fa" suffix="%" max={100} tooltip="National cohesion (0–100). Wars and bad policy reduce it." />
        <StatRow icon={Users} label="Population" value={nation.population} color="text-violet-400" barColor="#a78bfa" max={nation.housing_capacity || 20} tooltip="Total citizens. Grows with food surplus and housing." />
        <StatRow icon={Zap} label="Tech Points" value={nation.tech_points} color="text-yellow-400" barColor="#facc15" suffix=" TP" tooltip="Spend TP to unlock technologies and advance epochs." />
        <StatRow icon={TrendingUp} label="Unit Power" value={nation.unit_power} color="text-orange-400" barColor="#fb923c" max={200} tooltip="Military strength." />
      </div>

      {/* Resources */}
      <div className="mx-5 mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Natural Resources</span>
          <span className="text-[10px] text-slate-600 ep-mono">{EPOCH_EMOJI[nation.epoch]} Era</span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/5">
          {[
            { label: "Wood",  value: nation.res_wood,  color: "#f59e0b", emoji: "🌲" },
            { label: "Stone", value: nation.res_stone, color: "#94a3b8", emoji: "⛏" },
            { label: "Gold",  value: nation.res_gold,  color: "#facc15", emoji: "🥇" },
            { label: "Iron",  value: nation.res_iron,  color: "#60a5fa", emoji: "⚙️" },
            { label: "Oil",   value: nation.res_oil,   color: "#9ca3af", emoji: "🛢️" },
            { label: "Food",  value: nation.res_food,  color: "#4ade80", emoji: "🌾" },
          ].map(r => (
            <div key={r.label} className="flex flex-col items-center py-2.5 px-1 bg-[#040810]">
              <span className="text-base leading-none mb-1">{r.emoji}</span>
              <span className="text-[9px] text-slate-600 leading-none mb-1 uppercase tracking-wider">{r.label}</span>
              <span className="ep-mono font-bold text-xs leading-none" style={{ color: r.color }}>
                {(r.value || 0) >= 1000 ? `${((r.value||0)/1000).toFixed(1)}k` : (r.value || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Level bar */}
      <div className="mx-5 mb-3 rounded-xl p-3" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.18)" }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Tech Level</span>
          <span className="ep-mono text-violet-400 font-bold text-xs">Lv.{nation.tech_level}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-500"
              style={{
                background: i < (nation.tech_level || 1)
                  ? `linear-gradient(90deg, #7c3aed, #a78bfa)`
                  : "rgba(255,255,255,0.06)",
                boxShadow: i < (nation.tech_level || 1) ? "0 0 6px rgba(139,92,246,0.5)" : "none"
              }}
            />
          ))}
        </div>
        <div className="text-[10px] text-slate-600 mt-1.5 ep-mono">{nation.epoch} · {nation.tech_points} TP banked</div>
      </div>

      {/* Allies */}
      <div className="mx-5 mb-3 rounded-xl p-3 flex items-center justify-between"
        style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)" }}>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Handshake size={12} className="text-blue-400" /> Allies
        </div>
        <span className="ep-mono text-blue-400 font-bold text-sm">{nation.allies?.length || 0}</span>
      </div>

      {/* Food / Population */}
      <div className="mx-5 mb-3 rounded-xl p-3" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.14)" }}>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Population Status</div>
        <div className="space-y-1.5">
          {[
            { label: "Food Production", value: `+${totalFoodProd}/min`, color: "text-green-400" },
            { label: "Food Consumption", value: `-${foodCons}/min`, color: "text-red-400" },
            { label: "Net Food", value: `${netFood >= 0 ? "+" : ""}${netFood}/min`, color: netFood >= 0 ? "text-green-400" : "text-red-400" },
            { label: "Housing", value: `${pop} / ${nation.housing_capacity || 20}`, color: "text-violet-400" },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-xs">
              <span className="text-slate-500">{r.label}</span>
              <span className={`ep-mono font-bold ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </div>
        {netFood < 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 font-bold bg-red-500/10 rounded-lg px-2.5 py-1.5 border border-red-500/25">
            <AlertTriangle size={10} /> FAMINE RISK — Assign more farmers!
          </div>
        )}
      </div>

      {/* Nation Index */}
      <div className="mx-5 mb-5 rounded-xl p-3" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(4,8,16,0.95) 100%)", border: "1px solid rgba(6,182,212,0.2)" }}>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Nation Stock Index</div>
        <div className="ep-mono font-black text-xl" style={{ color: "#22d3ee", textShadow: "0 0 20px rgba(34,211,238,0.4)" }}>
          {stockValue.toFixed(2)} <span className="text-xs font-normal text-slate-500">per unit</span>
        </div>
        <div className="flex gap-3 mt-1 text-[10px] text-slate-500 ep-mono">
          <span>+{income} cr/min <span className="text-green-400">↑</span></span>
          <span>−{spending} cr/min <span className="text-red-400">↓</span></span>
        </div>
      </div>

      {/* Crash / War banners */}
      {nation.is_in_market_crash && (
        <div className="mx-5 mb-3 rounded-xl p-3 border border-red-500/40 bg-red-500/10">
          <div className="text-xs font-bold text-red-400">⚠ MARKET CRASH ACTIVE</div>
          <div className="text-xs text-red-300/60 mt-0.5">Recovery in {nation.crash_turns_remaining} turns</div>
        </div>
      )}
    </div>
  );
}