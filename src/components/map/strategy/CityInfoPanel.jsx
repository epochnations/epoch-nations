/**
 * CityInfoPanel – floating HTML panel shown when clicking a city on the map.
 * Positioned absolute over the map canvas.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, TrendingUp, Shield, Zap, Package } from "lucide-react";

export default function CityInfoPanel({ cityData, onClose }) {
  if (!cityData) return null;

  const { type, nation, city } = cityData;
  const isCapital = type === "capital";
  const displayName = isCapital ? `${nation.name} (Capital)` : (city?.city_name || "City");
  const color = nation?.flag_color || "#22d3ee";

  const stats = isCapital
    ? [
        { icon: <Users size={11} />, label: "Population", value: (nation.population || 0).toLocaleString() },
        { icon: <TrendingUp size={11} />, label: "GDP", value: `${(nation.gdp || 0).toLocaleString()} cr` },
        { icon: <Shield size={11} />, label: "Defense", value: nation.defense_level || 0 },
        { icon: <Zap size={11} />, label: "Tech Level", value: `T${nation.tech_level || 1}` },
        { icon: <Package size={11} />, label: "Epoch", value: nation.epoch || "Stone Age" },
      ]
    : [
        { icon: <Users size={11} />, label: "Population", value: (city?.population || 0).toLocaleString() },
        { icon: <TrendingUp size={11} />, label: "Monthly Income", value: `${(city?.monthly_income || 0).toLocaleString()} cr` },
        { icon: <Shield size={11} />, label: "Safety", value: `${city?.safety_level || 0}%` },
        { icon: <Zap size={11} />, label: "Happiness", value: `${city?.happiness || 0}%` },
        { icon: <Package size={11} />, label: "Specialization", value: city?.specialization || "balanced" },
      ];

  return (
    <div
      className="fixed z-[80] pointer-events-auto"
      style={{ bottom: "80px", right: "16px" }}
      onClick={e => e.stopPropagation()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="rounded-2xl shadow-2xl overflow-hidden min-w-[220px]"
        style={{
          background: "linear-gradient(135deg, rgba(10,15,30,0.98) 0%, rgba(4,8,20,0.98) 100%)",
          border: `1px solid ${color}30`,
          boxShadow: `0 0 30px ${color}18`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: `${color}20`, background: `${color}0a` }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{nation?.flag_emoji || "🏴"}</span>
            <div>
              <div className="text-xs font-bold text-white leading-tight">{displayName}</div>
              <div className="text-[10px]" style={{ color }}>{isCapital ? "★ Capital City" : "City"}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-white">
            <X size={12} />
          </button>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 space-y-2">
          {stats.map(s => (
            <div key={s.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">{s.icon}{s.label}</span>
              <span className="font-mono font-bold text-white">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Infrastructure */}
        {isCapital && (
          <div className="px-4 pb-3">
            <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5">Infrastructure</div>
            <div className="flex gap-1.5 flex-wrap">
              {["Stone Age", "Bronze Age", "Iron Age"].includes(nation.epoch) && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                  🏛 Town Hall
                </span>
              )}
              {(nation.workers_researchers || 0) > 0 && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-500/10 border border-violet-500/30 text-violet-400">
                  🔬 Research Lab
                </span>
              )}
              {(nation.workers_soldiers || 0) > 0 && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                  ⚔️ Barracks
                </span>
              )}
              {(nation.workers_farmers || 0) > 2 && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/10 border border-green-500/30 text-green-400">
                  🌾 Farm
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}