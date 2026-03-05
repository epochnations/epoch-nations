import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Cpu, CheckCircle, ChevronRight, Zap } from "lucide-react";
import { EPOCHS, EPOCH_ADVANCE_COST, EPOCH_EMOJI, EPOCH_COLOR, TECH_TREE } from "../game/EpochConfig";

export default function TechTreePanel({ nation, onRefresh, onClose }) {
  const [loading, setLoading] = useState(null);

  if (!nation) return null;

  const unlocked = nation.unlocked_techs || [];
  const epochIndex = EPOCHS.indexOf(nation.epoch);
  const canAdvance = epochIndex < EPOCHS.length - 1;
  const advanceCost = EPOCH_ADVANCE_COST[nation.epoch] || 9999;
  const nextEpochName = canAdvance ? EPOCHS[epochIndex + 1] : null;

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
    // Cap public_trust at 2.0
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
    if (nation.tech_points < advanceCost) return;
    setLoading("advance");
    const nextEpoch = nextEpochName;

    await base44.entities.Nation.update(nation.id, {
      epoch: nextEpoch,
      tech_points: nation.tech_points - advanceCost,
      tech_level: (nation.tech_level || 1) + 1
    });

    // Unlock new stock sector
    await base44.entities.Stock.create({
      company_name: `${nation.name} ${nextEpoch} Corp`,
      ticker: nation.name.substring(0, 2).toUpperCase() + nextEpoch.substring(0, 2).toUpperCase(),
      nation_id: nation.id,
      nation_name: nation.name,
      sector: epochIndex >= 11 ? "Nano" : epochIndex >= 9 ? "Technology" : "Energy",
      total_shares: 1500,
      available_shares: 1500,
      base_price: 20 + epochIndex * 5,
      current_price: 20 + epochIndex * 5,
      price_history: [20 + epochIndex * 5],
      market_cap: (20 + epochIndex * 5) * 1500,
      is_crashed: false,
      epoch_required: nextEpoch
    });

    await base44.entities.Notification.create({
      target_owner_email: nation.owner_email,
      target_nation_id: nation.id,
      type: "tech_unlocked",
      title: `🚀 Epoch Advanced: ${nextEpoch}!`,
      message: `Your nation has entered the ${nextEpoch}! New technologies and stock sector unlocked!`,
      severity: "success",
      is_read: false
    });

    // Boost domestic stocks by 15%
    const domesticStocks = await base44.entities.Stock.filter({ nation_id: nation.id });
    for (const s of domesticStocks) {
      const newPrice = parseFloat((s.current_price * 1.15).toFixed(2));
      await base44.entities.Stock.update(s.id, {
        current_price: newPrice,
        price_history: [...(s.price_history || []), newPrice].slice(-20),
        market_cap: parseFloat((newPrice * s.total_shares).toFixed(2))
      });
    }

    // Gold-tier global news
    await base44.entities.NewsArticle.create({
      headline: `SCIENTIFIC BREAKTHROUGH: ${nation.name} Enters the ${nextEpoch} Age!`,
      body: `A NEW ERA BEGINS: ${nation.name} has officially entered the ${nextEpoch} Epoch! Domestic stocks surged 15% on the news as global markets react to this massive shift in power. New units, sectors, and technologies are now available.`,
      category: "tech",
      tier: "gold",
      nation_name: nation.name,
      nation_flag: nation.flag_emoji,
      nation_color: nation.flag_color
    });

    setLoading(null);
    onRefresh?.();
    onClose?.();
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
            <button onClick={onClose} className="text-slate-400 hover:text-white text-sm p-1">✕</button>
          </div>
        </div>

        {/* Epoch progress bar */}
        <div className="px-4 sm:px-6 pt-4 pb-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
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
                  <button
                    key={tech.id}
                    onClick={() => unlock(tech)}
                    disabled={isUnlocked || !canAfford || loading === tech.id}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isUnlocked
                        ? "border-green-400/30 bg-green-400/10"
                        : canAfford
                        ? "border-violet-400/30 bg-violet-400/10 hover:bg-violet-400/20 cursor-pointer"
                        : "border-white/10 bg-white/5 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{tech.name}</span>
                      {isUnlocked ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-mono text-yellow-400">
                          <Zap size={10} /> {tech.cost}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{tech.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Epoch advancement */}
          {canAdvance && (
            <div className="rounded-xl p-5 border border-cyan-400/30 bg-cyan-400/10">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <ChevronRight size={16} className="text-cyan-400" />
                  Advance to {EPOCH_ORDER[EPOCH_ORDER.indexOf(nation.epoch) + 1]} Epoch
                </div>
                <div className="flex items-center gap-1 text-xs font-mono text-yellow-400">
                  <Zap size={10} /> {advanceCost} TP required
                </div>
              </div>
              <div className="text-xs text-slate-400 mb-3">
                Unlocks new technologies, stock sectors, and advanced military capabilities. 
                <span className="text-cyan-400"> You have {nation.tech_points} / {advanceCost} TP.</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-white/10 mb-3">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${Math.min(100, (nation.tech_points / advanceCost) * 100)}%` }} />
              </div>
              <button
                onClick={advanceEpoch}
                disabled={nation.tech_points < advanceCost || loading === "advance"}
                className="w-full py-3 min-h-[44px] rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 transition-all"
              >
                {loading === "advance" ? "Advancing..." : nation.tech_points < advanceCost ? `Need ${advanceCost - nation.tech_points} more TP` : "ADVANCE EPOCH 🚀"}
              </button>
            </div>
          )}

          {/* TP generation note */}
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-xs text-slate-400">
              💡 Tech Points are generated by Education Spending. Increase it in your nation management panel. You gain roughly <strong className="text-white">{Math.floor(nation.education_spending * 0.5)}</strong> TP per cycle from current {nation.education_spending}% education budget.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}