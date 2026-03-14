/**
 * MapTerrain – Realistic SVG world map with detailed continents, ocean depth,
 * terrain textures, mountain ranges, and geographic features.
 */
export const MAP_W = 1600;
export const MAP_H = 900;

export const NATION_POSITIONS = [
  { x: 210,  y: 160 }, { x: 360,  y: 190 }, { x: 290,  y: 380 },
  { x: 380,  y: 540 }, { x: 340,  y: 720 }, { x: 720,  y: 120 },
  { x: 790,  y: 220 }, { x: 840,  y: 330 }, { x: 900,  y: 480 },
  { x: 860,  y: 620 }, { x: 1000, y: 220 }, { x: 1080, y: 160 },
  { x: 1150, y: 280 }, { x: 1250, y: 200 }, { x: 1350, y: 320 },
  { x: 1420, y: 580 }, { x: 1500, y: 180 }, { x: 120,  y: 100 },
  { x: 700,  y: 400 }, { x: 960,  y: 700 },
];

export function nationPos(index) {
  return NATION_POSITIONS[index % NATION_POSITIONS.length];
}

const RIVERS = [
  "M 680,120 Q 720,160 700,220 Q 690,280 710,340",
  "M 800,280 Q 860,300 900,360 Q 940,420 920,500",
  "M 340,380 Q 380,440 370,520 Q 360,600 380,680",
  "M 1080,200 Q 1120,250 1100,320 Q 1090,380 1110,430",
  "M 1240,180 Q 1280,220 1260,280 Q 1250,350 1270,400",
  "M 200,180 Q 260,220 300,280 Q 320,320 300,380",
  "M 820,150 Q 860,180 880,240 Q 900,290 880,340",
];

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

// Mountain ranges as polyline paths
const MOUNTAIN_RANGES = [
  // Rockies
  { d: "M 195,100 L 210,130 L 205,160 L 215,200 L 210,240", stroke: "#1a3d5c", width: 3 },
  // Andes
  { d: "M 330,490 L 325,560 L 318,640 L 320,720 L 315,790", stroke: "#0e5c3a", width: 3 },
  // Alps
  { d: "M 740,170 L 770,165 L 800,172 L 825,168", stroke: "#3d2a70", width: 2.5 },
  // Himalayas
  { d: "M 1120,230 L 1160,220 L 1200,215 L 1240,222 L 1270,235", stroke: "#1a4a6a", width: 3.5 },
  // Caucasus
  { d: "M 970,180 L 1010,175 L 1040,182", stroke: "#1a4a6a", width: 2 },
  // Atlas
  { d: "M 700,235 L 740,228 L 770,235", stroke: "#7a3a05", width: 2 },
  // Urals
  { d: "M 1010,80 L 1020,120 L 1015,160", stroke: "#1a4a6a", width: 2 },
  // Great Dividing Range
  { d: "M 1440,570 L 1450,620 L 1445,670 L 1440,720", stroke: "#8b3a05", width: 2 },
];

// Forest/jungle patches
const FOREST_PATCHES = [
  { cx: 350, cy: 500, rx: 40, ry: 60, fill: "#0a3020" },  // Amazon
  { cx: 890, cy: 480, rx: 50, ry: 80, fill: "#0d2810" },  // Congo
  { cx: 1340, cy: 380, rx: 35, ry: 40, fill: "#0a2810" }, // SE Asia jungle
  { cx: 250, cy: 160, rx: 30, ry: 40, fill: "#102830" },  // Canadian boreal
];

// Desert patches
const DESERT_PATCHES = [
  { cx: 880, cy: 290, rx: 60, ry: 40, fill: "#3d1e00", opacity: 0.4 },  // Sahara
  { cx: 1040, cy: 270, rx: 40, ry: 25, fill: "#3d1e00", opacity: 0.35 }, // Arabian
  { cx: 1380, cy: 660, rx: 50, ry: 35, fill: "#3a1800", opacity: 0.4 },  // Australian outback
  { cx: 310, cy: 700, rx: 30, ry: 20, fill: "#3a1800", opacity: 0.3 },   // Patagonia
];

// Ice caps
const ICE_CAPS = [
  "M 0,0 L 600,0 L 540,40 L 450,55 L 380,45 L 300,60 L 150,50 L 80,40 L 0,50 Z",
  "M 0,900 L 1600,900 L 1600,860 L 1400,850 L 1000,855 L 600,845 L 200,855 L 0,860 Z",
];

// Ocean depth rings
const OCEAN_RINGS = [
  { cx: 580, cy: 400, rx: 280, ry: 200, stroke: "#0a1f3d", opacity: 0.4 },  // Atlantic
  { cx: 1100, cy: 500, rx: 340, ry: 220, stroke: "#071528", opacity: 0.4 }, // Pacific/Indian
  { cx: 800, cy: 820, rx: 200, ry: 60, stroke: "#0a1f3d", opacity: 0.3 },   // Southern Ocean
];

export default function MapTerrain({ zoom }) {
  const showCityLabels = zoom >= 1.5;
  const showRivers     = zoom >= 0.5;
  const showCities     = zoom >= 0.7;
  const showMountains  = zoom >= 0.6;
  const showForests    = zoom >= 0.5;

  return (
    <g>
      {/* ── Ocean base with depth gradient ── */}
      <defs>
        <radialGradient id="oceanDepth" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="#071b35"/>
          <stop offset="40%"  stopColor="#051526"/>
          <stop offset="100%" stopColor="#020a14"/>
        </radialGradient>

        {/* Atlantic deep */}
        <radialGradient id="atlanticDeep" cx="36%" cy="44%" r="30%">
          <stop offset="0%"   stopColor="#061830"/>
          <stop offset="100%" stopColor="#020a14" stopOpacity="0"/>
        </radialGradient>

        {/* Pacific deep */}
        <radialGradient id="pacificDeep" cx="68%" cy="55%" r="35%">
          <stop offset="0%"   stopColor="#04111e"/>
          <stop offset="100%" stopColor="#020a14" stopOpacity="0"/>
        </radialGradient>

        {/* Land gradients — more realistic earthy tones */}
        <linearGradient id="naGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#1e4a2e"/>
          <stop offset="50%"  stopColor="#163a22"/>
          <stop offset="100%" stopColor="#0f2a18"/>
        </linearGradient>
        <linearGradient id="naGradNorth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a3a28"/>
          <stop offset="100%" stopColor="#2a5a34"/>
        </linearGradient>
        <linearGradient id="saGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#0e3d20"/>
          <stop offset="60%"  stopColor="#0a2e18"/>
          <stop offset="100%" stopColor="#061e10"/>
        </linearGradient>
        <linearGradient id="euGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#1e3a60"/>
          <stop offset="50%"  stopColor="#162c4a"/>
          <stop offset="100%" stopColor="#0f1e34"/>
        </linearGradient>
        <linearGradient id="afGrad" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#3d2005"/>
          <stop offset="40%"  stopColor="#2a1500"/>
          <stop offset="100%" stopColor="#1a0d00"/>
        </linearGradient>
        <linearGradient id="asGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#1a3a4a"/>
          <stop offset="50%"  stopColor="#122a38"/>
          <stop offset="100%" stopColor="#0a1e28"/>
        </linearGradient>
        <linearGradient id="asGradRussia" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#162032"/>
          <stop offset="100%" stopColor="#1e3a50"/>
        </linearGradient>
        <linearGradient id="auGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#3d1e05"/>
          <stop offset="50%"  stopColor="#2a1500"/>
          <stop offset="100%" stopColor="#1a0d00"/>
        </linearGradient>
        <linearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c8e8f8"/>
          <stop offset="100%" stopColor="#8ab8d8"/>
        </linearGradient>
        <linearGradient id="greenlandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a0c8e0"/>
          <stop offset="100%" stopColor="#6090b0"/>
        </linearGradient>

        {/* Terrain noise filter */}
        <filter id="terrainNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
          <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blend"/>
          <feComposite in="blend" in2="SourceGraphic" operator="in"/>
        </filter>

        {/* Soft shadow/border */}
        <filter id="landShadow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#000000" floodOpacity="0.5"/>
        </filter>

        {/* Coastal glow */}
        <filter id="coastalGlow">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Shallow water pattern */}
        <pattern id="shallowWater" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="transparent"/>
          <path d="M 0 20 Q 10 15 20 20 Q 30 25 40 20" fill="none" stroke="#0e2a4a" strokeWidth="0.4" opacity="0.4"/>
        </pattern>

        {/* Grid dot pattern */}
        <pattern id="gridDots" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="50" cy="50" r="0.8" fill="#0e2040" opacity="0.5"/>
        </pattern>

        {/* Cloud/atmosphere at poles */}
        <radialGradient id="northPole" cx="50%" cy="0%" r="20%">
          <stop offset="0%"   stopColor="#8ac4e0" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#8ac4e0" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="southPole" cx="50%" cy="100%" r="20%">
          <stop offset="0%"   stopColor="#a0d0e8" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#a0d0e8" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Ocean base */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanDepth)" />
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#atlanticDeep)" />
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#pacificDeep)" />
      {/* Shallow water pattern overlay */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#shallowWater)" opacity="0.3"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#gridDots)"/>

      {/* Ocean depth rings */}
      {OCEAN_RINGS.map((r, i) => (
        <ellipse key={i} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
          fill="none" stroke={r.stroke} strokeWidth="1" opacity={r.opacity}/>
      ))}

      {/* Longitude / latitude grid */}
      {Array.from({length:16}).map((_,i) => (
        <line key={`v${i}`} x1={i*100} y1={0} x2={i*100} y2={MAP_H}
          stroke="#0d2040" strokeWidth="0.4" opacity="0.6"/>
      ))}
      {Array.from({length:10}).map((_,i) => (
        <line key={`h${i}`} x1={0} y1={i*100} x2={MAP_W} y2={i*100}
          stroke="#0d2040" strokeWidth="0.4" opacity="0.6"/>
      ))}
      {/* Tropic of Cancer */}
      <line x1={0} y1={MAP_H*0.33} x2={MAP_W} y2={MAP_H*0.33}
        stroke="#1a2a40" strokeWidth="0.8" strokeDasharray="6,14" opacity="0.5"/>
      {/* Tropic of Capricorn */}
      <line x1={0} y1={MAP_H*0.64} x2={MAP_W} y2={MAP_H*0.64}
        stroke="#1a2a40" strokeWidth="0.8" strokeDasharray="6,14" opacity="0.5"/>
      {/* Equator */}
      <line x1={0} y1={MAP_H/2} x2={MAP_W} y2={MAP_H/2}
        stroke="#1e3d60" strokeWidth="1.2" strokeDasharray="12,8" opacity="0.8"/>
      {/* Prime Meridian */}
      <line x1={MAP_W*0.47} y1={0} x2={MAP_W*0.47} y2={MAP_H}
        stroke="#1e3d60" strokeWidth="0.8" strokeDasharray="8,12" opacity="0.6"/>

      {/* ── Coastal shallow water halos (makes coasts feel real) ── */}
      {/* NA coast */}
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280 L 420,340 L 380,400 L 330,430 L 270,420 L 220,380 L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="none" stroke="#1a4a6e" strokeWidth="8" opacity="0.12" filter="url(#coastalGlow)"/>
      {/* Africa coast */}
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450 L 980,600 L 930,720 L 860,760 L 780,740 L 720,660 L 680,520 L 660,380 L 660,270 Z"
        fill="none" stroke="#7a3a05" strokeWidth="8" opacity="0.15" filter="url(#coastalGlow)"/>

      {/* ── CONTINENTS ── */}
      {/* North America */}
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280
               L 420,340 L 380,400 L 330,430 L 270,420 L 220,380
               L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="url(#naGrad)" stroke="#265a34" strokeWidth="1.5" opacity="0.95"
        filter="url(#landShadow)"/>
      {/* Interior plains texture */}
      <path d="M 200,150 L 350,140 L 400,180 L 380,250 L 330,280 L 250,270 L 200,220 Z"
        fill="#1a3d24" opacity="0.3"/>
      {/* Greenland */}
      <path d="M 420,20 L 520,15 L 540,60 L 500,90 L 430,80 Z"
        fill="url(#greenlandGrad)" stroke="#6090b0" strokeWidth="1" opacity="0.8"/>
      {/* Central America */}
      <path d="M 310,420 L 360,400 L 390,430 L 370,490 L 330,480 Z"
        fill="url(#naGrad)" stroke="#265a34" strokeWidth="1" opacity="0.8"/>
      {/* Caribbean islands */}
      <ellipse cx="425" cy="410" rx="20" ry="8" fill="#163a22" stroke="#265a34" strokeWidth="0.8" opacity="0.6"/>
      <ellipse cx="455" cy="425" rx="10" ry="5" fill="#163a22" stroke="#265a34" strokeWidth="0.6" opacity="0.5"/>

      {/* South America */}
      <path d="M 340,490 L 440,460 L 510,500 L 530,600 L 520,720
               L 470,800 L 400,810 L 340,770 L 290,680 L 280,580 L 300,510 Z"
        fill="url(#saGrad)" stroke="#0e5c3a" strokeWidth="1.5" opacity="0.95"
        filter="url(#landShadow)"/>
      {/* Amazon basin */}
      <path d="M 330,510 L 450,480 L 510,540 L 490,620 L 390,640 L 310,580 Z"
        fill="#072010" opacity="0.4"/>

      {/* Europe */}
      <path d="M 650,60 L 800,40 L 870,70 L 890,140 L 860,180 L 820,200
               L 780,220 L 740,210 L 700,180 L 660,150 L 640,100 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="1.5" opacity="0.95"
        filter="url(#landShadow)"/>
      {/* Iberian Peninsula */}
      <path d="M 650,160 L 700,150 L 720,200 L 700,240 L 660,230 L 645,190 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="1" opacity="0.85"/>
      {/* Italy */}
      <path d="M 780,180 L 800,175 L 810,210 L 800,255 L 790,250 L 778,215 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="0.8" opacity="0.75"/>
      {/* Scandinavia */}
      <path d="M 740,30 L 800,20 L 830,55 L 810,90 L 760,80 L 730,55 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="1" opacity="0.85"/>
      {/* UK */}
      <path d="M 680,80 L 710,70 L 720,100 L 700,115 L 675,105 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="0.8" opacity="0.75"/>
      {/* Ireland */}
      <path d="M 660,85 L 675,80 L 678,100 L 662,108 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="0.7" opacity="0.65"/>
      {/* Iceland */}
      <ellipse cx="610" cy="60" rx="30" ry="15" fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="0.8" opacity="0.6"/>
      {/* Greece/Balkans */}
      <path d="M 830,175 L 870,165 L 880,200 L 860,210 L 840,200 Z"
        fill="url(#euGrad)" stroke="#4c2d9e" strokeWidth="0.8" opacity="0.7"/>

      {/* Africa */}
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450
               L 980,600 L 930,720 L 860,760 L 780,740 L 720,660
               L 680,520 L 660,380 L 660,270 Z"
        fill="url(#afGrad)" stroke="#7a3a05" strokeWidth="1.5" opacity="0.95"
        filter="url(#landShadow)"/>
      {/* Sahara region */}
      <path d="M 690,220 L 940,205 L 960,280 L 870,310 L 730,300 L 680,260 Z"
        fill="#3a1500" opacity="0.35"/>
      {/* Madagascar */}
      <ellipse cx="1010" cy="640" rx="18" ry="45" fill="url(#afGrad)" stroke="#7a3a05" strokeWidth="0.8" opacity="0.7"/>
      {/* Horn of Africa */}
      <path d="M 1000,440 L 1040,420 L 1060,470 L 1030,490 L 1000,475 Z"
        fill="url(#afGrad)" stroke="#7a3a05" strokeWidth="0.8" opacity="0.7"/>

      {/* Middle East */}
      <path d="M 950,200 L 1080,180 L 1120,240 L 1100,320 L 1040,360 L 980,340 L 950,270 Z"
        fill="#1e3040" stroke="#2e6090" strokeWidth="1.2" opacity="0.9"
        filter="url(#landShadow)"/>
      {/* Arabian Peninsula */}
      <path d="M 980,260 L 1080,250 L 1100,360 L 1060,420 L 990,400 L 965,320 Z"
        fill="#2d1500" stroke="#5a3010" strokeWidth="1" opacity="0.85"/>

      {/* Russia / North Asia — massive landmass */}
      <path d="M 820,40 L 1200,20 L 1380,60 L 1470,100 L 1500,140
               L 1420,180 L 1300,200 L 1150,190 L 1000,180 L 880,160 L 840,100 Z"
        fill="url(#asGradRussia)" stroke="#2e6090" strokeWidth="1.5" opacity="0.95"
        filter="url(#landShadow)"/>
      {/* Siberian interior */}
      <path d="M 1000,40 L 1300,30 L 1380,80 L 1300,150 L 1100,160 L 980,130 Z"
        fill="#101828" opacity="0.4"/>

      {/* Central/South Asia (Indian subcontinent) */}
      <path d="M 1080,200 L 1200,190 L 1260,250 L 1280,340 L 1240,440
               L 1180,490 L 1120,460 L 1085,370 L 1075,270 Z"
        fill="url(#asGrad)" stroke="#2e6090" strokeWidth="1.2" opacity="0.9"
        filter="url(#landShadow)"/>
      {/* Sri Lanka */}
      <ellipse cx="1195" cy="510" rx="10" ry="14" fill="url(#asGrad)" stroke="#2e6090" strokeWidth="0.7" opacity="0.7"/>

      {/* China / East Asia */}
      <path d="M 1160,120 L 1380,80 L 1470,140 L 1460,230 L 1380,300
               L 1260,310 L 1170,280 L 1145,200 Z"
        fill="url(#asGrad)" stroke="#2e6090" strokeWidth="1.5" opacity="0.9"
        filter="url(#landShadow)"/>
      {/* Korean Peninsula */}
      <path d="M 1380,165 L 1400,155 L 1410,190 L 1390,205 L 1374,188 Z"
        fill="url(#asGrad)" stroke="#2e6090" strokeWidth="0.8" opacity="0.75"/>

      {/* SE Asia mainland */}
      <path d="M 1280,300 L 1400,280 L 1470,360 L 1450,430 L 1360,440 L 1280,380 Z"
        fill="url(#asGrad)" stroke="#2e6090" strokeWidth="1" opacity="0.85"
        filter="url(#landShadow)"/>
      {/* Indonesia / Philippines island chains */}
      <ellipse cx="1380" cy="490" rx="30" ry="12" fill="url(#asGrad)" stroke="#2e6090" strokeWidth="0.7" opacity="0.7"/>
      <ellipse cx="1430" cy="505" rx="22" ry="10" fill="url(#asGrad)" stroke="#2e6090" strokeWidth="0.7" opacity="0.65"/>
      <ellipse cx="1460" cy="480" rx="16" ry="8"  fill="url(#asGrad)" stroke="#2e6090" strokeWidth="0.6" opacity="0.6"/>
      <ellipse cx="1350" cy="510" rx="18" ry="8"  fill="url(#asGrad)" stroke="#2e6090" strokeWidth="0.6" opacity="0.6"/>

      {/* Japan */}
      <path d="M 1440,130 L 1480,110 L 1510,160 L 1490,200 L 1455,190 Z"
        fill="url(#asGrad)" stroke="#2e6090" strokeWidth="0.8" opacity="0.75"/>
      {/* Hokkaido */}
      <path d="M 1480,110 L 1510,100 L 1525,125 L 1508,140 L 1485,130 Z"
        fill="url(#asGrad)" stroke="#2e6090" strokeWidth="0.7" opacity="0.7"/>

      {/* Australia */}
      <path d="M 1290,560 L 1480,520 L 1570,590 L 1580,720 L 1510,800
               L 1370,820 L 1240,770 L 1210,660 L 1240,580 Z"
        fill="url(#auGrad)" stroke="#8b3a05" strokeWidth="1.5" opacity="0.95"
        filter="url(#landShadow)"/>
      {/* Outback */}
      <path d="M 1310,600 L 1480,570 L 1540,650 L 1500,730 L 1360,750 L 1290,660 Z"
        fill="#3a1500" opacity="0.3"/>
      {/* Tasmania */}
      <ellipse cx="1445" cy="825" rx="18" ry="14" fill="url(#auGrad)" stroke="#8b3a05" strokeWidth="0.7" opacity="0.65"/>
      {/* New Zealand */}
      <path d="M 1540,720 L 1562,705 L 1575,740 L 1558,762 Z"
        fill="url(#auGrad)" stroke="#8b3a05" strokeWidth="0.8" opacity="0.65"/>
      <path d="M 1548,760 L 1565,748 L 1572,775 L 1556,790 Z"
        fill="url(#auGrad)" stroke="#8b3a05" strokeWidth="0.7" opacity="0.6"/>

      {/* ── Forest/jungle patches ── */}
      {showForests && FOREST_PATCHES.map((f, i) => (
        <ellipse key={i} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry}
          fill={f.fill} opacity="0.5"/>
      ))}

      {/* ── Desert patches ── */}
      {DESERT_PATCHES.map((d, i) => (
        <ellipse key={i} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry}
          fill={d.fill} opacity={d.opacity}/>
      ))}

      {/* ── Mountain ranges ── */}
      {showMountains && MOUNTAIN_RANGES.map((m, i) => (
        <g key={i}>
          {/* Shadow */}
          <path d={m.d} fill="none" stroke="#000" strokeWidth={m.width + 2} opacity="0.2" strokeLinecap="round"/>
          {/* Ridge */}
          <path d={m.d} fill="none" stroke={m.stroke} strokeWidth={m.width} opacity="0.7" strokeLinecap="round"/>
          {/* Snow highlight */}
          <path d={m.d} fill="none" stroke="#c8e0f0" strokeWidth="0.8" opacity="0.25" strokeLinecap="round"/>
        </g>
      ))}

      {/* ── Rivers ── */}
      {showRivers && RIVERS.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#0a2240" strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
          <path d={d} fill="none" stroke="#1a5a8a" strokeWidth="1.2" opacity="0.6" strokeLinecap="round"/>
        </g>
      ))}

      {/* ── Latitude labels ── */}
      {zoom >= 1.0 && (
        <>
          <text x={8} y={MAP_H*0.33+4} fill="#1e3a5a" fontSize="8" fontFamily="monospace" opacity="0.6">23°N</text>
          <text x={8} y={MAP_H*0.50+4} fill="#1e3a5a" fontSize="8" fontFamily="monospace" opacity="0.8">EQ</text>
          <text x={8} y={MAP_H*0.64+4} fill="#1e3a5a" fontSize="8" fontFamily="monospace" opacity="0.6">23°S</text>
        </>
      )}

      {/* ── Cities ── */}
      {showCities && CITIES.map((c) => (
        <g key={c.name}>
          {/* Glow */}
          <circle cx={c.x} cy={c.y} r={c.size + 5} fill="#f0e8c0" opacity="0.04"/>
          {/* Outer ring */}
          <circle cx={c.x} cy={c.y} r={c.size + 2} fill="none" stroke="#e2c870" strokeWidth="0.6" opacity="0.3"/>
          {/* City dot */}
          <circle cx={c.x} cy={c.y} r={c.size} fill="#f0e8d0" opacity="0.85"/>
          {/* Inner bright */}
          <circle cx={c.x} cy={c.y} r={c.size * 0.5} fill="#fff8e0" opacity="0.6"/>
          {showCityLabels && (
            <text x={c.x + c.size + 4} y={c.y + 3.5} fill="#c8b880"
              fontSize="9" fontFamily="monospace" opacity="0.9"
              style={{textShadow: "0 0 4px #000"}}>{c.name}</text>
          )}
        </g>
      ))}

      {/* ── Ice caps ── */}
      {ICE_CAPS.map((d, i) => (
        <path key={i} d={d} fill="url(#iceGrad)" opacity={i === 0 ? 0.7 : 0.5}/>
      ))}

      {/* ── Polar atmosphere glow ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#northPole)" opacity="0.4"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#southPole)" opacity="0.3"/>

      {/* ── Ocean shimmer highlights ── */}
      {[
        [580,350,3],[300,500,2],[1100,500,2.5],[1500,350,2],[450,750,2],
        [700,800,2],[1300,650,2.5],[200,700,2],[900,450,2],[1100,350,1.5],
        [600,250,1.5],[400,650,2],[1450,400,1.5],[800,550,2],[1200,450,1.5],
      ].map(([x,y,r],i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#38bdf8" opacity="0.06"/>
      ))}

      {/* ── Ocean current lines ── */}
      <path d="M 0,350 Q 200,300 400,360 Q 600,420 800,360 Q 1000,300 1200,360 Q 1400,420 1600,360"
        fill="none" stroke="#0e2a4a" strokeWidth="1.5" opacity="0.25" strokeDasharray="4,8"/>
      <path d="M 0,500 Q 300,540 600,500 Q 900,460 1200,500 Q 1400,520 1600,490"
        fill="none" stroke="#0e2a4a" strokeWidth="1" opacity="0.2" strokeDasharray="4,10"/>
    </g>
  );
}