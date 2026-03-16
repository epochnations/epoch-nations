/**
 * IslandPanel — Island detail, purchase, and building management panel.
 * Shows when a hex is selected on the HexOceanMap.
 */
import { useState } from "react";
import { X, Hammer, TrendingUp, Shield, Package, Home, DollarSign, Anchor } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TERRAIN_CONFIG, generateTerrain, islandPrice, seededRand } from "../HexOceanMap";

const BUILDINGS = [
  { id: "market",      label: "Market",       emoji: "🏪", cat: "economic",  cost: 500,  desc: "+8% trade income",     terrain: null },
  { id: "trade_port",  label: "Trade Port",   emoji: "⚓",  cat: "economic",  cost: 800,  desc: "+15% exports",         terrain: null },
  { id: "warehouse",   label: "Warehouse",    emoji: "🏭", cat: "economic",  cost: 400,  desc: "+50% resource storage", terrain: null },
  { id: "mine",        label: "Mine",         emoji: "⛏️", cat: "industrial", cost: 600,  desc: "+40 iron/stone/tick",  terrain: ["rocky","mountains","volcanic"] },
  { id: "lumber_mill", label: "Lumber Mill",  emoji: "🪵", cat: "industrial", cost: 450,  desc: "+40 wood/tick",        terrain: ["forest","tropical"] },
  { id: "oil_rig",     label: "Oil Rig",      emoji: "🛢️", cat: "industrial", cost: 1200, desc: "+30 oil/tick",         terrain: ["tundra","coastal"] },
  { id: "farm",        label: "Farm",         emoji: "🌾", cat: "industrial", cost: 300,  desc: "+50 food/tick",        terrain: ["plains","tropical","coastal"] },
  { id: "housing",     label: "Housing",      emoji: "🏠", cat: "civilian",   cost: 350,  desc: "+5 population cap",    terrain: null },
  { id: "hospital",    label: "Hospital",     emoji: "🏥", cat: "civilian",   cost: 700,  desc: "+10% stability",       terrain: null },
  { id: "school",      label: "School",       emoji: "🏫", cat: "civilian",   cost: 500,  desc: "+5 tech points/day",   terrain: null },
  { id: "fort",        label: "Fort",         emoji: "🏰", cat: "military",   cost: 900,  desc: "+20 defense",          terrain: null },
  { id: "naval_base",  label: "Naval Base",   emoji: "🛳️", cat: "military",   cost: 1500, desc: "Naval operations hub", terrain: null },
  { id: "barracks",    label: "Barracks",     emoji: "⚔️", cat: "military",   cost: 600,  desc: "+15 unit power",       terrain: null },
  { id: "radar",       label: "Radar Station",emoji: "📡", cat: "military",   cost: 800,  desc: "Fog of war reveal",    terrain: null },
  { id: "dock",        label: "Dock",         emoji: "🏗️", cat: "infrastructure", cost: 400, desc: "Trade route endpoint", terrain: null },
  { id: "road",        label: "Road Network", emoji: "🛣️", cat: "infrastructure", cost: 300, desc: "+10% resource speed",  terrain: null },
];

const CAT_ICONS = { economic: TrendingUp, industrial: Hammer, civilian: Home, military: Shield, infrastructure: Anchor };
const CAT_COLORS = { economic: "#34d399", industrial: "#f97316", civilian: "#60a5fa", military: "#f87171", infrastructure: "#a78bfa" };

export default function IslandPanel({ hex, myNation, tiles, onClose, onPurchase, onRefresh }) {
  const { q, r, tile } = hex;
  const terrain = tile?.terrain_type || generateTerrain(q, r);
  const cfg = TERRAIN_CONFIG[terrain] || TERRAIN_CONFIG.tropical;
  const isOwned = !!tile;
  const isMe = tile?.owner_nation_id === myNation?.id;
  const buildings = tile?.buildings || [];

  const nearby = tiles.filter(t => {
    const dq = t.q - q, dr = t.r - r;
    return Math.sqrt(dq * dq + dr * dr) <= 4;
  }).length;
  const price = islandPrice(q, r, nearby);
  const canAfford = (myNation?.currency || 0) >= price;

  const [activeTab, setActiveTab] = useState("info"); // info | build
  const [building, setBuilding] = useState(false);
  const [buildMsg, setBuildMsg] = useState(null);

  async function constructBuilding(b) {
    if (!myNation || !tile || !isMe) return;
    if ((myNation.currency || 0) < b.cost) { setBuildMsg("Not enough credits!"); return; }
    if (buildings.includes(b.id)) { setBuildMsg("Already built!"); return; }
    if (b.terrain && !b.terrain.includes(terrain)) { setBuildMsg(`Requires: ${b.terrain.join(" or ")} terrain`); return; }

    setBuilding(true);
    const newBuildings = [...buildings, b.id];
    const updates = { buildings: newBuildings };
    if (b.id === "trade_port") updates.has_trade_port = true;
    if (b.id === "fort" || b.id === "barracks" || b.id === "naval_base") updates.has_military_base = true;
    if (!tile.has_city && newBuildings.length >= 3) updates.has_city = true;
    updates.infrastructure_level = Math.min(5, (tile.infrastructure_level || 0) + 1);

    const nationUpd = { currency: (myNation.currency || 0) - b.cost };
    if (b.id === "farm") nationUpd.res_food = (myNation.res_food || 0) + 100;
    if (b.id === "mine") nationUpd.res_iron = (myNation.res_iron || 0) + 60;
    if (b.id === "lumber_mill") nationUpd.res_wood = (myNation.res_wood || 0) + 80;
    if (b.id === "oil_rig") nationUpd.res_oil = (myNation.res_oil || 0) + 50;
    if (b.id === "fort") nationUpd.defense_level = (myNation.defense_level || 10) + 20;
    if (b.id === "barracks") nationUpd.unit_power = (myNation.unit_power || 10) + 15;
    if (b.id === "housing") nationUpd.housing_capacity = (myNation.housing_capacity || 20) + 5;

    await Promise.all([
      base44.entities.HexTile.update(tile.id, updates),
      base44.entities.Nation.update(myNation.id, nationUpd),
    ]);

    await base44.entities.ChatMessage.create({
      channel: "global", sender_nation_name: "CONSTRUCTION BUREAU",
      sender_flag: "🏗️", sender_color: "#f97316", sender_role: "system",
      content: `🏗️ BUILT — ${myNation.flag_emoji} ${myNation.name} constructed a ${b.emoji} ${b.label} on their island at (${q}, ${r})!`,
    }).catch(() => {});

    setBuildMsg(`${b.emoji} ${b.label} constructed!`);
    setBuilding(false);
    onRefresh?.();
  }

  const availableBuildings = BUILDINGS.filter(b => {
    if (b.terrain && !b.terrain.includes(terrain)) return false;
    return true;
  });
  const cats = [...new Set(availableBuildings.map(b => b.cat))];

  return (
    <div className="absolute bottom-16 left-3 z-40 w-72 max-h-[calc(100%-80px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: "rgba(6,18,36,0.97)", border: "1px solid rgba(34,211,238,0.2)", backdropFilter: "blur(16px)" }}>

      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cfg.emoji}</span>
            <div>
              <div className="text-sm font-bold text-white">
                {isOwned ? (tile.city_name || `${cfg.label} Island`) : `${cfg.label} Territory`}
              </div>
              <div className="text-[10px] text-slate-500 ep-mono">
                ({q}, {r}) · {cfg.label}
                {isOwned && ` · ${tile.owner_nation_name}`}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white">
            <X size={13} />
          </button>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {!isOwned ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-amber-400"
              style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
              🌊 Ocean · For Purchase
            </span>
          ) : (
            <>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: `${cfg.rColor}18`, color: cfg.rColor, border: `1px solid ${cfg.rColor}40` }}>
                {cfg.emoji} {cfg.label}
              </span>
              {tile.has_city && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-cyan-400"
                  style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)" }}>
                  🏙️ City
                </span>
              )}
              {tile.has_trade_port && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-green-400"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
                  ⚓ Port
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs (only if owned by me) */}
      {isMe && (
        <div className="shrink-0 flex px-4 pt-2 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[["info", "ℹ️ Info"], ["build", "🏗️ Build"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="pb-2 text-xs font-bold border-b-2 transition-all"
              style={{ borderColor: activeTab === id ? "#22d3ee" : "transparent", color: activeTab === id ? "#22d3ee" : "#64748b" }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* PURCHASE panel (ocean tile) */}
        {!isOwned && (
          <>
            <div className="text-xs text-slate-400 leading-relaxed">
              This ocean tile can be purchased and converted into a {cfg.emoji} <strong className="text-white">{cfg.label}</strong> island.
              Nearby developed islands influence the price.
            </div>
            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Island Price</span>
                <span className="font-black text-amber-400 ep-mono">{price.toLocaleString()} cr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Your Treasury</span>
                <span className={`font-bold ep-mono ${canAfford ? "text-green-400" : "text-red-400"}`}>
                  {(myNation?.currency || 0).toLocaleString()} cr
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Resources</span>
                <span className="text-slate-300">{cfg.rColor ? "✅ On purchase" : "None"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Coordinates</span>
                <span className="text-slate-300 ep-mono">({q}, {r})</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <div>🌴 Terrain: <strong className="text-white">{cfg.label}</strong> — {["forest","tropical"].includes(terrain) ? "wood & food" : ["rocky","mountains","volcanic"].includes(terrain) ? "stone & iron" : terrain === "desert" ? "gold & stone" : terrain === "tundra" ? "oil & stone" : "food & gold"} resources</div>
              <div>📍 Nearby islands: {nearby}</div>
            </div>
            {myNation ? (
              <button onClick={() => onPurchase(q, r)} disabled={!canAfford}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all"
                style={{ background: canAfford ? "linear-gradient(135deg, #0891b2, #0e7490)" : "rgba(255,255,255,0.08)" }}>
                {canAfford ? `🏝️ Purchase Island — ${price.toLocaleString()} cr` : `⚠ Need ${(price - (myNation?.currency || 0)).toLocaleString()} more cr`}
              </button>
            ) : (
              <div className="text-xs text-slate-500 text-center">Log in to purchase islands</div>
            )}
          </>
        )}

        {/* INFO tab (owned island) */}
        {isOwned && (!isMe || activeTab === "info") && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Owner",    value: tile.owner_nation_name || "Unknown", color: "#22d3ee" },
                { label: "Terrain",  value: cfg.label,                           color: cfg.rColor },
                { label: "Level",    value: `Lvl ${tile.infrastructure_level || 0}`, color: "#fbbf24" },
                { label: "Buildings",value: buildings.length,                    color: "#a78bfa" },
              ].map(s => (
                <div key={s.label} className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-[9px] text-slate-500">{s.label}</div>
                  <div className="text-xs font-bold ep-mono" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {buildings.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Buildings</div>
                <div className="flex flex-wrap gap-1.5">
                  {buildings.map(bid => {
                    const b = BUILDINGS.find(x => x.id === bid);
                    if (!b) return null;
                    return (
                      <span key={bid} className="text-[10px] px-2 py-1 rounded-lg font-bold"
                        style={{ background: `${CAT_COLORS[b.cat]}15`, color: CAT_COLORS[b.cat], border: `1px solid ${CAT_COLORS[b.cat]}30` }}>
                        {b.emoji} {b.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {tile.is_capital && (
              <div className="rounded-xl px-3 py-2 text-xs text-amber-400 font-bold"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                ⭐ National Capital
              </div>
            )}
          </>
        )}

        {/* BUILD tab (my island) */}
        {isMe && activeTab === "build" && (
          <>
            {buildMsg && (
              <div className={`text-xs px-3 py-2 rounded-lg ${buildMsg.includes("!") && !buildMsg.includes("Not") && !buildMsg.includes("Requires") ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                {buildMsg}
              </div>
            )}
            <div className="text-xs text-slate-500">Treasury: <span className="text-amber-400 font-bold ep-mono">{(myNation.currency || 0).toLocaleString()} cr</span></div>
            {cats.map(cat => {
              const CatIcon = CAT_ICONS[cat] || Hammer;
              const catBuildings = availableBuildings.filter(b => b.cat === cat);
              return (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CatIcon size={11} style={{ color: CAT_COLORS[cat] }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CAT_COLORS[cat] }}>
                      {cat}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {catBuildings.map(b => {
                      const built = buildings.includes(b.id);
                      const affordable = (myNation.currency || 0) >= b.cost;
                      return (
                        <button key={b.id} onClick={() => constructBuilding(b)} disabled={building || built || !affordable}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all disabled:opacity-40"
                          style={{
                            background: built ? `${CAT_COLORS[b.cat]}12` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${built ? CAT_COLORS[b.cat] + "40" : "rgba(255,255,255,0.07)"}`,
                            cursor: built ? "not-allowed" : affordable ? "pointer" : "not-allowed",
                          }}>
                          <span className="text-lg shrink-0">{b.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white">{b.label}</div>
                            <div className="text-[10px] text-slate-500">{b.desc}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            {built
                              ? <span className="text-[10px] font-bold text-green-400">✓ Built</span>
                              : <span className={`text-[10px] font-bold ep-mono ${affordable ? "text-amber-400" : "text-red-400"}`}>{b.cost} cr</span>
                            }
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}