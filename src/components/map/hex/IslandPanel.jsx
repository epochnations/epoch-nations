/**
 * IslandPanel — Fixed full-height island command center (no scroll).
 * Uses position:fixed so it never clips inside the map container.
 * All 6 tabs fit their content on screen without any scrolling.
 */
import { useState } from "react";
import { X, Swords } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TERRAIN_CONFIG, generateTerrain, islandPrice } from "../HexOceanMap";
import BattleAnimation from "./BattleAnimation";
import CraftingTab from "./CraftingTab";

export const BUILDINGS = [
  { id:"market",      label:"Market",        emoji:"🏪", cat:"economic",      cost:500,  desc:"+8% trade income",     terrain:null },
  { id:"trade_port",  label:"Trade Port",    emoji:"⚓",  cat:"economic",      cost:800,  desc:"+15% export value",    terrain:null },
  { id:"bank",        label:"Bank",          emoji:"🏦", cat:"economic",      cost:1000, desc:"+5% interest/tick",    terrain:null },
  { id:"warehouse",   label:"Warehouse",     emoji:"📦", cat:"economic",      cost:400,  desc:"+50 storage",          terrain:null },
  { id:"mine",        label:"Mine",          emoji:"⛏️", cat:"industrial",    cost:600,  desc:"+40 iron/stone/tick",  terrain:["rocky","mountains","volcanic"] },
  { id:"lumber_mill", label:"Lumber Mill",   emoji:"🪵", cat:"industrial",    cost:450,  desc:"+40 wood/tick",        terrain:["forest","tropical"] },
  { id:"oil_rig",     label:"Oil Rig",       emoji:"🛢️", cat:"industrial",    cost:1200, desc:"+30 oil/tick",         terrain:["tundra","coastal"] },
  { id:"refinery",    label:"Refinery",      emoji:"🏭", cat:"industrial",    cost:900,  desc:"+20% oil value",       terrain:null },
  { id:"farm",        label:"Farm",          emoji:"🌾", cat:"industrial",    cost:300,  desc:"+50 food/tick",        terrain:["plains","tropical","coastal"] },
  { id:"housing",     label:"Housing",       emoji:"🏠", cat:"civilian",      cost:350,  desc:"+5 population",        terrain:null },
  { id:"hospital",    label:"Hospital",      emoji:"🏥", cat:"civilian",      cost:700,  desc:"+10 stability",        terrain:null },
  { id:"school",      label:"School",        emoji:"🏫", cat:"civilian",      cost:500,  desc:"+5 tech/day",          terrain:null },
  { id:"fort",        label:"Fort",          emoji:"🏰", cat:"military",      cost:900,  desc:"+20 defense",          terrain:null },
  { id:"naval_base",  label:"Naval Base",    emoji:"🛳️", cat:"military",      cost:1500, desc:"Naval hub",            terrain:null },
  { id:"barracks",    label:"Barracks",      emoji:"⚔️", cat:"military",      cost:600,  desc:"+15 unit power",       terrain:null },
  { id:"radar",       label:"Radar",         emoji:"📡", cat:"military",      cost:800,  desc:"Detection & fog",      terrain:null },
  { id:"dock",        label:"Dock",          emoji:"🏗️", cat:"infrastructure",cost:400,  desc:"Trade endpoint",       terrain:null },
  { id:"road",        label:"Roads",         emoji:"🛣️", cat:"infrastructure",cost:300,  desc:"+10% resource speed",  terrain:null },
];

const CAT_COLORS = { economic:"#34d399", industrial:"#f97316", civilian:"#60a5fa", military:"#f87171", infrastructure:"#a78bfa" };
const DEV_LABELS = ["Ocean","Outpost","Settlement","Town","City","Capital"];
const DEV_COLORS = ["#64748b","#a78bfa","#60a5fa","#34d399","#fbbf24","#f97316"];

function getResources(tile, myNation) {
  const t = tile?.terrain_type || "plains";
  const b = tile?.buildings || [];
  return [
    { key:"wood",  emoji:"🪵", name:"Wood",  rate:(["forest","tropical"].includes(t)?8:2)+(b.includes("lumber_mill")?40:0), stored:myNation?.res_wood||0 },
    { key:"stone", emoji:"🪨", name:"Stone", rate:(["rocky","mountains","volcanic"].includes(t)?7:1)+(b.includes("mine")?20:0), stored:myNation?.res_stone||0 },
    { key:"iron",  emoji:"⚙️", name:"Iron",  rate:(["rocky","mountains","volcanic"].includes(t)?5:1)+(b.includes("mine")?40:0), stored:myNation?.res_iron||0 },
    { key:"food",  emoji:"🌾", name:"Food",  rate:(["plains","tropical","coastal"].includes(t)?9:2)+(b.includes("farm")?50:0), stored:myNation?.res_food||0 },
    { key:"oil",   emoji:"🛢️", name:"Oil",   rate:(["tundra","coastal"].includes(t)?6:0)+(b.includes("oil_rig")?30:0), stored:myNation?.res_oil||0 },
    { key:"gold",  emoji:"🥇", name:"Gold",  rate:(t==="desert"?5:1), stored:myNation?.res_gold||0 },
  ];
}

export default function IslandPanel({ hex, myNation, tiles, allNations, onClose, onPurchase, onClaim, onRefresh }) {
  const { q, r, tile } = hex;
  const terrain   = tile?.terrain_type || generateTerrain(q, r);
  const cfg       = TERRAIN_CONFIG[terrain] || TERRAIN_CONFIG.tropical;
  const isOwned   = !!tile;
  const isMe      = tile?.owner_nation_id === myNation?.id;
  const isEnemy   = !isMe && isOwned && (myNation?.at_war_with||[]).includes(tile?.owner_nation_id);
  const buildings = tile?.buildings || [];
  const level     = Math.min(5, tile?.infrastructure_level || 0);
  const nearby    = tiles.filter(t => Math.hypot(t.q-q, t.r-r) <= 4).length;
  const price     = islandPrice(q, r, nearby);
  const canAfford = (myNation?.currency||0) >= price;
  const ownerNation = allNations?.find(n => n.id === tile?.owner_nation_id);
  const milBuildings  = buildings.filter(b => ["fort","barracks","naval_base","radar"].includes(b));
  const islandDefense = milBuildings.length * 10 + 10;
  const myPower   = (myNation?.unit_power||10) + (myNation?.defense_level||10);
  const resources = getResources(tile, myNation);
  const cats = [...new Set(BUILDINGS.map(b => b.cat))];

  const tabs = isMe
    ? [
        { id:"overview",  label:"Overview",  icon:"🏝️" },
        { id:"resources", label:"Resources", icon:"⚡" },
        { id:"buildings", label:"Build",     icon:"🏗️" },
        { id:"military",  label:"Military",  icon:"⚔️" },
        { id:"crafting",  label:"Craft",     icon:"🔨" },
        { id:"inventory", label:"Inventory", icon:"📦" },
      ]
    : isOwned
    ? [
        { id:"overview",  label:"Overview",  icon:"🏝️" },
        { id:"resources", label:"Resources", icon:"⚡" },
      ]
    : [{ id:"overview", label:"Overview", icon:"🏝️" }];

  const [activeTab,   setActiveTab]   = useState("overview");
  const [building,    setBuilding]    = useState(false);
  const [buildMsg,    setBuildMsg]    = useState(null);
  const [claimResult, setClaimResult] = useState(null);
  const [purchasing,  setPurchasing]  = useState(false);
  const [buildCat,    setBuildCat]    = useState("economic");
  const [showBattle,  setShowBattle]  = useState(false);

  async function constructBuilding(b) {
    if (!myNation||!tile||!isMe) return;
    if ((myNation.currency||0) < b.cost) { setBuildMsg("Not enough credits!"); return; }
    if (buildings.includes(b.id))        { setBuildMsg("Already built!");       return; }
    if (b.terrain && !b.terrain.includes(terrain)) { setBuildMsg(`Needs: ${b.terrain.join("/")} terrain`); return; }
    setBuilding(true); setBuildMsg(null);
    const nb  = [...buildings, b.id];
    const upd = { buildings:nb, infrastructure_level:Math.min(5,level+1) };
    if (b.id==="trade_port") upd.has_trade_port=true;
    if (["fort","barracks","naval_base"].includes(b.id)) upd.has_military_base=true;
    if (!tile.has_city && nb.length>=3) upd.has_city=true;
    const nu = { currency:(myNation.currency||0)-b.cost };
    if (b.id==="farm")        nu.res_food        = (myNation.res_food||0)+100;
    if (b.id==="mine")        nu.res_iron        = (myNation.res_iron||0)+60;
    if (b.id==="lumber_mill") nu.res_wood        = (myNation.res_wood||0)+80;
    if (b.id==="oil_rig")     nu.res_oil         = (myNation.res_oil||0)+50;
    if (b.id==="fort")        nu.defense_level   = (myNation.defense_level||10)+20;
    if (b.id==="barracks")    nu.unit_power      = (myNation.unit_power||10)+15;
    if (b.id==="housing")     nu.housing_capacity= (myNation.housing_capacity||20)+5;
    await Promise.all([
      base44.entities.HexTile.update(tile.id, upd),
      base44.entities.Nation.update(myNation.id, nu),
    ]);
    await base44.entities.ChatMessage.create({ channel:"global", sender_nation_name:"CONSTRUCTION BUREAU",
      sender_flag:"🏗️", sender_color:"#f97316", sender_role:"system",
      content:`🏗️ BUILT — ${myNation.flag_emoji} ${myNation.name} constructed ${b.emoji} ${b.label} on island (${q},${r})!` }).catch(()=>{});
    setBuildMsg(`✅ ${b.emoji} ${b.label} built!`);
    setBuilding(false);
    onRefresh?.();
  }

  async function handleBattleComplete(won) {
    setShowBattle(false);
    const success = won ? await onClaim(tile) : false;
    setClaimResult(success ? "victory" : "repelled");
    onRefresh?.();
  }

  // ── Compact stat cell ──
  const StatCell = ({ label, value, color }) => (
    <div className="rounded-lg px-2.5 py-2" style={{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.07)" }}>
      <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[11px] font-bold ep-mono truncate" style={{ color }}>{value}</div>
    </div>
  );

  return (
    <>
      {showBattle && (
        <BattleAnimation attackerNation={myNation} defenderTile={tile} onComplete={handleBattleComplete}/>
      )}

      {/* Fixed full-height panel anchored to right edge */}
      <div
        className="fixed flex flex-col"
        style={{
          top: 0,
          right: 0,
          bottom: 0,
          width: "clamp(340px, 38vw, 480px)",
          zIndex: 200,
          background: "rgba(2,6,16,0.98)",
          border: "none",
          borderLeft: "1px solid rgba(34,211,238,0.2)",
          boxShadow: "-8px 0 60px rgba(0,0,0,0.8), inset 1px 0 0 rgba(34,211,238,0.06)",
        }}
        onMouseDown={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
      >
        {/* ── HEADER (fixed height) ── */}
        <div className="shrink-0 px-4 py-3"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", background:`linear-gradient(135deg,${cfg.rColor}10 0%,rgba(0,0,0,0) 100%)` }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background:`${cfg.rColor}18`, border:`1px solid ${cfg.rColor}30`, boxShadow:`0 0 16px ${cfg.rColor}18` }}>
              {cfg.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white leading-tight truncate">
                {tile?.is_capital ? `⭐ ${tile.owner_nation_name} Capital`
                  : tile?.city_name || (isOwned ? `${cfg.label} Island` : `${cfg.label} Territory`)}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[9px] text-slate-500 ep-mono">({q},{r})</span>
                <span className="text-[9px] font-bold" style={{ color:cfg.rColor }}>{cfg.emoji} {cfg.label}</span>
                {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">✅ Owned</span>}
                {isEnemy && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-red-400 bg-red-500/10 border border-red-500/20">⚔️ Enemy</span>}
                {!isOwned && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20">🌊 Unclaimed</span>}
                {isOwned && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold border" style={{ background:`${DEV_COLORS[level]}10`, color:DEV_COLORS[level], borderColor:`${DEV_COLORS[level]}25` }}>{DEV_LABELS[level]} {level}/5</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors shrink-0">
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* ── TABS (fixed height) ── */}
        <div className="shrink-0 flex" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.2)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-bold border-b-2 transition-all"
              style={{
                borderColor: activeTab===t.id ? "#22d3ee" : "transparent",
                color: activeTab===t.id ? "#22d3ee" : "#374151",
                background: activeTab===t.id ? "rgba(34,211,238,0.06)" : "transparent",
              }}>
              <span className="text-sm leading-none">{t.icon}</span>
              <span className="leading-none">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT (flex-1, NO overflow) ── */}
        <div className="flex-1 min-h-0 flex flex-col">

          {/* ══ OVERVIEW ══ */}
          {activeTab === "overview" && (
            <div className="flex-1 flex flex-col gap-2.5 p-3">
              {/* Stats grid — 3 cols */}
              <div className="grid grid-cols-3 gap-1.5 shrink-0">
                <StatCell label="Owner"    value={isOwned?(tile.owner_nation_name||"Unknown"):"Unclaimed"} color="#22d3ee"/>
                <StatCell label="Terrain"  value={`${cfg.emoji} ${cfg.label}`}                            color={cfg.rColor}/>
                <StatCell label="Level"    value={`${DEV_LABELS[level]} ${level}/5`}                      color={DEV_COLORS[level]}/>
                <StatCell label="Defense"  value={`${islandDefense} pwr`}                                 color="#f87171"/>
                <StatCell label="Buildings"value={`${buildings.length} built`}                            color="#a78bfa"/>
                <StatCell label="Coords"   value={`${q}, ${r}`}                                           color="#94a3b8"/>
              </div>

              {/* Resource preview row */}
              <div className="shrink-0 rounded-xl px-3 py-2" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-1.5">Production / Tick</div>
                <div className="grid grid-cols-6 gap-1">
                  {resources.map(res => (
                    <div key={res.key} className="flex flex-col items-center gap-0.5">
                      <span className="text-sm leading-none">{res.emoji}</span>
                      <span className={`text-[9px] font-bold ep-mono ${res.rate>0?"text-green-400":"text-slate-700"}`}>
                        {res.rate>0?`+${res.rate}`:"—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner card (enemy) */}
              {isOwned && !isMe && ownerNation && (
                <div className="shrink-0 rounded-xl p-2.5 flex items-center gap-3" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background:`${ownerNation.flag_color||"#3b82f6"}20`, border:`1px solid ${ownerNation.flag_color||"#3b82f6"}30` }}>
                    {ownerNation.flag_emoji||"🏴"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{ownerNation.name}</div>
                    <div className="text-[9px] text-slate-500 truncate">{ownerNation.epoch} · {ownerNation.government_type}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[8px] text-slate-500">Power</div>
                    <div className="text-sm font-black text-red-400">⚔️{(ownerNation.unit_power||0)+(ownerNation.defense_level||0)}</div>
                  </div>
                </div>
              )}

              {/* Purchase unclaimed */}
              {!isOwned && myNation && (
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <div className="rounded-xl p-2.5 space-y-1.5" style={{ background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.14)" }}>
                    <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">🏝️ Acquisition</div>
                    {[
                      ["Price",    `${price.toLocaleString()} cr`,            "text-amber-400"],
                      ["Treasury", `${(myNation.currency||0).toLocaleString()} cr`, canAfford?"text-green-400":"text-red-400"],
                      ["Nearby",   `${nearby} islands`,                        "text-slate-300"],
                    ].map(([l,v,c]) => (
                      <div key={l} className="flex justify-between text-[10px]">
                        <span className="text-slate-500">{l}</span>
                        <span className={`font-bold ep-mono ${c}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={async()=>{setPurchasing(true);await onPurchase(q,r);setPurchasing(false);}}
                    disabled={!canAfford||purchasing}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:brightness-110"
                    style={{ background:canAfford?"linear-gradient(135deg,#0891b2,#0e7490)":"rgba(255,255,255,0.05)" }}>
                    {purchasing?"⏳ Processing…":canAfford?`🏝️ Purchase — ${price.toLocaleString()} cr`:`⚠ Need ${(price-(myNation.currency||0)).toLocaleString()} more`}
                  </button>
                </div>
              )}

              {/* Claim enemy */}
              {isOwned && !isMe && myNation && (
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <div className="rounded-xl p-2.5" style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.18)" }}>
                    <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-2">⚔️ Naval Combat</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="text-center rounded-lg py-2" style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.18)" }}>
                        <div className="text-[8px] text-slate-500">Your Power</div>
                        <div className="text-2xl font-black text-green-400">{myPower}</div>
                      </div>
                      <div className="text-center rounded-lg py-2" style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.18)" }}>
                        <div className="text-[8px] text-slate-500">Defense</div>
                        <div className="text-2xl font-black text-red-400">{islandDefense}</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Win probability</span>
                      <span className="font-bold text-amber-400">~{Math.round(Math.min(90,Math.max(10,(myPower/(myPower+islandDefense))*100)))}%</span>
                    </div>
                  </div>
                  {claimResult && (
                    <div className={`text-xs px-3 py-2 rounded-xl font-bold text-center ${claimResult==="victory"?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                      {claimResult==="victory"?"🏆 Island Captured!":"🛡️ Assault Repelled!"}
                    </div>
                  )}
                  {!claimResult && (
                    <button onClick={()=>setShowBattle(true)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                      style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)" }}>
                      <Swords size={14}/> Launch Naval Assault
                    </button>
                  )}
                </div>
              )}

              {tile?.is_capital && (
                <div className="shrink-0 rounded-xl px-3 py-2 text-[10px] text-amber-400 font-bold text-center"
                  style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.16)" }}>
                  ⭐ National Capital of {tile.owner_nation_name}
                </div>
              )}
            </div>
          )}

          {/* ══ RESOURCES ══ */}
          {activeTab === "resources" && (
            <div className="flex-1 flex flex-col gap-2 p-3">
              <div className="text-[9px] text-slate-600 shrink-0">Production per tick · Stockpile = national total</div>
              <div className="flex-1 grid grid-cols-1 gap-1.5 content-start">
                {resources.map(res => (
                  <div key={res.key} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-xl shrink-0">{res.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{res.name}</span>
                        <span className={`text-[10px] font-bold ep-mono ${res.rate>4?"text-green-400":res.rate>0?"text-cyan-400":"text-slate-600"}`}>
                          {res.rate>0?`+${res.rate}/tick`:"none"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full" style={{
                            width:`${Math.min(100,(res.stored/5000)*100)}%`,
                            background:res.rate>0?"linear-gradient(90deg,#22d3ee,#4ade80)":"#374151"
                          }}/>
                        </div>
                        <span className="text-[9px] text-slate-400 ep-mono shrink-0 w-14 text-right">{res.stored.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ BUILDINGS ══ */}
          {activeTab === "buildings" && isMe && (
            <div className="flex-1 flex flex-col gap-2 p-3">
              {/* Header row */}
              <div className="shrink-0 flex items-center justify-between">
                {buildMsg ? (
                  <div className={`text-[10px] px-2 py-1 rounded-lg font-bold ${buildMsg.startsWith("✅")?"text-green-400 bg-green-500/10":"text-red-400 bg-red-500/10"}`}>{buildMsg}</div>
                ) : <span className="text-[9px] text-slate-600">Tap to build</span>}
                <span className="text-xs font-bold text-amber-400 ep-mono shrink-0">{(myNation.currency||0).toLocaleString()} cr</span>
              </div>
              {/* Category buttons */}
              <div className="shrink-0 flex gap-1 flex-wrap">
                {cats.map(cat => (
                  <button key={cat} onClick={()=>setBuildCat(cat)}
                    className="px-2 py-1 rounded-lg text-[8px] font-bold border transition-all"
                    style={{
                      background: buildCat===cat?`${CAT_COLORS[cat]}18`:"rgba(255,255,255,0.03)",
                      borderColor: buildCat===cat?`${CAT_COLORS[cat]}40`:"rgba(255,255,255,0.07)",
                      color: buildCat===cat?CAT_COLORS[cat]:"#4b5563",
                    }}>{cat}
                  </button>
                ))}
              </div>
              {/* Building list */}
              <div className="flex-1 overflow-y-auto space-y-1" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(34,211,238,0.2) transparent" }}>
                {BUILDINGS.filter(b=>b.cat===buildCat).map(b => {
                  const built      = buildings.includes(b.id);
                  const affordable = (myNation.currency||0) >= b.cost;
                  const compatible = !b.terrain || b.terrain.includes(terrain);
                  return (
                    <button key={b.id} onClick={()=>constructBuilding(b)}
                      disabled={building||built||!affordable||!compatible}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all hover:brightness-110"
                      style={{
                        background:built?`${CAT_COLORS[b.cat]}0d`:(compatible&&affordable)?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.015)",
                        border:`1px solid ${built?CAT_COLORS[b.cat]+"28":"rgba(255,255,255,0.06)"}`,
                        opacity:(!compatible||(!built&&!affordable))?0.45:1,
                      }}>
                      <span className="text-lg shrink-0">{b.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-white">{b.label}</div>
                        <div className="text-[9px] text-slate-500">{b.desc}</div>
                        {b.terrain&&!compatible&&<div className="text-[8px] text-orange-400">Needs: {b.terrain.join("/")}</div>}
                      </div>
                      <div className="shrink-0">
                        {built?<span className="text-[10px] font-bold text-green-400">✓</span>
                          :<span className={`text-[10px] font-bold ep-mono ${affordable?"text-amber-400":"text-red-400"}`}>{b.cost}cr</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ MILITARY ══ */}
          {activeTab === "military" && isMe && (
            <div className="flex-1 flex flex-col gap-2.5 p-3">
              {/* Power stats */}
              <div className="shrink-0 grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 text-center" style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.18)" }}>
                  <div className="text-[8px] text-slate-500 mb-1">Island Defense</div>
                  <div className="text-3xl font-black text-red-400">{islandDefense}</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.18)" }}>
                  <div className="text-[8px] text-slate-500 mb-1">Nation Power</div>
                  <div className="text-3xl font-black text-green-400">{(myNation?.unit_power||0)+(myNation?.defense_level||0)}</div>
                </div>
              </div>
              {/* Win chance bar */}
              <div className="shrink-0 rounded-xl p-2.5" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between text-[9px] mb-1.5">
                  <span className="text-slate-400">Offensive Win Probability</span>
                  <span className="font-bold text-amber-400">~{Math.round(Math.min(90,Math.max(10,(myPower/(myPower+islandDefense))*100)))}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/08 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${Math.min(90,Math.max(10,(myPower/(myPower+islandDefense))*100))}%`, background:"linear-gradient(90deg,#f87171,#fbbf24)" }}/>
                </div>
              </div>
              {/* Military buildings */}
              <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-y-auto" style={{ scrollbarWidth:"thin" }}>
                {milBuildings.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4 rounded-xl" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                    No military buildings.<br/><span className="text-slate-600 text-[10px]">Build tab → Military</span>
                  </div>
                ) : milBuildings.map(bid => {
                  const b = BUILDINGS.find(x=>x.id===bid); if(!b) return null;
                  return (
                    <div key={bid} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.12)" }}>
                      <span className="text-xl">{b.emoji}</span>
                      <div className="flex-1"><div className="text-[11px] font-bold text-white">{b.label}</div><div className="text-[9px] text-slate-500">{b.desc}</div></div>
                      <span className="text-[9px] text-red-400 font-bold">+10 def</span>
                    </div>
                  );
                })}
              </div>
              {/* Tips */}
              <div className="shrink-0 rounded-xl px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-0.5" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                {["🏰 Fort +20 def","⚔️ Barracks +15 atk","🛳️ Naval Hub","📡 Radar detect"].map(t=>(
                  <div key={t} className="text-[9px] text-slate-500">{t}</div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CRAFTING ══ */}
          {activeTab === "crafting" && isMe && (
            <CraftingTab myNation={myNation} onRefresh={onRefresh}/>
          )}

          {/* ══ INVENTORY ══ */}
          {activeTab === "inventory" && (
            <div className="flex-1 flex flex-col gap-2.5 p-3">
              {/* Resources grid */}
              <div className="shrink-0">
                <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-1.5">Nation Stockpile</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {resources.map(res=>(
                    <div key={res.key} className="flex flex-col items-center rounded-xl py-2 px-1" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      <span className="text-lg">{res.emoji}</span>
                      <span className="text-[10px] font-bold text-white ep-mono">{res.stored.toLocaleString()}</span>
                      {res.rate>0&&<span className="text-[8px] text-green-400">+{res.rate}</span>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Buildings installed */}
              {buildings.length>0 && (
                <div className="shrink-0">
                  <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-1.5">Installed Buildings ({buildings.length})</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {buildings.map(bid=>{
                      const b=BUILDINGS.find(x=>x.id===bid); if(!b) return null;
                      return (
                        <div key={bid} className="flex items-center gap-1.5 rounded-xl px-2.5 py-2" style={{ background:`${CAT_COLORS[b.cat]}0d`, border:`1px solid ${CAT_COLORS[b.cat]}1a` }}>
                          <span className="text-base">{b.emoji}</span>
                          <span className="text-[10px] font-bold text-white truncate">{b.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Treasury summary */}
              {myNation && (
                <div className="shrink-0 rounded-xl p-2.5" style={{ background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.1)" }}>
                  <div className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5">National Treasury</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {l:"Credits", v:`${(myNation.currency||0).toLocaleString()}`, c:"text-amber-400"},
                      {l:"GDP",     v:`${(myNation.gdp||0).toLocaleString()}`,      c:"text-green-400"},
                      {l:"Pop",     v:`${(myNation.population||0)}M`,               c:"text-blue-400"},
                    ].map(({l,v,c})=>(
                      <div key={l} className="text-center">
                        <div className="text-[8px] text-slate-600">{l}</div>
                        <div className={`text-[11px] font-bold ep-mono ${c}`}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}