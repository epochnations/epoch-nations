/**
 * CraftChainModal — Shows the full crafting dependency chain for an item
 * Minecraft/Terraria style: wood → plank → furniture
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { RARITIES, TIERS, CRAFTING_STATIONS, ITEM_MAP, getItem } from "./ItemDatabase";

function buildChain(itemId, depth = 0, visited = new Set()) {
  if (depth > 6 || visited.has(itemId)) return null;
  visited.add(itemId);
  const item = getItem(itemId);
  if (!item) return { id: itemId, name: itemId.replace(/_/g, " "), emoji: "❓", children: [], depth };
  const recipe = item.craftingRecipe || {};
  const children = Object.entries(recipe).map(([id, qty]) => {
    const child = buildChain(id, depth + 1, new Set(visited));
    return child ? { ...child, qty } : { id, qty, name: id.replace(/_/g, " "), emoji: "❓", children: [], depth: depth + 1 };
  });
  return { ...item, children, depth };
}

function ChainNode({ node, isRoot }) {
  const [expanded, setExpanded] = useState(isRoot || node.depth < 2);
  const rarity = RARITIES[node.rarity] || RARITIES.common;
  const tier   = TIERS[node.tier]       || TIERS[1];
  const station = node.craftingStation ? CRAFTING_STATIONS[node.craftingStation] : null;

  return (
    <div className="relative">
      <button
        onClick={() => node.children?.length && setExpanded(e => !e)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl w-full text-left transition-all hover:scale-[1.01]"
        style={{
          background: isRoot
            ? `linear-gradient(135deg, ${rarity.color}15, rgba(255,255,255,0.03))`
            : "rgba(255,255,255,0.03)",
          border: `1px solid ${isRoot ? rarity.color + "40" : "rgba(255,255,255,0.06)"}`,
          marginLeft: node.depth * 16,
        }}
      >
        <span className="text-lg">{node.emoji || "❓"}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
            {node.name || node.id}
            {node.qty && !isRoot && (
              <span className="text-[10px] font-black ep-mono px-1.5 py-0.5 rounded"
                style={{ background: "rgba(34,211,238,0.12)", color: "#22d3ee" }}>
                ×{node.qty}
              </span>
            )}
          </div>
          {station && (
            <div className="text-[9px] text-slate-600 ep-mono">{station.emoji} {station.label}</div>
          )}
        </div>
        {node.children?.length > 0 && (
          <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight size={12} className="text-slate-500" />
          </motion.span>
        )}
      </button>

      {expanded && node.children?.length > 0 && (
        <div className="mt-1 space-y-1 border-l-2 ml-5 pl-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {node.children.map((child, i) => (
            <ChainNode key={`${child.id}_${i}`} node={child} isRoot={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CraftChainModal({ item, onClose }) {
  if (!item) return null;
  const chain = buildChain(item.id);
  const rarity = RARITIES[item.rarity] || RARITIES.common;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(15,23,42,0.99) 0%, rgba(4,8,16,0.99) 100%)",
          border: `1px solid ${rarity.color}35`,
          boxShadow: `0 0 50px ${rarity.color}15`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.emoji}</span>
            <div>
              <div className="text-sm font-black text-white">{item.name} — Craft Chain</div>
              <div className="text-[10px] text-slate-500">Full production dependency tree</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-1.5" style={{ maxHeight: "70vh" }}>
          {chain ? (
            <ChainNode node={chain} isRoot={true} />
          ) : (
            <div className="text-center text-slate-500 py-8 text-sm">No crafting chain found.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}