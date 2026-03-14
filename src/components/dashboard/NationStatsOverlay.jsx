/**
 * NationStatsOverlay — Civilization-style national stats card.
 * Shows score breakdown, era ranking, and historical rating.
 * Displayed as a compact overlay panel on the Dashboard.
 */
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Civ-style scoring weights
const SCORE_WEIGHTS = {
  population:    { label: "Population",    weight: 1.0,  max: 500,   format: v => v.toLocaleString() },
  gdp:           { label: "Economy",       weight: 1.5,  max: 5000,  format: v => `${v.toLocaleString()} cr` },
  tech_level:    { label: "Technology",    weight: 2.0,  max: 12,    format: v => `T${v}` },
  unit_power:    { label: "Military",      weight: 1.2,  max: 200,   format: v => v },
  stability:     { label: "Stability",     weight: 1.0,  max: 100,   format: v => `${Math.min(100, Math.round(v))}%` },
  national_wealth:{ label: "Wealth",       weight: 0.8,  max: 50000, format: v => `${Math.floor(v / 1000)}k` },
  allies:        { label: "Alliances",     weight: 0.5,  max: 8,     format: v => v },
};

const ERA_RATINGS = [
  { min: 0,   max: 100,  label: "Struggling",   color: "#ef4444", desc: "Barely surviving" },
  { min: 100, max: 250,  label: "Developing",   color: "#f97316", desc: "Early growth" },
  { min: 250, max: 500,  label: "Emerging",     color: "#f59e0b", desc: "Gaining momentum" },
  { min: 500, max: 800,  label: "Established",  color: "#84cc16", desc: "Solid foundation" },
  { min: 800, max: 1200, label: "Prosperous",   color: "#22d3ee", desc: "Regional power" },
  { min: 1200,max: 1800, label: "Dominant",     color: "#818cf8", desc: "Major civilization" },
  { min: 1800,max: 9999, label: "Superpower",   color: "#f0abfc", desc: "World hegemon" },
];

function calcScore(nation) {
  let total = 0;
  const breakdown = {};
  for (const [key, def] of Object.entries(SCORE_WEIGHTS)) {
    let raw = key === "allies" ? (nation.allies || []).length : (nation[key] || 0);
    const pct = Math.min(1.0, raw / def.max);
    const pts = Math.round(pct * 100 * def.weight);
    total += pts;
    breakdown[key] = { pts, pct, raw, ...def };
  }
  return { total, breakdown };
}

function getEraRating(score) {
  return ERA_RATINGS.find(r => score >= r.min && score < r.max) || ERA_RATINGS[ERA_RATINGS.length - 1];
}

function ScoreBar({ pct, color }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.round(pct * 100)}%`, background: color }} />
    </div>
  );
}

export default function NationStatsOverlay({ nation, allNations }) {
  const { total, breakdown } = useMemo(() => calcScore(nation), [nation]);
  const rating = getEraRating(total);

  // Rank among all nations
  const rank = useMemo(() => {
    if (!allNations?.length) return null;
    const sorted = [...allNations].sort((a, b) => calcScore(b).total - calcScore(a).total);
    const idx = sorted.findIndex(n => n.id === nation.id);
    return idx >= 0 ? idx + 1 : null;
  }, [allNations, nation]);

  const color = nation.flag_color || "#22d3ee";

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(4,8,16,0.97) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between"
        style={{ background: `${color}0a` }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{nation.flag_emoji || "🏴"}</span>
          <div>
            <div className="text-xs font-black text-white ep-mono">{nation.name}</div>
            <div className="text-[10px]" style={{ color: rating.color }}>{rating.label} · {rating.desc}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black ep-mono" style={{ color }}>{total}</div>
          <div className="text-[9px] text-slate-500 ep-mono">CIV SCORE</div>
          {rank && <div className="text-[9px] text-amber-400 font-bold">#{rank} WORLD</div>}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="px-4 py-3 space-y-2">
        {Object.entries(breakdown).map(([key, { label, pts, pct, raw, format }]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="text-[10px] text-slate-500 w-20 shrink-0">{label}</div>
            <ScoreBar pct={pct} color={pct > 0.7 ? "#4ade80" : pct > 0.4 ? "#f59e0b" : "#ef4444"} />
            <div className="text-[10px] font-mono text-slate-400 w-12 text-right shrink-0">
              {format(raw)}
            </div>
            <div className="text-[9px] font-bold ep-mono w-8 text-right shrink-0"
              style={{ color: pts > 50 ? "#4ade80" : pts > 25 ? "#f59e0b" : "#94a3b8" }}>
              +{pts}
            </div>
          </div>
        ))}
      </div>

      {/* Era progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-[9px] text-slate-600 mb-1">
          <span>{rating.label}</span>
          <span>{ERA_RATINGS[Math.min(ERA_RATINGS.indexOf(rating) + 1, ERA_RATINGS.length - 1)]?.label || "Max"}</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.round(((total - rating.min) / Math.max(rating.max - rating.min, 1)) * 100)}%`,
              background: `linear-gradient(90deg, ${rating.color}, ${rating.color}99)`,
            }} />
        </div>
      </div>
    </div>
  );
}