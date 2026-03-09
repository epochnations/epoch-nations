/**
 * HexDefs — SVG <defs> block: gradients, filters, patterns, and
 * universal icon symbols used across all hex tiles.
 * All icons are pure SVG — no emoji, no external images.
 */
export default function HexDefs() {
  return (
    <defs>
      {/* ── Terrain gradient fills ── */}
      <radialGradient id="grad-ocean" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#1a5276" />
        <stop offset="100%" stopColor="#0b2040" />
      </radialGradient>
      <radialGradient id="grad-coastal" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#2e86c1" />
        <stop offset="100%" stopColor="#154360" />
      </radialGradient>
      <radialGradient id="grad-plains" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#2ecc71" />
        <stop offset="100%" stopColor="#145a27" />
      </radialGradient>
      <radialGradient id="grad-forest" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#1e8449" />
        <stop offset="100%" stopColor="#0b3d1e" />
      </radialGradient>
      <radialGradient id="grad-desert" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#d4ac0d" />
        <stop offset="100%" stopColor="#6e4c07" />
      </radialGradient>
      <radialGradient id="grad-mountains" cx="50%" cy="20%" r="70%">
        <stop offset="0%" stopColor="#85929e" />
        <stop offset="100%" stopColor="#2c3e50" />
      </radialGradient>
      <radialGradient id="grad-tundra" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#a9cce3" />
        <stop offset="100%" stopColor="#2e4057" />
      </radialGradient>

      {/* ── Animated ocean shimmer ── */}
      <filter id="blur-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>

      {/* ── Glow filter ── */}
      <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
        <feFlood floodColor="#22d3ee" floodOpacity="0.6" result="color" />
        <feComposite in="color" in2="SourceGraphic" operator="in" result="shadow" />
        <feGaussianBlur in="shadow" stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
        <feFlood floodColor="#fbbf24" floodOpacity="0.7" result="color" />
        <feComposite in="color" in2="SourceGraphic" operator="in" result="shadow" />
        <feGaussianBlur in="shadow" stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
        <feFlood floodColor="#ef4444" floodOpacity="0.7" result="color" />
        <feComposite in="color" in2="SourceGraphic" operator="in" result="shadow" />
        <feGaussianBlur in="shadow" stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
        <feFlood floodColor="#4ade80" floodOpacity="0.6" result="color" />
        <feComposite in="color" in2="SourceGraphic" operator="in" result="shadow" />
        <feGaussianBlur in="shadow" stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="rgba(0,0,0,0.6)" />
      </filter>

      {/* ── Water animated stripe pattern ── */}
      <pattern id="ocean-waves" x="0" y="0" width="18" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 4.5 Q4.5 0 9 4.5 Q13.5 9 18 4.5" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none"/>
      </pattern>

      {/* ── Snow pattern for tundra ── */}
      <pattern id="tundra-dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="0.8" fill="rgba(255,255,255,0.15)"/>
      </pattern>

      {/* ── Sand grain for desert ── */}
      <pattern id="desert-grain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="none"/>
        <circle cx="1" cy="1" r="0.5" fill="rgba(255,255,255,0.06)"/>
        <circle cx="4" cy="3" r="0.4" fill="rgba(255,255,255,0.04)"/>
        <circle cx="2" cy="5" r="0.5" fill="rgba(255,255,255,0.05)"/>
      </pattern>

      {/* ══════════════════════════════════════════
          UNIVERSAL SVG BUILDING ICONS (symbols)
          All use viewBox="0 0 24 24", no emoji,
          works on all browsers/devices/OS.
          ══════════════════════════════════════════ */}

      {/* Capital / Palace */}
      <symbol id="icon-capital" viewBox="0 0 24 24">
        <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="#fbbf24" stroke="#92400e" strokeWidth="1"/>
      </symbol>

      {/* City */}
      <symbol id="icon-city" viewBox="0 0 24 24">
        <rect x="2" y="12" width="4" height="10" fill="#94a3b8"/>
        <rect x="7" y="8"  width="4" height="14" fill="#cbd5e1"/>
        <rect x="13" y="10" width="4" height="12" fill="#94a3b8"/>
        <rect x="18" y="6"  width="4" height="16" fill="#cbd5e1"/>
        <rect x="0" y="20" width="24" height="2" fill="#475569"/>
        <rect x="9" y="4" width="2" height="4" fill="#fbbf24"/>
      </symbol>

      {/* Military Base / Fort */}
      <symbol id="icon-military" viewBox="0 0 24 24">
        <rect x="4" y="8" width="16" height="12" rx="1" fill="#475569"/>
        <polygon points="4,8 8,4 16,4 20,8" fill="#374151"/>
        <rect x="10" y="13" width="4" height="7" fill="#1e293b"/>
        <rect x="3" y="7" width="3" height="4" fill="#374151"/>
        <rect x="18" y="7" width="3" height="4" fill="#374151"/>
        <line x1="12" y1="4" x2="12" y2="1" stroke="#ef4444" strokeWidth="1.5"/>
        <rect x="11" y="1" width="4" height="2.5" fill="#ef4444"/>
      </symbol>

      {/* Trade Port / Harbor */}
      <symbol id="icon-port" viewBox="0 0 24 24">
        <rect x="2" y="16" width="20" height="3" rx="1.5" fill="#1e40af"/>
        <path d="M4 16 L8 8 L16 8 L20 16" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8"/>
        <rect x="11" y="4" width="2" height="12" fill="#475569"/>
        <polygon points="13,4 13,9 18,6.5" fill="#f1f5f9"/>
      </symbol>

      {/* Farm */}
      <symbol id="icon-farm" viewBox="0 0 24 24">
        <rect x="2" y="14" width="20" height="2" fill="#65a30d" rx="0.5"/>
        <rect x="2" y="17" width="20" height="2" fill="#65a30d" rx="0.5"/>
        <rect x="2" y="20" width="20" height="2" fill="#65a30d" rx="0.5"/>
        <path d="M4 14 L12 4 L20 14" fill="#16a34a" stroke="#166534" strokeWidth="0.8"/>
        <rect x="10" y="14" width="4" height="8" fill="#92400e"/>
        <rect x="8" y="4" width="1.5" height="10" fill="#92400e"/>
        <circle cx="8.75" cy="3" r="1.5" fill="#f59e0b"/>
      </symbol>

      {/* Mine */}
      <symbol id="icon-mine" viewBox="0 0 24 24">
        <path d="M12 4 L20 20 L4 20 Z" fill="#57534e" stroke="#292524" strokeWidth="0.8"/>
        <rect x="9" y="14" width="6" height="6" fill="#1c1917"/>
        <rect x="10.5" y="11" width="3" height="3" fill="#292524"/>
        <line x1="6" y1="20" x2="18" y2="20" stroke="#44403c" strokeWidth="2"/>
        <circle cx="12" cy="12" r="2" fill="#fbbf24" opacity="0.8"/>
      </symbol>

      {/* Research Lab */}
      <symbol id="icon-lab" viewBox="0 0 24 24">
        <path d="M8 4 L8 14 L3 20 L21 20 L16 14 L16 4" fill="none" stroke="#818cf8" strokeWidth="1.5"/>
        <rect x="7" y="3" width="10" height="2" fill="#6366f1" rx="0.5"/>
        <circle cx="9" cy="16" r="1.5" fill="#22d3ee" opacity="0.9"/>
        <circle cx="14" cy="17" r="1"   fill="#a78bfa" opacity="0.9"/>
        <line x1="10" y1="7" x2="14" y2="7" stroke="#818cf8" strokeWidth="1"/>
        <line x1="10" y1="10" x2="14" y2="10" stroke="#818cf8" strokeWidth="1"/>
      </symbol>

      {/* Oil Rig */}
      <symbol id="icon-oil" viewBox="0 0 24 24">
        <rect x="10" y="4" width="4" height="16" fill="#44403c"/>
        <polygon points="5,8 12,4 19,8 19,10 5,10" fill="#57534e"/>
        <rect x="4" y="18" width="16" height="3" rx="1" fill="#292524"/>
        <circle cx="12" cy="20" r="2" fill="#f59e0b"/>
        <line x1="5" y1="10" x2="5" y2="18" stroke="#44403c" strokeWidth="1.5"/>
        <line x1="19" y1="10" x2="19" y2="18" stroke="#44403c" strokeWidth="1.5"/>
      </symbol>

      {/* Nuclear Plant */}
      <symbol id="icon-nuclear" viewBox="0 0 24 24">
        <ellipse cx="12" cy="14" rx="9" ry="7" fill="#374151" stroke="#4b5563" strokeWidth="0.8"/>
        <ellipse cx="12" cy="14" rx="5" ry="4" fill="#1f2937"/>
        <path d="M8 6 L10 14" stroke="#a3e635" strokeWidth="1.5"/>
        <path d="M16 6 L14 14" stroke="#a3e635" strokeWidth="1.5"/>
        <path d="M8 6 Q12 3 16 6" stroke="#a3e635" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="14" r="2.5" fill="#a3e635" opacity="0.85"/>
        <circle cx="12" cy="14" r="1" fill="#fff"/>
      </symbol>

      {/* Road segment (horizontal) */}
      <symbol id="icon-road" viewBox="0 0 24 24">
        <rect x="0" y="10" width="24" height="4" fill="#78716c"/>
        <line x1="0" y1="12" x2="24" y2="12" stroke="#d6d3d1" strokeWidth="0.8" strokeDasharray="4,3"/>
        <rect x="0" y="10" width="24" height="1" fill="#a8a29e"/>
        <rect x="0" y="13" width="24" height="1" fill="#57534e"/>
      </symbol>

      {/* Resource: Oil barrel */}
      <symbol id="res-oil" viewBox="0 0 20 20">
        <rect x="5" y="4" width="10" height="13" rx="3" fill="#78350f" stroke="#451a03" strokeWidth="0.8"/>
        <ellipse cx="10" cy="4" rx="5" ry="2" fill="#92400e"/>
        <ellipse cx="10" cy="17" rx="5" ry="2" fill="#451a03"/>
        <line x1="5" y1="10" x2="15" y2="10" stroke="#451a03" strokeWidth="0.8"/>
        <line x1="10" y1="4" x2="10" y2="17" stroke="#451a03" strokeWidth="0.8"/>
        <text x="10" y="12.5" textAnchor="middle" fontSize="6" fill="#fbbf24" fontWeight="bold">OIL</text>
      </symbol>

      {/* Resource: Iron */}
      <symbol id="res-iron" viewBox="0 0 20 20">
        <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" fill="#6b7280" stroke="#374151" strokeWidth="0.8"/>
        <polygon points="10,5 15,8 15,12 10,15 5,12 5,8" fill="#9ca3af"/>
        <circle cx="10" cy="10" r="2.5" fill="#d1d5db"/>
      </symbol>

      {/* Resource: Food / Grain */}
      <symbol id="res-food" viewBox="0 0 20 20">
        <line x1="10" y1="18" x2="10" y2="6" stroke="#92400e" strokeWidth="1.2"/>
        <ellipse cx="10" cy="5" rx="4" ry="4" fill="#84cc16"/>
        <line x1="7" y1="10" x2="10" y2="8" stroke="#84cc16" strokeWidth="1"/>
        <line x1="13" y1="10" x2="10" y2="8" stroke="#84cc16" strokeWidth="1"/>
        <line x1="7" y1="13" x2="10" y2="11" stroke="#84cc16" strokeWidth="1"/>
        <line x1="13" y1="13" x2="10" y2="11" stroke="#84cc16" strokeWidth="1"/>
      </symbol>

      {/* Resource: Gold */}
      <symbol id="res-gold" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7" fill="#fbbf24" stroke="#92400e" strokeWidth="0.8"/>
        <circle cx="10" cy="10" r="5" fill="#f59e0b"/>
        <text x="10" y="13.5" textAnchor="middle" fontSize="7" fill="#78350f" fontWeight="bold">G</text>
      </symbol>

      {/* Resource: Stone */}
      <symbol id="res-stone" viewBox="0 0 20 20">
        <polygon points="5,15 3,10 7,4 13,4 17,10 15,15" fill="#6b7280" stroke="#374151" strokeWidth="0.8"/>
        <polygon points="7,13 5.5,9.5 8.5,6 11.5,6 14.5,9.5 13,13" fill="#9ca3af"/>
      </symbol>

      {/* Resource: Uranium */}
      <symbol id="res-uranium" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7" fill="#1a2e05" stroke="#4d7c0f" strokeWidth="0.8"/>
        <ellipse cx="10" cy="10" rx="7" ry="3" fill="none" stroke="#a3e635" strokeWidth="1" opacity="0.7"/>
        <ellipse cx="10" cy="10" rx="3" ry="7" fill="none" stroke="#a3e635" strokeWidth="1" opacity="0.7"/>
        <circle cx="10" cy="10" r="2.5" fill="#a3e635"/>
      </symbol>

      {/* Terrain: Mountain peaks */}
      <symbol id="terrain-mountains" viewBox="0 0 36 36">
        <polygon points="18,4 30,28 6,28" fill="#5d6d7e" opacity="0.7"/>
        <polygon points="26,12 35,28 17,28" fill="#7f8c8d" opacity="0.6"/>
        <polygon points="10,16 20,28 0,28" fill="#4a5568" opacity="0.6"/>
        <polygon points="18,4 24,14 12,14" fill="#ecf0f1" opacity="0.5"/>
      </symbol>

      {/* Terrain: Forest trees */}
      <symbol id="terrain-forest" viewBox="0 0 36 36">
        <polygon points="18,4 27,22 9,22" fill="#166534" opacity="0.8"/>
        <polygon points="18,10 25,25 11,25" fill="#15803d" opacity="0.7"/>
        <polygon points="8,10 15,24 1,24" fill="#14532d" opacity="0.7"/>
        <polygon points="28,10 35,24 21,24" fill="#14532d" opacity="0.7"/>
        <rect x="16" y="22" width="4" height="8" fill="#713f12" opacity="0.9"/>
      </symbol>

      {/* Terrain: Desert dune */}
      <symbol id="terrain-desert" viewBox="0 0 36 36">
        <path d="M0 28 Q9 12 18 20 Q27 28 36 16 L36 36 L0 36 Z" fill="#b7791f" opacity="0.5"/>
        <path d="M0 32 Q9 20 18 26 Q27 32 36 22 L36 36 L0 36 Z" fill="#d97706" opacity="0.4"/>
        <circle cx="28" cy="8" r="5" fill="#fde68a" opacity="0.4"/>
        <line x1="28" y1="3" x2="28" y2="0" stroke="#fde68a" strokeWidth="1.5" opacity="0.5"/>
        <line x1="28" y1="13" x2="28" y2="16" stroke="#fde68a" strokeWidth="1.5" opacity="0.5"/>
        <line x1="23" y1="8" x2="20" y2="8" stroke="#fde68a" strokeWidth="1.5" opacity="0.5"/>
        <line x1="33" y1="8" x2="36" y2="8" stroke="#fde68a" strokeWidth="1.5" opacity="0.5"/>
      </symbol>

      {/* Terrain: Ocean waves */}
      <symbol id="terrain-ocean" viewBox="0 0 36 36">
        <path d="M0 18 Q6 12 12 18 Q18 24 24 18 Q30 12 36 18" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none"/>
        <path d="M0 24 Q6 18 12 24 Q18 30 24 24 Q30 18 36 24" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none"/>
      </symbol>

      {/* Terrain: Tundra snowflake */}
      <symbol id="terrain-tundra" viewBox="0 0 36 36">
        <line x1="18" y1="4" x2="18" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
        <line x1="4" y1="18" x2="32" y2="18" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
        <line x1="7" y1="7"  x2="29" y2="29" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
        <line x1="29" y1="7" x2="7" y2="29"  stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
        <circle cx="18" cy="18" r="3" fill="rgba(255,255,255,0.6)"/>
      </symbol>

      {/* Terrain: Coastal */}
      <symbol id="terrain-coastal" viewBox="0 0 36 36">
        <path d="M0 28 Q6 22 12 25 Q18 28 24 24 Q30 20 36 26 L36 36 L0 36 Z" fill="#1a5276" opacity="0.6"/>
        <path d="M8 26 Q12 22 16 24" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
      </symbol>

      {/* Terrain: Plains */}
      <symbol id="terrain-plains" viewBox="0 0 36 36">
        <path d="M0 28 Q9 20 18 24 Q27 28 36 22 L36 36 L0 36 Z" fill="#15803d" opacity="0.4"/>
        <circle cx="8"  cy="18" r="3" fill="#16a34a" opacity="0.5"/>
        <circle cx="18" cy="14" r="3" fill="#22c55e" opacity="0.5"/>
        <circle cx="28" cy="18" r="3" fill="#16a34a" opacity="0.5"/>
      </symbol>

    </defs>
  );
}