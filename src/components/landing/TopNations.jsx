import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "gdp",        label: "Economy",    color: "#22d3ee", key: "gdp",         icon: "💰" },
  { id: "military",   label: "Military",   color: "#f87171", key: "unit_power",  icon: "⚔️" },
  { id: "tech",       label: "Technology", color: "#818cf8", key: "tech_level",  icon: "🔬" },
  { id: "stability",  label: "Stability",  color: "#4ade80", key: "stability",   icon: "🏛️" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function TopNations() {
  const [nations, setNations] = useState([]);
  const [category, setCategory] = useState("gdp");

  useEffect(() => {
    load();
    const unsub = base44.entities.Nation.subscribe(() => load());
    return unsub;
  }, []);

  async function load() {
    try {
      const data = await base44.entities.Nation.list("-gdp", 50);
      setNations(data);
    } catch {}
  }

  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const sorted = [...nations].sort((a, b) => (b[cat.key] || 0) - (a[cat.key] || 0)).slice(0, 10);
  const maxVal = sorted[0]?.[cat.key] || 1;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/08"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(4,8,16,0.95) 100%)" }}>
      <div className="px-4 py-3 border-b border-white/08 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        <span className="text-[11px] font-black text-white tracking-widest">🏆 NATION RANKINGS</span>
        <span className="text-[10px] text-slate-600 ep-mono">{nations.length} nations</span>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-white/05">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className="flex-1 py-2.5 text-[9px] font-bold ep-mono tracking-wider transition-all"
            style={{
              color: category === c.id ? c.color : "#475569",
              background: category === c.id ? `${c.color}10` : "transparent",
              borderBottom: category === c.id ? `2px solid ${c.color}` : "2px solid transparent",
            }}>
            {c.icon} {c.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="divide-y divide-white/04">
        {sorted.map((n, i) => {
          const val = n[cat.key] || 0;
          const pct = Math.round((val / maxVal) * 100);
          const isTop3 = i < 3;
          const atWar = (n.at_war_with || []).length > 0;

          return (
            <div key={n.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
              <div className="shrink-0 w-6 text-center">
                {isTop3 ? (
                  <span className="text-base">{MEDALS[i]}</span>
                ) : (
                  <span className="text-[11px] text-slate-600 ep-mono font-bold">#{i + 1}</span>
                )}
              </div>

              <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base"
                style={{ background: `${n.flag_color || "#64748b"}20` }}>
                {n.flag_emoji || "🏴"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-bold text-white leading-none truncate">{n.name}</span>
                  {atWar && <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 shrink-0">⚔️ WAR</span>}
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: cat.color, opacity: 0.7 }} />
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-[12px] font-black ep-mono" style={{ color: cat.color }}>
                  {val?.toLocaleString()}
                </div>
                <div className="text-[8px] text-slate-700 ep-mono">{cat.id === "stability" ? "%" : cat.id === "tech" ? "lvl" : ""}</div>
              </div>
            </div>
          );
        })}
      </div>

      {!sorted.length && (
        <div className="text-center py-8 text-slate-600 text-sm ep-mono">No nations found.</div>
      )}
    </div>
  );
}