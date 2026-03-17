import { AlertTriangle, Zap, Droplets } from "lucide-react";
import { UTILITY_COLORS, POWER_CONSUMPTION, WATER_CONSUMPTION } from "./UtilityConfig";

const DEV_LABELS = ["Ocean","Outpost","Settlement","Town","City","Capital"];
const DEV_COLORS = ["#64748b","#a78bfa","#60a5fa","#34d399","#fbbf24","#f97316"];

const RESOURCE_RATES = {
  forest:    { res_wood: 8, res_food: 2 },
  tropical:  { res_wood: 6, res_food: 9 },
  plains:    { res_food: 9, res_wood: 2 },
  rocky:     { res_stone: 7, res_iron: 5 },
  mountains: { res_stone: 8, res_iron: 6 },
  volcanic:  { res_stone: 5, res_iron: 5, res_gold: 2 },
  coastal:   { res_food: 6, res_oil: 6 },
  tundra:    { res_oil: 6, res_stone: 3 },
  desert:    { res_gold: 5, res_stone: 3 },
};

const RES = [
  { key:"res_wood",  emoji:"🪵", label:"Wood"  },
  { key:"res_stone", emoji:"🪨", label:"Stone" },
  { key:"res_iron",  emoji:"🟫", label:"Iron"  },
  { key:"res_food",  emoji:"🌾", label:"Food"  },
  { key:"res_oil",   emoji:"🛢️", label:"Oil"   },
  { key:"res_gold",  emoji:"🥇", label:"Gold"  },
];

export default function IslandOverviewTab({ tile, myNation, ownerNation, powerStats, waterStats, isMe, allNations }) {
  const buildings = tile?.buildings || [];
  const terrain = tile?.terrain_type || "plains";
  const level = Math.min(5, tile?.infrastructure_level || 0);
  const baseRates = RESOURCE_RATES[terrain] || {};

  // Compute per-resource rates from buildings
  const rates = { ...baseRates };
  if (buildings.includes("farm"))        rates.res_food  = (rates.res_food  || 0) + 50;
  if (buildings.includes("mine"))        rates.res_iron  = (rates.res_iron  || 0) + 40;
  if (buildings.includes("lumber_mill")) rates.res_wood  = (rates.res_wood  || 0) + 40;
  if (buildings.includes("oil_rig"))     rates.res_oil   = (rates.res_oil   || 0) + 30;

  const isDefenseOk = (buildings.filter(b => ["fort","barracks","naval_base","radar"].includes(b)).length * 10 + 10) >= 20;
  const pwrClr = UTILITY_COLORS[powerStats.status];
  const watClr = UTILITY_COLORS[waterStats.status];

  const alerts = [];
  if (powerStats.status === "shortage") alerts.push({ type:"danger", msg:"⚡ Power shortage — machines slowing down" });
  if (powerStats.status === "warning")  alerts.push({ type:"warn",   msg:"⚡ Low power — add a generator soon" });
  if (waterStats.status === "shortage") alerts.push({ type:"danger", msg:"💧 Water shortage — production impacted" });
  if (waterStats.status === "warning")  alerts.push({ type:"warn",   msg:"💧 Low water — add a water source" });
  if (buildings.length >= 10 && !isDefenseOk) alerts.push({ type:"info", msg:"🛡️ Large island with weak defenses" });

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {/* Alerts */}
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold ${
          a.type==="danger" ? "text-red-400 bg-red-500/10 border border-red-500/20"
          : a.type==="warn" ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
          : "text-cyan-400 bg-cyan-500/08 border border-cyan-500/15"
        }`}>
          <AlertTriangle size={12} className="shrink-0"/> {a.msg}
        </div>
      ))}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label:"Owner",     value:tile?.owner_nation_name || "Unclaimed", color:"#22d3ee" },
          { label:"Terrain",   value:terrain,                                color:"#a78bfa" },
          { label:"Level",     value:`${DEV_LABELS[level]} (${level}/5)`,    color:DEV_COLORS[level] },
          { label:"Buildings", value:`${buildings.length} installed`,        color:"#f97316" },
          { label:"Defense",   value:`${buildings.filter(b=>["fort","barracks","naval_base","radar"].includes(b)).length*10+10} pwr`, color:"#f87171" },
          { label:"Capacity",  value:`${tile?.population_capacity||100} pop`,color:"#4ade80" },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-3 py-2.5" style={{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-0.5">{s.label}</div>
            <div className="text-xs font-bold ep-mono" style={{ color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Power & water bars */}
      {isMe && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:"Power", icon:<Zap size={11}/>, stats:powerStats, clr:pwrClr, unit:"W" },
            { label:"Water", icon:<Droplets size={11}/>, stats:waterStats, clr:watClr, unit:"W" },
          ].map(u => {
            const total = Math.max(u.stats.gen, u.stats.use, 1);
            const pct = Math.min(100, (u.stats.gen / total) * 100);
            return (
              <div key={u.label} className={`rounded-xl p-3 ${u.clr.bg} border ${u.clr.border}`}>
                <div className={`flex items-center gap-1 text-xs font-bold mb-2 ${u.clr.text}`}>
                  {u.icon} {u.label}
                </div>
                <div className="h-2 rounded-full bg-white/10 mb-1 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:"currentColor" }}/>
                </div>
                <div className={`text-[10px] font-bold ep-mono ${u.clr.text}`}>
                  {u.stats.gen} gen / {u.stats.use} use
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resource production */}
      <div className="rounded-xl p-3" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-2.5">Resource Production / Tick</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {RES.map(r => {
            const rate = rates[r.key] || 0;
            return (
              <div key={r.key} className="flex flex-col items-center gap-0.5 rounded-lg py-2" style={{ background:"rgba(255,255,255,0.025)" }}>
                <span className="text-xl">{r.emoji}</span>
                <span className={`text-[10px] font-bold ep-mono ${rate > 0 ? "text-green-400" : "text-slate-700"}`}>
                  {rate > 0 ? `+${rate}` : "—"}
                </span>
                <span className="text-[8px] text-slate-600">{r.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Owner card for non-mine */}
      {!isMe && ownerNation && (
        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background:`${ownerNation.flag_color||"#3b82f6"}18`, border:`1px solid ${ownerNation.flag_color||"#3b82f6"}30` }}>
            {ownerNation.flag_emoji||"🏴"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">{ownerNation.name}</div>
            <div className="text-[10px] text-slate-500">{ownerNation.epoch} · {ownerNation.government_type}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] text-slate-500">Total Power</div>
            <div className="text-lg font-black text-red-400">⚔️{(ownerNation.unit_power||0)+(ownerNation.defense_level||0)}</div>
          </div>
        </div>
      )}
    </div>
  );
}