/**
 * TerritoryLayer – renders colored territory polygons + animated borders per nation.
 * Sits BELOW nation icons in the SVG stack. Pure SVG, no DOM changes.
 */
import { useMemo } from "react";
import { nationPos, MAP_W, MAP_H } from "../MapTerrain";

// Inject CSS once
const STYLE_ID = "territory-layer-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .tl-border { animation: tl-border-anim 3s ease-in-out infinite; }
    .tl-border-war { animation: tl-border-war 1s ease-in-out infinite; }
    .tl-fill { animation: tl-fill-pulse 4s ease-in-out infinite; }
    @keyframes tl-border-anim {
      0%,100% { stroke-opacity: 0.7; stroke-dashoffset: 0; }
      50%      { stroke-opacity: 1; stroke-dashoffset: -20; }
    }
    @keyframes tl-border-war {
      0%,100% { stroke-opacity: 0.9; stroke-width: 2; }
      50%      { stroke-opacity: 0.3; stroke-width: 1; }
    }
    @keyframes tl-fill-pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.75; }
    }
  `;
  document.head.appendChild(s);
}

// Generate a pseudo-random blob polygon for a territory around a center point
function generateTerritoryPolygon(cx, cy, radius, nationId, pointCount = 10) {
  // Use nation ID as seed for deterministic shape
  const seed = nationId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const points = [];
  for (let i = 0; i < pointCount; i++) {
    const baseAngle = (i / pointCount) * Math.PI * 2;
    // Add a pseudo-random wobble
    const wobble = 0.65 + ((seed * (i + 3) * 17) % 100) / 280;
    const r = radius * wobble;
    const angleNoise = (((seed * (i + 7) * 13) % 30) - 15) * (Math.PI / 180);
    const angle = baseAngle + angleNoise;
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  // Clamp to map bounds
  return points.map(([x, y]) => [
    Math.max(8, Math.min(MAP_W - 8, x)),
    Math.max(8, Math.min(MAP_H - 8, y)),
  ]);
}

// Compute territory radius from nation stats (30–130px)
function territoryRadius(nation) {
  const gdp = nation.gdp || 200;
  const pop = nation.population || 10;
  const stab = (nation.stability || 60) / 100;
  const infra = (nation.tech_level || 1);
  const raw = Math.sqrt(gdp / 8 + pop * 1.2 + infra * 4) * stab;
  return Math.max(30, Math.min(130, raw));
}

export default function TerritoryLayer({ nations, myNation, nationIndexMap, zoom }) {
  const territories = useMemo(() => {
    return nations.map(nation => {
      const idx = nationIndexMap[nation.id] ?? 0;
      const { x, y } = nationPos(idx);
      const radius = territoryRadius(nation);
      const polygon = generateTerritoryPolygon(x, y, radius, nation.id);
      const isMe = myNation?.id === nation.id;
      const isEnemy = myNation?.at_war_with?.includes(nation.id);
      const isAlly = myNation?.allies?.includes(nation.id);
      return { nation, x, y, radius, polygon, isMe, isEnemy, isAlly };
    });
  }, [nations, myNation, nationIndexMap]);

  return (
    <g>
      {/* Territory fills */}
      {territories.map(({ nation, polygon, isMe, isEnemy, isAlly }) => {
        const color = nation.flag_color || "#3b82f6";
        const pts = polygon.map(([x, y]) => `${x},${y}`).join(" ");
        const fillOpacity = isMe ? 0.12 : isEnemy ? 0.1 : isAlly ? 0.09 : 0.06;
        return (
          <polygon
            key={`tf-${nation.id}`}
            points={pts}
            fill={color}
            fillOpacity={fillOpacity}
            stroke="none"
            className="tl-fill"
            style={{ pointerEvents: "none" }}
          />
        );
      })}

      {/* Territory borders */}
      {territories.map(({ nation, polygon, isMe, isEnemy, isAlly }) => {
        const color = nation.flag_color || "#3b82f6";
        const pts = polygon.map(([x, y]) => `${x},${y}`).join(" ");
        const strokeWidth = isMe ? 2.2 : isEnemy ? 1.8 : isAlly ? 1.5 : 1;
        const strokeOpacity = isMe ? 0.9 : isEnemy ? 0.75 : isAlly ? 0.6 : 0.35;
        const dashArray = isMe ? "8 4" : isEnemy ? "6 3" : isAlly ? "10 5" : "4 6";
        return (
          <polygon
            key={`tb-${nation.id}`}
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
            strokeDasharray={dashArray}
            className={isEnemy ? "tl-border-war" : "tl-border"}
            style={{ pointerEvents: "none", shapeRendering: "geometricPrecision" }}
          />
        );
      })}

      {/* Capital markers */}
      {zoom >= 1.0 && territories.map(({ nation, x, y, isMe }) => {
        const color = nation.flag_color || "#3b82f6";
        return (
          <g key={`cap-${nation.id}`} style={{ pointerEvents: "none" }}>
            <circle cx={x} cy={y} r={isMe ? 6 : 4}
              fill={color} fillOpacity={0.25}
              stroke={color} strokeWidth={1}
              strokeOpacity={0.6}
              shapeRendering="geometricPrecision"
            />
          </g>
        );
      })}
    </g>
  );
}