/**
 * WorldTimeline — Historical World Timeline for Hall of Nations
 * Displays a chronological feed of WorldChronicle events with rich visuals.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ScrollText, Filter, RefreshCw, Flame, Sword, TrendingUp, Zap, CloudLightning, Globe, Star } from "lucide-react";
import { format } from "date-fns";

const EVENT_CONFIG = {
  war:       { icon: "⚔️", color: "#f87171", glow: "rgba(248,113,113,0.3)",   label: "War",         bgColor: "rgba(248,113,113,0.08)"  },
  alliance:  { icon: "🤝", color: "#34d399", glow: "rgba(52,211,153,0.3)",    label: "Alliance",    bgColor: "rgba(52,211,153,0.08)"   },
  peace:     { icon: "🕊️", color: "#60a5fa", glow: "rgba(96,165,250,0.3)",    label: "Peace",       bgColor: "rgba(96,165,250,0.08)"   },
  trade:     { icon: "📦", color: "#fbbf24", glow: "rgba(251,191,36,0.3)",    label: "Trade",       bgColor: "rgba(251,191,36,0.08)"   },
  disaster:  { icon: "🌋", color: "#f97316", glow: "rgba(249,115,22,0.3)",    label: "Disaster",    bgColor: "rgba(249,115,22,0.08)"   },
  revolution:{ icon: "🔥", color: "#ef4444", glow: "rgba(239,68,68,0.3)",     label: "Revolution",  bgColor: "rgba(239,68,68,0.08)"    },
  tech:      { icon: "🔬", color: "#a78bfa", glow: "rgba(167,139,250,0.3)",   label: "Technology",  bgColor: "rgba(167,139,250,0.08)"  },
  sanctions: { icon: "🚫", color: "#94a3b8", glow: "rgba(148,163,184,0.3)",   label: "Sanctions",   bgColor: "rgba(148,163,184,0.08)"  },
  narrative: { icon: "📜", color: "#22d3ee", glow: "rgba(34,211,238,0.3)",    label: "Chronicle",   bgColor: "rgba(34,211,238,0.08)"   },
  crisis:    { icon: "⚠️", color: "#fbbf24", glow: "rgba(251,191,36,0.3)",    label: "Crisis",      bgColor: "rgba(251,191,36,0.08)"   },
};

const IMPORTANCE_STYLE = {
  critical: { label: "CRITICAL", color: "#ef4444", ring: "rgba(239,68,68,0.4)" },
  high:     { label: "HIGH",     color: "#f97316", ring: "rgba(249,115,22,0.3)" },
  medium:   { label: "MED",      color: "#fbbf24", ring: "rgba(251,191,36,0.2)" },
  low:      { label: "LOW",      color: "#64748b", ring: "rgba(100,116,139,0.15)" },
};

const FILTER_TYPES = ["all", "war", "alliance", "peace", "trade", "tech", "revolution", "disaster", "crisis", "narrative"];

export default function WorldTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [importanceFilter, setImportanceFilter] = useState("all");
  const [searchActor, setSearchActor] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await base44.entities.WorldChronicle.list("-created_date", 500);
    setEvents(data);
    setLoading(false);
  }

  const filtered = events.filter(e => {
    if (filter !== "all" && e.event_type !== filter) return false;
    if (importanceFilter !== "all" && e.importance !== importanceFilter) return false;
    if (searchActor && !(e.actors || []).some(a => a.toLowerCase().includes(searchActor.toLowerCase())) &&
        !e.title?.toLowerCase().includes(searchActor.toLowerCase())) return false;
    return true;
  });

  // Group by approximate game-era (first word of era_tag or by month)
  const grouped = filtered.reduce((acc, ev) => {
    const era = ev.era_tag || "Unknown Era";
    const dateKey = ev.created_date ? format(new Date(ev.created_date), "MMMM yyyy") : "Unknown Date";
    const key = era !== "Unknown Era" ? era : dateKey;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped);

  // Stats
  const warCount = events.filter(e => e.event_type === "war").length;
  const allianceCount = events.filter(e => e.event_type === "alliance").length;
  const techCount = events.filter(e => e.event_type === "tech").length;
  const criticalCount = events.filter(e => e.importance === "critical").length;

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events",   value: events.length, color: "#22d3ee", icon: "📜" },
          { label: "Wars Recorded",  value: warCount,      color: "#f87171", icon: "⚔️" },
          { label: "Alliances",      value: allianceCount, color: "#34d399", icon: "🤝" },
          { label: "Critical Events",value: criticalCount, color: "#ef4444", icon: "⚠️" },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: `${s.color}0d`, border: `1px solid ${s.color}20` }}>
            <div className="flex items-center gap-2">
              <span>{s.icon}</span>
              <div>
                <div className="text-lg font-black ep-mono" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={searchActor} onChange={e => setSearchActor(e.target.value)}
          placeholder="Search by nation or event..."
          className="ep-input px-3 py-2 text-sm rounded-xl text-white placeholder-slate-600 flex-1"/>
        <select value={importanceFilter} onChange={e => setImportanceFilter(e.target.value)}
          className="ep-input px-3 py-2 text-sm rounded-xl text-white">
          <option value="all">All Importance</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={load} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all">
          <RefreshCw size={14}/>
        </button>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TYPES.map(t => {
          const cfg = EVENT_CONFIG[t];
          return (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={{
                background: filter === t ? (cfg ? `${cfg.color}22` : "rgba(34,211,238,0.15)") : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === t ? (cfg?.color || "#22d3ee") + "50" : "rgba(255,255,255,0.08)"}`,
                color: filter === t ? (cfg?.color || "#22d3ee") : "#64748b",
              }}>
              {cfg ? `${cfg.icon} ${cfg.label}` : "📋 All"}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm ep-mono">No historical events match your filters.</div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: "linear-gradient(180deg, rgba(34,211,238,0.3) 0%, rgba(139,92,246,0.3) 50%, rgba(251,191,36,0.2) 100%)" }}/>

          <div className="space-y-0">
            {groupKeys.map((groupKey, groupIdx) => (
              <div key={groupKey} className="relative">
                {/* Era/Date divider */}
                <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0"
                    style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "2px solid rgba(251,191,36,0.4)", boxShadow: "0 0 12px rgba(251,191,36,0.2)" }}>
                    <Globe size={14} className="text-amber-400"/>
                  </div>
                  <div className="flex-1 h-px" style={{ background: "rgba(251,191,36,0.15)" }}/>
                  <div className="text-[10px] font-black ep-mono tracking-widest text-amber-400/70 uppercase px-3 py-1 rounded-full"
                    style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    {groupKey} · {grouped[groupKey].length} events
                  </div>
                  <div className="flex-1 h-px" style={{ background: "rgba(251,191,36,0.15)" }}/>
                </div>

                {grouped[groupKey].map((ev, i) => {
                  const cfg = EVENT_CONFIG[ev.event_type] || EVENT_CONFIG.narrative;
                  const imp = IMPORTANCE_STYLE[ev.importance] || IMPORTANCE_STYLE.medium;
                  const isExpanded = expanded === ev.id;
                  const isCritical = ev.importance === "critical";

                  return (
                    <div key={ev.id} className="flex gap-4 mb-3 ml-1 relative">
                      {/* Timeline dot */}
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 mt-1"
                        style={{
                          background: cfg.bgColor,
                          border: `2px solid ${cfg.color}60`,
                          boxShadow: isCritical ? `0 0 16px ${cfg.glow}` : `0 0 6px ${cfg.glow}`,
                        }}>
                        <span style={{ fontSize: "13px" }}>{cfg.icon}</span>
                      </div>

                      {/* Event card */}
                      <div className="flex-1 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.005]"
                        style={{ background: cfg.bgColor, border: `1px solid ${cfg.color}30`, boxShadow: isCritical ? `0 2px 20px ${cfg.glow}` : "none" }}
                        onClick={() => setExpanded(isExpanded ? null : ev.id)}>
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {isCritical && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse"
                                    style={{ background: `${imp.color}25`, color: imp.color, border: `1px solid ${imp.color}50` }}>
                                    ⚠ {imp.label}
                                  </span>
                                )}
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full ep-mono"
                                  style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}35` }}>
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="text-sm font-bold text-white leading-tight">{ev.title}</div>
                              {!isExpanded && (
                                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{ev.summary}</div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {ev.created_date && (
                                <div className="text-[10px] text-slate-600 ep-mono">
                                  {format(new Date(ev.created_date), "MMM d")}
                                </div>
                              )}
                              {ev.era_tag && (
                                <div className="text-[9px] text-slate-600 ep-mono">{ev.era_tag}</div>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 space-y-2">
                              <div className="text-[12px] text-slate-300 leading-relaxed">{ev.summary}</div>
                              {(ev.actors || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  <span className="text-[10px] text-slate-500">Actors:</span>
                                  {ev.actors.map((a, ai) => (
                                    <span key={ai} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                      style={{ background: `${cfg.color}15`, color: cfg.color }}>
                                      {a}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* End of timeline */}
          <div className="flex items-center gap-3 mt-8 ml-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(251,191,36,0.1)", border: "2px solid rgba(251,191,36,0.3)" }}>
              <Star size={12} className="text-amber-400"/>
            </div>
            <div className="text-xs text-slate-600 ep-mono italic">— The chronicle continues to be written —</div>
          </div>
        </div>
      )}
    </div>
  );
}