/**
 * IslandHex — SVG island tile with development level visuals.
 * Visual evolves: Outpost → Settlement → Town → City → Capital
 */
import { hexToWorld, hexCornerPoints, seededRand, TERRAIN_CONFIG, HEX_SIZE } from "../HexOceanMap";

const DEV_VISUALS = [
  { label: "Ocean",    icons: [] },
  { label: "Outpost",  icons: ["🏕️"] },
  { label: "Settlement", icons: ["🏠","🏠"] },
  { label: "Town",     icons: ["🏘️","⛪"] },
  { label: "City",     icons: ["🏙️","🏭"] },
  { label: "Capital",  icons: ["🏯","🌆","⭐"] },
];

export default function IslandHex({ tile, myNation, isSelected, zoom }) {
  const { q, r } = tile;
  const { x: cx, y: cy } = hexToWorld(q, r);
  const cfg = TERRAIN_CONFIG[tile.terrain_type] || TERRAIN_CONFIG.tropical;

  const isMe = tile.owner_nation_id === myNation?.id;
  const isAlly = (myNation?.allies||[]).includes(tile.owner_nation_id);
  const isEnemy = (myNation?.at_war_with||[]).includes(tile.owner_nation_id);

  // Organic shape
  const rx = HEX_SIZE * 0.62 + (seededRand(q, r, 10) - 0.5) * HEX_SIZE * 0.07;
  const ry = HEX_SIZE * 0.52 + (seededRand(q, r, 11) - 0.5) * HEX_SIZE * 0.07;
  const ox = (seededRand(q, r, 12) - 0.5) * HEX_SIZE * 0.12;
  const oy = (seededRand(q, r, 13) - 0.5) * HEX_SIZE * 0.12;

  // Terrain detail blobs
  const blobs = Array.from({ length: 4 }, (_, i) => ({
    bx: cx + ox + (seededRand(q, r, 20+i) - 0.5) * rx * 0.85,
    by: cy + oy + (seededRand(q, r, 30+i) - 0.5) * ry * 0.85,
    br: HEX_SIZE * (0.08 + seededRand(q, r, 40+i) * 0.13),
  }));

  const borderColor = isSelected
    ? "#fbbf24"
    : isMe ? "#22d3ee"
    : isEnemy ? "#ef4444"
    : isAlly ? "#4ade80"
    : tile.owner_nation_id ? (tile.owner_color||"#888")
    : "rgba(255,255,255,0.12)";
  const borderW = isSelected || isMe ? 2.8 : (isEnemy || isAlly) ? 2 : tile.owner_nation_id ? 1.8 : 0.8;

  const level = Math.min(5, tile.infrastructure_level || 0);
  const devLabel = DEV_VISUALS[level]?.label || "Outpost";

  const hexPts = hexCornerPoints(cx, cy);

  const glowFilter = isSelected ? "url(#hoverGlow)" : isMe ? "url(#myGlow)" : isEnemy ? "url(#enemyGlow)" : isAlly ? "url(#myGlow)" : "none";

  return (
    <g style={{ cursor: "pointer" }} filter={glowFilter}>
      {/* Shallow water base */}
      <polygon points={hexPts} fill="#1a5a8a" opacity="0.65"/>

      {/* Animated shimmer ring for my islands */}
      {isMe && (
        <polygon points={hexPts} fill="none" stroke="#22d3ee" strokeWidth="2">
          <animate attributeName="stroke-opacity" values="0.6;0.15;0.6" dur="2.5s" repeatCount="indefinite"/>
        </polygon>
      )}

      {/* Shore/beach ring */}
      <ellipse cx={cx+ox} cy={cy+oy} rx={rx+HEX_SIZE*0.1} ry={ry+HEX_SIZE*0.09}
        fill={cfg.shore} opacity="0.82"/>

      {/* Land mass */}
      <ellipse cx={cx+ox} cy={cy+oy} rx={rx} ry={ry} fill={cfg.land}/>

      {/* Terrain detail blobs */}
      {blobs.map((b, i) => (
        <circle key={i} cx={b.bx} cy={b.by} r={b.br} fill={cfg.deep} opacity="0.5"/>
      ))}

      {/* Development level buildings (appear as small dots at low zoom, emojis at high zoom) */}
      {level >= 2 && zoom > 1.2 && (
        <>
          <circle cx={cx+ox-rx*0.3} cy={cy+oy-ry*0.15} r={HEX_SIZE*0.07} fill="#2d3748" opacity="0.9"/>
          <circle cx={cx+ox+rx*0.3} cy={cy+oy+ry*0.1} r={HEX_SIZE*0.07} fill="#2d3748" opacity="0.9"/>
        </>
      )}
      {level >= 3 && zoom > 1.2 && (
        <rect x={cx+ox-rx*0.25} y={cy+oy-ry*0.3} width={HEX_SIZE*0.22} height={HEX_SIZE*0.18}
          rx="2" fill="#1e3a5f" opacity="0.85"/>
      )}
      {level >= 4 && zoom > 1.0 && (
        <>
          <rect x={cx+ox+rx*0.1} y={cy+oy-ry*0.4} width={HEX_SIZE*0.18} height={HEX_SIZE*0.28}
            rx="2" fill="#1e293b" opacity="0.9"/>
          <rect x={cx+ox-rx*0.4} y={cy+oy+ry*0.15} width={HEX_SIZE*0.15} height={HEX_SIZE*0.18}
            rx="2" fill="#1e293b" opacity="0.8"/>
        </>
      )}
      {level >= 5 && zoom > 0.9 && (
        <>
          <polygon points={`${cx+ox},${cy+oy-ry*0.6} ${cx+ox-rx*0.15},${cy+oy-ry*0.3} ${cx+ox+rx*0.15},${cy+oy-ry*0.3}`}
            fill="#0f172a" opacity="0.9"/>
          <rect x={cx+ox-rx*0.08} y={cy+oy-ry*0.55} width={HEX_SIZE*0.1} height={HEX_SIZE*0.35}
            fill="#1e3a5f" opacity="0.95"/>
        </>
      )}

      {/* Hex territory border */}
      <polygon points={hexPts} fill="none" stroke={borderColor} strokeWidth={borderW} opacity="0.85"/>

      {/* Selection/war flashing overlay */}
      {isSelected && (
        <polygon points={hexPts} fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="2.5">
          <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
        </polygon>
      )}
      {isEnemy && !isSelected && (
        <polygon points={hexPts} fill="rgba(239,68,68,0.06)">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
        </polygon>
      )}

      {/* Owner flag (medium zoom) */}
      {zoom > 0.4 && tile.owner_nation_id && (
        <text x={cx} y={cy+oy+ry*0.62}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={HEX_SIZE * (zoom > 1.5 ? 0.33 : 0.29)}
          style={{ pointerEvents:"none", userSelect:"none" }}>
          {tile.owner_flag||"🏴"}
        </text>
      )}

      {/* Capital star */}
      {tile.is_capital && zoom > 0.6 && (
        <text x={cx+ox} y={cy+oy-ry*0.7}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={HEX_SIZE * 0.2}
          style={{ pointerEvents:"none", userSelect:"none" }}>
          ⭐
        </text>
      )}

      {/* Development label at high zoom */}
      {zoom > 1.8 && level > 0 && (
        <text x={cx+ox} y={cy+oy+ry+HEX_SIZE*0.22}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={HEX_SIZE * 0.16} fill="rgba(255,255,255,0.5)"
          style={{ pointerEvents:"none", userSelect:"none" }}>
          {devLabel}
        </text>
      )}

      {/* Trade port anchor */}
      {tile.has_trade_port && zoom > 1.0 && (
        <text x={cx+ox+rx*0.7} y={cy+oy+ry*0.7}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={HEX_SIZE * 0.22}
          style={{ pointerEvents:"none", userSelect:"none" }}>
          ⚓
        </text>
      )}

      {/* Military base */}
      {tile.has_military_base && zoom > 1.0 && (
        <text x={cx+ox-rx*0.7} y={cy+oy-ry*0.7}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={HEX_SIZE * 0.22}
          style={{ pointerEvents:"none", userSelect:"none" }}>
          🏰
        </text>
      )}
    </g>
  );
}