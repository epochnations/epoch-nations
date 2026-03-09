import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const TYPE_CONFIG = {
  war:       { label: "WAR", color: "#f87171", bg: "rgba(248,113,113,0.08)" },
  alliance:  { label: "ALLIANCE", color: "#4ade80", bg: "rgba(74,222,128,0.06)" },
  peace:     { label: "PEACE", color: "#22d3ee", bg: "rgba(34,211,238,0.06)" },
  trade:     { label: "TRADE", color: "#fb923c", bg: "rgba(251,146,60,0.06)" },
  disaster:  { label: "DISASTER", color: "#fbbf24", bg: "rgba(251,191,36,0.06)" },
  revolution:{ label: "REVOLUTION", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  tech:      { label: "TECHNOLOGY", color: "#818cf8", bg: "rgba(129,140,248,0.06)" },
  crisis:    { label: "CRISIS", color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
  narrative: { label: "WORLD EVENT", color: "#94a3b8", bg: "rgba(148,163,184,0.05)" },
  sanctions: { label: "SANCTIONS", color: "#fb923c", bg: "rgba(251,146,60,0.06)" },
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function GlobalNewsFeed() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    load();
    const unsub = base44.entities.WorldChronicle.subscribe(() => load());
    return unsub;
  }, []);

  async function load() {
    try {
      const data = await base44.entities.WorldChronicle.list("-created_date", 30);
      setItems(data);
    } catch {}
  }

  const FILTERS = ["all", "war", "crisis", "trade", "alliance", "tech", "disaster"];

  const filtered = filter === "all" ? items : items.filter(i => i.event_type === filter);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/08"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(4,8,16,0.95) 100%)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/08 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black text-white tracking-widest">WORLD NEWS DESK</span>
        </div>
        <span className="text-[10px] text-slate-600 ep-mono">{items.length} headlines</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-white/05" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map(f => {
          const cfg = TYPE_CONFIG[f];
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="shrink-0 text-[9px] font-bold ep-mono px-2 py-1 rounded-md border transition-all capitalize"
              style={{
                color: filter === f ? (cfg?.color || "#22d3ee") : "#475569",
                background: filter === f ? `${cfg?.color || "#22d3ee"}15` : "transparent",
                borderColor: filter === f ? `${cfg?.color || "#22d3ee"}40` : "rgba(255,255,255,0.05)",
              }}>
              {f}
            </button>
          );
        })}
      </div>

      {/* Breaking headline */}
      {filtered[0] && (
        <div className="px-4 py-4 border-b border-white/05 cursor-pointer"
          style={{ background: TYPE_CONFIG[filtered[0].event_type]?.bg || "transparent" }}
          onClick={() => setExpanded(expanded === filtered[0].id ? null : filtered[0].id)}>
          <div className="flex items-start gap-2 mb-1">
            <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded"
              style={{
                color: TYPE_CONFIG[filtered[0].event_type]?.color || "#94a3b8",
                background: `${TYPE_CONFIG[filtered[0].event_type]?.color || "#94a3b8"}20`,
              }}>
              {filtered[0].importance === "critical" ? "🔴 BREAKING" : TYPE_CONFIG[filtered[0].event_type]?.label || "EVENT"}
            </span>
            <span className="text-[9px] text-slate-600 ep-mono ml-auto">{timeAgo(filtered[0].created_date)}</span>
          </div>
          <div className="font-bold text-white text-[13px] leading-snug mb-1">{filtered[0].title}</div>
          {expanded === filtered[0].id && (
            <div className="text-[11px] text-slate-400 leading-relaxed mt-2 ep-slide-in">{filtered[0].summary}</div>
          )}
          {(filtered[0].actors || []).length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {filtered[0].actors.map((a, i) => (
                <span key={i} className="text-[9px] ep-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{a}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feed list */}
      <div className="divide-y divide-white/05 max-h-80 overflow-y-auto">
        {filtered.slice(1).map(item => {
          const cfg = TYPE_CONFIG[item.event_type] || TYPE_CONFIG.narrative;
          return (
            <div key={item.id}
              className="px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-[8px] font-black px-1 py-0.5 rounded ep-mono"
                  style={{ color: cfg.color, background: `${cfg.color}15` }}>
                  {cfg.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-200 leading-snug">{item.title}</div>
                  {expanded === item.id && (
                    <div className="text-[10px] text-slate-500 mt-1 leading-relaxed ep-slide-in">{item.summary}</div>
                  )}
                </div>
                <span className="shrink-0 text-[9px] text-slate-700 ep-mono">{timeAgo(item.created_date)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!filtered.length && (
        <div className="text-center py-10 text-slate-600 text-sm ep-mono">No headlines yet — the world is quiet.</div>
      )}
    </div>
  );
}