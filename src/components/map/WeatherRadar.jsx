/**
 * WeatherRadar — Live animated weather radar sweeping across the world map.
 * Radar sweep rotation, precipitation cells, storm systems with real movement.
 */
import { useEffect, useRef, useState } from "react";
import { MAP_W, MAP_H } from "./MapTerrain";

function seededRand(seed) {
  const x = Math.sin(seed + 1) * 43758.5453;
  return x - Math.floor(x);
}

// Weather cells — pre-seeded positions + movement vectors
const CELLS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: 80 + seededRand(i * 7) * (MAP_W - 160),
  y: 60 + seededRand(i * 13) * (MAP_H - 120),
  r: 40 + seededRand(i * 3) * 70,
  type: i % 6 === 0 ? "storm" : i % 5 === 0 ? "heavy" : i % 3 === 0 ? "rain" : i % 4 === 0 ? "snow" : "cloud",
  vx: (seededRand(i * 17) - 0.5) * 0.4,
  vy: (seededRand(i * 23) - 0.3) * 0.25,
  intensity: 0.35 + seededRand(i * 19) * 0.65,
  phase: seededRand(i * 31) * Math.PI * 2,
}));

const TYPE_COLORS = {
  storm:  { fill: "#102030", stroke: "#204060", opacity: 0.55 },
  heavy:  { fill: "#1a3050", stroke: "#2a4870", opacity: 0.45 },
  rain:   { fill: "#1a2840", stroke: "#203858", opacity: 0.35 },
  snow:   { fill: "#b0c8c0", stroke: "#c0d8d0", opacity: 0.25 },
  cloud:  { fill: "#283830", stroke: "#344840", opacity: 0.2  },
};

export default function WeatherRadar({ zoom }) {
  const [time, setTime] = useState(0);
  const frameRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const animate = () => {
      tRef.current += 0.5;
      setTime(tRef.current);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  // Radar sweep angle
  const sweepAngle = (time * 1.2) % 360;
  const sweepRad = (sweepAngle * Math.PI) / 180;

  // Radar center — middle of map
  const rCX = MAP_W * 0.5;
  const rCY = MAP_H * 0.48;
  const rRadius = Math.max(MAP_W, MAP_H) * 0.75;

  return (
    <g>
      <defs>
        {/* Radar sweep gradient */}
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00ff80" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#00ff80" stopOpacity="0"/>
        </radialGradient>

        {/* Storm precipitation gradient */}
        <radialGradient id="stormCell" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#103050" stopOpacity="0.7"/>
          <stop offset="50%"  stopColor="#1a3a60" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#102030" stopOpacity="0"/>
        </radialGradient>

        {/* Rain cell gradient */}
        <radialGradient id="rainCell" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#182838" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#102030" stopOpacity="0"/>
        </radialGradient>

        {/* Snow cell */}
        <radialGradient id="snowCell" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#a0c8c0" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#80a8a0" stopOpacity="0"/>
        </radialGradient>

        {/* Radar sweep wedge */}
        <filter id="radarBlur">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>

      {/* ── Moving weather cells ── */}
      {CELLS.map((cell) => {
        const pulse = Math.sin(time * 0.03 + cell.phase) * 0.15;
        const cx = ((cell.x + cell.vx * time) % MAP_W + MAP_W) % MAP_W;
        const cy = Math.max(30, Math.min(MAP_H - 30,
          cell.y + cell.vy * time + Math.sin(time * 0.02 + cell.phase) * 15));
        const r = cell.r * (1 + pulse);
        const cfg = TYPE_COLORS[cell.type];

        const cellGrad = cell.type === "storm" ? "stormCell"
          : cell.type === "heavy" ? "stormCell"
          : cell.type === "snow" ? "snowCell"
          : "rainCell";

        return (
          <g key={cell.id} opacity={cell.intensity * cfg.opacity * 2.5}>
            {/* Outer precipitation band */}
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.65}
              fill={`url(#${cellGrad})`}/>
            {/* Inner core */}
            <ellipse cx={cx} cy={cy} rx={r * 0.55} ry={r * 0.38}
              fill={cfg.fill} opacity="0.5" stroke={cfg.stroke} strokeWidth="0.5"/>
            {/* Storm core — extra density rings */}
            {(cell.type === "storm" || cell.type === "heavy") && (
              <>
                <ellipse cx={cx} cy={cy} rx={r * 0.28} ry={r * 0.2}
                  fill="#0a1828" opacity="0.7"/>
                <ellipse cx={cx} cy={cy} rx={r * 0.38} ry={r * 0.26}
                  fill="none" stroke="#2a5080" strokeWidth="0.6" opacity="0.5"
                  strokeDasharray="3,5"/>
              </>
            )}
            {/* Snow sparkle ring */}
            {cell.type === "snow" && (
              <ellipse cx={cx} cy={cy} rx={r * 0.4} ry={r * 0.3}
                fill="#c8e0d8" opacity="0.15"/>
            )}
          </g>
        );
      })}

      {/* ── Radar sweep line ── */}
      {zoom >= 0.6 && (
        <g opacity="0.18">
          {/* Sweep wedge (trailing glow) */}
          <path
            d={`M ${rCX} ${rCY}
                L ${rCX + rRadius * Math.cos(sweepRad - 0.4)} ${rCY + rRadius * Math.sin(sweepRad - 0.4)}
                A ${rRadius} ${rRadius} 0 0 1 ${rCX + rRadius * Math.cos(sweepRad)} ${rCY + rRadius * Math.sin(sweepRad)}
                Z`}
            fill="url(#radarGrad)"
          />
          {/* Sweep line */}
          <line
            x1={rCX} y1={rCY}
            x2={rCX + rRadius * Math.cos(sweepRad)}
            y2={rCY + rRadius * Math.sin(sweepRad)}
            stroke="#00ff80" strokeWidth="1.5" opacity="0.5"
          />
          {/* Center dot */}
          <circle cx={rCX} cy={rCY} r="3" fill="#00ff80" opacity="0.4"/>
          {/* Range rings */}
          {[0.2, 0.45, 0.7].map((ratio, i) => (
            <circle key={i}
              cx={rCX} cy={rCY} r={rRadius * ratio}
              fill="none" stroke="#00ff40" strokeWidth="0.4"
              opacity={0.08 - i * 0.02}
              strokeDasharray="4,12"/>
          ))}
        </g>
      )}

      {/* ── Lightning flashes on storm cells ── */}
      {CELLS.filter(c => c.type === "storm" || c.type === "heavy").map((cell) => {
        const cx = ((cell.x + cell.vx * time) % MAP_W + MAP_W) % MAP_W;
        const cy = Math.max(30, Math.min(MAP_H - 30, cell.y + cell.vy * time));
        const flashOn = Math.floor(time / 40 + cell.phase * 10) % 7 === 0;
        if (!flashOn || zoom < 0.7) return null;
        return (
          <g key={`flash_${cell.id}`}>
            <path
              d={`M ${cx-3} ${cy-cell.r*0.3} L ${cx+2} ${cy} L ${cx-1} ${cy} L ${cx+4} ${cy+cell.r*0.3}`}
              fill="none" stroke="#e0f040" strokeWidth="1.5" opacity="0.7"/>
            <circle cx={cx} cy={cy} r={cell.r*0.4}
              fill="#ffffa0" opacity="0.05"/>
          </g>
        );
      })}

      {/* ── Moving cloud layer (high altitude, slower) ── */}
      {zoom > 1.2 && Array.from({ length: 6 }, (_, i) => {
        const cx = ((seededRand(i * 29) * MAP_W + time * (0.2 + seededRand(i * 7) * 0.3)) % MAP_W + MAP_W) % MAP_W;
        const cy = 70 + seededRand(i * 43) * (MAP_H - 140);
        const w = 50 + seededRand(i * 53) * 70;
        return (
          <g key={`hcloud_${i}`} opacity="0.14">
            <ellipse cx={cx} cy={cy} rx={w} ry={w * 0.38} fill="#283830"/>
            <ellipse cx={cx - w*0.25} cy={cy - 5} rx={w*0.5} ry={w*0.28} fill="#303a30"/>
            <ellipse cx={cx + w*0.18} cy={cy - 4} rx={w*0.4} ry={w*0.22} fill="#303a30"/>
          </g>
        );
      })}
    </g>
  );
}