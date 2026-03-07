import { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { RefreshCw } from "lucide-react";

import NewsHeader from "../components/news/NewsHeader";
import NewsEngine from "../components/news/NewsEngine";
import CityNewsEngine from "../components/news/CityNewsEngine";
import NewsCategorySection from "../components/news/NewsCategorySection";
import NewsArticleModal from "../components/news/NewsArticleModal";
import WeatherForecastWidget from "../components/news/WeatherForecastWidget";
import NewsApprovalWidget from "../components/news/NewsApprovalWidget";
import NewsJokesWidget from "../components/news/NewsJokesWidget";
import NewsHoroscopeWidget from "../components/news/NewsHoroscopeWidget";
import CityNewsStream from "../components/news/CityNewsStream";
import LiveStockTickerTab from "../components/news/LiveStockTickerTab";
import CitizenEngagementWidget from "../components/news/CitizenEngagementWidget";
import { CATEGORY_META, pickWeather } from "../components/news/NewsEventConfig";
import { getCitiesForNation } from "../components/news/CityConfig";

const CATEGORY_ORDER = ["government","economy","weather","crime","education","business","international","classifieds","science","military"];

export default function NationwideNews() {
  const [nation, setNation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState("Clear");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cityFeedCollapsed, setCityFeedCollapsed] = useState(false);
  const [edition] = useState(String(Math.floor(Math.random() * 900 + 100)).padStart(4, "0"));

  useEffect(() => { init(); }, []);

  // Real-time subscription
  useEffect(() => {
    if (!nation?.id) return;
    const unsub = base44.entities.NewsEvent.subscribe((evt) => {
      if (evt.data?.nation_id !== nation.id) return;
      if (evt.type === "create") setEvents(prev => [evt.data, ...prev].slice(0, 60));
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
    const evs = await base44.entities.NewsEvent.filter({ nation_id: nationId }, "-created_date", 60);
    setEvents(evs);
  }

  const refresh = useCallback(async () => {
    if (!nation?.id) return;
    setRefreshing(true);
    const [nations, evs] = await Promise.all([
      base44.entities.Nation.filter({ owner_email: nation.owner_email }),
      base44.entities.NewsEvent.filter({ nation_id: nation.id }, "-created_date", 60),
    ]);
    setNation(nations[0] || nation);
    setEvents(evs);
    setRefreshing(false);
  }, [nation]);

  const cities = useMemo(() => nation ? getCitiesForNation(nation) : [], [nation?.id]);
  const breakingEvent = events.find(e => !e.is_resolved && e.severity === "critical");

  // National events only (no city_tag)
  const nationalEvents = events.filter(e => !e.city_tag);
  const cityEvents = events.filter(e => e.city_tag);

  const filteredNational = activeTab === "all" || activeTab === "cities"
    ? nationalEvents
    : nationalEvents.filter(e => e.category === activeTab);

  const grouped = {};
  for (const cat of CATEGORY_ORDER) {
    const catEvents = filteredNational.filter(e => e.category === cat);
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
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.015) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      {/* Nav */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/30 px-4 md:px-6 py-3 flex items-center justify-between">
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

      <main className="relative z-10 w-full px-3 md:px-5 py-5 space-y-4">
        {/* News Header */}
        <NewsHeader nation={nation} weather={weather} edition={edition} breakingEvent={breakingEvent} onClickBreaking={setSelectedEvent} onClickStock={() => window.location.href = createPageUrl("GlobalExchange")} />

        {/* Category filter tabs — single non-wrapping row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
          {CATEGORY_ORDER.map(cat => {
            const meta = CATEGORY_META[cat];
            const count = nationalEvents.filter(e => e.category === cat && !e.is_resolved).length;
            return (
              <button key={cat} onClick={() => setActiveTab(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${activeTab === cat ? "bg-white/15 border-white/25 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}>
                <span>{meta.emoji}</span><span>{meta.label}</span>
                {count > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">{count}</span>}
              </button>
            );
          })}
          {/* All tab (renamed from Cities) */}
          <button onClick={() => setActiveTab("cities")}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${activeTab === "cities" ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}>
            🏙️ <span>All</span>
            {cityEvents.filter(e => !e.is_resolved).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-black">
                {cityEvents.filter(e => !e.is_resolved).length}
              </span>
            )}
          </button>
        </div>

        {/* 3-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_340px] gap-4">

          {/* LEFT SIDEBAR — Citizen Corner */}
          <div className="space-y-4 order-2 lg:order-1 min-w-0">
            {/* Nation At A Glance — moved here, top of Citizen Corner */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">📈 Nation At A Glance</div>
              <div className="space-y-2">
                {[
                  { label:"GDP",        val:`${(nation?.gdp||0).toLocaleString()} cr`,    color:"text-cyan-400" },
                  { label:"Treasury",   val:`${(nation?.currency||0).toLocaleString()} cr`, color:"text-green-400" },
                  { label:"Stability",  val:`${Math.round(nation?.stability||0)}%`,         color: (nation?.stability||0) > 70 ? "text-emerald-400" : (nation?.stability||0) > 40 ? "text-yellow-400" : "text-red-400" },
                  { label:"Population", val:(nation?.population||0).toLocaleString(),       color:"text-violet-400" },
                  { label:"Epoch",      val:nation?.epoch || "—",                          color:"text-violet-400" },
                  { label:"Tech Level", val:`Lv. ${nation?.tech_level || 1}`,              color:"text-yellow-400" },
                  { label:"Cities",     val:`${cities.length}`,                            color:"text-amber-400" },
                  { label:"At War",     val:`${nation?.at_war_with?.length || 0}`,         color:nation?.at_war_with?.length ? "text-red-400" : "text-slate-500" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-xs">
                    <span className="text-slate-400">{s.label}</span>
                    <span className={`font-mono font-bold ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Citizen Corner */}
            <NewsJokesWidget />
            <NewsHoroscopeWidget />
          </div>

          {/* CENTER FEED */}
          <div className="space-y-5 order-1 lg:order-2 min-w-0">
            {activeTab === "live" ? (
              <LiveStockTickerTab />
            ) : activeTab === "cities" ? (
              <CityNewsStream cities={cities} events={cityEvents} onSelect={setSelectedEvent} />
            ) : (
              <>
                {/* Latest News — 5 most recent unresolved national events */}
                {events.filter(e => !e.city_tag && !e.is_resolved).length > 0 && (
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">⚡ Latest News</div>
                    </div>
                    <div className="space-y-1.5">
                      {events.filter(e => !e.city_tag && !e.is_resolved).slice(0, 5).map(ev => {
                        const sev = { critical:"text-red-400", warning:"text-yellow-400", opportunity:"text-blue-400", info:"text-emerald-400" }[ev.severity] || "text-slate-400";
                        const catMeta = CATEGORY_META[ev.category] || { emoji: "📰" };
                        return (
                          <button key={ev.id} onClick={() => setSelectedEvent(ev)}
                            className="w-full text-left flex items-start gap-2 hover:bg-white/5 rounded-xl px-2 py-1.5 transition-all group">
                            <span className="text-sm shrink-0 mt-0.5">{catMeta.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-white group-hover:text-cyan-300 transition-colors line-clamp-1 font-semibold">{ev.headline}</div>
                              <span className={`text-[10px] font-bold uppercase ${sev}`}>{ev.severity}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* City live feed strip */}
                {cityEvents.filter(e => !e.is_resolved).length > 0 && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">🏙️ City Live Feed</div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setActiveTab("cities")} className="text-[10px] text-amber-500 hover:text-amber-300 underline">
                          See All Cities →
                        </button>
                        <button onClick={() => setCityFeedCollapsed(c => !c)} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                          {cityFeedCollapsed ? "▼ Expand" : "▲ Collapse"}
                        </button>
                      </div>
                    </div>
                    {!cityFeedCollapsed && (
                      <div className="space-y-2">
                        {cityEvents.filter(e => !e.is_resolved).map(ev => {
                          const sev = { critical:"text-red-400", warning:"text-yellow-400", opportunity:"text-blue-400", info:"text-emerald-400" }[ev.severity] || "text-slate-400";
                          return (
                            <button key={ev.id} onClick={() => setSelectedEvent(ev)}
                              className="w-full text-left flex items-start gap-2 hover:bg-white/5 rounded-xl px-2 py-1.5 transition-all group">
                              <div className="w-1.5 h-1.5 rounded-full mt-1.5 animate-pulse shrink-0" style={{ backgroundColor: ev.city_color || "#64748b" }} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold" style={{ color: ev.city_color || "#94a3b8" }}>{ev.city_emoji} {ev.city_name}</span>
                                  <span className={`text-[10px] font-bold uppercase ${sev}`}>{ev.severity}</span>
                                </div>
                                <div className="text-xs text-white group-hover:text-cyan-300 transition-colors line-clamp-1">{ev.headline}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* National events by category */}
                {Object.entries(grouped).length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-500">
                    <div className="text-3xl mb-3">📡</div>
                    <div className="font-bold text-white mb-1">Waiting for news feed...</div>
                    <div className="text-sm">New events generate automatically every few minutes.</div>
                  </div>
                )}
                {Object.entries(grouped).map(([cat, catEvents]) => (
                  <NewsCategorySection key={cat} category={cat} events={catEvents} onSelect={setSelectedEvent} />
                ))}
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4 order-3 min-w-0">
            <WeatherForecastWidget weather={weather} nation={nation} />
            <NewsApprovalWidget nation={nation} events={events} />
            {cities.length > 0 && <CitizenEngagementWidget cities={cities} />}
            {/* Recent decisions */}
            {events.filter(e => e.is_resolved).length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">✅ Recent Decisions</div>
                <div className="space-y-2">
                  {events.filter(e => e.is_resolved).slice(0, 5).map(e => (
                    <div key={e.id} className="text-xs">
                      {e.city_name && <div className="text-[9px] font-bold mb-0.5" style={{ color: e.city_color || "#94a3b8" }}>{e.city_emoji} {e.city_name}</div>}
                      <div className="text-slate-400 line-clamp-1">{e.headline}</div>
                      <div className="text-slate-600 text-[10px]">{e.chosen_option}</div>
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
          onResolved={() => { setSelectedEvent(null); refresh(); }}
        />
      )}

      {/* Engines */}
      {nation && <NewsEngine nation={nation} onRefresh={refresh} />}
      {nation && <CityNewsEngine nation={nation} onRefresh={refresh} />}
    </div>
  );
}