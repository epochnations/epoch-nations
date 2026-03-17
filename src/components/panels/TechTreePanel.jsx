import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Cpu, CheckCircle, ChevronRight, Zap, Hammer } from "lucide-react";
import { EPOCHS, EPOCH_EMOJI, TECH_TREE, EPOCH_STABILITY_THRESHOLD, EPOCH_ADVANCE_COST } from "../game/EpochConfig";
import { EPOCH_REQUIREMENTS, BUILDING_MAP } from "../game/BuildingConfig";
import EpochCelebration from "../game/EpochCelebration";
import ResearchPanel from "../research/ResearchPanel";

const RESOURCE_LABELS = {
  res_wood: "Wood", res_stone: "Stone", res_gold: "Gold",
  res_iron: "Iron", res_oil: "Oil", res_food: "Food"
};

function ReqItem({ met, label, current, max }) {
  return (
    <div className={`rounded-lg p-2 border text-xs ${met ? "border-green-400/30 bg-green-400/5" : "border-red-400/20 bg-red-400/5"}`}>
      <div className={`font-bold ${met ? "text-green-400" : "text-red-400"}`}>{met ? "✅" : "❌"} {label}</div>
      {current !== undefined && <div className="text-slate-500 mt-0.5">{current}{max !== undefined ? ` / ${max}` : ""}</div>}
    </div>
  );
}

const EPOCH_RESET_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h cooldown stored in localStorage

export default function TechTreePanel({ nation, onRefresh, onClose }) {
  const [loading, setLoading] = useState(null);
  const [nationBuildings, setNationBuildings] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [celebrationEpoch, setCelebrationEpoch] = useState(null);

  const [showResearch, setShowResearch] = useState(false);
  const lastResetKey = `epoch_reset_${nation?.id}`;
  const lastReset = parseInt(localStorage.getItem(lastResetKey) || "0");
  const cooldownRemaining = Math.max(0, EPOCH_RESET_COOLDOWN_MS - (Date.now() - lastReset));
  const canReset = cooldownRemaining === 0;

  useEffect(() => {
    if (!nation?.id) return;
    base44.entities.Building.filter({ nation_id: nation.id }).then(setNationBuildings);
  }, [nation?.id]);

  if (!nation) return null;

  const unlocked = nation.unlocked_techs || [];
  const epochIndex = EPOCHS.indexOf(nation.epoch);
  const canAdvance = epochIndex < EPOCHS.length - 1;
  const nextEpochName = canAdvance ? EPOCHS[epochIndex + 1] : null;
  const epochReqs = EPOCH_REQUIREMENTS[nation.epoch];

  function buildingCount(id) {
    return nationBuildings.filter(b => b.building_type === id && !b.is_destroyed).length;
  }

  // Check all requirements
  const stabilityThreshold = EPOCH_STABILITY_THRESHOLD[nation.epoch] || 70;
  let reqsMet = { tp: false, population: false, stability: false, buildings: {}, resources: {}, treasury: false };
  if (epochReqs) {
    reqsMet.tp = (nation.tech_points || 0) >= epochReqs.tp;
    reqsMet.population = (nation.population || 0) >= epochReqs.population;
    reqsMet.stability = (nation.stability || 0) >= stabilityThreshold;
    reqsMet.treasury = (nation.currency || 0) >= (epochReqs.treasury || 0);
    Object.entries(epochReqs.buildings || {}).forEach(([bid, req]) => {
      reqsMet.buildings[bid] = buildingCount(bid) >= req;
    });
    Object.entries(epochReqs.resources || {}).forEach(([res, req]) => {
      reqsMet.resources[res] = (nation[res] || 0) >= req;
    });
  }
  const allReqsMet = epochReqs
    ? reqsMet.tp && reqsMet.population && reqsMet.stability && reqsMet.treasury
      && Object.values(reqsMet.buildings).every(Boolean)
      && Object.values(reqsMet.resources).every(Boolean)
    : false;

  async function unlock(tech) {
    if (unlocked.includes(tech.id) || nation.tech_points < tech.cost) return;
    setLoading(tech.id);
    const updates = {
      tech_points: nation.tech_points - tech.cost,
      unlocked_techs: [...unlocked, tech.id],
      ...Object.fromEntries(
        Object.entries(tech.effect).map(([k, v]) => [k, (nation[k] || 0) + v])
      )
    };
    if (updates.public_trust) updates.public_trust = Math.min(2.0, updates.public_trust);
    await base44.entities.Nation.update(nation.id, updates);
    await base44.entities.Transaction.create({
      type: "tech_unlock",
      from_nation_id: nation.id,
      from_nation_name: nation.name,
      description: `${nation.name} unlocked: ${tech.name} (-${tech.cost} TP)`
    });
    setLoading(null);
    onRefresh?.();
  }

  async function advanceEpoch() {
    if (!allReqsMet) return;
    setLoading("advance");
    const nextEpoch = nextEpochName;
    const advanceCost = EPOCH_ADVANCE_COST[nation.epoch] || epochReqs?.tp || 0;

    await base44.entities.Nation.update(nation.id, {
      epoch: nextEpoch,
      tech_points: nation.tech_points - advanceCost,
      tech_level: (nation.tech_level || 1) + 1
    });

    await base44.entities.Stock.create({
      company_name: `${nation.name} ${nextEpoch} Corp`,
      ticker: nation.name.substring(0, 2).toUpperCase() + nextEpoch.substring(0, 2).toUpperCase(),
      nation_id: nation.id,
      nation_name: nation.name,
      sector: epochIndex >= 11 ? "Nano" : epochIndex >= 9 ? "Technology" : "Energy",
      total_shares: 1500, available_shares: 1500,
      base_price: 20 + epochIndex * 5,
      current_price: 20 + epochIndex * 5,
      price_history: [20 + epochIndex * 5],
      market_cap: (20 + epochIndex * 5) * 1500,
      is_crashed: false, epoch_required: nextEpoch
    });

    await base44.entities.Notification.create({
      target_owner_email: nation.owner_email,
      target_nation_id: nation.id,
      type: "tech_unlocked",
      title: `🚀 Epoch Advanced: ${nextEpoch}!`,
      message: `Your nation has entered the ${nextEpoch}! New technologies and stock sector unlocked!`,
      severity: "success", is_read: false
    });

    const domesticStocks = await base44.entities.Stock.filter({ nation_id: nation.id });
    for (const s of domesticStocks) {
      const newPrice = parseFloat((s.current_price * 1.15).toFixed(2));
      await base44.entities.Stock.update(s.id, {
        current_price: newPrice,
        price_history: [...(s.price_history || []), newPrice].slice(-20),
        market_cap: parseFloat((newPrice * s.total_shares).toFixed(2))
      });
    }

    await base44.entities.NewsArticle.create({
      headline: `SCIENTIFIC BREAKTHROUGH: ${nation.name} Enters the ${nextEpoch} Age!`,
      body: `A NEW ERA BEGINS: ${nation.name} has officially entered the ${nextEpoch} Epoch! Domestic stocks surged 15%. New units, sectors, and technologies are now available.`,
      category: "tech", tier: "gold",
      nation_name: nation.name, nation_flag: nation.flag_emoji, nation_color: nation.flag_color
    });

    setLoading(null);
    onRefresh?.();
    // Show celebration — close tech tree panel AFTER celebration
    setCelebrationEpoch(nextEpoch);
  }

  const currentTechs = TECH_TREE[nation.epoch] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl overflow-hidden flex flex-col">
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-violet-400" />
            <span className="font-bold text-white text-sm sm:text-base">Tech Tree — {nation.epoch} Era</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-yellow-400 font-mono font-bold">{nation.tech_points} TP</span>
            </div>
            <button
              onClick={() => setShowResearch(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold hover:bg-fuchsia-500/20 transition-all"
            >
              🔬 Research
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
          </div>
        </div>

        {/* Epoch progress bar */}
        <div className="px-4 sm:px-6 pt-4 pb-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {EPOCHS.map((ep, i) => {
              const done = i < epochIndex;
              const current = i === epochIndex;
              return (
                <div key={ep} className="flex items-center gap-1 shrink-0">
                  <div className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${current ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/40" : done ? "bg-green-400/10 text-green-400" : "text-slate-600"}`}>
                    {EPOCH_EMOJI[ep]} {done ? "✓" : ""}{ep}
                  </div>
                  {i < EPOCHS.length - 1 && <div className={`w-3 h-px shrink-0 ${done ? "bg-green-400/40" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Current epoch techs */}
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">{nation.epoch} Technologies</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentTechs.map(tech => {
                const isUnlocked = unlocked.includes(tech.id);
                const canAfford = nation.tech_points >= tech.cost;
                return (
                  <button key={tech.id} onClick={() => unlock(tech)}
                    disabled={isUnlocked || !canAfford || loading === tech.id}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isUnlocked ? "border-green-400/30 bg-green-400/10"
                      : canAfford ? "border-violet-400/30 bg-violet-400/10 hover:bg-violet-400/20 cursor-pointer"
                      : "border-white/10 bg-white/5 opacity-50 cursor-not-allowed"
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{tech.name}</span>
                      {isUnlocked ? <CheckCircle size={14} className="text-green-400" /> : (
                        <div className="flex items-center gap-1 text-xs font-mono text-yellow-400"><Zap size={10} /> {tech.cost}</div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{tech.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Epoch advancement */}
          {canAdvance && epochReqs && (
            <div className={`rounded-xl p-5 border ${allReqsMet ? "border-cyan-400/50 bg-cyan-400/5" : "border-white/10 bg-white/5"}`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <ChevronRight size={16} className="text-cyan-400" />
                  Advance to {nextEpochName} {EPOCH_EMOJI[nextEpochName]}
                </div>
                {allReqsMet && <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-xl">✅ Ready!</span>}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <ReqItem met={reqsMet.tp} label={`${epochReqs.tp} TP`} current={nation.tech_points} max={epochReqs.tp} />
                <ReqItem met={reqsMet.population} label={`${epochReqs.population} Pop`} current={nation.population} max={epochReqs.population} />
                <ReqItem met={reqsMet.stability} label={`${stabilityThreshold}% Stability`} current={Math.round(nation.stability || 0)} max={stabilityThreshold} />
                {epochReqs.treasury > 0 && (
                  <ReqItem met={reqsMet.treasury} label={`${epochReqs.treasury.toLocaleString()} cr Treasury`} current={Math.round(nation.currency || 0)} max={epochReqs.treasury} />
                )}
                {Object.entries(epochReqs.buildings || {}).map(([bid, req]) => (
                  <ReqItem key={bid} met={reqsMet.buildings[bid]}
                    label={`${req}× ${BUILDING_MAP[bid]?.name || bid}`}
                    current={buildingCount(bid)} max={req} />
                ))}
                {Object.entries(epochReqs.resources || {}).map(([res, req]) => (
                  <ReqItem key={res} met={reqsMet.resources[res]}
                    label={`${req} ${RESOURCE_LABELS[res] || res}`}
                    current={nation[res] || 0} max={req} />
                ))}
              </div>
              {!reqsMet.stability && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-3 font-bold">
                  ⚠ Stability below {stabilityThreshold}% — advancement blocked until restored. Invest in welfare, food surplus, or peace.
                </div>
              )}

              {!allReqsMet && (
                <div className="text-xs text-amber-400 mb-3 flex items-center gap-1.5">
                  <Hammer size={10} /> Build required structures in the Construction Hub first
                </div>
              )}

              <button onClick={advanceEpoch} disabled={!allReqsMet || loading === "advance"}
                className="w-full py-3 min-h-[44px] rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 transition-all">
                {loading === "advance" ? "Advancing..." : !allReqsMet ? "Requirements Not Met" : "ADVANCE EPOCH 🚀"}
              </button>
            </div>
          )}

          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-xs text-slate-400">
              💡 TP is generated by Schools/Universities (buildings), Researchers (workforce), and Education Spending. Build Schools in the Construction Hub to accelerate progression.
            </div>
          </div>

          {/* Epoch Reset */}
          {epochIndex > 0 && (
            <div className="rounded-xl p-4 border border-red-500/20 bg-red-500/5">
              <div className="text-xs font-bold text-red-400 mb-1 flex items-center gap-2">
                ⚠ Danger Zone — Epoch Reset
              </div>
              <div className="text-xs text-slate-400 mb-3">
                Resets your civilization to Stone Age. Resources and stocks are preserved. Buildings become inactive. 24-hour cooldown applies.
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={!canReset}
                className="w-full py-2.5 rounded-xl text-xs font-bold border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {canReset ? "Reset Epoch to Stone Age" : `On cooldown (${Math.ceil(cooldownRemaining / 3600000)}h remaining)`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Epoch Reset Confirmation Modal */}
      {/* Epoch Celebration Overlay */}
      {celebrationEpoch && (
        <EpochCelebration
          newEpoch={celebrationEpoch}
          nation={nation}
          onClose={() => { setCelebrationEpoch(null); onClose?.(); }}
        />
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0f172a] border border-red-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="text-lg font-bold text-red-400 mb-2">⚠ Confirm Epoch Reset</div>
            <p className="text-sm text-slate-300 mb-3">
              This will reset <span className="font-bold text-white">{nation.name}</span> back to the <span className="font-bold">Stone Age</span>.
            </p>
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 mb-4 text-xs text-red-300 space-y-1">
              <div>• Epoch returns to Stone Age</div>
              <div>• Tech level resets to 1</div>
              <div>• Unlocked techs are cleared</div>
              <div>• Investor confidence drops temporarily</div>
              <div>• Buildings become inactive</div>
              <div>• A news announcement is posted</div>
              <div>• Resources and stocks are NOT deleted</div>
              <div>• 24-hour cooldown before next reset</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-slate-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setLoading("reset");
                  setShowResetConfirm(false);
                  await base44.entities.Nation.update(nation.id, {
                    epoch: "Stone Age",
                    tech_level: 1,
                    unlocked_techs: [],
                    public_trust: Math.max(0.3, (nation.public_trust || 1.0) - 0.3)
                  });
                  // Mark all buildings as inactive/destroyed
                  const buildings = await base44.entities.Building.filter({ nation_id: nation.id });
                  for (const b of buildings) {
                    await base44.entities.Building.update(b.id, { is_destroyed: true });
                  }
                  await base44.entities.NewsArticle.create({
                    headline: `CIVILIZATION RESET: ${nation.name} returns to the Stone Age`,
                    body: `${nation.name} has voluntarily reset its civilization level. The nation returns to the Stone Age, beginning anew.`,
                    category: "milestone", tier: "standard",
                    nation_name: nation.name, nation_flag: nation.flag_emoji, nation_color: nation.flag_color
                  });
                  localStorage.setItem(lastResetKey, Date.now().toString());
                  setLoading(null);
                  onRefresh?.();
                  onClose?.();
                }}
                disabled={loading === "reset"}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-500 disabled:opacity-40 transition-all"
              >
                {loading === "reset" ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}