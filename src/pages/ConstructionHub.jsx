import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Hammer, AlertCircle, Users, Zap, ShieldCheck, Landmark } from "lucide-react";
import { BUILDINGS, BUILDING_MAP, EPOCH_REQUIREMENTS } from "../components/game/BuildingConfig";
import { EPOCHS } from "../components/game/EpochConfig";
import BankingPanel from "../components/banking/BankingPanel";


const CATEGORY_LABELS = { civilian: "🏘️ Civilian", military: "⚔️ Military", recreational: "🎡 Recreational", government: "🏛️ Government" };
const CATEGORY_ORDER = ["civilian", "military", "recreational", "government"];

const RESOURCE_LABELS = {
  res_wood: "🪵 Wood", res_stone: "🪨 Stone", res_gold: "🥇 Gold",
  res_iron: "⚙️ Iron", res_oil: "🛢️ Oil", res_food: "🌾 Food", currency: "💰 Treasury"
};

function epochIndex(epoch) {
  return EPOCHS.indexOf(epoch);
}

export default function ConstructionHub() {
  const [nation, setNation] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(null); // currently constructing
  const [category, setCategory] = useState("civilian");
  const [insuranceMap, setInsuranceMap] = useState({});
  const [showBank, setShowBank] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const nations = await base44.entities.Nation.filter({ owner_email: u.email });
    if (!nations[0]) { window.location.href = createPageUrl("Onboarding"); return; }
    setNation(nations[0]);
    const bldgs = await base44.entities.Building.filter({ nation_id: nations[0].id });
    setBuildings(bldgs);
    setLoading(false);
  }

  async function construct(bdef) {
    if (!nation || building) return;
    setBuilding(bdef.id);
    const addInsurance = !!insuranceMap[bdef.id];

    // Deduct resources (+ insurance cost if selected)
    const insuranceCost = addInsurance ? 200 : 0;
    const costWithInsurance = { ...bdef.cost, currency: (bdef.cost.currency || 0) + insuranceCost };
    const updates = { ...Object.fromEntries(
      Object.entries(costWithInsurance).map(([k, v]) => [k, Math.max(0, (nation[k] || 0) - v)])
    ) };

    // Apply benefits
    Object.entries(bdef.benefits).forEach(([k, v]) => {
      if (k === "tpBonus" || k === "farmBonus" || k === "migrationBonus") return; // handled by engine
      updates[k] = Math.min(k === "public_trust" ? 2.0 : 999999, (nation[k] || 0) + v);
    });

    await base44.entities.Nation.update(nation.id, updates);
    await base44.entities.Building.create({
      nation_id: nation.id,
      nation_name: nation.name,
      owner_email: nation.owner_email,
      building_type: bdef.id,
      category: bdef.category,
      level: 1,
      is_destroyed: false,
      workers_assigned: bdef.workforce,
      has_insurance: addInsurance
    });

    await base44.entities.NewsArticle.create({
      headline: `${nation.name} constructs a new ${bdef.name}!`,
      body: `${nation.name} has completed construction of a ${bdef.name}. This investment strengthens their national infrastructure.`,
      category: "economy",
      tier: "standard",
      nation_name: nation.name,
      nation_flag: nation.flag_emoji,
      nation_color: nation.flag_color
    });

    // Refresh
    const [freshNation, freshBuildings] = await Promise.all([
      base44.entities.Nation.filter({ owner_email: user.email }),
      base44.entities.Building.filter({ nation_id: nation.id })
    ]);
    setNation(freshNation[0]);
    setBuildings(freshBuildings);
    setBuilding(null);
  }

  function canAfford(bdef) {
    return Object.entries(bdef.cost).every(([k, v]) => (nation[k] || 0) >= v);
  }

  function buildingCount(id) {
    return buildings.filter(b => b.building_type === id && !b.is_destroyed).length;
  }

  function canBuildMore(bdef) {
    const count = buildingCount(bdef.id);
    if (bdef.uniqueMax && count >= bdef.uniqueMax) return false;
    if (bdef.populationCap) {
      const maxAllowed = Math.floor((nation?.population || 0) / bdef.populationCap);
      if (count >= maxAllowed) return false;
    }
    return true;
  }

  function isEpochUnlocked(bdef) {
    return epochIndex(nation?.epoch) >= epochIndex(bdef.epoch_required);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const filtered = BUILDINGS.filter(b => b.category === category);
  const nationEpochIndex = epochIndex(nation?.epoch);
  const nextEpochName = nationEpochIndex < EPOCHS.length - 1 ? EPOCHS[nationEpochIndex + 1] : null;
  const epochReqs = EPOCH_REQUIREMENTS[nation?.epoch];

  // Check epoch advancement eligibility
  let epochMet = { tp: false, population: false, buildings: {}, resources: {} };
  if (epochReqs) {
    epochMet.tp = (nation?.tech_points || 0) >= epochReqs.tp;
    epochMet.population = (nation?.population || 0) >= epochReqs.population;
    Object.entries(epochReqs.buildings || {}).forEach(([bid, req]) => {
      epochMet.buildings[bid] = buildingCount(bid) >= req;
    });
    Object.entries(epochReqs.resources || {}).forEach(([res, req]) => {
      epochMet.resources[res] = (nation?.[res] || 0) >= req;
    });
  }
  const allEpochMet = epochReqs
    ? epochMet.tp && epochMet.population
      && Object.values(epochMet.buildings).every(Boolean)
      && Object.values(epochMet.resources).every(Boolean)
    : false;

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.015) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/30 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            EPOCH NATIONS
          </div>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-sm font-bold text-amber-400 hidden sm:inline">🏗️ Construction Hub</span>
        </div>
        <div className="flex gap-2">
          {buildings.some(b => b.building_type === "bank" && !b.is_destroyed) && (
            <button onClick={() => setShowBank(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center gap-1.5">
              <Landmark size={11} /> 🏦 Bank
            </button>
          )}
          <a href={createPageUrl("Dashboard")} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all">
            ← Dashboard
          </a>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Nation quick stats */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-3 sm:grid-cols-6 gap-3 text-center text-xs">
          {[
            { label: "🪵 Wood", val: nation?.res_wood || 0 },
            { label: "🪨 Stone", val: nation?.res_stone || 0 },
            { label: "🥇 Gold", val: nation?.res_gold || 0 },
            { label: "⚙️ Iron", val: nation?.res_iron || 0 },
            { label: "💰 Treasury", val: Math.floor(nation?.currency || 0) },
            { label: "👥 Pop", val: nation?.population || 0 },
          ].map(({ label, val }) => (
            <div key={label}>
              <div className="text-slate-400">{label}</div>
              <div className="font-mono font-bold text-white">{val.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Epoch advancement requirement panel */}
        {epochReqs && nextEpochName && (
          <div className={`rounded-2xl border p-5 ${allEpochMet ? "border-cyan-400/50 bg-cyan-400/5" : "border-white/10 bg-white/3"}`}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-cyan-400" />
                Requirements to Advance to {nextEpochName}
              </div>
              {allEpochMet && (
                <div className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-3 py-1 rounded-xl">
                  ✅ READY — Advance in Tech Tree!
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* TP */}
              <Req met={epochMet.tp} label={`${epochReqs.tp} TP`} sub={`${nation?.tech_points || 0} / ${epochReqs.tp}`} />
              {/* Population */}
              <Req met={epochMet.population} label={`${epochReqs.population} Population`} sub={`${nation?.population || 0} / ${epochReqs.population}`} />
              {/* Buildings */}
              {Object.entries(epochReqs.buildings || {}).map(([bid, req]) => (
                <Req key={bid} met={epochMet.buildings[bid]}
                  label={`${req}x ${BUILDING_MAP[bid]?.name || bid}`}
                  sub={`${buildingCount(bid)} / ${req}`} />
              ))}
              {/* Resources */}
              {Object.entries(epochReqs.resources || {}).map(([res, req]) => (
                <Req key={res} met={epochMet.resources[res]}
                  label={`${req} ${RESOURCE_LABELS[res]?.replace(/[^\w\s]/g, "").trim() || res}`}
                  sub={`${nation?.[res] || 0} / ${req}`} />
              ))}
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
          {CATEGORY_ORDER.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${category === cat ? "border-amber-400 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Buildings grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(bdef => {
            const unlocked = isEpochUnlocked(bdef);
            const affordable = canAfford(bdef);
            const buildable = canBuildMore(bdef);
            const count = buildingCount(bdef.id);
            const isBuilding = building === bdef.id;

            return (
              <div key={bdef.id}
                className={`rounded-2xl border p-5 transition-all ${!unlocked ? "opacity-40 border-white/5 bg-white/2" : affordable && buildable ? "border-amber-400/20 bg-amber-400/5 hover:border-amber-400/40" : "border-white/10 bg-white/5"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{bdef.emoji}</span>
                      <span className="font-bold text-white">{bdef.name}</span>
                      {count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-400/20 text-green-400">×{count}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{bdef.description}</div>
                    {!unlocked && (
                      <div className="text-xs text-red-400 mt-1">🔒 Requires {bdef.epoch_required}</div>
                    )}
                  </div>
                </div>

                {/* Cost */}
                <div className="mb-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Build Cost</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(bdef.cost).map(([res, val]) => {
                      const have = nation?.[res] || 0;
                      const ok = have >= val;
                      return (
                        <span key={res} className={`text-xs px-2 py-0.5 rounded-lg font-mono ${ok ? "bg-white/10 text-slate-300" : "bg-red-500/20 text-red-400"}`}>
                          {RESOURCE_LABELS[res] || res}: {val}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Benefits */}
                <div className="mb-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Benefits</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(bdef.benefits).map(([k, v]) => (
                      <span key={k} className="text-xs px-2 py-0.5 rounded-lg bg-green-500/10 text-green-400 font-mono">
                        {k === "tpBonus" ? `+${v} TP/tick` : k === "farmBonus" ? `+${v} Food/tick` : k === "migrationBonus" ? `+${v} Migration` : `+${v} ${k.replace(/_/g, " ")}`}
                      </span>
                    ))}
                    {bdef.workforce > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400">
                        <Users size={9} className="inline mr-1" />{bdef.workforce} workers
                      </span>
                    )}
                  </div>
                </div>

                {/* Population cap warning */}
                {bdef.populationCap && !canBuildMore(bdef) && unlocked && (
                  <div className="text-xs text-amber-400 mb-2 flex items-center gap-1">
                    <AlertCircle size={10} /> Requires {bdef.populationCap * (count + 1)} population
                  </div>
                )}

                {/* Per-building insurance toggle */}
                {unlocked && buildable && (
                  <div
                    className={`mb-3 rounded-xl border px-3 py-2 flex items-center gap-3 cursor-pointer transition-all ${insuranceMap[bdef.id] ? "border-blue-400/40 bg-blue-500/10" : "border-white/10 bg-white/5"}`}
                    onClick={() => setInsuranceMap(m => ({ ...m, [bdef.id]: !m[bdef.id] }))}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${insuranceMap[bdef.id] ? "border-blue-400 bg-blue-400" : "border-slate-600"}`}>
                      {insuranceMap[bdef.id] && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={11} className="text-blue-400" />
                        <span className="text-xs font-bold text-white">Add Building Insurance</span>
                        <span className="text-[10px] text-blue-400 font-bold ep-mono">+200 cr</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Protects against crime damage & weather disasters</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => construct(bdef)}
                  disabled={!unlocked || !affordable || !buildable || !!building || (addInsurance && (nation.currency || 0) < ((bdef.cost.currency || 0) + 200))}
                  className="w-full py-2.5 rounded-xl text-xs font-bold min-h-[40px] transition-all bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBuilding ? (
                    <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Building...</>
                  ) : (
                    <><Hammer size={12} /> {!unlocked ? "Locked" : !buildable ? "At Capacity" : !affordable ? "Insufficient Resources" : `Construct${addInsurance ? " + Insure" : ""}`}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>


      </main>

      {showBank && nation && (
        <BankingPanel
          nation={nation}
          onClose={() => setShowBank(false)}
          onRefresh={async () => {
            const [fn, fb] = await Promise.all([
              base44.entities.Nation.filter({ owner_email: user.email }),
              base44.entities.Building.filter({ nation_id: nation.id }),
            ]);
            setNation(fn[0]);
            setBuildings(fb);
          }}
        />
      )}
    </div>
  );
}

function Req({ met, label, sub }) {
  return (
    <div className={`rounded-xl p-3 border ${met ? "border-green-400/30 bg-green-400/5" : "border-red-400/20 bg-red-400/5"}`}>
      <div className={`font-bold text-xs ${met ? "text-green-400" : "text-red-400"}`}>
        {met ? "✅" : "❌"} {label}
      </div>
      <div className="text-slate-500 text-xs mt-0.5">{sub}</div>
    </div>
  );
}