/**
 * CityMarkerLayer – renders player city icons on the SVG map.
 * Clickable icons open a city info panel.
 */
import { useState } from "react";
import { nationPos } from "../MapTerrain";
import CityInfoPanel from "./CityInfoPanel";

// Inject CSS once
const STYLE_ID = "city-marker-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .cm-glow { animation: cm-glow 2.5s ease-in-out infinite; }
    .cm-capital { animation: cm-capital 3s ease-in-out infinite; }
    @keyframes cm-glow {
      0%,100% { opacity: 0.6; }
      50%      { opacity: 1; }
    }
    @keyframes cm-capital {
      0%,100% { r: 7px; opacity: 0.8; }
      50%      { r: 9px; opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

// Get city positions offset from capital based on count
function cityOffset(idx, total) {
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI / 4, (3 * Math.PI) / 4];
  const a = angles[idx % angles.length];
  const r = 28 + (idx > 3 ? 20 : 0);
  return { dx: r * Math.cos(a), dy: r * Math.sin(a) };
}

export default function CityMarkerLayer({ nations, cities, myNation, nationIndexMap, zoom, onCityClick }) {
  const [hoveredCity, setHoveredCity] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  if (zoom < 0.8) return null;

  // Group cities by nation
  const cityByNation = {};
  (cities || []).forEach(c => {
    if (!cityByNation[c.nation_id]) cityByNation[c.nation_id] = [];
    cityByNation[c.nation_id].push(c);
  });

  return (
    <g>
      {nations.map(nation => {
        const idx = nationIndexMap[nation.id] ?? 0;
        const { x, y } = nationPos(idx);
        const color = nation.flag_color || "#3b82f6";
        const nationCities = cityByNation[nation.id] || [];
        const isMe = myNation?.id === nation.id;

        return (
          <g key={`cities-${nation.id}`}>
            {/* Capital star */}
            <g
              style={{ cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); setSelectedCity({ type: "capital", nation, x, y }); onCityClick?.({ type: "capital", nation }); }}
              onMouseEnter={() => setHoveredCity({ id: `cap-${nation.id}`, name: `${nation.name} (Capital)`, nation })}
              onMouseLeave={() => setHoveredCity(null)}
            >
              <circle cx={x} cy={y} r={isMe ? 9 : 6}
                fill={color} fillOpacity={0.3}
                stroke={color} strokeWidth={isMe ? 1.8 : 1.2}
                strokeOpacity={0.9}
                className="cm-capital"
                shapeRendering="geometricPrecision"
              />
              {zoom >= 1.4 && (
                <text x={x} y={y + 4} textAnchor="middle" fontSize="8"
                  style={{ pointerEvents: "none", userSelect: "none" }}>🏛</text>
              )}
            </g>

            {/* Player cities */}
            {zoom >= 1.2 && nationCities.map((city, i) => {
              const { dx, dy } = cityOffset(i, nationCities.length);
              const cx2 = x + dx;
              const cy2 = y + dy;
              return (
                <g key={city.id}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setSelectedCity({ type: "city", city, nation, x: cx2, y: cy2 }); onCityClick?.({ type: "city", city, nation }); }}
                  onMouseEnter={() => setHoveredCity({ id: city.id, name: city.city_name, city, nation })}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  {/* Connection line to capital */}
                  <line x1={x} y1={y} x2={cx2} y2={cy2}
                    stroke={color} strokeWidth={0.5} strokeOpacity={0.25}
                    strokeDasharray="2 3" style={{ pointerEvents: "none" }} />
                  <circle cx={cx2} cy={cy2} r={4}
                    fill={color} fillOpacity={0.25}
                    stroke={color} strokeWidth={1}
                    strokeOpacity={0.7}
                    className="cm-glow"
                    shapeRendering="geometricPrecision"
                  />
                  {zoom >= 1.6 && (
                    <text x={cx2 + 6} y={cy2 + 3} fill={color} fontSize="7.5"
                      fontFamily="monospace" opacity={0.8}
                      stroke="#000" strokeWidth="1.5" paintOrder="stroke"
                      style={{ pointerEvents: "none", userSelect: "none" }}>
                      {city.city_name?.split(" ")[0] || "City"}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Hover tooltip */}
      {hoveredCity && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={hoveredCity.nation ? (nationIndexMap[hoveredCity.nation.id] ?? 0) : 0}
            y={0}
            rx={4} ry={4}
            fill="rgba(0,0,0,0.8)"
            style={{ display: "none" }}
          />
        </g>
      )}

      {/* City info panel (HTML overlay) */}
      {selectedCity && (
        <foreignObject x={0} y={0} width="1" height="1" style={{ overflow: "visible" }}>
          <CityInfoPanel
            cityData={selectedCity}
            onClose={() => setSelectedCity(null)}
          />
        </foreignObject>
      )}
    </g>
  );
}