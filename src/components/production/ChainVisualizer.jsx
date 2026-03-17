/**
 * ChainVisualizer — Animated Factorio-style production chain diagram.
 * Renders SVG nodes with animateMotion particles flowing along bezier edges.
 */
import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ALL_ITEMS } from "../crafting/ItemDatabase";

const NODE_W   = 138;
const NODE_H   = 54;
const COL_GAP  = 215;
const ROW_GAP  = 80;
const PAD      = 40;

const STATION_COLORS = {
  furnace: "#f97316", forge: "#f97316", sawmill: "#a16207",
  kiln: "#78716c",   kitchen: "#16a34a", workshop: "#0e7490",
  refinery: "#6b21a8", workbench: "#374151",
};

const RARITY_COLORS = {
  common: "#64748b", uncommon: "#4ade80", rare: "#60a5fa",
  epic: "#a78bfa",  legendary: "#fbbf24",
};

// ── Build recursive chain tree ────────────────────────────────────────────────
function buildChain(item, itemMap, visited = new Set(), depth = 0) {
  if (!item || visited.has(item.id) || depth > 3) return null;
  const v2 = new Set([...visited, item.id]);
  const recipe = item.crafting_recipe || {};
  const ingredients = Object.entries(recipe).map(([ingId, qty]) => {
    const ing = itemMap[ingId] || { id: ingId, name: ingId, emoji: "📦" };
    return { item: ing, qty, subtree: buildChain(ing, itemMap, v2, depth + 1) };
  });
  return { item, ingredients, depth };
}

// ── Collect all unique nodes by level ────────────────────────────────────────
function collectNodes(node, level = 0, seen = new Set()) {
  if (!node) return [];
  const id = `${node.item.id}_${level}`;
  if (seen.has(id)) return [];
  seen.add(id);
  const out = [{ ...node, level, uid: id }];
  for (const ing of node.ingredients || []) {
    out.push(...collectNodes(ing.subtree || { item: ing.item, ingredients: [] }, level + 1, seen));
  }
  return out;
}

// ── Collect all edges ─────────────────────────────────────────────────────────
function collectEdges(node, level = 0, seen = new Set()) {
  if (!node) return [];
  const fromId = `${node.item.id}_${level}`;
  if (seen.has(fromId)) return [];
  seen.add(fromId);
  const out = [];
  for (const ing of node.ingredients || []) {
    const toId = `${ing.item.id}_${level + 1}`;
    out.push({ from: toId, to: fromId, qty: ing.qty });
    if (ing.subtree) out.push(...collectEdges(ing.subtree, level + 1, new Set(seen)));
  }
  return out;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChainVisualizer({ item, onClose }) {
  const [hovered, setHovered] = useState(null);

  const itemMap = useMemo(() => {
    const m = {};
    ALL_ITEMS.forEach(i => { m[i.id] = i; });
    return m;
  }, []);

  const chain    = useMemo(() => item ? buildChain(item, itemMap) : null, [item, itemMap]);
  const allNodes = useMemo(() => chain ? collectNodes(chain) : [], [chain]);
  const allEdges = useMemo(() => chain ? collectEdges(chain) : [], [chain]);

  // Position: level 0 (final product) = rightmost column, higher = more left
  const positioned = useMemo(() => {
    const byLevel = {};
    allNodes.forEach(n => { (byLevel[n.level] = byLevel[n.level] || []).push(n); });
    const maxLvl = Math.max(0, ...Object.keys(byLevel).map(Number));
    const out = {};
    Object.entries(byLevel).forEach(([lvl, nodes]) => {
      const col = maxLvl - parseInt(lvl);
      nodes.forEach((n, i) => {
        out[n.uid] = { ...n, x: col * COL_GAP + PAD, y: i * ROW_GAP + PAD };
      });
    });
    return out;
  }, [allNodes]);

  if (!item) return null;

  const posVals = Object.values(positioned);
  const svgW = posVals.length ? Math.max(...posVals.map(n => n.x)) + NODE_W + PAD : 400;
  const svgH = posVals.length ? Math.max(...posVals.map(n => n.y)) + NODE_H + PAD : 200;
  const hasRecipe = Object.keys(item.crafting_recipe || {}).length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(20px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 24 }}
          className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0d1424 0%,#040810 100%)", border: "1px solid rgba(34,211,238,0.22)", boxShadow: "0 0 80px rgba(34,211,238,0.06)" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.4)" }}>
            <span className="text-2xl">{item.emoji || "📦"}</span>
            <div className="flex-1">
              <div className="font-black text-white text-base">{item.name}</div>
              <div className="text-[10px] text-slate-500 ep-mono">Production Chain Diagram · {allNodes.length} nodes · {allEdges.length} connections</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {Object.entries(STATION_COLORS).slice(0, 5).map(([s, c]) => (
                <div key={s} className="hidden sm:flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                  <span className="text-[9px] text-slate-500 capitalize">{s}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* SVG Canvas */}
          <div className="flex-1 overflow-auto p-4" style={{ minHeight: 240 }}>
            {!hasRecipe ? (
              <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
                <div className="text-center">
                  <div className="text-5xl mb-3">{item.emoji || "📦"}</div>
                  <div className="font-bold text-white text-base">{item.name}</div>
                  <div className="text-[11px] mt-1 text-slate-500">Raw material — no crafting recipe required</div>
                  <div className="text-[10px] mt-2 text-slate-600">Tier {item.tier || 1} · {item.rarity || "common"} · {item.category}</div>
                </div>
              </div>
            ) : (
              <svg width={svgW} height={svgH} style={{ overflow: "visible", display: "block", margin: "auto" }}>
                <defs>
                  {allEdges.map((edge, i) => {
                    const from = positioned[edge.from];
                    const to = positioned[edge.to];
                    if (!from || !to) return null;
                    const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2;
                    const x2 = to.x,           y2 = to.y + NODE_H / 2;
                    const mx = (x1 + x2) / 2;
                    return (
                      <path key={`def_${i}`} id={`ep_${i}`}
                        d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} />
                    );
                  })}
                </defs>

                {/* Edges */}
                {allEdges.map((edge, i) => {
                  const from = positioned[edge.from];
                  const to = positioned[edge.to];
                  if (!from || !to) return null;
                  const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2;
                  const x2 = to.x,           y2 = to.y + NODE_H / 2;
                  const mx = (x1 + x2) / 2;
                  const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                  return (
                    <g key={`edge_${i}`}>
                      {/* Edge glow */}
                      <path d={d} fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="8" />
                      {/* Edge line */}
                      <path d={d} fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" strokeDasharray="4,5" />
                      {/* Animated particle */}
                      <circle r="3.5" fill="#22d3ee" opacity="0.85">
                        <animateMotion dur={`${1.8 + i * 0.25}s`} repeatCount="indefinite" rotate="auto">
                          <mpath href={`#ep_${i}`} />
                        </animateMotion>
                      </circle>
                      <circle r="2" fill="white" opacity="0.5">
                        <animateMotion dur={`${1.8 + i * 0.25}s`} repeatCount="indefinite" rotate="auto" begin={`${0.4 + i * 0.1}s`}>
                          <mpath href={`#ep_${i}`} />
                        </animateMotion>
                      </circle>
                      {/* Qty label */}
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7}
                        textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="monospace">
                        ×{edge.qty}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {Object.values(positioned).map(node => {
                  const isRoot = node.level === 0;
                  const rColor = RARITY_COLORS[node.item?.rarity] || RARITY_COLORS.common;
                  const stColor = STATION_COLORS[node.item?.crafting_station] || "#334155";
                  const isHovered = hovered === node.uid;
                  return (
                    <g key={node.uid}
                      onMouseEnter={() => setHovered(node.uid)}
                      onMouseLeave={() => setHovered(null)}
                      style={{ cursor: "default" }}>
                      {/* Outer glow for root */}
                      {isRoot && (
                        <rect x={node.x - 4} y={node.y - 4} width={NODE_W + 8} height={NODE_H + 8}
                          rx={16} fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="8" />
                      )}
                      {/* Node bg */}
                      <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={12}
                        fill={isRoot ? "rgba(34,211,238,0.1)" : isHovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}
                        stroke={isRoot ? "rgba(34,211,238,0.5)" : `${rColor}40`}
                        strokeWidth={isRoot ? 2 : 1}
                      />
                      {/* Station color bar */}
                      <rect x={node.x} y={node.y + 6} width={4} height={NODE_H - 12} rx={3}
                        fill={node.item?.crafting_recipe ? stColor : "#1e293b"} opacity="0.9" />
                      {/* Emoji */}
                      <text x={node.x + 22} y={node.y + NODE_H / 2 + 8} textAnchor="middle" fontSize="20">
                        {node.item?.emoji || "📦"}
                      </text>
                      {/* Name */}
                      <text x={node.x + 38} y={node.y + 21}
                        fill="white" fontSize="11" fontWeight="bold" fontFamily="Inter, sans-serif">
                        {(node.item?.name || "Unknown").slice(0, 14)}
                      </text>
                      {/* Station + tier */}
                      <text x={node.x + 38} y={node.y + 35}
                        fill={rColor} fontSize="9" fontFamily="monospace" opacity="0.8">
                        {node.item?.crafting_station || "raw"} · T{node.item?.tier || 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}