/**
 * ItemCard — compact item display card for encyclopedia grid
 */
import { RARITIES, TIERS, CRAFTING_STATIONS } from "./ItemDatabase";

export default function ItemCard({ item, onClick, compact = false }) {
  if (!item) return null;
  const rarity  = RARITIES[item.rarity]  || RARITIES.common;
  const tier    = TIERS[item.tier]        || TIERS[1];
  const station = CRAFTING_STATIONS[item.craftingStation];

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(item)}
        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${rarity.color}08, transparent)`,
          border: `1px solid ${rarity.color}25`,
        }}
      >
        <span className="text-xl shrink-0">{item.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white truncate">{item.name}</div>
          <div className="text-[10px] ep-mono" style={{ color: rarity.color }}>{rarity.label}</div>
        </div>
        <div className="text-[10px] ep-mono shrink-0 font-bold" style={{ color: tier.color }}>T{item.tier}</div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(item)}
      className="flex flex-col items-start gap-2 p-3 rounded-xl text-left w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: `linear-gradient(160deg, ${rarity.color}08, rgba(4,8,16,0.8))`,
        border: `1px solid ${rarity.color}25`,
        boxShadow: `0 0 0 0 ${rarity.glow}`,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 18px ${rarity.glow}`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Icon + name */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-2xl">{item.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white truncate">{item.name}</div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold ep-mono"
              style={{ color: rarity.color, background: `${rarity.color}15` }}>
              {rarity.label}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold ep-mono"
              style={{ color: tier.color, background: `${tier.color}15` }}>
              T{item.tier}
            </span>
          </div>
        </div>
      </div>

      {/* Station */}
      {station && (
        <div className="text-[9px] ep-mono text-slate-600 flex items-center gap-1">
          <span>{station.emoji}</span>
          <span>{station.label}</span>
        </div>
      )}

      {/* Recipe preview */}
      {Object.keys(item.craftingRecipe || {}).length > 0 && (
        <div className="text-[9px] text-slate-600 ep-mono truncate w-full">
          🔨 {Object.entries(item.craftingRecipe).slice(0, 3).map(([id, qty]) => `${id.replace(/_/g, " ")} ×${qty}`).join(", ")}
          {Object.keys(item.craftingRecipe).length > 3 && " …"}
        </div>
      )}
    </button>
  );
}