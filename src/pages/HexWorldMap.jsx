/**
 * HexWorldMap — Infinite procedural hex strategy map.
 * Rich SVG visuals, universal icons, territory borders, buy-land system.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  hexToPixel, pixelToHex, hexId, hexNeighbors,
  generateHexTile, generateStartingCluster, findFreeClusterOrigin,
  HEX_SIZE, TERRAIN_CONFIG,
} from "../components/hexmap/HexEngine";
import HexDefs from "../components/hexmap/HexDefs";
import HexTileRenderer from "../components/hexmap/HexTileRenderer";
import HexTerritoryBorders from "../components/hexmap/HexTerritoryBorders";
import HexMapOverlays from "../components/hexmap/HexMapOverlays";
import HexTilePanel from "../components/hexmap/HexTilePanel";
import HexMapControls from "../components/hexmap/HexMapControls";
import { ArrowLeft, Globe, RefreshCw, Crosshair, Layers, ShoppingCart } from "lucide-react";

// ─── Map Engine ──────────────────────────────────────────────────────────────
const MIN_ZOOM = 0.25, MAX_ZOOM = 9;

function useHexMapEngine(containerRef) {
  const [zoom, setZoom] = useState(1.4);
  const [pan, setPan]   = useState({ x: 500, y: 350 });
  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);
  const moved = useRef(false);

  const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

  const onMouseDown = useCallback(e => {
    dragging.current = true;
    moved.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback(e => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, []);
  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  const onWheel = useCallback(e => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.14 : 0.88;
    setZoom(prev => {
      const nz = clamp(prev * factor, MIN_ZOOM, MAX_ZOOM);
      const r  = nz / prev;
      setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) }));
      return nz;
    });
  }, [containerRef]);

  const onTouchStart = useCallback(e => {
    if (e.touches.length === 1) {
      dragging.current = true;
      moved.current = false;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }, []);
  const onTouchMove = useCallback(e => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    } else if (e.touches.length === 2 && lastTouchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = mx - rect.left, cy = my - rect.top;
        setZoom(prev => {
          const nz = clamp(prev * (dist / lastTouchDist.current), MIN_ZOOM, MAX_ZOOM);
          const r  = nz / prev;
          setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) }));
          return nz;
        });
      }
      lastTouchDist.current = dist;
    }
  }, [containerRef]);
  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    lastTouchDist.current = null;
  }, []);

  return {
    zoom, setZoom, pan, setPan, moved,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onWheel, onTouchStart, onTouchMove, onTouchEnd },
  };
}

// ─── Visible tile range ───────────────────────────────────────────────────────
function visibleHexRange(pan, zoom, cW, cH) {
  const margin = HEX_SIZE * 4;
  const minX = (-pan.x - margin) / zoom;
  const minY = (-pan.y - margin) / zoom;
  const maxX = (-pan.x + cW + margin) / zoom;
  const maxY = (-pan.y + cH + margin) / zoom;
  const size = HEX_SIZE;
  return {
    qMin: Math.floor(minX / (size * Math.sqrt(3))) - 2,
    qMax: Math.ceil(maxX  / (size * Math.sqrt(3))) + 2,
    rMin: Math.floor(minY / (size * 1.5)) - 2,
    rMax: Math.ceil(maxY  / (size * 1.5)) + 2,
  };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function HexWorldMap() {
  const containerRef = useRef(null);
  const { zoom, setZoom, pan, setPan, moved, handlers } = useHexMapEngine(containerRef);

  const [myNation, setMyNation]   = useState(null);
  const [nations, setNations]     = useState([]);
  const [tiles, setTiles]         = useState({});
  const [tradeRoutes, setTradeRoutes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [hoveredTile, setHoveredTile]   = useState(null);
  const [viewMode, setViewMode]   = useState("global");
  const [containerSize, setContainerSize] = useState({ w: 900, h: 650 });
  const [layers, setLayers]       = useState({ alliances: true, wars: true, trade: true, resources: true });
  const [buyMode, setBuyMode]     = useState(false);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    const obs = new ResizeObserver(entries => {
      const e = entries[0].contentRect;
      setContainerSize({ w: e.width, h: e.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    init();
    const unsubs = [
      base44.entities.Nation.subscribe(() => loadNations()),
      base44.entities.HexTile.subscribe(() => loadTiles()),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  async function init() {
    const [user, nationsList, tilesList, routes] = await Promise.all([
      base44.auth.me(),
      base44.entities.Nation.list("-gdp", 60),
      base44.entities.HexTile.list("-created_date", 600),
      base44.entities.TradeRoute.filter({ status: "active" }, "-created_date", 50),
    ]);

    setNations(nationsList);
    setTradeRoutes(routes);

    const tileMap = {};
    for (const t of tilesList) tileMap[t.hex_id] = t;
    setTiles(tileMap);

    const myNat = nationsList.find(n => n.owner_email === user.email);
    setMyNation(myNat || null);

    if (myNat) {
      const capital = tilesList.find(t => t.owner_nation_id === myNat.id && t.is_capital);
      if (capital) {
        centerTile(capital.q, capital.r, 1.4, containerRef.current);
      } else {
        await initializeNationTerritory(myNat, tilesList);
      }
    }
    setLoading(false);
  }

  function centerTile(q, r, z, el) {
    const pos = hexToPixel(q, r, HEX_SIZE);
    const rect = el?.getBoundingClientRect() || { width: 900, height: 650 };
    setPan({ x: rect.width / 2 - pos.x * z, y: rect.height / 2 - pos.y * z });
    setZoom(z);
  }

  async function loadNations() {
    const data = await base44.entities.Nation.list("-gdp", 60);
    setNations(data);
  }
  async function loadTiles() {
    const data = await base44.entities.HexTile.list("-created_date", 600);
    const m = {};
    for (const t of data) m[t.hex_id] = t;
    setTiles(m);
  }

  async function initializeNationTerritory(nation, existingTiles) {
    setInitializing(true);
    const existingIds = new Set(existingTiles.map(t => t.hex_id));
    const origin = findFreeClusterOrigin(existingIds);
    const clusterCoords = generateStartingCluster(origin.q, origin.r);
    const protectionUntil = new Date(Date.now() + 48 * 3600000).toISOString();

    const tilesToCreate = clusterCoords.map((coord, i) => {
      const base = generateHexTile(coord.q, coord.r);
      return {
        ...base,
        terrain_type: i === 0 ? "plains"
          : base.terrain_type === "ocean" ? "plains"
          : base.terrain_type,
        owner_nation_id:   nation.id,
        owner_nation_name: nation.name,
        owner_color:       nation.flag_color || "#3b82f6",
        owner_flag:        nation.flag_emoji || "",
        is_capital: i === 0,
        has_city:   i === 0,
        city_name:  `${nation.name} City`,
        cluster_id: `cluster_${nation.id}`,
        protection_until: protectionUntil,
      };
    });

    await base44.entities.HexTile.bulkCreate(tilesToCreate);
    await loadTiles();
    centerTile(origin.q, origin.r, 1.8, containerRef.current);
    setInitializing(false);
  }

  // Lazy terrain generation on pan/zoom
  const genTimer = useRef(null);
  const generateVisibleTerrain = useCallback(async () => {
    const { qMin, qMax, rMin, rMax } = visibleHexRange(pan, zoom, containerSize.w, containerSize.h);
    const toCreate = [];
    for (let r = rMin; r <= rMax; r++) {
      for (let q = qMin; q <= qMax; q++) {
        const id = hexId(q, r);
        if (!tiles[id]) toCreate.push(generateHexTile(q, r));
      }
    }
    if (toCreate.length > 0 && toCreate.length < 300) {
      await base44.entities.HexTile.bulkCreate(toCreate);
    }
  }, [pan, zoom, containerSize, tiles]);

  useEffect(() => {
    clearTimeout(genTimer.current);
    genTimer.current = setTimeout(generateVisibleTerrain, 700);
    return () => clearTimeout(genTimer.current);
  }, [pan, zoom]);

  // Owned hex ids
  const ownedHexIds = useMemo(() => {
    const s = new Set();
    for (const t of Object.values(tiles)) {
      if (t.owner_nation_id === myNation?.id) s.add(t.hex_id);
    }
    return s;
  }, [tiles, myNation]);

  // Adjacent-to-mine hexes (purchasable)
  const adjacentToMine = useMemo(() => {
    const s = new Set();
    for (const id of ownedHexIds) {
      const [q, r] = id.split("_").map(Number);
      for (const n of hexNeighbors(q, r)) {
        const nid = hexId(n.q, n.r);
        if (!ownedHexIds.has(nid)) s.add(nid);
      }
    }
    return s;
  }, [ownedHexIds]);

  // Visible tiles (frustum cull)
  const visibleTiles = useMemo(() => {
    const { qMin, qMax, rMin, rMax } = visibleHexRange(pan, zoom, containerSize.w, containerSize.h);
    return Object.values(tiles).filter(t =>
      t.q >= qMin && t.q <= qMax && t.r >= rMin && t.r <= rMax
    );
  }, [tiles, pan, zoom, containerSize]);

  // Claim a hex
  async function claimHex(tile) {
    if (!myNation) return;
    const cost = 50;
    if ((myNation.currency || 0) < cost) {
      alert(`Not enough gold! Claiming costs ${cost} gold.`);
      return;
    }
    await base44.entities.HexTile.update(tile.id, {
      owner_nation_id:   myNation.id,
      owner_nation_name: myNation.name,
      owner_color:       myNation.flag_color || "#3b82f6",
      owner_flag:        myNation.flag_emoji || "",
    });
    await base44.entities.Nation.update(myNation.id, {
      currency: (myNation.currency || 0) - cost,
    });
    const updated = { ...myNation, currency: (myNation.currency || 0) - cost };
    setMyNation(updated);
    setSelectedTile(null);
    await loadTiles();
  }

  // Build on hex
  async function buildOnHex(tile, building) {
    if (!myNation) return;
    if ((myNation.currency || 0) < building.cost) {
      alert(`Not enough gold! Need ${building.cost} gold.`);
      return;
    }
    const updates = {
      buildings: [...(tile.buildings || []), building.label],
      infrastructure_level: (tile.infrastructure_level || 0) + 1,
    };
    if (building.id === "city")          { updates.has_city = true; updates.city_name = `${myNation.name} City`; }
    if (building.id === "military_base") updates.has_military_base = true;
    if (building.id === "trade_port")    updates.has_trade_port = true;

    await base44.entities.HexTile.update(tile.id, updates);
    await base44.entities.Nation.update(myNation.id, {
      currency: (myNation.currency || 0) - building.cost,
    });
    const updated = { ...myNation, currency: (myNation.currency || 0) - building.cost };
    setMyNation(updated);
    setSelectedTile(null);
    await loadTiles();
  }

  // Protection check
  function isProtected(tile) {
    return tile.protection_until && new Date(tile.protection_until) > new Date();
  }

  // View mode → zoom
  useEffect(() => {
    if (viewMode === "global") setZoom(0.7);
    else if (viewMode === "nation") setZoom(1.6);
    else if (viewMode === "city") setZoom(4.0);
  }, [viewMode]);

  function centerOnMyTerritory() {
    const cap = Object.values(tiles).find(
      t => t.owner_nation_id === myNation?.id && t.is_capital
    );
    if (!cap) return;
    centerTile(cap.q, cap.r, zoom, containerRef.current);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040810] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div className="w-14 h-14 border-2 border-cyan-400/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <Globe size={20} className="text-cyan-400 absolute inset-0 m-auto" />
          </div>
          <div className="text-slate-400 text-xs tracking-widest uppercase" style={{ fontFamily: "monospace" }}>
            Generating World…
          </div>
        </div>
      </div>
    );
  }

  const ownedCount = Object.values(tiles).filter(t => t.owner_nation_id).length;
  const myHexCount = Object.values(tiles).filter(t => t.owner_nation_id === myNation?.id).length;

  return (
    <div className="min-h-screen bg-[#040810] text-white flex flex-col" style={{ height: "100dvh" }}>

      {/* ── Top Bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b z-30"
        style={{
          background: "linear-gradient(180deg, rgba(4,8,16,0.98) 0%, rgba(4,12,24,0.95) 100%)",
          borderColor: "rgba(34,211,238,0.12)",
          backdropFilter: "blur(20px)",
        }}>
        <a href={createPageUrl("Dashboard")}
          className="p-1.5 rounded-xl border transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#64748b" }}>
          <ArrowLeft size={13} />
        </a>

        <div className="flex items-center gap-2">
          <Globe size={13} className="text-cyan-400" />
          <span className="text-[11px] font-black tracking-widest uppercase hidden sm:block"
            style={{ color: "#475569", fontFamily: "monospace" }}>
            Epoch Map
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[10px] ml-1"
          style={{ fontFamily: "monospace", color: "#334155" }}>
          <span><span className="text-cyan-400">{nations.length}</span> Nations</span>
          <span><span className="text-amber-400">{ownedCount}</span> Claimed</span>
          {myNation && <span><span style={{ color: myNation.flag_color || "#22d3ee" }}>{myHexCount}</span> Mine</span>}
        </div>

        {myNation && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border ml-2"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="w-4 h-4 rounded-full border"
              style={{ background: myNation.flag_color || "#3b82f6", borderColor: "rgba(255,255,255,0.2)" }} />
            <span className="text-[11px] font-bold" style={{ color: myNation.flag_color || "#22d3ee" }}>
              {myNation.name}
            </span>
            <span className="text-[10px] text-amber-400" style={{ fontFamily: "monospace" }}>
              {Math.round(myNation.currency || 0)} <span className="text-amber-600">gold</span>
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Buy mode toggle */}
          {myNation && (
            <button
              onClick={() => setBuyMode(b => !b)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all"
              style={{
                color: buyMode ? "#22d3ee" : "#475569",
                borderColor: buyMode ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.08)",
                background: buyMode ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
                fontFamily: "monospace",
              }}>
              <ShoppingCart size={10} />
              {buyMode ? "Exit Buy Mode" : "Buy Land"}
            </button>
          )}
          {myNation && (
            <button
              onClick={centerOnMyTerritory}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all"
              style={{
                color: "#a78bfa",
                borderColor: "rgba(167,139,250,0.2)",
                background: "rgba(167,139,250,0.06)",
                fontFamily: "monospace",
              }}>
              <Crosshair size={10} /> Home
            </button>
          )}
          {initializing && (
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 animate-pulse"
              style={{ fontFamily: "monospace" }}>
              <RefreshCw size={10} className="animate-spin" /> Building…
            </div>
          )}
        </div>
      </div>

      {/* ── View mode tabs ── */}
      <div className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 border-b"
        style={{ background: "rgba(4,8,16,0.92)", borderColor: "rgba(255,255,255,0.05)" }}>
        {[
          { id: "global", label: "Global View",  desc: "Full map" },
          { id: "nation", label: "Nation View",  desc: "Territory" },
          { id: "city",   label: "City View",    desc: "Zoom in" },
        ].map(m => (
          <button key={m.id} onClick={() => setViewMode(m.id)}
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all"
            style={{
              fontFamily: "monospace",
              color: viewMode === m.id ? "#22d3ee" : "#334155",
              background: viewMode === m.id ? "rgba(34,211,238,0.08)" : "transparent",
              border: `1px solid ${viewMode === m.id ? "rgba(34,211,238,0.3)" : "transparent"}`,
            }}>
            {m.label}
          </button>
        ))}
        {buyMode && (
          <div className="ml-auto text-[10px] text-cyan-400 animate-pulse flex items-center gap-1.5"
            style={{ fontFamily: "monospace" }}>
            <ShoppingCart size={9} />
            Highlighted tiles are available to claim (50 gold each)
          </div>
        )}
      </div>

      {/* ── Map canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{ cursor: "grab", background: "radial-gradient(ellipse at 50% 50%, #081428 0%, #040810 70%)" }}
        {...handlers}
        onMouseUp={handlers.onMouseUp}
        onMouseLeave={handlers.onMouseUp}
      >
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
          backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        <svg
          width="100%" height="100%"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* All SVG defs: gradients, filters, icon symbols */}
          <HexDefs />

          <g transform={`translate(${pan.x.toFixed(1)}, ${pan.y.toFixed(1)}) scale(${zoom})`}>

            {/* ── Hex tiles ── */}
            {visibleTiles.map(tile => {
              const pos = hexToPixel(tile.q, tile.r, HEX_SIZE);
              return (
                <HexTileRenderer
                  key={tile.hex_id}
                  tile={tile}
                  cx={pos.x} cy={pos.y}
                  zoom={zoom}
                  isSelected={selectedTile?.hex_id === tile.hex_id}
                  isHovered={hoveredTile?.hex_id === tile.hex_id}
                  isMyTerritory={tile.owner_nation_id === myNation?.id}
                  protectionActive={isProtected(tile)}
                  isAdjacentToMine={buyMode && adjacentToMine.has(tile.hex_id) && !tile.owner_nation_id}
                  onClick={t => {
                    if (moved.current) return;
                    if (buyMode && adjacentToMine.has(t.hex_id) && !t.owner_nation_id) {
                      setSelectedTile(t);
                    } else {
                      setSelectedTile(s => s?.hex_id === t.hex_id ? null : t);
                    }
                  }}
                  onHover={setHoveredTile}
                  onLeave={() => setHoveredTile(null)}
                />
              );
            })}

            {/* ── Territory borders (only between owned hexes) ── */}
            <HexTerritoryBorders
              tiles={visibleTiles.filter(t => t.owner_nation_id)}
              zoom={zoom}
            />

            {/* ── Diplomacy overlays ── */}
            {viewMode === "global" && (
              <HexMapOverlays
                tiles={visibleTiles}
                nations={nations}
                tradeRoutes={tradeRoutes}
                showAlliances={layers.alliances}
                showTrade={layers.trade}
                showWars={layers.wars}
              />
            )}

            {/* ── Nation labels (global overview) ── */}
            {zoom < 1.0 && nations.map(n => {
              const cap = Object.values(tiles).find(
                t => t.owner_nation_id === n.id && t.is_capital
              );
              if (!cap) return null;
              const pos = hexToPixel(cap.q, cap.r, HEX_SIZE);
              return (
                <g key={n.id}>
                  <text
                    x={pos.x} y={pos.y + HEX_SIZE * 1.6}
                    textAnchor="middle"
                    fontSize={HEX_SIZE * 0.48}
                    fontWeight="bold"
                    fill={n.flag_color || "#22d3ee"}
                    stroke="rgba(0,0,0,0.8)"
                    strokeWidth={2 / zoom}
                    paintOrder="stroke"
                    style={{ pointerEvents: "none", userSelect: "none", fontFamily: "Inter, sans-serif" }}
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* ── Map controls ── */}
        <HexMapControls
          zoom={zoom}
          onZoomIn={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.25))}
          onZoomOut={() => setZoom(z => Math.max(MIN_ZOOM, z * 0.8))}
          onReset={() => {
            setZoom(1.4);
            const cap = Object.values(tiles).find(
              t => t.owner_nation_id === myNation?.id && t.is_capital
            );
            if (cap) centerTile(cap.q, cap.r, 1.4, containerRef.current);
            else setPan({ x: 500, y: 350 });
          }}
          viewMode={viewMode}
          onViewMode={setViewMode}
          layers={layers}
          onLayerToggle={key => setLayers(l => ({ ...l, [key]: !l[key] }))}
        />

        {/* ── Tile panel ── */}
        {selectedTile && (
          <HexTilePanel
            tile={selectedTile}
            myNation={myNation}
            ownedHexIds={ownedHexIds}
            onClaim={claimHex}
            onBuild={buildOnHex}
            onClose={() => setSelectedTile(null)}
          />
        )}

        {/* ── Hover tooltip ── */}
        {hoveredTile && !selectedTile && (
          <div
            className="absolute bottom-5 left-5 z-30 pointer-events-none"
            style={{
              background: "rgba(4,12,28,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(16px)",
              borderRadius: 14,
              padding: "8px 14px",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{
                background: TERRAIN_CONFIG[hoveredTile.terrain_type]?.fill || "#1e6b35",
              }} />
              <span className="text-xs font-bold text-white capitalize"
                style={{ fontFamily: "Inter, sans-serif" }}>
                {hoveredTile.terrain_type}
              </span>
              {hoveredTile.owner_nation_name && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-semibold"
                    style={{ color: hoveredTile.owner_color || "#22d3ee", fontFamily: "Inter, sans-serif" }}>
                    {hoveredTile.owner_nation_name}
                  </span>
                </>
              )}
              {hoveredTile.resource_type !== "none" && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-amber-400" style={{ fontFamily: "monospace" }}>
                    {hoveredTile.resource_type}
                  </span>
                </>
              )}
              {buyMode && adjacentToMine.has(hoveredTile.hex_id) && !hoveredTile.owner_nation_id && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-cyan-400" style={{ fontFamily: "monospace" }}>
                    Click to buy (50 gold)
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Map legend ── */}
        <div className="absolute top-3 left-3 z-20 space-y-1 hidden sm:block">
          {[
            { color: "#22d3ee", label: "My Territory" },
            { color: "#4ade80", label: "Ally" },
            { color: "#f87171", label: "At War" },
            { color: "#fbbf24", label: "Trade Route" },
            { color: "rgba(34,211,238,0.4)", label: "Buyable (buy mode)", dashed: true },
          ].map(({ color, label, dashed }) => (
            <div key={label} className="flex items-center gap-2 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(4,8,16,0.75)", backdropFilter: "blur(8px)" }}>
              <div className="w-5 h-1.5 rounded-full"
                style={{
                  background: color,
                  border: dashed ? `1px dashed ${color}` : "none",
                  opacity: dashed ? 0.7 : 1,
                }} />
              <span className="text-[9px] text-slate-400" style={{ fontFamily: "monospace" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── No nation prompt ── */}
        {!myNation && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(4,8,16,0.8)", backdropFilter: "blur(12px)" }}>
            <div className="text-center space-y-4 p-10 rounded-2xl border"
              style={{
                background: "rgba(4,12,28,0.97)",
                borderColor: "rgba(34,211,238,0.2)",
                boxShadow: "0 0 60px rgba(34,211,238,0.08)",
              }}>
              <Globe size={44} className="text-cyan-400 mx-auto" />
              <div className="text-xl font-black text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                No Nation Found
              </div>
              <div className="text-sm text-slate-400">Create a nation to claim territory on this map.</div>
              <a href={createPageUrl("Onboarding")}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-black"
                style={{ background: "linear-gradient(135deg, #22d3ee, #818cf8)" }}>
                Create Nation
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}