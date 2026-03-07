import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getEngagementTier } from "./CityConfig";

function EngagementBar({ value, color }) {
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function CitizenEngagementWidget({ cities }) {
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("engagement"); // engagement | population | happiness

  const sorted = useMemo(() => {
    return [...cities].sort((a, b) => {
      if (sortBy === "engagement") return b.engagementScore - a.engagementScore;
      if (sortBy === "population") return b.population - a.population;
      if (sortBy === "happiness")  return b.happiness - a.happiness;
      return 0;
    });
  }, [cities, sortBy]);

  const avgEngagement = Math.round(cities.reduce((s, c) => s + c.engagementScore, 0) / Math.max(cities.length, 1));
  const tier = getEngagementTier(avgEngagement);
  const topCity = sorted[0];
  const bottomCity = sorted[sorted.length - 1];

  const displayCities = expanded ? sorted : sorted.slice(0, 6);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">👥</span>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Citizen Engagement</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold" style={{ color: tier.color }}>{tier.icon} {avgEngagement}%</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tier.color + "22", color: tier.color }}>{tier.label}</span>
          {expanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
        </div>
      </button>

      {/* Summary strip */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-center border-b border-white/5">
        <div>
          <div className="text-[10px] text-slate-500">Cities</div>
          <div className="text-sm font-bold text-white">{cities.length}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">Most Engaged</div>
          <div className="text-[10px] font-bold text-green-400 truncate">{topCity?.emoji} {topCity?.name}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">Needs Attention</div>
          <div className="text-[10px] font-bold text-red-400 truncate">{bottomCity?.emoji} {bottomCity?.name}</div>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1 px-3 pt-2 pb-1">
        {[["engagement","🏛 Engagement"],["population","👥 Population"],["happiness","😊 Happiness"]].map(([k, label]) => (
          <button key={k} onClick={() => setSortBy(k)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${sortBy === k ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* City list */}
      <div className="px-3 pb-3 space-y-2">
        {displayCities.map(city => {
          const t = getEngagementTier(city.engagementScore);
          return (
            <div key={city.tag} className="rounded-xl px-3 py-2 border transition-all" style={{ borderColor: city.color + "22", backgroundColor: city.color + "08" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{city.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white">{city.name}</span>
                    <span className="text-[9px]" style={{ color: city.color }}>{city.region}</span>
                  </div>
                  <div className="text-[9px] text-slate-500">{city.mayor} · {city.leaning}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold" style={{ color: t.color }}>{city.engagementScore}%</div>
                  <div className="text-[9px]" style={{ color: t.color }}>{t.label}</div>
                </div>
              </div>

              {/* Engagement bar */}
              <EngagementBar value={city.engagementScore} color={t.color} />

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-1 mt-2">
                {[
                  { label: "Voter", val: city.voterTurnout },
                  { label: "Community", val: city.communityScore },
                  { label: "Volunteer", val: city.volunteerRate },
                  { label: "Petitions", val: null, raw: city.petitionsMonth + "/mo" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-[8px] text-slate-600 uppercase">{s.label}</div>
                    <div className="text-[9px] font-mono font-bold text-slate-300">{s.raw || `${s.val}%`}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {cities.length > 6 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full pb-3 text-center text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? "▲ Show less" : `▼ Show all ${cities.length} cities`}
        </button>
      )}
    </div>
  );
}