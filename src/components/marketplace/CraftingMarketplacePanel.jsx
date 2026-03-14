/**
 * CraftingMarketplacePanel — Global player marketplace for crafted items
 * Players list items for sale; others browse and buy with Credits
 */
import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, X, Search, Tag, Package, TrendingUp, RefreshCw } from "lucide-react";
import { ALL_ITEMS, CATEGORIES, RARITIES } from "../crafting/ItemDatabase";

const BASE_PRICES = { common: 5, uncommon: 15, rare: 50, epic: 150, legendary: 500 };

export default function CraftingMarketplacePanel({ nation, onRefresh }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("browse");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [buying, setBuying] = useState(null);
  const [form, setForm] = useState({ item_id: "", quantity: 1, price_per_unit: 10, description: "" });
  const [itemSearch, setItemSearch] = useState("");

  useEffect(() => { loadListings(); }, []);

  async function loadListings() {
    setLoading(true);
    const data = await base44.entities.CraftingMarketListing.filter({ status: "active" }, "-created_date", 100);
    setListings(data);
    setLoading(false);
  }

  const itemSuggestions = useMemo(() => {
    if (!itemSearch || itemSearch.length < 2) return [];
    return ALL_ITEMS.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 6);
  }, [itemSearch]);

  const myListings = listings.filter(l => l.seller_nation_id === nation?.id);
  const allListings = listings.filter(l => l.seller_nation_id !== nation?.id);

  const filtered = allListings.filter(l => {
    const matchSearch = !search || l.item_name?.toLowerCase().includes(search.toLowerCase()) || l.item_id?.includes(search.toLowerCase());
    const matchCat = catFilter === "all" || l.item_category === catFilter;
    const matchRarity = rarityFilter === "all" || l.item_rarity === rarityFilter;
    return matchSearch && matchCat && matchRarity;
  });

  async function createListing() {
    if (!form.item_id || !nation) return;
    const item = ALL_ITEMS.find(i => i.id === form.item_id);
    if (!item) return;
    await base44.entities.CraftingMarketListing.create({
      seller_nation_id: nation.id,
      seller_nation_name: nation.name,
      seller_flag: nation.flag_emoji || "🏴",
      seller_color: nation.flag_color || "#3b82f6",
      item_id: item.id,
      item_name: item.name,
      item_emoji: item.emoji,
      item_category: item.category,
      item_rarity: item.rarity,
      item_tier: item.tier,
      quantity: Number(form.quantity),
      price_per_unit: Number(form.price_per_unit),
      total_price: Number(form.quantity) * Number(form.price_per_unit),
      description: form.description,
      status: "active",
    });
    setForm({ item_id: "", quantity: 1, price_per_unit: 10, description: "" });
    setShowCreate(false);
    setItemSearch("");
    loadListings();
  }

  async function buyListing(listing) {
    if (!nation) return;
    const totalCost = listing.total_price;
    if ((nation.currency || 0) < totalCost) {
      alert(`Insufficient funds. Need ${totalCost} credits, have ${Math.floor(nation.currency || 0)}.`);
      return;
    }
    setBuying(listing.id);
    await Promise.all([
      base44.entities.CraftingMarketListing.update(listing.id, {
        status: "sold",
        buyer_nation_id: nation.id,
        buyer_nation_name: nation.name,
      }),
      base44.entities.Nation.update(nation.id, { currency: (nation.currency || 0) - totalCost }),
    ]);
    setBuying(null);
    loadListings();
    onRefresh?.();
  }

  async function cancelListing(id) {
    await base44.entities.CraftingMarketListing.update(id, { status: "cancelled" });
    loadListings();
  }

  const getRarityColor = (r) => (RARITIES[r] || RARITIES.common).color;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-green-400" />
          <div>
            <div className="font-black text-white text-sm">Crafting Marketplace</div>
            <div className="text-[10px] text-slate-500 ep-mono">{listings.length} active listings · Global player market</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadListings} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400">
            <RefreshCw size={12} />
          </button>
          <button onClick={() => setShowCreate(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
            <Plus size={11} /> List Item
          </button>
        </div>
      </div>

      {/* Create Listing */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl"
            style={{ border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.04)" }}>
            <div className="p-4 space-y-3">
              <div className="text-xs font-black text-green-400 ep-mono uppercase">Create Listing</div>
              {/* Item selector */}
              <div className="relative">
                <Search size={11} className="absolute left-3 top-2.5 text-slate-500" />
                <input value={itemSearch} onChange={e => { setItemSearch(e.target.value); setForm(f => ({ ...f, item_id: "" })); }}
                  placeholder="Search item to list…"
                  className="w-full pl-7 pr-3 py-2 text-xs text-white rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {itemSuggestions.length > 0 && !form.item_id && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {itemSuggestions.map(item => (
                    <button key={item.id} onClick={() => { setForm(f => ({ ...f, item_id: item.id, price_per_unit: Math.round(BASE_PRICES[item.rarity || "common"] * (item.tier || 1)) })); setItemSearch(item.name); }}
                      className="flex items-center gap-2 p-2 rounded-lg text-left transition-all hover:bg-white/10"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <span>{item.emoji}</span>
                      <div>
                        <div className="text-[10px] font-bold text-white">{item.name}</div>
                        <div className="text-[9px] ep-mono" style={{ color: getRarityColor(item.rarity) }}>T{item.tier}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {form.item_id && (
                <div className="flex gap-2 flex-wrap">
                  <div className="flex-1 min-w-[100px]">
                    <div className="text-[10px] text-slate-500 mb-1">Quantity</div>
                    <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                      className="w-full px-3 py-2 text-xs text-white rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <div className="text-[10px] text-slate-500 mb-1">Price / unit (cr)</div>
                    <input type="number" min="1" value={form.price_per_unit} onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))}
                      className="w-full px-3 py-2 text-xs text-white rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <div className="text-[10px] text-slate-500 mb-1">Note (optional)</div>
                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Any notes…"
                      className="w-full px-3 py-2 text-xs text-white rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
                <button onClick={createListing} disabled={!form.item_id}
                  className="px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "black" }}>
                  List for {Number(form.quantity) * Number(form.price_per_unit)} cr total
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2">
        {[["browse", "🌐 Browse All"], ["mine", "📦 My Listings"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
            style={{
              background: tab === id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${tab === id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
              color: tab === id ? "white" : "#64748b"
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters (browse tab) */}
      {tab === "browse" && (
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-7 pr-3 py-1.5 text-[11px] text-white rounded-lg w-36"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
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
        </div>
      )}

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : tab === "mine" ? (
        myListings.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">You have no active listings. Click "List Item" to start selling!</div>
        ) : (
          <div className="space-y-2">
            {myListings.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-xl">{l.item_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">{l.item_name}</div>
                  <div className="text-[10px] ep-mono" style={{ color: getRarityColor(l.item_rarity) }}>T{l.item_tier} {l.item_rarity} · ×{l.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-amber-300 ep-mono">{l.total_price} cr</div>
                  <div className="text-[10px] text-slate-500">{l.price_per_unit} cr/ea</div>
                </div>
                <button onClick={() => cancelListing(l.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 ml-1">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">No listings match your filters.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(l => {
            const rarityColor = getRarityColor(l.item_rarity);
            const canAfford = (nation?.currency || 0) >= l.total_price;
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${rarityColor}12` }}>
                  {l.item_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-white truncate">{l.item_name}</div>
                    <span className="text-[9px] ep-mono px-1.5 py-0.5 rounded" style={{ background: `${rarityColor}18`, color: rarityColor }}>
                      {l.item_rarity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">×{l.quantity} units</span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span style={{ color: l.seller_color || "#3b82f6" }} className="text-[10px]">
                      {l.seller_flag} {l.seller_nation_name}
                    </span>
                  </div>
                  {l.description && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{l.description}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-amber-300 ep-mono">{l.total_price.toLocaleString()} cr</div>
                  <div className="text-[10px] text-slate-500">{l.price_per_unit} cr/ea</div>
                </div>
                <button
                  onClick={() => buyListing(l)}
                  disabled={!canAfford || buying === l.id}
                  className="ml-2 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shrink-0"
                  style={{ background: canAfford ? "linear-gradient(135deg, #22d3ee, #06b6d4)" : "rgba(255,255,255,0.05)", color: canAfford ? "black" : "#64748b" }}>
                  {buying === l.id ? "…" : canAfford ? "Buy" : "No Funds"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}