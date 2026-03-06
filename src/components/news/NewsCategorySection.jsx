import { CATEGORY_META } from "./NewsEventConfig";
import NewsArticleCard from "./NewsArticleCard";

export default function NewsCategorySection({ category, events, onSelect }) {
  const meta = CATEGORY_META[category] || { label: category, emoji: "📰" };
  if (!events || events.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 pb-1 border-b border-white/10">
        <span className="text-base">{meta.emoji}</span>
        <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{meta.label}</span>
        <span className="text-[10px] text-slate-600 bg-white/5 rounded-full px-2 py-0.5">{events.length}</span>
      </div>
      <div className="space-y-1.5">
        {events.map(ev => (
          <NewsArticleCard key={ev.id || ev.headline} event={ev} onClick={onSelect} />
        ))}
      </div>
    </div>
  );
}