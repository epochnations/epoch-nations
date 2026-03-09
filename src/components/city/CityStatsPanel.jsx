import { Users, Smile, AlertTriangle, Wind, Zap, Droplets } from "lucide-react";

export default function CityStatsPanel({ city, nation }) {
  const stats = [
    { icon: Users, label: "Population", value: city?.population?.toLocaleString(), color: "text-cyan-400" },
    { icon: Smile, label: "Happiness", value: `${city?.happiness}%`, color: "text-green-400" },
    { icon: AlertTriangle, label: "Crime", value: `${city?.crime_rate}%`, color: "text-red-400" },
    { icon: Wind, label: "Pollution", value: `${city?.pollution}%`, color: "text-orange-400" },
    { icon: Zap, label: "Traffic", value: `${city?.traffic}%`, color: "text-amber-400" },
    { icon: Droplets, label: "Health", value: `${city?.health_level}%`, color: "text-blue-400" },
  ];

  return (
    <div className="ep-card border border-white/10 rounded-xl p-4 space-y-3">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">City Stats</div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white/5 rounded-lg p-2 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={14} className={stat.color} />
                <span className="text-xs text-slate-400">{stat.label}</span>
              </div>
              <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          );
        })}
      </div>
      
      <div className="pt-2 border-t border-white/10 text-xs text-slate-500 space-y-1">
        <div>Education: {city?.education_level}%</div>
        <div>Tax Revenue: {city?.monthly_tax_revenue} cr/mo</div>
        <div>Monthly Expenses: {city?.monthly_expenses} cr/mo</div>
      </div>
    </div>
  );
}