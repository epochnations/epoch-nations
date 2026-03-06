import { useState, useMemo } from "react";
import { SEVERITY_META, CATEGORY_META } from "./NewsEventConfig";
import { X, ChevronDown, ChevronUp } from "lucide-react";

function CityBadge({ city, color }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
      style={{ backgroundColor: color + "22", color, border: `1px solid ${color}44` }}>
      {city}
    </span>
  );
}

function CityEventCard({ event, onClick }) {
  const sev = SEVERITY_META[event.severity] || SEVERITY_META.info;
  const cat = CATEGORY_META[event.category] || { emoji: "📰", label: event.category };
  const resolved = event.is_resolved;
  const cityColor = event.city_color || "#64748b";

  return (
    <button
      onClick={() => !resolved && onClick(event)}
      className={`w-full text-left rounded-xl border p-3 transition-all duration-200 group ${
        resolved
          ? "border-white/5 bg-white/3 opacity-50 cursor-default"
          : `${sev.border} ${sev.bg} hover:scale-[1.005] hover:shadow-lg cursor-pointer`
      }`}
    >
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${sev.dot} ${!resolved ? "animate-pulse" : ""}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{cat.emoji} {cat.label}</span>
            <span className={`text-[10px] font-bold uppercase ${sev.color}`}>{sev.label}</span>
            {event.city_name && <CityBadge city={event.city_name} color={cityColor} />}
            {event.is_disaster && <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-1.5 rounded animate-pulse">DISASTER</span>}
            {resolved && <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 rounded">RESOLVED</span>}
          </div>
          <div className={`text-sm font-bold leading-snug ${resolved ? "text-slate-500" : "text-white group-hover:text-cyan-300 transition-colors"}`}>
            {event.headline}
          </div>
          {!resolved && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{event.body?.slice(0, 100)}...</div>}
          {resolved && <div className="text-[10px] text-slate-600 mt-1">Decision: {event.chosen_option}</div>}
        </div>
        {!resolved && <div className="text-[10px] text-slate-600 shrink-0 group-hover:text-cyan-400 transition-colors">→</div>}
      </div>
    </button>
  );
}

export default function CityNewsStream({ cities, events, onSelect }) {
  const [collapsed, setCollapsed] = useState({});

  const cityEvents = useMemo(() => {
    const map = {};
    for (const city of cities) {
      map[city.tag] = events.filter(e => e.city_tag === city.tag);
    }
    return map;
  }, [cities, events]);

  const totalCityEvents = events.filter(e => e.city_tag).length;
  if (totalCityEvents === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-500 text-sm">
        <div className="text-2xl mb-2">🏙️</div>
        City news streams are warming up...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cities.map(city => {
        const cityEvs = cityEvents[city.tag] || [];
        if (cityEvs.length === 0) return null;
        const pending = cityEvs.filter(e => !e.is_resolved).length;
        const isCollapsed = collapsed[city.tag];

        return (
          <div key={city.tag} className="rounded-2xl border overflow-hidden" style={{ borderColor: city.color + "33" }}>
            {/* City Header */}
            <button
              onClick={() => setCollapsed(c => ({ ...c, [city.tag]: !c[city.tag] }))}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:brightness-110"
              style={{ background: city.color + "15" }}
            >
              <span className="text-lg">{city.emoji}</span>
              <div className="flex-1 text-left">
                <div className="font-black text-sm text-white">City of {city.name}</div>
                <div className="text-[10px] text-slate-500">{city.region} · {city.mayor} · <span style={{ color: city.color }}>{city.leaning}</span></div>
              </div>
              <div className="flex items-center gap-2">
                {pending > 0 && (
                  <span className="text-[10px] font-black text-white bg-red-500 rounded-full px-2 py-0.5 animate-pulse">
                    {pending} live
                  </span>
                )}
                <span className="text-[10px] text-slate-500">{cityEvs.length} stories</span>
                {isCollapsed ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
              </div>
            </button>

            {/* City Approval mini-strip */}
            {!isCollapsed && (
              <div className="flex gap-3 px-4 py-2 border-b text-[10px]" style={{ borderColor: city.color + "22", background: city.color + "08" }}>
                <div><span className="text-slate-500">Mayor Approval </span><span className="font-mono font-bold text-white">{city.mayorApproval}%</span></div>
                <div><span className="text-slate-500">Police Trust </span><span className="font-mono font-bold text-white">{city.policeApproval}%</span></div>
                <div><span className="text-slate-500">Business </span><span className="font-mono font-bold text-white">{city.businessConf}%</span></div>
                <div><span className="text-slate-500">Happiness </span><span className="font-mono font-bold text-white">{city.happiness}%</span></div>
              </div>
            )}

            {/* City Events */}
            {!isCollapsed && (
              <div className="p-3 space-y-2 bg-black/20">
                {cityEvs.slice(0, 6).map(ev => (
                  <CityEventCard key={ev.id || ev.headline} event={ev} onClick={onSelect} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}