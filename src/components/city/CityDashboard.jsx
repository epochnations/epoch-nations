import { TrendingUp, Users, Heart, ShieldAlert, Zap, AlertTriangle } from "lucide-react";

export default function CityDashboard({ city, nation }) {
  const stats = [
    { label: "Population", value: city.population.toLocaleString(), icon: Users, color: "cyan" },
    { label: "Happiness", value: `${city.happiness}%`, icon: Heart, color: "green" },
    { label: "Crime Rate", value: `${city.crime_rate}%`, icon: ShieldAlert, color: "red" },
    { label: "Pollution", value: `${city.pollution}%`, icon: Zap, color: "amber" },
    { label: "Budget", value: city.budget.toLocaleString(), suffix: " cr", icon: TrendingUp, color: "violet" },
    { label: "Growth Rate", value: `${city.growth_rate}%`, suffix: "/cycle", icon: TrendingUp, color: "blue" },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colorMap = {
            cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
            green: "border-green-500/30 bg-green-500/10 text-green-400",
            red: "border-red-500/30 bg-red-500/10 text-red-400",
            amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
            violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
            blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
          };

          return (
            <div key={idx} className={`ep-card p-4 border ${colorMap[stat.color]}`}>
              <div className="flex items-start justify-between mb-2">
                <Icon size={16} />
                <span className="text-[10px] opacity-70 uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-2xl font-black tracking-tighter">
                {stat.value}
                {stat.suffix && <span className="text-sm ml-1 opacity-70">{stat.suffix}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* City Status Overview */}
      <div className="ep-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">City Status</h3>

        {/* Progress Bars */}
        <div className="space-y-3">
          {[
            { label: "Education Level", value: city.education_level },
            { label: "Health Level", value: city.health_level },
            { label: "Safety Level", value: city.safety_level },
            { label: "Reputation", value: city.reputation },
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className="text-xs font-bold text-white">{item.value}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings/Alerts */}
      {(city.disease_outbreak || city.disaster_flag) && (
        <div className="ep-card border border-red-500/30 bg-red-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" />
            <h4 className="text-xs font-bold text-red-400 uppercase">Active Alerts</h4>
          </div>
          {city.disease_outbreak && <p className="text-xs text-red-300">⚠️ Disease outbreak detected</p>}
          {city.disaster_flag && <p className="text-xs text-red-300">⚠️ {city.disaster_flag}</p>}
        </div>
      )}

      {/* Quick Facts */}
      <div className="ep-card p-4 space-y-2 text-xs text-slate-400">
        <p>📍 Specialization: <span className="text-white capitalize font-bold">{city.specialization}</span></p>
        <p>📊 Monthly Income: <span className="text-green-400 font-bold">{city.monthly_income.toLocaleString()} cr</span></p>
        <p>💸 Monthly Expenses: <span className="text-red-400 font-bold">{city.monthly_expenses.toLocaleString()} cr</span></p>
        <p>📈 Net: <span className={city.monthly_income - city.monthly_expenses >= 0 ? "text-green-400" : "text-red-400"} className="font-bold">
          {(city.monthly_income - city.monthly_expenses).toLocaleString()} cr
        </span></p>
      </div>
    </div>
  );
}