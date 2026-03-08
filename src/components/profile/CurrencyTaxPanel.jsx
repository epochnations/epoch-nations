import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, DollarSign, Percent } from "lucide-react";

const TAX_CATEGORIES = [
  { key: "tax_tobacco_alcohol", label: "Tobacco & Alcohol", emoji: "🍺", desc: "Sin tax on tobacco and alcohol products" },
  { key: "tax_food", label: "Food & Groceries", emoji: "🌾", desc: "Tax on food and grocery purchases" },
  { key: "tax_gas", label: "Gas & Fuel", emoji: "⛽", desc: "Tax on gasoline and fuel products" },
  { key: "tax_hospitality", label: "Hospitality & Tourism", emoji: "🏨", desc: "Tax on hotels, restaurants, and tourism" },
  { key: "tax_housing", label: "Housing & Property", emoji: "🏠", desc: "Property and real estate tax" },
  { key: "tax_luxury", label: "Luxury Goods", emoji: "💎", desc: "Tax on luxury and high-end goods" },
  { key: "tax_trade", label: "Trade & Commerce", emoji: "📦", desc: "Tax on imports and exports" },
];

function getTaxImpact(rates) {
  const totalTaxBurden = Object.values(rates).reduce((a, b) => a + b, 0);
  const avgRate = totalTaxBurden / TAX_CATEGORIES.length;

  let stabilityImpact = 0;
  let gdpImpact = 0;
  let trustImpact = 0;
  let populationGrowthImpact = 0;
  let revenueBonus = 0;

  // 0-5%: positive/neutral
  // 5-15%: mild negative
  // 15-25%: moderate negative
  // 25%+: severe negative

  TAX_CATEGORIES.forEach(({ key }) => {
    const rate = rates[key] || 0;
    if (rate <= 5) {
      revenueBonus += rate * 3;
    } else if (rate <= 15) {
      revenueBonus += rate * 3;
      stabilityImpact -= (rate - 5) * 0.3;
      trustImpact -= (rate - 5) * 0.2;
    } else if (rate <= 25) {
      revenueBonus += rate * 3;
      stabilityImpact -= 3 + (rate - 15) * 0.6;
      trustImpact -= 2 + (rate - 15) * 0.4;
      gdpImpact -= (rate - 15) * 5;
      populationGrowthImpact -= (rate - 15) * 0.5;
    } else {
      revenueBonus += rate * 2; // diminishing returns
      stabilityImpact -= 9 + (rate - 25) * 1.0;
      trustImpact -= 6 + (rate - 25) * 0.8;
      gdpImpact -= 50 + (rate - 25) * 10;
      populationGrowthImpact -= 5 + (rate - 25) * 1.5;
    }
  });

  return {
    revenueBonus: Math.round(revenueBonus),
    stabilityImpact: Math.round(stabilityImpact),
    gdpImpact: Math.round(gdpImpact),
    trustImpact: Math.round(trustImpact * 10) / 10,
    populationGrowthImpact: Math.round(populationGrowthImpact * 10) / 10,
    avgRate: Math.round(avgRate * 10) / 10,
  };
}

function ImpactBadge({ value, label, suffix = "" }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const color = isNeutral ? "text-slate-400" : isPositive ? "text-green-400" : "text-red-400";
  const bg = isNeutral ? "bg-slate-800" : isPositive ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20";
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${bg}`}>
      <div className={`text-sm font-black ep-mono ${color}`}>
        {isPositive ? "+" : ""}{value}{suffix}
      </div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

export default function CurrencyTaxPanel({ nation, onRefresh }) {
  const [activeTab, setActiveTab] = useState("currency");
  const [currencyName, setCurrencyName] = useState(nation.currency_name || "Credits");
  const [taxRates, setTaxRates] = useState(() => {
    const saved = nation.tax_rates || {};
    const defaults = {};
    TAX_CATEGORIES.forEach(c => { defaults[c.key] = saved[c.key] ?? 0; });
    return defaults;
  });
  const [saving, setSaving] = useState(false);

  async function saveCurrency() {
    setSaving(true);
    await base44.entities.Nation.update(nation.id, { currency_name: currencyName.trim() || "Credits" });
    setSaving(false);
    onRefresh?.();
  }

  async function saveTaxes() {
    setSaving(true);
    const impact = getTaxImpact(taxRates);
    // Apply tax revenue to GDP passively (stored in tax_rates for engine to read)
    await base44.entities.Nation.update(nation.id, {
      tax_rates: taxRates,
      // apply real-time stability/gdp impacts
      stability: Math.max(0, Math.min(100, (nation.stability || 75) + impact.stabilityImpact * 0.1)),
      gdp: Math.max(0, (nation.gdp || 500) + impact.gdpImpact * 0.1),
      public_trust: Math.max(0.1, Math.min(2.0, (nation.public_trust || 1.0) + impact.trustImpact * 0.01)),
    });
    setSaving(false);
    onRefresh?.();
  }

  const impact = getTaxImpact(taxRates);
  const currencySymbol = currencyName.trim() || "Credits";

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-white/10">
        <button
          onClick={() => setActiveTab("currency")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === "currency" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <DollarSign size={12} /> Currency
        </button>
        <button
          onClick={() => setActiveTab("tax")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === "tax" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          <Percent size={12} /> Taxation
        </button>
      </div>

      {activeTab === "currency" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
                National Currency Name
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Set a custom name for your nation's currency. This will appear throughout the game wherever currency is displayed.
              </p>
              <input
                type="text"
                value={currencyName}
                onChange={e => setCurrencyName(e.target.value)}
                maxLength={20}
                placeholder="e.g. Credits, Denarii, Florins, Marks..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <div className="text-[10px] text-slate-600 mt-1">{currencyName.length}/20 characters</div>
            </div>

            <div className="rounded-xl bg-black/30 border border-white/10 p-4">
              <div className="text-xs text-slate-400 mb-3 font-bold uppercase tracking-wider">Preview</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-[11px] text-slate-500 ep-mono">Treasury</div>
                  <div className="text-lg font-black ep-mono text-amber-400">{(nation.currency || 0).toLocaleString()}</div>
                  <div className="text-[11px] text-amber-300">{currencySymbol}</div>
                </div>
                <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20 text-center">
                  <div className="text-[11px] text-slate-500 ep-mono">GDP</div>
                  <div className="text-lg font-black ep-mono text-green-400">{(nation.gdp || 0).toLocaleString()}</div>
                  <div className="text-[11px] text-green-300">{currencySymbol}/yr</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={saveCurrency}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Currency Name"}
          </button>
        </div>
      )}

      {activeTab === "tax" && (
        <div className="space-y-5">
          {/* Impact preview */}
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Current Tax Impact</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <ImpactBadge value={impact.revenueBonus} label="Revenue/tick" suffix=" cr" />
              <ImpactBadge value={impact.stabilityImpact} label="Stability" />
              <ImpactBadge value={impact.gdpImpact} label="GDP" suffix=" cr" />
              <ImpactBadge value={impact.trustImpact} label="Trust" />
              <ImpactBadge value={impact.populationGrowthImpact} label="Pop Growth" />
            </div>
            <div className="mt-3 text-[11px] text-slate-500 ep-mono">
              💡 Average tax rate: <span className="text-amber-400 font-bold">{impact.avgRate}%</span>
              {impact.avgRate === 0 && " — No taxes. Citizens are happy but treasury earns nothing."}
              {impact.avgRate > 0 && impact.avgRate <= 5 && " — Low tax. Great for growth and happiness."}
              {impact.avgRate > 5 && impact.avgRate <= 15 && " — Moderate tax. Reasonable revenue with minor impacts."}
              {impact.avgRate > 15 && impact.avgRate <= 25 && " — High tax. Significant stability and trust penalties."}
              {impact.avgRate > 25 && " — ⚠️ Excessive tax! Severe penalties to stability, growth, and trust."}
            </div>
          </div>

          {/* Tax sliders */}
          <div className="space-y-4">
            {TAX_CATEGORIES.map(({ key, label, emoji, desc }) => {
              const rate = taxRates[key] || 0;
              const rateColor = rate === 0 ? "#94a3b8" : rate <= 5 ? "#4ade80" : rate <= 15 ? "#fbbf24" : rate <= 25 ? "#fb923c" : "#f87171";
              return (
                <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{label}</div>
                        <div className="text-[11px] text-slate-500">{desc}</div>
                      </div>
                    </div>
                    <div className="font-black ep-mono text-lg" style={{ color: rateColor }}>{rate}%</div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={rate}
                    onChange={e => setTaxRates(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    className="w-full"
                    style={{ accentColor: rateColor }}
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 ep-mono mt-0.5">
                    <span>0% None</span>
                    <span>5% Low</span>
                    <span>15% Moderate</span>
                    <span>25% High</span>
                    <span>50% Max</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={saveTaxes}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {saving ? "Applying Tax Policy..." : "Save Tax Policy"}
          </button>
        </div>
      )}
    </div>
  );
}