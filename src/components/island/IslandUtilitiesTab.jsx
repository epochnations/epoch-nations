import { useState } from "react";
import { Zap, Droplets } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  POWER_OUTPUT, POWER_CONSUMPTION,
  WATER_OUTPUT, WATER_CONSUMPTION,
  UTILITY_BUILDINGS, UTILITY_COLORS
} from "./UtilityConfig";

function UtilityBar({ label, icon, gen, use, status }) {
  const clr = UTILITY_COLORS[status];
  const total = Math.max(gen, use, 1);
  const genPct = Math.min(100, (gen / total) * 100);
  const usePct = Math.min(100, (use / total) * 100);
  return (
    <div className={`rounded-2xl p-4 ${clr.bg} border ${clr.border}`}>
      <div className={`flex items-center justify-between mb-3 ${clr.text}`}>
        <div className="flex items-center gap-2 font-bold text-sm">{icon} {label}</div>
        <span className="text-[10px] font-bold ep-mono uppercase">{status}</span>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-500">Generated</span>
          <span className={`font-bold ep-mono ${clr.text}`}>{gen}</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/08 overflow-hidden">
          <div className="h-full rounded-full" style={{ width:`${genPct}%`, background:"currentColor" }}/>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-500">Consumed</span>
          <span className="font-bold ep-mono text-slate-400">{use}</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/08 overflow-hidden">
          <div className="h-full rounded-full bg-slate-500" style={{ width:`${usePct}%` }}/>
        </div>
      </div>
      <div className={`text-xs font-bold text-center rounded-xl py-1.5 ${clr.bg} border ${clr.border} ${clr.text}`}>
        {gen >= use ? `+${gen - use} surplus` : `${use - gen} deficit — add generators!`}
      </div>
    </div>
  );
}

export default function IslandUtilitiesTab({ tile, myNation, powerStats, waterStats, onRefresh }) {
  const buildings = tile?.buildings || [];
  const terrain = tile?.terrain_type || "plains";
  const [building, setBuilding] = useState(false);
  const [msg, setMsg] = useState(null);

  const powerGenerators = buildings.filter(b => POWER_OUTPUT[b]);
  const powerConsumers  = buildings.filter(b => POWER_CONSUMPTION[b]);
  const waterGenerators = buildings.filter(b => WATER_OUTPUT[b]);
  const waterConsumers  = buildings.filter(b => WATER_CONSUMPTION[b]);

  async function buildUtil(b) {
    if (!myNation || !tile) return;
    if ((myNation.currency||0) < b.cost) { setMsg("Not enough credits!"); return; }
    if (buildings.includes(b.id))        { setMsg("Already built!");       return; }
    if (b.terrain && !b.terrain.includes(terrain)) { setMsg(`Needs: ${b.terrain.join("/")} terrain`); return; }
    setBuilding(true); setMsg(null);
    await Promise.all([
      base44.entities.HexTile.update(tile.id, {
        buildings: [...buildings, b.id],
        infrastructure_level: Math.min(5, (tile.infrastructure_level||0)+1),
      }),
      base44.entities.Nation.update(myNation.id, { currency: (myNation.currency||0) - b.cost }),
    ]);
    setMsg(`✅ ${b.emoji} ${b.label} built!`);
    setBuilding(false);
    onRefresh?.();
    setTimeout(() => setMsg(null), 3500);
  }

  const BuildingRow = ({ b }) => {
    const built = buildings.includes(b.id);
    const affordable = (myNation?.currency||0) >= b.cost;
    const compatible = !b.terrain || b.terrain.includes(terrain);
    return (
      <button onClick={() => buildUtil(b)} disabled={building||built||!affordable||!compatible}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full transition-all hover:brightness-110"
        style={{
          background: built ? "rgba(34,211,238,0.08)" : (compatible&&affordable) ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.015)",
          border:`1px solid ${built ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.07)"}`,
          opacity:(!compatible||(!built&&!affordable))?0.45:1,
        }}>
        <span className="text-2xl shrink-0">{b.emoji}</span>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">{b.label}</div>
          <div className="text-[10px] text-slate-500">{b.desc}</div>
        </div>
        <div className="shrink-0 text-right">
          {built ? <span className="text-[11px] font-bold text-cyan-400">✓ Built</span>
            : <span className={`text-xs font-bold ep-mono ${affordable?"text-amber-400":"text-red-400"}`}>{b.cost}cr</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5">
      {msg && (
        <div className={`px-3 py-2 rounded-lg text-xs font-bold ${msg.startsWith("✅")?"text-green-400 bg-green-500/10 border border-green-500/20":"text-red-400 bg-red-500/10 border border-red-500/20"}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UtilityBar label="Power" icon={<Zap size={14}/>} gen={powerStats.gen} use={powerStats.use} status={powerStats.status}/>
        <UtilityBar label="Water" icon={<Droplets size={14}/>} gen={waterStats.gen} use={waterStats.use} status={waterStats.status}/>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Power section */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider">⚡ Power Generators</div>
          {powerGenerators.length > 0 ? (
            <div className="space-y-1.5">
              {powerGenerators.map(bid => (
                <div key={bid} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.15)" }}>
                  <span className="text-xs text-white ep-mono">{bid.replace(/_gen$/,"").replace(/_/g," ")}</span>
                  <span className="text-[10px] font-bold text-yellow-400">+{POWER_OUTPUT[bid]}W</span>
                </div>
              ))}
            </div>
          ) : <div className="text-xs text-slate-600 py-2">No power generators. Build below.</div>}

          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-1">⚡ Power Consumers</div>
          {powerConsumers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {powerConsumers.map(bid => (
                <span key={bid} className="text-[9px] px-2 py-1 rounded-lg font-bold text-slate-400 ep-mono" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  {bid.replace(/_/g," ")} -{POWER_CONSUMPTION[bid]}W
                </span>
              ))}
            </div>
          ) : <div className="text-[10px] text-slate-600">No power consumers.</div>}
        </div>

        {/* Water section */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">💧 Water Sources</div>
          {waterGenerators.length > 0 ? (
            <div className="space-y-1.5">
              {waterGenerators.map(bid => (
                <div key={bid} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.15)" }}>
                  <span className="text-xs text-white ep-mono">{bid.replace(/_inf$/,"").replace(/_/g," ")}</span>
                  <span className="text-[10px] font-bold text-blue-400">+{WATER_OUTPUT[bid]}</span>
                </div>
              ))}
            </div>
          ) : <div className="text-xs text-slate-600 py-2">No water sources. Build below.</div>}

          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-1">💧 Water Consumers</div>
          {waterConsumers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {waterConsumers.map(bid => (
                <span key={bid} className="text-[9px] px-2 py-1 rounded-lg font-bold text-slate-400 ep-mono" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  {bid.replace(/_/g," ")} -{WATER_CONSUMPTION[bid]}
                </span>
              ))}
            </div>
          ) : <div className="text-[10px] text-slate-600">No water consumers.</div>}
        </div>
      </div>

      {/* Build utility buildings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Build Utility Infrastructure</div>
          <span className="text-xs font-bold text-amber-400 ep-mono">{(myNation?.currency||0).toLocaleString()} cr</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {UTILITY_BUILDINGS.map(b => <BuildingRow key={b.id} b={b}/>)}
        </div>
      </div>
    </div>
  );
}