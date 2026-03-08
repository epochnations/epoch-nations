import { useState } from "react";
import { X, User, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CATEGORY_META, SEVERITY_META, CITIZEN_QUOTES } from "./NewsEventConfig";
import { base44 } from "@/api/base44Client";

function StatDelta({ label, value }) {
  if (!value || value === 0) return null;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const color = up ? "text-emerald-400" : "text-red-400";
  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`}>
      <Icon size={10} />
      <span>{label}: {up ? "+" : ""}{value}</span>
    </div>
  );
}

export default function NewsArticleModal({ event, nation, onClose, onResolved }) {
  const [choosing, setChoosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const cat = CATEGORY_META[event.category] || { label: event.category, emoji: "📰" };
  const sev = SEVERITY_META[event.severity] || SEVERITY_META.info;
  const now = new Date();
  const quote = CITIZEN_QUOTES[Math.floor(Math.random() * CITIZEN_QUOTES.length)];

  async function handleOption(option) {
    setLoading(true);
    const effects = option.effects || {};
    const updates = {};
    for (const [key, val] of Object.entries(effects)) {
      const current = nation[key] || 0;
      const newVal = current + val;
      if (key === "stability")       updates.stability = Math.max(0, Math.min(100, newVal));
      else if (key === "gdp")        updates.gdp = Math.max(0, newVal);
      else if (key === "currency")   updates.currency = Math.max(0, newVal);
      else if (key === "population") updates.population = Math.max(1, newVal);
      else if (key === "tech_points") updates.tech_points = Math.max(0, newVal);
      else if (key === "public_trust") updates.public_trust = Math.max(0.1, Math.min(2, newVal));
      else if (key === "unit_power") updates.unit_power = Math.max(0, newVal);
      else if (key === "res_food")   updates.res_food = Math.max(0, newVal);
      else if (key === "res_iron")   updates.res_iron = Math.max(0, newVal);
      else if (key === "res_oil")    updates.res_oil = Math.max(0, newVal);
    }
    await Promise.all([
      base44.entities.Nation.update(nation.id, updates),
      base44.entities.NewsEvent.update(event.id, { is_resolved: true, chosen_option: option.label })
    ]);
    setResult({ option, updates });
    setLoading(false);
    onResolved?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border ${sev.border} bg-[#0a0f1c] shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${sev.bg} px-5 py-4 border-b ${sev.border} flex items-start justify-between gap-3`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase">{cat.emoji} {cat.label}</span>
              <span className={`text-xs font-black uppercase tracking-wider ${sev.color}`}>{sev.label}</span>
              {event.is_disaster && <span className="text-xs font-black text-red-400 animate-pulse">⚠ DISASTER</span>}
            </div>
            <h2 className="text-lg font-black text-white leading-tight">{event.headline}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Article image */}
          {event.image_url && (
            <div className="w-full h-44 overflow-hidden rounded-xl">
              <img src={event.image_url} alt={event.headline} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Byline */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1"><User size={10} /> {event.author}</div>
            <div className="flex items-center gap-1"><Clock size={10} /> {now.toLocaleDateString()} {now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>

          {/* Body */}
          <p className="text-sm text-slate-300 leading-relaxed">{event.body}</p>

          {/* Citizen quote */}
          <div className="border-l-2 border-cyan-500/30 pl-3">
            <p className="text-xs text-slate-400 italic">"{quote}"</p>
            <p className="text-[10px] text-slate-600 mt-0.5">— Citizen response</p>
          </div>

          {/* Result state */}
          {result ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <div className="text-sm font-bold text-emerald-400">✅ Decision Applied: {result.option.label}</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.option.preview || {}).map(([k, v]) => (
                  <StatDelta key={k} label={k.replace("_"," ")} value={v} />
                ))}
              </div>
              <button onClick={onClose} className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold bg-white/10 border border-white/10 text-white hover:bg-white/20">
                Close
              </button>
            </div>
          ) : choosing ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Choose Your Response:</div>
              {(event.options || []).map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOption(opt)}
                  disabled={loading}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 p-3.5 transition-all group disabled:opacity-50"
                >
                  <div className="font-semibold text-sm text-white group-hover:text-cyan-300">{opt.label}</div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {Object.entries(opt.preview || {}).map(([k, v]) => (
                      <StatDelta key={k} label={k.replace("_"," ")} value={v} />
                    ))}
                  </div>
                </button>
              ))}
              <button onClick={() => setChoosing(false)} className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-white border border-white/5 hover:bg-white/5 transition-all">
                ← Back
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setChoosing(true)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                🤝 Get Involved
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                Never Mind
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}