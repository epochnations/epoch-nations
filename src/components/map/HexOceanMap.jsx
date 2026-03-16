/**
 * HexOceanMap — Hex-island ocean world map with fixed navigation.
 * Drag = pan map. Click (no drag) = open island panel.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Globe, Map, Wifi, Brain, Layers } from "lucide-react";
import IslandPanel from "./hex/IslandPanel";
import HexOceanDefs from "./hex/HexOceanDefs";
import IslandHex from "./hex/IslandHex";

// ── World constants ──────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  return Math.round((base + nearbyCount * 600) * (seededRand(q, r, 5) * 0.3 + 0.85) / 100) * 100;
}

const MIN_ZOOM = 0.12;
const MAX_ZOOM = 6;
const DRAG_THRESHOLD = 5;

export default function HexOceanMap({ myNation, onSelectNation, onOpenAdvisor }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(0.7);

  // Drag tracking — use manual delta instead of movementX/Y
  const dragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const dragDist = useRef(0);
  const lastTouch = useRef(null);
  const lastTouchDist = useRef(null);

  // Inertia
  const velocity = useRef({ x: 0, y: 0 });
  const inertiaRef = useRef(null);

  // Smooth zoom animation
  const targetZoom = useRef(0.7);
  const zoomAnimRef = useRef(null);
  const zoomCenter = useRef({ x: 0, y: 0 });

  const [showMyIslands, setShowMyIslands] = useState(false);

  const [tiles, setTiles] = useState([]);
  const [nations, setNations] = useState([]);
  const [selectedHex, setSelectedHex] = useState(null);
  const [hoveredHex, setHoveredHex] = useState(null);
  const [mode, setMode] = useState("global");
  const [showGrid, setShowGrid] = useState(true);
  const [containerSize, setContainerSize] = useState({ w: 900, h: 600 });

  // Center on load
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width: W, height: H } = el.getBoundingClientRect();
    const z = 0.7;
    const p = { x: W / 2 - HEX_ORIGIN_X * z, y: H / 2 - HEX_ORIGIN_Y * z };
    setPan(p); panRef.current = p;
    setContainerSize({ w: W, h: H });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(e => {
      const r = e[0].contentRect;
      setContainerSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    loadData();
    const u = base44.entities.HexTile.subscribe(() => loadData());
    return () => u();
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

  // ── Smooth zoom animation ──
  const startZoomAnim = useCallback(() => {
    cancelAnimationFrame(zoomAnimRef.current);
    const animate = () => {
      const diff = targetZoom.current - zoomRef.current;
      if (Math.abs(diff) < 0.001) {
        zoomRef.current = targetZoom.current;
        setZoom(targetZoom.current);
        return;
      }
      const next = zoomRef.current + diff * 0.15;
      const ratio = next / zoomRef.current;
      const cx = zoomCenter.current.x;
      const cy = zoomCenter.current.y;
      zoomRef.current = next;
      setZoom(next);
      setPan(p => {
        const np = { x: cx - ratio * (cx - p.x), y: cy - ratio * (cy - p.y) };
        panRef.current = np;
        return np;
      });
      zoomAnimRef.current = requestAnimationFrame(animate);
    };
    zoomAnimRef.current = requestAnimationFrame(animate);
  }, []);

  const applyZoom = useCallback((newZ, cx, cy) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZ));
    zoomCenter.current = { x: cx, y: cy };
    targetZoom.current = clamped;
    startZoomAnim();
  }, [startZoomAnim]);

  // Track if panel is open so we can block map events
  const panelOpen = !!selectedHex || showMyIslands;

  // ── Inertia glide ──
  const stopInertia = useCallback(() => {
    cancelAnimationFrame(inertiaRef.current);
    velocity.current = { x: 0, y: 0 };
  }, []);

  const startInertia = useCallback(() => {
    cancelAnimationFrame(inertiaRef.current);
    const tick = () => {
      const vx = velocity.current.x, vy = velocity.current.y;
      if (Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) return;
      velocity.current = { x: vx * 0.92, y: vy * 0.92 };
      setPan(p => {
        const np = { x: p.x + velocity.current.x, y: p.y + velocity.current.y };
        panRef.current = np;
        return np;
      });
      inertiaRef.current = requestAnimationFrame(tick);
    };
    inertiaRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Pointer handlers — manual delta tracking ──
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (selectedHex) return; // panel open — don't pan
    stopInertia();
    dragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragDist.current = 0;
  }, [stopInertia]);

  const handleMouseMove = useCallback((e) => {
    if (selectedHex) return; // panel open — ignore
    // Hover detection
    if (svgRef.current && !dragging.current) {
      try {
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const w = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        const { q, r } = worldToHex(w.x, w.y);
        setHoveredHex(h => (h?.q === q && h?.r === r) ? h : { q, r });
      } catch (_) {}
    }
    if (!dragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: dx, y: dy };
    const dd = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
    dragDist.current = dd;
    setPan(p => {
      const np = { x: p.x + dx, y: p.y + dy };
      panRef.current = np;
      return np;
    });
  }, []);

  const handleMouseUp = useCallback((e) => {
    if (selectedHex) return; // panel open — ignore
    const wasDrag = dragDist.current > DRAG_THRESHOLD;
    dragging.current = false;
    if (wasDrag) {
      startInertia();
    } else {
      // Click — open panel
      if (svgRef.current) {
        try {
          const pt = svgRef.current.createSVGPoint();
          pt.x = e.clientX; pt.y = e.clientY;
          const w = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
          const { q, r } = worldToHex(w.x, w.y);
          const tile = tileMap[`${q}_${r}`];
          setSelectedHex({ q, r, tile: tile || null });
          if (tile?.owner_nation_id) onSelectNation?.(nationMap[tile.owner_nation_id] || null);
        } catch (_) {}
      }
    }
    dragDist.current = 0;
  }, [tileMap, nationMap, onSelectNation, startInertia]);

  const handleMouseLeave = useCallback(() => {
    if (dragging.current) startInertia();
    dragging.current = false;
  }, [startInertia]);

  // Double-click to zoom to island
  const handleDblClick = useCallback((e) => {
    if (svgRef.current) {
      try {
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const w = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        const { w: W, h: H } = containerSize;
        applyZoom(Math.min(MAX_ZOOM, zoomRef.current * 2), e.clientX - containerRef.current.getBoundingClientRect().left, e.clientY - containerRef.current.getBoundingClientRect().top);
      } catch (_) {}
    }
  }, [containerSize]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    applyZoom(targetZoom.current + delta, cx, cy);
  }, [applyZoom]);

  // Attach wheel as non-passive
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleTouchStart = useCallback((e) => {
    if (selectedHex) return; // panel open — ignore touch on map
    stopInertia();
    if (e.touches.length === 1) {
      dragging.current = true;
      const t = e.touches[0];
      lastTouch.current = { x: t.clientX, y: t.clientY };
      dragStart.current = { x: t.clientX, y: t.clientY };
      dragDist.current = 0;
    } else if (e.touches.length === 2) {
      dragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }, [stopInertia]);

  const handleTouchMove = useCallback((e) => {
    if (selectedHex) return;
    e.preventDefault();
    if (e.touches.length === 1 && dragging.current) {
      const t = e.touches[0];
      const dx = t.clientX - lastTouch.current.x;
      const dy = t.clientY - lastTouch.current.y;
      velocity.current = { x: dx, y: dy };
      lastTouch.current = { x: t.clientX, y: t.clientY };
      const dd = Math.hypot(t.clientX - dragStart.current.x, t.clientY - dragStart.current.y);
      dragDist.current = dd;
      setPan(p => {
        const np = { x: p.x + dx, y: p.y + dy };
        panRef.current = np;
        return np;
      });
    } else if (e.touches.length === 2 && lastTouchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / lastTouchDist.current;
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        applyZoom(targetZoom.current * ratio, midX, midY);
      }
      lastTouchDist.current = dist;
    }
  }, [applyZoom]);

  const handleTouchEnd = useCallback((e) => {
    if (dragDist.current < DRAG_THRESHOLD && e.changedTouches.length === 1 && lastTouch.current) {
      const t = e.changedTouches[0];
      if (svgRef.current) {
        try {
          const pt = svgRef.current.createSVGPoint();
          pt.x = t.clientX; pt.y = t.clientY;
          const w = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
          const { q, r } = worldToHex(w.x, w.y);
          const tile = tileMap[`${q}_${r}`];
          setSelectedHex({ q, r, tile: tile || null });
          if (tile?.owner_nation_id) onSelectNation?.(nationMap[tile.owner_nation_id] || null);
        } catch (_) {}
      }
    }
    if (dragDist.current > DRAG_THRESHOLD) startInertia();
    dragging.current = false;
    lastTouchDist.current = null;
    dragDist.current = 0;
  }, [tileMap, nationMap, onSelectNation, startInertia]);

  // ── Mode focus ──
  useEffect(() => {
    if (mode === "national" && myNation) {
      const myTile = tiles.find(t => t.owner_nation_id === myNation.id && t.is_capital) || tiles.find(t => t.owner_nation_id === myNation.id);
      if (myTile) {
        const { x, y } = hexToWorld(myTile.q, myTile.r);
        const z = 2.2;
        const { w: W, h: H } = containerSize;
        applyZoom(z, W / 2, H / 2);
        setPan({ x: W / 2 - x * z, y: H / 2 - y * z });
      }
    } else if (mode === "global") {
      const z = 0.7;
      applyZoom(z, containerSize.w / 2, containerSize.h / 2);
      setPan({ x: containerSize.w / 2 - HEX_ORIGIN_X * z, y: containerSize.h / 2 - HEX_ORIGIN_Y * z });
    }
  }, [mode]);

  // ── Purchase handler ──
  const handlePurchase = useCallback(async (q, r) => {
    if (!myNation) return;
    const terrain = generateTerrain(q, r);
    const nearby = tiles.filter(t => Math.hypot(t.q - q, t.r - r) <= 4).length;
    const price = islandPrice(q, r, nearby);
    if ((myNation.currency || 0) < price) return;

    const cfg = TERRAIN_CONFIG[terrain];
    const resBonus = {};
    if (["forest","tropical"].includes(terrain)) resBonus.res_wood = (myNation.res_wood||0) + 80;
    if (["rocky","mountains","volcanic"].includes(terrain)) resBonus.res_stone = (myNation.res_stone||0) + 60;
    if (terrain === "desert") resBonus.res_gold = (myNation.res_gold||0) + 40;
    if (["tropical","plains","coastal"].includes(terrain)) resBonus.res_food = (myNation.res_food||0) + 100;
    if (terrain === "tundra") resBonus.res_oil = (myNation.res_oil||0) + 50;
    if (["rocky","mountains","volcanic"].includes(terrain)) resBonus.res_iron = (myNation.res_iron||0) + 50;

    await base44.entities.HexTile.create({
      hex_id: `${q}_${r}`, q, r, terrain_type: terrain,
      owner_nation_id: myNation.id, owner_nation_name: myNation.name,
      owner_color: myNation.flag_color||"#3b82f6", owner_flag: myNation.flag_emoji||"🏴",
      resource_type: "none", resource_amount: 0,
      has_city: false, buildings: [], is_capital: false,
      infrastructure_level: 0, population_capacity: 100,
    });
    await base44.entities.Nation.update(myNation.id, { currency: (myNation.currency||0) - price, ...resBonus });
    await base44.entities.ChatMessage.create({
      channel:"global", sender_nation_name:"REAL ESTATE BUREAU",
      sender_flag:"🏝️", sender_color:"#22d3ee", sender_role:"system",
      content:`🏝️ ISLAND ACQUIRED — ${myNation.flag_emoji} ${myNation.name} purchased a ${cfg.emoji} ${cfg.label} island at (${q},${r}) for ${price.toLocaleString()} credits!`,
    }).catch(()=>{});
    setSelectedHex(null);
    loadData();
  }, [myNation, tiles]);

  // ── Claim/attack handler ──
  const handleClaim = useCallback(async (tile) => {
    if (!myNation || !tile) return;
    const defPower = (tile.buildings||[]).filter(b => ["fort","barracks","naval_base","radar"].includes(b)).length * 10;
    const myPower = (myNation.unit_power||10) + (myNation.defense_level||10);
    const success = myPower > defPower + 10 + Math.random() * 20;

    if (success) {
      await base44.entities.HexTile.update(tile.id, {
        owner_nation_id: myNation.id,
        owner_nation_name: myNation.name,
        owner_color: myNation.flag_color||"#3b82f6",
        owner_flag: myNation.flag_emoji||"🏴",
        is_capital: false,
      });
      await base44.entities.Nation.update(myNation.id, {
        at_war_with: [...new Set([...(myNation.at_war_with||[]), tile.owner_nation_id])],
        currency: Math.max(0, (myNation.currency||0) - 200),
      });
      await base44.entities.ChatMessage.create({
        channel:"global", sender_nation_name:"WAR BUREAU",
        sender_flag:"⚔️", sender_color:"#ef4444", sender_role:"system",
        content:`⚔️ ISLAND CAPTURED — ${myNation.flag_emoji} ${myNation.name} has seized the ${TERRAIN_CONFIG[tile.terrain_type]?.emoji} island at (${tile.q},${tile.r}) from ${tile.owner_nation_name}!`,
      }).catch(()=>{});
    } else {
      await base44.entities.ChatMessage.create({
        channel:"global", sender_nation_name:"WAR BUREAU",
        sender_flag:"⚔️", sender_color:"#f97316", sender_role:"system",
        content:`🛡️ ASSAULT REPELLED — ${myNation.name}'s attack on ${tile.owner_nation_name}'s island at (${tile.q},${tile.r}) was repelled by coastal defenses!`,
      }).catch(()=>{});
    }
    setSelectedHex(null);
    loadData();
    return success;
  }, [myNation]);

  // ── Visible hexes (only grid lines, not islands — those are all rendered) ──
  const visibleGridHexes = useMemo(() => {
    const { w: W, h: H } = containerSize;
    const buf = HEX_SIZE * 2;
    const wxMin = (-pan.x - buf) / zoom;
    const wxMax = (W - pan.x + buf) / zoom;
    const wyMin = (-pan.y - buf) / zoom;
    const wyMax = (H - pan.y + buf) / zoom;
    const qMin = Math.floor((wxMin - HEX_ORIGIN_X) / (HEX_SIZE * 1.5)) - 1;
    const qMax = Math.ceil((wxMax - HEX_ORIGIN_X) / (HEX_SIZE * 1.5)) + 1;
    const hexes = [];
    for (let q = Math.max(-50, qMin); q <= Math.min(50, qMax); q++) {
      const rMin = Math.floor(-q / 2 + (wyMin - HEX_ORIGIN_Y) / (HEX_SIZE * SQRT3)) - 1;
      const rMax = Math.ceil(-q / 2 + (wyMax - HEX_ORIGIN_Y) / (HEX_SIZE * SQRT3)) + 1;
      for (let r = Math.max(-40, rMin); r <= Math.min(40, rMax); r++) {
        hexes.push({ q, r });
      }
    }
    return hexes;
  }, [pan, zoom, containerSize]);

  const myTileCount = useMemo(() => tiles.filter(t => t.owner_nation_id === myNation?.id).length, [tiles, myNation]);
  const hovered = hoveredHex ? tileMap[`${hoveredHex.q}_${hoveredHex.r}`] : null;

  const zoomLevel = zoom < 0.5 ? 1 : zoom < 1.5 ? 2 : 3;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl select-none"
      style={{ background: "#071428", cursor: selectedHex ? "default" : dragging.current ? "grabbing" : "grab", overflow: "hidden" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDblClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top bar ── */}
      <div className="absolute z-30 left-0 right-0 top-0 flex items-center gap-2 px-3 py-2"
        style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}
        onMouseDown={e => e.stopPropagation()}>
        {onOpenAdvisor && (
          <button onClick={onOpenAdvisor}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:scale-105"
            style={{ color:"#a78bfa", background:"rgba(139,92,246,0.1)", borderColor:"rgba(139,92,246,0.25)" }}>
            <Brain size={10}/> Advisor
          </button>
        )}
        <span className="text-[10px] font-bold text-cyan-400">🌊 Ocean World</span>
        <span className="text-[10px] text-slate-500 ep-mono hidden sm:block">
          {tiles.length} islands · {nations.length} nations
        </span>
        {myNation && (
          <button
            onClick={() => setShowMyIslands(s => !s)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${showMyIslands ? "text-amber-400 bg-amber-500/15 border-amber-500/30" : "text-amber-400/70 border-amber-500/20"}`}
            onMouseDown={e => e.stopPropagation()}>
            {myNation.flag_emoji} {myTileCount} islands
          </button>
        )}
        <div className="flex-1"/>
        <span className="text-[9px] text-slate-600 ep-mono">
          {zoomLevel === 1 ? "🌍 Global" : zoomLevel === 2 ? "🗺 Regional" : "🏝 Island Detail"}
        </span>
        <button onClick={() => setShowGrid(g => !g)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${showGrid ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" : "text-slate-500 border-white/10"}`}
          onMouseDown={e => e.stopPropagation()}>
          <Layers size={10}/> Grid
        </button>
        <div className="flex bg-black/70 border border-white/20 rounded-xl overflow-hidden shrink-0" onMouseDown={e => e.stopPropagation()}>
          {[["global","🌍 World"],["national","🗺 Mine"]].map(([m,l]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-[10px] font-bold transition-colors ${mode===m ? m==="global"?"bg-cyan-500/30 text-cyan-300":"bg-violet-500/30 text-violet-300" : "text-slate-400"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-green-400 bg-green-400/10">
          <Wifi size={9}/> LIVE
        </div>
      </div>

      {/* ── SVG World ── */}
      <div className="absolute inset-0 pt-9" style={{ overflow:"hidden" }}>
        <svg
          ref={svgRef}
          width={WORLD_W} height={WORLD_H}
          viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
          style={{ transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin:"0 0", willChange:"transform" }}
          overflow="visible"
        >
          <HexOceanDefs/>

          {/* Deep ocean */}
          <rect x="-8000" y="-8000" width={WORLD_W+16000} height={WORLD_H+16000} fill="url(#deepOcean)"/>

          {/* Animated waves */}
          <rect x="-8000" y="-8000" width={WORLD_W+16000} height={WORLD_H+16000} fill="url(#wavePattern)" opacity="0.22">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="200 0" dur="5s" repeatCount="indefinite"/>
          </rect>

          {/* Hex grid lines */}
          {showGrid && zoom > 0.35 && visibleGridHexes.map(({ q, r }) => {
            if (tileMap[`${q}_${r}`]) return null;
            const { x: cx, y: cy } = hexToWorld(q, r);
            return (
              <polygon key={`g_${q}_${r}`}
                points={hexCornerPoints(cx, cy)}
                fill="transparent"
                stroke="rgba(34,211,238,0.06)"
                strokeWidth="0.7"
              />
            );
          })}

          {/* Ocean hover highlight */}
          {hoveredHex && !tileMap[`${hoveredHex.q}_${hoveredHex.r}`] && zoom > 0.3 && (() => {
            const { x: cx, y: cy } = hexToWorld(hoveredHex.q, hoveredHex.r);
            return (
              <polygon points={hexCornerPoints(cx, cy)}
                fill="rgba(34,211,238,0.07)" stroke="rgba(34,211,238,0.28)" strokeWidth="1.2"/>
            );
          })()}

          {/* Territory influence tints (nation color tint on ocean around owned islands) */}
          {zoom > 0.3 && tiles.filter(t => t.owner_nation_id).slice(0, 80).map(tile => {
            const { x: cx, y: cy } = hexToWorld(tile.q, tile.r);
            const color = tile.owner_color || "#3b82f6";
            const isMe = tile.owner_nation_id === myNation?.id;
            return (
              <ellipse key={`inf_${tile.id}`} cx={cx} cy={cy}
                rx={HEX_SIZE * 2.2} ry={HEX_SIZE * 2.0}
                fill={color} opacity={isMe ? 0.06 : 0.035}
                style={{ pointerEvents: "none" }}/>
            );
          })}

          {/* Island tiles */}
          {tiles.map(tile => {
            const isMyTile = tile.owner_nation_id === myNation?.id;
            const dimmed = mode === "national" && !isMyTile;
            return (
              <g key={tile.id} opacity={dimmed ? 0.3 : 1}>
                <IslandHex
                  tile={tile}
                  myNation={myNation}
                  isSelected={selectedHex?.q === tile.q && selectedHex?.r === tile.r}
                  zoom={zoom}
                />
              </g>
            );
          })}

          {/* Trade route lines + animated ships between all nation islands */}
          {zoom > 0.3 && (() => {
            // Build routes for all nations (group tiles by nation)
            const byNation = {};
            for (const t of tiles) {
              if (!t.owner_nation_id) continue;
              if (!byNation[t.owner_nation_id]) byNation[t.owner_nation_id] = { tiles: [], color: t.owner_color || "#22d3ee", isMe: t.owner_nation_id === myNation?.id };
              byNation[t.owner_nation_id].tiles.push(t);
            }
            return Object.values(byNation).flatMap((nd, ni) => {
              if (nd.tiles.length < 2) return [];
              return nd.tiles.slice(0, -1).map((t, i) => {
                const a = hexToWorld(t.q, t.r);
                const b = hexToWorld(nd.tiles[i+1].q, nd.tiles[i+1].r);
                const dist = Math.hypot(b.x - a.x, b.y - a.y);
                if (dist > HEX_SIZE * 25) return null; // skip very long routes
                return (
                  <g key={`tr_${ni}_${i}`}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={nd.color} strokeWidth={nd.isMe ? 1.2 : 0.7}
                      strokeDasharray="5,6" opacity={nd.isMe ? 0.35 : 0.15}/>
                    {zoom > 0.7 && (
                      <text textAnchor="middle" fontSize={nd.isMe ? "16" : "11"} style={{ pointerEvents:"none" }}>
                        <animateMotion dur={`${4+(ni+i)*0.7}s`} repeatCount="indefinite"
                          path={`M${a.x},${a.y} L${b.x},${b.y}`}/>
                        {nd.isMe ? "⛵" : "🚢"}
                      </text>
                    )}
                  </g>
                );
              }).filter(Boolean);
            });
          })()}

          {/* Coord labels at high zoom */}
          {zoom > 2.8 && hoveredHex && (() => {
            const { x, y } = hexToWorld(hoveredHex.q, hoveredHex.r);
            return (
              <text x={x} y={y + HEX_SIZE * 0.7} textAnchor="middle" fontSize={HEX_SIZE * 0.18}
                fill="rgba(255,255,255,0.35)" style={{ pointerEvents:"none" }}>
                {hoveredHex.q},{hoveredHex.r}
              </text>
            );
          })()}
        </svg>
      </div>

      {/* ── Zoom controls ── */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1" onMouseDown={e => e.stopPropagation()}>
        {[
          { label:"+", fn:() => applyZoom(targetZoom.current+0.35, containerSize.w/2, containerSize.h/2) },
          { label:"⊙", fn:() => { const z=0.7; applyZoom(z,containerSize.w/2,containerSize.h/2); setPan({ x:containerSize.w/2-HEX_ORIGIN_X*z, y:containerSize.h/2-HEX_ORIGIN_Y*z }); } },
          { label:"−", fn:() => applyZoom(targetZoom.current-0.35, containerSize.w/2, containerSize.h/2) },
        ].map(btn => (
          <button key={btn.label} onClick={btn.fn}
            className="w-7 h-7 rounded-lg text-xs font-bold text-white flex items-center justify-center hover:scale-110 transition-all"
            style={{ background:"rgba(0,0,0,0.75)", border:"1px solid rgba(255,255,255,0.18)" }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-1.5 max-w-[200px]" onMouseDown={e => e.stopPropagation()}>
        {[{ color:"#22d3ee", label:"Mine" }, { color:"#4ade80", label:"Ally" }, { color:"#f87171", label:"Enemy" }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1 rounded-lg px-2 py-1"
            style={{ background:"rgba(0,0,0,0.65)", border:`1px solid ${color}30` }}>
            <div className="w-2 h-2 rounded-full" style={{ background:color }}/>
            <span className="text-[9px] text-slate-400">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.1)" }}>
          <span className="text-[9px] text-slate-400">Drag=pan · Scroll=zoom · Click=select</span>
        </div>
      </div>

      {/* ── Hover tooltip ── */}
      {hovered && !selectedHex && (
        <div className="absolute bottom-14 left-4 z-40 min-w-[150px] pointer-events-none rounded-xl px-3 py-2.5"
          style={{ background:"rgba(0,0,0,0.88)", border:"1px solid rgba(255,255,255,0.15)", backdropFilter:"blur(12px)" }}>
          <div className="flex items-center gap-2">
            <span>{hovered.owner_flag||"🏝️"}</span>
            <div>
              <div className="text-xs font-bold text-white">{hovered.owner_nation_name||"Unclaimed"}</div>
              <div className="text-[10px] text-slate-500">{TERRAIN_CONFIG[hovered.terrain_type]?.emoji} {TERRAIN_CONFIG[hovered.terrain_type]?.label}</div>
            </div>
          </div>
          {hovered.has_city && <div className="text-[10px] text-cyan-400 mt-1">🏙️ City · Lvl {hovered.infrastructure_level||0}</div>}
          {(hovered.buildings||[]).length > 0 && <div className="text-[9px] text-slate-500 mt-0.5">{hovered.buildings.length} buildings</div>}
        </div>
      )}

      {/* ── My Islands navigation panel ── */}
      {showMyIslands && myNation && (() => {
        const myTiles = tiles.filter(t => t.owner_nation_id === myNation.id);
        const devLabels = ["Outpost","Outpost","Settlement","Town","City","Capital"];
        return (
          <div className="absolute top-10 left-3 z-40 w-52 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background:"rgba(5,14,28,0.97)", border:"1px solid rgba(34,211,238,0.22)", backdropFilter:"blur(16px)", maxHeight:"calc(100% - 56px)", overflowY:"auto" }}
            onMouseDown={e => e.stopPropagation()}>
            <div className="px-3 py-2.5 border-b border-white/10">
              <div className="text-xs font-bold text-cyan-400">🏝️ My Islands ({myTiles.length})</div>
            </div>
            {myTiles.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-500 text-center">No islands yet. Click ocean tiles to purchase.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {myTiles.map((t, i) => {
                  const cfg = TERRAIN_CONFIG[t.terrain_type] || TERRAIN_CONFIG.tropical;
                  const level = Math.min(5, t.infrastructure_level || 0);
                  return (
                    <button key={t.id}
                      onClick={() => {
                        const { x, y } = hexToWorld(t.q, t.r);
                        const { w: W, h: H } = containerSize;
                        const z = 2.5;
                        applyZoom(z, W/2, H/2);
                        setTimeout(() => setPan({ x: W/2 - x*z, y: H/2 - y*z }), 50);
                        setShowMyIslands(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors">
                      <span className="text-base">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {t.is_capital ? "⭐ Capital" : t.city_name || `${cfg.label} Island`}
                        </div>
                        <div className="text-[9px] text-slate-500">{devLabels[level]} · {(t.buildings||[]).length} buildings</div>
                      </div>
                      <div className="text-[9px] text-slate-600 ep-mono">({t.q},{t.r})</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Island panel ── */}
      {selectedHex && (
        <IslandPanel
          hex={selectedHex}
          myNation={myNation}
          tiles={tiles}
          allNations={nations}
          onClose={() => setSelectedHex(null)}
          onPurchase={handlePurchase}
          onClaim={handleClaim}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}