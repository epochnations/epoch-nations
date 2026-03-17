import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Settings, TrendingUp, AlertCircle, Users, DollarSign, Heart, ShieldAlert } from "lucide-react";

import CitySelector from "../components/city/CitySelector";
import PerspectiveSwitcher from "../components/world/PerspectiveSwitcher";
import CityDashboard from "../components/city/CityDashboard";
import BudgetPanel from "../components/city/BudgetPanel";
import ZoningPanel from "../components/city/ZoningPanel";
import ServicesPanel from "../components/city/ServicesPanel";
import EventsPanel from "../components/city/EventsPanel";

export default function CityManagement() {
  const [user, setUser] = useState(null);
  const [myNation, setMyNation] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [cityEvents, setCityEvents] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);

    const nations = await base44.entities.Nation.filter({ owner_email: u.email });
    if (nations.length > 0) {
      setMyNation(nations[0]);
      loadCities(nations[0].id, u.email);
    }
    setLoading(false);
  }

  async function loadCities(nationId, email) {
    const citiesList = await base44.entities.City.filter({ nation_id: nationId, owner_email: email });
    setCities(citiesList);
    if (citiesList.length > 0 && !selectedCity) {
      setSelectedCity(citiesList[0]);
      loadCityEvents(citiesList[0].id);
    }
  }

  async function loadCityEvents(cityId) {
    const events = await base44.entities.CityEvent.filter({ city_id: cityId, is_resolved: false });
    setCityEvents(events);
  }

  async function refreshCity() {
    if (selectedCity) {
      const updated = await base44.entities.City.filter({ id: selectedCity.id });
      if (updated.length > 0) {
        setSelectedCity(updated[0]);
        loadCityEvents(selectedCity.id);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-slate-400 text-sm tracking-widest uppercase">Loading City Management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none ep-grid-bg" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />

      {/* HEADER */}
      <header className="relative z-20 border-b px-6 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(4,8,16,0.72) 100%)", backdropFilter: "blur(24px)", borderColor: "rgba(6,182,212,0.12)" }}>
        <div className="flex items-center gap-4">
          <a
            href={createPageUrl("Dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ChevronLeft size={18} />
            <span className="text-sm font-bold">Back to Nation</span>
          </a>
          <div className="text-xl font-black tracking-tighter ep-glow-cyan"
            style={{ background: "linear-gradient(90deg, #22d3ee, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CITY MANAGEMENT
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PerspectiveSwitcher currentMode="city" compact />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 p-4" style={{ minHeight: "calc(100vh - 57px)" }}>
        <div className="max-w-7xl mx-auto grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
          {/* Sidebar: City Selector */}
          <div className="h-fit sticky top-4">
            <CitySelector
              cities={cities}
              selectedCity={selectedCity}
              onSelectCity={(city) => {
                setSelectedCity(city);
                loadCityEvents(city.id);
              }}
            />
          </div>

          {/* Main Panel */}
          <div className="space-y-4">
            {selectedCity && (
              <>
                {/* Tab Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
                    { id: "budget", label: "Budget", icon: DollarSign },
                    { id: "zoning", label: "Zoning", icon: Settings },
                    { id: "services", label: "Services", icon: Heart },
                    { id: "events", label: "Events", icon: AlertCircle },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                          activeTab === tab.id
                            ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400"
                            : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                  {activeTab === "dashboard" && <CityDashboard city={selectedCity} nation={myNation} />}
                  {activeTab === "budget" && <BudgetPanel city={selectedCity} onRefresh={refreshCity} />}
                  {activeTab === "zoning" && <ZoningPanel city={selectedCity} onRefresh={refreshCity} />}
                  {activeTab === "services" && <ServicesPanel city={selectedCity} onRefresh={refreshCity} />}
                  {activeTab === "events" && <EventsPanel city={selectedCity} events={cityEvents} onRefresh={refreshCity} />}
                </div>
              </>
            )}

            {!selectedCity && cities.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <Users size={32} className="mx-auto mb-4 text-slate-500" />
                <p className="text-slate-400 text-sm">No cities to manage. Create one from the nation view.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}