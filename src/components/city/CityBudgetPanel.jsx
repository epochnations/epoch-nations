import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function CityBudgetPanel({ city, onRefresh }) {
  const [taxRate, setTaxRate] = useState(10);

  async function updateTaxRate(newRate) {
    setTaxRate(newRate);
    await base44.entities.City.update(city.id, {
      monthly_tax_revenue: Math.round((city.population * newRate) / 100)
    });
    onRefresh?.();
  }

  const balance = (city?.city_budget || 0) + (city?.monthly_tax_revenue || 0) - (city?.monthly_expenses || 0);
  const balanceColor = balance >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="ep-card border border-white/10 rounded-xl p-4 space-y-3">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Budget</div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Treasury</span>
          <span className="text-cyan-400 font-bold">{city?.city_budget?.toLocaleString()} cr</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Tax Rate</span>
          <span className="text-yellow-400 font-bold">{taxRate}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={25}
          value={taxRate}
          onChange={e => updateTaxRate(+e.target.value)}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
          <div className="text-slate-400 mb-1 flex items-center gap-1">
            <TrendingUp size={12} className="text-green-400" />
            Income
          </div>
          <div className="text-green-400 font-bold">{city?.monthly_tax_revenue} cr</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
          <div className="text-slate-400 mb-1 flex items-center gap-1">
            <TrendingDown size={12} className="text-red-400" />
            Expenses
          </div>
          <div className="text-red-400 font-bold">{city?.monthly_expenses} cr</div>
        </div>
      </div>

      <div className={`pt-2 border-t border-white/10 text-xs font-bold ${balanceColor}`}>
        Monthly Balance: {balance >= 0 ? "+" : ""}{balance} cr
      </div>
    </div>
  );
}