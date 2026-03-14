/**
 * MapTerrain – Vintage paper / rustic atlas world map.
 * Rich earthy parchment tones, hand-drawn contours, aged textures.
 * Includes progressive zoom detail levels.
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
        {/* ── Parchment / aged paper base ── */}
        <radialGradient id="parchBase" cx="50%" cy="45%" r="70%">
          <stop offset="0%"   stopColor="#c8a96e"/>
          <stop offset="35%"  stopColor="#b8965c"/>
          <stop offset="70%"  stopColor="#a07840"/>
          <stop offset="100%" stopColor="#7a5828"/>
        </radialGradient>

        {/* Ocean — deep ink blue, aged */}
        <radialGradient id="oceanInk" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="#2a4a6e"/>
          <stop offset="45%"  stopColor="#1e3655"/>
          <stop offset="100%" stopColor="#0f1e33"/>
        </radialGradient>
        <radialGradient id="atlanticDeep" cx="36%" cy="44%" r="28%">
          <stop offset="0%"   stopColor="#1a3050"/>
          <stop offset="100%" stopColor="#0f1e33" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="pacificDeep" cx="68%" cy="55%" r="32%">
          <stop offset="0%"   stopColor="#12253e"/>
          <stop offset="100%" stopColor="#0f1e33" stopOpacity="0"/>
        </radialGradient>

        {/* Land continent fills — warm earthy parchment tones */}
        <linearGradient id="naLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#c4a055"/>
          <stop offset="60%"  stopColor="#b08840"/>
          <stop offset="100%" stopColor="#957030"/>
        </linearGradient>
        <linearGradient id="saLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#b89048"/>
          <stop offset="60%"  stopColor="#a07838"/>
          <stop offset="100%" stopColor="#886025"/>
        </linearGradient>
        <linearGradient id="euLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#c0a858"/>
          <stop offset="60%"  stopColor="#a89040"/>
          <stop offset="100%" stopColor="#907828"/>
        </linearGradient>
        <linearGradient id="afLand" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#c09848"/>
          <stop offset="50%"  stopColor="#a87c35"/>
          <stop offset="100%" stopColor="#8c6020"/>
        </linearGradient>
        <linearGradient id="asLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#bea050"/>
          <stop offset="60%"  stopColor="#a08838"/>
          <stop offset="100%" stopColor="#887025"/>
        </linearGradient>
        <linearGradient id="auLand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#c8a050"/>
          <stop offset="60%"  stopColor="#b08040"/>
          <stop offset="100%" stopColor="#8c6025"/>
        </linearGradient>
        <linearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e8f0f8"/>
          <stop offset="100%" stopColor="#c0d0e0"/>
        </linearGradient>

        {/* Paper texture noise */}
        <filter id="paperTexture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
          <feBlend in="SourceGraphic" in2="gray" mode="multiply" result="blend"/>
          <feComposite in="blend" in2="SourceGraphic" operator="in"/>
        </filter>
        <filter id="paperNoise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="5" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
          <feBlend in="SourceGraphic" in2="gray" mode="overlay"/>
        </filter>

        {/* Aged vignette edges */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="40%"  stopColor="transparent"/>
          <stop offset="100%" stopColor="#3a1e00" stopOpacity="0.55"/>
        </radialGradient>

        {/* Ink border / coastline shadow */}
        <filter id="coastInk">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4a2800" floodOpacity="0.5"/>
        </filter>
        <filter id="inkBleed">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Aged map hatch/stipple pattern */}
        <pattern id="oceanHatch" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
          <line x1="0" y1="9" x2="18" y2="9" stroke="#3a5880" strokeWidth="0.4" opacity="0.25"/>
          <line x1="0" y1="0" x2="18" y2="18" stroke="#3a5880" strokeWidth="0.2" opacity="0.12"/>
        </pattern>
        <pattern id="landStipple" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="0.6" fill="#6a4010" opacity="0.18"/>
        </pattern>

        {/* Compass rose gradient */}
        <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#d4a840" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#d4a840" stopOpacity="0"/>
        </radialGradient>

        {/* City glow */}
        <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#f0c840" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#f0c840" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* ── Ocean base ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanInk)"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#atlanticDeep)" opacity="0.6"/>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#pacificDeep)"  opacity="0.6"/>
      {/* Ocean hatch lines — vintage cartographic effect */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#oceanHatch)"/>

      {/* ── Lat/lon grid lines — aged ink ── */}
      {Array.from({length:17}).map((_,i) => (
        <line key={`v${i}`} x1={i*100} y1={0} x2={i*100} y2={MAP_H}
          stroke="#4a6890" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,8"/>
      ))}
      {Array.from({length:10}).map((_,i) => (
        <line key={`h${i}`} x1={0} y1={i*100} x2={MAP_W} y2={i*100}
          stroke="#4a6890" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,8"/>
      ))}
      {/* Equator — bolder */}
      <line x1={0} y1={MAP_H/2} x2={MAP_W} y2={MAP_H/2}
        stroke="#6a88b0" strokeWidth="1.2" strokeDasharray="10,6" opacity="0.5"/>
      {/* Tropics */}
      <line x1={0} y1={MAP_H*0.33} x2={MAP_W} y2={MAP_H*0.33}
        stroke="#6a88b0" strokeWidth="0.7" strokeDasharray="5,12" opacity="0.35"/>
      <line x1={0} y1={MAP_H*0.64} x2={MAP_W} y2={MAP_H*0.64}
        stroke="#6a88b0" strokeWidth="0.7" strokeDasharray="5,12" opacity="0.35"/>

      {/* ── CONTINENTS — parchment fills with ink borders ── */}

      {/* North America */}
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280
               L 420,340 L 380,400 L 330,430 L 270,420 L 220,380
               L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="url(#naLand)" stroke="#5a3010" strokeWidth="1.8" filter="url(#coastInk)"/>
      <path d="M 120,80 L 280,60 L 380,80 L 460,130 L 500,200 L 480,280
               L 420,340 L 380,400 L 330,430 L 270,420 L 220,380
               L 180,320 L 140,260 L 110,190 L 100,130 Z"
        fill="url(#landStipple)" opacity="0.5"/>
      {/* Greenland */}
      <path d="M 420,20 L 520,15 L 540,60 L 500,90 L 430,80 Z"
        fill="url(#iceGrad)" stroke="#5a3010" strokeWidth="1.2" opacity="0.85"/>
      {/* Central America */}
      <path d="M 310,420 L 360,400 L 392,432 L 372,492 L 330,482 Z"
        fill="url(#naLand)" stroke="#5a3010" strokeWidth="1.2"/>
      {/* Caribbean */}
      <ellipse cx="427" cy="412" rx="20" ry="8" fill="url(#naLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.7"/>
      <ellipse cx="456" cy="426" rx="10" ry="5" fill="url(#naLand)" stroke="#5a3010" strokeWidth="0.6" opacity="0.6"/>

      {/* South America */}
      <path d="M 340,490 L 440,460 L 510,500 L 530,600 L 520,720
               L 470,800 L 400,810 L 340,770 L 290,680 L 280,580 L 300,510 Z"
        fill="url(#saLand)" stroke="#5a3010" strokeWidth="1.8" filter="url(#coastInk)"/>
      <path d="M 340,490 L 440,460 L 510,500 L 530,600 L 520,720
               L 470,800 L 400,810 L 340,770 L 290,680 L 280,580 L 300,510 Z"
        fill="url(#landStipple)" opacity="0.4"/>

      {/* Europe */}
      <path d="M 650,60 L 800,40 L 870,70 L 890,140 L 860,180 L 820,200
               L 780,220 L 740,210 L 700,180 L 660,150 L 640,100 Z"
        fill="url(#euLand)" stroke="#5a3010" strokeWidth="1.8" filter="url(#coastInk)"/>
      <path d="M 650,160 L 700,150 L 720,200 L 700,240 L 660,230 L 645,190 Z"
        fill="url(#euLand)" stroke="#5a3010" strokeWidth="1.2"/>
      <path d="M 780,180 L 800,175 L 810,210 L 800,255 L 790,250 L 778,215 Z"
        fill="url(#euLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.85"/>
      <path d="M 740,30 L 800,20 L 830,55 L 810,90 L 760,80 L 730,55 Z"
        fill="url(#euLand)" stroke="#5a3010" strokeWidth="1.2"/>
      <path d="M 680,80 L 710,70 L 720,100 L 700,115 L 675,105 Z"
        fill="url(#euLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.8"/>
      <path d="M 660,85 L 675,80 L 678,100 L 662,108 Z"
        fill="url(#euLand)" stroke="#5a3010" strokeWidth="0.7" opacity="0.7"/>
      <ellipse cx="612" cy="60" rx="30" ry="15" fill="url(#euLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.65"/>
      <path d="M 830,175 L 870,165 L 880,200 L 860,210 L 840,200 Z"
        fill="url(#euLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.75"/>

      {/* Africa */}
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450
               L 980,600 L 930,720 L 860,760 L 780,740 L 720,660
               L 680,520 L 660,380 L 660,270 Z"
        fill="url(#afLand)" stroke="#5a3010" strokeWidth="1.8" filter="url(#coastInk)"/>
      <path d="M 680,200 L 840,180 L 940,220 L 980,320 L 1000,450
               L 980,600 L 930,720 L 860,760 L 780,740 L 720,660
               L 680,520 L 660,380 L 660,270 Z"
        fill="url(#landStipple)" opacity="0.4"/>
      <ellipse cx="1012" cy="642" rx="18" ry="45" fill="url(#afLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.8"/>
      <path d="M 1000,440 L 1042,420 L 1062,472 L 1032,492 L 1000,477 Z"
        fill="url(#afLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.75"/>

      {/* Middle East */}
      <path d="M 950,200 L 1080,180 L 1120,240 L 1100,320 L 1040,360 L 980,340 L 950,270 Z"
        fill="url(#asLand)" stroke="#5a3010" strokeWidth="1.4"/>
      {/* Arabian Peninsula */}
      <path d="M 980,260 L 1080,250 L 1100,360 L 1060,420 L 990,400 L 965,320 Z"
        fill="url(#afLand)" stroke="#5a3010" strokeWidth="1.2" opacity="0.9"/>

      {/* Russia / North Asia */}
      <path d="M 820,40 L 1200,20 L 1380,60 L 1470,100 L 1500,140
               L 1420,180 L 1300,200 L 1150,190 L 1000,180 L 880,160 L 840,100 Z"
        fill="url(#asLand)" stroke="#5a3010" strokeWidth="1.8" filter="url(#coastInk)"/>

      {/* Central/South Asia (Indian subcontinent) */}
      <path d="M 1080,200 L 1200,190 L 1260,250 L 1280,340 L 1240,440
               L 1180,490 L 1120,460 L 1085,370 L 1075,270 Z"
        fill="url(#asLand)" stroke="#5a3010" strokeWidth="1.5" filter="url(#coastInk)"/>
      <ellipse cx="1196" cy="512" rx="10" ry="14" fill="url(#asLand)" stroke="#5a3010" strokeWidth="0.7" opacity="0.75"/>

      {/* China / East Asia */}
      <path d="M 1160,120 L 1380,80 L 1470,140 L 1460,230 L 1380,300
               L 1260,310 L 1170,280 L 1145,200 Z"
        fill="url(#asLand)" stroke="#5a3010" strokeWidth="1.6" filter="url(#coastInk)"/>
      <path d="M 1380,165 L 1402,155 L 1412,192 L 1392,207 L 1376,190 Z"
        fill="url(#asLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.75"/>

      {/* SE Asia mainland */}
      <path d="M 1280,300 L 1400,280 L 1470,360 L 1450,430 L 1360,440 L 1280,380 Z"
        fill="url(#asLand)" stroke="#5a3010" strokeWidth="1.2"/>
      {/* Indonesia */}
      <ellipse cx="1380" cy="490" rx="30" ry="12" fill="url(#asLand)" stroke="#5a3010" strokeWidth="0.7" opacity="0.8"/>
      <ellipse cx="1432" cy="506" rx="22" ry="10" fill="url(#asLand)" stroke="#5a3010" strokeWidth="0.7" opacity="0.7"/>
      <ellipse cx="1350" cy="512" rx="18" ry="8"  fill="url(#asLand)" stroke="#5a3010" strokeWidth="0.6" opacity="0.65"/>

      {/* Japan */}
      <path d="M 1440,130 L 1480,110 L 1510,160 L 1490,200 L 1455,190 Z"
        fill="url(#asLand)" stroke="#5a3010" strokeWidth="1" opacity="0.85"/>
      <path d="M 1480,110 L 1510,100 L 1526,126 L 1510,140 L 1486,132 Z"
        fill="url(#asLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.75"/>

      {/* Australia */}
      <path d="M 1290,560 L 1480,520 L 1570,590 L 1580,720 L 1510,800
               L 1370,820 L 1240,770 L 1210,660 L 1240,580 Z"
        fill="url(#auLand)" stroke="#5a3010" strokeWidth="1.8" filter="url(#coastInk)"/>
      <path d="M 1290,560 L 1480,520 L 1570,590 L 1580,720 L 1510,800
               L 1370,820 L 1240,770 L 1210,660 L 1240,580 Z"
        fill="url(#landStipple)" opacity="0.45"/>
      <ellipse cx="1447" cy="827" rx="18" ry="14" fill="url(#auLand)" stroke="#5a3010" strokeWidth="0.7" opacity="0.7"/>
      <path d="M 1542,722 L 1564,707 L 1577,742 L 1560,764 Z"
        fill="url(#auLand)" stroke="#5a3010" strokeWidth="0.8" opacity="0.7"/>
      <path d="M 1550,762 L 1567,750 L 1574,777 L 1558,792 Z"
        fill="url(#auLand)" stroke="#5a3010" strokeWidth="0.7" opacity="0.65"/>

      {/* ── Paper stipple / land texture overlay ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#parchBase)" opacity="0.06" filter="url(#paperNoise)"/>

      {/* ── Mountain symbols (ink hatch style) ── */}
      {zoom >= 0.6 && [
        // Rockies
        { x:205, y:130, a:-15 }, { x:215, y:158, a:5 }, { x:200, y:182, a:-5 },
        // Andes
        { x:324, y:520, a:0  }, { x:320, y:560, a:5  }, { x:318, y:610, a:-5 },
        // Alps
        { x:762, y:168, a:10 }, { x:785, y:165, a:-5 }, { x:810, y:170, a:8  },
        // Himalayas
        { x:1128, y:230, a:5 }, { x:1165, y:222, a:-5}, { x:1200, y:218, a:5 }, { x:1240, y:228, a:-3},
        // Caucasus
        { x:978, y:182, a:5 }, { x:1010, y:178, a:-3 },
        // Atlas
        { x:712, y:232, a:5 }, { x:745, y:228, a:-5 },
        // Urals
        { x:1016, y:95, a:0  }, { x:1018, y:118, a:5 },
        // Great Dividing Range
        { x:1448, y:580, a:5 }, { x:1452, y:620, a:-5 },
      ].map((m, i) => (
        <g key={i} transform={`translate(${m.x},${m.y}) rotate(${m.a})`}>
          <path d="M -7 6 L 0 -7 L 7 6 Z"
            fill="#8a6030" stroke="#5a3010" strokeWidth="0.6" opacity="0.65"/>
          <path d="M -3.5 0 L 0 -7 L 3.5 0" fill="#c8a870" opacity="0.4"/>
        </g>
      ))}

      {/* ── Forest symbols (ink tree dots) ── */}
      {zoom >= 0.5 && [
        // Amazon
        ...[
          [340,520],[355,535],[370,520],[345,548],[360,552],[375,540],[350,510],
        ].map((p,i) => ({ x:p[0], y:p[1], r:5, key:`am${i}` })),
        // Congo
        ...[
          [842,465],[860,478],[875,468],[850,490],[865,502],
        ].map((p,i) => ({ x:p[0], y:p[1], r:4.5, key:`co${i}` })),
        // SE Asia
        ...[
          [1320,370],[1340,358],[1360,370],[1330,385],[1350,382],
        ].map((p,i) => ({ x:p[0], y:p[1], r:4, key:`sea${i}` })),
        // Canadian boreal
        ...[
          [185,135],[200,122],[218,138],[234,128],[245,140],
        ].map((p,i) => ({ x:p[0], y:p[1], r:4, key:`ca${i}` })),
      ].map(({ x, y, r, key }) => (
        <g key={key}>
          <circle cx={x} cy={y} r={r} fill="#6a8830" opacity="0.45" stroke="#4a5820" strokeWidth="0.5"/>
          <line x1={x} y1={y+r} x2={x} y2={y+r+3} stroke="#4a5820" strokeWidth="0.6" opacity="0.4"/>
        </g>
      ))}

      {/* ── Desert stipple (dots) ── */}
      {zoom >= 0.5 && [
        // Sahara
        ...[880,260,920,252,950,265,970,278,890,278,930,270].map((v,i,arr) =>
          i%2===0 ? { x:arr[i], y:arr[i+1] } : null).filter(Boolean),
        // Arabian
        ...[1040,280,1065,272,1080,285].map((v,i,arr) =>
          i%2===0 ? { x:arr[i], y:arr[i+1] } : null).filter(Boolean),
        // Australian outback
        ...[1380,660,1420,648,1450,660,1400,672].map((v,i,arr) =>
          i%2===0 ? { x:arr[i], y:arr[i+1] } : null).filter(Boolean),
      ].map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="2" fill="#8a5818" opacity="0.35"/>
      ))}

      {/* ── Rivers (hand-drawn ink lines) ── */}
      {zoom >= 0.5 && [
        "M 680,120 Q 720,160 700,222 Q 688,280 710,342",    // Nile
        "M 800,280 Q 862,302 902,362 Q 942,422 922,502",    // Congo
        "M 340,380 Q 382,442 370,522 Q 360,602 382,682",    // Amazon
        "M 1082,202 Q 1122,252 1102,322 Q 1090,382 1112,432", // Ganges
        "M 1242,182 Q 1282,222 1262,282 Q 1252,352 1272,402", // Yangtze
        "M 200,182 Q 262,222 300,282 Q 322,322 300,382",    // Mississippi
        "M 822,152 Q 862,182 882,242 Q 902,292 882,342",    // Rhine/Danube
        "M 1000,90 Q 1015,130 1010,165",                    // Ob
        "M 870,185 Q 895,210 908,250",                      // Tigris
      ].map((d, i) => (
        <path key={i} d={d} fill="none"
          stroke="#2a4a80" strokeWidth={zoom > 1.5 ? 1.8 : 1.2}
          opacity="0.55" strokeLinecap="round"/>
      ))}

      {/* ── Ice caps ── */}
      <path d="M 0,0 L 600,0 L 540,40 L 450,55 L 380,45 L 300,60 L 150,50 L 80,40 L 0,50 Z"
        fill="url(#iceGrad)" opacity="0.75" stroke="#8ab0cc" strokeWidth="0.8"/>
      <path d="M 0,900 L 1600,900 L 1600,858 L 1400,848 L 1000,853 L 600,843 L 200,853 L 0,858 Z"
        fill="url(#iceGrad)" opacity="0.55" stroke="#8ab0cc" strokeWidth="0.8"/>

      {/* ── Ocean depth rings (faded ink circles) ── */}
      {[
        [580,400,280,200],[1100,500,340,220],[800,820,200,60],
      ].map(([cx,cy,rx,ry],i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
          fill="none" stroke="#3a5878" strokeWidth="0.6" opacity="0.2"
          strokeDasharray="3,9"/>
      ))}

      {/* ── Ocean current arrows (vintage sailing chart) ── */}
      <path d="M 60,400 Q 200,360 400,400 Q 580,440 700,380 Q 850,320 1050,380 Q 1250,440 1440,380 Q 1540,350 1590,360"
        fill="none" stroke="#4a6888" strokeWidth="1" opacity="0.3" strokeDasharray="6,14"/>
      <path d="M 60,480 Q 300,510 560,480 Q 800,448 1100,480 Q 1350,505 1590,478"
        fill="none" stroke="#4a6888" strokeWidth="0.8" opacity="0.2" strokeDasharray="4,12"/>

      {/* ── Latitude/longitude labels ── */}
      {zoom >= 0.9 && (
        <>
          <text x="8" y={MAP_H*0.33+4} fill="#7a9ab8" fontSize="9" fontFamily="'Times New Roman',serif" opacity="0.65" fontStyle="italic">23°N</text>
          <text x="8" y={MAP_H*0.50+4} fill="#7a9ab8" fontSize="9" fontFamily="'Times New Roman',serif" opacity="0.9"  fontStyle="italic">EQ</text>
          <text x="8" y={MAP_H*0.64+4} fill="#7a9ab8" fontSize="9" fontFamily="'Times New Roman',serif" opacity="0.65" fontStyle="italic">23°S</text>
        </>
      )}

      {/* ── Cities (vintage cartographic dots + labels) ── */}
      {zoom >= 0.7 && CITIES.map((c) => {
        const isLarge = c.pop > 10;
        const r = isLarge ? c.size + 1 : c.size;
        return (
          <g key={c.name}>
            {/* Star / cross for major cities */}
            {isLarge ? (
              <>
                <circle cx={c.x} cy={c.y} r={r+4} fill="url(#cityGlow)" opacity="0.5"/>
                <circle cx={c.x} cy={c.y} r={r+2} fill="none" stroke="#c8a030" strokeWidth="0.7" opacity="0.5"/>
                <circle cx={c.x} cy={c.y} r={r}   fill="#f0e0a0" stroke="#8a5818" strokeWidth="1"/>
                <line x1={c.x-r-3} y1={c.y} x2={c.x+r+3} y2={c.y} stroke="#8a5818" strokeWidth="0.5" opacity="0.5"/>
                <line x1={c.x} y1={c.y-r-3} x2={c.x} y2={c.y+r+3} stroke="#8a5818" strokeWidth="0.5" opacity="0.5"/>
              </>
            ) : (
              <>
                <circle cx={c.x} cy={c.y} r={r+1} fill="#e8c870" opacity="0.2"/>
                <circle cx={c.x} cy={c.y} r={r}   fill="#d4a840" stroke="#8a5818" strokeWidth="0.8"/>
              </>
            )}
            {zoom >= 1.2 && (
              <text x={c.x + r + 4} y={c.y + 4}
                fill="#c8980a" fontSize={isLarge ? 10 : 8}
                fontFamily="'Times New Roman',serif" fontStyle="italic"
                opacity="0.9">{c.name}</text>
            )}
          </g>
        );
      })}

      {/* ── Compass Rose (bottom-right corner) ── */}
      {zoom >= 0.7 && (
        <g transform="translate(1540, 820)">
          <circle cx="0" cy="0" r="28" fill="url(#compassGlow)" opacity="0.6"/>
          <circle cx="0" cy="0" r="24" fill="none" stroke="#c8a030" strokeWidth="0.8" opacity="0.4"/>
          {/* Cardinal points */}
          {[0,90,180,270].map((angle, i) => (
            <g key={i} transform={`rotate(${angle})`}>
              <path d="M 0,-22 L 4,-8 L 0,-14 L -4,-8 Z" fill={i===0 ? "#c84030" : "#c8a030"} opacity="0.8"/>
              <path d="M 0,-22 L -4,-8 L 0,-14 Z" fill="#8a6010" opacity="0.5"/>
            </g>
          ))}
          <circle cx="0" cy="0" r="3" fill="#c8a030" opacity="0.8"/>
          <text x="0" y="-28" textAnchor="middle" fill="#c8a030" fontSize="8" fontFamily="serif" opacity="0.8">N</text>
          <text x="0" y="36"  textAnchor="middle" fill="#c8a030" fontSize="8" fontFamily="serif" opacity="0.8">S</text>
          <text x="32" y="4"  textAnchor="middle" fill="#c8a030" fontSize="8" fontFamily="serif" opacity="0.8">E</text>
          <text x="-32" y="4" textAnchor="middle" fill="#c8a030" fontSize="8" fontFamily="serif" opacity="0.8">W</text>
        </g>
      )}

      {/* ── Map title block (top-left) ── */}
      {zoom <= 1.2 && (
        <g transform="translate(18, 18)">
          <rect x="0" y="0" width="160" height="38" rx="3"
            fill="#b89040" fillOpacity="0.18" stroke="#8a6020" strokeWidth="0.8" opacity="0.6"/>
          <text x="8" y="16" fill="#d4a030" fontSize="11" fontFamily="'Times New Roman',serif"
            fontWeight="bold" opacity="0.85">EPOCH NATIONS</text>
          <text x="8" y="30" fill="#c8900a" fontSize="8"  fontFamily="'Times New Roman',serif"
            fontStyle="italic" opacity="0.65">World Atlas — Live Map</text>
        </g>
      )}

      {/* ── Aged vignette overlay ── */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#vignette)"/>
    </g>
  );
}