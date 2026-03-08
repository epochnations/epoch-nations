/**
 * MapOverlays – premium war glows, trade beams, battle markers, danger zones.
 * Crystal-clear SVG with GPU-accelerated CSS animations.
 */
import { MAP_W, MAP_H, nationPos } from "./MapTerrain";

// Inject CSS animations once
const STYLE_ID = "map-overlays-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .mo-war-pulse  { animation: mo-war-pulse 1.6s ease-in-out infinite; }
    .mo-war-pulse2 { animation: mo-war-pulse 2.4s ease-in-out infinite 0.3s; }
    .mo-danger     { animation: mo-danger 2.8s ease-in-out infinite; }
    .mo-trade-dash { animation: mo-trade-dash 1.4s linear infinite; }
    .mo-battle     { animation: mo-battle 0.9s ease-in-out infinite; }
    .mo-sel-spin   { animation: mo-sel-spin 4s linear infinite; }
    .mo-sel-spin-r { animation: mo-sel-spin 6s linear infinite reverse; }
    .mo-sel-pulse  { animation: mo-sel-pulse 1.8s ease-in-out infinite; }
    .mo-beam       { animation: mo-beam 0.8s ease-in-out infinite; }

    @keyframes mo-war-pulse {
      0%,100% { opacity: 0.18; }
      50%      { opacity: 0.04; }
    }
    @keyframes mo-danger {
      0%,100% { opacity: 0.22; transform: scale(1); }
      50%      { opacity: 0.06; transform: scale(1.25); }
    }
    @keyframes mo-trade-dash {
      from { stroke-dashoffset: 0; }
      to   { stroke-dashoffset: -32; }
    }
    @keyframes mo-battle {
      0%,100% { opacity: 0.85; transform: scale(1); }
      50%      { opacity: 0.2;  transform: scale(1.3); }
    }
    @keyframes mo-sel-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes mo-sel-pulse {
      0%,100% { opacity: 0.9; }
      50%      { opacity: 0.3; }
    }
    @keyframes mo-beam {
      0%,100% { opacity: 0.7; }
      50%      { opacity: 0.2; }
    }
  `;
  document.head.appendChild(s);
}

// ── War Glow ──────────────────────────────────────────────────────────────────
export function WarGlow({ x, y, color = "#ef4444", uid }) {
  return (
    <g>
      {/* Outer soft bloom */}
      <circle cx={x} cy={y} r={52} fill={color} opacity="0.07" className="mo-war-pulse2"
        style={{ transformOrigin: `${x}px ${y}px` }}/>
      {/* Mid pulsing fill */}
      <circle cx={x} cy={y} r={36} fill={color} opacity="0.14" className="mo-war-pulse"
        style={{ transformOrigin: `${x}px ${y}px` }}/>
      {/* Sharp inner ring */}
      <circle cx={x} cy={y} r={28} fill="none" stroke={color} strokeWidth="1.5" opacity="0.6"
        strokeDasharray="4 3" shapeRendering="geometricPrecision" className="mo-war-pulse"/>
      {/* Bright crisp ring */}
      <circle cx={x} cy={y} r={22} fill="none" stroke={color} strokeWidth="0.8" opacity="0.9"
        shapeRendering="geometricPrecision"/>
    </g>
  );
}

// ── Trade Route Beam ──────────────────────────────────────────────────────────
export function TradeRouteLine({ x1, y1, x2, y2, color = "#10b981", id }) {
  const pathId = `tr-${id}`;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const dur = `${Math.max(1.2, len / 180).toFixed(1)}s`;
  return (
    <g>
      <defs>
        <linearGradient id={`tg-${id}`} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={color} stopOpacity="0"/>
          <stop offset="50%"  stopColor={color} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Glow underline */}
      <path id={pathId} d={`M${x1},${y1} L${x2},${y2}`}
        fill="none" stroke={color} strokeWidth="6" opacity="0.07"/>
      {/* Main beam */}
      <path d={`M${x1},${y1} L${x2},${y2}`}
        fill="none" stroke={`url(#tg-${id})`} strokeWidth="1.5" opacity="0.6"
        strokeDasharray="10 8" className="mo-trade-dash"
        shapeRendering="geometricPrecision"/>
      {/* Crisp center line */}
      <path d={`M${x1},${y1} L${x2},${y2}`}
        fill="none" stroke={color} strokeWidth="0.6" opacity="0.25"
        shapeRendering="geometricPrecision"/>
      {/* Animated dot along path */}
      <circle r="3.5" fill={color} opacity="0.95" shapeRendering="geometricPrecision">
        <animateMotion dur={dur} repeatCount="indefinite">
          <mpath href={`#${pathId}`}/>
        </animateMotion>
      </circle>
      {/* Secondary dot, offset */}
      <circle r="2" fill={color} opacity="0.55" shapeRendering="geometricPrecision">
        <animateMotion dur={dur} begin={`-${(parseFloat(dur) / 2).toFixed(1)}s`} repeatCount="indefinite">
          <mpath href={`#${pathId}`}/>
        </animateMotion>
      </circle>
    </g>
  );
}

// ── Danger Zone ───────────────────────────────────────────────────────────────
export function DangerZone({ x, y }) {
  return (
    <g style={{ transformOrigin: `${x}px ${y}px` }}>
      <circle cx={x} cy={y} r={26} fill="#f59e0b" opacity="0.1"
        className="mo-danger" style={{ transformOrigin: `${x}px ${y}px` }}/>
      {/* Hex diamond outline */}
      <polygon
        points={`${x},${y-18} ${x+16},${y-9} ${x+16},${y+9} ${x},${y+18} ${x-16},${y+9} ${x-16},${y-9}`}
        fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.55"
        strokeDasharray="5 4" shapeRendering="geometricPrecision"/>
      <text x={x} y={y + 6} textAnchor="middle" fontSize="15" opacity="0.9"
        style={{ pointerEvents: "none", userSelect: "none" }}>⚠️</text>
    </g>
  );
}

// ── Battle Icon ───────────────────────────────────────────────────────────────
export function BattleIcon({ x, y }) {
  return (
    <g style={{ transformOrigin: `${x}px ${y}px` }} className="mo-battle">
      <circle cx={x} cy={y} r={14} fill="#ef4444" opacity="0.2"
        shapeRendering="geometricPrecision"/>
      <circle cx={x} cy={y} r={10} fill="none" stroke="#ef4444" strokeWidth="1.2" opacity="0.8"
        shapeRendering="geometricPrecision"/>
      <text x={x} y={y + 5} textAnchor="middle" fontSize="12"
        style={{ pointerEvents: "none", userSelect: "none" }}>⚔️</text>
    </g>
  );
}

// ── Selection Ring ────────────────────────────────────────────────────────────
export function SelectionRing({ x, y, color = "#22d3ee" }) {
  return (
    <g>
      {/* Outer slow counter-spin */}
      <g style={{ transformOrigin: `${x}px ${y}px` }} className="mo-sel-spin-r">
        <circle cx={x} cy={y} r={40} fill="none"
          stroke={color} strokeWidth="0.8" opacity="0.35"
          strokeDasharray="3 12" shapeRendering="geometricPrecision"/>
      </g>
      {/* Middle spin */}
      <g style={{ transformOrigin: `${x}px ${y}px` }} className="mo-sel-spin">
        <circle cx={x} cy={y} r={34} fill="none"
          stroke={color} strokeWidth="1.5" opacity="0.75"
          strokeDasharray="10 6" shapeRendering="geometricPrecision"/>
        {/* Bright arc dot */}
        <circle cx={x + 34} cy={y} r={2.5} fill={color} opacity="0.95"
          shapeRendering="geometricPrecision"/>
      </g>
      {/* Inner pulse ring */}
      <circle cx={x} cy={y} r={28} fill="none"
        stroke={color} strokeWidth="2.5" opacity="0.9"
        className="mo-sel-pulse" shapeRendering="geometricPrecision"/>
      {/* Solid center ring — always visible */}
      <circle cx={x} cy={y} r={32} fill="none"
        stroke={color} strokeWidth="0.5" opacity="0.5"
        shapeRendering="geometricPrecision"/>
    </g>
  );
}

// ── Ally Connection Beam ──────────────────────────────────────────────────────
export function AllyBeam({ x1, y1, x2, y2, color = "#10b981", id }) {
  const pid = `ab-${id}`;
  return (
    <g>
      <defs>
        <linearGradient id={`abg-${id}`} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={color} stopOpacity="0.05"/>
          <stop offset="50%"  stopColor={color} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <path id={pid} d={`M${x1},${y1} L${x2},${y2}`} fill="none"
        stroke={`url(#abg-${id})`} strokeWidth="2.5"
        shapeRendering="geometricPrecision"/>
    </g>
  );
}

// ── Main Overlays ─────────────────────────────────────────────────────────────
export default function MapOverlays({ nations, myNation, layers, selectedNation, nationIndexMap }) {
  const { wars, tradeRoutes, battles, danger } = layers;

  const warNations = nations.filter(n => (n.at_war_with || []).length > 0);
  const allies = myNation ? nations.filter(n => (myNation.allies || []).includes(n.id)) : [];
  const myIdx = myNation ? (nationIndexMap[myNation.id] ?? 0) : null;
  const myPos = myIdx !== null ? nationPos(myIdx) : null;

  return (
    <g>
      {/* ── Ally connection beams (under everything) ── */}
      {tradeRoutes && myPos && allies.map((ally) => {
        const aIdx = nationIndexMap[ally.id] ?? 0;
        const aPos = nationPos(aIdx);
        return (
          <AllyBeam key={`ab-${ally.id}`}
            x1={myPos.x} y1={myPos.y}
            x2={aPos.x}  y2={aPos.y}
            color={ally.flag_color || "#10b981"}
            id={ally.id.slice(-6)}/>
        );
      })}

      {/* ── Trade route animated beams ── */}
      {tradeRoutes && myPos && allies.map((ally) => {
        const aIdx = nationIndexMap[ally.id] ?? 0;
        const aPos = nationPos(aIdx);
        return (
          <TradeRouteLine key={`tr-${ally.id}`}
            x1={myPos.x} y1={myPos.y}
            x2={aPos.x}  y2={aPos.y}
            color={ally.flag_color || "#10b981"}
            id={ally.id.slice(-6)}/>
        );
      })}

      {/* ── War glows ── */}
      {wars && warNations.map(n => {
        const idx = nationIndexMap[n.id] ?? 0;
        const { x, y } = nationPos(idx);
        return <WarGlow key={`wg-${n.id}`} x={x} y={y} color={n.flag_color || "#ef4444"} uid={n.id.slice(-6)}/>;
      })}

      {/* ── Battle icons ── */}
      {battles && warNations.map(n => {
        if (!n.at_war_with?.length) return null;
        const idx = nationIndexMap[n.id] ?? 0;
        const { x, y } = nationPos(idx);
        return <BattleIcon key={`bi-${n.id}`} x={x + 24} y={y - 22}/>;
      })}

      {/* ── Danger zones ── */}
      {danger && nations.filter(n => (n.stability || 75) < 35).map(n => {
        const idx = nationIndexMap[n.id] ?? 0;
        const { x, y } = nationPos(idx);
        return <DangerZone key={`dz-${n.id}`} x={x} y={y + 26}/>;
      })}

      {/* ── Selection ring (on top) ── */}
      {selectedNation && (() => {
        const idx = nationIndexMap[selectedNation.id] ?? 0;
        const { x, y } = nationPos(idx);
        return <SelectionRing key="sel" x={x} y={y} color={selectedNation.flag_color || "#22d3ee"}/>;
      })()}
    </g>
  );
}