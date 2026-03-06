import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { EPOCHS } from "../game/EpochConfig";

// Base Treasury value per 100 units
const RESOURCE_BASE = {
  res_wood:  { label: "🪵 Wood",  base: 40 },
  res_stone: { label: "🪨 Stone", base: 60 },
  res_iron:  { label: "⚙️ Iron",  base: 100 },
  res_oil:   { label: "🛢️ Oil",   base: 160 },
  res_gold:  { label: "🥇 Gold",  base: 250 },
};

function calcValue(resourceKey, quantity100s, nation, marketCount) {
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const epochMult = 1 + epochIndex * 0.04; // +4% per epoch
  const marketEff = Math.min(1.15, 1 + (marketCount - 1) * 0.03); // +3% per extra market, cap 115%
  const warPenalty = (nation.at_war_with?.length > 0) ? 0.9 : 1;
  const stabilityMult = 0.7 + (Math.min(100, nation.stability || 75) / 100) * 0.3;
  return Math.round(
    RESOURCE_BASE[resourceKey].base * quantity100s * epochMult * marketEff * warPenalty * stabilityMult
  );
}

export default function MarketSellPanel({ nation, marketCount, onRefresh }) {
  const [confirm, setConfirm] = useState(null); // { key, qty100, value }
  const [selling, setSelling] = useState(false);

  const atWar = (nation.at_war_with?.length > 0);

  async function executeSell() {
    if (!confirm || selling) return;
    setSelling(true);
    const { key, qty100, value } = confirm;
    const deduct = qty100 * 100;
    await base44.entities.Nation.update(nation.id, {
      [key]: Math.max(0, (nation[key] || 0) - deduct),
      currency: (nation.currency || 0) + value,
    });
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: nation.id,
      from_nation_name: nation.name,
      description: `${nation.name} sold ${deduct} ${RESOURCE_BASE[key].label.replace(/[^\w\s]/g,"").trim()} for ${value} treasury`,
      total_value: value,
      epoch: nation.epoch,
    });
    setConfirm(null);
    setSelling(false);
    onRefresh?.();
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-green-400/20 rounded-2xl p-5 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🏪</span>
        <span className="font-bold text-white">Market — Sell Resources</span>
        <span className="ml-auto text-xs text-slate-400">{marketCount} Market{marketCount !== 1 ? "s" : ""} active</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Sell natural resources for Treasury credits. Minimum 100 units per transaction.
        {atWar && <span className="text-orange-400 ml-1">⚔️ War penalty: −10% sell efficiency.</span>}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(RESOURCE_BASE).map(([key, { label }]) => {
          const have = nation[key] || 0;
          const max100s = Math.floor(have / 100);
          const canSell = max100s >= 1;
          // offer up to 5 quantity options in multiples of 100
          const options = canSell
            ? Array.from({ length: Math.min(5, max100s) }, (_, i) => i + 1)
            : [];

          return (
            <div key={key} className={`rounded-xl border p-4 ${canSell ? "border-green-400/20 bg-green-400/3" : "border-white/5 bg-white/3 opacity-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{label}</span>
                <span className="text-xs text-slate-400 font-mono">{have.toLocaleString()} available</span>
              </div>
              {!canSell ? (
                <div className="text-xs text-slate-500">Need at least 100 units to sell.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {options.map(qty100 => {
                    const val = calcValue(key, qty100, nation, marketCount);
                    return (
                      <button
                        key={qty100}
                        onClick={() => setConfirm({ key, label, qty100, value: val })}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 transition-all"
                      >
                        Sell {qty100 * 100} → +{val} 💰
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirm(null)}>
          <div className="bg-[#0f172a] border border-green-400/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-black text-white mb-1">Confirm Sale</div>
            <p className="text-sm text-slate-400 mb-4">
              Sell <span className="text-white font-bold">{confirm.qty100 * 100} {confirm.label}</span> for{" "}
              <span className="text-green-400 font-bold">+{confirm.value} 💰 Treasury</span>?
            </p>
            <div className="text-xs text-slate-500 mb-4">
              Treasury after sale: <span className="text-white font-mono">{((nation.currency || 0) + confirm.value).toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5">
                Cancel
              </button>
              <button onClick={executeSell} disabled={selling}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2">
                {selling ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Selling...</> : "✓ Confirm Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}