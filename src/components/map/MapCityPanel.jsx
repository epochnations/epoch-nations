/**
 * MapCityPanel – info panel shown when a city is clicked.
 */
import { X, Users, TrendingUp, Shield, Package } from "lucide-react";

// Deterministic city stats based on name seed
function cityStats(name) {
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    population: 100 + (seed % 20) * 50,
    tradeOutput: 20 + (seed % 15) * 10,
    defense: 10 + (seed % 20) * 5,
    resources: ["Wood", "Stone", "Gold", "Iron", "Oil", "Food"].filter((_, i) => (seed + i) % 3 !== 0),
  };
}

export default function MapCityPanel({ city, onClose }) {
  if (!city) return null;
  const stats = cityStats(city.name);

  return (
    <div className="absolute bottom-4 left-4 z-40 w-56 bg-black/85 border border-white/20 rounded-2xl p-4 backdrop-blur-xl animate-fadeIn">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-bold text-white">🏙️ {city.name}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">City Info</div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={14}/>
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <Users size={11} className="text-cyan-400 shrink-0"/>
          <span className="text-slate-400">Population</span>
          <span className="text-white font-mono ml-auto">{stats.population}k</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp size={11} className="text-green-400 shrink-0"/>
          <span className="text-slate-400">Trade Output</span>
          <span className="text-white font-mono ml-auto">{stats.tradeOutput}M</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Shield size={11} className="text-violet-400 shrink-0"/>
          <span className="text-slate-400">Defense Level</span>
          <span className="text-white font-mono ml-auto">{stats.defense}</span>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <Package size={11} className="text-amber-400 shrink-0 mt-0.5"/>
          <span className="text-slate-400">Resources</span>
          <div className="ml-auto flex flex-wrap gap-1 justify-end">
            {stats.resources.map(r => (
              <span key={r} className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] text-slate-300">{r}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}