/**
 * InventoryManager — Advanced Inventory panel for tracking, filtering, and valuing a nation's crafted items
 * This is a simulation layer — it uses the item database and lets players "track" quantities.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Plus, Minus, Trash2, Package, TrendingUp, Filter } from "lucide-react";
import { ALL_ITEMS, CATEGORIES, RARITIES, TIERS } from "./ItemDatabase";

const BASE_PRICES = {
  common: 5, uncommon: 15, rare: 50, epic: 150, legendary: 500
};

function getBaseValue(item) {
  return (BASE_PRICES[item.rarity] || 5) * (item.tier || 1) * 1.2;
}

export default function InventoryManager({ onClose }) {
  const [inventory, setInventory] = useState({});
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [addSearch, setAddSearch] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [sort, setSort] = useState("name");

  const inventoryItems = useMemo(() => {
    return Object.entries(inventory)
      .map(([id, qty]) => {
        const item = ALL_ITEMS.find(i => i.id === id);
        if (!item) return null;
        return { ...item, qty, totalValue: getBaseValue(item) * qty };
      })
      .filter(Boolean);
  }, [inventory]);

  const filtered = useMemo(() => {
    let items = inventoryItems.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.id.includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || item.category === categoryFilter;
      const matchRarity = rarityFilter === "all" || item.rarity === rarityFilter;
      return matchSearch && matchCat && matchRarity;
    });
    if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "qty") items.sort((a, b) => b.qty - a.qty);
    else if (sort === "value") items.sort((a, b) => b.totalValue - a.totalValue);
    else if (sort === "tier") items.sort((a, b) => b.tier - a.tier);
    return items;
  }, [inventoryItems, search, categoryFilter, rarityFilter, sort]);

  const totalValue = inventoryItems.reduce((s, i) => s + i.totalValue, 0);
  const totalItems = inventoryItems.reduce((s, i) => s + i.qty, 0);

  const addResults = useMemo(() => {
    if (!addSearch || addSearch.length < 2) return [];
    return ALL_ITEMS.filter(i =>
      i.name.toLowerCase().includes(addSearch.toLowerCase())
    ).slice(0, 8);
  }, [addSearch]);

  function adjustQty(id, delta) {
    setInventory(inv => {
      const next = { ...inv, [id]: Math.max(0, (inv[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  function addItem(item) {
    setInventory(inv => ({ ...inv, [item.id]: (inv[item.id] || 0) + addQty }));
    setAddSearch("");
    setShowAdd(false);
  }

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden"
        style={{ maxHeight: "92vh", background: "#040810", border: "1px solid rgba(139,92,246,0.25)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.4)" }}>
          <div className="flex items-center gap-3">
            <Package size={16} className="text-violet-400" />
            <div>
              <div className="font-black text-white text-sm">Inventory Manager</div>
              <div className="text-[10px] text-slate-500 ep-mono">{totalItems.toLocaleString()} items · ≈{Math.round(totalValue).toLocaleString()} cr value</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdd(s => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: showAdd ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
              <Plus size={11} /> Add Items
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Add Items Panel */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-b overflow-hidden shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(139,92,246,0.04)" }}>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={addSearch} onChange={e => setAddSearch(e.target.value)}
                      placeholder="Search items to add…"
                      className="w-full pl-7 pr-3 py-2 text-xs text-white rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setAddQty(q => Math.max(1, q - 1))} className="w-7 h-7 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 flex items-center justify-center"><Minus size={10} /></button>
                    <span className="text-xs text-white ep-mono w-8 text-center">{addQty}</span>
                    <button onClick={() => setAddQty(q => q + 1)} className="w-7 h-7 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 flex items-center justify-center"><Plus size={10} /></button>
                  </div>
                </div>
                {addResults.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {addResults.map(item => {
                      const rarity = RARITIES[item.rarity] || RARITIES.common;
                      return (
                        <button key={item.id} onClick={() => addItem(item)}
                          className="flex items-center gap-2 p-2 rounded-xl text-left transition-all hover:scale-[1.02]"
                          style={{ background: `${rarity.color}10`, border: `1px solid ${rarity.color}30` }}>
                          <span className="text-lg shrink-0">{item.emoji}</span>
                          <div>
                            <div className="text-[10px] font-bold text-white">{item.name}</div>
                            <div className="text-[9px] ep-mono" style={{ color: rarity.color }}>T{item.tier} {item.rarity}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Bar */}
        <div className="px-5 py-3 border-b grid grid-cols-3 gap-3 shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
          {[
            { label: "Total Items", value: totalItems.toLocaleString(), color: "#22d3ee", icon: "📦" },
            { label: "Est. Value", value: `${Math.round(totalValue).toLocaleString()} cr`, color: "#fbbf24", icon: "💰" },
            { label: "Unique Items", value: inventoryItems.length.toLocaleString(), color: "#a78bfa", icon: "🔢" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-[10px] text-slate-500 ep-mono">{s.icon} {s.label}</div>
              <div className="font-black text-sm ep-mono" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b flex items-center gap-2 flex-wrap shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)" }}>
          <div className="relative">
            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter…"
              className="pl-7 pr-3 py-1.5 text-[11px] text-white rounded-lg w-32"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-[11px] py-1.5 px-2 rounded-lg text-slate-300"
            style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
          <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)}
            className="text-[11px] py-1.5 px-2 rounded-lg text-slate-300"
            style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="all">All Rarity</option>
            {Object.entries(RARITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-[11px] py-1.5 px-2 rounded-lg text-slate-300 ml-auto"
            style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="name">Name</option>
            <option value="qty">Quantity</option>
            <option value="value">Value</option>
            <option value="tier">Tier</option>
          </select>
        </div>

        {/* Inventory List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 && inventoryItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm font-bold">Your inventory is empty</div>
              <div className="text-xs mt-1">Click "Add Items" above to track your crafted goods</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm">No items match your filters.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => {
                const rarity = RARITIES[item.rarity] || RARITIES.common;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${rarity.color}12` }}>
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] ep-mono" style={{ color: rarity.color }}>T{item.tier} {item.rarity}</span>
                        <span className="text-[10px] text-slate-600">·</span>
                        <span className="text-[10px] text-slate-500">{item.category?.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-amber-300 ep-mono font-bold">≈{Math.round(item.totalValue).toLocaleString()} cr</div>
                      <div className="text-[10px] text-slate-500 ep-mono">{Math.round(getBaseValue(item))} ea</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => adjustQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-black text-white ep-mono w-10 text-center">{item.qty}</span>
                      <button onClick={() => adjustQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        <Plus size={10} />
                      </button>
                      <button onClick={() => { setInventory(inv => { const n = { ...inv }; delete n[item.id]; return n; }); }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400/50 hover:bg-red-500/10 hover:text-red-400 transition-colors ml-1">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}