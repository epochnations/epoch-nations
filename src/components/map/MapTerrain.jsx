/**
 * MapTerrain – Aged paper / antique cartography world map.
 * Warm parchment ocean, sepia land masses, hand-drawn ink aesthetic,
 * vintage compass rose, classic cartographic styling.
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

export const CITIES = [
  { name:"New York",     x:390,  y:185, size:5, pop: 8.3 },
  { name:"London",       x:720,  y:145, size:5, pop: 9.0 },
  { name:"Paris",        x:745,  y:170, size:4, pop: 2.1 },
  { name:"Moscow",       x:950,  y:120, size:5, pop: 12.5 },
  { name:"Cairo",        x:880,  y:340, size:4, pop: 10.1 },
  { name:"Mumbai",       x:1150, y:320, size:4, pop: 20.7 },
  { name:"Beijing",      x:1290, y:180, size:5, pop: 21.5 },
  { name:"Tokyo",        x:1410, y:195, size:5, pop: 37.4 },
  { name:"Sydney",       x:1440, y:625, size:4, pop: 5.3 },
  { name:"Sao Paulo",    x:420,  y:600, size:4, pop: 22.0 },
  { name:"Lagos",        x:760,  y:445, size:4, pop: 14.8 },
  { name:"Nairobi",      x:940,  y:525, size:3, pop: 4.7 },
  { name:"Dubai",        x:1025, y:305, size:4, pop: 3.3 },
  { name:"Singapore",    x:1335, y:435, size:4, pop: 5.9 },
  { name:"Toronto",      x:340,  y:162, size:3, pop: 6.2 },
  { name:"Berlin",       x:800,  y:138, size:3, pop: 3.7 },
  { name:"Delhi",        x:1160, y:262, size:4, pop: 32.0 },
  { name:"Jakarta",      x:1340, y:492, size:3, pop: 10.6 },
  { name:"Cape Town",    x:820,  y:685, size:3, pop: 4.6 },
  { name:"Buenos Aires", x:390,  y:682, size:3, pop: 15.2 },
  { name:"Chicago",      x:350,  y:175, size:3, pop: 9.5 },
  { name:"Shanghai",     x:1330, y:220, size:4, pop: 24.1 },
  { name:"Istanbul",     x:870,  y:178, size:3, pop: 15.5 },
  { name:"Mexico City",  x:290,  y:375, size:4, pop: 21.6 },
  { name:"Riyadh",       x:1000, y:310, size:3, pop: 7.7 },
];

export default function MapTerrain({ zoom }) {
  return (
    <g>
      <defs>
        {/* ── Parchment paper base ── */}
        <radialGradient id="parchmentBg" cx="50%" cy="50%" r="75%">
          <stop offset="0%"   stopColor="#c8b882"/>
          <stop offset="40%"  stopColor="#b8a86a"/>
          <stop offset="80%"  stopColor="#a89858"/>
          <stop offset="100%" stopColor="#8a7a40"/>
        </radialGradient>

        {/* ── Ocean — aged tea-stained water ── */}
        <radialGradient id="oceanPaper" cx="50%" cy="45%" r="75%">
          <stop offset="0%"   stopColor="#7a9ab2"/>
          <stop offset="40%"  stopColor="#6a8aa0"/>
          <stop offset="75%"  stopColor="#587890"/>
          <stop offset="100%" stopColor="#485870"/>
        </radialGradient>
        <radialGradient id="oceanShallow1" cx="35%" cy="44%" r="25%">
          <stop offset="0%"   stopColor="#8ab2ca" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#6a8aa0" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="oceanShallow2" cx="70%" cy="55%" r="30%">
          <stop offset="0%"   stopColor="#7aaac2" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#587890" stopOpacity="0"/>
        </radialGradient>

        {/* ── Land fills — aged parchment sepia ── */}
        <linearGradient id="naLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#d4b87a"/>
          <stop offset="50%"  stopColor="#c4a868"/>
          <stop offset="100%" stopColor="#b09050"/>
        </linearGradient>
        <linearGradient id="saLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#ceb870"/>
          <stop offset="50%"  stopColor="#bea860"/>
          <stop offset="100%" stopColor="#a89050"/>
        </linearGradient>
        <linearGradient id="euLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#d8c080"/>
          <stop offset="50%"  stopColor="#c8b070"/>
          <stop offset="100%" stopColor="#b49858"/>
        </linearGradient>
        <linearGradient id="afLand" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#d2b87a"/>
          <stop offset="50%"  stopColor="#c2a868"/>
          <stop offset="100%" stopColor="#ae9050"/>
        </linearGradient>
        <linearGradient id="asLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#d0bc78"/>
          <stop offset="50%"  stopColor="#c0ac68"/>
          <stop offset="100%" stopColor="#ac9450"/>
        </linearGradient>
        <linearGradient id="auLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#d8b870"/>
          <stop offset="50%"  stopColor="#c8a860"/>
          <stop offset="100%" stopColor="#b09050"/>
        </linearGradient>
        <linearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f0ece0"/>
          <stop offset="100%" stopColor="#d8d0c0"/>
        </linearGradient>

        {/* ── Ink drop shadow for land ── */}
        <filter id="inkEdge">
          <feDropShadow dx="1" dy="1" stdDeviation="2" floodColor="#5a3a10" floodOpacity="0.5"/>
        </filter>
        <filter id="inkEdgeSoft">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="1.5" floodColor="#5a3a10" floodOpacity="0.35"/>
        </filter>

        {/* ── Paper texture — fine grain ── */}
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blend"/>
          <feComponentTransfer in="blend">
            <feFuncA type="linear" slope="1"/>
          </feComponentTransfer>
        </filter>

        {/* ── Hatching for ocean depth ── */}
        <pattern id="oceanHatch" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <line x1="0" y1="6" x2="12" y2="6" stroke="#5a7a96" strokeWidth="0.35" opacity="0.25"/>
          <line x1="0" y1="0" x2="12" y2="12" stroke="#5a7a96" strokeWidth="0.2" opacity="0.12"/>
        </pattern>

        {/* ── Cross-hatch for land (vintage cartographic) ── */}
        <pattern id="landHatch" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="8" y2="4" stroke="#8a6030" strokeWidth="0.3" opacity="0.15"/>
          <line x1="4" y1="0" x2="4" y2="8" stroke="#8a6030" strokeWidth="0.3" opacity="0.1"/>
        </pattern>

        {/* ── Vignette — aged paper edges ── */}
        <radialGradient id="paperVignette" cx="50%" cy="50%" r="70%">
          <stop offset="35%"  stopColor="transparent"/>
          <stop offset="100%" stopColor="#3a2808" stopOpacity="0.55"/>
        </radialGradient>

        {/* City dot */}
        <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#8a3010" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#8a3010" stopOpacity="0"/>
        </radialGradient>

        {/* Compass glow */}
        <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#8a6030" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#8a6030" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* ── Parchment base ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#parchmentBg)"/>

      {/* ── Ocean fill ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanPaper)"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanShallow1)" opacity="0.7"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanShallow2)" opacity="0.6"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanHatch)"/>

      {/* ── Latitude / meridian lines (cartographic grid) ── */}
      {Array.from({length:17}).map((_,i) => (
        <line key={`v${i}`} x1={i*100} y1={0} x2={i*100} y2={MAP_H}
          stroke="#4a6888" strokeWidth="0.5" opacity="0.2" strokeDasharray="2,14"/>
      ))}
      {Array.from({length:10}).map((_,i) => (
        <line key={`h${i}`} x1={0} y1={i*100} x2={MAP_W} y2={i*100}
          stroke="#4a6888" strokeWidth="0.5" opacity="0.2" strokeDasharray="2,14"/>
      ))}
      {/* Equator — darker */}
      <line x1={0} y1={MAP_H/2} x2={MAP_W} y2={MAP_H/2}
        stroke="#4a5870" strokeWidth="1.2" strokeDasharray="8,6" opacity="0.4"/>
      {/* Tropics */}
      <line x1={0} y1={MAP_H*0.33} x2={MAP_W} y2={MAP_H*0.33}
        stroke="#4a5870" strokeWidth="0.6" strokeDasharray="4,12" opacity="0.25"/>
      <line x1={0} y1={MAP_H*0.64} x2={MAP_W} y2={MAP_H*0.64}
        stroke="#4a5870" strokeWidth="0.6" strokeDasharray="4,12" opacity="0.25"/>

      {/* ══ CONTINENTS ══ */}

      {/* North America */}
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280
               L 420,340 L 380,400 L 330,430 L 270,420 L 220,380
               L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="url(#naLand)" stroke="#7a5020" strokeWidth="1.8" filter="url(#inkEdge)"/>
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280
               L 420,340 L 380,400 L 330,430 L 270,420 L 220,380
               L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="url(#landHatch)" opacity="0.8"/>
      {/* Greenland */}
      <path d="M 420,20 L 520,15 L 540,60 L 500,90 L 430,80 Z"
        fill="url(#iceGrad)" stroke="#8a7060" strokeWidth="1.2" opacity="0.9"/>
      {/* Central America */}
      <path d="M 310,420 L 360,400 L 392,432 L 372,492 L 330,482 Z"
        fill="url(#naLand)" stroke="#7a5020" strokeWidth="1.2" filter="url(#inkEdgeSoft)"/>
      <ellipse cx="427" cy="412" rx="20" ry="8" fill="url(#naLand)" stroke="#7a5020" strokeWidth="0.8" opacity="0.8"/>

      {/* South America */}
      <path d="M 340,490 L 440,460 L 510,500 L 530,600 L 520,720
               L 470,800 L 400,810 L 340,770 L 290,680 L 280,580 L 300,510 Z"
        fill="url(#saLand)" stroke="#7a5020" strokeWidth="1.8" filter="url(#inkEdge)"/>
      <path d="M 340,490 L 440,460 L 510,500 L 530,600 L 520,720
               L 470,800 L 400,810 L 340,770 L 290,680 L 280,580 L 300,510 Z"
        fill="url(#landHatch)" opacity="0.7"/>

      {/* Europe */}
      <path d="M 650,60 L 800,40 L 870,70 L 890,140 L 860,180 L 820,200
               L 780,220 L 740,210 L 700,180 L 660,150 L 640,100 Z"
        fill="url(#euLand)" stroke="#7a5020" strokeWidth="1.8" filter="url(#inkEdge)"/>
      <path d="M 650,160 L 700,150 L 720,200 L 700,240 L 660,230 L 645,190 Z"
        fill="url(#euLand)" stroke="#7a5020" strokeWidth="1.2" filter="url(#inkEdgeSoft)"/>
      <path d="M 780,180 L 800,175 L 810,210 L 800,255 L 790,250 L 778,215 Z"
        fill="url(#euLand)" stroke="#7a5020" strokeWidth="0.8" opacity="0.9"/>
      <path d="M 740,30 L 800,20 L 830,55 L 810,90 L 760,80 L 730,55 Z"
        fill="url(#euLand)" stroke="#7a5020" strokeWidth="1.2" filter="url(#inkEdgeSoft)"/>
      <ellipse cx="612" cy="60" rx="30" ry="15" fill="url(#euLand)" stroke="#7a5020" strokeWidth="0.8" opacity="0.7"/>

      {/* Africa */}
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450
               L 980,600 L 930,720 L 860,760 L 780,740 L 720,660
               L 680,520 L 660,380 L 660,270 Z"
        fill="url(#afLand)" stroke="#7a5020" strokeWidth="1.8" filter="url(#inkEdge)"/>
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450
               L 980,600 L 930,720 L 860,760 L 780,740 L 720,660
               L 680,520 L 660,380 L 660,270 Z"
        fill="url(#landHatch)" opacity="0.6"/>
      <ellipse cx="1012" cy="642" rx="18" ry="45" fill="url(#afLand)" stroke="#7a5020" strokeWidth="0.8" opacity="0.85"/>

      {/* Middle East */}
      <path d="M 950,200 L 1080,180 L 1120,240 L 1100,320 L 1040,360 L 980,340 L 950,270 Z"
        fill="url(#asLand)" stroke="#7a5020" strokeWidth="1.4" filter="url(#inkEdgeSoft)"/>
      <path d="M 980,260 L 1080,250 L 1100,360 L 1060,420 L 990,400 L 965,320 Z"
        fill="url(#afLand)" stroke="#7a5020" strokeWidth="1.2" opacity="0.95"/>

      {/* Russia / North Asia */}
      <path d="M 820,40 L 1200,20 L 1380,60 L 1470,100 L 1500,140
               L 1420,180 L 1300,200 L 1150,190 L 1000,180 L 880,160 L 840,100 Z"
        fill="url(#asLand)" stroke="#7a5020" strokeWidth="1.8" filter="url(#inkEdge)"/>

      {/* Central/South Asia */}
      <path d="M 1080,200 L 1200,190 L 1260,250 L 1280,340 L 1240,440
               L 1180,490 L 1120,460 L 1085,370 L 1075,270 Z"
        fill="url(#asLand)" stroke="#7a5020" strokeWidth="1.5" filter="url(#inkEdge)"/>

      {/* China / East Asia */}
      <path d="M 1160,120 L 1380,80 L 1470,140 L 1460,230 L 1380,300
               L 1260,310 L 1170,280 L 1145,200 Z"
        fill="url(#asLand)" stroke="#7a5020" strokeWidth="1.6" filter="url(#inkEdge)"/>

      {/* SE Asia */}
      <path d="M 1280,300 L 1400,280 L 1470,360 L 1450,430 L 1360,440 L 1280,380 Z"
        fill="url(#asLand)" stroke="#7a5020" strokeWidth="1.2" filter="url(#inkEdgeSoft)"/>
      <ellipse cx="1380" cy="490" rx="30" ry="12" fill="url(#asLand)" stroke="#7a5020" strokeWidth="0.7" opacity="0.85"/>
      <ellipse cx="1432" cy="506" rx="22" ry="10" fill="url(#asLand)" stroke="#7a5020" strokeWidth="0.7" opacity="0.75"/>

      {/* Japan */}
      <path d="M 1440,130 L 1480,110 L 1510,160 L 1490,200 L 1455,190 Z"
        fill="url(#asLand)" stroke="#7a5020" strokeWidth="1" opacity="0.9"/>

      {/* Australia */}
      <path d="M 1290,560 L 1480,520 L 1570,590 L 1580,720 L 1510,800
               L 1370,820 L 1240,770 L 1210,660 L 1240,580 Z"
        fill="url(#auLand)" stroke="#7a5020" strokeWidth="1.8" filter="url(#inkEdge)"/>
      <path d="M 1290,560 L 1480,520 L 1570,590 L 1580,720 L 1510,800
               L 1370,820 L 1240,770 L 1210,660 L 1240,580 Z"
        fill="url(#landHatch)" opacity="0.6"/>

      {/* ── Ice caps ── */}
      <path d="M 0,0 L 600,0 L 540,40 L 450,55 L 380,45 L 300,60 L 150,50 L 80,40 L 0,50 Z"
        fill="url(#iceGrad)" opacity="0.85" stroke="#a09080" strokeWidth="0.8"/>
      <path d="M 0,900 L 1600,900 L 1600,858 L 1400,848 L 1000,853 L 600,843 L 200,853 L 0,858 Z"
        fill="url(#iceGrad)" opacity="0.65" stroke="#a09080" strokeWidth="0.8"/>

      {/* ── Mountains — hand-drawn style ── */}
      {zoom >= 0.6 && [
        { x:205, y:130, a:-15 }, { x:215, y:158, a:5  }, { x:200, y:182, a:-5 },
        { x:324, y:520, a:0   }, { x:320, y:560, a:5  }, { x:318, y:610, a:-5 },
        { x:762, y:168, a:10  }, { x:785, y:165, a:-5 }, { x:810, y:170, a:8  },
        { x:1128,y:230, a:5   }, { x:1165,y:222, a:-5 }, { x:1200,y:218,a:5 }, { x:1240,y:228,a:-3 },
        { x:978, y:182, a:5   }, { x:1010,y:178, a:-3 },
        { x:712, y:232, a:5   }, { x:745, y:228, a:-5 },
        { x:1016,y:95,  a:0   }, { x:1018,y:118, a:5  },
        { x:1448,y:580, a:5   }, { x:1452,y:620, a:-5 },
      ].map((m, i) => (
        <g key={i} transform={`translate(${m.x},${m.y}) rotate(${m.a})`}>
          <path d="M -8 7 L 0 -10 L 8 7 Z" fill="#a07840" stroke="#7a5020" strokeWidth="0.9" opacity="0.8"/>
          <path d="M -3 0 L 0 -10 L 3 0" fill="#d8c888" opacity="0.5"/>
          {/* Snow cap */}
          <path d="M -2 -5 L 0 -10 L 2 -5" fill="#f0ece0" opacity="0.7"/>
        </g>
      ))}

      {/* ── Trees / forests ── */}
      {zoom >= 0.5 && [
        { x:340, y:520 }, { x:355, y:535 }, { x:370, y:520 },
        { x:345, y:548 }, { x:360, y:552 }, { x:375, y:540 },
        { x:842, y:465 }, { x:860, y:478 }, { x:875, y:468 },
        { x:1320,y:370 }, { x:1340,y:358 }, { x:1360,y:370 },
        { x:185, y:135 }, { x:200, y:122 }, { x:218, y:138 },
      ].map(({ x, y }, i) => (
        <g key={i}>
          {/* Ink-drawn tree — classic cartographic dot-tree */}
          <circle cx={x} cy={y} r={4} fill="#7a9050" opacity="0.7" stroke="#5a6830" strokeWidth="0.6"/>
          <line x1={x} y1={y+4} x2={x} y2={y+7} stroke="#6a5030" strokeWidth="0.8" opacity="0.6"/>
        </g>
      ))}

      {/* ── Rivers — ink lines ── */}
      {zoom >= 0.5 && [
        "M 680,120 Q 720,160 700,222 Q 688,280 710,342",
        "M 800,280 Q 862,302 902,362 Q 942,422 922,502",
        "M 340,380 Q 382,442 370,522 Q 360,602 382,682",
        "M 1082,202 Q 1122,252 1102,322 Q 1090,382 1112,432",
        "M 200,182 Q 262,222 300,282 Q 322,322 300,382",
        "M 822,152 Q 862,182 882,242 Q 902,292 882,342",
      ].map((d, i) => (
        <path key={i} d={d} fill="none"
          stroke="#5a7a96" strokeWidth={zoom > 1.5 ? 1.6 : 1.0}
          opacity="0.55" strokeLinecap="round"/>
      ))}

      {/* ── Ocean depth rings — cartographic soundings ── */}
      {[[580,400,280,200],[1100,500,340,220],[800,820,200,60]].map(([cx,cy,rx,ry],i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
          fill="none" stroke="#4a6888" strokeWidth="0.5" opacity="0.2"
          strokeDasharray="2,10"/>
      ))}

      {/* ── Ocean current lines ── */}
      <path d="M 60,400 Q 200,360 400,400 Q 580,440 700,380 Q 850,320 1050,380 Q 1250,440 1440,380"
        fill="none" stroke="#4a6888" strokeWidth="0.8" opacity="0.22" strokeDasharray="5,12"/>

      {/* ── Lat/lon labels ── */}
      {zoom >= 0.9 && (
        <>
          <text x="10" y={MAP_H*0.33+4} fill="#5a4020" fontSize="9" fontFamily="'Georgia',serif" opacity="0.75" fontStyle="italic">23°N</text>
          <text x="10" y={MAP_H*0.50+4} fill="#5a4020" fontSize="9" fontFamily="'Georgia',serif" opacity="0.9"  fontStyle="italic">EQ</text>
          <text x="10" y={MAP_H*0.64+4} fill="#5a4020" fontSize="9" fontFamily="'Georgia',serif" opacity="0.75" fontStyle="italic">23°S</text>
        </>
      )}

      {/* ── Cities — classic cartographic dots ── */}
      {zoom >= 0.7 && CITIES.map((c) => {
        const isLarge = c.pop > 10;
        const r = isLarge ? c.size + 1 : c.size;
        return (
          <g key={c.name}>
            {isLarge ? (
              <>
                <circle cx={c.x} cy={c.y} r={r+5} fill="url(#cityGlow)" opacity="0.45"/>
                {/* Star symbol for major cities */}
                {[0,72,144,216,288].map((angle, ai) => {
                  const rad = (angle - 90) * Math.PI / 180;
                  const x2 = c.x + Math.cos(rad) * (r + 3);
                  const y2 = c.y + Math.sin(rad) * (r + 3);
                  return <line key={ai} x1={c.x} y1={c.y} x2={x2} y2={y2} stroke="#8a3010" strokeWidth="1" opacity="0.7"/>;
                })}
                <circle cx={c.x} cy={c.y} r={r} fill="#c05020" stroke="#6a2010" strokeWidth="1.2"/>
                <circle cx={c.x} cy={c.y} r={r-1.5} fill="#d07038" opacity="0.7"/>
              </>
            ) : (
              <>
                <circle cx={c.x} cy={c.y} r={r+1} fill="#8a3010" opacity="0.15"/>
                {/* Square dot for smaller cities */}
                <rect x={c.x - r*0.7} y={c.y - r*0.7} width={r*1.4} height={r*1.4}
                  fill="#a04020" stroke="#6a2010" strokeWidth="0.8" transform={`rotate(45,${c.x},${c.y})`}/>
              </>
            )}
            {zoom >= 1.2 && (
              <text x={c.x + r + 5} y={c.y + 4}
                fill="#4a2808"
                fontSize={isLarge ? 10 : 8}
                fontFamily="'Georgia', 'Times New Roman', serif"
                fontStyle="italic"
                opacity="0.9">{c.name}</text>
            )}
          </g>
        );
      })}

      {/* ── Compass Rose — ornate cartographic ── */}
      {zoom >= 0.7 && (
        <g transform="translate(1540, 820)">
          <circle cx="0" cy="0" r="30" fill="url(#compassGlow)" opacity="0.6"/>
          <circle cx="0" cy="0" r="26" fill="#c8b070" opacity="0.7" stroke="#7a5020" strokeWidth="1.2"/>
          <circle cx="0" cy="0" r="22" fill="none" stroke="#7a5020" strokeWidth="0.7" opacity="0.5"/>
          {/* 8-point compass */}
          {[0,45,90,135,180,225,270,315].map((angle, i) => {
            const isCardinal = i % 2 === 0;
            const len = isCardinal ? 20 : 13;
            const w = isCardinal ? 5 : 3;
            return (
              <g key={i} transform={`rotate(${angle})`}>
                <path d={`M 0,-${len} L ${w/2},-6 L 0,-10 L -${w/2},-6 Z`}
                  fill={i === 0 ? "#8a2010" : "#6a4820"}
                  stroke="#4a2808" strokeWidth="0.5" opacity="0.9"/>
                <path d={`M 0,${6} L ${w/2},${8} L 0,${len} L -${w/2},${8} Z`}
                  fill="#a08040" stroke="#4a2808" strokeWidth="0.5" opacity="0.7"/>
              </g>
            );
          })}
          <circle cx="0" cy="0" r="4" fill="#7a5020" stroke="#4a2808" strokeWidth="0.8"/>
          <circle cx="0" cy="0" r="2" fill="#c8b070"/>
          <text x="0"  y="-30" textAnchor="middle" fill="#4a2808" fontSize="9"  fontFamily="'Georgia',serif" fontWeight="bold">N</text>
          <text x="0"  y="38"  textAnchor="middle" fill="#4a2808" fontSize="9"  fontFamily="'Georgia',serif" fontWeight="bold">S</text>
          <text x="34" y="4"   textAnchor="middle" fill="#4a2808" fontSize="9"  fontFamily="'Georgia',serif" fontWeight="bold">E</text>
          <text x="-34" y="4"  textAnchor="middle" fill="#4a2808" fontSize="9"  fontFamily="'Georgia',serif" fontWeight="bold">W</text>
        </g>
      )}

      {/* ── Map title cartouche ── */}
      {zoom <= 1.2 && (
        <g transform="translate(18, 18)">
          {/* Cartouche border */}
          <rect x="-2" y="-2" width="188" height="50" rx="4"
            fill="#c8b070" fillOpacity="0.9" stroke="#7a5020" strokeWidth="2"/>
          <rect x="1" y="1" width="182" height="44" rx="3"
            fill="none" stroke="#a08040" strokeWidth="0.8" opacity="0.6"/>
          <text x="8" y="17" fill="#4a2808" fontSize="11"
            fontFamily="'Georgia', 'Times New Roman', serif"
            fontWeight="bold" fontStyle="italic" opacity="0.95">EPOCH NATIONS</text>
          <text x="8" y="31" fill="#6a4020" fontSize="8"
            fontFamily="'Georgia', serif"
            fontStyle="italic" opacity="0.8">Carta Mundi — Anno Domini MMXXVI</text>
          {/* Decorative line */}
          <line x1="8" y1="35" x2="176" y2="35" stroke="#9a7030" strokeWidth="0.7" opacity="0.5"/>
          <text x="8" y="43" fill="#6a4020" fontSize="7"
            fontFamily="'Georgia', serif" fontStyle="italic" opacity="0.65">LIVE TACTICAL WORLD MAP</text>
        </g>
      )}

      {/* ── Aged paper vignette / edge burn ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#paperVignette)"/>

      {/* ── Infinite ocean extension tiles (beyond map edges) ── */}
      {/* Extends the parchment/ocean in all directions for infinite world feel */}
      {[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].map(([tx,ty]) => (
        <rect key={`${tx}_${ty}`}
          x={tx * MAP_W} y={ty * MAP_H}
          width={MAP_W} height={MAP_H}
          fill="url(#oceanPaper)" opacity="0.85"/>
      ))}
      {/* Subtle extended parchment border fade on extensions */}
      {[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].map(([tx,ty]) => (
        <rect key={`hatch_${tx}_${ty}`}
          x={tx * MAP_W} y={ty * MAP_H}
          width={MAP_W} height={MAP_H}
          fill="url(#oceanHatch)" opacity="0.6"/>
      ))}

      {/* ── Border frame — ink margin ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H}
        fill="none" stroke="#5a3a10" strokeWidth="4" opacity="0.4"/>
      <rect x="6" y="6" width={MAP_W-12} height={MAP_H-12}
        fill="none" stroke="#7a5020" strokeWidth="1.2" opacity="0.25"/>
    </g>
  );
}