/**
 * CivilianView — Tycoon-mode page. Players create and run businesses
 * (restaurant, farm, retail, factory, workshop) and watch their citizen
 * stats evolve in real time.
 */
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, TrendingUp, Users, Star, Coffee, Wheat, ShoppingBag, Factory, Hammer } from "lucide-react";
import PerspectiveSwitcher from "../components/world/PerspectiveSwitcher";
import BusinessCard from "../components/civilian/BusinessCard";
import NewBusinessModal from "../components/civilian/NewBusinessModal";
import CitizenStatsPanel from "../components/civilian/CitizenStatsPanel";
import BusinessTickEngine from "../components/civilian/BusinessTickEngine";

export default function CivilianView() {
  const [user, setUser]           = useState(null);
  const [citizen, setCitizen]     = useState(null);
  const [nation, setNation]       = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [nations, citizens, bizs] = await Promise.all([
      base44.entities.Nation.filter({ owner_email: u.email }),
      base44.entities.Citizen.filter({ owner_email: u.email }),
      base44.entities.Business.filter({ owner_email: u.email }),
    ]);
    setNation(nations[0] || null);

    let cit = citizens[0];
    if (!cit) {
      cit = await base44.entities.Citizen.create({
        owner_email: u.email,
        display_name: u.full_name || "Citizen",
        nation_id: nations[0]?.id || "",
        job: "Independent Entrepreneur",
        savings: 1000,
      });
    }
    setCitizen(cit);
    setBusinesses(bizs);
    setLoading(false);
  }

  async function refresh() {
    if (!user) return;
    const [citizens, bizs] = await Promise.all([
      base44.entities.Citizen.filter({ owner_email: user.email }),
      base44.entities.Business.filter({ owner_email: user.email }),
    ]);
    setCitizen(citizens[0] || citizen);
    setBusinesses(bizs);
  }

  const totalRevenue = businesses.reduce((s, b) => s + (b.revenue_per_tick || 0), 0);
  const totalExpenses = businesses.reduce((s, b) => s + (b.expenses_per_tick || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  if (loading) return (
    <div className="min-h-screen bg-[#040810] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen text-white" style={{ background: "#040810" }}>
      {/* Tick engine */}
      {citizen && <BusinessTickEngine citizen={citizen} businesses={businesses} onRefresh={refresh} />}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,0.08)" }}>
        <a href={createPageUrl("Dashboard")} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 shrink-0">
          <ArrowLeft size={14} />
        </a>
        <div className="text-xl font-black tracking-tighter"
          style={{ background: "linear-gradient(90deg,#f59e0b,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          CIVILIAN VIEW
        </div>
        <div className="text-[10px] text-slate-600 ep-mono hidden sm:block">Tycoon Mode · {businesses.length} businesses</div>
        <div className="flex-1" />
        <PerspectiveSwitcher currentMode="civilian" compact />
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
          style={{ background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b" }}>
          <Plus size={12} /> New Business
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-3 py-4 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Left: Citizen + summary */}
        <div className="space-y-3">
          <CitizenStatsPanel citizen={citizen} nation={nation} netIncome={netIncome} />

          {/* Income summary */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Business Empire</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: "Revenue/tick", v: `+${totalRevenue}`, c: "text-green-400" },
                { l: "Expenses/tick", v: `-${totalExpenses}`, c: "text-red-400" },
                { l: "Net Profit",    v: `${netIncome >= 0 ? "+" : ""}${netIncome}`, c: netIncome >= 0 ? "text-cyan-400" : "text-red-400" },
                { l: "Businesses",   v: businesses.length, c: "text-amber-400" },
              ].map(({ l, v, c }) => (
                <div key={l} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-[9px] text-slate-600 mb-0.5">{l}</div>
                  <div className={`font-black text-sm ep-mono ${c}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick guide */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Tycoon Guide</div>
            <div className="space-y-1.5 text-[10px] text-slate-400">
              {[
                "🍽️ Restaurants — serve food, gain reputation",
                "🌾 Farms — produce raw food and resources",
                "🛍️ Retail — buy low, sell high to citizens",
                "🏭 Factory — convert resources into goods",
                "🔨 Workshop — craft items for the market",
              ].map(t => <div key={t}>{t}</div>)}
            </div>
          </div>
        </div>

        {/* Right: Business cards */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            {[
              { id: "dashboard", label: "All Businesses" },
              { id: "restaurant", label: "🍽️ Restaurants" },
              { id: "farm", label: "🌾 Farms" },
              { id: "factory", label: "🏭 Factories" },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${activeTab === t.id ? "text-amber-400 bg-amber-500/10 border-amber-500/25" : "text-slate-500 border-white/10 hover:border-white/20"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {businesses.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div className="text-5xl mb-3">🏢</div>
              <div className="text-white font-bold mb-1">No Businesses Yet</div>
              <div className="text-slate-500 text-xs mb-4">Start your entrepreneurial empire by opening your first business.</div>
              <button onClick={() => setShowNew(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
                + Open First Business
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {businesses
                .filter(b => activeTab === "dashboard" || b.business_type === activeTab)
                .map(b => (
                  <BusinessCard key={b.id} business={b} citizen={citizen} onRefresh={refresh} />
                ))
              }
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewBusinessModal
          citizen={citizen}
          onClose={() => setShowNew(false)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}