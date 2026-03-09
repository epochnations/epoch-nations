import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Building2, Users, TrendingUp, AlertTriangle, BarChart3, Grid3X3, X } from "lucide-react";

import CityGrid from "../components/city/CityGrid";
import CityStatsPanel from "../components/city/CityStatsPanel";
import CityBudgetPanel from "../components/city/CityBudgetPanel";
import CityServicesPanel from "../components/city/CityServicesPanel";
import CityEventPanel from "../components/city/CityEventPanel";
import ZoningTool from "../components/city/ZoningTool";
import CitySimulationEngine from "../components/city/CitySimulationEngine";

export default function CityManagement() {
  const [user, setUser] = useState(null);
  const [myNation, setMyNation] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoningMode, setZoningMode] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);

  const refreshDebounceRef = useRef(null);
  const userEmailRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    userEmailRef.current = u.email;
    await loadNationAndCities(u.email);
    setLoading(false);
  }

  async function loadNationAndCities(email) {
    const nations = await base44.entities.Nation.filter({ owner_email: email });
    if (nations.length === 0) {
      window.location.href = createPageUrl("Onboarding");
      return;
    }
    const nation = nations[0];
    setMyNation(nation);

    const cityList = await base44.entities.City.filter({ nation_id: nation.id });
    setCities(cityList);

    // Auto-select first city or capital
    if (cityList.length > 0) {
      const capital = cityList.find(c => c.is_capital) || cityList[0];
      setSelectedCity(capital);
    }
  }

  const refresh = useCallback(() => {
    clearTimeout(refreshDebounceRef.current);
    refreshDebounceRef.current = setTimeout(async () => {
      if (userEmailRef.current && myNation?.id) {
        const cityList = await base44.entities.City.filter({ nation_id: myNation.id });
        setCities(cityList);
        if (selectedCity) {
          const updated = cityList.find(c => c.id === selectedCity.id);
          if (updated) setSelectedCity(updated);
        }
      }
    }, 1500);
  }, [selectedCity, myNation?.id]);

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

  if (!selectedCity || !myNation) {
    return (
      <div className="min-h-screen bg-[#080c14] p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-white text-xl font-bold">No Cities Found</div>
          <p className="text-slate-400">Create your first city from the nation dashboard.</p>
          <a href={createPageUrl("Dashboard")} className="inline-block px-6 py-3 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-400 transition-colors">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white relative">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none ep-grid-bg" />

      {/* TOP NAV */}
      <header className="relative z-20 border-b px-6 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(4,8,16,0.72) 100%)", backdropFilter: "blur(24px)", borderColor: "rgba(6,182,212,0.12)" }}>
        <div className="flex items-center gap-4">
          <div className="text-lg font-black tracking-tighter ep-glow-cyan"
            style={{ background: "linear-gradient(90deg, #22d3ee, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CITY MANAGEMENT
          </div>
          <div className="text-xs text-slate-600">{myNation.name}</div>
        </div>

        {/* City selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {cities.map(city => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedCity?.id === city.id
                  ? "bg-cyan-500/30 border border-cyan-400 text-cyan-300"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              {city.city_name} ({city.population.toLocaleString()})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a href={createPageUrl("Dashboard")} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-bold">
            ← Dashboard
          </a>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="relative z-10 p-4 flex gap-4" style={{ height: "calc(100vh - 57px)", overflow: "hidden" }}>
        {/* Left: City Grid + Zoning */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex-1 rounded-xl ep-card overflow-hidden border border-white/10">
            <CityGrid city={selectedCity} zoningMode={zoningMode} onRefresh={refresh} />
          </div>
          <ZoningTool city={selectedCity} zoningMode={zoningMode} onZoningModeChange={setZoningMode} />
        </div>

        {/* Right: Stats, Budget, Services */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">
          <CityStatsPanel city={selectedCity} nation={myNation} />
          <CityBudgetPanel city={selectedCity} onRefresh={refresh} />
          <CityServicesPanel city={selectedCity} onRefresh={refresh} />
          {activeEvent && (
            <CityEventPanel event={activeEvent} city={selectedCity} onClose={() => setActiveEvent(null)} onRefresh={refresh} />
          )}
        </div>
      </main>

      {/* City Simulation Engine — hourly ticks, events, citizen updates */}
      {selectedCity && myNation && (
        <CitySimulationEngine city={selectedCity} nation={myNation} onEventTriggered={setActiveEvent} onRefresh={refresh} />
      )}
    </div>
  );
}