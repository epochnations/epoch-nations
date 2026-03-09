import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { BookOpen, Globe, Sword, Handshake, Zap, TrendingDown, Cpu, AlertTriangle, Star, ArrowLeft } from "lucide-react";

const EVENT_CONFIG = {
  war:       { icon: Sword,       color: "#f87171", bg: "rgba(248,113,113,0.1)",  label: "WAR" },
  alliance:  { icon: Handshake,   color: "#4ade80", bg: "rgba(74,222,128,0.1)",   label: "ALLIANCE" },
  peace:     { icon: Globe,       color: "#22d3ee", bg: "rgba(34,211,238,0.1)",   label: "PEACE" },
  trade:     { icon: TrendingDown,color: "#fb923c", bg: "rgba(251,146,60,0.1)",   label: "TRADE" },
  disaster:  { icon: AlertTriangle,color:"#fbbf24", bg: "rgba(251,191,36,0.1)",   label: "DISASTER" },
  revolution:{ icon: Zap,         color: "#f87171", bg: "rgba(248,113,113,0.15)", label: "REVOLUTION" },
  tech:      { icon: Cpu,         color: "#818cf8", bg: "rgba(129,140,248,0.1)",  label: "TECHNOLOGY" },
  sanctions: { icon: AlertTriangle,color:"#fb923c", bg: "rgba(251,146,60,0.1)",   label: "SANCTIONS" },
  narrative: { icon: BookOpen,    color: "#94a3b8", bg: "rgba(148,163,184,0.08)", label: "WORLD EVENT" },
  crisis:    { icon: AlertTriangle,color:"#f87171", bg: "rgba(248,113,113,0.1)",  label: "CRISIS" },
};

const IMPORTANCE_BADGE = {
  critical: { color: "#f87171", label: "CRITICAL" },
  high:     { color: "#fb923c", label: "HIGH" },
  medium:   { color: "#fbbf24", label: "NOTABLE" },
  low:      { color: "#64748b", label: "MINOR" },
};

function ChronicleEntry({ entry }) {
  const cfg = EVENT_CONFIG[entry.event_type] || EVENT_CONFIG.narrative;
  const imp = IMPORTANCE_BADGE[entry.importance] || IMPORTANCE_BADGE.medium;
  const Icon = cfg.icon;
  const date = new Date(entry.created_date);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex gap-3 px-4 py-3 rounded-xl border transition-colors hover:bg-white/[0.02]"
      style={{ background: cfg.bg, borderColor: `${cfg.color}22` }}>
      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
        <Icon size={14} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <span className="text-[9px] font-black ep-mono tracking-widest px-1.5 py-0.5 rounded"
            style={{ color: cfg.color, background: `${cfg.color}15` }}>
            {cfg.label}
          </span>
          <span className="text-[9px] font-bold ep-mono px-1.5 py-0.5 rounded border"
            style={{ color: imp.color, borderColor: `${imp.color}40` }}>
            {imp.label}
          </span>
          {entry.era_tag && (
            <span className="text-[9px] text-slate-600 ep-mono">{entry.era_tag}</span>
          )}
          <span className="text-[9px] text-slate-700 ep-mono ml-auto shrink-0">{dateStr} · {timeStr}</span>
        </div>
        <div className="text-[12px] font-bold text-white mb-0.5">{entry.title}</div>
        <div className="text-[11px] text-slate-400 leading-relaxed">{entry.summary}</div>
        {(entry.actors || []).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {entry.actors.map((a, i) => (
              <span key={i} className="text-[9px] ep-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/10">
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const FILTERS = ["all", "war", "alliance", "trade", "disaster", "tech", "crisis", "revolution", "narrative"];

export default function WorldChronicle() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    loadChronicle();
    const unsub = base44.entities.WorldChronicle.subscribe(() => loadChronicle());
    return unsub;
  }, []);

  async function loadChronicle() {
    const data = await base44.entities.WorldChronicle.list("-created_date", 100);
    setEntries(data);
    setLoading(false);
  }

  const filtered = entries.filter(e => {
    if (filter !== "all" && e.event_type !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (e.title || "").toLowerCase().includes(s) ||
             (e.summary || "").toLowerCase().includes(s) ||
             (e.actors || []).some(a => a.toLowerCase().includes(s));
    }
    return true;
  });

  // Group by importance for hero section
  const critical = filtered.filter(e => e.importance === "critical" || e.importance === "high").slice(0, 3);

  return (
    <div className="min-h-screen bg-[#040810] text-white ep-grid-bg">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,0.07)" }}>
        <a href={createPageUrl("Dashboard")}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400">
          <ArrowLeft size={14} />
        </a>
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-violet-400" />
            <h1 className="text-lg font-black tracking-tight"
              style={{ background: "linear-gradient(90deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              WORLD CHRONICLE
            </h1>
          </div>
          <div className="text-[10px] text-slate-600 ep-mono">The living history of Epoch Nations</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="ep-live-dot" />
          <span className="text-[10px] text-green-400 ep-mono font-bold">LIVE</span>
          <span className="text-[10px] text-slate-600 ep-mono">{entries.length} events recorded</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nations, events, actors..."
            className="flex-1 ep-input px-4 py-2 text-sm text-white placeholder-slate-600 rounded-xl"
          />
          <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="shrink-0 text-[10px] font-bold ep-mono px-2.5 py-1.5 rounded-lg border transition-all capitalize"
                style={{
                  color: filter === f ? "#a78bfa" : "#475569",
                  background: filter === f ? "rgba(167,139,250,0.12)" : "transparent",
                  borderColor: filter === f ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.06)",
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Breaking news strip */}
        {critical.length > 0 && filter === "all" && !search && (
          <div className="rounded-2xl border p-4 space-y-2"
            style={{ background: "linear-gradient(135deg, rgba(248,113,113,0.06) 0%, rgba(251,146,60,0.04) 100%)", borderColor: "rgba(248,113,113,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Star size={12} className="text-amber-400" />
              <span className="text-[10px] font-black text-amber-400 ep-mono tracking-widest">MAJOR WORLD EVENTS</span>
            </div>
            <div className="space-y-2">
              {critical.map(e => <ChronicleEntry key={e.id} entry={e} />)}
            </div>
          </div>
        )}

        {/* Full timeline */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-600 ep-mono font-bold px-1">
            {filter === "all" ? "FULL TIMELINE" : `${filter.toUpperCase()} EVENTS`}
            {filtered.length > 0 && <span className="ml-2 text-slate-700">— {filtered.length} entries</span>}
          </div>
          {loading && (
            <div className="text-center py-12 text-slate-600 text-sm ep-mono">Loading world history...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <BookOpen size={32} className="text-slate-700 mx-auto" />
              <div className="text-slate-600 text-sm">No chronicle entries yet.</div>
              <div className="text-slate-700 text-xs ep-mono">History is being written. Check back soon.</div>
            </div>
          )}
          {filtered.map(e => <ChronicleEntry key={e.id} entry={e} />)}
        </div>
      </div>
    </div>
  );
}