import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Shield, Flame, BookOpen, Heart, Zap, Droplet } from "lucide-react";

const SERVICE_CONFIG = {
  police: { icon: Shield, color: "text-blue-400", cost: 500 },
  fire: { icon: Flame, color: "text-red-400", cost: 600 },
  education: { icon: BookOpen, color: "text-green-400", cost: 700 },
  health: { icon: Heart, color: "text-pink-400", cost: 800 },
  power: { icon: Zap, color: "text-yellow-400", cost: 1000 },
  water: { icon: Droplet, color: "text-cyan-400", cost: 900 },
};

export default function CityServicesPanel({ city, onRefresh }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, [city?.id]);

  async function loadServices() {
    const svc = await base44.entities.CityService.filter({ city_id: city.id });
    setServices(svc);
  }

  async function buildService(serviceType) {
    if ((city?.city_budget || 0) < SERVICE_CONFIG[serviceType].cost) {
      alert("Insufficient budget!");
      return;
    }

    setLoading(true);

    const newService = {
      city_id: city.id,
      city_name: city.city_name,
      nation_id: city.nation_id,
      owner_email: city.owner_email,
      service_type: serviceType,
      building_type: `${serviceType} Station`,
      grid_x: Math.floor(Math.random() * 16),
      grid_y: Math.floor(Math.random() * 16),
      monthly_cost: SERVICE_CONFIG[serviceType].cost,
    };

    await base44.entities.CityService.create(newService);
    await base44.entities.City.update(city.id, {
      city_budget: Math.max(0, (city.city_budget || 0) - SERVICE_CONFIG[serviceType].cost),
      monthly_expenses: (city.monthly_expenses || 0) + SERVICE_CONFIG[serviceType].cost,
    });

    setLoading(false);
    onRefresh?.();
    await loadServices();
  }

  return (
    <div className="ep-card border border-white/10 rounded-xl p-4 space-y-3">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Services</div>
      
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {services.map(svc => {
          const cfg = SERVICE_CONFIG[svc.service_type];
          const Icon = cfg.icon;
          return (
            <div key={svc.id} className="flex items-center justify-between bg-white/5 rounded p-2 text-xs">
              <div className="flex items-center gap-1">
                <Icon size={12} className={cfg.color} />
                <span className="text-slate-300">{svc.service_type}</span>
              </div>
              <button
                onClick={() => {
                  base44.entities.CityService.delete(svc.id);
                  onRefresh?.();
                }}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(SERVICE_CONFIG).map(([type, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={type}
                onClick={() => buildService(type)}
                disabled={loading || (city?.city_budget || 0) < cfg.cost}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-all"
                title={`Cost: ${cfg.cost} cr/mo`}
              >
                <Plus size={10} />
                <Icon size={11} className={cfg.color} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}