import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShoppingCart } from "lucide-react";
import { EPOCHS } from "../game/EpochConfig";

const RESOURCE_META = {
  res_wood:  { label: "Wood",  emoji: "🪵", base: 40 },
  res_stone: { label: "Stone", emoji: "🪨", base: 60 },
  res_iron:  { label: "Iron",  emoji: "⚙️", base: 100 },
  res_oil:   { label: "Oil",   emoji: "🛢️", base: 160 },
  res_gold:  { label: "Gold",  emoji: "🥇", base: 250 },
};

// Import costs are higher than sell values (market premium)
function importPrice(resourceKey, qty, nation) {
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const epochMult = 1 + epochIndex * 0.03;
  // Import has a 30% premium over base sell price
  return Math.round(RESOURCE_META[resourceKey].base * (qty / 100) * epochMult * 1.30);
}

const SHORTAGE_THRESHOLD = 100;

export default function ImportPanel({ nation, agreements, onRefresh }) {
  const [purchasing, setPurchasing] = useState(null);
  const [customQty, setCustomQty] = useState({});

  function getAgreementModifier(resourceKey) {
    // Global agreements that affect all imports (simplified: check for any free trade with any nation)
    const hasFreeTrade = agreements.some(a =>
      (a.nation_a_id === nation.id || a.nation_b_id === nation.id) &&
      a.agreement_type === "free_trade" && a.status === "active"
    );
    const hasEmbargo = agreements.some(a =>
      (a.nation_a_id === nation.id || a.nation_b_id === nation.id) &&
      a.agreement_type === "embargo" && a.status === "active"
    );
    if (hasEmbargo) return { mod: 0.5, label: "🚫 Embargo +50%" };
    if (hasFreeTrade) return { mod: -0.10, label: "🤝 Free Trade −10%" };
    return { mod: 0, label: null };
  }

  async function executePurchase(resourceKey, qty) {
    if (purchasing) return;
    setPurchasing(resourceKey);
    const baseCost = importPrice(resourceKey, qty, nation);
    const { mod } = getAgreementModifier(resourceKey);
    const finalCost = Math.round(baseCost * (1 + mod));

    if ((nation.currency || 0) < finalCost) {
      alert("Insufficient treasury for this import order.");
      setPurchasing(null);
      return;
    }

    await base44.entities.Nation.update(nation.id, {
      [resourceKey]: (nation[resourceKey] || 0) + qty,
      currency: Math.max(0, (nation.currency || 0) - finalCost),
    });
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: nation.id,
      from_nation_name: nation.name,
      to_nation_name: "Global Market",
      resource_type: resourceKey,
      resource_amount: qty,
      total_value: finalCost,
      description: `${nation.name} imported ${qty} ${RESOURCE_META[resourceKey].label} from global market for ${finalCost}💰`,
      epoch: nation.epoch
    });
    setPurchasing(null);
    onRefresh?.();
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-white text-sm flex items-center gap-2"><ShoppingCart size={14} className="text-orange-400" /> Import Resources</h3>
        <p className="text-xs text-slate-500 mt-0.5">Buy resources from the global market when domestic production is low. Prices carry a 30% import premium.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(RESOURCE_META).map(([key, meta]) => {
          const have = nation[key] || 0;
          const isLow = have < SHORTAGE_THRESHOLD;
          const { mod, label: agLabel } = getAgreementModifier(key);
          const qty = customQty[key] || 100;
          const baseCost = importPrice(key, qty, nation);
          const finalCost = Math.round(baseCost * (1 + mod));
          const canAfford = (nation.currency || 0) >= finalCost;

          return (
            <div key={key} className={`rounded-xl border p-4 ${isLow ? "border-orange-400/30 bg-orange-400/5" : "border-white/10 bg-white/3"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{meta.emoji} {meta.label}</span>
                <span className={`text-xs font-mono ${isLow ? "text-orange-400 font-bold" : "text-slate-400"}`}>
                  {have.toLocaleString()} {isLow ? "⚠ LOW" : ""}
                </span>
              </div>
              {agLabel && <div className="text-xs text-yellow-300 mb-2">{agLabel}</div>}
              <div className="flex items-center gap-2 mb-2">
                <select value={qty} onChange={e => setCustomQty(q => ({ ...q, [key]: Number(e.target.value) }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white">
                  {[50, 100, 200, 500, 1000].map(v => <option key={v} value={v}>{v} units</option>)}
                </select>
                <span className="text-xs text-slate-400">→ <span className="text-orange-400 font-bold font-mono">{finalCost}💰</span></span>
              </div>
              <button
                onClick={() => executePurchase(key, qty)}
                disabled={!canAfford || purchasing === key}
                className="w-full py-2 rounded-xl text-xs font-bold border border-orange-400/20 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20 disabled:opacity-40 transition-all"
              >
                {purchasing === key ? "Importing..." : canAfford ? `Import ${qty} ${meta.label}` : "Insufficient funds"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}