import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

function durationStr(startedAt) {
  if (!startedAt) return "Unknown duration";
  const s = Math.floor((Date.now() - new Date(startedAt)) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function ActiveConflicts() {
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    load();
    const unsub = base44.entities.Nation.subscribe(() => load());
    return unsub;
  }, []);

  async function load() {
    try {
      const nations = await base44.entities.Nation.list("-gdp", 50);
      const seen = new Set();
      const wars = [];
      nations.forEach(n => {
        (n.at_war_with || []).forEach(enemyName => {
          const key = [n.name, enemyName].sort().join("|");
          if (seen.has(key)) return;
          seen.add(key);
          const enemy = nations.find(x => x.name === enemyName);
          wars.push({
            key,
            a: { name: n.name, flag: n.flag_emoji, color: n.flag_color, power: n.unit_power, gdp: n.gdp },
            b: { name: enemyName, flag: enemy?.flag_emoji || "🏴", color: enemy?.flag_color || "#64748b", power: enemy?.unit_power || 0, gdp: enemy?.gdp || 0 },
            startedAt: n.war_started_at || n.created_date,
          });
        });
      });
      setConflicts(wars);
    } catch {}
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-red-500/15"
      style={{ background: "linear-gradient(135deg, rgba(248,113,113,0.04) 0%, rgba(4,8,16,0.97) 100%)" }}>
      <div className="px-4 py-3 border-b border-red-500/15 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" style={{ animation: "ep-live-pulse 1.5s ease-in-out infinite" }} />
          <span className="text-[11px] font-black text-red-400 tracking-widest">⚔️ ACTIVE CONFLICTS</span>
        </div>
        <span className="text-[10px] text-slate-600 ep-mono">{conflicts.length} active wars</span>
      </div>

      {conflicts.length === 0 && (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">🕊️</div>
          <div className="text-[11px] text-slate-600 ep-mono">No active conflicts · World at peace</div>
        </div>
      )}

      <div className="divide-y divide-white/05">
        {conflicts.map(c => {
          const totalPower = (c.a.power || 0) + (c.b.power || 0);
          const aShare = totalPower > 0 ? Math.round(((c.a.power || 0) / totalPower) * 100) : 50;

          return (
            <div key={c.key} className="px-4 py-4">
              {/* Duration + intensity */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] ep-mono text-slate-600">WAR · {durationStr(c.startedAt)}</span>
                <span className="text-[9px] ep-mono text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                  ACTIVE CONFLICT
                </span>
              </div>

              {/* Nations */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xl">{c.a.flag}</span>
                  <div>
                    <div className="text-[11px] font-bold text-white leading-none">{c.a.name}</div>
                    <div className="text-[9px] ep-mono mt-0.5" style={{ color: c.a.color }}>PWR {c.a.power}</div>
                  </div>
                </div>
                <div className="text-[11px] font-black text-red-500">VS</div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-white leading-none">{c.b.name}</div>
                    <div className="text-[9px] ep-mono mt-0.5" style={{ color: c.b.color }}>PWR {c.b.power}</div>
                  </div>
                  <span className="text-xl">{c.b.flag}</span>
                </div>
              </div>

              {/* Power bar */}
              <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-white/10">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${aShare}%`, background: `linear-gradient(90deg, ${c.a.color || "#f87171"}, ${c.b.color || "#64748b"})` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] ep-mono text-slate-600">{aShare}% advantage</span>
                <span className="text-[8px] ep-mono text-slate-600">{100 - aShare}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}