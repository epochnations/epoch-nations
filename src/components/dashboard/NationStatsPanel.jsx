import { useState, useEffect } from "react";
import { TrendingUp, Shield, Users, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

function StatBar({ value, max = 100, color = "#22d3ee" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}55` }} />
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={11} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
          <span className="text-xs font-bold ep-mono" style={{ color }}>{value}</span>
        </div>
        {sub && <div className="text-[9px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function NationStatsPanel({ nation }) {
  if (!nation) return (
    <div className="rounded-2xl p-4 ep-card h-full flex items-center justify-center">
      <div className="text-slate-600 text-xs">No nation data</div>
    </div>
  );

  const epochColors = {
    "Stone Age": "#a8a29e", "Copper Age": "#b45309", "Bronze Age": "#92400e",
    "Iron Age": "#6b7280", "Dark Ages": "#374151", "Middle Ages": "#4b5563",
    "Renaissance": "#7c3aed", "Imperial Age": "#1d4ed8", "Enlightenment Age": "#0891b2",
    "Industrial Age": "#b45309", "Modern Age": "#059669", "Atomic Age": "#7c3aed",
    "Digital Age": "#0ea5e9", "Genetic Age": "#10b981", "Synthetic Age": "#8b5cf6", "Nano Age": "#22d3ee"
  };
  const epochColor = epochColors[nation.epoch] || "#22d3ee";

  return (
    <div className="rounded-2xl flex flex-col gap-0 overflow-hidden h-full"
      style={{ background: "linear-gradient(160deg, rgba(6,182,212,0.05) 0%, rgba(4,8,16,0.98) 60%)", border: "1px solid rgba(6,182,212,0.12)", backdropFilter: "blur(20px)" }}>

      {/* Flag / Identity */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: `${nation.flag_color || "#3b82f6"}22`, border: `2px solid ${nation.flag_color || "#3b82f6"}44`, boxShadow: `0 0 16px ${nation.flag_color || "#3b82f6"}33` }}>
              {nation.flag_image_url
                ? <img src={nation.flag_image_url} alt="flag" className="w-10 h-10 object-cover rounded-lg" />
                : nation.flag_emoji || "🏴"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#040810]"
              style={{ boxShadow: "0 0 6px rgba(74,222,128,0.7)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-white truncate">{nation.name}</div>
            <div className="text-[10px] text-slate-500 truncate">Led by {nation.leader}</div>
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ep-mono"
              style={{ background: `${epochColor}18`, border: `1px solid ${epochColor}35`, color: epochColor }}>
              {nation.epoch}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-px border-b border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
        {[
          { label: "GDP", value: (nation.gdp || 0).toLocaleString(), color: "#4ade80" },
          { label: "Stability", value: `${nation.stability || 0}%`, color: "#22d3ee" },
          { label: "Treasury", value: `₵${(nation.currency || 0).toLocaleString()}`, color: "#fbbf24" },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-3 py-2.5 text-center" style={{ background: "rgba(4,8,16,0.6)" }}>
            <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-xs font-black ep-mono" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Core Stats */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Core Metrics</div>
        <StatRow icon={TrendingUp} label="GDP" value={(nation.gdp || 0).toLocaleString()} color="#4ade80" />
        <StatBar value={nation.gdp || 0} max={10000} color="#4ade80" />
        <div className="mt-1.5" />
        <StatRow icon={Shield} label="Stability" value={`${nation.stability || 0}%`} color="#22d3ee" />
        <StatBar value={nation.stability || 0} max={100} color="#22d3ee" />
        <div className="mt-1.5" />
        <StatRow icon={Users} label="Population" value={`${(nation.population || 0).toLocaleString()}M`} color="#a78bfa" sub={`Housing: ${nation.housing_capacity || 20}M cap`} />
        <StatBar value={nation.population || 0} max={nation.housing_capacity || 20} color="#a78bfa" />
        <div className="mt-1.5" />
        <StatRow icon={Zap} label="Unit Power" value={nation.unit_power || 0} color="#f87171" sub={`Defense: ${nation.defense_level || 0}`} />
        <StatBar value={nation.unit_power || 0} max={200} color="#f87171" />
      </div>

      {/* Resources */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Resources</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: "res_food",  label: "Food",  emoji: "🌾", color: "#86efac" },
            { key: "res_wood",  label: "Wood",  emoji: "🪵", color: "#a16207" },
            { key: "res_stone", label: "Stone", emoji: "🪨", color: "#9ca3af" },
            { key: "res_iron",  label: "Iron",  emoji: "⚙️", color: "#6b7280" },
            { key: "res_gold",  label: "Gold",  emoji: "✨", color: "#fbbf24" },
            { key: "res_oil",   label: "Oil",   emoji: "🛢", color: "#6366f1" },
          ].map(({ key, label, emoji, color }) => (
            <div key={key} className="rounded-lg px-2 py-1.5 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-sm">{emoji}</div>
              <div className="text-[9px] text-slate-600">{label}</div>
              <div className="text-[10px] font-bold ep-mono" style={{ color }}>{(nation[key] || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Level */}
      <div className="px-4 py-2">
        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Technology</div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-400">Tech Level {nation.tech_level || 1}</span>
          <span className="text-[10px] ep-mono" style={{ color: "#8b5cf6" }}>{Math.floor(nation.tech_points || 0)} TP</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-sm"
              style={{
                background: i < (nation.tech_level || 1)
                  ? `linear-gradient(90deg, #7c3aed, #8b5cf6)`
                  : "rgba(255,255,255,0.05)",
                boxShadow: i < (nation.tech_level || 1) ? "0 0 4px rgba(139,92,246,0.5)" : "none"
              }} />
          ))}
        </div>
        {(nation.allies || []).length > 0 && (
          <div className="mt-2 text-[9px] text-slate-500">
            🤝 {(nation.allies || []).length} {(nation.allies || []).length === 1 ? "ally" : "allies"}
            {(nation.at_war_with || []).length > 0 && <span className="text-red-400 ml-2">⚔ {(nation.at_war_with || []).length} at war</span>}
          </div>
        )}
      </div>
    </div>
  );
}