import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function ZoningPanel({ city, onRefresh }) {
  const [zones, setZones] = useState({
    residential: city.zone_residential,
    commercial: city.zone_commercial,
    industrial: city.zone_industrial,
  });
  const [loading, setLoading] = useState(false);

  const totalZone = zones.residential + zones.commercial + zones.industrial;
  const maxZone = 100;

  async function saveZoning() {
    setLoading(true);
    await base44.entities.City.update(city.id, {
      zone_residential: zones.residential,
      zone_commercial: zones.commercial,
      zone_industrial: zones.industrial,
    });
    onRefresh?.();
    setLoading(false);
  }

  const zoneConfigs = [
    {
      key: "residential",
      label: "Residential",
      description: "Houses, apartments, living spaces",
      icon: "🏠",
      color: "green",
      impact: "Increases population capacity",
    },
    {
      key: "commercial",
      label: "Commercial",
      description: "Shops, offices, businesses",
      icon: "🏢",
      color: "blue",
      impact: "Increases tax revenue",
    },
    {
      key: "industrial",
      label: "Industrial",
      description: "Factories, plants, production",
      icon: "🏭",
      color: "amber",
      impact: "Increases pollution",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Zoning Overview */}
      <div className="ep-card p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">Zone Distribution</h3>

        {zoneConfigs.map((config) => {
          const colorMap = {
            green: "border-green-500/30 bg-green-500/10 text-green-400",
            blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
            amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
          };

          return (
            <div key={config.key} className={`p-4 rounded-lg border ${colorMap[config.color]} space-y-2`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    {config.icon} {config.label}
                  </div>
                  <p className="text-xs opacity-70">{config.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black">{zones[config.key]}%</div>
                  <p className="text-xs opacity-70">{config.impact}</p>
                </div>
              </div>

              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    config.color === "green" ? "bg-green-500/60" : config.color === "blue" ? "bg-blue-500/60" : "bg-amber-500/60"
                  }`}
                  style={{ width: `${zones[config.key]}%` }}
                />
              </div>

              <input
                type="range"
                min="0"
                max={maxZone}
                value={zones[config.key]}
                onChange={(e) => {
                  const newVal = +e.target.value;
                  setZones(prev => ({ ...prev, [config.key]: newVal }));
                }}
                className="w-full"
              />
            </div>
          );
        })}
      </div>

      {totalZone > maxZone && (
        <div className="ep-card border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          ⚠️ Total zoning exceeds 100%. Please adjust zones.
        </div>
      )}

      <button
        onClick={saveZoning}
        disabled={loading || totalZone > maxZone}
        className="w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 disabled:opacity-50 transition-all"
      >
        {loading ? "Saving..." : "Save Zoning"}
      </button>

      {/* Impact Preview */}
      <div className="ep-card p-4 space-y-2 text-xs text-slate-400">
        <p>📊 Current zoning composition:</p>
        <p className="text-green-400">🏠 Residential: {zones.residential}% - Pop capacity boost</p>
        <p className="text-blue-400">🏢 Commercial: {zones.commercial}% - Revenue boost +{(zones.commercial * 0.5).toFixed(0)} cr/month</p>
        <p className="text-amber-400">🏭 Industrial: {zones.industrial}% - Pollution +{(zones.industrial * 0.3).toFixed(0)}%</p>
      </div>
    </div>
  );
}