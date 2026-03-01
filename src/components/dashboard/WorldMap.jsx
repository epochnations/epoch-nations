import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Swords, Heart, Globe } from "lucide-react";

const EPOCH_RING = {
  Industrial: "border-amber-400",
  Information: "border-cyan-400",
  Nano: "border-violet-400"
};

// Grid positions for nations (deterministic by nation id hash)
function getPosition(id, index) {
  const positions = [
    { x: 15, y: 20 }, { x: 40, y: 15 }, { x: 65, y: 25 }, { x: 85, y: 15 },
    { x: 25, y: 50 }, { x: 50, y: 45 }, { x: 72, y: 55 }, { x: 10, y: 70 },
    { x: 35, y: 72 }, { x: 60, y: 75 }, { x: 80, y: 65 }, { x: 45, y: 85 },
  ];
  return positions[index % positions.length];
}

export default function WorldMap({ myNation, onSelectNation }) {
  const [nations, setNations] = useState([]);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    loadNations();
    const unsub = base44.entities.Nation.subscribe(() => loadNations());
    return unsub;
  }, []);

  async function loadNations() {
    const data = await base44.entities.Nation.list("-gdp", 50);
    setNations(data);
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-full relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 py-3 border-b border-white/10 flex items-center gap-2 backdrop-blur-sm bg-black/20">
        <Globe size={14} className="text-cyan-400" />
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">World Map · {nations.length} Nations</span>
      </div>

      {/* Map background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 60%, rgba(59,130,246,0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 30%, rgba(16,185,129,0.1) 0%, transparent 50%),
            linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 30px 30px, 30px 30px"
        }}
      />

      {/* Continent blobs */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ellipse cx="25" cy="40" rx="18" ry="25" fill="#334155" />
        <ellipse cx="52" cy="35" rx="22" ry="20" fill="#334155" />
        <ellipse cx="78" cy="45" rx="14" ry="18" fill="#334155" />
        <ellipse cx="40" cy="70" rx="12" ry="14" fill="#334155" />
        <ellipse cx="65" cy="72" rx="10" ry="10" fill="#334155" />
      </svg>

      {/* Nation dots */}
      <div className="absolute inset-0 pt-12">
        {nations.map((nation, index) => {
          const pos = getPosition(nation.id, index);
          const isMe = myNation && nation.id === myNation.id;
          const isAlly = myNation?.allies?.includes(nation.id);
          const isEnemy = myNation?.at_war_with?.includes(nation.id);

          return (
            <button
              key={nation.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onMouseEnter={() => setHovered(nation)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectNation?.(nation)}
            >
              {/* Pulse for me */}
              {isMe && (
                <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: nation.flag_color }} />
              )}
              <div
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-lg border-2 transition-transform group-hover:scale-125 shadow-lg ${EPOCH_RING[nation.epoch]}`}
                style={{ backgroundColor: (nation.flag_color || "#3b82f6") + "33" }}
              >
                {nation.flag_emoji || "🏴"}
                {isEnemy && <div className="absolute -top-1 -right-1 text-xs">⚔️</div>}
                {isAlly && <div className="absolute -top-1 -right-1 text-xs">🤝</div>}
              </div>

              {/* Tooltip */}
              {hovered?.id === nation.id && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 min-w-[140px] backdrop-blur-xl bg-black/80 border border-white/20 rounded-xl p-3 pointer-events-none">
                  <div className="font-bold text-white text-xs mb-1">{nation.name}</div>
                  <div className="text-slate-400 text-xs">{nation.epoch} · T{nation.tech_level}</div>
                  <div className="text-green-400 text-xs font-mono">GDP: {nation.gdp}</div>
                  <div className={`text-xs ${isEnemy ? "text-red-400" : isAlly ? "text-blue-400" : "text-slate-500"}`}>
                    {isMe ? "🫵 Your nation" : isEnemy ? "⚔ At war" : isAlly ? "🤝 Ally" : "Neutral"}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-3 z-10">
        {[["Industrial", "border-amber-400"], ["Information", "border-cyan-400"], ["Nano", "border-violet-400"]].map(([era, cls]) => (
          <div key={era} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded border-2 ${cls}`} />
            <span className="text-xs text-slate-500">{era}</span>
          </div>
        ))}
      </div>
    </div>
  );
}