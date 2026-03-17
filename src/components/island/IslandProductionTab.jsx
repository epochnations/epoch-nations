import { POWER_CONSUMPTION, WATER_CONSUMPTION } from "./UtilityConfig";

const PRODUCTION_BUILDINGS = {
  mine:        { emoji:"⛏️", name:"Mine",        produces:"Iron & Stone", rate:40, cat:"mining" },
  lumber_mill: { emoji:"🪵", name:"Lumber Mill",  produces:"Wood",         rate:40, cat:"forestry" },
  oil_rig:     { emoji:"🛢️", name:"Oil Rig",      produces:"Oil",          rate:30, cat:"energy" },
  farm:        { emoji:"🌾", name:"Farm",          produces:"Food",         rate:50, cat:"agriculture" },
  refinery:    { emoji:"🏭", name:"Refinery",      produces:"Fuel",         rate:20, cat:"industrial" },
  market:      { emoji:"🏪", name:"Market",        produces:"+8% income",   rate:8,  cat:"economic" },
  bank:        { emoji:"🏦", name:"Bank",          produces:"+5% interest", rate:5,  cat:"economic" },
  trade_port:  { emoji:"⚓", name:"Trade Port",    produces:"+15% exports", rate:15, cat:"economic" },
};

const CAT_COLORS = { mining:"#78716c", forestry:"#a16207", energy:"#6b21a8", agriculture:"#16a34a", industrial:"#f97316", economic:"#34d399" };

export default function IslandProductionTab({ tile, myNation, powerStats, waterStats, onRefresh }) {
  const buildings = tile?.buildings || [];
  const prodBuildings = buildings.filter(b => PRODUCTION_BUILDINGS[b]);
  const totalPowerUse = buildings.reduce((s, b) => s + (POWER_CONSUMPTION[b] || 0), 0);
  const totalWaterUse = buildings.reduce((s, b) => s + (WATER_CONSUMPTION[b] || 0), 0);
  const isPowered = powerStats.gen >= powerStats.use;
  const isWatered = waterStats.gen >= waterStats.use;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-3 text-center" style={{ background:"rgba(34,211,238,0.06)", border:"1px solid rgba(34,211,238,0.15)" }}>
          <div className="text-[9px] text-slate-500 mb-1">Machines</div>
          <div className="text-xl font-black text-cyan-400">{prodBuildings.length}</div>
        </div>
        <div className={`rounded-xl p-3 text-center ${isPowered?"":"opacity-70"}`}
          style={{ background: isPowered?"rgba(74,222,128,0.06)":"rgba(248,113,113,0.06)", border:`1px solid ${isPowered?"rgba(74,222,128,0.2)":"rgba(248,113,113,0.2)"}` }}>
          <div className="text-[9px] text-slate-500 mb-1">⚡ Power Use</div>
          <div className={`text-xl font-black ${isPowered?"text-green-400":"text-red-400"}`}>{totalPowerUse}W</div>
        </div>
        <div className={`rounded-xl p-3 text-center ${isWatered?"":"opacity-70"}`}
          style={{ background: isWatered?"rgba(96,165,250,0.06)":"rgba(248,113,113,0.06)", border:`1px solid ${isWatered?"rgba(96,165,250,0.2)":"rgba(248,113,113,0.2)"}` }}>
          <div className="text-[9px] text-slate-500 mb-1">💧 Water Use</div>
          <div className={`text-xl font-black ${isWatered?"text-blue-400":"text-red-400"}`}>{totalWaterUse}W</div>
        </div>
      </div>

      {prodBuildings.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <div className="text-4xl mb-3">⚙️</div>
          <div className="text-sm font-bold">No Production Buildings</div>
          <div className="text-xs mt-1">Go to Buildings tab to construct mines, farms, and more</div>
        </div>
      ) : (
        <div className="space-y-2">
          {prodBuildings.map(bid => {
            const def = PRODUCTION_BUILDINGS[bid];
            const pwr = POWER_CONSUMPTION[bid] || 0;
            const wat = WATER_CONSUMPTION[bid] || 0;
            const powered = pwr === 0 || isPowered;
            const watered = wat === 0 || isWatered;
            const operational = powered && watered;
            const catColor = CAT_COLORS[def.cat] || "#64748b";
            return (
              <div key={bid} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background:`${catColor}0d`, border:`1px solid ${catColor}20`, opacity:operational?1:0.65 }}>
                <span className="text-2xl shrink-0">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-white">{def.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${operational ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
                      {operational ? "✓ Active" : "⚠ Offline"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-1">Produces: {def.produces} · Rate: +{def.rate}/tick</div>
                  <div className="flex gap-2 flex-wrap">
                    {pwr > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${powered ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10"}`}>
                        ⚡ {pwr}W {!powered && "⚠"}
                      </span>
                    )}
                    {wat > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${watered ? "text-blue-400 bg-blue-500/10" : "text-red-400 bg-red-500/10"}`}>
                        💧 {wat} {!watered && "⚠"}
                      </span>
                    )}
                    {!operational && (
                      <span className="text-[9px] text-red-400">→ Build generators in Utilities tab</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All buildings power/water summary */}
      <div className="rounded-xl p-3" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-2">All Buildings on Island</div>
        <div className="flex flex-wrap gap-1.5">
          {buildings.filter(b => !PRODUCTION_BUILDINGS[b]).map(bid => (
            <span key={bid} className="text-[9px] px-2 py-1 rounded-lg text-slate-400"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
              {bid.replace(/_/g," ")}
            </span>
          ))}
          {buildings.filter(b => !PRODUCTION_BUILDINGS[b]).length === 0 && (
            <span className="text-[9px] text-slate-600">No non-production buildings</span>
          )}
        </div>
      </div>
    </div>
  );
}