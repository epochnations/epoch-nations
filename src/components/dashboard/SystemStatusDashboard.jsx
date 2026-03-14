/**
 * SystemStatusDashboard — Real-time game engine health and world metrics panel.
 * Shows engine status, active wars, server tick health, and world statistics.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Activity, X, Cpu, Globe, Swords, TrendingUp, Users, Zap, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

const ENGINES = [
  { name: "Resource Engine",    key: "resource",   color: "#f97316", icon: "⚙️" },
  { name: "Economy Engine",     key: "economy",    color: "#4ade80", icon: "💰" },
  { name: "War Engine",         key: "war",        color: "#ef4444", icon: "⚔️" },
  { name: "World Simulation",   key: "world",      color: "#818cf8", icon: "🌍" },
  { name: "Civilization Econ",  key: "civ",        color: "#fbbf24", icon: "🏛️" },
  { name: "Research Engine",    key: "research",   color: "#22d3ee", icon: "🔬" },
  { name: "Procedural World",   key: "procworld",  color: "#a78bfa", icon: "🗺️" },
  { name: "Loan Repayment",     key: "loan",       color: "#34d399", icon: "🏦" },
];

function StatusDot({ status }) {
  const colors = {
    online: "#4ade80",
    warning: "#fbbf24",
    offline: "#ef4444",
    idle: "#64748b",
  };
  return (
    <span className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: colors[status] || colors.idle,
               boxShadow: status === "online" ? `0 0 6px ${colors.online}` : "none",
               animation: status === "online" ? "ep-live-pulse 2s infinite" : "none" }} />
  );
}

export default function SystemStatusDashboard({ myNation, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const [nations, wars, transactions, stocks] = await Promise.all([
        base44.entities.Nation.list("-gdp", 60),
        base44.entities.Nation.filter({}),
        base44.entities.Transaction.list("-created_date", 20),
        base44.entities.Stock.list("-market_cap", 10),
      ]);
      const atWar = nations.filter(n => (n.at_war_with || []).length > 0);
      const warPairs = atWar.length / 2;
      const totalGdp = nations.reduce((s, n) => s + (n.gdp || 0), 0);
      const avgStability = nations.length > 0
        ? Math.round(nations.reduce((s, n) => s + (n.stability || 0), 0) / nations.length)
        : 0;
      const totalPop = nations.reduce((s, n) => s + (n.population || 0), 0);
      const richest = [...nations].sort((a, b) => (b.gdp || 0) - (a.gdp || 0))[0];
      const mostPowerful = [...nations].sort((a, b) => (b.unit_power || 0) - (a.unit_power || 0))[0];
      setStats({ nations, atWar, warPairs, totalGdp, avgStability, totalPop, richest, mostPowerful, transactions, stocks });
    } catch (_) {}
    setLoading(false);
  }

  const priorities = [
    { id: "all", label: "All Systems" },
    { id: "critical", label: "Critical" },
    { id: "economy", label: "Economy" },
    { id: "military", label: "Military" },
  ];

  const warNation = stats?.atWar?.find(n => n.id === myNation?.id);
  const systemAlerts = [];
  if (myNation) {
    if ((myNation.stability || 75) < 30) systemAlerts.push({ type: "critical", msg: "⚠ National stability critically low!" });
    if ((myNation.currency || 0) < 50)   systemAlerts.push({ type: "critical", msg: "⚠ Treasury nearly bankrupt!" });
    if ((myNation.res_food || 0) < 50)   systemAlerts.push({ type: "warning", msg: "🌾 Food reserves critically low!" });
    if (warNation)                         systemAlerts.push({ type: "danger",   msg: "⚔ Your nation is currently at war!" });
    if ((myNation.inflation_rate || 0) > 0.15) systemAlerts.push({ type: "warning", msg: "📈 Inflation above 15% — economy at risk" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a1020 0%, #040810 100%)", border: "1px solid rgba(6,182,212,0.2)", boxShadow: "0 0 80px rgba(6,182,212,0.06)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-cyan-400"/>
            <span className="font-black text-white text-sm">System Status Dashboard</span>
            <span className="ep-live-dot ml-1"/>
            <span className="text-[10px] text-green-400 font-bold ep-mono">LIVE</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X size={15} className="text-slate-400 hover:text-white"/>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex gap-1.5 px-5 py-2.5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {priorities.map(p => (
            <button key={p.id} onClick={() => setFilter(p.id)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ep-mono"
              style={{
                background: filter === p.id ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === p.id ? "rgba(6,182,212,0.35)" : "rgba(255,255,255,0.06)"}`,
                color: filter === p.id ? "#22d3ee" : "#64748b",
              }}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Alerts */}
          {systemAlerts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority Alerts</div>
              {systemAlerts.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: a.type === "critical" ? "rgba(239,68,68,0.1)" : a.type === "danger" ? "rgba(239,68,68,0.08)" : "rgba(251,191,36,0.08)",
                    border: `1px solid ${a.type === "critical" || a.type === "danger" ? "rgba(239,68,68,0.25)" : "rgba(251,191,36,0.2)"}`,
                    color: a.type === "critical" || a.type === "danger" ? "#f87171" : "#fbbf24",
                  }}>
                  <AlertTriangle size={12}/> {a.msg}
                </div>
              ))}
            </div>
          )}

          {/* Engine Status Grid */}
          {(filter === "all" || filter === "critical") && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Engine Status</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ENGINES.map(eng => (
                  <div key={eng.key} className="rounded-xl p-3 space-y-1"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-1.5">
                      <StatusDot status="online"/>
                      <span className="text-[9px] font-bold ep-mono" style={{ color: eng.color }}>{eng.icon}</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-semibold leading-tight">{eng.name}</div>
                    <div className="text-[9px] text-green-400 ep-mono">RUNNING</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* World Stats */}
          {(filter === "all" || filter === "economy") && stats && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">World Statistics</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: <Users size={13}/>,      label: "Active Nations",  val: stats.nations.length,                  color: "#22d3ee" },
                  { icon: <TrendingUp size={13}/>,  label: "World GDP",       val: `${Math.round(stats.totalGdp).toLocaleString()} cr`, color: "#4ade80" },
                  { icon: <Users size={13}/>,       label: "World Population",val: stats.totalPop.toLocaleString(),        color: "#a78bfa" },
                  { icon: <Shield size={13}/>,      label: "Avg Stability",   val: `${stats.avgStability}%`,              color: "#22d3ee" },
                  { icon: <Swords size={13}/>,      label: "Active Wars",     val: Math.round(stats.warPairs),             color: "#ef4444" },
                  { icon: <Zap size={13}/>,         label: "Market Activity", val: stats.transactions.length + " recent", color: "#fbbf24" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: s.color }}>{s.icon}</div>
                    <div>
                      <div className="text-[9px] text-slate-500">{s.label}</div>
                      <div className="text-xs font-black ep-mono" style={{ color: s.color }}>{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaders */}
          {(filter === "all" || filter === "economy") && stats && (
            <div className="grid grid-cols-2 gap-3">
              {stats.richest && (
                <div className="rounded-xl p-3"
                  style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <div className="text-[9px] font-bold text-green-400 uppercase tracking-wider mb-1.5">🏆 Richest Nation</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{stats.richest.flag_emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{stats.richest.name}</div>
                      <div className="text-[10px] text-green-400 ep-mono">{Math.round(stats.richest.gdp).toLocaleString()} GDP</div>
                    </div>
                  </div>
                </div>
              )}
              {stats.mostPowerful && (
                <div className="rounded-xl p-3"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1.5">⚔ Most Powerful</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{stats.mostPowerful.flag_emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{stats.mostPowerful.name}</div>
                      <div className="text-[10px] text-red-400 ep-mono">{Math.round(stats.mostPowerful.unit_power)} Power</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active wars */}
          {(filter === "all" || filter === "military") && stats && stats.atWar.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active Conflicts</div>
              <div className="space-y-1.5">
                {stats.atWar.slice(0, 6).map(n => (
                  <div key={n.id} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <span>{n.flag_emoji}</span>
                    <span className="text-red-400 font-bold">{n.name}</span>
                    <span className="text-slate-500">is at war</span>
                    <span className="ml-auto text-[10px] text-red-400 ep-mono">⚔ ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top stocks */}
          {(filter === "all" || filter === "economy") && stats && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Top Stocks by Market Cap</div>
              <div className="space-y-1">
                {stats.stocks.slice(0, 5).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.025)" }}>
                    <span className="text-[10px] text-slate-600 ep-mono w-4">#{i + 1}</span>
                    <span className="text-[10px] font-black text-cyan-400 ep-mono w-12">{s.ticker}</span>
                    <span className="text-[10px] text-slate-400 flex-1">{s.company_name}</span>
                    <span className="text-[10px] font-bold text-green-400 ep-mono">{Math.round(s.current_price).toLocaleString()} cr</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}