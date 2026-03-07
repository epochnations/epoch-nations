/**
 * MapOverlays – war glows, trade routes, battle icons, danger zones, events.
 */
import { MAP_W, MAP_H, nationPos } from "./MapTerrain";

// Animated blinking war glow around a nation
export function WarGlow({ x, y, color }) {
  return (
    <g>
      <circle cx={x} cy={y} r={28} fill={color || "#ef4444"} opacity="0.15">
        <animate attributeName="r" values="22;34;22" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.15;0.05;0.15" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx={x} cy={y} r={18} fill="none" stroke={color || "#ef4444"} strokeWidth="1.5" opacity="0.4">
        <animate attributeName="r" values="16;26;16" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite"/>
      </circle>
    </g>
  );
}

// Animated trade route line between two points
export function TradeRouteLine({ x1, y1, x2, y2, color = "#10b981" }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth="1.5" opacity="0.25" strokeDasharray="6,6">
        <animate attributeName="stroke-dashoffset" from="0" to="-24"
          dur="1.2s" repeatCount="indefinite"/>
      </line>
      {/* Moving dot along route */}
      <circle r="3" fill={color} opacity="0.7">
        <animateMotion dur={`${Math.max(1, len / 200)}s`} repeatCount="indefinite">
          <mpath href="#trade-path-tmp"/>
        </animateMotion>
      </circle>
      <path id="trade-path-tmp" d={`M${x1},${y1} L${x2},${y2}`} fill="none" stroke="none"/>
    </g>
  );
}

// Danger zone marker
export function DangerZone({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={20} fill="#f59e0b" opacity="0.08">
        <animate attributeName="r" values="16;24;16" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <text x={x} y={y + 5} textAnchor="middle" fontSize="16" opacity="0.9">⚠️</text>
    </g>
  );
}

// Battle crossed-swords
export function BattleIcon({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={16} fill="#ef4444" opacity="0.18">
        <animate attributeName="opacity" values="0.18;0.05;0.18" dur="0.8s" repeatCount="indefinite"/>
      </circle>
      <text x={x} y={y + 5} textAnchor="middle" fontSize="14">⚔️</text>
    </g>
  );
}

// Selected nation highlight ring
export function SelectionRing({ x, y, color }) {
  return (
    <circle cx={x} cy={y} r={32} fill="none"
      stroke={color || "#22d3ee"} strokeWidth="2" opacity="0.8"
      strokeDasharray="6,3">
      <animateTransform attributeName="transform" type="rotate"
        from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="4s" repeatCount="indefinite"/>
    </circle>
  );
}

export default function MapOverlays({ nations, myNation, layers, selectedNation, nationIndexMap }) {
  const { wars, tradeRoutes, battles, danger, resources } = layers;

  const warNations = nations.filter(n => (n.at_war_with||[]).length > 0);
  const allies = myNation ? nations.filter(n => (myNation.allies||[]).includes(n.id)) : [];

  return (
    <g>
      {/* War glows */}
      {wars && warNations.map(n => {
        const idx = nationIndexMap[n.id] ?? 0;
        const { x, y } = nationPos(idx);
        return <WarGlow key={n.id} x={x} y={y} color={n.flag_color} />;
      })}

      {/* Battle icons (war + enemy combo) */}
      {battles && warNations.map(n => {
        if (!n.at_war_with?.length) return null;
        const idx = nationIndexMap[n.id] ?? 0;
        const { x, y } = nationPos(idx);
        return <BattleIcon key={`b-${n.id}`} x={x + 20} y={y - 20} />;
      })}

      {/* Trade routes: ally-to-ally animated lines */}
      {tradeRoutes && allies.map(ally => {
        const myIdx = nationIndexMap[myNation?.id] ?? 0;
        const allyIdx = nationIndexMap[ally.id] ?? 0;
        const p1 = nationPos(myIdx);
        const p2 = nationPos(allyIdx);
        return (
          <TradeRouteLine key={ally.id}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            color={ally.flag_color || "#10b981"} />
        );
      })}

      {/* Danger zones on nations at very low stability */}
      {danger && nations.filter(n => (n.stability||75) < 35).map(n => {
        const idx = nationIndexMap[n.id] ?? 0;
        const { x, y } = nationPos(idx);
        return <DangerZone key={`d-${n.id}`} x={x} y={y + 22} />;
      })}

      {/* Selection ring */}
      {selectedNation && (() => {
        const idx = nationIndexMap[selectedNation.id] ?? 0;
        const { x, y } = nationPos(idx);
        return <SelectionRing x={x} y={y} color={selectedNation.flag_color} />;
      })()}
    </g>
  );
}