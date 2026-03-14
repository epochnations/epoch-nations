/**
 * ResourceLayer – shows resource deposit icons on the map at fixed locations.
 * Renders only at zoom >= 1.2. Purely visual SVG, no interaction required.
 */
import { MAP_W, MAP_H } from "../MapTerrain";

const STYLE_ID = "resource-layer-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .rl-pulse { animation: rl-pulse 3s ease-in-out infinite; }
    @keyframes rl-pulse {
      0%,100% { opacity: 0.55; transform: scale(1); }
      50%      { opacity: 0.9; transform: scale(1.15); }
    }
  `;
  document.head.appendChild(s);
}

// Seeded resource deposits across the map
const RESOURCE_DEPOSITS = [
  // Oil
  { type: "oil",   icon: "🛢",  x: 1020, y: 280, color: "#1e3a5f" },
  { type: "oil",   icon: "🛢",  x: 380,  y: 440, color: "#1e3a5f" },
  { type: "oil",   icon: "🛢",  x: 1200, y: 160, color: "#1e3a5f" },
  { type: "oil",   icon: "🛢",  x: 870,  y: 380, color: "#1e3a5f" },
  // Iron
  { type: "iron",  icon: "⚙",  x: 800,  y: 160, color: "#475569" },
  { type: "iron",  icon: "⚙",  x: 1300, y: 260, color: "#475569" },
  { type: "iron",  icon: "⚙",  x: 230,  y: 220, color: "#475569" },
  { type: "iron",  icon: "⚙",  x: 960,  y: 500, color: "#475569" },
  // Gold
  { type: "gold",  icon: "✦",  x: 700,  y: 640, color: "#f59e0b" },
  { type: "gold",  icon: "✦",  x: 1440, y: 600, color: "#f59e0b" },
  { type: "gold",  icon: "✦",  x: 290,  y: 680, color: "#f59e0b" },
  { type: "gold",  icon: "✦",  x: 1100, y: 400, color: "#f59e0b" },
  // Wood
  { type: "wood",  icon: "🌲",  x: 160,  y: 160, color: "#166534" },
  { type: "wood",  icon: "🌲",  x: 350,  y: 520, color: "#166534" },
  { type: "wood",  icon: "🌲",  x: 1340, y: 380, color: "#166534" },
  { type: "wood",  icon: "🌲",  x: 740,  y: 380, color: "#166534" },
  // Stone
  { type: "stone", icon: "⬡",  x: 900,  y: 140, color: "#78716c" },
  { type: "stone", icon: "⬡",  x: 1180, y: 460, color: "#78716c" },
  { type: "stone", icon: "⬡",  x: 460,  y: 270, color: "#78716c" },
  // Food
  { type: "food",  icon: "🌾",  x: 1260, y: 310, color: "#84cc16" },
  { type: "food",  icon: "🌾",  x: 440,  y: 640, color: "#84cc16" },
  { type: "food",  icon: "🌾",  x: 860,  y: 240, color: "#84cc16" },
  { type: "food",  icon: "🌾",  x: 1460, y: 400, color: "#84cc16" },
];

export default function ResourceLayer({ zoom, layers }) {
  if (!layers?.resources || zoom < 1.2) return null;

  return (
    <g>
      {RESOURCE_DEPOSITS.map((res, i) => (
        <g key={i} className="rl-pulse" style={{ transformOrigin: `${res.x}px ${res.y}px`, pointerEvents: "none" }}>
          {/* Background glow circle */}
          <circle cx={res.x} cy={res.y} r={10}
            fill={res.color} fillOpacity={0.18}
            shapeRendering="geometricPrecision"
          />
          <circle cx={res.x} cy={res.y} r={8}
            fill="none" stroke={res.color} strokeWidth={0.8} strokeOpacity={0.5}
            shapeRendering="geometricPrecision"
          />
          {/* Icon */}
          <text x={res.x} y={res.y + 4} textAnchor="middle"
            fontSize={res.icon.length === 1 && res.icon.charCodeAt(0) < 128 ? "10" : "9"}
            fill={res.color}
            style={{ userSelect: "none" }}>
            {res.icon}
          </text>
          {/* Label at high zoom */}
          {zoom >= 2.0 && (
            <text x={res.x} y={res.y + 17} textAnchor="middle"
              fill={res.color} fontSize="6.5" fontFamily="monospace" opacity={0.75}
              stroke="#000" strokeWidth="1.5" paintOrder="stroke"
              style={{ userSelect: "none" }}>
              {res.type.toUpperCase()}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}