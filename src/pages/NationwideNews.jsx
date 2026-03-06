import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { RefreshCw } from "lucide-react";
import NewsHeader from "../components/news/NewsHeader";
import NewsEngine from "../components/news/NewsEngine";
import NewsCategorySection from "../components/news/NewsCategorySection";
import NewsArticleModal from "../components/news/NewsArticleModal";
import NewsWeatherWidget from "../components/news/NewsWeatherWidget";
import NewsApprovalWidget from "../components/news/NewsApprovalWidget";
import NewsJokesWidget from "../components/news/NewsJokesWidget";
import NewsHoroscopeWidget from "../components/news/NewsHoroscopeWidget";
import { CATEGORY_META, pickWeather } from "../components/news/NewsEventConfig";

const CATEGORY_ORDER = ["government","economy","weather","crime","education","business","international","classifieds","science","military"];

export default function NationwideNews() {
  const [nation, setNation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState("Clear");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [edition, setEdition] = useState(String(Math.floor(Math.random() * 900 + 100)).padStart(4, "0"));

  useEffect(() => { init(); }, []);

  // Real-time subscription to new events
  useEffect(() => {
    if (!nation?.id) return;
    const unsub = base44.entities.NewsEvent.subscribe((evt) => {
      if (evt.data?.nation_id !== nation.id) return;
      if (evt.type === "create") setEvents(prev => [evt.data, ...prev].slice(0, 30));
      else if (evt.type === "update") setEvents(prev => prev.map(e => e.id === evt.id ? evt.data : e));
    });
    return unsub;
  }, [nation?.id]);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const nations = await base44.entities.Nation.filter({ owner_email: u.email });
    if (!nations[0]) { window.location.href = createPageUrl("Onboarding"); return; }
    const n = nations[0];
    setNation(n);
    setWeather(pickWeather(n));
    await loadEvents(n.id);
    setLoading(false);
  }

  async function loadEvents(nationId) {
    const evs = await base44.entities.NewsEvent.filter({ nation_id: nationId }, "-created_date", 30);
    setEvents(evs);
  }

  const refresh = useCallback(async () => {
    if (!nation?.id) return;
    setRefreshing(true);
    const [nations, evs] = await Promise.all([
      base44.entities.Nation.filter({ owner_email: nation.owner_email }),
      base44.entities.NewsEvent.filter({ nation_id: nation.id }, "-created_date", 30),
    ]);
    setNation(nations[0] || nation);
    setEvents(evs);
    setRefreshing(false);
  }, [nation]);

  const breakingEvent = events.find(e => !e.is_resolved && e.severity === "critical");

  // Group events by category, filter
  const filteredEvents = activeFilter === "all" ? events : events.filter(e => e.category === activeFilter);

  const grouped = {};
  for (const cat of CATEGORY_ORDER) {
    const catEvents = filteredEvents.filter(e => e.category === cat);
    if (catEvents.length > 0) grouped[cat] = catEvents;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-slate-400 text-xs tracking-widest uppercase">Loading National Feed...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white relative">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.015) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      {/* Nav */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/30 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">EPOCH NATIONS</div>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-sm font-bold text-amber-400 hidden sm:inline">📰 Nationwide News</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={refreshing}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <a href={createPageUrl("Dashboard")} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all">
            ← Dashboard
          </a>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* News Header */}
        <NewsHeader nation={nation} weather={weather} edition={edition} breakingEvent={breakingEvent} />

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${activeFilter === "all" ? "bg-white/15 border-white/25 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}>
            🗞 All
          </button>
          {CATEGORY_ORDER.map(cat => {
            const meta = CATEGORY_META[cat];
            const count = events.filter(e => e.category === cat && !e.is_resolved).length;
            return (
              <button key={cat} onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${activeFilter === cat ? "bg-white/15 border-white/25 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}>
                {meta.emoji} <span className="hidden sm:inline">{meta.label}</span>
                {count > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Main 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
          {/* Feed */}
          <div className="space-y-6">
            {events.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-500">
                <div className="text-3xl mb-3">📡</div>
                <div className="font-bold text-white mb-1">Waiting for news feed...</div>
                <div className="text-sm">The nation is quiet. New events generate automatically every few minutes.</div>
              </div>
            )}
            {Object.entries(grouped).map(([cat, catEvents]) => (
              <NewsCategorySection key={cat} category={cat} events={catEvents} onSelect={setSelectedEvent} />
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <NewsWeatherWidget weather={weather} />
            <NewsApprovalWidget nation={nation} events={events} />

            {/* Quick stats */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">📈 Nation At A Glance</div>
              <div className="space-y-2">
                {[
                  { label: "GDP",        val: `${(nation?.gdp||0).toLocaleString()} cr`,   color:"text-cyan-400" },
                  { label: "Treasury",   val: `${(nation?.currency||0).toLocaleString()} cr`, color:"text-green-400" },
                  { label: "Epoch",      val: nation?.epoch || "—",                         color:"text-violet-400" },
                  { label: "Tech Level", val: `Lv. ${nation?.tech_level || 1}`,             color:"text-yellow-400" },
                  { label: "Allies",     val: `${nation?.allies?.length || 0}`,             color:"text-blue-400" },
                  { label: "At War",     val: `${nation?.at_war_with?.length || 0}`,        color: nation?.at_war_with?.length ? "text-red-400" : "text-slate-500" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-xs">
                    <span className="text-slate-400">{s.label}</span>
                    <span className={`font-mono font-bold ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent resolved */}
            {events.filter(e => e.is_resolved).length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">✅ Recent Decisions</div>
                <div className="space-y-2">
                  {events.filter(e => e.is_resolved).slice(0, 4).map(e => (
                    <div key={e.id} className="text-xs">
                      <div className="text-slate-400 line-clamp-1">{e.headline}</div>
                      <div className="text-slate-600">{e.chosen_option}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Article Modal */}
      {selectedEvent && (
        <NewsArticleModal
          event={selectedEvent}
          nation={nation}
          onClose={() => setSelectedEvent(null)}
          onResolved={() => {
            setSelectedEvent(null);
            refresh();
          }}
        />
      )}

      {/* Headless Event Engine */}
      {nation && <NewsEngine nation={nation} onRefresh={refresh} />}
    </div>
  );
}