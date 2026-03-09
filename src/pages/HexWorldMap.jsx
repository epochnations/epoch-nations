/**
 * HexWorldMap — Infinite procedural hex strategy map.
 * Three zoom layers: Global (diplomacy), Nation (territory), City (building).
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  hexToPixel, pixelToHex, hexId, hexNeighbors,
  generateHexTile, generateStartingCluster, findFreeClusterOrigin,
  HEX_SIZE, TERRAIN_CONFIG,
} from "../components/hexmap/HexEngine";
import HexTileRenderer from "../components/hexmap/HexTileRenderer";
import HexMapOverlays from "../components/hexmap/HexMapOverlays";
import HexTilePanel from "../components/hexmap/HexTilePanel";
import HexMapControls from "../components/hexmap/HexMapControls";
import { ArrowLeft, Globe, Search, Shield, RefreshCw, Crosshair } from "lucide-react";

// ─── Map Engine Hook ──────────────────────────────────────────────────────────
const MIN_ZOOM = 0.3, MAX_ZOOM = 8;

function useHexMapEngine(containerRef) {
  const [zoom, setZoom] = useState(1.2);
  const [pan, setPan]   = useState({ x: 400, y: 300 });
  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);

  const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

  const onMouseDown = useCallback(e => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback(e => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
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
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
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
  const onTouchEnd = useCallback(() => { dragging.current = false; lastTouchDist.current = null; }, []);

  function centerOn(worldX, worldY) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPan({ x: rect.width / 2 - worldX * zoom, y: rect.height / 2 - worldY * zoom });
  }

  return {
    zoom, setZoom, pan, setPan, centerOn,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onWheel, onTouchStart, onTouchMove, onTouchEnd },
  };
}

// ─── Visible tile range calculator ───────────────────────────────────────────
function visibleHexRange(pan, zoom, containerW, containerH) {
  const margin = HEX_SIZE * 3;
  const minX = (-pan.x - margin) / zoom;
  const minY = (-pan.y - margin) / zoom;
  const maxX = (-pan.x + containerW + margin) / zoom;
  const maxY = (-pan.y + containerH + margin) / zoom;

  // Convert to approximate hex range
  const size = HEX_SIZE;
  const qMin = Math.floor((minX / (size * Math.sqrt(3))) - 2);
  const qMax = Math.ceil((maxX / (size * Math.sqrt(3))) + 2);
  const rMin = Math.floor((minY / (size * 1.5)) - 2);
  const rMax = Math.ceil((maxY / (size * 1.5)) + 2);
  return { qMin, qMax, rMin, rMax };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function HexWorldMap() {
  const containerRef = useRef(null);
  const { zoom, setZoom, pan, setPan, centerOn, handlers } = useHexMapEngine(containerRef);

  const [myNation, setMyNation]   = useState(null);
  const [nations, setNations]     = useState([]);
  const [tiles, setTiles]         = useState({});       // keyed by hex_id
  const [tradeRoutes, setTradeRoutes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [hoveredTile, setHoveredTile]   = useState(null);
  const [viewMode, setViewMode]   = useState("global"); // global | nation | city
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [layers, setLayers] = useState({ alliances: true, wars: true, trade: true, resources: true });

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0].contentRect;
      setContainerSize({ w: e.width, h: e.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Load data
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
      base44.entities.HexTile.list("-created_date", 500),
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
      // Center on capital
      const capital = tilesList.find(t => t.owner_nation_id === myNat.id && t.is_capital);
      if (capital) {
        const pos = hexToPixel(capital.q, capital.r);
        setTimeout(() => {
          setPan(p => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return p;
            return { x: rect.width / 2 - pos.x * 1.2, y: rect.height / 2 - pos.y * 1.2 };
          });
          setZoom(1.2);
        }, 200);
      } else {
        // Nation exists but has no hexes — initialize territory
        await initializeNationTerritory(myNat, tilesList);
      }
    }

    setLoading(false);
  }

  async function loadNations() {
    const data = await base44.entities.Nation.list("-gdp", 60);
    setNations(data);
  }

  async function loadTiles() {
    const data = await base44.entities.HexTile.list("-created_date", 500);
    const tileMap = {};
    for (const t of data) tileMap[t.hex_id] = t;
    setTiles(tileMap);
  }

  // Generate starting territory for a nation
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
        // Override ocean for starting tiles
        terrain_type: i === 0 ? "plains" : base.terrain_type === "ocean" ? "plains" : base.terrain_type,
        owner_nation_id: nation.id,
        owner_nation_name: nation.name,
        owner_color: nation.flag_color || "#3b82f6",
        owner_flag: nation.flag_emoji || "🏴",
        is_capital: i === 0,
        has_city: i === 0,
        city_name: `${nation.name} City`,
        cluster_id: `cluster_${nation.id}`,
        protection_until: protectionUntil,
      };
    });

    await base44.entities.HexTile.bulkCreate(tilesToCreate);
    await loadTiles();

    // Center on capital
    const pos = hexToPixel(origin.q, origin.r);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPan({ x: rect.width / 2 - pos.x * 1.5, y: rect.height / 2 - pos.y * 1.5 });
      setZoom(1.5);
    }
    setInitializing(false);
  }

  // Generate surrounding terrain lazily as player pans
  const generateVisibleTerrain = useCallback(async () => {
    const { qMin, qMax, rMin, rMax } = visibleHexRange(pan, zoom, containerSize.w, containerSize.h);
    const toCreate = [];
    for (let r = rMin; r <= rMax; r++) {
      for (let q = qMin; q <= qMax; q++) {
        const id = hexId(q, r);
        if (!tiles[id]) {
          toCreate.push(generateHexTile(q, r));
        }
      }
    }
    if (toCreate.length > 0 && toCreate.length < 200) {
      await base44.entities.HexTile.bulkCreate(toCreate);
    }
  }, [pan, zoom, containerSize, tiles]);

  // Lazy terrain generation on pan/zoom
  const genTimer = useRef(null);
  useEffect(() => {
    clearTimeout(genTimer.current);
    genTimer.current = setTimeout(generateVisibleTerrain, 600);
    return () => clearTimeout(genTimer.current);
  }, [pan, zoom]);

  // Claim a hex tile
  async function claimHex(tile) {
    if (!myNation) return;
    if (myNation.currency < 50) { alert("Not enough gold to claim territory (costs 50)!"); return; }

    await base44.entities.HexTile.update(tile.hex_id ? tile.id : tile.id, {
      owner_nation_id:   myNation.id,
      owner_nation_name: myNation.name,
      owner_color:       myNation.flag_color || "#3b82f6",
      owner_flag:        myNation.flag_emoji || "🏴",
    });
    await base44.entities.Nation.update(myNation.id, { currency: (myNation.currency || 0) - 50 });
    setSelectedTile(null);
    await loadTiles();
  }

  // Build on a hex
  async function buildOnHex(tile, building) {
    if (!myNation) return;
    if (myNation.currency < building.cost) { alert(`Not enough gold! Need ${building.cost}.`); return; }

    const updates = { buildings: [...(tile.buildings || []), building.label] };
    if (building.id === "city")          { updates.has_city = true; updates.city_name = `${myNation.name} City`; }
    if (building.id === "military_base") updates.has_military_base = true;
    if (building.id === "trade_port")    updates.has_trade_port = true;
    updates.infrastructure_level = (tile.infrastructure_level || 0) + 1;

    await base44.entities.HexTile.update(tile.id, updates);
    await base44.entities.Nation.update(myNation.id, { currency: (myNation.currency || 0) - building.cost });
    setSelectedTile(null);
    await loadTiles();
  }

  // Owned hex ids for adjacency check
  const ownedHexIds = useMemo(() => {
    const s = new Set();
    for (const t of Object.values(tiles)) {
      if (t.owner_nation_id === myNation?.id) s.add(t.hex_id);
    }
    return s;
  }, [tiles, myNation]);

  // View mode zoom mapping
  useEffect(() => {
    if (viewMode === "global") setZoom(0.7);
    else if (viewMode === "nation") setZoom(1.5);
    else if (viewMode === "city") setZoom(3.5);
  }, [viewMode]);

  // Center on my territory
  function centerOnMyTerritory() {
    const cap = Object.values(tiles).find(t => t.owner_nation_id === myNation?.id && t.is_capital);
    if (cap) {
      const pos = hexToPixel(cap.q, cap.r);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setPan({ x: rect.width / 2 - pos.x * zoom, y: rect.height / 2 - pos.y * zoom });
    }
  }

  // Determine which tiles to render (visible frustum only)
  const visibleTiles = useMemo(() => {
    const { qMin, qMax, rMin, rMax } = visibleHexRange(pan, zoom, containerSize.w, containerSize.h);
    return Object.values(tiles).filter(t =>
      t.q >= qMin && t.q <= qMax && t.r >= rMin && t.r <= rMax
    );
  }, [tiles, pan, zoom, containerSize]);

  // Protection check
  function isProtected(tile) {
    if (!tile.protection_until) return false;
    return new Date(tile.protection_until) > new Date();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040810] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-slate-400 text-sm ep-mono tracking-widest">LOADING WORLD MAP...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040810] text-white flex flex-col" style={{ height: "100dvh" }}>
      {/* Top Bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b z-30"
        style={{ background: "rgba(4,8,16,0.95)", borderColor: "rgba(34,211,238,0.1)", backdropFilter: "blur(20px)" }}>
        <a href={createPageUrl("Dashboard")}
          className="p-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 transition-colors">
          <ArrowLeft size={13} />
        </a>
        <Globe size={13} className="text-cyan-400" />
        <span className="text-xs font-black tracking-widest text-slate-400 uppercase ep-mono hidden sm:block">
          World Map · {nations.length} Nations · {Object.values(tiles).filter(t => t.owner_nation_id).length} Claimed Hexes
        </span>

        {myNation && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-xl border"
            style={{ background: "rgba(34,211,238,0.05)", borderColor: "rgba(34,211,238,0.15)" }}>
            <span className="text-sm">{myNation.flag_emoji || "🏴"}</span>
            <span className="text-xs font-bold" style={{ color: myNation.flag_color || "#22d3ee" }}>{myNation.name}</span>
            <span className="text-[10px] text-amber-400 ep-mono">{Math.round(myNation.currency || 0)}💰</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {myNation && (
            <button onClick={centerOnMyTerritory}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all hover:bg-white/10"
              style={{ color: "#22d3ee", borderColor: "rgba(34,211,238,0.2)" }}>
              <Crosshair size={10} /> My Territory
            </button>
          )}
          {initializing && (
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 ep-mono animate-pulse">
              <RefreshCw size={10} className="animate-spin" /> Generating territory...
            </div>
          )}
        </div>
      </div>

      {/* View mode tabs */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-2 border-b"
        style={{ background: "rgba(4,8,16,0.9)", borderColor: "rgba(255,255,255,0.06)" }}>
        {[
          { id: "global", label: "🌐 Global", desc: "Diplomacy view" },
          { id: "nation", label: "🗺 Nation",  desc: "Territory view" },
          { id: "city",   label: "🏙 City",    desc: "City simulation" },
        ].map(m => (
          <button key={m.id} onClick={() => setViewMode(m.id)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ep-mono"
            style={{
              color: viewMode === m.id ? "#22d3ee" : "#475569",
              background: viewMode === m.id ? "rgba(34,211,238,0.1)" : "transparent",
              border: `1px solid ${viewMode === m.id ? "rgba(34,211,238,0.3)" : "transparent"}`,
            }}>
            {m.label}
          </button>
        ))}
        <div className="ml-auto text-[10px] text-slate-700 ep-mono hidden sm:block">
          Scroll to zoom · Drag to pan · Click hex to inspect
        </div>
      </div>

      {/* Map Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: "grab", background: "#040d1c" }}
        {...handlers}
        onMouseUp={handlers.onMouseUp}
        onMouseLeave={handlers.onMouseUp}
      >
        {/* SVG world */}
        <svg
          width="100%" height="100%"
          style={{ position: "absolute", inset: 0 }}
          onClick={e => {
            // Click on empty space deselects
            if (e.target.tagName === "svg") setSelectedTile(null);
          }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

            {/* Render visible tiles */}
            {visibleTiles.map(tile => {
              const pos = hexToPixel(tile.q, tile.r);
              return (
                <HexTileRenderer
                  key={tile.hex_id}
                  tile={tile}
                  cx={pos.x} cy={pos.y}
                  zoom={zoom}
                  isSelected={selectedTile?.hex_id === tile.hex_id}
                  isHovered={hoveredTile?.hex_id === tile.hex_id}
                  isMyTerritory={tile.owner_nation_id === myNation?.id}
                  isBorderTile={false}
                  protectionActive={isProtected(tile)}
                  onClick={setSelectedTile}
                  onHover={setHoveredTile}
                  onLeave={() => setHoveredTile(null)}
                />
              );
            })}

            {/* Diplomacy overlays */}
            {viewMode === "global" && (
              <HexMapOverlays
                tiles={visibleTiles}
                nations={nations}
                myNation={myNation}
                tradeRoutes={tradeRoutes}
                showAlliances={layers.alliances}
                showTrade={layers.trade}
                showWars={layers.wars}
              />
            )}

            {/* Nation labels at global zoom */}
            {viewMode === "global" && zoom < 1.5 && nations.map(n => {
              const cap = Object.values(tiles).find(t => t.owner_nation_id === n.id && t.is_capital);
              if (!cap) return null;
              const pos = hexToPixel(cap.q, cap.r);
              return (
                <g key={n.id}>
                  <text x={pos.x} y={pos.y + HEX_SIZE * 1.5} textAnchor="middle"
                    fontSize={HEX_SIZE * 0.55} fill={n.flag_color || "#22d3ee"}
                    fontWeight="bold" style={{ pointerEvents: "none", userSelect: "none" }}>
                    {n.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Controls overlay */}
        <HexMapControls
          zoom={zoom}
          onZoomIn={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.25))}
          onZoomOut={() => setZoom(z => Math.max(MIN_ZOOM, z * 0.8))}
          onReset={() => { setZoom(1.2); setPan({ x: 400, y: 300 }); }}
          viewMode={viewMode}
          onViewMode={setViewMode}
          layers={layers}
          onLayerToggle={key => setLayers(l => ({ ...l, [key]: !l[key] }))}
        />

        {/* Hex tile panel */}
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

        {/* Hovered tile tooltip */}
        {hoveredTile && !selectedTile && (
          <div className="absolute bottom-4 left-4 z-30 px-3 py-2 rounded-xl border pointer-events-none"
            style={{ background: "rgba(4,8,16,0.9)", borderColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{TERRAIN_CONFIG[hoveredTile.terrain_type]?.emoji || "🌍"}</span>
              <div>
                <div className="text-xs font-bold text-white capitalize">{hoveredTile.terrain_type}</div>
                <div className="text-[10px] text-slate-500 ep-mono">
                  q:{hoveredTile.q} r:{hoveredTile.r}
                  {hoveredTile.owner_nation_name && ` · ${hoveredTile.owner_nation_name}`}
                  {hoveredTile.resource_type !== "none" && ` · ${hoveredTile.resource_type}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-16 z-20 flex flex-col gap-1">
          {[
            { color: "#22d3ee", label: "My Territory" },
            { color: "#4ade80", label: "Ally" },
            { color: "#f87171", label: "Enemy / War" },
            { color: "#4ade80", label: "Protected" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[9px] text-slate-400 ep-mono">{label}</span>
            </div>
          ))}
        </div>

        {/* New player init prompt */}
        {!myNation && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
            <div className="text-center space-y-3 p-8 rounded-2xl border"
              style={{ background: "rgba(4,8,16,0.95)", borderColor: "rgba(34,211,238,0.2)" }}>
              <Globe size={40} className="text-cyan-400 mx-auto" />
              <div className="text-lg font-black text-white">No Nation Found</div>
              <div className="text-sm text-slate-400">Create your nation first to claim territory.</div>
              <a href={createPageUrl("Onboarding")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black"
                style={{ background: "linear-gradient(135deg, #22d3ee, #818cf8)" }}>
                Create Nation
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes tradeAnim    { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -28; } }
        @keyframes allianceAnim { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -40; } }
        @keyframes warAnim      { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -18; } }
      `}</style>
    </div>
  );
}