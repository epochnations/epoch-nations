import { MapPin, Plus } from "lucide-react";

export default function CitySelector({ cities, selectedCity, onSelectCity }) {
  return (
    <div className="ep-card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={14} className="text-cyan-400" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Your Cities</h3>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {cities.map(city => (
          <button
            key={city.id}
            onClick={() => onSelectCity(city)}
            className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
              selectedCity?.id === city.id
                ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
            }`}
          >
            <div className="font-bold mb-1">{city.city_name}</div>
            <div className="text-[10px] opacity-70">
              Pop: {city.population.toLocaleString()} / {city.population_capacity.toLocaleString()}
            </div>
            <div className="text-[10px] opacity-70">
              Happiness: {city.happiness}% | Budget: {city.budget.toLocaleString()} cr
            </div>
          </button>
        ))}
      </div>

      <button className="w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all">
        <Plus size={12} className="inline mr-1" /> New City
      </button>
    </div>
  );
}