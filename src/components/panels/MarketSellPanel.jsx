import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { EPOCHS } from "../game/EpochConfig";

const RESOURCE_BASE = {
  res_wood:  { label: "🪵 Wood",  base: 40 },
  res_stone: { label: "🪨 Stone", base: 60 },
  res_iron:  { label: "⚙️ Iron",  base: 100 },
  res_oil:   { label: "🛢️ Oil",   base: 160 },
  res_gold:  { label: "🥇 Gold",  base: 250 },
};

function calcMarketValue(resourceKey, quantity, nation, marketCount) {
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const epochMult = 1 + epochIndex * 0.04;
  const marketEff = Math.min(1.15, 1 + (marketCount - 1) * 0.03);
  const warPenalty = (nation.at_war_with?.length > 0) ? 0.9 : 1;
  const stabilityMult = 0.7 + (Math.min(100, nation.stability || 75) / 100) * 0.3;
  return Math.round(
    RESOURCE_BASE[resourceKey].base * (quantity / 100) * epochMult * marketEff * warPenalty * stabilityMult
  );
}

export default function MarketSellPanel({ nation, marketCount, onRefresh }) {
  // customPrices: { [resourceKey]: number } — player-set price per 100 units
  const [customPrices, setCustomPrices] = useState(() => {
    const init = {};
    Object.keys(RESOURCE_BASE).forEach(k => { init[k] = RESOURCE_BASE[k].base; });
    return init;
  });
  const [quantities, setQuantities] = useState(() => {
    const init = {};
    Object.keys(RESOURCE_BASE).forEach(k => { init[k] = 100; });
    return init;
  });
  const [confirm, setConfirm] = useState(null);
  const [selling, setSelling] = useState(false);

  const atWar = (nation.at_war_with?.length > 0);

  function effectiveValue(key) {
    const qty = quantities[key] || 100;
    const marketVal = calcMarketValue(key, qty, nation, marketCount);
    // Use the higher of market value or custom price scaled to quantity
    const customVal = Math.round((customPrices[key] / 100) * qty);
    // Custom price is bounded: max 2x market value, min 10
    return Math.max(10, Math.min(customVal, marketVal * 2));
  }

  async function executeSell() {
    if (!confirm || selling) return;
    setSelling(true);
    const { key, qty, value } = confirm;
    await base44.entities.Nation.update(nation.id, {
      [key]: Math.max(0, (nation[key] || 0) - qty),
      currency: (nation.currency || 0) + value,
    });
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: nation.id,
      from_nation_name: nation.name,
      description: `${nation.name} sold ${qty} ${RESOURCE_BASE[key].label.replace(/[^\w\s]/g,"").trim()} for ${value} treasury`,
      total_value: value,
      epoch: nation.epoch,
    });
    setConfirm(null);
    setSelling(false);
    onRefresh?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🏪</span>
        <span className="font-bold text-white">Sell Resources</span>
        <span className="ml-auto text-xs text-slate-400">{marketCount} Market{marketCount !== 1 ? "s" : ""} active</span>
      </div>
      <p className="text-xs text-slate-500">
        Set your custom price per 100 units. Market value shown as reference.
        {atWar && <span className="text-orange-400 ml-1">⚔️ War penalty: −10% market value.</span>}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(RESOURCE_BASE).map(([key, { label, base }]) => {
          const have = nation[key] || 0;
          const qty = quantities[key] || 100;
          const maxQty = Math.floor(have / 10) * 10;
          const canSell = have >= 10;
          const marketRef = calcMarketValue(key, 100, nation, marketCount);
          const sellVal = effectiveValue(key);
          const customP = customPrices[key];
          const priceStatus = customP > marketRef * 1.5 ? "text-red-400" : customP < marketRef * 0.7 ? "text-yellow-400" : "text-green-400";

          return (
            <div key={key} className={`rounded-xl border p-4 ${canSell ? "border-green-400/20 bg-green-400/3" : "border-white/5 bg-white/3 opacity-50"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">{label}</span>
                <span className="text-xs text-slate-400 font-mono">{have.toLocaleString()} available</span>
              </div>
              {!canSell ? (
                <div className="text-xs text-slate-500">Need at least 10 units to sell.</div>
              ) : (
                <>
                  {/* Custom price input */}
                  <div className="mb-3">
                    <label className="text-xs text-slate-500 mb-1 block">Price per 100 units <span className="text-slate-600">(market ref: {marketRef}💰)</span></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={1} value={customP}
                        onChange={e => setCustomPrices(p => ({ ...p, [key]: Number(e.target.value) }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                      <button onClick={() => setCustomPrices(p => ({ ...p, [key]: marketRef }))}
                        className="px-2 py-1.5 rounded-lg text-xs border border-white/10 text-slate-400 hover:bg-white/5 whitespace-nowrap">
                        Use Market
                      </button>
                    </div>
                    <div className={`text-xs mt-1 ${priceStatus}`}>
                      {customP > marketRef * 1.5 ? "⚠ Very high — buyers may hesitate" :
                       customP < marketRef * 0.7 ? "⚠ Below market — good for quick sales" :
                       "✓ Competitive price"}
                    </div>
                  </div>
                  {/* Quantity slider */}
                  <div className="mb-3">
                    <label className="text-xs text-slate-500 mb-1 flex justify-between">
                      <span>Quantity</span><span className="font-mono text-white">{qty}</span>
                    </label>
                    <input type="range" min={10} max={Math.max(10, maxQty)} step={10} value={qty}
                      onChange={e => setQuantities(q => ({ ...q, [key]: Number(e.target.value) }))}
                      style={{ accentColor: "#22c55e" }}
                      className="w-full" />
                  </div>
                  {/* Sell button */}
                  <button
                    onClick={() => setConfirm({ key, label, qty, value: sellVal })}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 transition-all"
                  >
                    Sell {qty} → +{sellVal}💰
                  </button>
                </>
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
              Sell <span className="text-white font-bold">{confirm.qty} {confirm.label}</span> for{" "}
              <span className="text-green-400 font-bold">+{confirm.value}💰 Treasury</span>?
            </p>
            <div className="text-xs text-slate-500 mb-4">
              Treasury after: <span className="text-white font-mono">{((nation.currency || 0) + confirm.value).toLocaleString()}</span>
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