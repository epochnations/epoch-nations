/**
 * HexOceanDefs — SVG <defs> for the hex ocean world map.
 * Ocean gradients, wave patterns, terrain textures, glow filters.
 */
export default function HexOceanDefs() {
  return (
    <defs>
      {/* ── Deep ocean gradient ── */}
      <linearGradient id="deepOcean" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#061224" />
        <stop offset="40%"  stopColor="#081828" />
        <stop offset="80%"  stopColor="#0a1e30" />
        <stop offset="100%" stopColor="#061224" />
      </linearGradient>

      {/* ── Wave pattern (tiling) ── */}
      <pattern id="wavePattern" x="0" y="0" width="200" height="80" patternUnits="userSpaceOnUse">
        <path d="M0 40 Q25 20 50 40 Q75 60 100 40 Q125 20 150 40 Q175 60 200 40"
          fill="none" stroke="#1a4a7a" strokeWidth="1.5" opacity="0.4" />
        <path d="M0 55 Q30 38 60 55 Q90 72 120 55 Q150 38 180 55 Q195 64 200 55"
          fill="none" stroke="#1a5a8a" strokeWidth="1" opacity="0.3" />
        <path d="M-100 25 Q25 8 50 25 Q75 42 100 25 Q125 8 150 25 Q175 42 300 25"
          fill="none" stroke="#163d65" strokeWidth="1.2" opacity="0.3" />
      </pattern>

      {/* ── Foam pattern ── */}
      <pattern id="foamPattern" x="0" y="0" width="100" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.06)" />
        <circle cx="60" cy="12" r="2" fill="rgba(255,255,255,0.04)" />
        <circle cx="80" cy="28" r="2.5" fill="rgba(255,255,255,0.05)" />
      </pattern>

      {/* ── Glow filter for owned islands ── */}
      <filter id="islandGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
        <feFlood floodColor="#22d3ee" floodOpacity="0.4" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* ── Selection glow ── */}
      <filter id="selectGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
        <feFlood floodColor="#fbbf24" floodOpacity="0.5" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* ── Fog of war ── */}
      <radialGradient id="fogGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="transparent" />
        <stop offset="70%" stopColor="rgba(6,18,40,0.3)" />
        <stop offset="100%" stopColor="rgba(6,18,40,0.7)" />
      </radialGradient>

      {/* ── Island clip path shapes ── */}
      <clipPath id="hexClip">
        <polygon points="52,0 26,-45 -26,-45 -52,0 -26,45 26,45" />
      </clipPath>
    </defs>
  );
}