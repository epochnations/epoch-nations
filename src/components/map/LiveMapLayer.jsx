/**
 * LiveMapLayer — Animated live events on the world map.
 * Weather systems, war fire, trade ship lanes, city pulse, storm cells, lightning.
 * Progressive detail: more animations appear as zoom increases.
 */
import { useMemo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { nationPos, MAP_W, MAP_H, CITIES } from "./MapTerrain.jsx";

// ── Seeded deterministic random ─────────────────────────────────────────────
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 43758.5453;
  return x - Math.floor(x);
}

// ── Weather cell positions (pre-computed, viewport-spread) ──────────────────
const WEATHER_CELLS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: 60 + seededRand(i * 7) * (MAP_W - 120),
  y: 60 + seededRand(i * 13) * (MAP_H - 120),
  r: 30 + seededRand(i * 3) * 60,
  type: i % 5 === 0 ? "storm" : i % 4 === 0 ? "snow" : i % 3 === 0 ? "rain" : "cloud",
  speed: 0.4 + seededRand(i * 11) * 0.8,
  dir: seededRand(i * 17) * 360,
  intensity: 0.3 + seededRand(i * 19) * 0.7,
}));

// ── Trade ship route paths ──────────────────────────────────────────────────
const TRADE_LANES = [
  { id: "atl",   d: "M 400,300 Q 600,350 680,280 Q 720,250 800,220",    color: "#c8a030", label: "Atlantic Trade" },
  { id: "pac",   d: "M 500,400 Q 900,500 1200,400 Q 1350,350 1440,320", color: "#30a8c8", label: "Pacific Route"   },
  { id: "ind",   d: "M 900,450 Q 1000,500 1100,480 Q 1200,460 1340,440",color: "#a8c830", label: "Indian Ocean"    },
  { id: "med",   d: "M 720,250 Q 820,270 900,260 Q 960,250 1020,280",   color: "#c83060", label: "Mediterranean"   },
  { id: "silk",  d: "M 900,260 Q 1050,240 1200,220 Q 1300,210 1380,190",color: "#c87030", label: "Silk Road"       },
  { id: "cape",  d: "M 760,600 Q 820,680 900,720 Q 980,750 1040,680",   color: "#30c880", label: "Cape Route"      },
];

// ── Lightning bolt generator ────────────────────────────────────────────────
function LightningBolt({ x, y, size = 30 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const flash = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 120 + Math.random() * 180);
      setTimeout(flash, 2500 + Math.random() * 8000);
    };
    const t = setTimeout(flash, Math.random() * 5000);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <motion.path
      d={`M ${x} ${y-size*0.5} L ${x+size*0.2} ${y} L ${x-size*0.1} ${y} L ${x+size*0.3} ${y+size*0.5}`}
      fill="none" stroke="#f0f060" strokeWidth="1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.8, 0] }}
      transition={{ duration: 0.15 }}
      filter="url(#lightningGlow)"
    />
  );
}

// ── Animated trade ship ─────────────────────────────────────────────────────
function TradeShip({ lane, nations, zoom }) {
  const duration = 12 + Math.random() * 8;
  return (
    <motion.g>
      <motion.circle r={zoom > 2 ? 4 : 3} fill="#f0c040" opacity="0.85"
        style={{ offsetPath: `path('${lane.d}')`, offsetDistance: "0%" }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear", delay: Math.random() * duration }}
      />
      {zoom > 2 && (
        <motion.text fontSize="10" textAnchor="middle" fill="#f0c040" opacity="0.7"
          style={{ offsetPath: `path('${lane.d}')`, offsetDistance: "0%" }}
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{ duration, repeat: Infinity, ease: "linear", delay: Math.random() * duration }}>
          ⛵
        </motion.text>
      )}
    </motion.g>
  );
}

// ── City activity pulse ─────────────────────────────────────────────────────
function CityPulse({ city, zoom, isCapital }) {
  const sz = zoom > 2 ? city.size * 2.5 : zoom > 1.5 ? city.size * 2 : city.size * 1.5;
  return (
    <g>
      {/* Traffic ring */}
      <motion.circle cx={city.x} cy={city.y} r={sz + 4}
        fill="none" stroke="#f0b840" strokeWidth="0.8"
        animate={{ r: [sz + 2, sz + 10, sz + 2], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3 + city.pop * 0.1, repeat: Infinity, ease: "easeInOut" }}/>
      {/* Population ring */}
      <motion.circle cx={city.x} cy={city.y} r={sz + 8}
        fill="none" stroke="#f0d060" strokeWidth="0.5"
        animate={{ r: [sz + 6, sz + 16, sz + 6], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 4 + city.pop * 0.1, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}/>
      {zoom > 1.8 && (
        <motion.text x={city.x} y={city.y - sz - 8}
          textAnchor="middle" fill="#f0d060" fontSize="7"
          fontFamily="'Times New Roman',serif"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}>
          {city.pop.toFixed(1)}M
        </motion.text>
      )}
    </g>
  );
}

// ── War zone fire ───────────────────────────────────────────────────────────
function WarFire({ x, y, zoom }) {
  return (
    <g>
      {/* Flame glow */}
      <motion.circle cx={x} cy={y} r={zoom > 2 ? 20 : 14}
        fill="#ef4444" opacity="0.15"
        animate={{ r: [10, 22, 10], opacity: [0.2, 0.05, 0.2] }}
        transition={{ duration: 1.2 + Math.random() * 0.6, repeat: Infinity }}/>
      {/* Inner flame */}
      <motion.circle cx={x} cy={y} r={zoom > 2 ? 8 : 5}
        fill="#ff6820"
        animate={{ r: [4, 9, 4], opacity: [0.8, 0.4, 0.8] }}
        transition={{ duration: 0.6 + Math.random() * 0.3, repeat: Infinity }}/>
      {zoom > 1.2 && (
        <motion.text x={x} y={y - (zoom > 2 ? 22 : 16)}
          textAnchor="middle" fontSize={zoom > 2 ? 14 : 10}
          animate={{ y: [y - 18, y - 24, y - 18], opacity: [0.8, 0.5, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity }}>
          🔥
        </motion.text>
      )}
    </g>
  );
}

// ── Storm weather cell ──────────────────────────────────────────────────────
function StormCell({ cell, zoom, timeOffset }) {
  const dx = Math.cos((cell.dir * Math.PI) / 180) * cell.speed * timeOffset;
  const dy = Math.sin((cell.dir * Math.PI) / 180) * cell.speed * timeOffset;
  const cx = ((cell.x + dx) % MAP_W + MAP_W) % MAP_W;
  const cy = Math.max(30, Math.min(MAP_H - 30, cell.y + dy));

  if (cell.type === "storm") {
    return (
      <g opacity={cell.intensity * 0.7}>
        <motion.circle cx={cx} cy={cy} r={cell.r}
          fill="#1a2a3a" opacity="0.4"
          animate={{ r: [cell.r * 0.9, cell.r * 1.1, cell.r * 0.9] }}
          transition={{ duration: 4, repeat: Infinity }}/>
        <motion.circle cx={cx} cy={cy} r={cell.r * 0.6}
          fill="#243040" opacity="0.5"
          animate={{ r: [cell.r * 0.55, cell.r * 0.65, cell.r * 0.55], rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}/>
        {/* Lightning strikes */}
        <LightningBolt x={cx + (Math.random() - 0.5) * cell.r} y={cy + (Math.random() - 0.5) * cell.r} size={25}/>
        <LightningBolt x={cx + (Math.random() - 0.5) * cell.r * 0.7} y={cy + (Math.random() - 0.5) * cell.r * 0.7} size={18}/>
        {zoom > 1.5 && (
          <motion.text x={cx} y={cy - cell.r - 6} textAnchor="middle"
            fontSize="12" animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}>⛈️</motion.text>
        )}
      </g>
    );
  }
  if (cell.type === "snow") {
    return (
      <g opacity={cell.intensity * 0.5}>
        <motion.circle cx={cx} cy={cy} r={cell.r}
          fill="#c8e0f0" opacity="0.15"
          animate={{ opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 5, repeat: Infinity }}/>
        {zoom > 1.5 && (
          <motion.text x={cx} y={cy} textAnchor="middle"
            fontSize="10" animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}>❄️</motion.text>
        )}
      </g>
    );
  }
  if (cell.type === "rain") {
    return (
      <g opacity={cell.intensity * 0.45}>
        <motion.circle cx={cx} cy={cy} r={cell.r}
          fill="#2a4060" opacity="0.2"
          animate={{ opacity: [0.15, 0.28, 0.15] }}
          transition={{ duration: 4, repeat: Infinity }}/>
        {zoom > 1.8 && (
          <motion.text x={cx} y={cy} textAnchor="middle"
            fontSize="9" animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity }}>🌧️</motion.text>
        )}
      </g>
    );
  }
  // cloud
  return (
    <g opacity={cell.intensity * 0.35}>
      <ellipse cx={cx} cy={cy} rx={cell.r} ry={cell.r * 0.55}
        fill="#9ab0c0" opacity="0.18"/>
    </g>
  );
}

// ── Live event popup ────────────────────────────────────────────────────────
function LiveEventBubble({ event, zoom }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 6000 + Math.random() * 4000);
    return () => clearTimeout(t);
  }, []);
  if (!show || zoom < 1.0) return null;
  return (
    <AnimatePresence>
      <motion.g key={event.id}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.4 }}>
        <rect x={event.x - 50} y={event.y - 28} width="100" height="22" rx="4"
          fill="#0f1a2a" fillOpacity="0.88" stroke="#c8a030" strokeWidth="0.6"/>
        <text x={event.x} y={event.y - 12} textAnchor="middle"
          fill="#f0d060" fontSize="8" fontFamily="'Times New Roman',serif"
          fontStyle="italic">{event.label}</text>
      </motion.g>
    </AnimatePresence>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function LiveMapLayer({ nations, myNation, nationIndexMap, zoom }) {
  const [timeOffset, setTimeOffset] = useState(0);
  const [liveEvents, setLiveEvents] = useState([]);
  const frameRef = useRef(null);
  const evtRef = useRef(0);

  // Animate weather drift
  useEffect(() => {
    let t = 0;
    const tick = () => {
      t += 0.3;
      setTimeOffset(t);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  // Spawn live event bubbles
  useEffect(() => {
    if (nations.length === 0) return;
    const interval = setInterval(() => {
      const nation = nations[Math.floor(Math.random() * nations.length)];
      const idx = nationIndexMap[nation?.id] ?? 0;
      const pos = nationPos(idx);
      const events = [
        `📈 ${nation.name} GDP +${(Math.random() * 5).toFixed(1)}%`,
        `🏗️ ${nation.name} building...`,
        `📦 Trade active`,
        `⚡ Tech research`,
        `👥 Population +${Math.floor(Math.random() * 5 + 1)}`,
        `💰 Tax revenue`,
      ];
      const newEvt = {
        id: evtRef.current++,
        x: pos.x + (Math.random() - 0.5) * 40,
        y: pos.y - 20,
        label: events[Math.floor(Math.random() * events.length)],
      };
      setLiveEvents(prev => [...prev.slice(-8), newEvt]);
    }, 3500);
    return () => clearInterval(interval);
  }, [nations, nationIndexMap]);

  const warNations = useMemo(() =>
    nations.filter(n => (n.at_war_with || []).length > 0), [nations]);

  const atWarPairs = useMemo(() => {
    const seen = new Set();
    const pairs = [];
    for (const n of warNations) {
      for (const eid of (n.at_war_with || [])) {
        const key = [n.id, eid].sort().join("_");
        if (!seen.has(key)) { seen.add(key); pairs.push({ a: n, bId: eid }); }
      }
    }
    return pairs;
  }, [warNations]);

  return (
    <g>
      <defs>
        <filter id="lightningGlow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="fireGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="warGlow">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feColorMatrix in="blur" type="matrix" values="3 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.5 0" result="red"/>
          <feMerge><feMergeNode in="red"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="warZoneGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* ── Weather cells ── */}
      {WEATHER_CELLS.map(cell => (
        <StormCell key={cell.id} cell={cell} zoom={zoom} timeOffset={timeOffset}/>
      ))}

      {/* ── Trade lanes with animated ships ── */}
      {TRADE_LANES.map(lane => (
        <g key={lane.id}>
          {/* Lane path */}
          <path d={lane.d} fill="none"
            stroke={lane.color} strokeWidth={zoom > 2 ? 1.2 : 0.7}
            strokeDasharray="6,10" opacity={zoom > 1.5 ? 0.45 : 0.25}/>
          {/* Animated ships */}
          {zoom > 0.8 && <TradeShip lane={lane} zoom={zoom}/>}
          {zoom > 0.8 && <TradeShip lane={lane} zoom={zoom}/>}
        </g>
      ))}

      {/* ── Nation activity — city pulses ── */}
      {zoom >= 0.9 && nations.map(nation => {
        const idx = nationIndexMap[nation.id] ?? 0;
        const pos = nationPos(idx);
        return (
          <motion.circle key={`pulse_${nation.id}`}
            cx={pos.x} cy={pos.y}
            r={zoom > 2 ? 18 : zoom > 1.5 ? 14 : 10}
            fill="none"
            stroke={nation.id === myNation?.id ? "#22d3ee" : "#c8a030"}
            strokeWidth="0.8"
            animate={{ r: [8, 20, 8], opacity: [0.4, 0, 0.4] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: (nationIndexMap[nation.id] ?? 0) * 0.3,
            }}/>
        );
      })}

      {/* ── War zones — fire + glow ── */}
      {atWarPairs.map(({ a, bId }) => {
        const aIdx = nationIndexMap[a.id] ?? 0;
        const bNation = nations.find(n => n.id === bId);
        const bIdx = bNation ? (nationIndexMap[bId] ?? 0) : aIdx;
        const aPos = nationPos(aIdx);
        const bPos = nationPos(bIdx);
        const midX = (aPos.x + bPos.x) / 2;
        const midY = (aPos.y + bPos.y) / 2;
        return (
          <g key={`war_${a.id}_${bId}`}>
            {/* War zone radius */}
            <motion.circle cx={midX} cy={midY}
              r={zoom > 2 ? 45 : 30}
              fill="url(#warZoneGrad)"
              animate={{ r: [25, 45, 25], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}/>
            {/* Conflict line */}
            <motion.line x1={aPos.x} y1={aPos.y} x2={bPos.x} y2={bPos.y}
              stroke="#ef4444" strokeWidth={zoom > 1.5 ? 1.5 : 0.8}
              strokeDasharray="4,6" opacity="0.5"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}/>
            {/* Fire markers */}
            <WarFire x={midX} y={midY} zoom={zoom}/>
            {zoom > 1.5 && (
              <>
                <WarFire x={midX + 20} y={midY - 10} zoom={zoom}/>
                <WarFire x={midX - 15} y={midY + 12} zoom={zoom}/>
              </>
            )}
          </g>
        );
      })}

      {/* ── Ally connection lines ── */}
      {zoom >= 1.0 && nations.map(nation => {
        const idx = nationIndexMap[nation.id] ?? 0;
        const pos = nationPos(idx);
        return (nation.allies || []).map(allyId => {
          const allyNation = nations.find(n => n.id === allyId);
          if (!allyNation) return null;
          const aIdx = nationIndexMap[allyId] ?? 0;
          const aPos = nationPos(aIdx);
          return (
            <motion.line key={`ally_${nation.id}_${allyId}`}
              x1={pos.x} y1={pos.y} x2={aPos.x} y2={aPos.y}
              stroke="#4ade80" strokeWidth="0.6"
              strokeDasharray="5,8" opacity="0.3"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}/>
          );
        });
      })}

      {/* ── City activity animations (traffic rings + industrial smoke) ── */}
      {zoom >= 0.8 && CITIES.map((city, i) => (
        <g key={`city_anim_${city.name}`}>
          {/* City heartbeat ring */}
          <motion.circle cx={city.x} cy={city.y}
            r={city.size + 3}
            fill="none"
            stroke={city.pop > 15 ? "#e08020" : "#a06010"}
            strokeWidth="0.8"
            animate={{ r: [city.size+2, city.size+12, city.size+2], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5 + city.pop * 0.08, repeat: Infinity, delay: i * 0.18 }}/>
          {/* Large city second ring */}
          {city.pop > 10 && (
            <motion.circle cx={city.x} cy={city.y}
              r={city.size + 8}
              fill="none"
              stroke="#c07020"
              strokeWidth="0.5"
              animate={{ r: [city.size+6, city.size+18, city.size+6], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3.5 + city.pop * 0.1, repeat: Infinity, delay: i * 0.18 + 1.2 }}/>
          )}
          {/* Smoke puff from industrial cities */}
          {zoom > 1.5 && city.pop > 8 && (
            <motion.circle cx={city.x + 5} cy={city.y - city.size - 6}
              r={3}
              fill="#404840"
              animate={{
                cy: [city.y - city.size - 6, city.y - city.size - 18, city.y - city.size - 30],
                r: [2, 5, 1],
                opacity: [0.4, 0.2, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}/>
          )}
          {/* Population label at high zoom */}
          {zoom > 2 && (
            <motion.text x={city.x} y={city.y - city.size - 14}
              textAnchor="middle" fill="#e09030" fontSize="7"
              fontFamily="'Courier New',monospace"
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 }}>
              {city.pop.toFixed(1)}M
            </motion.text>
          )}
        </g>
      ))}

      {/* ── Live event bubbles (zoom ≥ 1.0) ── */}
      {liveEvents.map(evt => (
        <LiveEventBubble key={evt.id} event={evt} zoom={zoom}/>
      ))}

      {/* ── Zoom detail: moving clouds (zoom > 1.5) ── */}
      {zoom > 1.5 && Array.from({ length: 8 }, (_, i) => {
        const cx = (seededRand(i * 31) * MAP_W + timeOffset * (0.3 + seededRand(i * 7) * 0.4)) % MAP_W;
        const cy = 80 + seededRand(i * 41) * (MAP_H - 160);
        const w = 40 + seededRand(i * 53) * 60;
        return (
          <g key={`cloud_${i}`} opacity="0.18">
            <ellipse cx={cx} cy={cy} rx={w} ry={w * 0.4} fill="#c8d8e8"/>
            <ellipse cx={cx - w * 0.25} cy={cy - 5} rx={w * 0.5} ry={w * 0.3} fill="#d8e8f0"/>
            <ellipse cx={cx + w * 0.2} cy={cy - 4} rx={w * 0.4} ry={w * 0.25} fill="#d8e8f0"/>
          </g>
        );
      })}

      {/* ── Zoom detail: road/highway lines between nearby nations (zoom > 2.5) ── */}
      {zoom > 2.5 && nations.slice(0, 8).map((nation, i) => {
        const idx = nationIndexMap[nation.id] ?? 0;
        const pos = nationPos(idx);
        return (
          <g key={`roads_${nation.id}`}>
            {[-1, 1].map(dir => (
              <line key={dir}
                x1={pos.x} y1={pos.y}
                x2={pos.x + dir * 30} y2={pos.y + 20}
                stroke="#8a6010" strokeWidth="0.5" opacity="0.3"/>
            ))}
          </g>
        );
      })}

      {/* ── Animated ocean shimmer dots (subtle) ── */}
      {zoom > 1.2 && [
        [580,360],[300,480],[1100,520],[1480,360],[450,750],[700,800],[1300,660],
        [200,680],[900,460],[1100,360],[600,240],[400,640],[800,560],[1220,460],
      ].map(([x, y], i) => (
        <motion.circle key={`shimmer_${i}`} cx={x} cy={y} r="2.5"
          fill="#6090c0" opacity="0.12"
          animate={{ opacity: [0.05, 0.2, 0.05], r: [1.5, 3, 1.5] }}
          transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}/>
      ))}
    </g>
  );
}