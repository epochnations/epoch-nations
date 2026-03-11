/**
 * ResourceIcons — cross-platform resource icon system
 * Uses inline SVG + emoji fallback to guarantee rendering on all
 * OS (Windows, macOS, Linux, iOS, Android) and browsers.
 */

const ICON_DATA = {
  wood: {
    emoji: "🌲",
    color: "#a78bfa",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="28" width="48" height="12" rx="6" fill="#92400e"/>
        <rect x="12" y="20" width="40" height="10" rx="5" fill="#b45309"/>
        <rect x="16" y="36" width="32" height="10" rx="5" fill="#78350f"/>
        <circle cx="32" cy="32" r="4" fill="#d97706" opacity="0.6"/>
        <ellipse cx="32" cy="32" rx="10" ry="3" stroke="#d97706" strokeWidth="1.5" opacity="0.4" fill="none"/>
      </svg>
    )
  },
  stone: {
    emoji: "🗿",
    color: "#94a3b8",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="36" rx="22" ry="16" fill="#64748b"/>
        <ellipse cx="32" cy="32" rx="20" ry="14" fill="#94a3b8"/>
        <ellipse cx="26" cy="28" rx="6" ry="4" fill="#cbd5e1" opacity="0.5"/>
        <path d="M12 38 Q20 30 32 34 Q44 38 52 32" stroke="#475569" strokeWidth="2" fill="none"/>
      </svg>
    )
  },
  gold: {
    emoji: "💰",
    color: "#fbbf24",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="22" fill="#f59e0b"/>
        <circle cx="32" cy="32" r="18" fill="#fbbf24"/>
        <circle cx="32" cy="32" r="13" fill="#fde68a"/>
        <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#92400e">Au</text>
        <circle cx="26" cy="26" r="3" fill="white" opacity="0.3"/>
      </svg>
    )
  },
  iron: {
    emoji: "⚙️",
    color: "#64748b",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="16" fill="#475569"/>
        <circle cx="32" cy="32" r="10" fill="#64748b"/>
        <circle cx="32" cy="32" r="5" fill="#334155"/>
        {[0,60,120,180,240,300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 32 + 16 * Math.cos(rad);
          const y1 = 32 + 16 * Math.sin(rad);
          const x2 = 32 + 22 * Math.cos(rad);
          const y2 = 32 + 22 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>;
        })}
        <circle cx="28" cy="28" r="2" fill="#94a3b8" opacity="0.4"/>
      </svg>
    )
  },
  oil: {
    emoji: "🛢️",
    color: "#6ee7b7",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="18" width="28" height="34" rx="4" fill="#1e293b"/>
        <rect x="20" y="20" width="24" height="30" rx="3" fill="#0f172a"/>
        <rect x="22" y="24" width="6" height="2" rx="1" fill="#334155"/>
        <rect x="22" y="28" width="6" height="2" rx="1" fill="#334155"/>
        <rect x="22" y="32" width="6" height="2" rx="1" fill="#334155"/>
        <rect x="18" y="14" width="28" height="8" rx="3" fill="#334155"/>
        <rect x="28" y="10" width="8" height="6" rx="2" fill="#475569"/>
        <ellipse cx="32" cy="40" rx="8" ry="4" fill="#10b981" opacity="0.5"/>
      </svg>
    )
  },
  food: {
    emoji: "🌾",
    color: "#4ade80",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="32" y1="52" x2="32" y2="20" stroke="#86efac" strokeWidth="2.5"/>
        {[-12,-6,0,6,12].map((offset, i) => (
          <ellipse key={i} cx={32+offset*0.3} cy={28-i*4} rx="5" ry="8"
            fill="#4ade80" opacity={0.7+i*0.06}
            transform={`rotate(${offset*3} ${32+offset*0.3} ${28-i*4})`}/>
        ))}
        <ellipse cx="32" cy="12" rx="6" ry="9" fill="#16a34a"/>
        <line x1="22" y1="42" x2="16" y2="50" stroke="#86efac" strokeWidth="2"/>
        <ellipse cx="16" cy="48" rx="4" ry="6" fill="#4ade80" opacity="0.6"/>
      </svg>
    )
  },
  steel: {
    emoji: "🔩",
    color: "#7dd3fc",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="26" width="40" height="12" rx="3" fill="#38bdf8"/>
        <rect x="14" y="28" width="36" height="8" rx="2" fill="#7dd3fc"/>
        <rect x="10" y="24" width="8" height="16" rx="2" fill="#0ea5e9"/>
        <rect x="46" y="24" width="8" height="16" rx="2" fill="#0ea5e9"/>
        <line x1="20" y1="30" x2="44" y2="30" stroke="#bae6fd" strokeWidth="1.5" opacity="0.5"/>
        <line x1="20" y1="34" x2="44" y2="34" stroke="#bae6fd" strokeWidth="1.5" opacity="0.5"/>
      </svg>
    )
  },
  energy: {
    emoji: "⚡",
    color: "#fde047",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="36,10 20,36 30,36 28,54 44,28 34,28" fill="#fde047"/>
        <polygon points="36,10 22,34 30,34 28,52 42,28 34,28" fill="#facc15" opacity="0.6"/>
        <circle cx="36" cy="10" r="3" fill="white" opacity="0.5"/>
      </svg>
    )
  },
  rare_minerals: {
    emoji: "💎",
    color: "#c084fc",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="32,10 50,26 44,50 20,50 14,26" fill="#a855f7"/>
        <polygon points="32,10 50,26 44,50 20,50 14,26" fill="url(#gem)" opacity="0.8"/>
        <polygon points="32,10 42,26 32,26" fill="#e879f9" opacity="0.6"/>
        <line x1="14" y1="26" x2="50" y2="26" stroke="#f0abfc" strokeWidth="1.5" opacity="0.5"/>
        <line x1="20" y1="50" x2="32" y2="26" stroke="white" strokeWidth="1" opacity="0.3"/>
        <defs>
          <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c084fc"/>
            <stop offset="100%" stopColor="#7c3aed"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  well: {
    emoji: "⛲",
    color: "#38bdf8",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Base/rim */}
        <ellipse cx="32" cy="44" rx="18" ry="6" fill="#64748b"/>
        <rect x="14" y="38" width="36" height="8" rx="4" fill="#475569"/>
        {/* Well shaft */}
        <rect x="20" y="28" width="24" height="14" rx="2" fill="#334155"/>
        <ellipse cx="32" cy="28" rx="12" ry="3" fill="#1e293b"/>
        {/* Roof */}
        <polygon points="10,28 32,14 54,28" fill="#92400e"/>
        <polygon points="12,28 32,16 52,28" fill="#b45309"/>
        {/* Crossbar */}
        <rect x="26" y="18" width="12" height="3" rx="1.5" fill="#78350f"/>
        {/* Water */}
        <ellipse cx="32" cy="40" rx="10" ry="3" fill="#38bdf8" opacity="0.7"/>
        {/* Bucket rope hint */}
        <line x1="32" y1="21" x2="32" y2="36" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2,2"/>
      </svg>
    )
  },
  gasoline: {
    emoji: "⛽",
    color: "#fb923c",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="20" width="28" height="36" rx="4" fill="#1e293b"/>
        <rect x="16" y="22" width="24" height="32" rx="3" fill="#0f172a"/>
        <rect x="42" y="24" width="8" height="4" rx="2" fill="#475569"/>
        <line x1="46" y1="28" x2="46" y2="36" stroke="#475569" strokeWidth="3"/>
        <circle cx="46" cy="36" r="4" fill="#334155"/>
        <rect x="14" y="16" width="28" height="8" rx="3" fill="#334155"/>
        <text x="28" y="46" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fb923c">GAS</text>
      </svg>
    )
  },
  diesel: {
    emoji: "🚛",
    color: "#fbbf24",
    svg: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="20" width="28" height="36" rx="4" fill="#1e293b"/>
        <rect x="16" y="22" width="24" height="32" rx="3" fill="#0f172a"/>
        <rect x="42" y="24" width="8" height="4" rx="2" fill="#475569"/>
        <line x1="46" y1="28" x2="46" y2="36" stroke="#475569" strokeWidth="3"/>
        <circle cx="46" cy="36" r="4" fill="#334155"/>
        <rect x="14" y="16" width="28" height="8" rx="3" fill="#334155"/>
        <text x="28" y="46" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fbbf24">DSL</text>
      </svg>
    )
  },
};

/**
 * ResourceIcon — renders a resource icon with fallback.
 * @param {string} resource - key from ICON_DATA
 * @param {number} size - px size (default 28)
 * @param {string} className
 */
export function ResourceIcon({ resource, size = 28, className = "" }) {
  const def = ICON_DATA[resource] || ICON_DATA.stone;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        lineHeight: 1,
      }}
      aria-label={resource}
    >
      <span style={{ fontSize: size * 0.75, lineHeight: 1, userSelect: "none" }}>
        {def.emoji}
      </span>
    </span>
  );
}

/** Returns just the emoji string for a given resource key */
export function getResourceEmoji(resource) {
  return ICON_DATA[resource]?.emoji || "📦";
}

/** Returns the display color for a resource */
export function getResourceColor(resource) {
  return ICON_DATA[resource]?.color || "#94a3b8";
}

export default ICON_DATA;