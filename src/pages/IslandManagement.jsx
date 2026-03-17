/**
 * IslandManagement — Full-screen island management hub.
 * Replaces the island popup panel with a dedicated management page.
 * Tabs: Overview | Production | Utilities | Storage | Buildings | Crafting | Workers | Defense
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Zap, Droplets } from "lucide-react";
import { TERRAIN_CONFIG, generateTerrain, islandPrice } from "../components/map/HexOceanMap";
import { computePower, computeWater, UTILITY_COLORS } from "../components/island/UtilityConfig";
import IslandOverviewTab   from "../components/island/IslandOverviewTab";
import IslandProductionTab from "../components/island/IslandProductionTab";
import IslandUtilitiesTab  from "../components/island/IslandUtilitiesTab";
import IslandStorageTab    from "../components/island/IslandStorageTab";
import IslandBuildingsTab  from "../components/island/IslandBuildingsTab";
import IslandWorkersTab    from "../components/island/IslandWorkersTab";
import IslandDefenseTab    from "../components/island/IslandDefenseTab";
import CraftingTab         from "../components/map/hex/CraftingTab";
import BattleAnimation     from "../components/map/hex/BattleAnimation";

const TABS = [
  { id:"overview",   label:"Overview",    icon:"🏝️" },
  { id:"production", label:"Production",  icon:"⚙️" },
  { id:"utilities",  label:"Utilities",   icon:"⚡" },
  { id:"storage",    label:"Storage",     icon:"📦" },
  { id:"buildings",  label:"Buildings",   icon:"🏗️" },
  { id:"crafting",   label:"Crafting",    icon:"🔨" },
  { id:"workers",    label:"Workers",     icon:"👷" },
  { id:"defense",    label:"Defense",     icon:"🛡️" },
];

const DEV_LABELS = ["Ocean","Outpost","Settlement","Town","City","Capital"];

export default function IslandManagement() {
  const params = new URLSearchParams(window.location.search);
  const q = parseInt(params.get("q") || "0");
  const r = parseInt(params.get("r") || "0");

  const [tile,       setTile]       = useState(null);
  const [myNation,   setMyNation]   = useState(null);
  const [allNations, setAllNations] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [showBattle, setShowBattle] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [user, tilesData, nationsData] = await Promise.all([
      base44.auth.me(),
      base44.entities.HexTile.filter({ hex_id: `${q}_${r}` }),
      base44.entities.Nation.list("-gdp", 60),
    ]);
    setAllNations(nationsData);
    const nations = await base44.entities.Nation.filter({ owner_email: user.email });
    if (nations.length > 0) setMyNation(nations[0]);
    setTile(tilesData[0] || null);
    setLoading(false);
  }

  async function handlePurchase() {
    if (!myNation || purchasing) return;
    const terrain = generateTerrain(q, r);
    const tileCount = (await base44.entities.HexTile.list()).filter(t => Math.hypot(t.q-q, t.r-r) <= 4).length;
    const price = islandPrice(q, r, tileCount);
    if ((myNation.currency || 0) < price) return;
    setPurchasing(true);
    const cfg = TERRAIN_CONFIG[terrain];
    const resBonus = {};
    if (["forest","tropical"].includes(terrain)) resBonus.res_wood = (myNation.res_wood||0) + 80;
    if (["rocky","mountains","volcanic"].includes(terrain)) resBonus.res_stone = (myNation.res_stone||0) + 60;
    if (terrain === "desert") resBonus.res_gold = (myNation.res_gold||0) + 40;
    if (["tropical","plains","coastal"].includes(terrain)) resBonus.res_food = (myNation.res_food||0) + 100;
    if (terrain === "tundra") resBonus.res_oil = (myNation.res_oil||0) + 50;
    await base44.entities.HexTile.create({
      hex_id:`${q}_${r}`, q, r, terrain_type:terrain,
      owner_nation_id:myNation.id, owner_nation_name:myNation.name,
      owner_color:myNation.flag_color||"#3b82f6", owner_flag:myNation.flag_emoji||"🏴",
      resource_type:"none", resource_amount:0,
      has_city:false, buildings:[], is_capital:false,
      infrastructure_level:0, population_capacity:100,
    });
    await base44.entities.Nation.update(myNation.id, { currency:(myNation.currency||0)-price, ...resBonus });
    await base44.entities.ChatMessage.create({
      channel:"global", sender_nation_name:"REAL ESTATE BUREAU",
      sender_flag:"🏝️", sender_color:"#22d3ee", sender_role:"system",
      content:`🏝️ ISLAND ACQUIRED — ${myNation.flag_emoji} ${myNation.name} purchased a ${cfg.emoji} ${cfg.label} island at (${q},${r}) for ${price.toLocaleString()} credits!`,
    }).catch(()=>{});
    setPurchasing(false);
    await loadAll();
  }

  async function handleBattleComplete(won) {
    setShowBattle(false);
    if (won && tile && myNation) {
      await base44.entities.HexTile.update(tile.id, {
        owner_nation_id:myNation.id, owner_nation_name:myNation.name,
        owner_color:myNation.flag_color||"#3b82f6", owner_flag:myNation.flag_emoji||"🏴",
        is_capital:false,
      });
      await base44.entities.Nation.update(myNation.id, {
        at_war_with:[...new Set([...(myNation.at_war_with||[]), tile.owner_nation_id])],
        currency:Math.max(0,(myNation.currency||0)-200),
      });
      await base44.entities.ChatMessage.create({
        channel:"global", sender_nation_name:"WAR BUREAU",
        sender_flag:"⚔️", sender_color:"#ef4444", sender_role:"system",
        content:`⚔️ ISLAND CAPTURED — ${myNation.flag_emoji} ${myNation.name} seized (${q},${r}) from ${tile.owner_nation_name}!`,
      }).catch(()=>{});
      setBattleResult("victory");
    } else {
      setBattleResult("repelled");
    }
    await loadAll();
  }

  const terrain    = tile?.terrain_type || generateTerrain(q, r);
  const cfg        = TERRAIN_CONFIG[terrain] || TERRAIN_CONFIG.tropical;
  const buildings  = tile?.buildings || [];
  const isMe       = !!(tile?.owner_nation_id && tile.owner_nation_id === myNation?.id);
  const isOwned    = !!(tile?.owner_nation_id);
  const isEnemy    = isOwned && !isMe;
  const ownerNation= allNations.find(n => n.id === tile?.owner_nation_id);
  const powerStats = computePower(buildings);
  const waterStats = computeWater(buildings);
  const level      = Math.min(5, tile?.infrastructure_level || 0);
  const myPower    = (myNation?.unit_power||10) + (myNation?.defense_level||10);
  const defPower   = buildings.filter(b => ["fort","barracks","naval_base","radar"].includes(b)).length * 10 + 10;
  const pwrClr     = UTILITY_COLORS[powerStats.status];
  const watClr     = UTILITY_COLORS[waterStats.status];

  if (loading) return (
    <div className="min-h-screen bg-[#040810] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background:"#040810", color:"white" }}>
      {showBattle && tile && myNation && (
        <BattleAnimation attackerNation={myNation} defenderTile={tile} onComplete={handleBattleComplete}/>
      )}

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-20"
        style={{ background:`linear-gradient(135deg,${cfg.rColor}14 0%,rgba(2,6,16,0.96) 100%)`, borderColor:"rgba(255,255,255,0.08)", backdropFilter:"blur(24px)" }}>
        <a href={createPageUrl("Dashboard")} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 shrink-0">
          <ArrowLeft size={14}/>
        </a>
        <div className="text-2xl shrink-0">{cfg.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white text-sm md:text-base truncate">
            {tile?.is_capital ? `⭐ ${tile.owner_nation_name} Capital`
              : tile?.city_name || (isOwned ? `${cfg.label} Island` : `Unexplored ${cfg.label}`)}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {isOwned && ownerNation && <span className="text-[10px] text-slate-500">{ownerNation.flag_emoji} {tile.owner_nation_name}</span>}
            <span className="text-[10px] font-bold" style={{ color:cfg.rColor }}>{cfg.label}</span>
            <span className="text-[10px] text-slate-600 ep-mono">({q},{r})</span>
            {isOwned && <span className="text-[10px] text-slate-500">· {DEV_LABELS[level]}</span>}
            {isMe && <span className="text-[10px] text-cyan-400 font-bold">✅ Owned</span>}
            {isEnemy && <span className="text-[10px] text-red-400 font-bold">⚔️ Enemy</span>}
            {!isOwned && <span className="text-[10px] text-amber-400 font-bold">🌊 Unclaimed</span>}
          </div>
        </div>
        {isMe && (
          <div className="flex items-center gap-2 shrink-0">
            <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${pwrClr.text} ${pwrClr.bg} ${pwrClr.border}`}>
              <Zap size={10}/> {powerStats.gen}↑{powerStats.use}↓
            </div>
            <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${watClr.text} ${watClr.bg} ${watClr.border}`}>
              <Droplets size={10}/> {waterStats.gen}↑{waterStats.use}↓
            </div>
          </div>
        )}
      </header>

      {/* ── Tabs (only for owned islands) ── */}
      {isMe && (
        <div className="shrink-0 flex overflow-x-auto border-b sticky top-[57px] z-10"
          style={{ borderColor:"rgba(255,255,255,0.07)", background:"rgba(2,6,16,0.95)", backdropFilter:"blur(16px)", scrollbarWidth:"none" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold border-b-2 whitespace-nowrap transition-all"
              style={{
                borderColor: activeTab===t.id ? "#22d3ee" : "transparent",
                color: activeTab===t.id ? "#22d3ee" : "#374151",
                background: activeTab===t.id ? "rgba(34,211,238,0.05)" : "transparent",
              }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1">
        {/* Non-owned islands */}
        {!isMe ? (
          <div className="max-w-lg mx-auto p-4 space-y-4">
            <IslandOverviewTab tile={tile} myNation={myNation} ownerNation={ownerNation}
              powerStats={powerStats} waterStats={waterStats} isMe={false} allNations={allNations}/>
            {/* Purchase */}
            {!isOwned && myNation && (
              <div className="rounded-xl p-4" style={{ background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.14)" }}>
                <div className="text-sm font-bold text-cyan-400 mb-3">🏝️ Island Acquisition</div>
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-slate-400">Your Treasury</span>
                  <span className="font-bold text-amber-400 ep-mono">{(myNation.currency||0).toLocaleString()} cr</span>
                </div>
                <button onClick={handlePurchase} disabled={purchasing}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:brightness-110"
                  style={{ background:"linear-gradient(135deg,#0891b2,#0e7490)" }}>
                  {purchasing ? "⏳ Processing…" : `🏝️ Purchase — ${islandPrice(q, r, 0).toLocaleString()} cr`}
                </button>
              </div>
            )}
            {/* Combat */}
            {isEnemy && myNation && (
              <div className="rounded-xl p-4 space-y-3" style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
                <div className="text-sm font-bold text-red-400">⚔️ Naval Combat</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center rounded-xl py-3" style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.18)" }}>
                    <div className="text-[9px] text-slate-500 mb-1">Your Power</div>
                    <div className="text-3xl font-black text-green-400">{myPower}</div>
                  </div>
                  <div className="text-center rounded-xl py-3" style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.18)" }}>
                    <div className="text-[9px] text-slate-500 mb-1">Defense</div>
                    <div className="text-3xl font-black text-red-400">{defPower}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center">
                  Win probability: <span className="text-amber-400 font-bold">~{Math.round(Math.min(90,Math.max(10,(myPower/(myPower+defPower))*100)))}%</span>
                </div>
                {battleResult ? (
                  <div className={`py-2.5 rounded-xl text-center text-sm font-bold ${battleResult==="victory"?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                    {battleResult==="victory"?"🏆 Island Captured!":"🛡️ Assault Repelled!"}
                  </div>
                ) : (
                  <button onClick={() => setShowBattle(true)}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                    style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)" }}>
                    ⚔️ Launch Naval Assault
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Owned island — tabs */
          <div className="min-h-0">
            {activeTab === "overview"   && <IslandOverviewTab   tile={tile} myNation={myNation} ownerNation={ownerNation} powerStats={powerStats} waterStats={waterStats} isMe={true} allNations={allNations}/>}
            {activeTab === "production" && <IslandProductionTab tile={tile} myNation={myNation} powerStats={powerStats} waterStats={waterStats} onRefresh={loadAll}/>}
            {activeTab === "utilities"  && <IslandUtilitiesTab  tile={tile} myNation={myNation} powerStats={powerStats} waterStats={waterStats} onRefresh={loadAll}/>}
            {activeTab === "storage"    && <IslandStorageTab    tile={tile} myNation={myNation} onRefresh={loadAll}/>}
            {activeTab === "buildings"  && <IslandBuildingsTab  tile={tile} myNation={myNation} powerStats={powerStats} waterStats={waterStats} onRefresh={loadAll}/>}
            {activeTab === "crafting"   && (
              <div style={{ height:"calc(100vh - 110px)" }}>
                <CraftingTab myNation={myNation} onRefresh={loadAll}/>
              </div>
            )}
            {activeTab === "workers"    && <IslandWorkersTab    tile={tile} myNation={myNation} onRefresh={loadAll}/>}
            {activeTab === "defense"    && <IslandDefenseTab    tile={tile} myNation={myNation} onRefresh={loadAll}/>}
          </div>
        )}
      </div>
    </div>
  );
}