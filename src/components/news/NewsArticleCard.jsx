import { CATEGORY_META, SEVERITY_META } from "./NewsEventConfig";

export default function NewsArticleCard({ event, onClick }) {
  const cat = CATEGORY_META[event.category] || { label: event.category, emoji: "📰" };
  const sev = SEVERITY_META[event.severity] || SEVERITY_META.info;
  const resolved = event.is_resolved && event.chosen_option;

  return (
    <button
      onClick={() => !resolved && onClick(event)}
      className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200 group ${
        resolved
          ? "border-white/5 bg-white/3 opacity-60 cursor-default"
          : `${sev.border} ${sev.bg} hover:scale-[1.01] hover:shadow-lg cursor-pointer`
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Severity dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${sev.dot} ${!resolved ? "animate-pulse" : ""}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cat.emoji} {cat.label}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${sev.color}`}>{sev.label}</span>
            {event.is_disaster && <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-1.5 rounded">DISASTER</span>}
            {resolved && <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-1.5 rounded">RESOLVED</span>}
          </div>
          <div className={`text-sm font-bold leading-snug ${resolved ? "text-slate-500" : "text-white group-hover:text-cyan-300 transition-colors"}`}>
            {event.headline}
          </div>
          {resolved && (
            <div className="text-[10px] text-slate-600 mt-1">Decision made: {event.chosen_option}</div>
          )}
          {!resolved && (
            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{event.body?.slice(0, 100)}...</div>
          )}
        </div>
        {!resolved && (
          <div className="text-[10px] text-slate-600 shrink-0 group-hover:text-cyan-400 transition-colors">Read →</div>
        )}
      </div>
    </button>
  );
}