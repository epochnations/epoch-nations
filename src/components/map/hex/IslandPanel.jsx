/**
 * IslandPanel — Full-height island command center.
 * Tabs: Overview | Resources | Buildings | Military | Crafting | Inventory
 * Includes battle animation for claims.
 */
import { useState } from "react";
import { X, Hammer, TrendingUp, Shield, Home, Anchor, Package, Swords, FlameKindling } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TERRAIN_CONFIG, generateTerrain, islandPrice, seededRand } from "../HexOceanMap";
import BattleAnimation from "./BattleAnimation";
import CraftingTab from "./CraftingTab";

export const BUILDINGS = [
  { id:"market",      label:"Market",        emoji:"🏪", cat:"economic",      cost:500,  desc:"+8% trade income",      terrain:null },
  { id:"trade_port",  label:"Trade Port",    emoji:"⚓",  cat:"economic",      cost:800,  desc:"+15% export value",     terrain:null },
  { id:"bank",        label:"Bank",          emoji:"🏦", cat:"economic",      cost:1000, desc:"+5% passive interest",  terrain:null },
  { id:"warehouse",   label:"Warehouse",     emoji:"📦", cat:"economic",      cost:400,  desc:"+50 resource storage",  terrain:null },
  { id:"mine",        label:"Mine",          emoji:"⛏️", cat:"industrial",    cost:600,  desc:"+40 iron/stone/tick",   terrain:["rocky","mountains","volcanic"] },
  { id:"lumber_mill", label:"Lumber Mill",   emoji:"🪵", cat:"industrial",    cost:450,  desc:"+40 wood/tick",         terrain:["forest","tropical"] },
  { id:"oil_rig",     label:"Oil Rig",       emoji:"🛢️", cat:"industrial",    cost:1200, desc:"+30 oil/tick",          terrain:["tundra","coastal"] },
  { id:"refinery",    label:"Refinery",      emoji:"🏭", cat:"industrial",    cost:900,  desc:"+20% oil value",        terrain:null },
  { id:"farm",        label:"Farm",          emoji:"🌾", cat:"industrial",    cost:300,  desc:"+50 food/tick",         terrain:["plains","tropical","coastal"] },
  { id:"housing",     label:"Housing",       emoji:"🏠", cat:"civilian",      cost:350,  desc:"+5 population cap",     terrain:null },
  { id:"hospital",    label:"Hospital",      emoji:"🏥", cat:"civilian",      cost:700,  desc:"+10 stability",         terrain:null },
  { id:"school",      label:"School",        emoji:"🏫", cat:"civilian",      cost:500,  desc:"+5 tech pts/day",       terrain:null },
  { id:"fort",        label:"Fort",          emoji:"🏰", cat:"military",      cost:900,  desc:"+20 defense power",     terrain:null },
  { id:"naval_base",  label:"Naval Base",    emoji:"🛳️", cat:"military",      cost:1500, desc:"Naval operations hub",  terrain:null },
  { id:"barracks",    label:"Barracks",      emoji:"⚔️", cat:"military",      cost:600,  desc:"+15 unit power",        terrain:null },
  { id:"radar",       label:"Radar Station", emoji:"📡", cat:"military",      cost:800,  desc:"Fog of war & detection",terrain:null },
  { id:"dock",        label:"Dock",          emoji:"🏗️", cat:"infrastructure",cost:400,  desc:"Trade route endpoint",  terrain:null },
  { id:"road",        label:"Road Network",  emoji:"🛣️", cat:"infrastructure",cost:300,  desc:"+10% resource speed",   terrain:null },
];

const CAT_COLORS = { economic:"#34d399", industrial:"#f97316", civilian:"#60a5fa", military:"#f87171", infrastructure:"#a78bfa" };
const DEV_LABELS = ["Ocean","Outpost","Settlement","Town","City","Capital"];
const DEV_COLORS = ["#64748b","#a78bfa","#60a5fa","#34d399","#fbbf24","#f97316"];

function getResources(tile, myNation) {
  const t = tile?.terrain_type || "plains";
  const b = tile?.buildings || [];
  return [
    { name:"🪵 Wood",  rate: (["forest","tropical"].includes(t)?8:2) + (b.includes("lumber_mill")?40:0), stored: myNation?.res_wood||0 },
    { name:"🪨 Stone", rate: (["rocky","mountains","volcanic"].includes(t)?7:1) + (b.includes("mine")?20:0), stored: myNation?.res_stone||0 },
    { name:"⚙️ Iron",  rate: (["rocky","mountains","volcanic"].includes(t)?5:1) + (b.includes("mine")?40:0), stored: myNation?.res_iron||0 },
    { name:"🌾 Food",  rate: (["plains","tropical","coastal"].includes(t)?9:2) + (b.includes("farm")?50:0), stored: myNation?.res_food||0 },
    { name:"🛢️ Oil",   rate: (["tundra","coastal"].includes(t)?6:0) + (b.includes("oil_rig")?30:0), stored: myNation?.res_oil||0 },
    { name:"🥇 Gold",  rate: (t==="desert"?5:1), stored: myNation?.res_gold||0 },
  ];
}

export default function IslandPanel({ hex, myNation, tiles, allNations, onClose, onPurchase, onClaim, onRefresh }) {
  const { q, r, tile } = hex;
  const terrain = tile?.terrain_type || generateTerrain(q, r);
  const cfg = TERRAIN_CONFIG[terrain] || TERRAIN_CONFIG.tropical;
  const isOwned = !!tile;
  const isMe = tile?.owner_nation_id === myNation?.id;
  const isEnemy = !isMe && isOwned && (myNation?.at_war_with||[]).includes(tile?.owner_nation_id);
  const buildings = tile?.buildings || [];
  const level = Math.min(5, tile?.infrastructure_level || 0);

  const nearby = tiles.filter(t => Math.hypot(t.q-q, t.r-r) <= 4).length;
  const price = islandPrice(q, r, nearby);
  const canAfford = (myNation?.currency||0) >= price;
  const ownerNation = allNations?.find(n => n.id === tile?.owner_nation_id);
  const milBuildings = buildings.filter(b => ["fort","barracks","naval_base","radar"].includes(b));
  const islandDefense = milBuildings.length * 10 + 10;
  const myPower = (myNation?.unit_power||10) + (myNation?.defense_level||10);
  const cats = [...new Set(BUILDINGS.map(b => b.cat))];
  const resources = getResources(tile, myNation);

  // Tab config
  const tabs = isMe
    ? [
        { id:"overview",   label:"Overview",  icon:"🏝️" },
        { id:"resources",  label:"Resources", icon:"⚡" },
        { id:"buildings",  label:"Build",     icon:"🏗️" },
        { id:"military",   label:"Military",  icon:"⚔️" },
        { id:"crafting",   label:"Craft",     icon:"🔨" },
        { id:"inventory",  label:"Inventory", icon:"📦" },
      ]
    : isOwned
    ? [
        { id:"overview",   label:"Overview",  icon:"🏝️" },
        { id:"resources",  label:"Resources", icon:"⚡" },
      ]
    : [{ id:"overview", label:"Overview", icon:"🏝️" }];

  const [activeTab, setActiveTab] = useState("overview");
  const [building, setBuilding] = useState(false);
  const [buildMsg, setBuildMsg] = useState(null);
  const [claimResult, setClaimResult] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [buildCat, setBuildCat] = useState("economic");
  const [showBattle, setShowBattle] = useState(false);

  async function constructBuilding(b) {
    if (!myNation||!tile||!isMe) return;
    if ((myNation.currency||0) < b.cost) { setBuildMsg("Not enough credits!"); return; }
    if (buildings.includes(b.id)) { setBuildMsg("Already built!"); return; }
    if (b.terrain && !b.terrain.includes(terrain)) { setBuildMsg(`Requires: ${b.terrain.join(" or ")} terrain`); return; }

    setBuilding(true); setBuildMsg(null);
    const nb = [...buildings, b.id];
    const upd = { buildings: nb, infrastructure_level: Math.min(5, level+1) };
    if (b.id==="trade_port") upd.has_trade_port = true;
    if (["fort","barracks","naval_base"].includes(b.id)) upd.has_military_base = true;
    if (!tile.has_city && nb.length >= 3) upd.has_city = true;

    const nu = { currency: (myNation.currency||0)-b.cost };
    if (b.id==="farm")        nu.res_food        = (myNation.res_food||0)+100;
    if (b.id==="mine")        nu.res_iron         = (myNation.res_iron||0)+60;
    if (b.id==="lumber_mill") nu.res_wood         = (myNation.res_wood||0)+80;
    if (b.id==="oil_rig")     nu.res_oil          = (myNation.res_oil||0)+50;
    if (b.id==="fort")        nu.defense_level    = (myNation.defense_level||10)+20;
    if (b.id==="barracks")    nu.unit_power       = (myNation.unit_power||10)+15;
    if (b.id==="housing")     nu.housing_capacity = (myNation.housing_capacity||20)+5;

    await Promise.all([
      base44.entities.HexTile.update(tile.id, upd),
      base44.entities.Nation.update(myNation.id, nu),
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

  async function handleBattleComplete(won) {
    setShowBattle(false);
    const success = won ? await onClaim(tile) : false;
    setClaimResult(success ? "victory" : "repelled");
    onRefresh?.();
  }

  return (
    <>
      {/* Battle animation overlay */}
      {showBattle && (
        <BattleAnimation
          attackerNation={myNation}
          defenderTile={tile}
          onComplete={handleBattleComplete}
        />
      )}

      <div
        className="absolute flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          top: "44px",
          right: "8px",
          bottom: "8px",
          width: "min(420px, calc(100vw - 16px))",
          zIndex: 50,
          background: "rgba(3,8,18,0.98)",
          border: "1px solid rgba(34,211,238,0.25)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 0 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(34,211,238,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onMouseMove={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0 px-4 pt-3 pb-2.5"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", background:`linear-gradient(135deg, ${cfg.rColor}10 0%, rgba(139,92,246,0.05) 100%)` }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background:`${cfg.rColor}18`, border:`1px solid ${cfg.rColor}35`, boxShadow:`0 0 20px ${cfg.rColor}20` }}>
                {cfg.emoji}
              </div>
              <div>
                <div className="text-sm font-black text-white leading-tight">
                  {tile?.is_capital ? `⭐ ${tile.owner_nation_name} Capital`
                    : tile?.city_name || (isOwned ? `${cfg.label} Island` : `${cfg.label} Territory`)}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500 ep-mono">({q},{r})</span>
                  <span className="text-[10px] font-bold" style={{ color: cfg.rColor }}>{cfg.emoji} {cfg.label}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors shrink-0 mt-0.5">
              <X size={14}/>
            </button>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {!isOwned ? (
              <span className="text-[9px] px-2.5 py-1 rounded-full font-bold text-amber-300 border"
                style={{ background:"rgba(251,191,36,0.12)", borderColor:"rgba(251,191,36,0.25)" }}>
                🌊 Unclaimed Territory
              </span>
            ) : (
              <>
                <span className="text-[9px] px-2.5 py-1 rounded-full font-bold border"
                  style={{ background:`${DEV_COLORS[level]}12`, color:DEV_COLORS[level], borderColor:`${DEV_COLORS[level]}28` }}>
                  {DEV_LABELS[level]} · Level {level}/5
                </span>
                {isMe && <span className="text-[9px] px-2.5 py-1 rounded-full font-bold text-cyan-400 border border-cyan-500/20 bg-cyan-500/08">✅ Owned</span>}
                {isEnemy && <span className="text-[9px] px-2.5 py-1 rounded-full font-bold text-red-400 border border-red-500/20 bg-red-500/08">⚔️ Enemy Territory</span>}
                {tile?.has_trade_port && <span className="text-[9px] px-2.5 py-1 rounded-full font-bold text-green-400 border border-green-500/20 bg-green-500/08">⚓ Trade Port</span>}
                {tile?.has_military_base && <span className="text-[9px] px-2.5 py-1 rounded-full font-bold text-orange-400 border border-orange-500/20 bg-orange-500/08">🏰 Fortified</span>}
                {buildings.length > 0 && <span className="text-[9px] px-2.5 py-1 rounded-full font-bold text-slate-400 border border-white/10 bg-white/04">{buildings.length} Buildings</span>}
              </>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 flex overflow-x-auto" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", scrollbarWidth:"none" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1 px-3 py-2.5 text-[10px] font-bold whitespace-nowrap border-b-2 transition-all shrink-0"
              style={{
                borderColor: activeTab===t.id ? "#22d3ee" : "transparent",
                color: activeTab===t.id ? "#22d3ee" : "#4b5563",
                background: activeTab===t.id ? "rgba(34,211,238,0.05)" : "transparent",
              }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(34,211,238,0.2) transparent" }}>

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="p-4 space-y-3">

              {/* Core stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:"Owner",    value: isOwned ? (tile.owner_nation_name||"Unknown") : "Unclaimed", color:"#22d3ee" },
                  { label:"Terrain",  value: `${cfg.emoji} ${cfg.label}`,              color: cfg.rColor },
                  { label:"Level",    value: `${DEV_LABELS[level]} (${level}/5)`,       color: DEV_COLORS[level] },
                  { label:"Defense",  value: `${islandDefense} power`,                  color:"#f87171" },
                  { label:"Coords",   value: `${q}, ${r}`,                              color:"#94a3b8" },
                  { label:"Buildings",value: `${buildings.length} installed`,            color:"#a78bfa" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl px-3 py-2.5"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">{s.label}</div>
                    <div className="text-xs font-bold ep-mono truncate" style={{ color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Quick resource preview */}
              <div className="rounded-xl p-3"
                style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Resource Production / Tick</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {resources.map(res => (
                    <div key={res.name} className="flex items-center gap-1">
                      <span className="text-[11px]">{res.name.split(" ")[0]}</span>
                      <span className={`text-[10px] font-bold ep-mono ${res.rate > 0 ? "text-green-400" : "text-slate-600"}`}>
                        {res.rate > 0 ? `+${res.rate}` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner nation card (if not mine) */}
              {isOwned && !isMe && ownerNation && (
                <div className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background:`${ownerNation.flag_color||"#3b82f6"}20`, border:`1px solid ${ownerNation.flag_color||"#3b82f6"}30` }}>
                    {ownerNation.flag_emoji||"🏴"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{ownerNation.name}</div>
                    <div className="text-[10px] text-slate-500">{ownerNation.epoch} · {ownerNation.government_type}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] text-slate-500">Total Power</div>
                    <div className="text-base font-black text-red-400">⚔️ {(ownerNation.unit_power||0)+(ownerNation.defense_level||0)}</div>
                  </div>
                </div>
              )}

              {/* Purchase unclaimed */}
              {!isOwned && myNation && (
                <div className="space-y-2">
                  <div className="rounded-xl p-3 space-y-2"
                    style={{ background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.15)" }}>
                    <div className="text-xs font-bold text-cyan-400 mb-1">🏝️ Island Acquisition</div>
                    {[
                      ["Island Price", `${price.toLocaleString()} cr`, "text-amber-400"],
                      ["Your Treasury", `${(myNation.currency||0).toLocaleString()} cr`, canAfford?"text-green-400":"text-red-400"],
                      ["Nearby Islands", `${nearby} nearby`, "text-slate-300"],
                    ].map(([l,v,c]) => (
                      <div key={l} className="flex justify-between text-xs">
                        <span className="text-slate-400">{l}</span>
                        <span className={`font-bold ep-mono ${c}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={async () => { setPurchasing(true); await onPurchase(q,r); setPurchasing(false); }}
                    disabled={!canAfford||purchasing}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:brightness-110"
                    style={{ background: canAfford?"linear-gradient(135deg,#0891b2,#0e7490,#0891b2)":"rgba(255,255,255,0.05)",
                      backgroundSize:"200% 100%", animation: canAfford?"shimmerBtn 3s linear infinite":"none" }}>
                    {purchasing ? "⏳ Processing…" : canAfford ? `🏝️ Purchase Island — ${price.toLocaleString()} cr` : `⚠ Need ${(price-(myNation.currency||0)).toLocaleString()} more cr`}
                  </button>
                </div>
              )}

              {/* Claim enemy island */}
              {isOwned && !isMe && myNation && (
                <div className="space-y-2">
                  <div className="rounded-xl p-3"
                    style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
                    <div className="text-xs font-bold text-red-400 mb-2">⚔️ Military Claim — Naval Combat</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="text-center rounded-lg py-2.5" style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)" }}>
                        <div className="text-[9px] text-slate-400 mb-0.5">Your Fleet Power</div>
                        <div className="text-xl font-black text-green-400">{myPower}</div>
                      </div>
                      <div className="text-center rounded-lg py-2.5" style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
                        <div className="text-[9px] text-slate-400 mb-0.5">Island Defense</div>
                        <div className="text-xl font-black text-red-400">{islandDefense}</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Win probability</span>
                      <span className="font-bold text-amber-400">~{Math.round(Math.min(90, Math.max(10, (myPower/(myPower+islandDefense))*100)))}%</span>
                    </div>
                  </div>
                  {claimResult && (
                    <div className={`text-sm px-3 py-2.5 rounded-xl font-bold text-center ${claimResult==="victory"?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                      {claimResult==="victory" ? "🏆 Island Captured! Ownership transferred." : "🛡️ Assault Repelled by coastal defenses!"}
                    </div>
                  )}
                  {!claimResult && (
                    <button onClick={() => setShowBattle(true)}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 flex items-center justify-center gap-2"
                      style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)" }}>
                      <Swords size={14}/> Launch Naval Assault on {tile.owner_nation_name}
                    </button>
                  )}
                </div>
              )}

              {tile?.is_capital && (
                <div className="rounded-xl px-3 py-2 text-xs text-amber-400 font-bold text-center"
                  style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.18)" }}>
                  ⭐ National Capital of {tile.owner_nation_name}
                </div>
              )}
            </div>
          )}

          {/* ── RESOURCES ── */}
          {activeTab === "resources" && (
            <div className="p-4 space-y-2">
              <div className="text-[10px] text-slate-500 leading-relaxed mb-1">
                Production per game tick · Total reflects national stockpile
              </div>
              {resources.map(res => (
                <div key={res.name} className="rounded-xl p-3"
                  style={{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-white">{res.name}</span>
                    <span className={`text-xs font-bold ep-mono ${res.rate>4?"text-green-400":res.rate>0?"text-cyan-400":"text-slate-600"}`}>
                      {res.rate > 0 ? `+${res.rate}/tick` : "None"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/08">
                      <div className="h-full rounded-full transition-all" style={{
                        width:`${Math.min(100,(res.stored/5000)*100)}%`,
                        background: res.rate > 0 ? "linear-gradient(90deg,#22d3ee,#4ade80)" : "#374151",
                      }}/>
                    </div>
                    <span className="text-[10px] text-slate-400 ep-mono w-16 text-right shrink-0">{res.stored.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BUILDINGS ── */}
          {activeTab === "buildings" && isMe && (
            <div className="p-4 space-y-3">
              {buildMsg && (
                <div className={`text-xs px-3 py-2 rounded-lg ${buildMsg.startsWith("✅")?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                  {buildMsg}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Treasury Available</span>
                <span className="text-sm font-bold text-amber-400 ep-mono">{(myNation.currency||0).toLocaleString()} cr</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {cats.map(cat => (
                  <button key={cat} onClick={() => setBuildCat(cat)}
                    className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-all"
                    style={{
                      background: buildCat===cat ? `${CAT_COLORS[cat]}18` : "rgba(255,255,255,0.03)",
                      borderColor: buildCat===cat ? `${CAT_COLORS[cat]}45` : "rgba(255,255,255,0.07)",
                      color: buildCat===cat ? CAT_COLORS[cat] : "#64748b",
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                {BUILDINGS.filter(b => b.cat === buildCat).map(b => {
                  const built = buildings.includes(b.id);
                  const affordable = (myNation.currency||0) >= b.cost;
                  const compatible = !b.terrain || b.terrain.includes(terrain);
                  return (
                    <button key={b.id} onClick={() => constructBuilding(b)}
                      disabled={building||built||!affordable||!compatible}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:brightness-110"
                      style={{
                        background: built ? `${CAT_COLORS[b.cat]}0d` : compatible&&affordable ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${built ? CAT_COLORS[b.cat]+"30" : "rgba(255,255,255,0.07)"}`,
                        opacity: (!compatible||(!built&&!affordable)) ? 0.45 : 1,
                      }}>
                      <span className="text-xl shrink-0">{b.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white">{b.label}</div>
                        <div className="text-[10px] text-slate-500">{b.desc}</div>
                        {b.terrain && !compatible && <div className="text-[9px] text-orange-400 mt-0.5">Requires: {b.terrain.join("/")} terrain</div>}
                      </div>
                      <div className="shrink-0 text-right">
                        {built ? <span className="text-[11px] font-bold text-green-400">✓ Built</span>
                          : <span className={`text-[10px] font-bold ep-mono ${affordable?"text-amber-400":"text-red-400"}`}>{b.cost} cr</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── MILITARY ── */}
          {activeTab === "military" && isMe && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 text-center" style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)" }}>
                  <div className="text-[9px] text-slate-400 mb-1">Island Defense</div>
                  <div className="text-3xl font-black text-red-400">{islandDefense}</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)" }}>
                  <div className="text-[9px] text-slate-400 mb-1">Nation Power</div>
                  <div className="text-3xl font-black text-green-400">{(myNation?.unit_power||0)+(myNation?.defense_level||0)}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Military Installations</div>
                {milBuildings.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-5 rounded-xl"
                    style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    No military buildings.<br/>
                    <span className="text-slate-600">Go to Build → Military</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {milBuildings.map(bid => {
                      const b = BUILDINGS.find(x => x.id===bid);
                      if (!b) return null;
                      return (
                        <div key={bid} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                          style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.14)" }}>
                          <span className="text-xl">{b.emoji}</span>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-white">{b.label}</div>
                            <div className="text-[10px] text-slate-500">{b.desc}</div>
                          </div>
                          <span className="text-[10px] text-red-400 font-bold">+10 def</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="rounded-xl p-3 space-y-1"
                style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-bold text-slate-300 text-xs mb-1.5">Defense Tips</div>
                {[
                  "🏰 Fort → +20 defense, hardened position",
                  "⚔️ Barracks → +15 attack power",
                  "🛳️ Naval Base → enables sea operations",
                  "📡 Radar → detects enemy movements",
                ].map(tip => <div key={tip} className="text-[10px] text-slate-500">{tip}</div>)}
              </div>
            </div>
          )}

          {/* ── CRAFTING ── */}
          {activeTab === "crafting" && isMe && (
            <CraftingTab myNation={myNation} onRefresh={onRefresh} />
          )}

          {/* ── INVENTORY ── */}
          {activeTab === "inventory" && (
            <div className="p-4 space-y-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nation Stockpile</div>
              <div className="grid grid-cols-2 gap-2">
                {resources.map(res => (
                  <div key={res.name} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-sm">{res.name.split(" ")[0]}</span>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white ep-mono">{res.stored.toLocaleString()}</div>
                      {res.rate > 0 && <div className="text-[9px] text-green-400">+{res.rate}/tick</div>}
                    </div>
                  </div>
                ))}
              </div>
              {buildings.length > 0 && (
                <>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Buildings Installed</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {buildings.map(bid => {
                      const b = BUILDINGS.find(x => x.id===bid);
                      if (!b) return null;
                      return (
                        <div key={bid} className="flex items-center gap-2 rounded-xl px-3 py-2"
                          style={{ background:`${CAT_COLORS[b.cat]}0d`, border:`1px solid ${CAT_COLORS[b.cat]}20` }}>
                          <span className="text-base">{b.emoji}</span>
                          <span className="text-[10px] font-bold text-white truncate">{b.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {myNation && (
                <div className="rounded-xl p-3 space-y-1.5"
                  style={{ background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.12)" }}>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Treasury</div>
                  {[
                    ["Credits", `${(myNation.currency||0).toLocaleString()} cr`, "text-amber-400"],
                    ["GDP", `${(myNation.gdp||0).toLocaleString()}`, "text-green-400"],
                    ["Population", `${(myNation.population||0)}M`, "text-blue-400"],
                  ].map(([l,v,c]) => (
                    <div key={l} className="flex justify-between text-xs">
                      <span className="text-slate-400">{l}</span>
                      <span className={`font-bold ep-mono ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmerBtn {
          0%   { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
}