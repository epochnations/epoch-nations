/**
 * IslandPanel — Full island interaction panel.
 * Info, Inventory, Build, Purchase, and Claim/War tabs.
 */
import { useState } from "react";
import { X, Hammer, TrendingUp, Shield, Home, Anchor, Package, Swords, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TERRAIN_CONFIG, generateTerrain, islandPrice, seededRand } from "../HexOceanMap";

const BUILDINGS = [
  { id:"market",      label:"Market",        emoji:"🏪", cat:"economic",      cost:500,  desc:"+8% trade income",      terrain:null },
  { id:"trade_port",  label:"Trade Port",    emoji:"⚓",  cat:"economic",      cost:800,  desc:"+15% exports",          terrain:null },
  { id:"bank",        label:"Bank",          emoji:"🏦", cat:"economic",      cost:1000, desc:"+5% interest rate",     terrain:null },
  { id:"warehouse",   label:"Warehouse",     emoji:"📦", cat:"economic",      cost:400,  desc:"+50 resource cap",      terrain:null },
  { id:"mine",        label:"Mine",          emoji:"⛏️", cat:"industrial",    cost:600,  desc:"+40 iron/stone",        terrain:["rocky","mountains","volcanic"] },
  { id:"lumber_mill", label:"Lumber Mill",   emoji:"🪵", cat:"industrial",    cost:450,  desc:"+40 wood/tick",         terrain:["forest","tropical"] },
  { id:"oil_rig",     label:"Oil Rig",       emoji:"🛢️", cat:"industrial",    cost:1200, desc:"+30 oil/tick",          terrain:["tundra","coastal"] },
  { id:"refinery",    label:"Refinery",      emoji:"🏭", cat:"industrial",    cost:900,  desc:"+20% oil value",        terrain:null },
  { id:"farm",        label:"Farm",          emoji:"🌾", cat:"industrial",    cost:300,  desc:"+50 food/tick",         terrain:["plains","tropical","coastal"] },
  { id:"housing",     label:"Housing",       emoji:"🏠", cat:"civilian",      cost:350,  desc:"+5 pop cap",            terrain:null },
  { id:"hospital",    label:"Hospital",      emoji:"🏥", cat:"civilian",      cost:700,  desc:"+10 stability",         terrain:null },
  { id:"school",      label:"School",        emoji:"🏫", cat:"civilian",      cost:500,  desc:"+5 tech pts/day",       terrain:null },
  { id:"fort",        label:"Fort",          emoji:"🏰", cat:"military",      cost:900,  desc:"+20 defense",           terrain:null },
  { id:"naval_base",  label:"Naval Base",    emoji:"🛳️", cat:"military",      cost:1500, desc:"Naval ops hub",         terrain:null },
  { id:"barracks",    label:"Barracks",      emoji:"⚔️", cat:"military",      cost:600,  desc:"+15 unit power",        terrain:null },
  { id:"radar",       label:"Radar Station", emoji:"📡", cat:"military",      cost:800,  desc:"Fog of war reveal",     terrain:null },
  { id:"dock",        label:"Dock",          emoji:"🏗️", cat:"infrastructure",cost:400,  desc:"Trade route endpoint",  terrain:null },
  { id:"road",        label:"Road Network",  emoji:"🛣️", cat:"infrastructure",cost:300,  desc:"+10% resource speed",   terrain:null },
];

const CAT_ICONS = { economic:TrendingUp, industrial:Hammer, civilian:Home, military:Shield, infrastructure:Anchor };
const CAT_COLORS = { economic:"#34d399", industrial:"#f97316", civilian:"#60a5fa", military:"#f87171", infrastructure:"#a78bfa" };

// Resource production per terrain + building
function getResources(tile, myNation) {
  const t = tile?.terrain_type || "plains";
  const b = tile?.buildings || [];
  const base = {
    "🪵 Wood":   { rate: ["forest","tropical"].includes(t)?8:2,     stored: myNation?.res_wood||0 },
    "🪨 Stone":  { rate: ["rocky","mountains","volcanic"].includes(t)?7:1, stored: myNation?.res_stone||0 },
    "⚙️ Iron":   { rate: ["rocky","mountains","volcanic"].includes(t)?5:1, stored: myNation?.res_iron||0 },
    "🌾 Food":   { rate: ["plains","tropical","coastal"].includes(t)?9:2, stored: myNation?.res_food||0 },
    "🛢️ Oil":    { rate: ["tundra","coastal"].includes(t)?6:0,       stored: myNation?.res_oil||0 },
    "🥇 Gold":   { rate: t==="desert"?5:1,                           stored: myNation?.res_gold||0 },
  };
  // Building bonuses
  if (b.includes("lumber_mill")) base["🪵 Wood"].rate += 40;
  if (b.includes("mine"))        { base["⚙️ Iron"].rate += 40; base["🪨 Stone"].rate += 20; }
  if (b.includes("farm"))        base["🌾 Food"].rate += 50;
  if (b.includes("oil_rig"))     base["🛢️ Oil"].rate += 30;
  return base;
}

export default function IslandPanel({ hex, myNation, tiles, allNations, onClose, onPurchase, onClaim, onRefresh }) {
  const { q, r, tile } = hex;
  const terrain = tile?.terrain_type || generateTerrain(q, r);
  const cfg = TERRAIN_CONFIG[terrain] || TERRAIN_CONFIG.tropical;
  const isOwned = !!tile;
  const isMe = tile?.owner_nation_id === myNation?.id;
  const isEnemy = !isMe && isOwned && (myNation?.at_war_with||[]).includes(tile?.owner_nation_id);
  const buildings = tile?.buildings || [];

  const nearby = tiles.filter(t => Math.hypot(t.q-q, t.r-r) <= 4).length;
  const price = islandPrice(q, r, nearby);
  const canAfford = (myNation?.currency||0) >= price;

  const ownerNation = allNations?.find(n => n.id === tile?.owner_nation_id);

  // Available tabs
  const tabs = isMe
    ? [["info","ℹ️ Info"],["inventory","📦 Items"],["build","🏗️ Build"]]
    : isOwned
    ? [["info","ℹ️ Info"],["inventory","📦 Items"]]
    : [["info","ℹ️ Info"]];

  const [activeTab, setActiveTab] = useState("info");
  const [building, setBuilding] = useState(false);
  const [buildMsg, setBuildMsg] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const resources = getResources(tile, myNation);

  const level = Math.min(5, tile?.infrastructure_level||0);
  const devLabels = ["Ocean","Outpost","Settlement","Town","City","Capital"];

  async function constructBuilding(b) {
    if (!myNation||!tile||!isMe) return;
    if ((myNation.currency||0) < b.cost) { setBuildMsg("Not enough credits!"); return; }
    if (buildings.includes(b.id)) { setBuildMsg("Already built!"); return; }
    if (b.terrain && !b.terrain.includes(terrain)) { setBuildMsg(`Requires: ${b.terrain.join(" or ")} terrain`); return; }

    setBuilding(true); setBuildMsg(null);
    const newBuildings = [...buildings, b.id];
    const upd = { buildings: newBuildings, infrastructure_level: Math.min(5, level+1) };
    if (b.id==="trade_port") upd.has_trade_port = true;
    if (["fort","barracks","naval_base"].includes(b.id)) upd.has_military_base = true;
    if (!tile.has_city && newBuildings.length >= 3) upd.has_city = true;

    const nUpd = { currency: (myNation.currency||0)-b.cost };
    if (b.id==="farm")        nUpd.res_food       = (myNation.res_food||0)+100;
    if (b.id==="mine")        nUpd.res_iron        = (myNation.res_iron||0)+60;
    if (b.id==="lumber_mill") nUpd.res_wood        = (myNation.res_wood||0)+80;
    if (b.id==="oil_rig")     nUpd.res_oil         = (myNation.res_oil||0)+50;
    if (b.id==="fort")        nUpd.defense_level   = (myNation.defense_level||10)+20;
    if (b.id==="barracks")    nUpd.unit_power      = (myNation.unit_power||10)+15;
    if (b.id==="housing")     nUpd.housing_capacity= (myNation.housing_capacity||20)+5;

    await Promise.all([
      base44.entities.HexTile.update(tile.id, upd),
      base44.entities.Nation.update(myNation.id, nUpd),
    ]);
    await base44.entities.ChatMessage.create({
      channel:"global", sender_nation_name:"CONSTRUCTION BUREAU",
      sender_flag:"🏗️", sender_color:"#f97316", sender_role:"system",
      content:`🏗️ BUILT — ${myNation.flag_emoji} ${myNation.name} constructed a ${b.emoji} ${b.label} on island (${q},${r})!`,
    }).catch(()=>{});

    setBuildMsg(`✅ ${b.emoji} ${b.label} constructed!`);
    setBuilding(false);
    onRefresh?.();
  }

  async function doPurchase() {
    setPurchasing(true);
    await onPurchase(q, r);
    setPurchasing(false);
  }

  async function doClaim() {
    setClaiming(true);
    setClaimResult(null);
    const success = await onClaim(tile);
    setClaimResult(success ? "victory" : "repelled");
    setClaiming(false);
    onRefresh?.();
  }

  const availableBuildings = BUILDINGS.filter(b => !b.terrain || b.terrain.includes(terrain));
  const cats = [...new Set(availableBuildings.map(b => b.cat))];

  return (
    <div
      className="absolute z-40 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        bottom: "56px", left: "12px",
        width: "min(300px, calc(100vw - 24px))",
        maxHeight: "calc(100% - 80px)",
        background: "rgba(5,14,28,0.97)",
        border: "1px solid rgba(34,211,238,0.22)",
        backdropFilter: "blur(18px)",
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{cfg.emoji}</span>
            <div>
              <div className="text-sm font-bold text-white leading-tight">
                {tile?.city_name || (tile?.is_capital ? `${tile.owner_nation_name} Capital` : `${cfg.label} Island`)}
              </div>
              <div className="text-[10px] text-slate-500 ep-mono">({q},{r}) · {cfg.label}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
            <X size={13}/>
          </button>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {!isOwned ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-amber-300"
              style={{ background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.3)" }}>
              🌊 Unclaimed Territory
            </span>
          ) : (
            <>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={{ background:`${cfg.rColor}18`, color:cfg.rColor, border:`1px solid ${cfg.rColor}35` }}>
                {cfg.emoji} {cfg.label}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-amber-400"
                style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)" }}>
                Lvl {level} · {devLabels[level]}
              </span>
              {isMe && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-cyan-400"
                style={{ background:"rgba(34,211,238,0.1)", border:"1px solid rgba(34,211,238,0.3)" }}>
                ✅ Owned
              </span>}
              {tile?.is_capital && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-yellow-400"
                style={{ background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.4)" }}>
                ⭐ Capital
              </span>}
              {isEnemy && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-red-400"
                style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)" }}>
                ⚔️ At War
              </span>}
            </>
          )}
        </div>

        {/* Owner info (if not mine) */}
        {isOwned && !isMe && ownerNation && (
          <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <span>{ownerNation.flag_emoji||"🏴"}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">{ownerNation.name}</div>
              <div className="text-[10px] text-slate-500">{ownerNation.epoch} · {ownerNation.government_type}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-500">Military</div>
              <div className="text-[10px] font-bold text-red-400">⚔️ {ownerNation.unit_power||0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex px-4 pt-2 gap-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="pb-2 text-[11px] font-bold border-b-2 transition-all"
            style={{ borderColor: activeTab===id?"#22d3ee":"transparent", color: activeTab===id?"#22d3ee":"#64748b" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* ── INFO TAB ── */}
        {activeTab === "info" && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label:"Owner",     value: isOwned ? tile.owner_nation_name : "Unclaimed", color:"#22d3ee" },
                { label:"Terrain",   value: cfg.label,                                       color:cfg.rColor },
                { label:"Dev Level", value: `${devLabels[level]} (${level}/5)`,              color:"#fbbf24" },
                { label:"Buildings", value: `${buildings.length} built`,                     color:"#a78bfa" },
              ].map(s => (
                <div key={s.label} className="rounded-lg px-2.5 py-2"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-[9px] text-slate-500 mb-0.5">{s.label}</div>
                  <div className="text-[11px] font-bold ep-mono truncate" style={{ color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Resource production */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Resource Production</div>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(resources).filter(([,v]) => v.rate > 0).map(([name, v]) => (
                  <div key={name} className="flex items-center justify-between rounded-lg px-2 py-1.5"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-[10px] text-slate-300">{name}</span>
                    <span className="text-[10px] font-bold text-green-400 ep-mono">+{v.rate}/tick</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase button */}
            {!isOwned && myNation && (
              <div className="space-y-2">
                <div className="rounded-xl p-3 space-y-1.5"
                  style={{ background:"rgba(34,211,238,0.05)", border:"1px solid rgba(34,211,238,0.15)" }}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Island Price</span>
                    <span className="font-black text-amber-400 ep-mono">{price.toLocaleString()} cr</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Your Treasury</span>
                    <span className={`font-bold ep-mono ${canAfford?"text-green-400":"text-red-400"}`}>
                      {(myNation.currency||0).toLocaleString()} cr
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">Nearby: {nearby} islands · Resources on purchase</div>
                </div>
                <button onClick={doPurchase} disabled={!canAfford||purchasing}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all"
                  style={{ background: canAfford?"linear-gradient(135deg,#0891b2,#0e7490)":"rgba(255,255,255,0.07)" }}>
                  {purchasing ? "Processing…" : canAfford ? `🏝️ Purchase — ${price.toLocaleString()} cr` : `⚠ Need ${(price-(myNation.currency||0)).toLocaleString()} more cr`}
                </button>
              </div>
            )}

            {/* Claim/attack button for enemy island */}
            {isOwned && !isMe && myNation && (
              <div className="space-y-2">
                <div className="rounded-xl p-3 text-xs space-y-1.5"
                  style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)" }}>
                  <div className="font-bold text-red-400">⚔️ Island Claim</div>
                  <div className="text-slate-400">Your military power vs island defenses. Success depends on your strength.</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Your Power</span>
                    <span className="text-green-400 font-bold ep-mono">{(myNation.unit_power||0)+(myNation.defense_level||0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Island Defense</span>
                    <span className="text-red-400 font-bold ep-mono">
                      {buildings.filter(b=>["fort","barracks","naval_base","radar"].includes(b)).length * 10 + 10}
                    </span>
                  </div>
                </div>
                {claimResult && (
                  <div className={`text-xs px-3 py-2 rounded-lg font-bold text-center ${claimResult==="victory"?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                    {claimResult==="victory" ? "🏆 Island Captured!" : "🛡️ Assault Repelled!"}
                  </div>
                )}
                <button onClick={doClaim} disabled={claiming}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)" }}>
                  <Swords size={12}/>
                  {claiming ? "Attacking…" : `⚔️ Declare Claim on ${tile.owner_nation_name}`}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── INVENTORY TAB ── */}
        {activeTab === "inventory" && (
          <>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Resources Stored</div>
              <div className="space-y-1">
                {Object.entries(resources).map(([name, v]) => (
                  <div key={name} className="flex items-center justify-between rounded-lg px-3 py-1.5"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-[11px] text-slate-300">{name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-green-400 ep-mono">+{v.rate}/tick</span>
                      <span className="text-[10px] font-bold text-white ep-mono">{v.stored.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {buildings.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Buildings on Island</div>
                <div className="space-y-1">
                  {buildings.map(bid => {
                    const b = BUILDINGS.find(x => x.id===bid);
                    if (!b) return null;
                    return (
                      <div key={bid} className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                        style={{ background:`${CAT_COLORS[b.cat]}0d`, border:`1px solid ${CAT_COLORS[b.cat]}25` }}>
                        <span>{b.emoji}</span>
                        <span className="text-xs font-bold text-white flex-1">{b.label}</span>
                        <span className="text-[9px]" style={{ color:CAT_COLORS[b.cat] }}>{b.cat}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {buildings.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">No buildings yet.{isMe?" Go to Build tab to construct.":""}</div>
            )}

            {/* Military summary */}
            {tile?.has_military_base && (
              <div className="rounded-xl p-3 space-y-1.5"
                style={{ background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)" }}>
                <div className="text-[10px] font-bold text-red-400">Military Presence</div>
                {buildings.filter(b=>["fort","barracks","naval_base","radar"].includes(b)).map(bid => {
                  const b = BUILDINGS.find(x=>x.id===bid);
                  return b ? <div key={bid} className="text-xs text-slate-300">{b.emoji} {b.label}</div> : null;
                })}
              </div>
            )}
          </>
        )}

        {/* ── BUILD TAB ── */}
        {activeTab === "build" && isMe && (
          <>
            {buildMsg && (
              <div className={`text-xs px-3 py-2 rounded-lg ${buildMsg.startsWith("✅")?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                {buildMsg}
              </div>
            )}
            <div className="text-xs text-slate-500 flex justify-between">
              <span>Treasury</span>
              <span className="text-amber-400 font-bold ep-mono">{(myNation.currency||0).toLocaleString()} cr</span>
            </div>

            {cats.map(cat => {
              const CatIcon = CAT_ICONS[cat]||Hammer;
              const catBuildings = availableBuildings.filter(b => b.cat===cat);
              return (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CatIcon size={11} style={{ color:CAT_COLORS[cat] }}/>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:CAT_COLORS[cat] }}>{cat}</span>
                  </div>
                  <div className="space-y-1">
                    {catBuildings.map(b => {
                      const built = buildings.includes(b.id);
                      const affordable = (myNation.currency||0) >= b.cost;
                      return (
                        <button key={b.id} onClick={() => constructBuilding(b)}
                          disabled={building||built||!affordable}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all disabled:opacity-40"
                          style={{
                            background: built?`${CAT_COLORS[b.cat]}10`:"rgba(255,255,255,0.03)",
                            border:`1px solid ${built?CAT_COLORS[b.cat]+"35":"rgba(255,255,255,0.07)"}`,
                          }}>
                          <span className="text-base shrink-0">{b.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white">{b.label}</div>
                            <div className="text-[10px] text-slate-500">{b.desc}</div>
                          </div>
                          <div className="shrink-0">
                            {built
                              ? <span className="text-[10px] font-bold text-green-400">✓</span>
                              : <span className={`text-[10px] font-bold ep-mono ${affordable?"text-amber-400":"text-red-400"}`}>{b.cost} cr</span>
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