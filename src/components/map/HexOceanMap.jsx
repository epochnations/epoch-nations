/**
 * HexOceanMap — Hex-island ocean world map.
 * Replaces the old WorldMap on the Dashboard.
 * Infinite hex grid, island ownership, purchases, trade routes, fog of war.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Globe, Map, Wifi, Brain, Layers, Plus } from "lucide-react";
import { useMapEngine } from "./MapEngine";
import IslandPanel from "./hex/IslandPanel";
import HexOceanDefs from "./hex/HexOceanDefs";

// ── World constants ─────────────────────────────────────────────────────────
export const WORLD_W = 6000;
export const WORLD_H = 5000;
export const HEX_SIZE = 52;
export const HEX_ORIGIN_X = WORLD_W / 2;
export const HEX_ORIGIN_Y = WORLD_H / 2;
export const SQRT3 = Math.sqrt(3);

// ── Hex math (flat-top axial) ────────────────────────────────────────────────
export function hexToWorld(q, r) {
  return {
    x: HEX_ORIGIN_X + HEX_SIZE * 1.5 * q,
    y: HEX_ORIGIN_Y + HEX_SIZE * SQRT3 * (r + q / 2),
  };
}

export function hexCornerPoints(cx, cy, size = HEX_SIZE) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function hexRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

function worldToHex(wx, wy) {
  const q_f = (wx - HEX_ORIGIN_X) / (HEX_SIZE * 1.5);
  const r_f = (wy - HEX_ORIGIN_Y) / (HEX_SIZE * SQRT3) - q_f / 2;
  return hexRound(q_f, r_f);
}

// ── Deterministic pseudo-random ──────────────────────────────────────────────
export function seededRand(q, r, seed = 0) {
  const n = Math.sin(q * 127.1 + r * 311.7 + seed * 74.3) * 43758.5453;
  return n - Math.floor(n);
}

export const TERRAIN_CONFIG = {
  tropical:  { land: "#27ae60", shore: "#f0c060", deep: "#1a8a45", label: "Tropical",  emoji: "🌴", rColor: "#4ade80" },
  forest:    { land: "#1e7a32", shore: "#c8b060", deep: "#0f4a1e", label: "Forest",    emoji: "🌲", rColor: "#86efac" },
  plains:    { land: "#8bc34a", shore: "#e8d870", deep: "#5a9020", label: "Plains",    emoji: "🌾", rColor: "#d9f99d" },
  rocky:     { land: "#7d6856", shore: "#c0a880", deep: "#4a3828", label: "Rocky",     emoji: "⛰️", rColor: "#d6d3d1" },
  desert:    { land: "#f9a825", shore: "#fce4a0", deep: "#b07010", label: "Desert",    emoji: "🏜️", rColor: "#fde68a" },
  volcanic:  { land: "#e53935", shore: "#e8c880", deep: "#900020", label: "Volcanic",  emoji: "🌋", rColor: "#fca5a5" },
  tundra:    { land: "#90b8c8", shore: "#e0eef5", deep: "#506878", label: "Tundra",    emoji: "❄️", rColor: "#bae6fd" },
  coastal:   { land: "#26c6da", shore: "#ffe0b2", deep: "#00838f", label: "Coastal",   emoji: "🏖️", rColor: "#67e8f9" },
  mountains: { land: "#607080", shore: "#c8d8e0", deep: "#303848", label: "Mountains", emoji: "🏔️", rColor: "#cbd5e1" },
};

export const TERRAIN_TYPES = Object.keys(TERRAIN_CONFIG);

export function generateTerrain(q, r) {
  return TERRAIN_TYPES[Math.floor(seededRand(q, r, 1) * TERRAIN_TYPES.length)];
}

export function islandPrice(q, r, nearbyCount = 0) {
  const dist = Math.sqrt(q * q + r * r);
  const base = dist < 4 ? 800 : dist < 8 ? 2500 : dist < 15 ? 8000 : 30000;
  const bonus = nearbyCount * 600;
  return Math.round((base + bonus) * (seededRand(q, r, 5) * 0.3 + 0.85) / 100) * 100;
}

// ── Island tile SVG renderer ─────────────────────────────────────────────────
function IslandHex({ q, r, tile, myNation, isSelected, onClick, zoom }) {
  const { x: cx, y: cy } = hexToWorld(q, r);
  const cfg = TERRAIN_CONFIG[tile.terrain_type] || TERRAIN_CONFIG.tropical;
  const isOwned = !!tile.owner_nation_id;
  const isMe = tile.owner_nation_id === myNation?.id;

  // Organic island shape — offset ellipse inside hex
  const rx = HEX_SIZE * 0.62 + (seededRand(q, r, 10) - 0.5) * HEX_SIZE * 0.08;
  const ry = HEX_SIZE * 0.52 + (seededRand(q, r, 11) - 0.5) * HEX_SIZE * 0.08;
  const ox = (seededRand(q, r, 12) - 0.5) * HEX_SIZE * 0.12;
  const oy = (seededRand(q, r, 13) - 0.5) * HEX_SIZE * 0.12;

  // Detail blobs
  const blobs = Array.from({ length: 3 }, (_, i) => ({
    bx: cx + ox + (seededRand(q, r, 20 + i) - 0.5) * rx * 0.9,
    by: cy + oy + (seededRand(q, r, 30 + i) - 0.5) * ry * 0.9,
    br: HEX_SIZE * (0.1 + seededRand(q, r, 40 + i) * 0.14),
  }));

  const borderColor = isMe
    ? "#22d3ee"
    : isOwned
    ? (tile.owner_color || "#888")
    : isSelected
    ? "#fbbf24"
    : "rgba(255,255,255,0.15)";
  const borderWidth = isMe || isSelected ? 2.5 : isOwned ? 2 : 1;

  const hexPts = hexCornerPoints(cx, cy);
  const clipId = `iclip_${q}_${r}`;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Hex base — shallow water */}
      <polygon points={hexPts} fill="#1a5a8a" opacity="0.7" />
      {/* Beach ring */}
      <ellipse cx={cx + ox} cy={cy + oy} rx={rx + HEX_SIZE * 0.1} ry={ry + HEX_SIZE * 0.08}
        fill={cfg.shore} opacity="0.85" />
      {/* Land mass */}
      <ellipse cx={cx + ox} cy={cy + oy} rx={rx} ry={ry} fill={cfg.land} />
      {/* Terrain blobs */}
      {blobs.map((b, i) => (
        <circle key={i} cx={b.bx} cy={b.by} r={b.br} fill={cfg.deep} opacity="0.55" />
      ))}
      {/* City marker */}
      {tile.has_city && (
        <circle cx={cx + ox} cy={cy + oy - ry * 0.1}
          r={HEX_SIZE * 0.18} fill="#1e293b" opacity="0.85" />
      )}
      {/* Hex border */}
      <polygon points={hexPts} fill="none"
        stroke={borderColor} strokeWidth={borderWidth} opacity="0.9" />
      {/* Selection glow */}
      {isSelected && (
        <polygon points={hexPts} fill="rgba(251,191,36,0.15)"
          stroke="#fbbf24" strokeWidth="2.5" />
      )}
      {/* Owner flag */}
      {isOwned && zoom > 0.45 && (
        <text x={cx} y={cy + oy + ry * 0.15 + (tile.has_city ? 0 : 0)}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={HEX_SIZE * (zoom > 1.5 ? 0.36 : 0.32)}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          {tile.owner_flag || "🏴"}
        </text>
      )}
      {/* City emoji */}
      {tile.has_city && zoom > 0.8 && (
        <text x={cx + ox} y={cy + oy - ry * 0.1}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={HEX_SIZE * 0.28}
          style={{ pointerEvents: "none", userSelect: "none" }}>
          🏙️
        </text>
      )}
    </g>
  );
}

// ── Main map ─────────────────────────────────────────────────────────────────
export default function HexOceanMap({ myNation, onSelectNation, onOpenAdvisor }) {
  const containerRef = useRef(null);
  const { zoom, pan, setZoom, setPan, smoothPanTo, handlers } = useMapEngine(containerRef);

  const [tiles, setTiles] = useState([]);
  const [nations, setNations] = useState([]);
  const [selectedHex, setSelectedHex] = useState(null);
  const [hoveredHex, setHoveredHex] = useState(null);
  const [mode, setMode] = useState("global");
  const [containerSize, setContainerSize] = useState({ w: 900, h: 600 });
  const [mapUnlocked, setMapUnlocked] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(e => {
      const r = e[0].contentRect;
      setContainerSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    setContainerSize({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  // Center map on first load
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width: W, height: H } = el.getBoundingClientRect();
    const initZoom = 0.7;
    setPan({
      x: W / 2 - HEX_ORIGIN_X * initZoom,
      y: H / 2 - HEX_ORIGIN_Y * initZoom,
    });
  }, []);

  useEffect(() => {
    loadData();
    const u1 = base44.entities.HexTile.subscribe(() => loadData());
    return () => u1();
  }, []);

  async function loadData() {
    const [ts, ns] = await Promise.all([
      base44.entities.HexTile.list("-created_date", 800),
      base44.entities.Nation.list("-gdp", 80),
    ]);
    setTiles(ts.filter(t => t.terrain_type && t.terrain_type !== "ocean"));
    setNations(ns);
  }

  const tileMap = useMemo(() => {
    const m = {};
    for (const t of tiles) m[`${t.q}_${t.r}`] = t;
    return m;
  }, [tiles]);

  const nationMap = useMemo(() => {
    const m = {};
    for (const n of nations) m[n.id] = n;
    return m;
  }, [nations]);

  // Visible hex range based on viewport + pan/zoom
  const visibleHexes = useMemo(() => {
    const { w: W, h: H } = containerSize;
    const buf = HEX_SIZE * 2;
    const wxMin = (-pan.x - buf) / zoom;
    const wxMax = (W - pan.x + buf) / zoom;
    const wyMin = (-pan.y - buf) / zoom;
    const wyMax = (H - pan.y + buf) / zoom;

    const qMin = Math.floor((wxMin - HEX_ORIGIN_X) / (HEX_SIZE * 1.5)) - 1;
    const qMax = Math.ceil((wxMax - HEX_ORIGIN_X) / (HEX_SIZE * 1.5)) + 1;
    const hexes = [];

    for (let q = Math.max(-60, qMin); q <= Math.min(60, qMax); q++) {
      const baseR = -q / 2;
      const rSpan = (wyMax - wyMin) / (HEX_SIZE * SQRT3);
      const rMin = Math.floor(baseR + (wyMin - HEX_ORIGIN_Y) / (HEX_SIZE * SQRT3)) - 1;
      const rMax = Math.ceil(baseR + (wyMax - HEX_ORIGIN_Y) / (HEX_SIZE * SQRT3)) + 1;
      for (let r = Math.max(-50, rMin); r <= Math.min(50, rMax); r++) {
        hexes.push({ q, r });
      }
    }
    return hexes;
  }, [pan, zoom, containerSize]);

  // Click handler — compute hex from SVG click
  const svgRef = useRef(null);
  const handleSvgClick = useCallback((e) => {
    if (!mapUnlocked) { setMapUnlocked(true); return; }
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const world = pt.matrixTransform(svg.getScreenCTM().inverse());
      const { q, r } = worldToHex(world.x, world.y);
      const key = `${q}_${r}`;
      const tile = tileMap[key];
      setSelectedHex({ q, r, tile: tile || null });
      if (tile?.owner_nation_id) {
        onSelectNation?.(nationMap[tile.owner_nation_id] || null);
      }
    } catch (_) {}
  }, [mapUnlocked, tileMap, nationMap, onSelectNation]);

  const handleSvgMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    try {
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const world = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
      const { q, r } = worldToHex(world.x, world.y);
      setHoveredHex({ q, r });
    } catch (_) {}
  }, []);

  const handlePurchase = useCallback(async (q, r) => {
    if (!myNation) return;
    const terrain = generateTerrain(q, r);
    const nearby = tiles.filter(t => {
      const dq = t.q - q, dr = t.r - r;
      return Math.sqrt(dq * dq + dr * dr) <= 4;
    }).length;
    const price = islandPrice(q, r, nearby);
    if ((myNation.currency || 0) < price) return;

    const cfg = TERRAIN_CONFIG[terrain];
    const resBonus = {};
    if (["forest", "tropical"].includes(terrain)) resBonus.res_wood = (myNation.res_wood || 0) + 80;
    if (["rocky", "mountains", "volcanic"].includes(terrain)) resBonus.res_stone = (myNation.res_stone || 0) + 60;
    if (terrain === "desert") resBonus.res_gold = (myNation.res_gold || 0) + 40;
    if (["tropical", "plains", "coastal"].includes(terrain)) resBonus.res_food = (myNation.res_food || 0) + 100;
    if (terrain === "tundra") resBonus.res_oil = (myNation.res_oil || 0) + 50;
    if (["rocky", "mountains", "volcanic"].includes(terrain)) resBonus.res_iron = (myNation.res_iron || 0) + 50;

    await base44.entities.HexTile.create({
      hex_id: `${q}_${r}`, q, r,
      terrain_type: terrain,
      owner_nation_id: myNation.id,
      owner_nation_name: myNation.name,
      owner_color: myNation.flag_color || "#3b82f6",
      owner_flag: myNation.flag_emoji || "🏴",
      resource_type: "none", resource_amount: 0,
      has_city: false, buildings: [], is_capital: false,
      infrastructure_level: 0, population_capacity: 100,
    });

    await base44.entities.Nation.update(myNation.id, {
      currency: (myNation.currency || 0) - price,
      ...resBonus,
    });

    await base44.entities.ChatMessage.create({
      channel: "global", sender_nation_name: "REAL ESTATE BUREAU",
      sender_flag: "🏝️", sender_color: "#22d3ee", sender_role: "system",
      content: `🏝️ ISLAND ACQUIRED — ${myNation.flag_emoji} ${myNation.name} purchased a ${cfg.emoji} ${cfg.label} island at (${q}, ${r}) for ${price.toLocaleString()} credits!`,
    }).catch(() => {});

    setSelectedHex(prev => ({ ...prev, tile: null }));
    loadData();
  }, [myNation, tiles]);

  // Focus on my nation's home island
  useEffect(() => {
    if (mode === "national" && myNation) {
      const myTile = tiles.find(t => t.owner_nation_id === myNation.id && t.is_capital) || tiles.find(t => t.owner_nation_id === myNation.id);
      if (myTile) {
        const { x, y } = hexToWorld(myTile.q, myTile.r);
        setZoom(2.5);
        smoothPanTo(x, y, 2.5);
      }
    } else if (mode === "global") {
      setZoom(0.7);
      setPan({ x: containerSize.w / 2 - HEX_ORIGIN_X * 0.7, y: containerSize.h / 2 - HEX_ORIGIN_Y * 0.7 });
    }
  }, [mode]);

  // Count tiles per nation for display
  const myTileCount = useMemo(() => tiles.filter(t => t.owner_nation_id === myNation?.id).length, [tiles, myNation]);

  const hovered = hoveredHex ? tileMap[`${hoveredHex.q}_${hoveredHex.r}`] : null;

  return (
    <div ref={containerRef}
      className="relative w-full h-full rounded-2xl select-none"
      style={{ background: "#071428", cursor: mapUnlocked ? "crosshair" : "pointer", overflow: "hidden" }}
      {...(mapUnlocked ? { ...handlers, onMouseMove: handleSvgMouseMove } : {})}
      onClick={!mapUnlocked ? () => setMapUnlocked(true) : undefined}
    >
      {/* ── Top bar ── */}
      <div className="absolute z-30 left-0 right-0 top-0 flex items-center gap-2 px-3 py-2"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {onOpenAdvisor && (
          <button onClick={onOpenAdvisor}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:scale-105"
            style={{ color: "#a78bfa", background: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.25)" }}>
            <Brain size={10} /> Advisor
          </button>
        )}
        <span className="text-[10px] font-bold text-cyan-400 whitespace-nowrap">🌊 Ocean World</span>
        <span className="text-[10px] text-slate-500 ep-mono hidden sm:block">
          {tiles.length} islands · {nations.length} nations
        </span>
        {myNation && (
          <span className="text-[10px] text-amber-400 ep-mono">
            {myNation.flag_emoji} {myTileCount} islands
          </span>
        )}
        <div className="flex-1" />

        {/* Grid toggle */}
        <button onClick={() => setShowGrid(g => !g)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${showGrid ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" : "text-slate-500 border-white/10"}`}>
          <Layers size={10} /> Grid
        </button>

        {/* Mode toggle */}
        <div className="flex bg-black/70 border border-white/20 rounded-xl overflow-hidden shrink-0">
          <button onClick={() => setMode("global")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold transition-colors ${mode === "global" ? "bg-cyan-500/30 text-cyan-300" : "text-slate-400"}`}>
            <Globe size={10} /> World
          </button>
          <button onClick={() => setMode("national")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold transition-colors ${mode === "national" ? "bg-violet-500/30 text-violet-300" : "text-slate-400"}`}>
            <Map size={10} /> Mine
          </button>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-green-400 bg-green-400/10">
          <Wifi size={9} /> LIVE
        </div>
      </div>

      {/* ── SVG World ── */}
      <div className="absolute inset-0 pt-9" style={{ overflow: "hidden" }}>
        <svg
          ref={svgRef}
          width={WORLD_W} height={WORLD_H}
          viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0", willChange: "transform",
          }}
          onClick={mapUnlocked ? handleSvgClick : undefined}
          overflow="visible"
        >
          <HexOceanDefs />

          {/* ── Deep ocean background ── */}
          <rect x="-5000" y="-5000" width={WORLD_W + 10000} height={WORLD_H + 10000}
            fill="url(#deepOcean)" />

          {/* ── Animated wave overlay ── */}
          <rect x="-5000" y="-5000" width={WORLD_W + 10000} height={WORLD_H + 10000}
            fill="url(#wavePattern)" opacity="0.25">
            <animate attributeName="x" from="-100" to="0" dur="4s" repeatCount="indefinite" />
          </rect>

          {/* ── Hex grid lines (only when zoomed in) ── */}
          {showGrid && zoom > 0.4 && visibleHexes.map(({ q, r }) => {
            const { x: cx, y: cy } = hexToWorld(q, r);
            const key = `${q}_${r}`;
            if (tileMap[key]) return null; // islands rendered separately
            return (
              <polygon key={`g_${key}`}
                points={hexCornerPoints(cx, cy)}
                fill="transparent"
                stroke="rgba(34,211,238,0.07)"
                strokeWidth="0.8"
              />
            );
          })}

          {/* ── Ocean hex hover ── */}
          {hoveredHex && !tileMap[`${hoveredHex.q}_${hoveredHex.r}`] && mapUnlocked && zoom > 0.3 && (() => {
            const { x: cx, y: cy } = hexToWorld(hoveredHex.q, hoveredHex.r);
            return (
              <polygon points={hexCornerPoints(cx, cy)}
                fill="rgba(34,211,238,0.08)"
                stroke="rgba(34,211,238,0.3)"
                strokeWidth="1.2" />
            );
          })()}

          {/* ── Island tiles ── */}
          {tiles.map(tile => (
            <IslandHex
              key={tile.id}
              q={tile.q} r={tile.r}
              tile={tile}
              myNation={myNation}
              isSelected={selectedHex?.q === tile.q && selectedHex?.r === tile.r}
              zoom={zoom}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedHex({ q: tile.q, r: tile.r, tile });
                if (tile.owner_nation_id) onSelectNation?.(nationMap[tile.owner_nation_id] || null);
              }}
            />
          ))}

          {/* ── Trade route lines ── */}
          {zoom > 0.5 && (() => {
            const myTiles = tiles.filter(t => t.owner_nation_id === myNation?.id);
            if (myTiles.length < 2) return null;
            return myTiles.slice(0, -1).map((t, i) => {
              const a = hexToWorld(t.q, t.r);
              const b = hexToWorld(myTiles[i + 1].q, myTiles[i + 1].r);
              return (
                <line key={`tr_${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="6,5" opacity="0.35" />
              );
            });
          })()}

          {/* ── Coord label (debug, only at high zoom) ── */}
          {zoom > 2.5 && hoveredHex && (
            <text x={hexToWorld(hoveredHex.q, hoveredHex.r).x}
              y={hexToWorld(hoveredHex.q, hoveredHex.r).y + HEX_SIZE * 0.7}
              textAnchor="middle" fontSize={HEX_SIZE * 0.2} fill="rgba(255,255,255,0.4)"
              style={{ pointerEvents: "none" }}>
              {hoveredHex.q},{hoveredHex.r}
            </text>
          )}
        </svg>
      </div>

      {/* ── Map lock overlay ── */}
      {!mapUnlocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.2)" }}>
          <div className="text-center text-slate-400 text-xs font-bold opacity-70">
            🌊 Click to explore the ocean world
          </div>
        </div>
      )}

      {/* ── Zoom controls ── */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
        {[
          { label: "+", fn: () => setZoom(z => Math.min(5, z + 0.3)) },
          { label: "⊙", fn: () => { setZoom(0.7); setPan({ x: containerSize.w / 2 - HEX_ORIGIN_X * 0.7, y: containerSize.h / 2 - HEX_ORIGIN_Y * 0.7 }); } },
          { label: "−", fn: () => setZoom(z => Math.max(0.12, z - 0.3)) },
        ].map(btn => (
          <button key={btn.label} onClick={btn.fn}
            className="w-7 h-7 rounded-lg text-xs font-bold text-white flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-1.5 max-w-[220px]">
        {[
          { color: "#22d3ee", label: "My Territory" },
          { color: "#4ade80", label: "Ally" },
          { color: "#f87171", label: "Enemy" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1 rounded-lg px-2 py-1 backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${color}30` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[9px] text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Hover tooltip ── */}
      {hovered && !selectedHex && mapUnlocked && (
        <div className="absolute bottom-14 left-4 z-40 min-w-[160px] pointer-events-none"
          style={{ background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 12px", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span>{hovered.owner_flag || "🏝️"}</span>
            <div>
              <div className="text-xs font-bold text-white">{hovered.owner_nation_name || "Unclaimed"}</div>
              <div className="text-[10px] text-slate-500">
                {TERRAIN_CONFIG[hovered.terrain_type]?.emoji} {TERRAIN_CONFIG[hovered.terrain_type]?.label}
              </div>
            </div>
          </div>
          {hovered.has_city && <div className="text-[10px] text-cyan-400">🏙️ City established</div>}
        </div>
      )}

      {/* ── Island panel ── */}
      {selectedHex && (
        <IslandPanel
          hex={selectedHex}
          myNation={myNation}
          tiles={tiles}
          onClose={() => setSelectedHex(null)}
          onPurchase={handlePurchase}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}