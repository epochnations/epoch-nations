/**
 * MapControls – zoom buttons, layer toggles, map mode switch.
 */
import { ZoomIn, ZoomOut, Layers, Globe, Map, RotateCcw } from "lucide-react";

const LAYERS = [
  { key: "wars",        label: "Wars",          emoji: "⚔️" },
  { key: "battles",     label: "Battles",       emoji: "💥" },
  { key: "tradeRoutes", label: "Trade Routes",  emoji: "📦" },
  { key: "danger",      label: "Danger Zones",  emoji: "⚠️" },
  { key: "resources",   label: "Resources",     emoji: "⛏️" },
  { key: "territories", label: "Territories",   emoji: "🗺️" },
  { key: "cities",      label: "Cities",        emoji: "🏛️" },
  { key: "armies",      label: "Armies",        emoji: "⚔️" },
  { key: "infra",       label: "Infrastructure",emoji: "🏗️" },
];

export default function MapControls({
  zoom, onZoomIn, onZoomOut, onReset,
  mode, onModeChange,
  layers, onLayerToggle,
  showLayerPanel, onToggleLayerPanel
}) {
  return (
    <div className="absolute right-3 bottom-12 z-30 flex flex-col gap-2 items-end">
      {/* Zoom controls */}
      <div className="flex flex-col bg-black/70 border border-white/20 rounded-xl overflow-hidden backdrop-blur-sm">
        <button onClick={onZoomIn}
          className="p-2.5 hover:bg-white/10 text-slate-300 transition-colors border-b border-white/10">
          <ZoomIn size={15}/>
        </button>
        <div className="px-2 py-1 text-center">
          <span className="text-[10px] text-slate-500 font-mono">{Math.round(zoom*100)}%</span>
        </div>
        <button onClick={onZoomOut}
          className="p-2.5 hover:bg-white/10 text-slate-300 transition-colors border-t border-white/10">
          <ZoomOut size={15}/>
        </button>
      </div>

      {/* Reset view */}
      <button onClick={onReset}
        className="p-2.5 bg-black/70 border border-white/20 rounded-xl hover:bg-white/10 text-slate-400 transition-colors backdrop-blur-sm">
        <RotateCcw size={14}/>
      </button>

      {/* Layer toggle */}
      <button onClick={onToggleLayerPanel}
        className={`p-2.5 border rounded-xl transition-colors backdrop-blur-sm ${showLayerPanel ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300" : "bg-black/70 border-white/20 text-slate-400 hover:text-white"}`}>
        <Layers size={14}/>
      </button>

      {/* Layer panel */}
      {showLayerPanel && (
        <div className="bg-black/80 border border-white/20 rounded-xl p-3 backdrop-blur-xl min-w-[150px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Overlays</div>
          {LAYERS.map(l => (
            <button key={l.key} onClick={() => onLayerToggle(l.key)}
              className="w-full flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-sm">{l.emoji}</span>
              <span className="text-xs text-slate-300 flex-1 text-left">{l.label}</span>
              <div className={`w-3 h-3 rounded-full border ${layers[l.key] ? "bg-cyan-400 border-cyan-300" : "bg-transparent border-slate-600"}`}/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}