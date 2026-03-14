/**
 * Item Encyclopedia — Searchable, filterable database of all 2,600+ items
 * Terraria-style item browser with categories, tiers, rarity, crafting stations
 */
import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Filter, ChevronLeft, BookOpen } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import {
  ALL_ITEMS, CATEGORIES, RARITIES, TIERS, CRAFTING_STATIONS,
  searchItems
} from "../components/crafting/ItemDatabase";
import ItemCard from "../components/crafting/ItemCard";
import ItemDetailPopup from "../components/crafting/ItemDetailPopup";
import CraftChainModal from "../components/crafting/CraftChainModal";
import CraftingTreeVisualizer from "../components/crafting/CraftingTreeVisualizer";

const SORT_OPTIONS = [
  { value: "name",   label: "Name A–Z"      },
  { value: "tier",   label: "Tier (Low→High)" },
  { value: "rarity", label: "Rarity"         },
  { value: "weight", label: "Weight"         },
];

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

export default function ItemEncyclopedia() {
  // Detect if we came from the homepage (no auth) or the game
  const fromHome = !document.referrer.includes("/Dashboard") && (
    document.referrer.includes(window.location.origin + "/") &&
    !document.referrer.includes("/Dashboard")
  );
  const returnHref = window.history.length > 1 ? null : "/";
  function handleReturn() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  }

  const [query,  setQuery]  = useState("");
  const [filters, setFilters] = useState({});
  const [sort,   setSort]   = useState("name");
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [chainItem,      setChainItem]      = useState(null);
  const [treeItem,       setTreeItem]       = useState(null);
  const [showFilters,    setShowFilters]    = useState(false);
  const [activeCat,      setActiveCat]      = useState(null);
  const [page,           setPage]           = useState(1);
  const [showInventory,  setShowInventory]  = useState(false);
  const [showCommunity,  setShowCommunity]  = useState(false);
  const PAGE_SIZE = 48;

  const filtered = useMemo(() => {
    let results = searchItems(query, { ...filters, category: activeCat || filters.category });
    results = [...results].sort((a, b) => {
      if (sort === "name")   return a.name.localeCompare(b.name);
      if (sort === "tier")   return (a.tier || 1) - (b.tier || 1);
      if (sort === "rarity") return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      if (sort === "weight") return (a.weight || 0) - (b.weight || 0);
      return 0;
    });
    return results;
  }, [query, filters, sort, activeCat]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val === f[key] ? undefined : val }));
    setPage(1);
  }
  function clearFilters() {
    setFilters({});
    setQuery("");
    setActiveCat(null);
    setPage(1);
  }

  const statsByTier = useMemo(() => {
    const map = {};
    ALL_ITEMS.forEach(i => { map[i.tier] = (map[i.tier] || 0) + 1; });
    return map;
  }, []);

  return (
    <div className="min-h-screen text-white ep-grid-bg"
      style={{ background: "#040810" }}>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-4"
        style={{ background: "rgba(4,8,16,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.08)" }}>
        <button onClick={handleReturn}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold">
          <ChevronLeft size={14} /> Return
        </button>
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-cyan-400" />
          <span className="font-black text-white ep-glow-cyan" style={{ background: "linear-gradient(90deg,#22d3ee,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Item Encyclopedia
          </span>
        </div>
        <div className="text-[10px] text-slate-600 ep-mono">{ALL_ITEMS.length.toLocaleString()}+ items</div>
        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-64">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search items..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs text-white ep-input"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        <button onClick={() => setShowInventory(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
          <Package size={11} /> Inventory
        </button>
        <button onClick={() => setShowCommunity(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)", color: "#22d3ee" }}>
          <Code2 size={11} /> Dev Registry
        </button>
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: showFilters ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.05)",
            border: showFilters ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.1)",
            color: showFilters ? "#22d3ee" : "#94a3b8"
          }}>
          <Filter size={11} /> Filters {Object.values(filters).filter(Boolean).length > 0 && `(${Object.values(filters).filter(Boolean).length})`}
        </button>

        {(query || activeCat || Object.values(filters).some(Boolean)) && (
          <button onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-white transition-colors">
            ✕ Clear
          </button>
        )}
      </header>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(4,8,16,0.9)" }}>
            <div className="px-6 py-4 flex flex-wrap gap-6">
              {/* Tier */}
              <div>
                <div className="text-[10px] text-slate-500 font-bold ep-mono uppercase mb-2">TIER</div>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(TIERS).map(([t, data]) => (
                    <button key={t} onClick={() => setFilter("tier", Number(t))}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold ep-mono transition-all"
                      style={{
                        background: filters.tier === Number(t) ? `${data.color}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${filters.tier === Number(t) ? data.color + "50" : "rgba(255,255,255,0.08)"}`,
                        color: filters.tier === Number(t) ? data.color : "#64748b"
                      }}>
                      T{t} {data.label} ({statsByTier[t] || 0})
                    </button>
                  ))}
                </div>
              </div>

              {/* Rarity */}
              <div>
                <div className="text-[10px] text-slate-500 font-bold ep-mono uppercase mb-2">RARITY</div>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(RARITIES).map(([key, data]) => (
                    <button key={key} onClick={() => setFilter("rarity", key)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold ep-mono transition-all"
                      style={{
                        background: filters.rarity === key ? `${data.color}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${filters.rarity === key ? data.color + "50" : "rgba(255,255,255,0.08)"}`,
                        color: filters.rarity === key ? data.color : "#64748b"
                      }}>
                      {data.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crafting Station */}
              <div>
                <div className="text-[10px] text-slate-500 font-bold ep-mono uppercase mb-2">STATION</div>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(CRAFTING_STATIONS).slice(0,10).map(([key, data]) => (
                    <button key={key} onClick={() => setFilter("station", key)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold ep-mono transition-all"
                      style={{
                        background: filters.station === key ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${filters.station === key ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: filters.station === key ? "#a78bfa" : "#64748b"
                      }}>
                      {data.emoji} {data.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <div className="text-[10px] text-slate-500 font-bold ep-mono uppercase mb-2">SORT</div>
                <div className="flex gap-1.5">
                  {SORT_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => setSort(s.value)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold ep-mono transition-all"
                      style={{
                        background: sort === s.value ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${sort === s.value ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.08)"}`,
                        color: sort === s.value ? "#22d3ee" : "#64748b"
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex" style={{ height: "calc(100vh - 57px)", overflow: "hidden" }}>
        {/* Left Sidebar — Categories */}
        <aside className="w-52 shrink-0 border-r overflow-y-auto p-3 hidden lg:block"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(4,8,16,0.8)" }}>
          <div className="text-[10px] text-slate-600 font-bold ep-mono uppercase mb-2 px-1">CATEGORIES</div>
          <button
            onClick={() => { setActiveCat(null); setPage(1); }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs mb-1 transition-all"
            style={{
              background: !activeCat ? "rgba(34,211,238,0.1)" : "transparent",
              color: !activeCat ? "#22d3ee" : "#64748b"
            }}>
            <span>📦 All Items</span>
            <span className="text-[10px] ep-mono">{ALL_ITEMS.length}</span>
          </button>
          {CATEGORIES.map(cat => {
            const count = ALL_ITEMS.filter(i => i.category === cat.id).length;
            return (
              <button key={cat.id}
                onClick={() => { setActiveCat(cat.id); setPage(1); }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs mb-0.5 transition-all"
                style={{
                  background: activeCat === cat.id ? `${cat.color}15` : "transparent",
                  color: activeCat === cat.id ? "white" : "#64748b",
                  borderLeft: activeCat === cat.id ? `2px solid ${cat.color}` : "2px solid transparent"
                }}>
                <span className="truncate">{cat.emoji} {cat.label}</span>
                <span className="text-[10px] ep-mono shrink-0 ml-1">{count}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Results header */}
          <div className="sticky top-0 z-10 px-4 py-2 flex items-center gap-3 border-b"
            style={{ background: "rgba(4,8,16,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-xs text-slate-400">
              {filtered.length.toLocaleString()} items
              {activeCat && ` in ${CATEGORIES.find(c => c.id === activeCat)?.label}`}
              {query && ` matching "${query}"`}
            </span>
            {/* Mobile category scroll */}
            <div className="flex gap-1.5 overflow-x-auto lg:hidden">
              <button onClick={() => { setActiveCat(null); setPage(1); }}
                className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: !activeCat ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.05)", color: !activeCat ? "#22d3ee" : "#64748b" }}>
                All
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setActiveCat(cat.id); setPage(1); }}
                  className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: activeCat === cat.id ? `${cat.color}15` : "rgba(255,255,255,0.05)", color: activeCat === cat.id ? "white" : "#64748b" }}>
                  {cat.emoji}
                </button>
              ))}
            </div>
            <div className="ml-auto text-[10px] text-slate-600 ep-mono">
              Page {page}/{Math.max(1, totalPages)}
            </div>
          </div>

          {/* Item Grid */}
          <div className="p-4">
            {pageItems.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-sm font-bold">No items found</div>
                <div className="text-xs mt-1">Try different search terms or filters</div>
              </div>
            ) : (
              <div className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                {pageItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={setSelectedItem}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30 transition-all hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: page === p ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${page === p ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.08)"}`,
                        color: page === p ? "#22d3ee" : "#64748b"
                      }}>
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30 transition-all hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Item Detail Popup */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetailPopup
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onViewRecipe={item => { setChainItem(item); setSelectedItem(null); }}
            onViewTree={item => { setTreeItem(item); setSelectedItem(null); }}
          />
        )}
      </AnimatePresence>

      {/* Craft Chain Modal */}
      <AnimatePresence>
        {chainItem && (
          <CraftChainModal
            item={chainItem}
            onClose={() => setChainItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Crafting Tree Visualizer */}
      <AnimatePresence>
        {treeItem && (
          <CraftingTreeVisualizer
            item={treeItem}
            onClose={() => setTreeItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Inventory Manager */}
      <AnimatePresence>
        {showInventory && <InventoryManager onClose={() => setShowInventory(false)} />}
      </AnimatePresence>

      {/* Community Item Registry */}
      <AnimatePresence>
        {showCommunity && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)" }}
            onClick={() => setShowCommunity(false)}>
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "#040810", border: "1px solid rgba(139,92,246,0.25)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.4)" }}>
                <div className="font-black text-white text-sm">Community Item Registry</div>
                <button onClick={() => setShowCommunity(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400">
                  <span className="text-xs">✕</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <CommunityItemRegistry nation={null} />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}