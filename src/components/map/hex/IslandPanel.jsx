/**
 * IslandPanel — Full-size island interaction panel.
 * Right-anchored, 5 tabs, no forced scrolling.
 */
import { useState } from "react";
import { X, Hammer, TrendingUp, Shield, Home, Anchor, Package, Swords, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TERRAIN_CONFIG, generateTerrain, islandPrice, seededRand } from "../HexOceanMap";

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

const CAT_ICONS  = { economic:TrendingUp, industrial:Hammer, civilian:Home, military:Shield, infrastructure:Anchor };
const CAT_COLORS = { economic:"#34d399", industrial:"#f97316", civilian:"#60a5fa", military:"#f87171", infrastructure:"#a78bfa" };
const DEV_LABELS = ["Ocean","Outpost","Settlement","Town","City","Capital"];
const DEV_COLORS = ["#64748b","#a78bfa","#60a5fa","#34d399","#fbbf24","#f97316"];

function getResources(tile, myNation) {
  const t = tile?.terrain_type || "plains";
  const b = tile?.buildings || [];
  const rows = [
    { name:"🪵 Wood",  rate: (["forest","tropical"].includes(t)?8:2) + (b.includes("lumber_mill")?40:0), stored: myNation?.res_wood||0 },
    { name:"🪨 Stone", rate: (["rocky","mountains","volcanic"].includes(t)?7:1) + (b.includes("mine")?20:0), stored: myNation?.res_stone||0 },
    { name:"⚙️ Iron",  rate: (["rocky","mountains","volcanic"].includes(t)?5:1) + (b.includes("mine")?40:0), stored: myNation?.res_iron||0 },
    { name:"🌾 Food",  rate: (["plains","tropical","coastal"].includes(t)?9:2) + (b.includes("farm")?50:0), stored: myNation?.res_food||0 },
    { name:"🛢️ Oil",   rate: (["tundra","coastal"].includes(t)?6:0) + (b.includes("oil_rig")?30:0), stored: myNation?.res_oil||0 },
    { name:"🥇 Gold",  rate: (t==="desert"?5:1), stored: myNation?.res_gold||0 },
  ];
  return rows;
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

  // Tab config
  const tabs = isMe
    ? [
        { id:"overview",   label:"Overview",  icon:"🏝️" },
        { id:"resources",  label:"Resources", icon:"⚡" },
        { id:"buildings",  label:"Buildings", icon:"🏗️" },
        { id:"military",   label:"Military",  icon:"⚔️" },
        { id:"inventory",  label:"Inventory", icon:"📦" },
      ]
    : isOwned
    ? [
        { id:"overview",   label:"Overview",  icon:"🏝️" },
        { id:"resources",  label:"Resources", icon:"⚡" },
        { id:"inventory",  label:"Inventory", icon:"📦" },
      ]
    : [{ id:"overview", label:"Overview", icon:"🏝️" }];

  const [activeTab, setActiveTab] = useState("overview");
  const [building, setBuilding] = useState(false);
  const [buildMsg, setBuildMsg] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [buildCat, setBuildCat] = useState("economic");

  const resources = getResources(tile, myNation);
  const availableBuildings = BUILDINGS.filter(b => !b.terrain || b.terrain.includes(terrain));
  const cats = [...new Set(BUILDINGS.map(b => b.cat))];
  const milBuildings = buildings.filter(b => ["fort","barracks","naval_base","radar"].includes(b));
  const islandDefense = milBuildings.length * 10 + 10;
  const myPower = (myNation?.unit_power||10) + (myNation?.defense_level||10);

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

  async function doClaim() {
    setClaiming(true); setClaimResult(null);
    const success = await onClaim(tile);
    setClaimResult(success ? "victory" : "repelled");
    setClaiming(false);
    onRefresh?.();
  }

  return (
    <div
      className="absolute z-40 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        top: "40px",
        right: "12px",
        bottom: "12px",
        width: "min(320px, calc(100vw - 24px))",
        background: "rgba(4,10,22,0.98)",
        border: "1px solid rgba(34,211,238,0.25)",
        backdropFilter: "blur(20px)",
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-3 pb-2.5" style={{ borderBottom:"1px solid rgba(255,255,255,0.08)", background:"linear-gradient(135deg,rgba(34,211,238,0.06),rgba(139,92,246,0.04))" }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background:`${cfg.rColor}18`, border:`1px solid ${cfg.rColor}30` }}>
              {cfg.emoji}
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">
                {tile?.is_capital ? `⭐ ${tile.owner_nation_name} Capital`
                  : tile?.city_name || (isOwned ? `${cfg.label} Island` : `${cfg.label} Territory`)}
              </div>
              <div className="text-[10px] text-slate-500 ep-mono">({q},{r}) · {cfg.label}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors shrink-0">
            <X size={14}/>
          </button>
        </div>

        {/* Status row */}
        <div className="flex flex-wrap gap-1 mt-2">
          {!isOwned ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-amber-300 border"
              style={{ background:"rgba(251,191,36,0.12)", borderColor:"rgba(251,191,36,0.28)" }}>
              🌊 Unclaimed
            </span>
          ) : (
            <>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border"
                style={{ background:`${DEV_COLORS[level]}15`, color:DEV_COLORS[level], borderColor:`${DEV_COLORS[level]}30` }}>
                {DEV_LABELS[level]} Lvl {level}
              </span>
              {isMe && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-cyan-400 border border-cyan-500/25 bg-cyan-500/10">✅ Owned</span>}
              {isEnemy && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-red-400 border border-red-500/25 bg-red-500/10">⚔️ Enemy</span>}
              {tile?.has_trade_port && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-green-400 border border-green-500/25 bg-green-500/10">⚓ Port</span>}
              {tile?.has_military_base && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-red-400 border border-red-500/25 bg-red-500/10">🏰 Fort</span>}
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="shrink-0 flex overflow-x-auto" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold whitespace-nowrap border-b-2 transition-all shrink-0"
            style={{
              borderColor: activeTab===t.id ? "#22d3ee" : "transparent",
              color: activeTab===t.id ? "#22d3ee" : "#64748b",
              background: activeTab===t.id ? "rgba(34,211,238,0.05)" : "transparent",
            }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(34,211,238,0.3) transparent" }}>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="p-4 space-y-3">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:"Owner",   value: isOwned ? (tile.owner_nation_name||"Unknown") : "Unclaimed", color:"#22d3ee" },
                { label:"Terrain", value: cfg.label,                    color: cfg.rColor },
                { label:"Level",   value: `${DEV_LABELS[level]} (${level}/5)`, color: DEV_COLORS[level] },
                { label:"Coords",  value: `${q}, ${r}`,                 color:"#94a3b8" },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-3 py-2.5"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-[9px] text-slate-500 mb-1">{s.label}</div>
                  <div className="text-xs font-bold ep-mono truncate" style={{ color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Owner nation card (if not mine) */}
            {isOwned && !isMe && ownerNation && (
              <div className="rounded-xl p-3 flex items-center gap-3"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-2xl">{ownerNation.flag_emoji||"🏴"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">{ownerNation.name}</div>
                  <div className="text-[10px] text-slate-500">{ownerNation.epoch} · {ownerNation.government_type}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] text-slate-500">Power</div>
                  <div className="text-sm font-black text-red-400">⚔️ {(ownerNation.unit_power||0)+(ownerNation.defense_level||0)}</div>
                </div>
              </div>
            )}

            {/* Purchase */}
            {!isOwned && myNation && (
              <div className="space-y-2">
                <div className="rounded-xl p-3 space-y-2"
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
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Resources on purchase</span>
                    <span className="text-slate-300">✅ Instant</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Nearby islands</span>
                    <span className="text-slate-300 ep-mono">{nearby}</span>
                  </div>
                </div>
                <button onClick={async () => { setPurchasing(true); await onPurchase(q,r); setPurchasing(false); }}
                  disabled={!canAfford||purchasing}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                  style={{ background: canAfford?"linear-gradient(135deg,#0891b2,#0e7490)":"rgba(255,255,255,0.06)" }}>
                  {purchasing ? "⏳ Processing…" : canAfford ? `🏝️ Purchase Island — ${price.toLocaleString()} cr` : `⚠ Need ${(price-(myNation.currency||0)).toLocaleString()} more cr`}
                </button>
              </div>
            )}

            {/* Claim/attack */}
            {isOwned && !isMe && myNation && (
              <div className="space-y-2">
                <div className="rounded-xl p-3 space-y-2"
                  style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)" }}>
                  <div className="text-xs font-bold text-red-400">⚔️ Island Claim — Combat Preview</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center rounded-lg py-2" style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)" }}>
                      <div className="text-[9px] text-slate-400">Your Power</div>
                      <div className="text-lg font-black text-green-400">{myPower}</div>
                    </div>
                    <div className="text-center rounded-lg py-2" style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
                      <div className="text-[9px] text-slate-400">Island Defense</div>
                      <div className="text-lg font-black text-red-400">{islandDefense}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Win probability: ~{Math.round(Math.min(90, Math.max(10, (myPower/(myPower+islandDefense))*100)))}%
                  </div>
                </div>
                {claimResult && (
                  <div className={`text-sm px-3 py-2.5 rounded-xl font-bold text-center ${claimResult==="victory"?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                    {claimResult==="victory" ? "🏆 Island Captured! Flag changed." : "🛡️ Assault Repelled by defenses!"}
                  </div>
                )}
                <button onClick={doClaim} disabled={claiming}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
                  style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)" }}>
                  <Swords size={14}/>
                  {claiming ? "⚔️ Attacking…" : `Declare Claim on ${tile.owner_nation_name}`}
                </button>
              </div>
            )}

            {/* Capital label */}
            {tile?.is_capital && (
              <div className="rounded-xl px-3 py-2 text-xs text-amber-400 font-bold text-center"
                style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)" }}>
                ⭐ This is the national capital of {tile.owner_nation_name}
              </div>
            )}
          </div>
        )}

        {/* ── RESOURCES ── */}
        {activeTab === "resources" && (
          <div className="p-4 space-y-3">
            <div className="text-[10px] text-slate-500 leading-relaxed">
              Production rates are per game tick. Stored amounts reflect your nation's total.
            </div>
            {resources.map(res => (
              <div key={res.name} className="rounded-xl p-3"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-white">{res.name}</span>
                  <span className={`text-xs font-bold ep-mono ${res.rate>0?"text-green-400":"text-slate-600"}`}>
                    {res.rate > 0 ? `+${res.rate}/tick` : "0/tick"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width:`${Math.min(100, (res.stored/5000)*100)}%` }}/>
                  </div>
                  <span className="text-[10px] text-slate-400 ep-mono shrink-0">{res.stored.toLocaleString()}</span>
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
              <span className="text-xs text-slate-500">Treasury</span>
              <span className="text-sm font-bold text-amber-400 ep-mono">{(myNation.currency||0).toLocaleString()} cr</span>
            </div>

            {/* Category filter */}
            <div className="flex gap-1 flex-wrap">
              {cats.map(cat => (
                <button key={cat} onClick={() => setBuildCat(cat)}
                  className="px-2 py-1 rounded-lg text-[9px] font-bold border transition-all"
                  style={{
                    background: buildCat===cat ? `${CAT_COLORS[cat]}18` : "rgba(255,255,255,0.03)",
                    borderColor: buildCat===cat ? `${CAT_COLORS[cat]}50` : "rgba(255,255,255,0.07)",
                    color: buildCat===cat ? CAT_COLORS[cat] : "#64748b",
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {availableBuildings.filter(b => b.cat === buildCat).map(b => {
                const built = buildings.includes(b.id);
                const affordable = (myNation.currency||0) >= b.cost;
                const compatible = !b.terrain || b.terrain.includes(terrain);
                return (
                  <button key={b.id} onClick={() => constructBuilding(b)}
                    disabled={building||built||!affordable||!compatible}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: built ? `${CAT_COLORS[b.cat]}0d` : compatible ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${built ? CAT_COLORS[b.cat]+"30" : "rgba(255,255,255,0.07)"}`,
                      opacity: (!compatible||(!built&&!affordable)) ? 0.5 : 1,
                    }}>
                    <span className="text-xl shrink-0">{b.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">{b.label}</div>
                      <div className="text-[10px] text-slate-500">{b.desc}</div>
                      {b.terrain && !compatible && <div className="text-[9px] text-red-400">Needs: {b.terrain.join("/")} terrain</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      {built
                        ? <span className="text-[11px] font-bold text-green-400">✓ Built</span>
                        : <span className={`text-[10px] font-bold ep-mono ${affordable?"text-amber-400":"text-red-400"}`}>{b.cost} cr</span>
                      }
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
              <div className="rounded-xl p-3 text-center" style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
                <div className="text-[9px] text-slate-400 mb-1">Island Defense</div>
                <div className="text-2xl font-black text-red-400">{islandDefense}</div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)" }}>
                <div className="text-[9px] text-slate-400 mb-1">Nation Power</div>
                <div className="text-2xl font-black text-green-400">{(myNation?.unit_power||0)+(myNation?.defense_level||0)}</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Military Installations</div>
              {milBuildings.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">No military buildings. Go to Buildings → Military to construct.</div>
              ) : (
                <div className="space-y-1.5">
                  {milBuildings.map(bid => {
                    const b = BUILDINGS.find(x => x.id===bid);
                    if (!b) return null;
                    return (
                      <div key={bid} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{ background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.15)" }}>
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

            <div className="rounded-xl p-3 text-xs text-slate-500 space-y-1"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <div className="font-bold text-slate-300 mb-1">Defense Tips</div>
              <div>• Fort: +20 defense, hardened position</div>
              <div>• Barracks: +15 attack power</div>
              <div>• Naval Base: enables sea operations</div>
              <div>• Radar: detects enemy movements</div>
            </div>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {activeTab === "inventory" && (
          <div className="p-4 space-y-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Resources</div>
              <div className="space-y-1.5">
                {resources.filter(r => r.stored > 0 || r.rate > 0).map(res => (
                  <div key={res.name} className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-xs text-white">{res.name}</span>
                    <div className="flex items-center gap-3">
                      {res.rate > 0 && <span className="text-[10px] text-green-400 ep-mono">+{res.rate}/tick</span>}
                      <span className="text-xs font-bold text-white ep-mono">{res.stored.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {buildings.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Buildings ({buildings.length})</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {buildings.map(bid => {
                    const b = BUILDINGS.find(x => x.id===bid);
                    if (!b) return null;
                    return (
                      <div key={bid} className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                        style={{ background:`${CAT_COLORS[b.cat]}0d`, border:`1px solid ${CAT_COLORS[b.cat]}22` }}>
                        <span>{b.emoji}</span>
                        <span className="text-[10px] font-bold text-white truncate">{b.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {buildings.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">No buildings yet.</div>
            )}

            {/* Nation treasury summary */}
            {myNation && (
              <div className="rounded-xl p-3 space-y-1.5"
                style={{ background:"rgba(34,211,238,0.05)", border:"1px solid rgba(34,211,238,0.12)" }}>
                <div className="text-[10px] font-bold text-cyan-400">Nation Treasury</div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Credits</span>
                  <span className="font-bold text-amber-400 ep-mono">{(myNation.currency||0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">GDP</span>
                  <span className="font-bold text-green-400 ep-mono">{(myNation.gdp||0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}