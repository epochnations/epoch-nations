/**
 * HexTilePanel — Sidebar panel shown when a hex tile is selected.
 * Shows terrain info, resources, ownership, and actions (claim, build).
 */
import { useState } from "react";
import { X, Sword, Hammer, ShoppingCart, Shield, Anchor, Home } from "lucide-react";
import { TERRAIN_CONFIG, RESOURCE_CONFIG, hexNeighbors, hexId } from "./HexEngine";

const BUILDINGS = [
  { id: "city",          label: "City Center",    cost: 200,  emoji: "🏙",  requires: "any" },
  { id: "military_base", label: "Military Base",  cost: 150,  emoji: "⚔",   requires: "any" },
  { id: "trade_port",    label: "Trade Port",     cost: 120,  emoji: "🚢",  requires: "coastal" },
  { id: "oil_rig",       label: "Oil Rig",        cost: 250,  emoji: "🛢",  requires: "oil" },
  { id: "iron_mine",     label: "Iron Mine",      cost: 180,  emoji: "⚙",   requires: "iron" },
  { id: "farm",          label: "Farm",           cost: 80,   emoji: "🌾",  requires: "food" },
  { id: "gold_mine",     label: "Gold Mine",      cost: 200,  emoji: "✨",  requires: "gold" },
  { id: "research_lab",  label: "Research Lab",   cost: 300,  emoji: "🔬",  requires: "any" },
  { id: "nuclear_plant", label: "Nuclear Plant",  cost: 500,  emoji: "☢",   requires: "uranium" },
];

function canBuildHere(building, tile) {
  if (building.requires === "any") return true;
  if (building.requires === "coastal") return tile.terrain_type === "coastal";
  return tile.resource_type === building.requires;
}

export default function HexTilePanel({ tile, myNation, ownedHexIds, onClaim, onBuild, onClose }) {
  const [building, setBuilding] = useState(false);

  if (!tile) return null;

  const terrain = TERRAIN_CONFIG[tile.terrain_type] || TERRAIN_CONFIG.plains;
  const resource = RESOURCE_CONFIG[tile.resource_type] || RESOURCE_CONFIG.none;
  const isOwned = !!tile.owner_nation_id;
  const isMine = tile.owner_nation_id === myNation?.id;

  // Can claim? Must be adjacent to owned hex
  const neighbors = hexNeighbors(tile.q, tile.r);
  const isAdjacent = neighbors.some(n => ownedHexIds.has(hexId(n.q, n.r)));
  const canClaim = !isOwned && isAdjacent && tile.terrain_type !== "ocean";

  // Protection
  let protectionLabel = null;
  if (tile.protection_until) {
    const exp = new Date(tile.protection_until);
    const now = new Date();
    const ms = exp - now;
    if (ms > 0) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      protectionLabel = `${h}h ${m}m remaining`;
    }
  }

  const availableBuildings = BUILDINGS.filter(b => canBuildHere(b, tile));

  return (
    <div className="absolute bottom-4 right-4 z-40 w-72 rounded-2xl border overflow-hidden"
      style={{ background: "rgba(4,8,16,0.96)", borderColor: "rgba(34,211,238,0.2)", backdropFilter: "blur(20px)" }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <span className="text-xl">{terrain.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white capitalize">{terrain.label} Hex</div>
          <div className="text-[10px] text-slate-500 ep-mono">{tile.q}, {tile.r}</div>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors"><X size={14} /></button>
      </div>

      <div className="p-4 space-y-3">

        {/* Ownership */}
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {isOwned ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{tile.owner_flag || "🏴"}</span>
              <div>
                <div className="text-xs font-bold" style={{ color: tile.owner_color || "#22d3ee" }}>
                  {tile.owner_nation_name}
                </div>
                {tile.is_capital && <div className="text-[10px] text-amber-400">★ Capital</div>}
                {tile.has_city && <div className="text-[10px] text-cyan-400">🏙 {tile.city_name || "City"}</div>}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Unclaimed Territory</div>
          )}
          {protectionLabel && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-green-400">
              <Shield size={10} />
              <span>Protected · {protectionLabel}</span>
            </div>
          )}
        </div>

        {/* Resources */}
        {tile.resource_type !== "none" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <span className="text-lg">{resource.emoji}</span>
            <div>
              <div className="text-xs font-bold text-amber-400 capitalize">{tile.resource_type}</div>
              <div className="text-[10px] text-slate-500">{tile.resource_amount} units available</div>
            </div>
          </div>
        )}

        {/* Infrastructure */}
        {tile.infrastructure_level > 0 && (
          <div className="text-[10px] text-slate-400 ep-mono">
            Infrastructure Level: <span className="text-cyan-400">{tile.infrastructure_level}</span>
          </div>
        )}

        {/* Buildings on tile */}
        {(tile.buildings || []).length > 0 && (
          <div className="text-[10px] text-slate-500">
            Buildings: <span className="text-slate-300">{tile.buildings.join(", ")}</span>
          </div>
        )}

        {/* Actions */}
        {myNation && (
          <div className="space-y-2 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>

            {/* Claim */}
            {canClaim && (
              <button
                onClick={() => onClaim(tile)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee" }}>
                <Home size={12} /> Claim Territory (50 gold)
              </button>
            )}

            {/* Build */}
            {isMine && (
              <button
                onClick={() => setBuilding(b => !b)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}>
                <Hammer size={12} /> {building ? "Close Builder" : "Build Structure"}
              </button>
            )}

            {/* Building list */}
            {building && isMine && (
              <div className="space-y-1">
                {availableBuildings.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { onBuild(tile, b); setBuilding(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors text-left border"
                    style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <span>{b.emoji}</span>
                    <span className="flex-1 text-slate-300">{b.label}</span>
                    <span className="text-amber-400 ep-mono">{b.cost}💰</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}