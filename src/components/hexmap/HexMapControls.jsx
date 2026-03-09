/**
 * HexMapControls — zoom, mode, and layer controls for the hex map.
 */
import { Plus, Minus, RotateCcw, Globe, Map, Building2, Layers } from "lucide-react";

const ZOOM_MODES = [
  { id: "global", label: "Global", emoji: "🌐", desc: "World view" },
  { id: "nation", label: "Nation", emoji: "🗺",  desc: "Territory view" },
  { id: "city",   label: "City",   emoji: "🏙",  desc: "City detail" },
];

export default function HexMapControls({
  zoom, onZoomIn, onZoomOut, onReset,
  viewMode, onViewMode,
  layers, onLayerToggle,
}) {
  return (
    <div className="absolute right-3 top-14 z-30 flex flex-col gap-2">

      {/* Zoom controls */}
      <div className="flex flex-col rounded-xl overflow-hidden border"
        style={{ background: "rgba(4,8,16,0.85)", borderColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
        <button onClick={onZoomIn}
          className="p-2 hover:bg-white/10 transition-colors text-slate-300 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Plus size={14} />
        </button>
        <div className="px-2.5 py-1 text-center text-[10px] text-slate-500 ep-mono border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {Math.round(zoom * 100)}%
        </div>
        <button onClick={onZoomOut}
          className="p-2 hover:bg-white/10 transition-colors text-slate-300 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Minus size={14} />
        </button>
        <button onClick={onReset}
          className="p-2 hover:bg-white/10 transition-colors text-slate-500">
          <RotateCcw size={12} />
        </button>
      </div>

      {/* View mode */}
      <div className="flex flex-col rounded-xl overflow-hidden border"
        style={{ background: "rgba(4,8,16,0.85)", borderColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
        {ZOOM_MODES.map((m, i) => (
          <button
            key={m.id}
            onClick={() => onViewMode(m.id)}
            title={m.desc}
            className="p-2 transition-all text-[11px] font-bold ep-mono"
            style={{
              color: viewMode === m.id ? "#22d3ee" : "#475569",
              background: viewMode === m.id ? "rgba(34,211,238,0.1)" : "transparent",
              borderBottom: i < ZOOM_MODES.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
            {m.emoji}
          </button>
        ))}
      </div>

      {/* Layer toggles */}
      <div className="flex flex-col rounded-xl overflow-hidden border"
        style={{ background: "rgba(4,8,16,0.85)", borderColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
        {Object.entries(layers).map(([key, active], i, arr) => (
          <button
            key={key}
            onClick={() => onLayerToggle(key)}
            title={key}
            className="px-2 py-1.5 transition-all text-[9px] font-bold ep-mono uppercase"
            style={{
              color: active ? "#a78bfa" : "#374151",
              background: active ? "rgba(167,139,250,0.08)" : "transparent",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
            {key === "alliances" ? "🤝" : key === "wars" ? "⚔" : key === "trade" ? "🚢" : key === "resources" ? "💎" : "●"}
          </button>
        ))}
      </div>
    </div>
  );
}