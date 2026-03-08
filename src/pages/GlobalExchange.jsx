import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Search, X, ChevronUp, ChevronDown, ArrowLeft, Globe, Flag, TrendingUp, TrendingDown, Zap, BarChart2, AlertTriangle } from "lucide-react";
import ExchangeStockTable from "@/components/exchange/ExchangeStockTable";
import ExchangeTransactionLog from "@/components/exchange/ExchangeTransactionLog";
import ExchangeSellModal from "@/components/exchange/ExchangeSellModal";
import StockModal from "@/components/modals/StockModal";

const SORT_OPTIONS = [
  { value: "market_cap", label: "Market Cap" },
  { value: "volume_high", label: "Volume (High)" },
  { value: "price_high", label: "Most Expensive" },
  { value: "price_low", label: "Cheapest" },
  { value: "volatility", label: "Volatility" },
  { value: "alpha", label: "Alphabetical" },
];

export default function GlobalExchange() {
  const [stocks, setStocks] = useState([]);
  const [nations, setNations] = useState([]);
  const [myNation, setMyNation] = useState(null);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [view, setView] = useState(() => sessionStorage.getItem("exchange_view") || "global");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("market_cap");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [sellStock, setSellStock] = useState(null);
  const [priceFlash, setPriceFlash] = useState({});

  const searchTimer = useRef(null);

  useEffect(() => {
    init();
    const unsubs = [
      base44.entities.Stock.subscribe((ev) => {
        setStocks(prev => {
          if (ev.type === "create") return [...prev, ev.data];
          if (ev.type === "update") {
            const old = prev.find(s => s.id === ev.id);
            if (old && ev.data.current_price !== old.current_price) {
              const dir = ev.data.current_price > old.current_price ? "up" : "down";
              setPriceFlash(f => ({ ...f, [ev.id]: dir }));
              setTimeout(() => setPriceFlash(f => { const n = { ...f }; delete n[ev.id]; return n; }), 1500);
            }
            return prev.map(s => s.id === ev.id ? ev.data : s);
          }
          if (ev.type === "delete") return prev.filter(s => s.id !== ev.id);
          return prev;
        });
      }),
      base44.entities.Transaction.subscribe(() => loadTransactions()),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [stockData, nationData, txData] = await Promise.all([
      base44.entities.Stock.list("-market_cap", 200),
      base44.entities.Nation.list("-gdp", 100),
      base44.entities.Transaction.list("-created_date", 50),
    ]);
    setStocks(stockData);
    setNations(nationData);
    setTransactions(txData);
    const mine = nationData.find(n => n.owner_email === u.email);
    if (mine) setMyNation(mine);
  }

  async function loadTransactions() {
    const txData = await base44.entities.Transaction.list("-created_date", 50);
    setTransactions(txData);
  }

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Save view to session
  useEffect(() => {
    sessionStorage.setItem("exchange_view", view);
  }, [view]);

  const filteredStocks = useMemo(() => {
    let list = stocks;

    // View filter
    if (view === "national" && myNation) {
      list = list.filter(s => s.nation_id === myNation.id);
    }

    // Search filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(s =>
        s.ticker?.toLowerCase().includes(q) ||
        s.company_name?.toLowerCase().includes(q) ||
        s.nation_name?.toLowerCase().includes(q)
      );
    }

    // Available only
    if (availableOnly) {
      list = list.filter(s => (s.available_shares || 0) > 0 && !s.is_crashed);
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "volume_high": return (b.total_shares - b.available_shares) - (a.total_shares - a.available_shares);
        case "price_high": return (b.current_price || 0) - (a.current_price || 0);
        case "price_low": return (a.current_price || 0) - (b.current_price || 0);
        case "volatility": {
          const vol = s => {
            const h = s.price_history || [];
            if (h.length < 2) return 0;
            const diffs = h.slice(1).map((p, i) => Math.abs(p - h[i]) / (h[i] || 1));
            return diffs.reduce((a, b) => a + b, 0) / diffs.length;
          };
          return vol(b) - vol(a);
        }
        case "alpha": return (a.company_name || "").localeCompare(b.company_name || "");
        default: return (b.market_cap || 0) - (a.market_cap || 0);
      }
    });

    return list;
  }, [stocks, view, debouncedSearch, availableOnly, sortBy, myNation]);

  const nationMap = useMemo(() => {
    const m = {};
    nations.forEach(n => { m[n.id] = n; });
    return m;
  }, [nations]);

  // Enrich stocks with computed fields
  const enrichedStocks = useMemo(() => {
    return filteredStocks.map(s => {
      const history = s.price_history || [];
      const prev = history.length >= 2 ? history[history.length - 2] : s.current_price;
      const changePct = prev > 0 ? ((s.current_price - prev) / prev) * 100 : 0;
      const sold = s.total_shares - s.available_shares;
      const foreignOwn = s.nation_id && nationMap[s.nation_id] ? (sold / Math.max(s.total_shares, 1)) * 100 : 0;
      const vol = (() => {
        if (history.length < 2) return 0;
        const diffs = history.slice(1).map((p, i) => Math.abs(p - history[i]) / (history[i] || 1));
        return (diffs.reduce((a, b) => a + b, 0) / diffs.length) * 100;
      })();
      const demandRatio = s.total_shares > 0 ? sold / s.total_shares : 0;
      const status = s.is_crashed ? "CRASH" : vol > 5 ? "VOLATILE" : changePct > 1 ? "RISING" : "STABLE";
      return { ...s, changePct, foreignOwn, vol, demandRatio, status, flash: priceFlash[s.id] };
    });
  }, [filteredStocks, nationMap, priceFlash]);

  function refreshNation() {
    if (!myNation) return;
    base44.entities.Nation.filter({ owner_email: user?.email }).then(ns => {
      if (ns[0]) setMyNation(ns[0]);
    });
  }

  return (
    <div className="min-h-screen bg-[#040810] text-white flex flex-col ep-grid-bg" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="border-b px-4 md:px-6 py-3 flex items-center justify-between gap-3 shrink-0"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(4,8,16,0.7) 100%)", backdropFilter: "blur(24px)", borderColor: "rgba(6,182,212,0.15)" }}>
        <div className="flex items-center gap-3">
          <a href={createPageUrl("Dashboard")} className="text-slate-500 hover:text-cyan-400 transition-colors ep-btn-lift">
            <ArrowLeft size={16} />
          </a>
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-cyan-400" style={{ filter: "drop-shadow(0 0 6px rgba(6,182,212,0.6))" }} />
            <span className="font-black tracking-tight text-sm md:text-base ep-glow-cyan"
              style={{ background: "linear-gradient(90deg, #22d3ee, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              GLOBAL EXCHANGE
            </span>
            <span className="hidden md:block text-[10px] text-slate-600 ep-mono">· LIVE TERMINAL</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="ep-live-dot" />
          <span className="text-xs text-green-400 ep-mono hidden md:block font-bold">LIVE</span>
          {myNation && (
            <div className="text-xs font-mono text-slate-400 hidden md:block">
              Treasury: <span className="text-green-400 font-bold">{Math.round(myNation.currency).toLocaleString()} cr</span>
            </div>
          )}
        </div>
      </header>

      {/* Controls */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-sm px-4 md:px-6 py-3 shrink-0 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Escape" && setSearch("")}
            placeholder="Search ticker, company, or nation…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 focus:bg-white/8 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Global / National toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 shrink-0">
            <button
              onClick={() => setView("global")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${view === "global" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Globe size={11} /> Global
            </button>
            <button
              onClick={() => setView("national")}
              disabled={!myNation}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-30 ${view === "national" ? "bg-violet-500/20 text-violet-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Flag size={11} /> National
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Available toggle */}
          <button
            onClick={() => setAvailableOnly(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${availableOnly ? "border-green-400/40 bg-green-400/10 text-green-400" : "border-white/10 text-slate-500 hover:text-slate-300"}`}
          >
            {availableOnly ? "✓ Available Only" : "Show All"}
          </button>

          <div className="ml-auto text-xs text-slate-600 font-mono shrink-0">
            {enrichedStocks.length} stocks
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <ExchangeStockTable
          stocks={enrichedStocks}
          myNation={myNation}
          nationMap={nationMap}
          view={view}
          onBuy={s => setSelectedStock(s)}
          onSell={s => setSellStock(s)}
        />
      </div>

      {/* Transaction Log */}
      <ExchangeTransactionLog transactions={transactions} />

      {/* Buy Modal */}
      {selectedStock && myNation && (
        <StockModal
          stock={selectedStock}
          myNation={myNation}
          onClose={() => setSelectedStock(null)}
          onRefresh={() => { refreshNation(); loadTransactions(); }}
        />
      )}

      {/* Sell Modal */}
      {sellStock && myNation && (
        <ExchangeSellModal
          stock={sellStock}
          myNation={myNation}
          onClose={() => setSellStock(null)}
          onRefresh={() => { refreshNation(); loadTransactions(); }}
        />
      )}
    </div>
  );
}