/**
 * ArmyLayer – renders military unit indicators near each nation.
 * Shows power rating, war status, movement paths during conflict.
 */
import { useMemo } from "react";
import { nationPos } from "../MapTerrain";

const STYLE_ID = "army-layer-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .al-march { animation: al-march 1.5s ease-in-out infinite; }
    .al-shield { animation: al-shield 2.5s ease-in-out infinite; }
    @keyframes al-march {
      0%,100% { transform: translateX(0px); }
      50%      { transform: translateX(4px); }
    }
    @keyframes al-shield {
      0%,100% { opacity: 0.7; }
      50%      { opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

// Scale bar 0–100 for military power
function powerBar(power, color) {
  const pct = Math.min(100, power) / 100;
  const W = 28;
  return (
    <g>
      <rect x={-W / 2} y={0} width={W} height={3}
        fill="rgba(255,255,255,0.08)" rx={1.5} shapeRendering="geometricPrecision" />
      <rect x={-W / 2} y={0} width={W * pct} height={3}
        fill={color} fillOpacity={0.8} rx={1.5} shapeRendering="geometricPrecision" />
    </g>
  );
}

export default function ArmyLayer({ nations, myNation, nationIndexMap, zoom }) {
  if (zoom < 1.0) return null;

  const warPairs = useMemo(() => {
    const pairs = [];
    const seen = new Set();
    nations.forEach(n => {
      (n.at_war_with || []).forEach(enemyId => {
        const key = [n.id, enemyId].sort().join("_");
        if (!seen.has(key)) {
          seen.add(key);
          const enemy = nations.find(e => e.id === enemyId);
          if (enemy) pairs.push({ a: n, b: enemy });
        }
      });
    });
    return pairs;
  }, [nations]);

  return (
    <g>
      {/* War movement lines between enemies */}
      {warPairs.map(({ a, b }, i) => {
        const aIdx = nationIndexMap[a.id] ?? 0;
        const bIdx = nationIndexMap[b.id] ?? 0;
        const aPos = nationPos(aIdx);
        const bPos = nationPos(bIdx);
        const mx = (aPos.x + bPos.x) / 2;
        const my = (aPos.y + bPos.y) / 2;
        const pathId = `army-path-${i}`;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={`ag-${i}`} x1={aPos.x} y1={aPos.y} x2={bPos.x} y2={bPos.y} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={a.flag_color || "#ef4444"} stopOpacity="0.7" />
                <stop offset="100%" stopColor={b.flag_color || "#ef4444"} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <path id={pathId} d={`M${aPos.x},${aPos.y} Q${mx},${my - 30} ${bPos.x},${bPos.y}`}
              fill="none" stroke={`url(#ag-${i})`} strokeWidth={1.5}
              strokeDasharray="5 4" strokeOpacity={0.6}
              shapeRendering="geometricPrecision" style={{ pointerEvents: "none" }} />
            {/* Animated arrow along path */}
            <text fontSize="10" style={{ userSelect: "none", pointerEvents: "none" }}>
              ⚔️
              <animateMotion dur="2s" repeatCount="indefinite">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </text>
          </g>
        );
      })}

      {/* Military indicators per nation */}
      {nations.map(nation => {
        const idx = nationIndexMap[nation.id] ?? 0;
        const { x, y } = nationPos(idx);
        const isMe = myNation?.id === nation.id;
        const isEnemy = myNation?.at_war_with?.includes(nation.id);
        const color = isEnemy ? "#ef4444" : isMe ? (nation.flag_color || "#22d3ee") : (nation.flag_color || "#94a3b8");
        const soldiers = nation.workers_soldiers || 0;
        const power = nation.unit_power || 10;
        const offense = Math.min(10, Math.floor(soldiers / 2));

        if (soldiers === 0 && !isMe) return null;

        return (
          <g key={`army-${nation.id}`}
            transform={`translate(${x + 32}, ${y + 8})`}
            style={{ pointerEvents: "none" }}>
            {/* Shield icon */}
            <g className="al-shield">
              <circle cx={0} cy={0} r={9}
                fill={color} fillOpacity={0.15}
                stroke={color} strokeWidth={1} strokeOpacity={0.6}
                shapeRendering="geometricPrecision" />
              <text x={0} y={4} textAnchor="middle" fontSize="9"
                style={{ userSelect: "none" }}>
                {isEnemy ? "⚔" : "🛡"}
              </text>
            </g>
            {/* Power bar */}
            <g transform="translate(0, 14)">
              {powerBar(power, color)}
            </g>
            {/* Power number */}
            {zoom >= 1.5 && (
              <text x={0} y={22} textAnchor="middle"
                fill={color} fontSize="6.5" fontFamily="monospace"
                stroke="#000" strokeWidth="1.5" paintOrder="stroke"
                style={{ userSelect: "none" }}>
                PWR {power}
              </text>
            )}
            {/* Soldier dots */}
            {zoom >= 1.8 && Array.from({ length: Math.min(soldiers, 5) }).map((_, i) => (
              <circle key={i}
                cx={(i - 2) * 5} cy={28}
                r={1.5} fill={color} fillOpacity={0.7}
                className="al-march"
                style={{ transformOrigin: `${(i - 2) * 5}px 28px`, animationDelay: `${i * 0.15}s` }}
                shapeRendering="geometricPrecision"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}