/**
 * MapNationIcon – ultra-sharp, premium nation icon with rotating orbital rings.
 * All effects are crisp SVG — no raster blur.
 */
import { useRef, useEffect } from "react";

// Inject CSS keyframes once
const STYLE_ID = "map-nation-icon-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .mni-orbit1 { animation: mni-spin1 5s linear infinite; }
    .mni-orbit2 { animation: mni-spin2 8s linear infinite; }
    .mni-orbit3 { animation: mni-spin3 12s linear infinite reverse; }
    .mni-pulse  { animation: mni-pulse 2s ease-in-out infinite; }
    .mni-pulse2 { animation: mni-pulse 2.8s ease-in-out infinite 0.4s; }
    .mni-scan   { animation: mni-scan 3s linear infinite; }
    .mni-war    { animation: mni-war 1.2s ease-in-out infinite; }
    .mni-float  { animation: mni-float 3s ease-in-out infinite; }

    @keyframes mni-spin1 {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes mni-spin2 {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes mni-spin3 {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes mni-pulse {
      0%,100% { opacity: 0.25; r: 0px; }
      50%      { opacity: 0.08; }
    }
    @keyframes mni-scan {
      0%   { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -120; }
    }
    @keyframes mni-war {
      0%,100% { opacity: 0.7; }
      50%      { opacity: 0.15; }
    }
    @keyframes mni-float {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-3px); }
    }
  `;
  document.head.appendChild(s);
}

export default function MapNationIcon({
  nation, x, y, zoom,
  isMe, isAlly, isEnemy, isSelected,
  onClick, onHover, onLeave
}) {
  const color = nation.flag_color || "#3b82f6";
  const size = isMe ? 26 : 20;
  const scale = 1 / Math.max(zoom, 0.35);

  // Glow color variants
  const glowColor = isEnemy ? "#ef4444" : isAlly ? "#10b981" : isMe ? color : color;
  const ringColor  = isEnemy ? "#ef444466" : isAlly ? "#10b98166" : color + "88";

  // Hex points for hexagonal badge
  const hexPts = (r) => Array.from({length:6}, (_,i) => {
    const a = Math.PI / 180 * (60 * i - 30);
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

  const uid = nation.id?.slice(-6) || Math.random().toString(36).slice(2);

  return (
    <g
      transform={`translate(${x},${y}) scale(${scale})`}
      style={{ cursor: "pointer" }}
      onClick={(e) => { e.stopPropagation(); onClick?.(nation); }}
      onMouseEnter={() => onHover?.(nation)}
      onMouseLeave={() => onLeave?.()}
    >
      <defs>
        {/* Radial glow gradient */}
        <radialGradient id={`ng-${uid}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.9"/>
          <stop offset="60%"  stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.0"/>
        </radialGradient>
        {/* Inner shimmer */}
        <radialGradient id={`ns-${uid}`} cx="40%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0"/>
        </radialGradient>
        {/* Flag clip */}
        <clipPath id={`fc-${uid}`}>
          <circle cx={0} cy={0} r={size - 3}/>
        </clipPath>
        {/* Drop shadow filter */}
        <filter id={`nf-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.6"/>
        </filter>
      </defs>

      {/* ── Ground shadow ellipse ── */}
      <ellipse cx={0} cy={size + 5} rx={size * 0.65} ry={3.5}
        fill="#000000" opacity="0.35"/>

      {/* ── Outer ambient glow halo (large, soft) ── */}
      <circle cx={0} cy={0} r={size + 18}
        fill={`url(#ng-${uid})`} style={{ pointerEvents: "none" }}/>

      {/* ── ORBITAL RING 1 – fast thin dashed arc ── */}
      <g style={{ transformOrigin: "0px 0px" }} className="mni-orbit1">
        <circle cx={0} cy={0} r={size + 10}
          fill="none" stroke={color} strokeWidth="0.8" opacity="0.55"
          strokeDasharray="6 4"
          shapeRendering="geometricPrecision"/>
        {/* Bright dot on ring */}
        <circle cx={size + 10} cy={0} r={1.8} fill={color} opacity="0.9"/>
      </g>

      {/* ── ORBITAL RING 2 – medium dashed, tilted look ── */}
      {(isMe || isSelected || isAlly || isEnemy) && (
        <g style={{ transformOrigin: "0px 0px" }} className="mni-orbit2">
          <ellipse cx={0} cy={0} rx={size + 16} ry={(size + 16) * 0.45}
            fill="none" stroke={ringColor} strokeWidth="1.2" opacity="0.7"
            strokeDasharray="12 8"
            shapeRendering="geometricPrecision"/>
          {/* Bright dot */}
          <circle cx={size + 16} cy={0} r={2} fill={glowColor} opacity="0.85"/>
          <circle cx={-(size + 16)} cy={0} r={1.4} fill={glowColor} opacity="0.6"/>
        </g>
      )}

      {/* ── ORBITAL RING 3 – reverse slow, only for me or selected ── */}
      {(isMe || isSelected) && (
        <g style={{ transformOrigin: "0px 0px" }} className="mni-orbit3">
          <circle cx={0} cy={0} r={size + 22}
            fill="none" stroke={color} strokeWidth="0.6" opacity="0.35"
            strokeDasharray="3 9"
            shapeRendering="geometricPrecision"/>
        </g>
      )}

      {/* ── War pulsing ring ── */}
      {isEnemy && (
        <circle cx={0} cy={0} r={size + 8}
          fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7"
          strokeDasharray="4 3" className="mni-war"
          shapeRendering="geometricPrecision"/>
      )}

      {/* ── Scan-line ring for selected ── */}
      {isSelected && (
        <circle cx={0} cy={0} r={size + 5}
          fill="none" stroke={color} strokeWidth="1.5" opacity="0.9"
          strokeDasharray="30 90" className="mni-scan"
          shapeRendering="geometricPrecision"/>
      )}

      {/* ── Main body: hexagonal outline for "me", circle for others ── */}
      {isMe ? (
        <>
          {/* Hex outer glow */}
          <polygon points={hexPts(size + 6)}
            fill="none" stroke={color} strokeWidth="1" opacity="0.4"
            shapeRendering="geometricPrecision"/>
          {/* Hex body fill */}
          <polygon points={hexPts(size)}
            fill={color + "28"} stroke={color} strokeWidth={2}
            shapeRendering="geometricPrecision"
            filter={`url(#nf-${uid})`}/>
        </>
      ) : (
        <circle cx={0} cy={0} r={size}
          fill={color + "22"} stroke={color} strokeWidth={isEnemy ? 2 : isAlly ? 1.8 : 1.5}
          shapeRendering="geometricPrecision"
          filter={`url(#nf-${uid})`}/>
      )}

      {/* ── Flag image or emoji ── */}
      {nation.flag_image_url ? (
        <image
          href={nation.flag_image_url}
          x={-(size-3)} y={-(size-3)}
          width={(size-3)*2} height={(size-3)*2}
          clipPath={`url(#fc-${uid})`}
          preserveAspectRatio="xMidYMid slice"
          imageRendering="crisp-edges"
        />
      ) : (
        <text x={0} y={isMe ? 9 : 7} textAnchor="middle"
          fontSize={isMe ? 22 : 16}
          style={{ userSelect: "none", pointerEvents: "none" }}>
          {nation.flag_emoji || "🏴"}
        </text>
      )}

      {/* ── Inner shimmer highlight (top-left gloss) ── */}
      <circle cx={0} cy={0} r={size}
        fill={`url(#ns-${uid})`} style={{ pointerEvents: "none" }}/>

      {/* ── Status badge ── */}
      {isEnemy && (
        <g transform={`translate(${size - 1},${-(size - 1)})`}>
          <circle cx={0} cy={0} r={7} fill="#ef4444" stroke="#1a0000" strokeWidth="1"
            shapeRendering="geometricPrecision"/>
          <text x={0} y={4} textAnchor="middle" fontSize="9"
            style={{ userSelect: "none" }}>⚔</text>
        </g>
      )}
      {isAlly && !isEnemy && (
        <g transform={`translate(${size - 1},${-(size - 1)})`}>
          <circle cx={0} cy={0} r={7} fill="#10b981" stroke="#001a0f" strokeWidth="1"
            shapeRendering="geometricPrecision"/>
          <text x={0} y={4} textAnchor="middle" fontSize="8"
            style={{ userSelect: "none" }}>✦</text>
        </g>
      )}
      {isMe && (
        <g transform={`translate(${size - 1},${-(size - 1)})`}>
          <circle cx={0} cy={0} r={7} fill={color} stroke="#000" strokeWidth="1"
            shapeRendering="geometricPrecision"/>
          <text x={0} y={4} textAnchor="middle" fontSize="8" fill="white"
            fontWeight="bold" style={{ userSelect: "none" }}>★</text>
        </g>
      )}

      {/* ── Tech level tick marks on ring ── */}
      {Array.from({ length: Math.min(nation.tech_level || 1, 8) }).map((_, i) => {
        const angle = (360 / Math.min(nation.tech_level || 1, 8)) * i * Math.PI / 180;
        const r2 = size + 10;
        return (
          <line key={i}
            x1={(r2 - 3) * Math.cos(angle)} y1={(r2 - 3) * Math.sin(angle)}
            x2={(r2 + 3) * Math.cos(angle)} y2={(r2 + 3) * Math.sin(angle)}
            stroke={color} strokeWidth="1.5" opacity="0.6"
            shapeRendering="crispEdges"/>
        );
      })}

      {/* ── Nation name label ── */}
      {zoom > 1.2 && (
        <text x={0} y={size + 16} textAnchor="middle"
          fill="white" fontSize="9.5"
          fontFamily="'Inter', 'SF Pro Display', system-ui, monospace"
          fontWeight="600"
          letterSpacing="0.5"
          stroke="#000000" strokeWidth="2.5" paintOrder="stroke"
          shapeRendering="geometricPrecision"
          style={{ userSelect: "none", pointerEvents: "none" }}>
          {nation.name}
        </text>
      )}

      {/* ── Epoch tag (tiny, below name) ── */}
      {zoom > 1.8 && (
        <text x={0} y={size + 27} textAnchor="middle"
          fill={color} fontSize="7.5"
          fontFamily="'Inter', system-ui, monospace"
          fontWeight="500"
          stroke="#000000" strokeWidth="2" paintOrder="stroke"
          opacity="0.85"
          style={{ userSelect: "none", pointerEvents: "none" }}>
          {nation.epoch || "Stone Age"}
        </text>
      )}
    </g>
  );
}