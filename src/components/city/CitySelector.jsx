import { useState } from "react";
import { MapPin, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CitySelector({ cities, selectedCity, onSelectCity, nation, user, onCityCreated }) {
  const [showCreate, setShowCreate] = useState(false);
  const [cityName, setCityName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!cityName.trim() || !nation || !user) return;
    setCreating(true);
    const newCity = await base44.entities.City.create({
      nation_id: nation.id,
      owner_email: user.email,
      city_name: cityName.trim(),
      population: 1000,
      population_capacity: 5000,
      happiness: 75,
      crime_rate: 20,
      pollution: 10,
      budget: 10000,
      tax_rate: 10,
      monthly_income: 1000,
      monthly_expenses: 800,
      education_level: 50,
      health_level: 60,
      safety_level: 70,
      zone_residential: 30,
      zone_commercial: 20,
      zone_industrial: 15,
      services_schools: 2,
      services_hospitals: 1,
      services_police: 2,
      services_fire: 1,
      specialization: "balanced",
      reputation: 50,
    });
    setCreating(false);
    setShowCreate(false);
    setCityName("");
    onCityCreated?.();
    onSelectCity(newCity);
  }

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
              Pop: {city.population?.toLocaleString()} / {city.population_capacity?.toLocaleString()}
            </div>
            <div className="text-[10px] opacity-70">
              Happiness: {city.happiness}% | Budget: {city.budget?.toLocaleString()} cr
            </div>
          </button>
        ))}
      </div>

      {showCreate ? (
        <div className="space-y-2">
          <input
            autoFocus
            value={cityName}
            onChange={e => setCityName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            placeholder="City name..."
            className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-400/50"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!cityName.trim() || creating}
              className="flex-1 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/25 disabled:opacity-40 transition-all"
            >
              {creating ? "Creating..." : "✓ Create"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setCityName(""); }}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
        >
          <Plus size={12} className="inline mr-1" /> New City
        </button>
      )}
    </div>
  );
}