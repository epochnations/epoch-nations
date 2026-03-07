/**
 * MapTerrain – SVG world terrain: continents, rivers, cities, grid.
 * MAP_W x MAP_H is the internal coordinate space (1600x900).
 */
export const MAP_W = 1600;
export const MAP_H = 900;

// Nation anchor positions in map coordinates (spread across globe)
export const NATION_POSITIONS = [
  { x: 210,  y: 160 }, // North America W
  { x: 360,  y: 190 }, // North America E
  { x: 290,  y: 380 }, // Central America
  { x: 380,  y: 540 }, // South America N
  { x: 340,  y: 720 }, // South America S
  { x: 720,  y: 120 }, // Northern Europe
  { x: 790,  y: 220 }, // Central Europe
  { x: 840,  y: 330 }, // S. Europe / N. Africa
  { x: 900,  y: 480 }, // Central Africa
  { x: 860,  y: 620 }, // Southern Africa
  { x: 1000, y: 220 }, // Middle East
  { x: 1080, y: 160 }, // Russia / Central Asia
  { x: 1150, y: 280 }, // South Asia
  { x: 1250, y: 200 }, // East Asia
  { x: 1350, y: 320 }, // SE Asia
  { x: 1420, y: 580 }, // Australia
  { x: 1500, y: 180 }, // Far East
  { x: 120,  y: 100 }, // Canada
  { x: 700,  y: 400 }, // West Africa
  { x: 960,  y: 700 }, // S. Africa tip
];

// Deterministic position by index
export function nationPos(index) {
  return NATION_POSITIONS[index % NATION_POSITIONS.length];
}

// Rivers / waterways
const RIVERS = [
  "M 680,120 Q 720,160 700,220 Q 690,280 710,340",           // Rhine
  "M 800,280 Q 860,300 900,360 Q 940,420 920,500",            // Nile
  "M 340,380 Q 380,440 370,520 Q 360,600 380,680",            // Amazon
  "M 1080,200 Q 1120,250 1100,320 Q 1090,380 1110,430",       // Ganges
  "M 1240,180 Q 1280,220 1260,280 Q 1250,350 1270,400",       // Yangtze
  "M 200,180 Q 260,220 300,280 Q 320,320 300,380",            // Mississippi
  "M 820,150 Q 860,180 880,240 Q 900,290 880,340",            // Danube
];

// City dots (named positions)
export const CITIES = [
  { name:"New York",    x:390,  y:185, size:5 },
  { name:"London",      x:720,  y:145, size:5 },
  { name:"Paris",       x:745,  y:170, size:4 },
  { name:"Moscow",      x:950,  y:120, size:5 },
  { name:"Cairo",       x:880,  y:340, size:4 },
  { name:"Mumbai",      x:1150, y:320, size:4 },
  { name:"Beijing",     x:1290, y:180, size:5 },
  { name:"Tokyo",       x:1400, y:195, size:5 },
  { name:"Sydney",      x:1430, y:620, size:4 },
  { name:"Sao Paulo",   x:420,  y:600, size:4 },
  { name:"Lagos",       x:760,  y:440, size:4 },
  { name:"Nairobi",     x:940,  y:520, size:3 },
  { name:"Dubai",       x:1020, y:300, size:4 },
  { name:"Singapore",   x:1330, y:430, size:4 },
  { name:"Toronto",     x:340,  y:160, size:3 },
  { name:"Berlin",      x:800,  y:140, size:3 },
  { name:"Delhi",       x:1160, y:260, size:4 },
  { name:"Jakarta",     x:1340, y:490, size:3 },
  { name:"Cape Town",   x:820,  y:680, size:3 },
  { name:"Buenos Aires",x:390,  y:680, size:3 },
];

export default function MapTerrain({ zoom }) {
  const showCityLabels = zoom >= 1.5;
  const showRivers = zoom >= 0.5;
  const showCities = zoom >= 0.7;

  return (
    <g>
      {/* Ocean base */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#071326" />

      {/* Grid lines */}
      {Array.from({length:16}).map((_,i) => (
        <line key={`v${i}`} x1={i*100} y1={0} x2={i*100} y2={MAP_H}
          stroke="#0d2040" strokeWidth="0.5" />
      ))}
      {Array.from({length:10}).map((_,i) => (
        <line key={`h${i}`} x1={0} y1={i*100} x2={MAP_W} y2={i*100}
          stroke="#0d2040" strokeWidth="0.5" />
      ))}
      {/* Equator */}
      <line x1={0} y1={MAP_H/2} x2={MAP_W} y2={MAP_H/2}
        stroke="#1a3a5c" strokeWidth="1.2" strokeDasharray="12,8" />
      {/* Prime meridian */}
      <line x1={MAP_W*0.47} y1={0} x2={MAP_W*0.47} y2={MAP_H}
        stroke="#1a3a5c" strokeWidth="0.8" strokeDasharray="8,12" />

      {/* ── Continents ── */}
      <defs>
        <filter id="terrain-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="naGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3d5c"/>
          <stop offset="100%" stopColor="#0f2a40"/>
        </linearGradient>
        <linearGradient id="saGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3d2e"/>
          <stop offset="100%" stopColor="#0f2a1e"/>
        </linearGradient>
        <linearGradient id="euGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d1f5e"/>
          <stop offset="100%" stopColor="#1a1040"/>
        </linearGradient>
        <linearGradient id="afGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b2005"/>
          <stop offset="100%" stopColor="#221200"/>
        </linearGradient>
        <linearGradient id="asGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f2a3c"/>
          <stop offset="100%" stopColor="#071826"/>
        </linearGradient>
        <linearGradient id="auGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d1505"/>
          <stop offset="100%" stopColor="#1a0d00"/>
        </linearGradient>
      </defs>

      {/* North America */}
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280
               L 420,340 L 380,400 L 330,430 L 270,420 L 220,380
               L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="url(#naGrad)" stroke="#1e4a6e" strokeWidth="1.5" opacity="0.9"/>
      {/* Greenland */}
      <path d="M 420,20 L 520,15 L 540,60 L 500,90 L 430,80 Z"
        fill="url(#naGrad)" stroke="#1e4a6e" strokeWidth="1" opacity="0.6"/>
      {/* Central America */}
      <path d="M 310,420 L 360,400 L 390,430 L 370,490 L 330,480 Z"
        fill="url(#naGrad)" stroke="#1e4a6e" strokeWidth="1" opacity="0.75"/>
      {/* Caribbean */}
      <ellipse cx="420" cy="410" rx="20" ry="8" fill="url(#naGrad)" stroke="#1e4a6e" strokeWidth="0.8" opacity="0.6"/>

      {/* South America */}
      <path d="M 340,490 L 440,460 L 510,500 L 530,600 L 520,720
               L 470,800 L 400,810 L 340,770 L 290,680 L 280,580 L 300,510 Z"
        fill="url(#saGrad)" stroke="#0e5c3a" strokeWidth="1.5" opacity="0.9"/>

      {/* Europe */}
      <path d="M 650,60 L 800,40 L 870,70 L 890,140 L 860,180 L 820,200
               L 780,220 L 740,210 L 700,180 L 660,150 L 640,100 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="1.5" opacity="0.9"/>
      {/* Scandinavia */}
      <path d="M 740,30 L 800,20 L 830,55 L 810,90 L 760,80 L 730,55 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="1" opacity="0.8"/>
      {/* UK */}
      <path d="M 680,80 L 710,70 L 720,100 L 700,115 L 675,105 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="0.8" opacity="0.7"/>
      {/* Iceland */}
      <ellipse cx="610" cy="60" rx="30" ry="15" fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="0.8" opacity="0.5"/>

      {/* Africa */}
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450
               L 980,600 L 930,720 L 860,760 L 780,740 L 720,660
               L 680,520 L 660,380 L 660,270 Z"
        fill="url(#afGrad)" stroke="#7a3a05" strokeWidth="1.5" opacity="0.9"/>
      {/* Madagascar */}
      <ellipse cx="1010" cy="640" rx="18" ry="45" fill="url(#afGrad)" stroke="#7a3a05" strokeWidth="0.8" opacity="0.6"/>

      {/* Middle East */}
      <path d="M 950,200 L 1080,180 L 1120,240 L 1100,320 L 1040,360 L 980,340 L 950,270 Z"
        fill="url(#asGrad)" stroke="#1e5a7a" strokeWidth="1.2" opacity="0.85"/>

      {/* Russia / North Asia */}
      <path d="M 820,40 L 1200,20 L 1380,60 L 1450,120 L 1420,180
               L 1300,200 L 1150,190 L 1000,180 L 880,160 L 840,100 Z"
        fill="url(#asGrad)" stroke="#1e5a7a" strokeWidth="1.5" opacity="0.9"/>

      {/* Central / South Asia (India) */}
      <path d="M 1080,200 L 1200,190 L 1250,240 L 1260,340 L 1230,440
               L 1180,480 L 1120,450 L 1080,360 L 1070,270 Z"
        fill="url(#asGrad)" stroke="#1e5a7a" strokeWidth="1.2" opacity="0.85"/>

      {/* China / East Asia */}
      <path d="M 1160,120 L 1380,80 L 1460,150 L 1440,250 L 1360,300
               L 1240,310 L 1160,280 L 1140,200 Z"
        fill="url(#asGrad)" stroke="#1e5a7a" strokeWidth="1.5" opacity="0.88"/>

      {/* SE Asia */}
      <path d="M 1280,300 L 1400,280 L 1470,360 L 1450,430 L 1360,440 L 1280,380 Z"
        fill="url(#asGrad)" stroke="#1e5a7a" strokeWidth="1" opacity="0.8"/>
      {/* Japan */}
      <path d="M 1440,130 L 1480,110 L 1510,160 L 1490,200 L 1450,190 Z"
        fill="url(#asGrad)" stroke="#1e5a7a" strokeWidth="0.8" opacity="0.7"/>

      {/* Australia */}
      <path d="M 1290,560 L 1480,520 L 1570,590 L 1580,730 L 1500,800
               L 1360,820 L 1240,770 L 1210,660 L 1240,580 Z"
        fill="url(#auGrad)" stroke="#8b3a05" strokeWidth="1.5" opacity="0.9"/>
      {/* New Zealand */}
      <path d="M 1540,720 L 1560,700 L 1575,740 L 1555,760 Z"
        fill="url(#auGrad)" stroke="#8b3a05" strokeWidth="0.8" opacity="0.6"/>

      {/* ── Rivers ── */}
      {showRivers && RIVERS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#1a4a7a" strokeWidth="1.2"
          opacity="0.5" strokeLinecap="round" />
      ))}

      {/* ── Cities ── */}
      {showCities && CITIES.map((c) => (
        <g key={c.name}>
          <circle cx={c.x} cy={c.y} r={c.size} fill="#e2e8f0" opacity="0.7" />
          <circle cx={c.x} cy={c.y} r={c.size + 2} fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />
          {showCityLabels && (
            <text x={c.x + c.size + 3} y={c.y + 3} fill="#94a3b8"
              fontSize="9" fontFamily="monospace" opacity="0.8">{c.name}</text>
          )}
        </g>
      ))}

      {/* Ocean shimmer */}
      {[
        [580,350],[300,500],[1100,500],[1500,350],[450,750],[700,800],[1300,650],[200,700]
      ].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#38bdf8" opacity="0.08" />
      ))}
    </g>
  );
}