/**
 * WorldMap – interactive Google Maps-style strategy map.
 * Replaces the old static dot map.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Globe, Wifi } from "lucide-react";

import { useMapEngine } from "../map/MapEngine";
import MapTerrain, { MAP_W, MAP_H, nationPos, CITIES } from "../map/MapTerrain";
import MapOverlays from "../map/MapOverlays";
import MapNationIcon from "../map/MapNationIcon";
import MapSearchBar from "../map/MapSearchBar";
import MapControls from "../map/MapControls";
import MapCityPanel from "../map/MapCityPanel";

const DEFAULT_LAYERS = {
  wars: true, battles: true, tradeRoutes: true, danger: true, resources: false
};

export default function WorldMap({ myNation, onSelectNation }) {
  const containerRef = useRef(null);
  const { zoom, pan, setZoom, setPan, smoothPanTo, handlers } = useMapEngine(containerRef);

  const [nations, setNations] = useState([]);
  const [mode, setMode] = useState("global");
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [hoveredNation, setHoveredNation] = useState(null);
  const [selectedNation, setSelectedNation] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [live] = useState(true);

  useEffect(() => {
    loadNations();
    const unsub = base44.entities.Nation.subscribe(() => loadNations());
    return unsub;
  }, []);

  async function loadNations() {
    const data = await base44.entities.Nation.list("-gdp", 60);
    setNations(data);
  }

  const nationIndexMap = useMemo(() => {
    const sorted = [...nations].sort((a, b) => a.id.localeCompare(b.id));
    const map = {};
    sorted.forEach((n, i) => { map[n.id] = i; });
    return map;
  }, [nations]);

  useEffect(() => {
    if (mode === "national" && myNation) {
      const idx = nationIndexMap[myNation.id] ?? 0;
      const { x, y } = nationPos(idx);
      setZoom(2.5);
      smoothPanTo(x, y, 2.5);
    } else if (mode === "global") {
      setZoom(0.85);
      setPan({ x: 0, y: 0 });
    }
  }, [mode, myNation, nationIndexMap]);

  const focusNation = useCallback((nation) => {
    const idx = nationIndexMap[nation.id] ?? 0;
    const { x, y } = nationPos(idx);
    const newZoom = Math.max(zoom, 1.8);
    setZoom(newZoom);
    smoothPanTo(x, y, newZoom);
    setSelectedNation(nation);
    onSelectNation?.(nation);
  }, [nationIndexMap, zoom, smoothPanTo, onSelectNation]);

  const focusCity = useCallback((city) => {
    const newZoom = Math.max(zoom, 2.5);
    setZoom(newZoom);
    smoothPanTo(city.x, city.y, newZoom);
    setSelectedCity(city);
  }, [zoom, smoothPanTo]);

  function toggleLayer(key) {
    setLayers(l => ({ ...l, [key]: !l[key] }));
  }

  function resetView() {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
    setSelectedNation(null);
    setSelectedCity(null);
  }

  const cityClickTargets = useMemo(() => {
    if (zoom < 1.5) return [];
    return CITIES;
  }, [zoom]);

  const displayNations = mode === "national" && myNation
    ? nations.filter(n =>
        n.id === myNation.id ||
        (myNation.allies || []).includes(n.id) ||
        (myNation.at_war_with || []).includes(n.id)
      )
    : nations;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#071326] rounded-2xl overflow-hidden select-none"
      style={{ cursor: "grab" }}
      {...handlers}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <Globe size={13} className="text-cyan-400 shrink-0" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
          {mode === "global" ? `World · ${nations.length} Nations` : `National View · ${myNation?.name || ""}`}
        </span>
        <div className="flex-1" />
        <MapSearchBar
          nations={nations}
          onSelectNation={focusNation}
          onSelectCity={focusCity}
        />
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${live ? "text-green-400 bg-green-400/10" : "text-slate-500"}`}>
          <Wifi size={10} /> {live ? "LIVE" : "PAUSED"}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="absolute inset-0 pt-9" style={{ overflow: "hidden" }}>
        <svg
          width={MAP_W}
          height={MAP_H}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            willChange: "transform",
            imageRendering: "crisp-edges",
            shapeRendering: "geometricPrecision",
          }}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        >
          <MapTerrain zoom={zoom} />

          <MapOverlays
            nations={nations}
            myNation={myNation}
            layers={layers}
            selectedNation={selectedNation}
            nationIndexMap={nationIndexMap}
          />

          {cityClickTargets.map(city => (
            <g key={city.name} style={{ cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); focusCity(city); }}>
              <circle cx={city.x} cy={city.y} r={8} fill="transparent" />
            </g>
          ))}

          {displayNations.map((nation) => {
            const idx = nationIndexMap[nation.id] ?? 0;
            const { x, y } = nationPos(idx);
            return (
              <MapNationIcon
                key={nation.id}
                nation={nation}
                x={x} y={y}
                zoom={zoom}
                isMe={myNation?.id === nation.id}
                isAlly={myNation?.allies?.includes(nation.id)}
                isEnemy={myNation?.at_war_with?.includes(nation.id)}
                isSelected={selectedNation?.id === nation.id}
                onClick={focusNation}
                onHover={setHoveredNation}
                onLeave={() => setHoveredNation(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <MapControls
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(6, z + 0.4))}
        onZoomOut={() => setZoom(z => Math.max(0.35, z - 0.4))}
        onReset={resetView}
        mode={mode}
        onModeChange={setMode}
        layers={layers}
        onLayerToggle={toggleLayer}
        showLayerPanel={showLayerPanel}
        onToggleLayerPanel={() => setShowLayerPanel(p => !p)}
      />

      {/* Hover Tooltip */}
      {hoveredNation && !selectedCity && (
        <div className="absolute bottom-14 left-4 z-40 min-w-[160px] max-w-[200px] bg-black/85 border border-white/20 rounded-xl p-3 backdrop-blur-xl pointer-events-none animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{hoveredNation.flag_emoji || "🏴"}</span>
            <div>
              <div className="text-xs font-bold text-white">{hoveredNation.name}</div>
              <div className="text-[10px] text-slate-500">{hoveredNation.epoch}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <div className="text-slate-500">GDP</div><div className="text-green-400 font-mono">{hoveredNation.gdp}</div>
            <div className="text-slate-500">Stability</div><div className="text-cyan-400 font-mono">{hoveredNation.stability}%</div>
            <div className="text-slate-500">Tech Lvl</div><div className="text-violet-400 font-mono">T{hoveredNation.tech_level}</div>
            {(hoveredNation.at_war_with || []).length > 0 && (
              <><div className="text-slate-500">Status</div><div className="text-red-400 font-bold">⚔ At War</div></>
            )}
          </div>
          {myNation && (
            <div className={`mt-2 text-[10px] font-bold ${
              myNation.id === hoveredNation.id ? "text-cyan-400" :
              myNation.at_war_with?.includes(hoveredNation.id) ? "text-red-400" :
              myNation.allies?.includes(hoveredNation.id) ? "text-green-400" : "text-slate-500"
            }`}>
              {myNation.id === hoveredNation.id ? "🫵 Your nation" :
               myNation.at_war_with?.includes(hoveredNation.id) ? "⚔ Enemy" :
               myNation.allies?.includes(hoveredNation.id) ? "🤝 Ally" : "Neutral"}
            </div>
          )}
        </div>
      )}

      {/* City Panel */}
      {selectedCity && (
        <MapCityPanel city={selectedCity} onClose={() => setSelectedCity(null)} />
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-2">
        {[
          { color: "bg-red-500", label: "At War" },
          { color: "bg-green-500", label: "Ally" },
          { color: "bg-amber-400", label: "Danger" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1 bg-black/60 rounded-lg px-2 py-1 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[10px] text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}