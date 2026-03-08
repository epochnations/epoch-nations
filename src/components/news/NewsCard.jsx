import { formatDistanceToNow } from "date-fns";

const CATEGORY_STYLE = {
  war: { color: "text-red-400", border: "border-red-500/40", bg: "bg-red-500/10", label: "WAR REPORT", dot: "bg-red-400" },
  economy: { color: "text-green-400", border: "border-green-500/40", bg: "bg-green-500/10", label: "MARKETS", dot: "bg-green-400" },
  tech: { color: "text-blue-400", border: "border-blue-500/40", bg: "bg-blue-500/10", label: "TECHNOLOGY", dot: "bg-blue-400" },
  policy: { color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10", label: "POLICY", dot: "bg-amber-400" },
  propaganda: { color: "text-violet-400", border: "border-violet-500/40", bg: "bg-violet-500/10", label: "OP-ED", dot: "bg-violet-400" },
  milestone: { color: "text-cyan-400", border: "border-cyan-500/40", bg: "bg-cyan-500/10", label: "MILESTONE", dot: "bg-cyan-400" },
};

const TIER_STYLE = {
  gold: "border-yellow-400/50 bg-gradient-to-br from-yellow-500/10 to-amber-900/20",
  breaking: "border-red-500/60 bg-gradient-to-br from-red-500/10 to-rose-900/20",
  standard: "border-white/10 bg-white/3",
};

export default function NewsCard({ article, featured }) {
  const style = CATEGORY_STYLE[article.category] || CATEGORY_STYLE.economy;
  const tierStyle = TIER_STYLE[article.tier] || TIER_STYLE.standard;
  const timeAgo = article.created_date
    ? formatDistanceToNow(new Date(article.created_date), { addSuffix: true })
    : "";

  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-sm transition-all hover:scale-[1.01] cursor-pointer hover:brightness-110 ${tierStyle} ${featured ? "p-6 md:p-8" : ""}`}>
      {/* Top row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          {(article.tier === "breaking" || article.tier === "gold") && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black ${
              article.tier === "gold" ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40" : "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
            }`}>
              {article.tier === "gold" ? "★ GOLD" : "● BREAKING"}
            </div>
          )}
          <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.color} border ${style.border}`}>
            {style.label}
          </div>
          {article.is_propaganda && (
            <div className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
              SPONSORED
            </div>
          )}
        </div>
        <span className="text-slate-600 text-xs shrink-0">{timeAgo}</span>
      </div>

      {/* Headline */}
      <h2 className={`font-black leading-tight text-white mb-2 ${featured ? "text-2xl md:text-3xl" : "text-base"}`}>
        {article.headline}
      </h2>

      {/* Body */}
      {article.body && (
        <p className={`text-slate-400 leading-relaxed ${featured ? "text-sm" : "text-xs line-clamp-3"}`}>
          {article.body}
        </p>
      )}

      {/* Nation tag */}
      {article.nation_name && (
        <div className="mt-3 flex items-center gap-2">
          {article.nation_flag && <span className="text-base">{article.nation_flag}</span>}
          <span className="text-xs text-slate-500">{article.nation_name}</span>
          {article.nation_color && (
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: article.nation_color }} />
          )}
        </div>
      )}
    </div>
  );
}