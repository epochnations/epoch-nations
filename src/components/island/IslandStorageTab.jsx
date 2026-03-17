const RESOURCES = [
  { key:"res_wood",  emoji:"🪵", label:"Wood",        color:"#a16207" },
  { key:"res_stone", emoji:"🪨", label:"Stone",       color:"#78716c" },
  { key:"res_iron",  emoji:"🟫", label:"Iron Ore",    color:"#6b7280" },
  { key:"res_food",  emoji:"🌾", label:"Food",        color:"#16a34a" },
  { key:"res_oil",   emoji:"🛢️", label:"Crude Oil",   color:"#6b21a8" },
  { key:"res_gold",  emoji:"🥇", label:"Gold",        color:"#d97706" },
];

const PRODUCTION_RATES = {
  mine:        { res_iron: 40, res_stone: 20 },
  lumber_mill: { res_wood: 40 },
  oil_rig:     { res_oil: 30 },
  farm:        { res_food: 50 },
};

const STORAGE_MAX = 5000;

export default function IslandStorageTab({ tile, myNation, onRefresh }) {
  const buildings = tile?.buildings || [];

  // Compute island contribution to resources
  const islandRates = {};
  for (const bid of buildings) {
    const rates = PRODUCTION_RATES[bid] || {};
    for (const [res, rate] of Object.entries(rates)) {
      islandRates[res] = (islandRates[res] || 0) + rate;
    }
  }
  // Also terrain base rates
  const terrain = tile?.terrain_type || "plains";
  const TERRAIN_RATES = {
    forest:    { res_wood: 8 }, tropical: { res_food: 9, res_wood: 6 },
    plains:    { res_food: 9 }, rocky:    { res_iron: 5, res_stone: 7 },
    mountains: { res_stone: 8, res_iron: 6 }, volcanic: { res_iron: 5, res_stone: 5 },
    coastal:   { res_food: 6, res_oil: 6 }, tundra: { res_oil: 6 },
    desert:    { res_gold: 5 },
  };
  const terrainBase = TERRAIN_RATES[terrain] || {};
  for (const [res, rate] of Object.entries(terrainBase)) {
    islandRates[res] = (islandRates[res] || 0) + rate;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Notice */}
      <div className="rounded-xl px-3 py-2.5 flex items-start gap-2 text-[10px] text-slate-400"
        style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-base shrink-0">ℹ️</span>
        <span>Resources are stored in your national stockpile and shared across all islands. The rates shown reflect this island's contribution.</span>
      </div>

      {/* Resource grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {RESOURCES.map(r => {
          const amount = myNation?.[r.key] || 0;
          const rate = islandRates[r.key] || 0;
          const pct = Math.min(100, (amount / STORAGE_MAX) * 100);
          const isFull = amount >= STORAGE_MAX * 0.95;
          return (
            <div key={r.key} className="rounded-2xl p-4" style={{ background:`${r.color}0d`, border:`1px solid ${r.color}20` }}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <div className="text-xs font-bold text-white">{r.label}</div>
                  {rate > 0 && <div className="text-[9px] text-green-400 font-bold">+{rate}/tick (this island)</div>}
                </div>
              </div>
              <div className="text-xl font-black ep-mono" style={{ color: r.color }}>{amount.toLocaleString()}</div>
              <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${pct}%`, background:r.color, opacity:0.7 }}/>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-slate-600">0</span>
                <span className={`text-[8px] font-bold ${isFull ? "text-red-400" : "text-slate-600"}`}>
                  {isFull ? "⚠ FULL" : STORAGE_MAX.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Production sources */}
      <div className="rounded-xl p-3" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-2">Island Production Sources</div>
        {Object.keys(islandRates).length === 0 ? (
          <div className="text-xs text-slate-600">No production buildings on this island. Build mines, farms, or forges to start producing resources.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(islandRates).map(([res, rate]) => {
              const def = RESOURCES.find(r => r.key === res);
              return def ? (
                <div key={res} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ background:`${def.color}12`, border:`1px solid ${def.color}20` }}>
                  <span>{def.emoji}</span>
                  <span className="text-xs font-bold" style={{ color:def.color }}>+{rate}/tick</span>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}