import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Sword, TrendingUp, Cpu, Users, Clock } from "lucide-react";
import { EPOCHS, EPOCH_COLOR, EPOCH_EMOJI } from "../game/EpochConfig";
import { formatGameTime, TICK_MS, TICKS_PER_DAY } from "../game/GameClock";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function NationDetailModal({ nation, allNations, buildings, tradeRoutes, transactions, onClose }) {
  const epochColor = EPOCH_COLOR[nation.epoch] || "#94a3b8";
  const joinDate = new Date(nation.created_date);
  const joinStr = joinDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const joinTime = joinDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Timeline events
  const timeline = buildTimeline(nation, transactions, joinDate);

  // Rank in each category
  const ranks = buildRanks(nation, allNations);

  // Building breakdown
  const buildingTypes = {};
  buildings.forEach(b => {
    if (!b.is_destroyed) buildingTypes[b.building_type] = (buildingTypes[b.building_type] || 0) + 1;
  });

  // War history
  const warsStarted = transactions.filter(t => t.type === "war_attack" && t.from_nation_id === nation.id);
  const warsReceived = transactions.filter(t => t.type === "war_attack" && t.to_nation_id === nation.id);

  // Epoch progression chart
  const epochProgressData = EPOCHS.slice(0, EPOCHS.indexOf(nation.epoch) + 1).map((ep, i) => ({
    epoch: ep.replace(" Age", ""),
    techPoints: nation.tech_points ? Math.round(nation.tech_points * (i + 1) / (EPOCHS.indexOf(nation.epoch) + 1)) : i * 50,
  }));

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d1424 0%, #040810 100%)", border: `1px solid ${epochColor}30`, boxShadow: `0 0 80px ${epochColor}10` }}>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}>
          <span className="text-3xl">{nation.flag_emoji || "🏴"}</span>
          <div className="flex-1">
            <div className="font-black text-white text-lg">{nation.name}</div>
            <div className="text-xs text-slate-400">Led by {nation.leader} · {nation.government_type}</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold ep-mono" style={{ color: epochColor }}>{EPOCH_EMOJI[nation.epoch]} {nation.epoch}</div>
            <div className="text-[10px] text-slate-600 ep-mono">Founded {joinStr}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Stat grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: "GDP", val: (nation.gdp || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }), color: "#22d3ee" },
                { label: "Wealth", val: (nation.national_wealth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }), color: "#fbbf24" },
                { label: "Population", val: (nation.population || 0).toLocaleString(), color: "#4ade80" },
                { label: "Stability", val: `${nation.stability || 0}%`, color: "#34d399" },
                { label: "Defense", val: nation.defense_level || 0, color: "#818cf8" },
                { label: "Unit Power", val: nation.unit_power || 0, color: "#f87171" },
                { label: "Techs", val: nation.techCount, color: "#a78bfa" },
                { label: "Buildings", val: nation.buildingCount, color: "#fb923c" },
                { label: "Trade Routes", val: nation.tradeCount, color: "#34d399" },
                { label: "Allies", val: nation.allyCount, color: "#4ade80" },
                { label: "Kills", val: nation.kills, color: "#f87171" },
                { label: "Deaths", val: nation.deaths, color: "#94a3b8" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                  <div className="font-black text-sm ep-mono" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Global ranks */}
            <div>
              <div className="text-[10px] text-slate-500 ep-mono font-bold mb-2">GLOBAL RANKINGS</div>
              <div className="flex flex-wrap gap-2">
                {ranks.map(r => (
                  <div key={r.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-xs">{r.icon}</span>
                    <span className="text-[10px] text-slate-400">{r.label}</span>
                    <span className="text-[10px] font-black text-white ep-mono">#{r.rank}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Epoch progression chart */}
            {epochProgressData.length > 1 && (
              <div className="rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="text-[10px] text-slate-500 ep-mono font-bold mb-3">EPOCH PROGRESSION TIMELINE</div>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={epochProgressData}>
                    <XAxis dataKey="epoch" tick={{ fontSize: 9, fill: "#475569" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#475569" }} />
                    <Tooltip contentStyle={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="techPoints" stroke={epochColor} fill={epochColor + "20"} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Buildings breakdown */}
            {Object.keys(buildingTypes).length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 ep-mono font-bold mb-2">INFRASTRUCTURE ({buildings.filter(b => !b.is_destroyed).length} ACTIVE)</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(buildingTypes).map(([type, count]) => (
                    <div key={type} className="px-2.5 py-1 rounded-lg text-[10px] ep-mono"
                      style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)", color: "#fb923c" }}>
                      {type} ×{count}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technology list */}
            {(nation.unlocked_techs || []).length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 ep-mono font-bold mb-2">TECHNOLOGIES ({(nation.unlocked_techs || []).length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {(nation.unlocked_techs || []).map(tech => (
                    <span key={tech} className="text-[10px] px-2 py-0.5 rounded-lg ep-mono"
                      style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8" }}>
                      {tech.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Full timeline */}
            <div>
              <div className="text-[10px] text-slate-500 ep-mono font-bold mb-3">NATIONAL TIMELINE</div>
              <div className="relative pl-4 space-y-3">
                <div className="absolute left-1 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                {buildTimeline(nation, transactions, joinDate).map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1 -ml-[3px]" style={{ background: m.color || "#475569" }} />
                    <div>
                      <div className="text-[9px] text-slate-600 ep-mono">{m.date}</div>
                      <div className="text-xs text-slate-300">{m.label}</div>
                    </div>
                  </div>
                ))}
                {buildTimeline(nation, transactions, joinDate).length === 0 && (
                  <div className="text-xs text-slate-600 ep-mono pl-3">No recorded events yet.</div>
                )}
              </div>
            </div>

            {/* Nation description / constitution */}
            {nation.nation_description && (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[10px] text-slate-500 ep-mono font-bold mb-2">NATIONAL DESCRIPTION</div>
                <div className="text-xs text-slate-400 leading-relaxed">{nation.nation_description}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function buildTimeline(nation, transactions, joinDate) {
  const events = [
    { date: joinDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), label: `${nation.name} was founded under ${nation.government_type}`, color: "#4ade80", ts: joinDate.getTime() },
  ];

  transactions.forEach(t => {
    const d = new Date(t.created_date);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (t.type === "war_attack" && t.from_nation_id === nation.id) {
      events.push({ date: dateStr, label: `Launched military attack on ${t.to_nation_name || "enemy nation"}`, color: "#f87171", ts: d.getTime() });
    } else if (t.type === "war_attack" && t.to_nation_id === nation.id) {
      events.push({ date: dateStr, label: `Attacked by ${t.from_nation_name || "unknown"}`, color: "#fb923c", ts: d.getTime() });
    } else if (t.type === "tech_unlock" && t.from_nation_id === nation.id) {
      events.push({ date: dateStr, label: `Technology unlocked: ${t.description || "advancement"}`, color: "#818cf8", ts: d.getTime() });
    } else if (t.type === "lend_lease") {
      if (t.from_nation_id === nation.id) events.push({ date: dateStr, label: `Sent aid to ${t.to_nation_name}`, color: "#4ade80", ts: d.getTime() });
      else if (t.to_nation_id === nation.id) events.push({ date: dateStr, label: `Received aid from ${t.from_nation_name}`, color: "#22d3ee", ts: d.getTime() });
    } else if (t.type === "market_crash" && t.from_nation_id === nation.id) {
      events.push({ date: dateStr, label: "Suffered a market crash", color: "#f87171", ts: d.getTime() });
    }
  });

  return events.sort((a, b) => a.ts - b.ts);
}

function buildRanks(nation, allNations) {
  function rankOf(sortFn) {
    const sorted = [...allNations].sort(sortFn);
    return sorted.findIndex(n => n.id === nation.id) + 1;
  }
  return [
    { label: "GDP", icon: "💹", rank: rankOf((a, b) => (b.gdp || 0) - (a.gdp || 0)) },
    { label: "Wealth", icon: "💰", rank: rankOf((a, b) => (b.national_wealth || 0) - (a.national_wealth || 0)) },
    { label: "Population", icon: "👥", rank: rankOf((a, b) => (b.population || 0) - (a.population || 0)) },
    { label: "Techs", icon: "🔬", rank: rankOf((a, b) => b.techCount - a.techCount) },
    { label: "Military", icon: "⚔️", rank: rankOf((a, b) => ((b.unit_power || 0) + (b.defense_level || 0)) - ((a.unit_power || 0) + (a.defense_level || 0))) },
    { label: "Kills", icon: "💀", rank: rankOf((a, b) => b.kills - a.kills) },
  ];
}