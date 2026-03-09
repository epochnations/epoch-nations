/**
 * HexTileRenderer — renders a single hex tile with rich visuals.
 * Uses pure SVG symbols/gradients — no emoji, universal cross-device.
 */
import { memo } from "react";
import { hexCornersStr, hexCornersStrInner, TERRAIN_CONFIG, RESOURCE_CONFIG, HEX_SIZE } from "./HexEngine";

const TERRAIN_GRAD = {
  ocean:     "url(#grad-ocean)",
  coastal:   "url(#grad-coastal)",
  plains:    "url(#grad-plains)",
  forest:    "url(#grad-forest)",
  desert:    "url(#grad-desert)",
  mountains: "url(#grad-mountains)",
  tundra:    "url(#grad-tundra)",
};

const TERRAIN_OVERLAY = {
  ocean:     "url(#ocean-waves)",
  tundra:    "url(#tundra-dots)",
  desert:    "url(#desert-grain)",
};

const HexTileRenderer = memo(function HexTileRenderer({
  tile, cx, cy, zoom,
  isSelected, isHovered, isMyTerritory, protectionActive,
  isAdjacentToMine,
  onClick, onHover, onLeave,
}) {
  const size = HEX_SIZE;
  const pts  = hexCornersStr(cx, cy, size);
  const ptsInner = hexCornersStrInner(cx, cy, size, 1.5);

  const t = tile.terrain_type || "plains";
  const baseFill = TERRAIN_GRAD[t] || TERRAIN_GRAD.plains;
  const terrainOverlay = TERRAIN_OVERLAY[t];

  const isOwned     = !!tile.owner_nation_id;
  const sw = isSelected ? 3 : isMyTerritory ? 2.2 : isOwned ? 1.8 : (isHovered ? 1.5 : 0.7);
  const ownerColor  = tile.owner_color || "#22d3ee";
  const strokeColor = isSelected
    ? "#fbbf24"
    : protectionActive
    ? "#4ade80"
    : isMyTerritory
    ? "#22d3ee"
    : isOwned
    ? ownerColor
    : isHovered
    ? "rgba(255,255,255,0.4)"
    : "rgba(255,255,255,0.06)";

  const strokeWidth = sw / zoom;

  // Claimed tint overlay color
  const claimTint = isOwned ? hexToRgba(ownerColor, isMyTerritory ? 0.22 : 0.14) : null;

  // Visibility: show details based on zoom
  const showTerrainIcon = zoom > 0.9;
  const showBuildingIcons = zoom > 1.4;
  const showCapital = tile.is_capital && zoom > 0.6;
  const showCityIcon = tile.has_city && !tile.is_capital && zoom > 1.0;
  const showResourceIcon = tile.resource_type !== "none" && zoom > 1.6;
  const showRoads = (tile.infrastructure_level > 0) && zoom > 1.8;
  const showLabel = zoom > 3.5;
  const showNationLabel = isOwned && zoom > 0.5 && zoom < 1.2 && tile.is_capital;

  const iconSize  = size * 0.55;
  const iconHalf  = iconSize / 2;
  const smallIcon = size * 0.3;
  const smallHalf = smallIcon / 2;

  return (
    <g
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick ? () => onClick(tile) : undefined}
      onMouseEnter={onHover ? () => onHover(tile) : undefined}
      onMouseLeave={onLeave}
    >
      {/* ── Base terrain fill ── */}
      <polygon points={pts} fill={baseFill} />

      {/* ── Terrain texture overlay ── */}
      {terrainOverlay && (
        <polygon points={pts} fill={terrainOverlay} opacity="0.7" />
      )}

      {/* ── Ownership tint ── */}
      {claimTint && (
        <polygon points={ptsInner} fill={claimTint} />
      )}

      {/* ── Outer stroke / border ── */}
      <polygon
        points={pts}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        filter={isSelected ? "url(#glow-gold)" : isMyTerritory ? "url(#glow-cyan)" : protectionActive ? "url(#glow-green)" : undefined}
      />

      {/* ── Adjacent-to-mine pulse (buyable highlight) ── */}
      {isAdjacentToMine && !isOwned && (
        <polygon
          points={pts}
          fill="rgba(34,211,238,0.08)"
          stroke="rgba(34,211,238,0.4)"
          strokeWidth={1.5 / zoom}
          strokeDasharray={`${5 / zoom},${3 / zoom}`}
        />
      )}

      {/* ── Protection shimmer ── */}
      {protectionActive && (
        <polygon
          points={pts}
          fill="rgba(74,222,128,0.06)"
          stroke="#4ade80"
          strokeWidth={2 / zoom}
          strokeDasharray={`${4 / zoom},${3 / zoom}`}
        />
      )}

      {/* ── Terrain terrain icon (mid zoom) ── */}
      {showTerrainIcon && !showBuildingIcons && !isOwned && (
        <use
          href={`#terrain-${t}`}
          x={cx - size * 0.5}
          y={cy - size * 0.5}
          width={size}
          height={size}
          opacity={0.55}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* ── Nation flag color circle (capital, global zoom) ── */}
      {showCapital && !showBuildingIcons && (
        <>
          <circle cx={cx} cy={cy} r={size * 0.32}
            fill={ownerColor} opacity={0.85} filter="url(#drop-shadow)" />
          <use
            href="#icon-capital"
            x={cx - size * 0.25} y={cy - size * 0.25}
            width={size * 0.5} height={size * 0.5}
            style={{ pointerEvents: "none" }}
          />
        </>
      )}

      {/* ── Capital icon (closer zoom) ── */}
      {showCapital && showBuildingIcons && (
        <>
          <use
            href="#icon-capital"
            x={cx - iconHalf} y={cy - size * 0.7}
            width={iconSize} height={iconSize}
            style={{ pointerEvents: "none" }}
            filter="url(#drop-shadow)"
          />
          {/* Flag pole */}
          <line x1={cx} y1={cy - size * 0.9} x2={cx} y2={cy - size * 0.3}
            stroke={ownerColor} strokeWidth={1.5 / zoom} />
          <rect x={cx} y={cy - size * 0.9}
            width={size * 0.25} height={size * 0.15}
            fill={ownerColor} rx="1"
            style={{ pointerEvents: "none" }} />
        </>
      )}

      {/* ── City icon ── */}
      {showCityIcon && (
        <use
          href="#icon-city"
          x={cx - iconHalf * 0.8} y={cy - iconHalf * 0.8 - size * 0.05}
          width={iconSize * 0.8} height={iconSize * 0.8}
          style={{ pointerEvents: "none" }}
          filter="url(#drop-shadow)"
          opacity={0.9}
        />
      )}

      {/* ── Military base icon ── */}
      {showBuildingIcons && tile.has_military_base && (
        <use
          href="#icon-military"
          x={cx + size * 0.2} y={cy - size * 0.6}
          width={smallIcon} height={smallIcon}
          style={{ pointerEvents: "none" }}
          filter="url(#drop-shadow)"
        />
      )}

      {/* ── Trade port icon ── */}
      {showBuildingIcons && tile.has_trade_port && (
        <use
          href="#icon-port"
          x={cx - size * 0.5} y={cy - size * 0.6}
          width={smallIcon} height={smallIcon}
          style={{ pointerEvents: "none" }}
          filter="url(#drop-shadow)"
        />
      )}

      {/* ── Roads ── */}
      {showRoads && (
        <>
          <line x1={cx - size * 0.5} y1={cy} x2={cx + size * 0.5} y2={cy}
            stroke="#78716c" strokeWidth={2 / zoom} opacity={0.7} />
          <line x1={cx - size * 0.5} y1={cy} x2={cx + size * 0.5} y2={cy}
            stroke="#d6d3d1" strokeWidth={0.8 / zoom}
            strokeDasharray={`${4 / zoom},${3 / zoom}`} opacity={0.5} />
        </>
      )}

      {/* ── Resource icon ── */}
      {showResourceIcon && (
        <use
          href={`#res-${tile.resource_type}`}
          x={cx - size * 0.22} y={cy + size * 0.1}
          width={size * 0.44} height={size * 0.44}
          style={{ pointerEvents: "none" }}
          filter="url(#drop-shadow)"
        />
      )}

      {/* ── Farm building (if tile has farm) ── */}
      {showBuildingIcons && (tile.buildings || []).includes("Farm") && (
        <use
          href="#icon-farm"
          x={cx - size * 0.45} y={cy + size * 0.05}
          width={smallIcon * 1.1} height={smallIcon * 1.1}
          style={{ pointerEvents: "none" }}
          filter="url(#drop-shadow)"
        />
      )}

      {/* ── Research lab ── */}
      {showBuildingIcons && (tile.buildings || []).includes("Research Lab") && (
        <use
          href="#icon-lab"
          x={cx - smallHalf + size * 0.1} y={cy - smallHalf}
          width={smallIcon} height={smallIcon}
          style={{ pointerEvents: "none" }}
          filter="url(#drop-shadow)"
        />
      )}

      {/* ── Oil rig ── */}
      {showBuildingIcons && (tile.buildings || []).includes("Oil Rig") && (
        <use
          href="#icon-oil"
          x={cx - smallHalf} y={cy - smallHalf - size * 0.1}
          width={smallIcon} height={smallIcon}
          style={{ pointerEvents: "none" }}
          filter="url(#drop-shadow)"
        />
      )}

      {/* ── Nuclear plant ── */}
      {showBuildingIcons && (tile.buildings || []).includes("Nuclear Plant") && (
        <use
          href="#icon-nuclear"
          x={cx - smallHalf} y={cy - smallHalf}
          width={smallIcon * 1.2} height={smallIcon * 1.2}
          style={{ pointerEvents: "none" }}
          filter="url(#drop-shadow)"
        />
      )}

      {/* ── Nation name at capital (global overview) ── */}
      {showNationLabel && (
        <text
          x={cx} y={cy + size * 1.35}
          textAnchor="middle"
          fontSize={size * 0.42}
          fontWeight="bold"
          fill={ownerColor}
          stroke="rgba(0,0,0,0.7)"
          strokeWidth={2 / zoom}
          paintOrder="stroke"
          style={{ pointerEvents: "none", userSelect: "none", fontFamily: "Inter, sans-serif" }}
        >
          {tile.owner_nation_name}
        </text>
      )}

      {/* ── Detailed label at high zoom ── */}
      {showLabel && (
        <text
          x={cx} y={cy + size * 0.68}
          textAnchor="middle"
          fontSize={size * 0.22}
          fill="rgba(255,255,255,0.45)"
          style={{ pointerEvents: "none", userSelect: "none", fontFamily: "monospace" }}
        >
          {tile.terrain_type}
        </text>
      )}
    </g>
  );
});

export default HexTileRenderer;

// ─── Utils ────────────────────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith("#")) return `rgba(100,150,200,${alpha})`;
  const clean = hex.replace("#", "");
  const full  = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}