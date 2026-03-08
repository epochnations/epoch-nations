import { X, Clock, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CATEGORY_STYLE = {
  war:        { color: "text-red-400",    border: "border-red-500/40",    bg: "bg-red-500/10",    label: "WAR REPORT",  icon: "⚔️" },
  economy:    { color: "text-green-400",  border: "border-green-500/40",  bg: "bg-green-500/10",  label: "MARKETS",     icon: "📈" },
  tech:       { color: "text-blue-400",   border: "border-blue-500/40",   bg: "bg-blue-500/10",   label: "TECHNOLOGY",  icon: "🔬" },
  policy:     { color: "text-amber-400",  border: "border-amber-500/40",  bg: "bg-amber-500/10",  label: "POLICY",      icon: "🏛️" },
  propaganda: { color: "text-violet-400", border: "border-violet-500/40", bg: "bg-violet-500/10", label: "OP-ED",       icon: "📢" },
  milestone:  { color: "text-cyan-400",   border: "border-cyan-500/40",   bg: "bg-cyan-500/10",   label: "MILESTONE",   icon: "🌟" },
};

export default function GlobalArticleModal({ article, onClose }) {
  if (!article) return null;
  const style = CATEGORY_STYLE[article.category] || CATEGORY_STYLE.economy;
  const timeAgo = article.created_date
    ? formatDistanceToNow(new Date(article.created_date), { addSuffix: true })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border"
        style={{
          background: "linear-gradient(160deg, rgba(10,14,28,0.98) 0%, rgba(4,8,16,0.99) 100%)",
          borderColor: article.tier === "gold" ? "rgba(234,179,8,0.4)" : article.tier === "breaking" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
        >
          <X size={14} className="text-slate-400" />
        </button>

        {/* Hero image */}
        {article.image_url && (
          <div className="w-full h-52 overflow-hidden rounded-t-2xl">
            <img src={article.image_url} alt={article.headline} className="w-full h-full object-cover" />
            <div className="absolute top-0 left-0 right-0 h-52 bg-gradient-to-b from-transparent to-[#040810] rounded-t-2xl" style={{ position: "relative", marginTop: -208 }} />
          </div>
        )}

        <div className="p-6 pt-5">
          {/* Tier + Category badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {(article.tier === "breaking" || article.tier === "gold") && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                article.tier === "gold"
                  ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
                  : "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
              }`}>
                {article.tier === "gold" ? "★ GOLD" : "● BREAKING"}
              </div>
            )}
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.color} border ${style.border}`}>
              {style.icon} {style.label}
            </div>
            {article.is_propaganda && (
              <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                SPONSORED
              </div>
            )}
            <span className="ml-auto flex items-center gap-1 text-xs text-slate-600">
              <Clock size={11} /> {timeAgo}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl md:text-3xl font-black leading-tight text-white mb-4">
            {article.headline}
          </h1>

          {/* Divider */}
          <div className="h-px bg-white/10 mb-4" />

          {/* Body */}
          {article.body ? (
            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
              {article.body}
            </p>
          ) : (
            <p className="text-slate-500 italic text-sm">No further details available.</p>
          )}

          {/* Nation footer */}
          {article.nation_name && (
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
              <Globe size={12} className="text-slate-500" />
              {article.nation_flag && <span className="text-base">{article.nation_flag}</span>}
              <span className="text-xs text-slate-400 font-medium">{article.nation_name}</span>
              {article.nation_color && (
                <div className="w-2 h-2 rounded-full ml-1" style={{ backgroundColor: article.nation_color }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}