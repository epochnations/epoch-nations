import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Trophy, Search, Filter, X, TrendingUp } from "lucide-react";
import { getGameTime, formatGameTime, TICK_MS, TICKS_PER_DAY } from "../components/game/GameClock";
import { EPOCHS, EPOCH_COLOR, EPOCH_EMOJI } from "../components/game/EpochConfig";
import NationHistoryCard from "../components/hall/NationHistoryCard";
import LeaderboardTable from "../components/hall/LeaderboardTable";
import FirstAchievements from "../components/hall/FirstAchievements";
import NationDetailModal from "../components/hall/NationDetailModal";

const RANK_METRICS = [
  { key: "epoch",            label: "Epoch",       icon: "🌍", desc: "Most advanced civilization age" },
  { key: "gdp",              label: "GDP",          icon: "💹", desc: "Total economic output" },
  { key: "national_wealth",  label: "Wealth",       icon: "💰", desc: "Total national wealth" },
  { key: "population",       label: "Population",   icon: "👥", desc: "Total citizens" },
  { key: "tech_level",       label: "Tech Level",   icon: "🔬", desc: "Technology advancement" },
  { key: "unlocked_techs",   label: "Technologies", icon: "⚙️", desc: "Number of techs unlocked" },
  { key: "currency",         label: "Treasury",     icon: "🏦", desc: "Current treasury balance" },
  { key: "stability",        label: "Stability",    icon: "⚖️", desc: "Political stability score" },
  { key: "defense_level",    label: "Defense",      icon: "🛡️", desc: "Military defense rating" },
  { key: "unit_power",       label: "Military",     icon: "⚔️", desc: "Combat unit power" },
  { key: "allies",           label: "Allies",       icon: "🤝", desc: "Number of allied nations" },
  { key: "manufacturing",    label: "Industry",     icon: "🏭", desc: "Manufacturing index" },
];

export default function HallOfNations() {
  const [nations, setNations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [tradeRoutes, setTradeRoutes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeMetric, setActiveMetric] = useState("epoch");
  const [activeTab, setActiveTab] = useState("leaderboard"); // leaderboard | history | firsts
  const [selectedNation, setSelectedNation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    epoch: "all",
    government: "all",
    status: "all", // alive | fallen
    minGDP: "",
    minPop: "",
  });

  const gameTime = getGameTime();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [n, b, tr, tx] = await Promise.all([
      base44.entities.Nation.list("-gdp", 500),
      base44.entities.Building.list(),
      base44.entities.TradeRoute.list(),
      base44.entities.Transaction.list("-created_date", 1000),
    ]);
    setNations(n);
    setBuildings(b);
    setTradeRoutes(tr);
    setTransactions(tx);
    setLoading(false);
  }

  // Enrich nations with computed stats
  const enriched = nations.map(n => {
    const natBuildings = buildings.filter(b => b.nation_id === n.id && !b.is_destroyed);
    const natTrades = tradeRoutes.filter(t => t.from_nation_id === n.id || t.to_nation_id === n.id);
    const natTx = transactions.filter(t => t.from_nation_id === n.id || t.to_nation_id === n.id);
    const kills = transactions.filter(t => t.type === "war_attack" && t.from_nation_id === n.id).length;
    const deaths = transactions.filter(t => t.type === "war_attack" && t.to_nation_id === n.id).length;
    const epochIdx = EPOCHS.indexOf(n.epoch);
    const joinedAt = new Date(n.created_date);
    const elapsedMs = Date.now() - joinedAt.getTime();
    const gameDaysAlive = Math.floor(elapsedMs / (TICKS_PER_DAY * TICK_MS));

    return {
      ...n,
      buildingCount: natBuildings.length,
      tradeCount: natTrades.length,
      txCount: natTx.length,
      kills,
      deaths,
      epochIdx,
      techCount: (n.unlocked_techs || []).length,
      allyCount: (n.allies || []).length,
      gameDaysAlive,
      joinedAt,
    };
  });

  // Filter
  const filtered = enriched.filter(n => {
    if (search) {
      const s = search.toLowerCase();
      if (!n.name?.toLowerCase().includes(s) && !n.leader?.toLowerCase().includes(s)) return false;
    }
    if (filters.epoch !== "all" && n.epoch !== filters.epoch) return false;
    if (filters.government !== "all" && n.government_type !== filters.government) return false;
    if (filters.minGDP && n.gdp < parseFloat(filters.minGDP)) return false;
    if (filters.minPop && n.population < parseFloat(filters.minPop)) return false;
    return true;
  });

  // Sort by active metric
  const sorted = [...filtered].sort((a, b) => {
    if (activeMetric === "epoch") return b.epochIdx - a.epochIdx;
    if (activeMetric === "unlocked_techs") return b.techCount - a.techCount;
    if (activeMetric === "allies") return b.allyCount - a.allyCount;
    return (b[activeMetric] || 0) - (a[activeMetric] || 0);
  });

  const uniqueEpochs = [...new Set(nations.map(n => n.epoch))];
  const uniqueGovs = [...new Set(nations.map(n => n.government_type).filter(Boolean))];

  return (
    <div className="min-h-screen bg-[#040810] text-white ep-grid-bg">
      {/* Header */}
      <div className="border-b px-4 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-20"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,0.07)" }}>
        <a href={createPageUrl("Dashboard")}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 shrink-0">
          <ArrowLeft size={14} />
        </a>
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <h1 className="text-base sm:text-lg font-black tracking-tight"
              style={{ background: "linear-gradient(90deg, #fbbf24, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              HALL OF NATIONS
            </h1>
          </div>
          <div className="text-[10px] text-slate-600 ep-mono">Eternal leaderboard & national archives — {nations.length} civilizations on record</div>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <div className="text-[10px] text-slate-500 ep-mono">GAME TIME</div>
          <div className="text-[10px] text-amber-400 ep-mono font-bold">{formatGameTime(gameTime)}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 ep-input px-3 py-2 rounded-xl">
            <Search size={13} className="text-slate-500 shrink-0" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search nations or leaders..."
              className="bg-transparent flex-1 text-sm text-white placeholder-slate-600 outline-none"
            />
            {search && <button onClick={() => setSearch("")}><X size={12} className="text-slate-500 hover:text-white" /></button>}
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${showFilters ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-white/5 border-white/10 text-slate-400"}`}>
            <Filter size={12} /> Advanced Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="rounded-2xl border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div>
              <div className="text-[10px] text-slate-500 ep-mono mb-1">EPOCH</div>
              <select value={filters.epoch} onChange={e => setFilters(f => ({ ...f, epoch: e.target.value }))}
                className="w-full ep-input px-2 py-1.5 text-xs text-white rounded-lg">
                <option value="all">All Epochs</option>
                {EPOCHS.map(ep => <option key={ep} value={ep}>{ep}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 ep-mono mb-1">GOVERNMENT</div>
              <select value={filters.government} onChange={e => setFilters(f => ({ ...f, government: e.target.value }))}
                className="w-full ep-input px-2 py-1.5 text-xs text-white rounded-lg">
                <option value="all">All Governments</option>
                {uniqueGovs.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 ep-mono mb-1">MIN GDP</div>
              <input type="number" value={filters.minGDP} onChange={e => setFilters(f => ({ ...f, minGDP: e.target.value }))}
                placeholder="0" className="w-full ep-input px-2 py-1.5 text-xs text-white rounded-lg placeholder-slate-700" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 ep-mono mb-1">MIN POPULATION</div>
              <input type="number" value={filters.minPop} onChange={e => setFilters(f => ({ ...f, minPop: e.target.value }))}
                placeholder="0" className="w-full ep-input px-2 py-1.5 text-xs text-white rounded-lg placeholder-slate-700" />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <button onClick={() => setFilters({ epoch: "all", government: "all", status: "all", minGDP: "", minPop: "" })}
                className="text-xs text-slate-500 hover:text-white transition-colors">
                Reset filters
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            { id: "leaderboard", label: "🏆 Leaderboard" },
            { id: "history",     label: "📜 Nation Archives" },
            { id: "firsts",      label: "🥇 World Firsts" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
              style={{ background: activeTab === tab.id ? "rgba(251,191,36,0.15)" : "transparent" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "leaderboard" && (
              <LeaderboardTable
                nations={sorted}
                allNations={enriched}
                metrics={RANK_METRICS}
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
                onSelectNation={setSelectedNation}
                transactions={transactions}
                buildings={buildings}
                tradeRoutes={tradeRoutes}
              />
            )}
            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="text-[10px] text-slate-600 ep-mono">
                  {filtered.length} NATION{filtered.length !== 1 ? "S" : ""} IN ARCHIVES
                </div>
                {sorted.map((n, i) => (
                  <NationHistoryCard key={n.id} nation={n} rank={i + 1}
                    buildings={buildings.filter(b => b.nation_id === n.id)}
                    tradeRoutes={tradeRoutes.filter(t => t.from_nation_id === n.id || t.to_nation_id === n.id)}
                    transactions={transactions.filter(t => t.from_nation_id === n.id || t.to_nation_id === n.id)}
                    onClick={() => setSelectedNation(n)}
                  />
                ))}
                {sorted.length === 0 && (
                  <div className="text-center py-16 text-slate-600 text-sm ep-mono">No nations match your search.</div>
                )}
              </div>
            )}
            {activeTab === "firsts" && (
              <FirstAchievements nations={enriched} transactions={transactions} />
            )}
          </>
        )}
      </div>

      {selectedNation && (
        <NationDetailModal
          nation={selectedNation}
          allNations={enriched}
          buildings={buildings.filter(b => b.nation_id === selectedNation.id)}
          tradeRoutes={tradeRoutes.filter(t => t.from_nation_id === selectedNation.id || t.to_nation_id === selectedNation.id)}
          transactions={transactions.filter(t => t.from_nation_id === selectedNation.id || t.to_nation_id === selectedNation.id)}
          onClose={() => setSelectedNation(null)}
        />
      )}
    </div>
  );
}