/**
 * InfrastructureLayer – renders roads, ports, factories on the SVG map
 * based on each nation's buildings and epoch.
 */
import { useMemo } from "react";
import { nationPos } from "../MapTerrain";

const STYLE_ID = "infra-layer-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .il-road { animation: il-road-dash 2s linear infinite; }
    @keyframes il-road-dash {
      from { stroke-dashoffset: 0; }
      to   { stroke-dashoffset: -20; }
    }
  `;
  document.head.appendChild(s);
}

const EPOCH_INFRA = {
  "Stone Age":       { roads: false, factories: false, ports: false },
  "Bronze Age":      { roads: true,  factories: false, ports: false },
  "Iron Age":        { roads: true,  factories: false, ports: true  },
  "Classical Age":   { roads: true,  factories: false, ports: true  },
  "Medieval Age":    { roads: true,  factories: false, ports: true  },
  "Renaissance Age": { roads: true,  factories: true,  ports: true  },
  "Industrial Age":  { roads: true,  factories: true,  ports: true  },
  "Modern Age":      { roads: true,  factories: true,  ports: true  },
  "Digital Age":     { roads: true,  factories: true,  ports: true  },
  "Information Age": { roads: true,  factories: true,  ports: true  },
  "Space Age":       { roads: true,  factories: true,  ports: true  },
  "Galactic Age":    { roads: true,  factories: true,  ports: true  },
};

export default function InfrastructureLayer({ nations, allies, nationIndexMap, zoom }) {
  if (zoom < 1.3) return null;

  return (
    <g>
      {nations.map(nation => {
        const idx = nationIndexMap[nation.id] ?? 0;
        const { x, y } = nationPos(idx);
        const color = nation.flag_color || "#3b82f6";
        const infra = EPOCH_INFRA[nation.epoch] || EPOCH_INFRA["Stone Age"];
        const isAlly = allies?.some(a => a.id === nation.id);

        return (
          <g key={`infra-${nation.id}`} style={{ pointerEvents: "none" }}>
            {/* Road segments between allied nations */}
            {infra.roads && isAlly && (
              <g>
                {/* Just a short radiating segment to show road existence */}
                <line x1={x - 20} y1={y + 20} x2={x + 20} y2={y + 20}
                  stroke={color} strokeWidth={1} strokeOpacity={0.3}
                  strokeDasharray="4 3" className="il-road"
                  shapeRendering="geometricPrecision" />
              </g>
            )}

            {/* Factory icon */}
            {infra.factories && zoom >= 1.6 && (
              <g transform={`translate(${x - 36}, ${y + 4})`}>
                <circle cx={0} cy={0} r={7}
                  fill="#78716c" fillOpacity={0.2}
                  stroke="#78716c" strokeWidth={0.8} strokeOpacity={0.5}
                  shapeRendering="geometricPrecision" />
                <text x={0} y={4} textAnchor="middle" fontSize="8"
                  style={{ userSelect: "none" }}>🏭</text>
              </g>
            )}

            {/* Port icon (coastal nations only) */}
            {infra.ports && zoom >= 1.6 && (
              <g transform={`translate(${x}, ${y + 36})`}>
                <circle cx={0} cy={0} r={6}
                  fill="#0ea5e9" fillOpacity={0.2}
                  stroke="#0ea5e9" strokeWidth={0.8} strokeOpacity={0.5}
                  shapeRendering="geometricPrecision" />
                <text x={0} y={4} textAnchor="middle" fontSize="7"
                  style={{ userSelect: "none" }}>⚓</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}