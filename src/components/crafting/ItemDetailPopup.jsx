/**
 * ItemDetailPopup — Terraria-style item detail modal
 * Shows crafting recipe, station, uses, rarity, tier
 */
import { motion } from "framer-motion";
import { X, Hammer, Zap, Layers, Scale, Package, GitBranch } from "lucide-react";
import { RARITIES, TIERS, CRAFTING_STATIONS, CATEGORIES, ITEM_MAP, getItem, ALL_ITEMS } from "./ItemDatabase";

function RecipeIngredient({ id, qty }) {
  const item = getItem(id);
  if (!item) return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded text-sm">?</span>
      <span className="text-slate-400">{id}</span>
      <span className="ml-auto text-slate-500 font-mono">×{qty}</span>
    </div>
  );
  const rarity = RARITIES[item.rarity] || RARITIES.common;
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all hover:scale-[1.01]"
      style={{ background: `${rarity.glow}`, border: `1px solid ${rarity.color}30` }}>
      <span className="text-base w-6 text-center">{item.emoji}</span>
      <span style={{ color: rarity.color }} className="font-semibold">{item.name}</span>
      <span className="ml-auto text-slate-400 font-mono font-bold">×{qty}</span>
    </div>
  );
}

export default function ItemDetailPopup({ item, onClose, onViewRecipe, onViewTree }) {
  if (!item) return null;

  const rarity   = RARITIES[item.rarity]  || RARITIES.common;
  const tier     = TIERS[item.tier]        || TIERS[1];
  const station  = CRAFTING_STATIONS[item.craftingStation];
  const category = CATEGORIES.find(c => c.id === item.category);

  const recipeKeys = Object.keys(item.craftingRecipe || {});
  const hasRecipe  = recipeKeys.length > 0;

  // Reverse lookup: which items use THIS item as an ingredient?
  const usedAsIngredientIn = ALL_ITEMS.filter(i =>
    i.craftingRecipe && Object.keys(i.craftingRecipe).includes(item.id)
  ).slice(0, 8);

  // Estimated base market value
  const BASE_VALUES = { common: 5, uncommon: 15, rare: 50, epic: 150, legendary: 500 };
  const estValue = (BASE_VALUES[item.rarity] || 5) * (item.tier || 1) * 1.2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(15,23,42,0.99) 0%, rgba(4,8,16,1) 100%)",
          border: `1px solid ${rarity.color}50`,
          boxShadow: `0 0 60px ${rarity.glow}, 0 0 120px rgba(0,0,0,0.8)`,
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-5 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: `linear-gradient(90deg, ${rarity.color}14, transparent 70%)` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
            style={{ background: `${rarity.color}15`, border: `1px solid ${rarity.color}30` }}>
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-white leading-tight">{item.name}</h2>
            <div className="text-[10px] text-slate-500 ep-mono mt-0.5 mb-1.5">{item.id}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full ep-mono"
                style={{ color: rarity.color, background: `${rarity.color}18`, border: `1px solid ${rarity.color}35` }}>
                ◆ {rarity.label}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ep-mono"
                style={{ color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
                T{item.tier} · {tier.label}
              </span>
              {category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ color: "#94a3b8", background: `${category.color}12`, border: `1px solid ${category.color}25` }}>
                  {category.emoji} {category.label}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0 self-start">
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "72vh" }}>
          <div className="p-5 space-y-4">

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "WEIGHT", value: `${item.weight}kg`, color: "#94a3b8" },
                { label: "STACK", value: `×${item.stackSize}`, color: "#94a3b8" },
                { label: "EST. VALUE", value: `~${Math.round(estValue)}cr`, color: "#fbbf24" },
                { label: "EPOCH", value: tier.epoch, color: tier.color },
              ].map(s => (
                <div key={s.label} className="rounded-xl py-2.5 text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-[9px] text-slate-600 ep-mono uppercase">{s.label}</div>
                  <div className="text-[11px] font-black ep-mono mt-0.5 leading-tight" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* ── Description (if any) ── */}
            {item.description && (
              <div className="rounded-xl px-3 py-2.5 text-xs text-slate-300 leading-relaxed italic"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                "{item.description}"
              </div>
            )}

            {/* ── Crafting Station ── */}
            {station && (
              <div className="rounded-xl px-4 py-3"
                style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)" }}>
                <div className="text-[10px] text-orange-400/70 font-black ep-mono uppercase mb-2 flex items-center gap-1">
                  <Hammer size={9} /> CRAFTING STATION
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{station.emoji}</span>
                  <div>
                    <div className="text-sm font-bold text-orange-200">{station.label}</div>
                    <div className="text-[10px] text-slate-500 ep-mono">Station Tier {station.tier}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Crafting Recipe ── */}
            <div>
              <div className="text-[10px] text-slate-500 font-black ep-mono uppercase mb-2 flex items-center gap-1.5">
                <Hammer size={9} /> CRAFTING RECIPE
              </div>
              {hasRecipe ? (
                <div className="space-y-1.5">
                  {recipeKeys.map(id => (
                    <RecipeIngredient key={id} id={id} qty={item.craftingRecipe[id]} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl px-3 py-3 text-xs text-slate-500 flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-lg">✋</span>
                  <div>
                    <div className="font-bold text-slate-400">Raw / Gathered Material</div>
                    <div className="text-[10px] mt-0.5">This item is gathered directly — no crafting required.</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Produced By ── */}
            {(item.producedBy || []).length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 font-black ep-mono uppercase mb-2 flex items-center gap-1.5">
                  <Package size={9} /> PRODUCED BY
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.producedBy.map(b => (
                    <span key={b} className="text-[10px] px-2.5 py-1 rounded-lg font-bold ep-mono"
                      style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}>
                      {b.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Used For ── */}
            {(item.usedFor || []).length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 font-black ep-mono uppercase mb-2 flex items-center gap-1.5">
                  <Zap size={9} /> USED FOR
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.usedFor.map(u => (
                    <span key={u} className="text-[10px] px-2.5 py-1 rounded-lg font-bold ep-mono"
                      style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                      {u.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Used As Ingredient In ── */}
            {usedAsIngredientIn.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 font-black ep-mono uppercase mb-2 flex items-center gap-1.5">
                  <GitBranch size={9} /> INGREDIENT IN
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {usedAsIngredientIn.map(i => {
                    const r = RARITIES[i.rarity] || RARITIES.common;
                    return (
                      <div key={i.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                        style={{ background: `${r.color}08`, border: `1px solid ${r.color}20` }}>
                        <span className="text-sm">{i.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold truncate" style={{ color: r.color }}>{i.name}</div>
                          <div className="text-[9px] text-slate-600 ep-mono">×{i.craftingRecipe[item.id]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Action buttons ── */}
            <div className="flex gap-2 pt-1">
              <button onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border text-slate-400 hover:bg-white/5 transition-all shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                Close
              </button>
              {onViewRecipe && hasRecipe && (
                <button
                  onClick={() => onViewRecipe(item)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-white transition-all"
                  style={{ background: `linear-gradient(135deg, ${rarity.color}90, ${rarity.color}50)`, border: `1px solid ${rarity.color}50` }}>
                  🔨 Full Craft Chain
                </button>
              )}
              {onViewTree && (
                 <button
                   onClick={() => onViewTree(item)}
                   className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all"
                   style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee" }}>
                   ⛓️ Chain Diagram
                 </button>
               )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}