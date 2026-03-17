import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { BUILDINGS } from "../map/hex/IslandPanel";
import { UTILITY_BUILDINGS, POWER_CONSUMPTION, WATER_CONSUMPTION } from "./UtilityConfig";

const CAT_COLORS = { economic:"#34d399", industrial:"#f97316", civilian:"#60a5fa", military:"#f87171", infrastructure:"#a78bfa", utility:"#22d3ee" };
const ALL_BUILDINGS = [...BUILDINGS, ...UTILITY_BUILDINGS];
const CATS = [...new Set(ALL_BUILDINGS.map(b => b.cat))];

export default function IslandBuildingsTab({ tile, myNation, powerStats, waterStats, onRefresh }) {
  const buildings = tile?.buildings || [];
  const terrain = tile?.terrain_type || "plains";
  const [buildCat, setBuildCat] = useState("economic");
  const [building, setBuilding] = useState(false);
  const [msg, setMsg] = useState(null);

  async function build(b) {
    if (!myNation || !tile) return;
    if ((myNation.currency||0) < b.cost) { setMsg("Not enough credits!"); return; }
    if (buildings.includes(b.id))        { setMsg("Already built!");       return; }
    if (b.terrain && !b.terrain.includes(terrain)) { setMsg(`Requires: ${b.terrain.join("/")} terrain`); return; }
    setBuilding(true); setMsg(null);
    const nb = [...buildings, b.id];
    const upd = { buildings: nb, infrastructure_level: Math.min(5, (tile.infrastructure_level||0)+1) };
    if (b.id==="trade_port") upd.has_trade_port = true;
    if (["fort","barracks","naval_base"].includes(b.id)) upd.has_military_base = true;
    const nu = { currency: (myNation.currency||0) - b.cost };
    if (b.id==="farm")        nu.res_food = (myNation.res_food||0)+100;
    if (b.id==="mine")        nu.res_iron = (myNation.res_iron||0)+60;
    if (b.id==="lumber_mill") nu.res_wood = (myNation.res_wood||0)+80;
    if (b.id==="oil_rig")     nu.res_oil  = (myNation.res_oil||0)+50;
    if (b.id==="fort")        nu.defense_level = (myNation.defense_level||10)+20;
    if (b.id==="barracks")    nu.unit_power = (myNation.unit_power||10)+15;
    if (b.id==="housing")     nu.housing_capacity = (myNation.housing_capacity||20)+5;
    await Promise.all([
      base44.entities.HexTile.update(tile.id, upd),
      base44.entities.Nation.update(myNation.id, nu),
    ]);
    setMsg(`✅ ${b.emoji} ${b.label} constructed!`);
    setBuilding(false);
    onRefresh?.();
    setTimeout(() => setMsg(null), 3500);
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Installed */}
      {buildings.length > 0 && (
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Installed ({buildings.length})</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {buildings.map(bid => {
              const b = ALL_BUILDINGS.find(x => x.id === bid);
              if (!b) return null;
              const pwr = POWER_CONSUMPTION[bid] || 0;
              const wat = WATER_CONSUMPTION[bid] || 0;
              const powered = pwr === 0 || powerStats.gen >= powerStats.use;
              const watered = wat === 0 || waterStats.gen >= waterStats.use;
              const ok = powered && watered;
              return (
                <div key={bid} className="rounded-xl px-3 py-2.5"
                  style={{ background:`${CAT_COLORS[b.cat]||"#64748b"}0d`, border:`1px solid ${CAT_COLORS[b.cat]||"#64748b"}${ok?"20":"40"}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{b.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{b.label}</div>
                      <div className="text-[9px] text-slate-500">{b.cat}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {pwr > 0 && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${powered?"text-yellow-400 bg-yellow-500/10":"text-red-400 bg-red-500/10"}`}>⚡{pwr}W</span>}
                    {wat > 0 && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${watered?"text-blue-400 bg-blue-500/10":"text-red-400 bg-red-500/10"}`}>💧{wat}</span>}
                    {!ok && <span className="text-[8px] text-red-400">offline</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Build new */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Build New</div>
          <span className="text-xs font-bold text-amber-400 ep-mono">{(myNation?.currency||0).toLocaleString()} cr</span>
        </div>
        {msg && <div className={`mb-2 px-3 py-2 rounded-lg text-xs font-bold ${msg.startsWith("✅")?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>{msg}</div>}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {CATS.map(cat => (
            <button key={cat} onClick={() => setBuildCat(cat)}
              className="px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all"
              style={{
                background: buildCat===cat ? `${CAT_COLORS[cat]||"#64748b"}18` : "rgba(255,255,255,0.03)",
                borderColor: buildCat===cat ? `${CAT_COLORS[cat]||"#64748b"}40` : "rgba(255,255,255,0.07)",
                color: buildCat===cat ? CAT_COLORS[cat]||"#64748b" : "#4b5563",
              }}>{cat}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {ALL_BUILDINGS.filter(b => b.cat === buildCat).map(b => {
            const built = buildings.includes(b.id);
            const affordable = (myNation?.currency||0) >= b.cost;
            const compatible = !b.terrain || b.terrain.includes(terrain);
            const pwr = POWER_CONSUMPTION[b.id] || 0;
            const wat = WATER_CONSUMPTION[b.id] || 0;
            return (
              <button key={b.id} onClick={() => build(b)}
                disabled={building||built||!affordable||!compatible}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all hover:brightness-110"
                style={{
                  background: built?`${CAT_COLORS[b.cat]}0d`:(compatible&&affordable)?"rgba(255,255,255,0.035)":"rgba(255,255,255,0.015)",
                  border:`1px solid ${built?CAT_COLORS[b.cat]+"28":"rgba(255,255,255,0.06)"}`,
                  opacity:(!compatible||(!built&&!affordable))?0.45:1,
                }}>
                <span className="text-xl shrink-0">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white">{b.label}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[9px] text-slate-500">{b.desc}</span>
                    {pwr > 0 && <span className="text-[9px] text-yellow-500 font-bold">⚡{pwr}</span>}
                    {wat > 0 && <span className="text-[9px] text-blue-400 font-bold">💧{wat}</span>}
                    {b.terrain && !compatible && <span className="text-[9px] text-orange-400">needs {b.terrain[0]}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  {built ? <span className="text-[10px] font-bold text-green-400">✓</span>
                    : <span className={`text-[10px] font-bold ep-mono ${affordable?"text-amber-400":"text-red-400"}`}>{b.cost}cr</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}