import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, X } from "lucide-react";

export default function CityEventPanel({ event, city, onClose, onRefresh }) {
  const [resolving, setResolving] = useState(false);

  async function resolveEvent(option) {
    setResolving(true);

    const effects = option === "a"
      ? parseEffect(event.impact)
      : { happiness: -20, population: -500 };

    const updates = {};
    if (effects.happiness) updates.happiness = Math.max(0, Math.min(100, (city.happiness || 75) + effects.happiness));
    if (effects.population) updates.population = Math.max(1000, (city.population || 5000) + effects.population);
    if (effects.crime_rate) updates.crime_rate = Math.max(0, Math.min(100, (city.crime_rate || 20) + effects.crime_rate));
    if (effects.pollution) updates.pollution = Math.max(0, Math.min(100, (city.pollution || 10) + effects.pollution));

    await base44.entities.City.update(city.id, updates);
    await base44.entities.CityEvent.update(event.id, { is_resolved: true });

    setResolving(false);
    onRefresh?.();
    onClose();
  }

  function parseEffect(effectObj) {
    return effectObj || {};
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0d1424]/95 border border-red-500/30 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-xs font-bold text-red-400 tracking-widest uppercase">{event.severity} Event</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
            <p className="text-slate-400 text-sm">{event.description}</p>
          </div>

          <div className="bg-white/5 rounded p-3 text-xs text-slate-300">
            {Object.entries(event.impact).map(([key, val]) => (
              <div key={key} className={val > 0 ? "text-red-400" : "text-green-400"}>
                {key}: {val > 0 ? "+" : ""}{val}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => resolveEvent("a")}
              disabled={resolving}
              className="px-4 py-2 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold hover:bg-green-500/30 transition-all disabled:opacity-50"
            >
              Mitigate Impact
            </button>
            <button
              onClick={() => resolveEvent("b")}
              disabled={resolving}
              className="px-4 py-2 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              Accept Losses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}