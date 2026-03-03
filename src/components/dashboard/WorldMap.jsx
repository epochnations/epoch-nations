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
    <div className="backdrop-blur-xl bg-[#060d1f] border border-white/10 rounded-2xl overflow-hidden h-full relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 py-3 border-b border-white/10 flex items-center gap-2 backdrop-blur-sm bg-black/40">
        <Globe size={14} className="text-cyan-400" />
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">World Map · {nations.length} Nations</span>
      </div>

      {/* Ocean gradient */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 50%, #0a1628 0%, #060d1f 100%)"
      }} />

      {/* Latitude lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
        {[1,2,3,4,5,6,7].map(i => (
          <line key={i} x1="0" y1={i*60} x2="800" y2={i*60} stroke="#38bdf8" strokeWidth="0.4" strokeDasharray="4,8" />
        ))}
        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
          <line key={i} x1={i*53} y1="0" x2={i*53} y2="450" stroke="#38bdf8" strokeWidth="0.4" strokeDasharray="4,12" />
        ))}
        {/* Equator */}
        <line x1="0" y1="225" x2="800" y2="225" stroke="#22d3ee" strokeWidth="1" strokeDasharray="8,6" opacity="0.3" />
      </svg>

      {/* Continents SVG - stylized world map */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* North America */}
        <path d="M 80,60 L 180,50 L 210,80 L 230,140 L 200,180 L 160,200 L 140,230 L 100,250 L 70,200 L 50,150 L 60,100 Z"
          fill="#1e3a5f" stroke="#2563eb" strokeWidth="0.8" opacity="0.7"/>
        {/* Central America */}
        <path d="M 140,230 L 160,200 L 180,220 L 170,260 L 150,255 Z"
          fill="#1e3a5f" stroke="#2563eb" strokeWidth="0.6" opacity="0.6"/>
        {/* South America */}
        <path d="M 160,270 L 210,250 L 240,300 L 250,380 L 210,420 L 170,410 L 140,360 L 130,300 Z"
          fill="#1a4731" stroke="#059669" strokeWidth="0.8" opacity="0.7"/>
        {/* Europe */}
        <path d="M 350,50 L 420,40 L 450,70 L 440,110 L 410,120 L 380,110 L 350,90 Z"
          fill="#3b2f6b" stroke="#7c3aed" strokeWidth="0.8" opacity="0.7"/>
        {/* Scandinavia */}
        <path d="M 390,30 L 420,20 L 430,50 L 410,60 L 385,50 Z"
          fill="#3b2f6b" stroke="#7c3aed" strokeWidth="0.6" opacity="0.6"/>
        {/* Africa */}
        <path d="M 360,130 L 430,120 L 470,160 L 480,250 L 460,340 L 420,380 L 380,370 L 340,300 L 330,200 L 340,150 Z"
          fill="#3b1f0a" stroke="#d97706" strokeWidth="0.8" opacity="0.7"/>
        {/* Middle East */}
        <path d="M 450,110 L 510,100 L 530,140 L 500,160 L 460,155 Z"
          fill="#3b2505" stroke="#d97706" strokeWidth="0.6" opacity="0.6"/>
        {/* Russia/Asia */}
        <path d="M 440,30 L 650,20 L 700,60 L 720,100 L 680,130 L 600,140 L 530,130 L 480,110 L 450,70 Z"
          fill="#1a2e40" stroke="#0891b2" strokeWidth="0.8" opacity="0.7"/>
        {/* India */}
        <path d="M 560,140 L 610,130 L 630,190 L 610,240 L 580,230 L 555,180 Z"
          fill="#1a2e40" stroke="#0891b2" strokeWidth="0.6" opacity="0.6"/>
        {/* SE Asia */}
        <path d="M 650,140 L 720,120 L 750,160 L 730,190 L 680,180 L 650,160 Z"
          fill="#1a2e40" stroke="#0891b2" strokeWidth="0.6" opacity="0.6"/>
        {/* China */}
        <path d="M 590,80 L 690,60 L 720,100 L 700,140 L 650,150 L 600,140 L 580,110 Z"
          fill="#1a2e40" stroke="#0891b2" strokeWidth="0.7" opacity="0.65"/>
        {/* Australia */}
        <path d="M 640,290 L 740,270 L 780,310 L 770,370 L 710,390 L 650,360 L 620,320 Z"
          fill="#2d1a0e" stroke="#c2410c" strokeWidth="0.8" opacity="0.7"/>
        {/* Greenland */}
        <path d="M 240,20 L 290,15 L 300,50 L 270,60 L 240,50 Z"
          fill="#1e3a5f" stroke="#2563eb" strokeWidth="0.5" opacity="0.4"/>
        {/* Japan */}
        <path d="M 735,90 L 750,80 L 760,105 L 748,115 L 736,105 Z"
          fill="#1a2e40" stroke="#0891b2" strokeWidth="0.5" opacity="0.6"/>

        {/* Ocean shimmer dots */}
        {[
          [300,200],[500,300],[200,350],[680,230],[100,300],[750,200],[450,400],[280,120]
        ].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="#38bdf8" opacity="0.15" />
        ))}
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