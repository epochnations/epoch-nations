import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Radio, TrendingUp, TrendingDown, Flame, Globe, Zap, Shield, Edit3, AlertTriangle } from "lucide-react";
import PropagandaModal from "../components/news/PropagandaModal";
import WorldTensionGauge from "../components/news/WorldTensionGauge";
import NewsCard from "../components/news/NewsCard";
import LiveStockBar from "../components/news/LiveStockBar";
import GlobalArticleModal from "../components/news/GlobalArticleModal";

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
  const [selectedArticle, setSelectedArticle] = useState(null);

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
      base44.entities.NewsArticle.list("-created_date", 80),
      base44.entities.Stock.list("-market_cap", 10),
      base44.entities.Nation.list("-gdp", 20)
    ]);
    const cutoff = Date.now() - 30 * 60 * 1000;
    setNews(articles.filter(a => new Date(a.created_date).getTime() > cutoff));
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
    const articles = await base44.entities.NewsArticle.list("-created_date", 80);
    // Only show last 30 minutes
    const cutoff = Date.now() - 30 * 60 * 1000;
    setNews(articles.filter(a => new Date(a.created_date).getTime() > cutoff));
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
      <header className="border-b px-4 md:px-8 py-5"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(4,8,16,0.7) 100%)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Radio size={13} className="text-red-400" style={{ filter: "drop-shadow(0 0 6px rgba(239,68,68,0.7))" }} />
              <span className="text-red-400 text-[10px] tracking-[0.25em] font-black uppercase ep-mono">
                ● LIVE BROADCAST · GLOBAL CHRONICLES
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter ep-glow-cyan"
              style={{ background: "linear-gradient(90deg, #ffffff 0%, #94a3b8 60%, #22d3ee 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              THE GLOBAL CHRONICLES
            </h1>
            <p className="text-slate-600 text-[10px] tracking-[0.3em] uppercase mt-1 ep-mono">
              Epoch Nations · Galactic Press Agency · Est. Year 1
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <WorldTensionGauge wars={totalWars} nations={nations.length} />
            {myNation && (
              <button
                onClick={() => setShowPropaganda(true)}
                className="ep-btn-lift flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa" }}
              >
                <Edit3 size={12} /> Publish Propaganda
              </button>
            )}
            <a
              href={createPageUrl("Dashboard")}
              className="ep-btn-lift px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}
            >
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="border-b px-4 md:px-8 py-2.5" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          {["all", "war", "economy", "tech", "policy", "milestone", "propaganda"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-black whitespace-nowrap transition-all ep-mono ep-btn-lift"
              style={filter === f
                ? { background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.18)" }
                : { background: "transparent", color: "#64748b", border: "1px solid transparent" }
              }
            >
              {f === "all" ? "⬡ ALL" : (CATEGORY_STYLE[f]?.icon + " " + f.toUpperCase())}
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
              <div key={article.id} className={article.tier === "gold" ? "md:col-span-2 xl:col-span-3" : "md:col-span-2"} onClick={() => setSelectedArticle(article)}>
                <NewsCard article={article} featured={true} />
              </div>
            ))}
            {/* Standard news */}
            {filteredNews.filter(n => n.tier === "standard").map(article => (
              <div key={article.id} onClick={() => setSelectedArticle(article)}>
                <NewsCard article={article} featured={false} />
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedArticle && (
        <GlobalArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

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