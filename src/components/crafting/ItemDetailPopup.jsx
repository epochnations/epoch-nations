/**
 * ItemDetailPopup — Terraria-style item detail modal
 * Shows crafting recipe, station, uses, rarity, tier
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Hammer, Package, Zap, Star } from "lucide-react";
import { RARITIES, TIERS, CRAFTING_STATIONS, CATEGORIES, ITEM_MAP, getItem } from "./ItemDatabase";

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

export default function ItemDetailPopup({ item, onClose, onViewRecipe }) {
  if (!item) return null;

  const rarity   = RARITIES[item.rarity]  || RARITIES.common;
  const tier     = TIERS[item.tier]        || TIERS[1];
  const station  = CRAFTING_STATIONS[item.craftingStation];
  const category = CATEGORIES.find(c => c.id === item.category);

  const recipeKeys = Object.keys(item.craftingRecipe || {});
  const hasRecipe  = recipeKeys.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(4,8,16,0.99) 100%)",
          border: `1px solid ${rarity.color}40`,
          boxShadow: `0 0 40px ${rarity.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: `linear-gradient(90deg, ${rarity.color}10, transparent)` }}>
          <span className="text-4xl">{item.emoji}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white truncate">{item.name}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ep-mono"
                style={{ color: rarity.color, background: `${rarity.color}15`, border: `1px solid ${rarity.color}30` }}>
                {rarity.label}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ep-mono"
                style={{ color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
                Tier {item.tier} — {tier.label}
              </span>
              {category && (
                <span className="text-[10px] text-slate-500">{category.emoji} {category.label}</span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0">
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl px-2 py-2 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-[10px] text-slate-500 ep-mono">WEIGHT</div>
              <div className="text-sm font-black ep-mono text-slate-300">{item.weight}kg</div>
            </div>
            <div className="rounded-xl px-2 py-2 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-[10px] text-slate-500 ep-mono">STACK</div>
              <div className="text-sm font-black ep-mono text-slate-300">×{item.stackSize}</div>
            </div>
            <div className="rounded-xl px-2 py-2 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-[10px] text-slate-500 ep-mono">TIER</div>
              <div className="text-sm font-black ep-mono" style={{ color: tier.color }}>{tier.label}</div>
            </div>
          </div>

          {/* Crafting Station */}
          {station && (
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)" }}>
              <div className="text-[10px] text-slate-500 font-bold ep-mono uppercase mb-1">CRAFTING STATION</div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{station.emoji}</span>
                <span className="text-sm font-bold text-orange-300">{station.label}</span>
                <span className="ml-auto text-[10px] text-slate-600 ep-mono">Tier {station.tier}</span>
              </div>
            </div>
          )}

          {/* Crafting Recipe */}
          {hasRecipe ? (
            <div>
              <div className="text-[10px] text-slate-500 font-bold ep-mono uppercase mb-2 flex items-center gap-1">
                <Hammer size={10} /> CRAFTING RECIPE
              </div>
              <div className="space-y-1.5">
                {recipeKeys.map(id => (
                  <RecipeIngredient key={id} id={id} qty={item.craftingRecipe[id]} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl px-3 py-2 text-xs text-slate-500 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              ✋ Gathered by hand / natural production
            </div>
          )}

          {/* Produced By */}
          {(item.producedBy || []).length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 font-bold ep-mono uppercase mb-2">PRODUCED BY</div>
              <div className="flex flex-wrap gap-1.5">
                {item.producedBy.map(b => (
                  <span key={b} className="text-[10px] px-2 py-1 rounded-lg font-bold ep-mono"
                    style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.18)", color: "#22d3ee" }}>
                    {b.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Used For */}
          {(item.usedFor || []).length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 font-bold ep-mono uppercase mb-2 flex items-center gap-1">
                <Zap size={10} /> USED FOR
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.usedFor.map(u => (
                  <span key={u} className="text-[10px] px-2 py-1 rounded-lg font-bold ep-mono"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)", color: "#a78bfa" }}>
                    {u.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border text-slate-400 hover:bg-white/5 transition-all"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              Close
            </button>
            {onViewRecipe && hasRecipe && (
              <button
                onClick={() => onViewRecipe(item)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${rarity.color}80, ${rarity.color}40)`, border: `1px solid ${rarity.color}40` }}>
                🔨 View Craft Chain
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}