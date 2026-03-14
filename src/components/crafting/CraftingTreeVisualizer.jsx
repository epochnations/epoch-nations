/**
 * CraftingTreeVisualizer — Visual tree showing the full dependency chain for any item
 * Uses a layered left-to-right layout built purely in React/SVG (no external graph lib needed)
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { ALL_ITEMS, RARITIES, CRAFTING_STATIONS, ITEM_MAP } from "./ItemDatabase";

// Build the full dependency tree (recursive, depth-limited)
function buildTree(itemId, depth = 0, maxDepth = 5, visited = new Set()) {
  if (depth > maxDepth || visited.has(itemId)) return null;
  visited = new Set([...visited, itemId]);
  const item = ITEM_MAP[itemId];
  if (!item) return { id: itemId, name: itemId, emoji: "❓", unknown: true, children: [] };
  const recipe = item.craftingRecipe || {};
  const children = Object.entries(recipe)
    .map(([ingId, qty]) => {
      const child = buildTree(ingId, depth + 1, maxDepth, visited);
      return child ? { ...child, quantity: qty } : null;
    })
    .filter(Boolean);
  return { ...item, quantity: 1, depth, children };
}

// Flatten tree into layers for layout
function flattenLayers(tree) {
  const layers = [];
  function walk(node, layer) {
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(node);
    (node.children || []).forEach(c => walk(c, layer + 1));
  }
  walk(tree, 0);
  return layers;
}

const NODE_W = 120;
const NODE_H = 56;
const H_GAP = 60;
const V_GAP = 16;

function ItemNode({ node, x, y, isRoot, onHover, hovered }) {
  const rarity = RARITIES[node.rarity] || RARITIES.common;
  const isHov = hovered === node.id;
  return (
    <g transform={`translate(${x},${y})`}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}>
      <rect x={0} y={0} width={NODE_W} height={NODE_H} rx={10}
        fill={isRoot ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)"}
        stroke={isHov ? rarity.color : isRoot ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.1)"}
        strokeWidth={isHov || isRoot ? 1.5 : 1} />
      <text x={8} y={20} fontSize={18} dominantBaseline="middle">{node.emoji || "📦"}</text>
      <text x={32} y={16} fontSize={9} fill={rarity.color} fontWeight="700" fontFamily="'JetBrains Mono', monospace">
        {(node.rarity || "common").toUpperCase()}
      </text>
      <text x={32} y={30} fontSize={10} fill="white" fontWeight="600"
        style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {(node.name || node.id || "").substring(0, 14)}
      </text>
      {node.quantity && node.quantity > 1 && (
        <text x={NODE_W - 6} y={NODE_H - 6} fontSize={9} fill="#94a3b8" textAnchor="end">×{node.quantity}</text>
      )}
      {node.craftingStation && (
        <text x={8} y={NODE_H - 8} fontSize={8} fill="#64748b">
          {CRAFTING_STATIONS[node.craftingStation]?.emoji || "🔧"} {(node.craftingStation || "").replace(/_/g, " ")}
        </text>
      )}
    </g>
  );
}

export default function CraftingTreeVisualizer({ item, onClose }) {
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(1);

  const tree = useMemo(() => item ? buildTree(item.id) : null, [item?.id]);
  const layers = useMemo(() => tree ? flattenLayers(tree) : [], [tree]);

  // Position nodes
  const { nodes, edges, svgW, svgH } = useMemo(() => {
    if (!layers.length) return { nodes: [], edges: [], svgW: 300, svgH: 200 };
    const maxPerLayer = Math.max(...layers.map(l => l.length));
    const svgW = layers.length * (NODE_W + H_GAP) + H_GAP;
    const svgH = maxPerLayer * (NODE_H + V_GAP) + V_GAP + 40;
    const positioned = {};
    const nodeList = [];
    const edgeList = [];

    layers.forEach((layer, li) => {
      const x = H_GAP + li * (NODE_W + H_GAP);
      const totalH = layer.length * (NODE_H + V_GAP) - V_GAP;
      const startY = (svgH - totalH) / 2;
      layer.forEach((node, ni) => {
        const y = startY + ni * (NODE_H + V_GAP);
        positioned[node.id + "_" + li + "_" + ni] = { x, y };
        nodeList.push({ ...node, x, y, layerKey: `${node.id}_${li}_${ni}` });
      });
    });

    // Draw edges from parent layer to children
    function drawEdges(node, parentKey) {
      if (!parentKey) return;
      const pPos = positioned[parentKey];
      (node.children || []).forEach((child, ci) => {
        const childKey = Object.keys(positioned).find(k => k.startsWith(child.id + "_"));
        if (childKey && pPos) {
          const cPos = positioned[childKey];
          edgeList.push({
            x1: pPos.x + NODE_W, y1: pPos.y + NODE_H / 2,
            x2: cPos.x, y2: cPos.y + NODE_H / 2,
            key: `${parentKey}-${childKey}`,
          });
          drawEdges(child, childKey);
        }
      });
    }
    const rootKey = Object.keys(positioned)[0];
    if (tree) drawEdges(tree, rootKey);
    return { nodes: nodeList, edges: edgeList, svgW, svgH };
  }, [layers, tree]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
        onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="w-full flex flex-col rounded-2xl overflow-hidden"
          style={{ maxWidth: 900, maxHeight: "92vh", background: "#040810", border: "1px solid rgba(34,211,238,0.2)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.4)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <div className="font-black text-white text-sm">Crafting Tree — {item.name}</div>
                <div className="text-[10px] text-slate-500 ep-mono">
                  {layers.length} layer{layers.length !== 1 ? "s" : ""} deep · {nodes.length} components
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400">
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] text-slate-500 ep-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400">
                <ZoomIn size={14} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 ml-2">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 py-2 border-b shrink-0 overflow-x-auto"
            style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
            <span className="text-[10px] text-slate-600 ep-mono uppercase shrink-0">Rarity</span>
            {Object.entries(RARITIES).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: val.color }} />
                <span className="text-[10px] text-slate-400">{val.label}</span>
              </div>
            ))}
            <span className="text-[10px] text-slate-600 ep-mono ml-4 shrink-0">Read left → right</span>
          </div>

          {/* SVG Canvas */}
          <div className="flex-1 overflow-auto p-4" style={{ background: "rgba(4,8,16,0.8)" }}>
            {nodes.length === 0 ? (
              <div className="text-center text-slate-500 py-16">
                <div className="text-4xl mb-3">🔧</div>
                <div className="text-sm">This item has no crafting recipe.</div>
                <div className="text-xs text-slate-600 mt-1">It is a raw material gathered directly from the world.</div>
              </div>
            ) : (
              <svg width={svgW * zoom} height={svgH * zoom}
                viewBox={`0 0 ${svgW} ${svgH}`}
                style={{ minWidth: 300, display: "block" }}>
                {/* Grid bg */}
                <defs>
                  <pattern id="ctv-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#ctv-grid)" />
                {/* Edges */}
                {edges.map(e => (
                  <path key={e.key}
                    d={`M ${e.x1} ${e.y1} C ${(e.x1 + e.x2) / 2} ${e.y1}, ${(e.x1 + e.x2) / 2} ${e.y2}, ${e.x2} ${e.y2}`}
                    fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5"
                    strokeDasharray={hovered ? "4,3" : "none"} />
                ))}
                {/* Nodes */}
                {nodes.map((node, i) => (
                  <ItemNode key={node.layerKey} node={node} x={node.x} y={node.y}
                    isRoot={i === 0} onHover={setHovered} hovered={hovered} />
                ))}
              </svg>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}