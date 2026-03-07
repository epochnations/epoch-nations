/**
 * MapNationIcon – renders a nation pin on the SVG map.
 * Uses custom flag image if available, else emoji.
 */
export default function MapNationIcon({
  nation, x, y, zoom,
  isMe, isAlly, isEnemy, isSelected,
  onClick, onHover, onLeave
}) {
  const color = nation.flag_color || "#3b82f6";
  const size = isMe ? 28 : 22;

  // Scale pin inversely so it stays same screen size regardless of zoom
  const scale = 1 / Math.max(zoom, 0.4);

  return (
    <g
      transform={`translate(${x},${y}) scale(${scale})`}
      style={{ cursor: "pointer" }}
      onClick={(e) => { e.stopPropagation(); onClick?.(nation); }}
      onMouseEnter={() => onHover?.(nation)}
      onMouseLeave={() => onLeave?.()}
    >
      {/* Shadow */}
      <ellipse cx={0} cy={size + 4} rx={size * 0.6} ry={4} fill="#000" opacity="0.25"/>

      {/* Pin body */}
      <circle cx={0} cy={0} r={size}
        fill={color + "33"} stroke={color} strokeWidth={isMe ? 2.5 : 1.5} opacity={0.95}/>

      {/* Flag image or emoji */}
      {nation.flag_image_url ? (
        <>
          <defs>
            <clipPath id={`flag-clip-${nation.id}`}>
              <circle cx={0} cy={0} r={size - 3}/>
            </clipPath>
          </defs>
          <image
            href={nation.flag_image_url}
            x={-(size-3)} y={-(size-3)}
            width={(size-3)*2} height={(size-3)*2}
            clipPath={`url(#flag-clip-${nation.id})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : (
        <text x={0} y={8} textAnchor="middle" fontSize={size === 28 ? 22 : 17}>
          {nation.flag_emoji || "🏴"}
        </text>
      )}

      {/* Status badge */}
      {isEnemy && (
        <text x={size - 2} y={-(size - 6)} fontSize="14" textAnchor="middle">⚔️</text>
      )}
      {isAlly && !isEnemy && (
        <text x={size - 2} y={-(size - 6)} fontSize="12" textAnchor="middle">🤝</text>
      )}
      {isMe && (
        <circle cx={0} cy={0} r={size + 4} fill="none" stroke={color} strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values={`${size+2};${size+8};${size+2}`} dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>
      )}

      {/* Name label (shown at higher zoom) */}
      {zoom > 1.2 && (
        <text x={0} y={size + 14} textAnchor="middle"
          fill="white" fontSize="10" fontFamily="monospace"
          stroke="#000" strokeWidth="2" paintOrder="stroke"
          style={{ userSelect: "none" }}>
          {nation.name}
        </text>
      )}
    </g>
  );
}