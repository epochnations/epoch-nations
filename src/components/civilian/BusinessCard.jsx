/**
 * BusinessCard — Individual business management card with upgrade/tick logic.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Users, Star } from "lucide-react";

const TYPE_META = {
  restaurant:   { emoji: "🍽️", color: "#f97316", label: "Restaurant"   },
  farm:         { emoji: "🌾", color: "#4ade80", label: "Farm"          },
  retail_store: { emoji: "🛍️", color: "#a78bfa", label: "Retail Store"  },
  factory:      { emoji: "🏭", color: "#f87171", label: "Factory"       },
  workshop:     { emoji: "🔨", color: "#60a5fa", label: "Workshop"      },
};

const UPGRADES = [
  { id: "extra_staff",  label: "Extra Staff",  cost: 200,  revenueBoost: 5, desc: "+5 revenue/tick" },
  { id: "marketing",    label: "Marketing",    cost: 350,  revenueBoost: 8, desc: "+8 revenue/tick + reputation" },
  { id: "equipment",    label: "Better Equipment", cost: 500, expenseReduce: 3, desc: "-3 expense/tick" },
  { id: "automation",   label: "Automation",   cost: 800,  revenueBoost: 15, desc: "+15 revenue/tick" },
];

export default function BusinessCard({ business, citizen, onRefresh }) {
  const [upgrading, setUpgrading] = useState(false);
  const [toggling, setToggling]   = useState(false);
  const meta   = TYPE_META[business.business_type] || TYPE_META.workshop;
  const profit = (business.revenue_per_tick || 0) - (business.expenses_per_tick || 0);
  const ownedUpgrades = business.upgrades || [];

  async function handleUpgrade(upgrade) {
    if ((citizen?.savings || 0) < upgrade.cost) return;
    if (ownedUpgrades.includes(upgrade.id)) return;
    setUpgrading(true);
    const newRev = (business.revenue_per_tick || 0) + (upgrade.revenueBoost || 0);
    const newExp = Math.max(0, (business.expenses_per_tick || 0) - (upgrade.expenseReduce || 0));
    await Promise.all([
      base44.entities.Business.update(business.id, {
        revenue_per_tick: newRev,
        expenses_per_tick: newExp,
        upgrades: [...ownedUpgrades, upgrade.id],
        level: Math.min(5, (business.level || 1) + 1),
      }),
      base44.entities.Citizen.update(citizen.id, {
        savings: (citizen.savings || 0) - upgrade.cost,
      }),
    ]);
    setUpgrading(false);
    onRefresh();
  }

  async function toggleOpen() {
    setToggling(true);
    await base44.entities.Business.update(business.id, { is_open: !business.is_open });
    setToggling(false);
    onRefresh();
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${meta.color}20` }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ background: `${meta.color}0d`, borderBottom: `1px solid ${meta.color}15` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm truncate">{business.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${meta.color}20`, color: meta.color }}>
              {meta.label} Lv{business.level || 1}
            </span>
            <span className={`text-[9px] font-bold ${business.is_open ? "text-green-400" : "text-red-400"}`}>
              {business.is_open ? "● OPEN" : "● CLOSED"}
            </span>
          </div>
        </div>
        <button onClick={toggleOpen} disabled={toggling}
          className="shrink-0 px-2 py-1 rounded-lg text-[9px] font-bold border transition-all"
          style={{
            background: business.is_open ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)",
            borderColor: business.is_open ? "rgba(248,113,113,0.25)" : "rgba(74,222,128,0.25)",
            color: business.is_open ? "#f87171" : "#4ade80",
          }}>
          {business.is_open ? "Close" : "Open"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        {[
          { label: "Revenue", value: `+${business.revenue_per_tick || 0}`, color: "#4ade80" },
          { label: "Expenses", value: `-${business.expenses_per_tick || 0}`, color: "#f87171" },
          { label: "Profit", value: `${profit >= 0 ? "+" : ""}${profit}`, color: profit >= 0 ? "#22d3ee" : "#f87171" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-[8px] text-slate-600">{s.label}</div>
            <div className={`text-xs font-black ep-mono ${s.color === "#22d3ee" ? "text-cyan-400" : ""}`}
              style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Rep + customers */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="flex items-center gap-1">
          <Star size={10} className="text-amber-400" />
          <span className="text-[10px] text-slate-400">{business.reputation || 50} rep</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={10} className="text-blue-400" />
          <span className="text-[10px] text-slate-400">{business.customers_served || 0} served</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <TrendingUp size={10} className="text-emerald-400" />
          <span className="text-[10px] text-slate-400">{(business.total_earned || 0).toLocaleString()} total</span>
        </div>
      </div>

      {/* Upgrades */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Upgrades</div>
        {UPGRADES.filter(u => !ownedUpgrades.includes(u.id)).slice(0, 2).map(u => {
          const canAfford = (citizen?.savings || 0) >= u.cost;
          return (
            <button key={u.id} onClick={() => handleUpgrade(u)}
              disabled={!canAfford || upgrading}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{
                background: canAfford ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${canAfford ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                opacity: canAfford ? 1 : 0.45,
              }}>
              <div className="text-left">
                <span className="font-bold text-white">{u.label}</span>
                <span className="text-slate-500 ml-2">{u.desc}</span>
              </div>
              <span className="text-amber-400 font-bold ep-mono shrink-0">{u.cost}cr</span>
            </button>
          );
        })}
        {ownedUpgrades.length > 0 && (
          <div className="text-[9px] text-green-400">✓ {ownedUpgrades.length} upgrade{ownedUpgrades.length > 1 ? "s" : ""} installed</div>
        )}
      </div>
    </div>
  );
}