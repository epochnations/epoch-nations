const MIL_BUILDINGS = {
  fort:       { emoji:"🏰", name:"Fort",         bonus:20, desc:"Reinforced position" },
  barracks:   { emoji:"⚔️", name:"Barracks",      bonus:15, desc:"+15 unit power" },
  naval_base: { emoji:"🛳️", name:"Naval Base",    bonus:10, desc:"Sea operations hub" },
  radar:      { emoji:"📡", name:"Radar",         bonus:10, desc:"Detection + fog of war" },
};

export default function IslandDefenseTab({ tile, myNation, onRefresh }) {
  const buildings = tile?.buildings || [];
  const milBuildings = buildings.filter(b => MIL_BUILDINGS[b]);
  const islandDefense = milBuildings.length * 10 + 10;
  const myPower = (myNation?.unit_power||10) + (myNation?.defense_level||10);
  const winPct = Math.round(Math.min(90, Math.max(10, (myPower / (myPower + islandDefense)) * 100)));
  const isAtWar = (myNation?.at_war_with||[]).length > 0;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Power grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)" }}>
          <div className="text-[9px] text-slate-500 mb-2">Island Defense Rating</div>
          <div className="text-4xl font-black text-red-400">{islandDefense}</div>
          <div className="text-[10px] text-slate-500 mt-1">{milBuildings.length} military buildings</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)" }}>
          <div className="text-[9px] text-slate-500 mb-2">Nation Total Power</div>
          <div className="text-4xl font-black text-green-400">{myPower}</div>
          <div className="text-[10px] text-slate-500 mt-1">unit + defense level</div>
        </div>
      </div>

      {/* Offensive win probability */}
      <div className="rounded-xl p-3" style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-400">Offensive win probability (if attacking this island)</span>
          <span className="font-bold text-amber-400">~{winPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/08 overflow-hidden">
          <div className="h-full rounded-full" style={{ width:`${winPct}%`, background:"linear-gradient(90deg,#f87171,#fbbf24)" }}/>
        </div>
      </div>

      {/* Military buildings */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Military Installations</div>
        {milBuildings.length === 0 ? (
          <div className="text-center py-8 rounded-xl text-slate-600"
            style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-3xl mb-2">🛡️</div>
            <div className="text-sm">No military buildings.</div>
            <div className="text-xs mt-1">Go to Buildings → Military to fortify this island.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {milBuildings.map(bid => {
              const b = MIL_BUILDINGS[bid];
              return (
                <div key={bid} className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.14)" }}>
                  <span className="text-2xl">{b.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{b.name}</div>
                    <div className="text-[10px] text-slate-500">{b.desc}</div>
                  </div>
                  <span className="text-xs font-bold text-red-400">+{b.bonus} def</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nation war status */}
      {isAtWar && (
        <div className="rounded-xl p-3" style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.18)" }}>
          <div className="text-xs font-bold text-red-400 mb-2">⚔️ Active War</div>
          <div className="flex flex-wrap gap-1.5">
            {(myNation?.at_war_with||[]).map((id, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-lg text-red-300 bg-red-500/10 border border-red-500/20">
                Enemy {i+1}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-1" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="text-[9px] text-slate-500">🏰 Fort → +20 defense rating</div>
        <div className="text-[9px] text-slate-500">⚔️ Barracks → +15 unit power</div>
        <div className="text-[9px] text-slate-500">🛳️ Naval Base → sea operations</div>
        <div className="text-[9px] text-slate-500">📡 Radar → detect stealth moves</div>
      </div>
    </div>
  );
}