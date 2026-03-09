/**
 * HexTileRenderer — renders a single hex tile on the SVG canvas.
 */
import { memo } from "react";
import { hexCornersStr, TERRAIN_CONFIG, RESOURCE_CONFIG, HEX_SIZE } from "./HexEngine";

const HexTileRenderer = memo(function HexTileRenderer({
  tile, cx, cy, zoom, isSelected, isHovered,
  isMyTerritory, isBorderTile, protectionActive,
  onClick, onHover, onLeave,
}) {
  const terrain = TERRAIN_CONFIG[tile.terrain_type] || TERRAIN_CONFIG.plains;
  const resource = RESOURCE_CONFIG[tile.resource_type] || RESOURCE_CONFIG.none;
  const size = HEX_SIZE;

  // Owned territory styling
  let fillColor = terrain.fill;
  let strokeColor = terrain.stroke;
  let strokeW = 0.8;
  let opacity = 1;

  if (tile.owner_nation_id) {
    // Tint with owner color
    fillColor = tile.owner_color
      ? blendColor(terrain.fill, tile.owner_color, 0.30)
      : terrain.fill;
    strokeColor = tile.owner_color || terrain.stroke;
    strokeW = 1.5;
  }

  if (isMyTerritory) {
    strokeW = 2;
    strokeColor = "#22d3ee";
  }
  if (isSelected) { strokeColor = "#f59e0b"; strokeW = 2.5; }
  if (isHovered)  { strokeW = 2; opacity = 0.9; }
  if (protectionActive) { strokeColor = "#4ade80"; strokeW = 2; }

  const pts = hexCornersStr(cx, cy, size);

  const showLabel = zoom > 2.5;
  const showResource = zoom > 1.8 && tile.resource_type !== "none";
  const showCity = tile.has_city && zoom > 1.2;
  const showCapital = tile.is_capital && zoom > 0.8;
  const fontSize = size * 0.28;

  return (
    <g
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick ? () => onClick(tile) : undefined}
      onMouseEnter={onHover ? () => onHover(tile) : undefined}
      onMouseLeave={onLeave}
    >
      {/* Base hex */}
      <polygon
        points={pts}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeW / zoom}
        opacity={opacity}
      />

      {/* Protection shimmer */}
      {protectionActive && (
        <polygon
          points={pts}
          fill="rgba(74,222,128,0.07)"
          stroke="#4ade80"
          strokeWidth={2 / zoom}
          strokeDasharray={`${4 / zoom},${3 / zoom}`}
        />
      )}

      {/* Capital marker */}
      {showCapital && (
        <text x={cx} y={cy - size * 0.35} textAnchor="middle"
          fontSize={size * 0.5} style={{ pointerEvents: "none", userSelect: "none" }}>
          {tile.owner_flag || "🏴"}
        </text>
      )}

      {/* City dot */}
      {showCity && !showCapital && (
        <circle cx={cx} cy={cy - size * 0.15}
          r={size * 0.16} fill="#fbbf24" stroke="#92400e" strokeWidth={0.8 / zoom} />
      )}

      {/* Resource icon */}
      {showResource && (
        <text x={cx} y={cy + size * 0.22} textAnchor="middle"
          fontSize={size * 0.36} style={{ pointerEvents: "none", userSelect: "none" }}>
          {resource.emoji}
        </text>
      )}

      {/* Terrain label */}
      {showLabel && (
        <text x={cx} y={cy + size * 0.52} textAnchor="middle"
          fontSize={fontSize} fill="rgba(255,255,255,0.5)"
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {tile.terrain_type}
        </text>
      )}

      {/* Military base */}
      {tile.has_military_base && zoom > 1.5 && (
        <text x={cx + size * 0.35} y={cy - size * 0.3} fontSize={size * 0.3}
          textAnchor="middle" style={{ pointerEvents: "none", userSelect: "none" }}>⚔</text>
      )}

      {/* Trade port */}
      {tile.has_trade_port && zoom > 1.5 && (
        <text x={cx - size * 0.35} y={cy - size * 0.3} fontSize={size * 0.3}
          textAnchor="middle" style={{ pointerEvents: "none", userSelect: "none" }}>🚢</text>
      )}
    </g>
  );
});

export default HexTileRenderer;

// Simple color blend utility
function blendColor(hexBase, hexOwner, t) {
  try {
    const b = hexToRgb(hexBase);
    const o = hexToRgb(hexOwner);
    if (!b || !o) return hexBase;
    const r = Math.round(b.r * (1 - t) + o.r * t);
    const g = Math.round(b.g * (1 - t) + o.g * t);
    const bl = Math.round(b.b * (1 - t) + o.b * t);
    return `rgb(${r},${g},${bl})`;
  } catch { return hexBase; }
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith("#")) return null;
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}