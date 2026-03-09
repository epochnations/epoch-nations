import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Simple SVG world map visualization showing nation dots and connections
export default function LiveWorldMap() {
  const [nations, setNations] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    load();
    const unsub = base44.entities.Nation.subscribe(() => load());
    return unsub;
  }, []);

  async function load() {
    try {
      const data = await base44.entities.Nation.list("-gdp", 40);
      setNations(data);
      const atWar = [];
      data.forEach(n => {
        (n.at_war_with || []).forEach(enemy => {
          const key = [n.name, enemy].sort().join("|");
          if (!atWar.find(c => c.key === key)) {
            atWar.push({ key, a: n.name, b: enemy, aColor: n.flag_color || "#64748b" });
          }
        });
      });
      setConflicts(atWar);
    } catch {}
  }

  // Deterministic position from nation name
  function nationPos(nation) {
    let h1 = 0, h2 = 0;
    for (const c of (nation.name || "X")) {
      h1 = (h1 * 31 + c.charCodeAt(0)) & 0xffff;
      h2 = (h2 * 17 + c.charCodeAt(0) * 3) & 0xffff;
    }
    return {
      x: 8 + (h1 % 84),   // 8–92%
      y: 12 + (h2 % 76),  // 12–88%
    };
  }

  const positions = {};
  nations.forEach(n => { positions[n.name] = nationPos(n); });

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "linear-gradient(135deg, #040810 0%, #060c18 100%)", minHeight: 380 }}>
      {/* Decorative header */}
      <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center gap-2 z-20"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-black text-cyan-400 ep-mono tracking-widest">LIVE WORLD MAP</span>
        <span className="ml-auto text-[10px] text-slate-600 ep-mono">{nations.length} nations · {conflicts.length} conflicts</span>
      </div>

      {/* SVG canvas */}
      <svg viewBox="0 0 100 100" className="w-full" style={{ height: 380, marginTop: 36 }}
        preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[20, 40, 60, 80].map(v => (
          <g key={v}>
            <line x1={v} y1={0} x2={v} y2={100} stroke="rgba(6,182,212,0.04)" strokeWidth="0.2" />
            <line x1={0} y1={v} x2={100} y2={v} stroke="rgba(6,182,212,0.04)" strokeWidth="0.2" />
          </g>
        ))}

        {/* Alliance connections */}
        {nations.map(n => (
          (n.allies || []).map(allyName => {
            const aPos = positions[n.name];
            const bPos = Object.entries(positions).find(([name]) => name === allyName)?.[1];
            if (!aPos || !bPos) return null;
            return (
              <line key={`${n.id}-${allyName}`}
                x1={aPos.x} y1={aPos.y - 3.5} x2={bPos.x} y2={bPos.y - 3.5}
                stroke="#4ade80" strokeWidth="0.3" strokeOpacity="0.3" strokeDasharray="0.8,1.2" />
            );
          })
        ))}

        {/* War connections */}
        {nations.map(n => (
          (n.at_war_with || []).map(enemyName => {
            const aPos = positions[n.name];
            const bPos = Object.entries(positions).find(([name]) => name === enemyName)?.[1];
            if (!aPos || !bPos) return null;
            return (
              <line key={`war-${n.id}-${enemyName}`}
                x1={aPos.x} y1={aPos.y - 3.5} x2={bPos.x} y2={bPos.y - 3.5}
                stroke="#f87171" strokeWidth="0.4" strokeOpacity="0.5" strokeDasharray="0.5,0.8"
                style={{ animation: "ep-glow-border 2s ease-in-out infinite" }} />
            );
          })
        ))}

        {/* Nation nodes */}
        {nations.map(n => {
          const pos = nationPos(n);
          const isAtWar = (n.at_war_with || []).length > 0;
          const color = n.flag_color || "#64748b";
          const isHovered = hovered?.id === n.id;

          return (
            <g key={n.id}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}>
              {/* Glow ring */}
              {isHovered && (
                <circle cx={pos.x} cy={pos.y - 3.5} r={3.5} fill="none"
                  stroke={color} strokeWidth="0.5" strokeOpacity="0.6"
                  style={{ animation: "ep-ripple 1.5s ease-out infinite" }} />
              )}
              {/* War pulse */}
              {isAtWar && (
                <circle cx={pos.x} cy={pos.y - 3.5} r={2.5} fill="none"
                  stroke="#f87171" strokeWidth="0.4" strokeOpacity="0.5"
                  style={{ animation: "ep-glow-pulse 1.5s ease-in-out infinite" }} />
              )}
              {/* Nation dot */}
              <circle cx={pos.x} cy={pos.y - 3.5} r={isHovered ? 2 : 1.4}
                fill={color} fillOpacity={isHovered ? 1 : 0.85}
                style={{ transition: "r 0.2s ease", filter: `drop-shadow(0 0 3px ${color})` }} />
              {/* Label (only when hovered or for top nations) */}
              {(isHovered || n.gdp > 600) && (
                <text x={pos.x + 2.5} y={pos.y - 2.5} fontSize="2" fill="white" fontWeight="bold"
                  fontFamily="'JetBrains Mono', monospace" opacity={isHovered ? 1 : 0.6}>
                  {n.flag_emoji || "🏴"} {n.name.slice(0, 12)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-64 rounded-xl p-3 z-30 ep-slide-in"
          style={{ background: "rgba(4,8,16,0.95)", border: `1px solid ${hovered.flag_color || "#64748b"}40`, backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{hovered.flag_emoji || "🏴"}</span>
            <div>
              <div className="font-bold text-white text-sm">{hovered.name}</div>
              <div className="text-[10px] text-slate-500">{hovered.epoch} · {hovered.leader}</div>
            </div>
            {(hovered.at_war_with || []).length > 0 && (
              <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">⚔️ AT WAR</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: "GDP", value: hovered.gdp || 0, color: "#22d3ee" },
              { label: "Military", value: hovered.unit_power || 0, color: "#f87171" },
              { label: "Stability", value: `${Math.round(hovered.stability || 75)}%`, color: "#4ade80" },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-1.5 bg-white/5">
                <div className="text-sm font-bold ep-mono" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] text-slate-600">{s.label}</div>
              </div>
            ))}
          </div>
          {(hovered.allies || []).length > 0 && (
            <div className="mt-2 text-[10px] text-slate-500">
              🤝 Allies: {hovered.allies.slice(0, 3).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 z-20">
        {[
          { color: "#4ade80", label: "Alliance", dash: true },
          { color: "#f87171", label: "Conflict", dash: true },
          { color: "#94a3b8", label: "Nation", dash: false },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-4 h-px" style={{ background: l.color, opacity: 0.7 }} />
            <span className="text-[9px] text-slate-600 ep-mono">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}