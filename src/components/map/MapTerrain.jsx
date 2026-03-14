/**
 * MapTerrain – Rustic Industrial world map.
 * Dark green land masses with iron/steel tones, riveted steel borders,
 * factory smoke districts, aged military-industrial aesthetic.
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
        {/* ── Ocean — deep steel-blue industrial ── */}
        <radialGradient id="oceanInk" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="#1a2d3a"/>
          <stop offset="45%"  stopColor="#0f1e28"/>
          <stop offset="100%" stopColor="#060d12"/>
        </radialGradient>
        <radialGradient id="atlanticDeep" cx="36%" cy="44%" r="28%">
          <stop offset="0%"   stopColor="#162230"/>
          <stop offset="100%" stopColor="#060d12" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="pacificDeep" cx="68%" cy="55%" r="32%">
          <stop offset="0%"   stopColor="#0e1a22"/>
          <stop offset="100%" stopColor="#060d12" stopOpacity="0"/>
        </radialGradient>

        {/* ── Land fills — dark industrial green ── */}
        <linearGradient id="naLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#2d4a2d"/>
          <stop offset="60%"  stopColor="#1e3320"/>
          <stop offset="100%" stopColor="#162618"/>
        </linearGradient>
        <linearGradient id="saLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#2a4828"/>
          <stop offset="60%"  stopColor="#1c3018"/>
          <stop offset="100%" stopColor="#142214"/>
        </linearGradient>
        <linearGradient id="euLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#344e34"/>
          <stop offset="60%"  stopColor="#243824"/>
          <stop offset="100%" stopColor="#1a2c1a"/>
        </linearGradient>
        <linearGradient id="afLand" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#2e4a2c"/>
          <stop offset="50%"  stopColor="#1e3220"/>
          <stop offset="100%" stopColor="#142216"/>
        </linearGradient>
        <linearGradient id="asLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#2c4a2c"/>
          <stop offset="60%"  stopColor="#1e3420"/>
          <stop offset="100%" stopColor="#162618"/>
        </linearGradient>
        <linearGradient id="auLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#385030"/>
          <stop offset="60%"  stopColor="#263820"/>
          <stop offset="100%" stopColor="#1a2a16"/>
        </linearGradient>
        <linearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c8d8d0"/>
          <stop offset="100%" stopColor="#8aa8a0"/>
        </linearGradient>

        {/* ── Industrial steel border filter ── */}
        <filter id="steelEdge">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#4a6a3a" floodOpacity="0.7"/>
        </filter>
        <filter id="industrialGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3a5a2a" floodOpacity="0.5"/>
        </filter>

        {/* ── Riveted steel texture ── */}
        <pattern id="steelRivet" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1.2" fill="#2a3a2a" opacity="0.4"/>
          <circle cx="0"  cy="0"  r="0.8" fill="#2a3a2a" opacity="0.25"/>
          <circle cx="20" cy="0"  r="0.8" fill="#2a3a2a" opacity="0.25"/>
          <circle cx="0"  cy="20" r="0.8" fill="#2a3a2a" opacity="0.25"/>
          <circle cx="20" cy="20" r="0.8" fill="#2a3a2a" opacity="0.25"/>
        </pattern>

        {/* ── Ocean hatch — industrial crosshatch ── */}
        <pattern id="oceanHatch" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <line x1="0" y1="8" x2="16" y2="8" stroke="#1a3040" strokeWidth="0.4" opacity="0.3"/>
          <line x1="8" y1="0" x2="8" y2="16" stroke="#1a3040" strokeWidth="0.2" opacity="0.15"/>
        </pattern>

        {/* ── Land detail overlay ── */}
        <pattern id="landDetail" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="0.5" fill="#3a5a30" opacity="0.2"/>
        </pattern>

        {/* Vignette — dark steel edges */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="40%"  stopColor="transparent"/>
          <stop offset="100%" stopColor="#020508" stopOpacity="0.7"/>
        </radialGradient>

        {/* City glow — industrial amber */}
        <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#e08020" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#e08020" stopOpacity="0"/>
        </radialGradient>

        {/* Compass glow */}
        <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#4a7a40" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#4a7a40" stopOpacity="0"/>
        </radialGradient>

        {/* Industrial smoke gradient */}
        <radialGradient id="smokeGrad" cx="50%" cy="100%" r="80%">
          <stop offset="0%"   stopColor="#606060" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#303030" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* ── Ocean base — dark steel blue ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanInk)"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#atlanticDeep)" opacity="0.6"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#pacificDeep)"  opacity="0.6"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanHatch)"/>

      {/* ── Industrial grid lines — tactical map style ── */}
      {Array.from({length:17}).map((_,i) => (
        <line key={`v${i}`} x1={i*100} y1={0} x2={i*100} y2={MAP_H}
          stroke="#2a4030" strokeWidth="0.6" opacity="0.35" strokeDasharray="3,10"/>
      ))}
      {Array.from({length:10}).map((_,i) => (
        <line key={`h${i}`} x1={0} y1={i*100} x2={MAP_W} y2={i*100}
          stroke="#2a4030" strokeWidth="0.6" opacity="0.35" strokeDasharray="3,10"/>
      ))}
      {/* Equator — bold tactical line */}
      <line x1={0} y1={MAP_H/2} x2={MAP_W} y2={MAP_H/2}
        stroke="#3a6040" strokeWidth="1.5" strokeDasharray="12,6" opacity="0.55"/>
      {/* Tropics */}
      <line x1={0} y1={MAP_H*0.33} x2={MAP_W} y2={MAP_H*0.33}
        stroke="#3a5035" strokeWidth="0.8" strokeDasharray="5,14" opacity="0.35"/>
      <line x1={0} y1={MAP_H*0.64} x2={MAP_W} y2={MAP_H*0.64}
        stroke="#3a5035" strokeWidth="0.8" strokeDasharray="5,14" opacity="0.35"/>

      {/* ══ CONTINENTS — dark green industrial fills ══ */}

      {/* North America */}
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280
               L 420,340 L 380,400 L 330,430 L 270,420 L 220,380
               L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="url(#naLand)" stroke="#4a6a3a" strokeWidth="2" filter="url(#steelEdge)"/>
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280
               L 420,340 L 380,400 L 330,430 L 270,420 L 220,380
               L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="url(#steelRivet)" opacity="0.6"/>
      {/* Greenland */}
      <path d="M 420,20 L 520,15 L 540,60 L 500,90 L 430,80 Z"
        fill="url(#iceGrad)" stroke="#4a6060" strokeWidth="1.2" opacity="0.8"/>
      {/* Central America */}
      <path d="M 310,420 L 360,400 L 392,432 L 372,492 L 330,482 Z"
        fill="url(#naLand)" stroke="#4a6a3a" strokeWidth="1.2"/>
      {/* Caribbean */}
      <ellipse cx="427" cy="412" rx="20" ry="8" fill="url(#naLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.7"/>
      <ellipse cx="456" cy="426" rx="10" ry="5" fill="url(#naLand)" stroke="#4a6a3a" strokeWidth="0.6" opacity="0.6"/>

      {/* South America */}
      <path d="M 340,490 L 440,460 L 510,500 L 530,600 L 520,720
               L 470,800 L 400,810 L 340,770 L 290,680 L 280,580 L 300,510 Z"
        fill="url(#saLand)" stroke="#4a6a3a" strokeWidth="2" filter="url(#steelEdge)"/>
      <path d="M 340,490 L 440,460 L 510,500 L 530,600 L 520,720
               L 470,800 L 400,810 L 340,770 L 290,680 L 280,580 L 300,510 Z"
        fill="url(#steelRivet)" opacity="0.5"/>

      {/* Europe */}
      <path d="M 650,60 L 800,40 L 870,70 L 890,140 L 860,180 L 820,200
               L 780,220 L 740,210 L 700,180 L 660,150 L 640,100 Z"
        fill="url(#euLand)" stroke="#4a6a3a" strokeWidth="2" filter="url(#steelEdge)"/>
      <path d="M 650,160 L 700,150 L 720,200 L 700,240 L 660,230 L 645,190 Z"
        fill="url(#euLand)" stroke="#4a6a3a" strokeWidth="1.2"/>
      <path d="M 780,180 L 800,175 L 810,210 L 800,255 L 790,250 L 778,215 Z"
        fill="url(#euLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.85"/>
      <path d="M 740,30 L 800,20 L 830,55 L 810,90 L 760,80 L 730,55 Z"
        fill="url(#euLand)" stroke="#4a6a3a" strokeWidth="1.2"/>
      <path d="M 680,80 L 710,70 L 720,100 L 700,115 L 675,105 Z"
        fill="url(#euLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.8"/>
      <path d="M 660,85 L 675,80 L 678,100 L 662,108 Z"
        fill="url(#euLand)" stroke="#4a6a3a" strokeWidth="0.7" opacity="0.7"/>
      <ellipse cx="612" cy="60" rx="30" ry="15" fill="url(#euLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.65"/>
      <path d="M 830,175 L 870,165 L 880,200 L 860,210 L 840,200 Z"
        fill="url(#euLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.75"/>

      {/* Africa */}
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450
               L 980,600 L 930,720 L 860,760 L 780,740 L 720,660
               L 680,520 L 660,380 L 660,270 Z"
        fill="url(#afLand)" stroke="#4a6a3a" strokeWidth="2" filter="url(#steelEdge)"/>
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450
               L 980,600 L 930,720 L 860,760 L 780,740 L 720,660
               L 680,520 L 660,380 L 660,270 Z"
        fill="url(#steelRivet)" opacity="0.4"/>
      <ellipse cx="1012" cy="642" rx="18" ry="45" fill="url(#afLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.8"/>
      <path d="M 1000,440 L 1042,420 L 1062,472 L 1032,492 L 1000,477 Z"
        fill="url(#afLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.75"/>

      {/* Middle East */}
      <path d="M 950,200 L 1080,180 L 1120,240 L 1100,320 L 1040,360 L 980,340 L 950,270 Z"
        fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="1.4"/>
      {/* Arabian Peninsula */}
      <path d="M 980,260 L 1080,250 L 1100,360 L 1060,420 L 990,400 L 965,320 Z"
        fill="url(#afLand)" stroke="#4a6a3a" strokeWidth="1.2" opacity="0.9"/>

      {/* Russia / North Asia */}
      <path d="M 820,40 L 1200,20 L 1380,60 L 1470,100 L 1500,140
               L 1420,180 L 1300,200 L 1150,190 L 1000,180 L 880,160 L 840,100 Z"
        fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="2" filter="url(#steelEdge)"/>

      {/* Central/South Asia */}
      <path d="M 1080,200 L 1200,190 L 1260,250 L 1280,340 L 1240,440
               L 1180,490 L 1120,460 L 1085,370 L 1075,270 Z"
        fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="1.5" filter="url(#steelEdge)"/>
      <ellipse cx="1196" cy="512" rx="10" ry="14" fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="0.7" opacity="0.75"/>

      {/* China / East Asia */}
      <path d="M 1160,120 L 1380,80 L 1470,140 L 1460,230 L 1380,300
               L 1260,310 L 1170,280 L 1145,200 Z"
        fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="1.6" filter="url(#steelEdge)"/>
      <path d="M 1380,165 L 1402,155 L 1412,192 L 1392,207 L 1376,190 Z"
        fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.75"/>

      {/* SE Asia mainland */}
      <path d="M 1280,300 L 1400,280 L 1470,360 L 1450,430 L 1360,440 L 1280,380 Z"
        fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="1.2"/>
      {/* Indonesia */}
      <ellipse cx="1380" cy="490" rx="30" ry="12" fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="0.7" opacity="0.8"/>
      <ellipse cx="1432" cy="506" rx="22" ry="10" fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="0.7" opacity="0.7"/>
      <ellipse cx="1350" cy="512" rx="18" ry="8"  fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="0.6" opacity="0.65"/>

      {/* Japan */}
      <path d="M 1440,130 L 1480,110 L 1510,160 L 1490,200 L 1455,190 Z"
        fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="1" opacity="0.85"/>
      <path d="M 1480,110 L 1510,100 L 1526,126 L 1510,140 L 1486,132 Z"
        fill="url(#asLand)" stroke="#4a6a3a" strokeWidth="0.8" opacity="0.75"/>

      {/* Australia */}
      <path d="M 1290,560 L 1480,520 L 1570,590 L 1580,720 L 1510,800
               L 1370,820 L 1240,770 L 1210,660 L 1240,580 Z"
        fill="url(#auLand)" stroke="#4a6a3a" strokeWidth="2" filter="url(#steelEdge)"/>
      <path d="M 1290,560 L 1480,520 L 1570,590 L 1580,720 L 1510,800
               L 1370,820 L 1240,770 L 1210,660 L 1240,580 Z"
        fill="url(#steelRivet)" opacity="0.45"/>
      <ellipse cx="1447" cy="827" rx="18" ry="14" fill="url(#auLand)" stroke="#4a6a3a" strokeWidth="0.7" opacity="0.7"/>

      {/* ── Rivet detail overlay on all land ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#landDetail)" opacity="0.3"/>

      {/* ── Industrial mountain symbols (heavy steel-look) ── */}
      {zoom >= 0.6 && [
        { x:205, y:130, a:-15 }, { x:215, y:158, a:5 }, { x:200, y:182, a:-5 },
        { x:324, y:520, a:0  }, { x:320, y:560, a:5  }, { x:318, y:610, a:-5 },
        { x:762, y:168, a:10 }, { x:785, y:165, a:-5 }, { x:810, y:170, a:8  },
        { x:1128, y:230, a:5 }, { x:1165, y:222, a:-5}, { x:1200, y:218, a:5 }, { x:1240, y:228, a:-3},
        { x:978, y:182, a:5 }, { x:1010, y:178, a:-3 },
        { x:712, y:232, a:5 }, { x:745, y:228, a:-5 },
        { x:1016, y:95, a:0  }, { x:1018, y:118, a:5 },
        { x:1448, y:580, a:5 }, { x:1452, y:620, a:-5 },
      ].map((m, i) => (
        <g key={i} transform={`translate(${m.x},${m.y}) rotate(${m.a})`}>
          <path d="M -7 6 L 0 -8 L 7 6 Z" fill="#3a5a30" stroke="#5a7a48" strokeWidth="0.8" opacity="0.75"/>
          <path d="M -3 0 L 0 -8 L 3 0" fill="#5a8040" opacity="0.4"/>
        </g>
      ))}

      {/* ── Forest symbols (dark industrial dots) ── */}
      {zoom >= 0.5 && [
        ...[340,520,355,535,370,520,345,548,360,552,375,540,350,510].reduce((acc,v,i,arr) => i%2===0 ? [...acc,{x:arr[i],y:arr[i+1],r:5,key:`am${i}`}]:acc,[]),
        ...[842,465,860,478,875,468,850,490,865,502].reduce((acc,v,i,arr) => i%2===0 ? [...acc,{x:arr[i],y:arr[i+1],r:4.5,key:`co${i}`}]:acc,[]),
        ...[1320,370,1340,358,1360,370,1330,385,1350,382].reduce((acc,v,i,arr) => i%2===0 ? [...acc,{x:arr[i],y:arr[i+1],r:4,key:`sea${i}`}]:acc,[]),
        ...[185,135,200,122,218,138,234,128,245,140].reduce((acc,v,i,arr) => i%2===0 ? [...acc,{x:arr[i],y:arr[i+1],r:4,key:`ca${i}`}]:acc,[]),
      ].map(({ x, y, r, key }) => (
        <g key={key}>
          <circle cx={x} cy={y} r={r} fill="#2a4a22" opacity="0.6" stroke="#3a5a30" strokeWidth="0.6"/>
          <line x1={x} y1={y+r} x2={x} y2={y+r+3} stroke="#3a5030" strokeWidth="0.8" opacity="0.5"/>
        </g>
      ))}

      {/* ── Desert/mineral stipple ── */}
      {zoom >= 0.5 && [
        ...[880,260,920,252,950,265,970,278,890,278,930,270].reduce((acc,v,i,arr) => i%2===0?[...acc,{x:arr[i],y:arr[i+1]}]:acc,[]),
        ...[1040,280,1065,272,1080,285].reduce((acc,v,i,arr) => i%2===0?[...acc,{x:arr[i],y:arr[i+1]}]:acc,[]),
        ...[1380,660,1420,648,1450,660,1400,672].reduce((acc,v,i,arr) => i%2===0?[...acc,{x:arr[i],y:arr[i+1]}]:acc,[]),
      ].map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="2" fill="#4a5a30" opacity="0.4"/>
      ))}

      {/* ── Rivers (dark steel-blue ink lines) ── */}
      {zoom >= 0.5 && [
        "M 680,120 Q 720,160 700,222 Q 688,280 710,342",
        "M 800,280 Q 862,302 902,362 Q 942,422 922,502",
        "M 340,380 Q 382,442 370,522 Q 360,602 382,682",
        "M 1082,202 Q 1122,252 1102,322 Q 1090,382 1112,432",
        "M 1242,182 Q 1282,222 1262,282 Q 1252,352 1272,402",
        "M 200,182 Q 262,222 300,282 Q 322,322 300,382",
        "M 822,152 Q 862,182 882,242 Q 902,292 882,342",
        "M 1000,90 Q 1015,130 1010,165",
        "M 870,185 Q 895,210 908,250",
      ].map((d, i) => (
        <path key={i} d={d} fill="none"
          stroke="#1a3a50" strokeWidth={zoom > 1.5 ? 1.8 : 1.2}
          opacity="0.6" strokeLinecap="round"/>
      ))}

      {/* ── Ice caps — steel grey-green ── */}
      <path d="M 0,0 L 600,0 L 540,40 L 450,55 L 380,45 L 300,60 L 150,50 L 80,40 L 0,50 Z"
        fill="url(#iceGrad)" opacity="0.7" stroke="#6a8a80" strokeWidth="0.8"/>
      <path d="M 0,900 L 1600,900 L 1600,858 L 1400,848 L 1000,853 L 600,843 L 200,853 L 0,858 Z"
        fill="url(#iceGrad)" opacity="0.5" stroke="#6a8a80" strokeWidth="0.8"/>

      {/* ── Ocean depth ellipses ── */}
      {[[580,400,280,200],[1100,500,340,220],[800,820,200,60]].map(([cx,cy,rx,ry],i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
          fill="none" stroke="#1a3040" strokeWidth="0.6" opacity="0.25"
          strokeDasharray="3,9"/>
      ))}

      {/* ── Ocean current lines — industrial route markers ── */}
      <path d="M 60,400 Q 200,360 400,400 Q 580,440 700,380 Q 850,320 1050,380 Q 1250,440 1440,380 Q 1540,350 1590,360"
        fill="none" stroke="#1a3a50" strokeWidth="1" opacity="0.3" strokeDasharray="6,14"/>
      <path d="M 60,480 Q 300,510 560,480 Q 800,448 1100,480 Q 1350,505 1590,478"
        fill="none" stroke="#1a3a50" strokeWidth="0.8" opacity="0.2" strokeDasharray="4,12"/>

      {/* ── Industrial factory smoke stacks (at major industrial cities) ── */}
      {zoom >= 0.8 && [
        { x:388, y:182 }, { x:716, y:142 }, { x:948, y:118 },
        { x:1288, y:178 }, { x:1408, y:192 }, { x:350, y:172 },
      ].map((s,i) => (
        <g key={i}>
          <rect x={s.x-1.5} y={s.y-10} width="3" height="10" fill="#2a3a28" opacity="0.7"/>
          <rect x={s.x+3}   y={s.y-8}  width="2.5" height="8" fill="#2a3a28" opacity="0.6"/>
        </g>
      ))}

      {/* ── Lat/lon labels — industrial stencil font ── */}
      {zoom >= 0.9 && (
        <>
          <text x="8" y={MAP_H*0.33+4} fill="#4a7a50" fontSize="9" fontFamily="'Courier New',monospace" opacity="0.7">23°N</text>
          <text x="8" y={MAP_H*0.50+4} fill="#4a7a50" fontSize="9" fontFamily="'Courier New',monospace" opacity="0.9">EQ</text>
          <text x="8" y={MAP_H*0.64+4} fill="#4a7a50" fontSize="9" fontFamily="'Courier New',monospace" opacity="0.7">23°S</text>
        </>
      )}

      {/* ── Cities — industrial amber beacons ── */}
      {zoom >= 0.7 && CITIES.map((c) => {
        const isLarge = c.pop > 10;
        const r = isLarge ? c.size + 1 : c.size;
        return (
          <g key={c.name}>
            {isLarge ? (
              <>
                <circle cx={c.x} cy={c.y} r={r+5} fill="url(#cityGlow)" opacity="0.5"/>
                <circle cx={c.x} cy={c.y} r={r+2} fill="none" stroke="#a06020" strokeWidth="0.8" opacity="0.5"/>
                <rect x={c.x-r} y={c.y-r} width={r*2} height={r*2}
                  fill="#c07020" stroke="#6a3a10" strokeWidth="1" transform={`rotate(45,${c.x},${c.y})`}/>
                <line x1={c.x-r-4} y1={c.y} x2={c.x+r+4} y2={c.y} stroke="#6a3a10" strokeWidth="0.6" opacity="0.5"/>
                <line x1={c.x} y1={c.y-r-4} x2={c.x} y2={c.y+r+4} stroke="#6a3a10" strokeWidth="0.6" opacity="0.5"/>
              </>
            ) : (
              <>
                <circle cx={c.x} cy={c.y} r={r+1} fill="#e07020" opacity="0.2"/>
                <circle cx={c.x} cy={c.y} r={r} fill="#b06020" stroke="#6a3a10" strokeWidth="0.8"/>
              </>
            )}
            {zoom >= 1.2 && (
              <text x={c.x + r + 4} y={c.y + 4}
                fill="#c87030" fontSize={isLarge ? 10 : 8}
                fontFamily="'Courier New',monospace"
                opacity="0.95">{c.name}</text>
            )}
          </g>
        );
      })}

      {/* ── Compass Rose — industrial style ── */}
      {zoom >= 0.7 && (
        <g transform="translate(1540, 820)">
          <circle cx="0" cy="0" r="28" fill="url(#compassGlow)" opacity="0.5"/>
          <circle cx="0" cy="0" r="24" fill="none" stroke="#4a7a40" strokeWidth="1" opacity="0.5"/>
          <circle cx="0" cy="0" r="18" fill="none" stroke="#3a5a30" strokeWidth="0.5" opacity="0.3"/>
          {[0,90,180,270].map((angle, i) => (
            <g key={i} transform={`rotate(${angle})`}>
              <path d="M 0,-22 L 4,-8 L 0,-14 L -4,-8 Z" fill={i===0 ? "#a03020" : "#4a7a40"} opacity="0.9"/>
              <path d="M 0,-22 L -4,-8 L 0,-14 Z" fill="#2a4a28" opacity="0.6"/>
            </g>
          ))}
          <circle cx="0" cy="0" r="3" fill="#4a7a40" opacity="0.9"/>
          <text x="0" y="-28" textAnchor="middle" fill="#4a7a40" fontSize="8" fontFamily="'Courier New',monospace" opacity="0.9">N</text>
          <text x="0" y="36"  textAnchor="middle" fill="#4a7a40" fontSize="8" fontFamily="'Courier New',monospace" opacity="0.9">S</text>
          <text x="32" y="4"  textAnchor="middle" fill="#4a7a40" fontSize="8" fontFamily="'Courier New',monospace" opacity="0.9">E</text>
          <text x="-32" y="4" textAnchor="middle" fill="#4a7a40" fontSize="8" fontFamily="'Courier New',monospace" opacity="0.9">W</text>
        </g>
      )}

      {/* ── Map title block — stencil industrial ── */}
      {zoom <= 1.2 && (
        <g transform="translate(18, 18)">
          <rect x="0" y="0" width="168" height="38" rx="2"
            fill="#1a2a18" fillOpacity="0.85" stroke="#4a6a38" strokeWidth="1" opacity="0.8"/>
          <text x="8" y="16" fill="#6a9a48" fontSize="11" fontFamily="'Courier New',monospace"
            fontWeight="bold" opacity="0.9">EPOCH NATIONS</text>
          <text x="8" y="30" fill="#4a7a38" fontSize="8" fontFamily="'Courier New',monospace"
            opacity="0.7">TACTICAL WORLD MAP — LIVE</text>
        </g>
      )}

      {/* ── Vignette overlay ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#vignette)"/>
    </g>
  );
}