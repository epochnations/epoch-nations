import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Radio, TrendingUp, TrendingDown, Flame, Globe, Zap, Shield, Edit3, AlertTriangle } from "lucide-react";
import PropagandaModal from "../components/news/PropagandaModal";
import WorldTensionGauge from "../components/news/WorldTensionGauge";
import NewsCard from "../components/news/NewsCard";
import LiveStockBar from "../components/news/LiveStockBar";

const CATEGORY_STYLE = {
  war: { color: "text-red-400", border: "border-red-500/40", bg: "bg-red-500/10", label: "WAR REPORT", icon: "⚔️" },
  economy: { color: "text-green-400", border: "border-green-500/40", bg: "bg-green-500/10", label: "MARKETS", icon: "📈" },
  tech: { color: "text-blue-400", border: "border-blue-500/40", bg: "bg-blue-500/10", label: "TECHNOLOGY", icon: "🔬" },
  policy: { color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10", label: "POLICY", icon: "🏛️" },
  propaganda: { color: "text-violet-400", border: "border-violet-500/40", bg: "bg-violet-500/10", label: "OP-ED", icon: "📢" },
  milestone: { color: "text-cyan-400", border: "border-cyan-500/40", bg: "bg-cyan-500/10", label: "MILESTONE", icon: "🌟" },
};

export default function GlobalChronicles() {
  const [news, setNews] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [nations, setNations] = useState([]);
  const [myNation, setMyNation] = useState(null);
  const [myPolicy, setMyPolicy] = useState(null);
  const [user, setUser] = useState(null);
  const [showPropaganda, setShowPropaganda] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    init();
    const unsubs = [
      base44.entities.NewsArticle.subscribe(() => loadNews()),
      base44.entities.Stock.subscribe(() => loadStocks()),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [articles, stockData, nationData] = await Promise.all([
      base44.entities.NewsArticle.list("-created_date", 40),
      base44.entities.Stock.list("-market_cap", 10),
      base44.entities.Nation.list("-gdp", 20)
    ]);
    setNews(articles);
    setStocks(stockData);
    setNations(nationData);
    const myNations = nationData.filter(n => n.owner_email === u.email);
    if (myNations.length > 0) {
      setMyNation(myNations[0]);
      const policies = await base44.entities.Policy.filter({ nation_id: myNations[0].id });
      setMyPolicy(policies[0] || null);
    }
  }

  async function loadNews() {
    const articles = await base44.entities.NewsArticle.list("-created_date", 40);
    setNews(articles);
  }

  async function loadStocks() {
    const stockData = await base44.entities.Stock.list("-market_cap", 10);
    setStocks(stockData);
  }

  const atWarNations = nations.filter(n => n.at_war_with?.length > 0);
  const totalWars = Math.floor(atWarNations.length / 2);
  const filteredNews = filter === "all" ? news : news.filter(n => n.category === filter);

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* Live Scrolling Stock Bar */}
      <LiveStockBar stocks={stocks} />

      {/* Masthead */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio size={14} className="text-red-400 animate-pulse" />
              <span className="text-red-400 text-xs tracking-widest font-bold uppercase">Live • Global Chronicles</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              THE GLOBAL CHRONICLES
            </h1>
            <p className="text-slate-500 text-xs tracking-widest uppercase mt-0.5">
              Epoch Nations · Galactic Press Agency · Est. Year 1
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <WorldTensionGauge wars={totalWars} nations={nations.length} />
            {myNation && (
              <button
                onClick={() => setShowPropaganda(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-violet-500/40 bg-violet-500/10 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-all"
              >
                <Edit3 size={12} /> Publish Propaganda
              </button>
            )}
            <a
              href={createPageUrl("Dashboard")}
              className="px-4 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all"
            >
              → Command Center
            </a>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-sm px-4 md:px-8 py-2">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-1">
          {["all", "war", "economy", "tech", "policy", "milestone", "propaganda"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filter === f
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f === "all" ? "ALL NEWS" : (CATEGORY_STYLE[f]?.icon + " " + f.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {filteredNews.length === 0 ? (
          <div className="text-center py-20">
            <Globe size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No news yet. Take action in the world to generate headlines.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Featured / Gold tier first */}
            {filteredNews.filter(n => n.tier === "gold" || n.tier === "breaking").map(article => (
              <div key={article.id} className={article.tier === "gold" ? "md:col-span-2 xl:col-span-3" : "md:col-span-2"}>
                <NewsCard article={article} featured={true} />
              </div>
            ))}
            {/* Standard news */}
            {filteredNews.filter(n => n.tier === "standard").map(article => (
              <NewsCard key={article.id} article={article} featured={false} />
            ))}
          </div>
        )}
      </main>

      {showPropaganda && myNation && (
        <PropagandaModal
          myNation={myNation}
          myPolicy={myPolicy}
          onClose={() => setShowPropaganda(false)}
          onPublished={() => { setShowPropaganda(false); loadNews(); }}
        />
      )}
    </div>
  );
}