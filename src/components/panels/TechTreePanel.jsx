import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Cpu, Lock, CheckCircle, ChevronRight, Zap } from "lucide-react";

const TECH_TREE = {
  Industrial: [
    { id: "heavy_industry", name: "Heavy Industry", cost: 50, desc: "Manufacturing +20", effect: { manufacturing: 20 } },
    { id: "rail_network", name: "Rail Networks", cost: 75, desc: "GDP +200, Stability +5", effect: { gdp: 200, stability: 5 } },
    { id: "conscript_army", name: "Conscript Army", cost: 60, desc: "Unit Power +15, Defense +10", effect: { unit_power: 15, defense_level: 10 } },
    { id: "national_bank", name: "National Bank", cost: 80, desc: "Public Trust +0.15", effect: { public_trust: 0.15 } },
    { id: "coal_power", name: "Coal Power Grid", cost: 90, desc: "GDP +150, Manufacturing +10", effect: { gdp: 150, manufacturing: 10 } },
    { id: "telegraph", name: "Telegraph Network", cost: 65, desc: "Stability +8, Defense +8", effect: { stability: 8, defense_level: 8 } },
  ],
  Information: [
    { id: "cyberwarfare", name: "Cyber Warfare", cost: 120, desc: "Tech Level +1, Unit Power +20", effect: { tech_level: 1, unit_power: 20 } },
    { id: "ai_economy", name: "AI Economy", cost: 150, desc: "GDP +500, Public Trust +0.2", effect: { gdp: 500, public_trust: 0.2 } },
    { id: "satellite_grid", name: "Satellite Grid", cost: 100, desc: "Defense +25, Stability +10", effect: { defense_level: 25, stability: 10 } },
    { id: "digital_finance", name: "Digital Finance", cost: 130, desc: "Currency +2000, GDP +300", effect: { currency: 2000, gdp: 300 } },
    { id: "drone_fleet", name: "Drone Fleet", cost: 140, desc: "Unit Power +30, Defense +15", effect: { unit_power: 30, defense_level: 15 } },
    { id: "social_media_ops", name: "Social Media Ops", cost: 110, desc: "Public Trust +0.3, Stability +5", effect: { public_trust: 0.3, stability: 5 } },
    { id: "green_energy", name: "Green Energy Grid", cost: 120, desc: "GDP +400, Manufacturing +15", effect: { gdp: 400, manufacturing: 15 } },
    { id: "biotech", name: "Biotech Labs", cost: 160, desc: "Stability +15, Trust +0.15", effect: { stability: 15, public_trust: 0.15 } },
  ],
  Nano: [
    { id: "nanoweapons", name: "Nanoweapons", cost: 250, desc: "Unit Power +50, Defense +20", effect: { unit_power: 50, defense_level: 20 } },
    { id: "nano_medicine", name: "Nano Medicine", cost: 200, desc: "Stability +20, Public Trust +0.3", effect: { stability: 20, public_trust: 0.3 } },
    { id: "replicators", name: "Replicators", cost: 300, desc: "Manufacturing +30, GDP +800", effect: { manufacturing: 30, gdp: 800 } },
    { id: "quantum_finance", name: "Quantum Finance", cost: 280, desc: "Currency +5000, GDP +500", effect: { currency: 5000, gdp: 500 } },
    { id: "mind_interface", name: "Mind Interface", cost: 350, desc: "Tech Level +2, Trust +0.4", effect: { tech_level: 2, public_trust: 0.4 } },
    { id: "molecular_forge", name: "Molecular Forge", cost: 320, desc: "Manufacturing +50, GDP +1200", effect: { manufacturing: 50, gdp: 1200 } },
    { id: "nano_army", name: "Nano Army Swarms", cost: 400, desc: "Unit Power +80, Defense +40", effect: { unit_power: 80, defense_level: 40 } },
    { id: "nano_shield", name: "Nano Shield Grid", cost: 380, desc: "Defense +60, Stability +15", effect: { defense_level: 60, stability: 15 } },
  ],
  Singularity: [
    { id: "agi_government", name: "AGI Governance Core", cost: 600, desc: "All stats +massive, Tech Level +3", effect: { tech_level: 3, gdp: 3000, stability: 20, public_trust: 0.5 } },
    { id: "dyson_sphere", name: "Dyson Sphere Fragment", cost: 800, desc: "GDP +8000, Manufacturing +100", effect: { gdp: 8000, manufacturing: 100 } },
    { id: "time_crystal_bank", name: "Time Crystal Bank", cost: 700, desc: "Currency +25000, GDP +2000", effect: { currency: 25000, gdp: 2000 } },
    { id: "omnidrone", name: "OmniDrone Network", cost: 650, desc: "Unit Power +150, Defense +100", effect: { unit_power: 150, defense_level: 100 } },
    { id: "memetic_control", name: "Memetic Control Grid", cost: 550, desc: "Public Trust +0.8, Stability +30", effect: { public_trust: 0.8, stability: 30 } },
    { id: "post_scarcity", name: "Post-Scarcity Engine", cost: 900, desc: "Manufacturing +200, GDP +5000", effect: { manufacturing: 200, gdp: 5000 } },
  ]
};

const EPOCH_ORDER = ["Industrial", "Information", "Nano", "Singularity"];
const EPOCH_ADVANCE_COST = { Industrial: 200, Information: 500, Nano: 1000 };

export default function TechTreePanel({ nation, onRefresh, onClose }) {
  const [loading, setLoading] = useState(null);

  if (!nation) return null;

  const unlocked = nation.unlocked_techs || [];
  const canAdvance = nation.epoch !== "Nano";
  const advanceCost = EPOCH_ADVANCE_COST[nation.epoch] || 9999;

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
    const nextEpoch = EPOCH_ORDER[EPOCH_ORDER.indexOf(nation.epoch) + 1];

    await base44.entities.Nation.update(nation.id, {
      epoch: nextEpoch,
      tech_points: nation.tech_points - advanceCost,
      tech_level: (nation.tech_level || 1) + 2  // +2 levels on epoch advance
    });

    // Unlock new stock sector
    await base44.entities.Stock.create({
      company_name: `${nation.name} ${nextEpoch} Corp`,
      ticker: nation.name.substring(0, 2).toUpperCase() + nextEpoch.substring(0, 2).toUpperCase(),
      nation_id: nation.id,
      nation_name: nation.name,
      sector: nextEpoch === "Information" ? "Technology" : "Nano",
      total_shares: 1500,
      available_shares: 1500,
      base_price: 25,
      current_price: 25,
      price_history: [25],
      market_cap: 37500,
      is_crashed: false,
      epoch_required: nextEpoch
    });

    await base44.entities.Notification.create({
      target_owner_email: nation.owner_email,
      target_nation_id: nation.id,
      type: "tech_unlocked",
      title: `🚀 Epoch Advanced: ${nextEpoch}!`,
      message: `Your nation has entered the ${nextEpoch} Age. New stock sector unlocked!`,
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
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {EPOCH_ORDER.map((ep, i) => {
              const idx = EPOCH_ORDER.indexOf(nation.epoch);
              const done = i < idx;
              const current = i === idx;
              return (
                <div key={ep} className="flex items-center gap-2 shrink-0">
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${current ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/40" : done ? "bg-green-400/10 text-green-400" : "text-slate-600"}`}>
                    {done ? "✓ " : ""}{ep}
                  </div>
                  {i < EPOCH_ORDER.length - 1 && <div className={`w-6 h-px ${done ? "bg-green-400/40" : "bg-white/10"}`} />}
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