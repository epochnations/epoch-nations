import { Grid3X3, Home, Store, Factory, Trees, X } from "lucide-react";

const ZONES = [
  { id: "residential", label: "Residential", icon: Home, color: "#4ade80" },
  { id: "commercial", label: "Commercial", icon: Store, color: "#fbbf24" },
  { id: "industrial", label: "Industrial", icon: Factory, color: "#ef4444" },
  { id: "park", label: Park, icon: Trees, color: "#10b981" },
];

export default function ZoningTool({ city, zoningMode, onZoningModeChange }) {
  return (
    <div className="ep-card border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Grid3X3 size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zoning Tool</span>
        </div>
        {zoningMode && (
          <button
            onClick={() => onZoningModeChange(null)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ZONES.map(zone => {
          const Icon = zone.icon;
          const isActive = zoningMode === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => onZoningModeChange(isActive ? null : zone.id)}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? "bg-cyan-500/30 border border-cyan-400"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
              style={isActive ? { color: zone.color } : {}}
            >
              <Icon size={16} />
              <span className="text-xs mt-1">{zone.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}