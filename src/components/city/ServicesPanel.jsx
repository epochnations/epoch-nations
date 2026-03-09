import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function ServicesPanel({ city, onRefresh }) {
  const [services, setServices] = useState({
    schools: city.services_schools,
    hospitals: city.services_hospitals,
    police: city.services_police,
    fire: city.services_fire,
  });
  const [loading, setLoading] = useState(false);

  const serviceConfigs = [
    {
      key: "schools",
      label: "Schools",
      icon: "🏫",
      costPer: 150,
      description: "Increases education level, attracts educated workers",
      stat: "education_level",
    },
    {
      key: "hospitals",
      label: "Hospitals",
      icon: "🏥",
      costPer: 200,
      description: "Improves health, prevents disease outbreaks",
      stat: "health_level",
    },
    {
      key: "police",
      label: "Police Stations",
      icon: "👮",
      costPer: 120,
      description: "Reduces crime rate, improves safety",
      stat: "safety_level",
    },
    {
      key: "fire",
      label: "Fire Departments",
      icon: "🚒",
      costPer: 100,
      description: "Prevents fires, improves safety",
      stat: "safety_level",
    },
  ];

  const monthlyServiceCost = Object.entries(services).reduce((sum, [key, count]) => {
    const config = serviceConfigs.find(c => c.key === key);
    return sum + (config.costPer * count);
  }, 0);

  async function updateServices() {
    setLoading(true);
    await base44.entities.City.update(city.id, {
      services_schools: services.schools,
      services_hospitals: services.hospitals,
      services_police: services.police,
      services_fire: services.fire,
    });
    onRefresh?.();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {serviceConfigs.map((config) => (
          <div key={config.key} className="ep-card p-4 space-y-3 border border-white/10">
            <div>
              <div className="text-sm font-bold flex items-center gap-2 mb-1">
                {config.icon} {config.label}
              </div>
              <p className="text-xs text-slate-400">{config.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Buildings: {services[config.key]}</span>
                <span className="text-amber-400 font-bold">{config.costPer * services[config.key]} cr/month</span>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setServices(prev => ({ ...prev, [config.key]: Math.max(0, prev[config.key] - 1) }))}
                  className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30"
                >
                  -
                </button>

                <input
                  type="number"
                  min="0"
                  value={services[config.key]}
                  onChange={(e) => setServices(prev => ({ ...prev, [config.key]: Math.max(0, +e.target.value) }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white text-center"
                />

                <button
                  onClick={() => setServices(prev => ({ ...prev, [config.key]: prev[config.key] + 1 }))}
                  className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30"
                >
                  +
                </button>
              </div>

              <p className="text-xs text-slate-400">Impact: +{(services[config.key] * 8).toFixed(0)}% to {config.stat}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Summary */}
      <div className="ep-card p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-bold text-slate-300">Total Monthly Service Cost</span>
          <span className="text-lg font-black text-amber-400">{monthlyServiceCost} cr</span>
        </div>
        <p className="text-xs text-slate-500">This will be deducted from your city budget each month</p>
      </div>

      <button
        onClick={updateServices}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 disabled:opacity-50 transition-all"
      >
        {loading ? "Updating..." : "Update Services"}
      </button>
    </div>
  );
}