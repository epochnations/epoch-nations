import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign } from "lucide-react";

export default function BudgetPanel({ city, onRefresh }) {
  const [taxRate, setTaxRate] = useState(city.tax_rate);
  const [loading, setLoading] = useState(false);

  const budgetItems = [
    { label: "Schools", amount: (city.monthly_expenses * 0.15).toFixed(0), icon: "🏫" },
    { label: "Hospitals", amount: (city.monthly_expenses * 0.25).toFixed(0), icon: "🏥" },
    { label: "Police", amount: (city.monthly_expenses * 0.20).toFixed(0), icon: "👮" },
    { label: "Fire Department", amount: (city.monthly_expenses * 0.15).toFixed(0), icon: "🚒" },
    { label: "Roads & Infrastructure", amount: (city.monthly_expenses * 0.25).toFixed(0), icon: "🛣️" },
  ];

  async function updateTaxRate() {
    setLoading(true);
    await base44.entities.City.update(city.id, {
      tax_rate: taxRate,
      monthly_income: Math.round(city.population * (taxRate / 100) * 10),
    });
    onRefresh?.();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Budget Overview */}
      <div className="ep-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Budget Overview</h3>
          <div className="text-2xl font-black text-violet-400">{city.budget.toLocaleString()} cr</div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Monthly Income</span>
              <span className="text-green-400 font-bold">+{city.monthly_income.toLocaleString()} cr</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Monthly Expenses</span>
              <span className="text-red-400 font-bold">-{city.monthly_expenses.toLocaleString()} cr</span>
            </div>
          </div>
          <div className="h-px bg-white/10 my-2" />
          <div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-bold">Net Balance</span>
              <span className={`font-bold ${city.monthly_income - city.monthly_expenses >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(city.monthly_income - city.monthly_expenses).toLocaleString()} cr/month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Rate Control */}
      <div className="ep-card p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Tax Rate</h3>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-white font-bold">{taxRate}%</span>
              <span className="text-xs text-slate-400">Est. Income: {Math.round(city.population * (taxRate / 100) * 10).toLocaleString()} cr</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={taxRate}
              onChange={(e) => setTaxRate(+e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-2">Higher tax → more income but reduced happiness</p>
          </div>

          <button
            onClick={updateTaxRate}
            disabled={loading || taxRate === city.tax_rate}
            className="w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 disabled:opacity-50 transition-all"
          >
            {loading ? "Updating..." : "Apply Tax Rate"}
          </button>
        </div>
      </div>

      {/* Budget Allocation */}
      <div className="ep-card p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Spending Allocation</h3>

        <div className="space-y-3">
          {budgetItems.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{item.icon} {item.label}</span>
                <span className="text-amber-400 font-bold">{item.amount} cr</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500/60"
                  style={{ width: `${(item.amount / city.monthly_expenses) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}