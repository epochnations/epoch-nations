/**
 * CommunityItemRegistry — Portal for community developers to submit custom items
 * and view/vote on existing submissions.
 */
import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, CheckCircle, XCircle, ThumbsUp, Code2, Package, Clock, Star } from "lucide-react";
import { CATEGORIES, RARITIES, CRAFTING_STATIONS } from "./ItemDatabase";

const BLANK_FORM = {
  item_id: "", name: "", emoji: "📦", category: "misc", tier: 1, rarity: "common",
  weight: 1, stack_size: 100, crafting_station: "workbench",
  crafting_recipe: "", used_for: "", description: "",
};

export default function CommunityItemRegistry({ nation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("browse");
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState("approved");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    const data = await base44.entities.CommunityItem.list("-votes", 100);
    setItems(data);
    setLoading(false);
  }

  async function submitItem() {
    if (!form.item_id || !form.name || !nation) return;
    setSubmitting(true);
    let recipe = {};
    try { recipe = JSON.parse(form.crafting_recipe || "{}"); } catch { recipe = {}; }
    const used = form.used_for.split(",").map(s => s.trim()).filter(Boolean);
    await base44.entities.CommunityItem.create({
      item_id: form.item_id.toLowerCase().replace(/\s+/g, "_"),
      name: form.name,
      emoji: form.emoji,
      category: form.category,
      tier: Number(form.tier),
      rarity: form.rarity,
      weight: Number(form.weight),
      stack_size: Number(form.stack_size),
      crafting_station: form.crafting_station,
      crafting_recipe: recipe,
      used_for: used,
      description: form.description,
      author_nation: nation.name,
      author_email: user?.email || "",
      status: "pending",
      votes: 0,
    });
    setForm(BLANK_FORM);
    setSuccess(true);
    setSubmitting(false);
    loadItems();
    setTimeout(() => setSuccess(false), 3000);
  }

  async function vote(item) {
    if (!user) return;
    await base44.entities.CommunityItem.update(item.id, { votes: (item.votes || 0) + 1 });
    loadItems();
  }

  const filtered = items.filter(i => filterStatus === "all" || i.status === filterStatus);

  const statusColors = { pending: "#fbbf24", approved: "#4ade80", rejected: "#f87171" };
  const statusIcons = { pending: Clock, approved: CheckCircle, rejected: XCircle };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-violet-400" />
          <div>
            <div className="font-black text-white text-sm">Community Item Registry</div>
            <div className="text-[10px] text-slate-500 ep-mono">Submit custom items · Vote on submissions · Shape the encyclopedia</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[["browse", "🔍 Browse"], ["submit", "➕ Submit Item"], ["guide", "📖 Dev Guide"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
            style={{
              background: tab === id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${tab === id ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: tab === id ? "#a78bfa" : "#64748b"
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Browse */}
      {tab === "browse" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {["all","pending","approved","rejected"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all"
                style={{
                  background: filterStatus === s ? `${statusColors[s] || "rgba(255,255,255,0.1)"}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${filterStatus === s ? (statusColors[s] || "rgba(255,255,255,0.2)") + "40" : "rgba(255,255,255,0.07)"}`,
                  color: filterStatus === s ? (statusColors[s] || "white") : "#64748b"
                }}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} {s !== "all" && `(${items.filter(i=>i.status===s).length})`}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-500 py-10 text-sm">No {filterStatus} submissions yet.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => {
                const StatusIcon = statusIcons[item.status] || Clock;
                const rarity = RARITIES[item.rarity] || RARITIES.common;
                return (
                  <div key={item.id} className="p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{item.name}</span>
                          <span className="text-[9px] ep-mono px-1.5 py-0.5 rounded" style={{ background: `${rarity.color}18`, color: rarity.color }}>{item.rarity}</span>
                          <span className="text-[9px] ep-mono px-1.5 py-0.5 rounded"
                            style={{ background: `${statusColors[item.status]}15`, color: statusColors[item.status] }}>
                            <StatusIcon size={8} className="inline mr-1" />{item.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          T{item.tier} · {item.category?.replace(/_/g," ")} · by {item.author_nation || "Unknown"}
                        </div>
                        {item.description && <div className="text-[10px] text-slate-400 mt-1 truncate">{item.description}</div>}
                      </div>
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <button onClick={() => vote(item)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:bg-violet-500/20"
                          style={{ border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                          <ThumbsUp size={10} /> {item.votes || 0}
                        </button>
                        {item.status === "approved" && <Star size={10} className="text-amber-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submit Form */}
      {tab === "submit" && (
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}>
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-green-400 text-xs font-bold"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <CheckCircle size={14} /> Item submitted for review! The community can now vote on it.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "item_id", label: "Item ID (snake_case)", placeholder: "e.g. my_special_item" },
              { key: "name", label: "Display Name", placeholder: "e.g. My Special Item" },
              { key: "emoji", label: "Emoji", placeholder: "📦" },
              { key: "description", label: "Description", placeholder: "What does this item do?" },
            ].map(f => (
              <div key={f.key}>
                <div className="text-[10px] text-slate-500 mb-1">{f.label}</div>
                <input value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-xs text-white rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            ))}
            <div>
              <div className="text-[10px] text-slate-500 mb-1">Category</div>
              <select value={form.category} onChange={e => setForm(x => ({ ...x, category: e.target.value }))}
                className="w-full px-3 py-2 text-xs text-white rounded-xl"
                style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)" }}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 mb-1">Rarity</div>
              <select value={form.rarity} onChange={e => setForm(x => ({ ...x, rarity: e.target.value }))}
                className="w-full px-3 py-2 text-xs text-white rounded-xl"
                style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)" }}>
                {Object.entries(RARITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 mb-1">Crafting Station</div>
              <select value={form.crafting_station} onChange={e => setForm(x => ({ ...x, crafting_station: e.target.value }))}
                className="w-full px-3 py-2 text-xs text-white rounded-xl"
                style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)" }}>
                {Object.entries(CRAFTING_STATIONS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            {[
              { key: "tier", label: "Tier (1–5)", type: "number", placeholder: "1" },
              { key: "weight", label: "Weight", type: "number", placeholder: "5" },
              { key: "stack_size", label: "Stack Size", type: "number", placeholder: "100" },
            ].map(f => (
              <div key={f.key}>
                <div className="text-[10px] text-slate-500 mb-1">{f.label}</div>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-xs text-white rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <div className="text-[10px] text-slate-500 mb-1">Crafting Recipe (JSON: {"{ ingredient_id: quantity }"}) </div>
              <input value={form.crafting_recipe} onChange={e => setForm(x => ({ ...x, crafting_recipe: e.target.value }))}
                placeholder='{"iron_ingot": 3, "plank": 2}'
                className="w-full px-3 py-2 text-xs text-white rounded-xl ep-mono"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div className="sm:col-span-2">
              <div className="text-[10px] text-slate-500 mb-1">Used For (comma-separated)</div>
              <input value={form.used_for} onChange={e => setForm(x => ({ ...x, used_for: e.target.value }))}
                placeholder="construction, weapons, trade"
                className="w-full px-3 py-2 text-xs text-white rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
          </div>
          <button onClick={submitItem} disabled={submitting || !form.item_id || !form.name}
            className="w-full py-3 rounded-xl text-sm font-black transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "white" }}>
            {submitting ? "Submitting…" : "Submit for Community Review"}
          </button>
          <div className="text-[10px] text-slate-600 text-center">Items are reviewed by the community via votes. Highly-voted items may be added to the core game.</div>
        </div>
      )}

      {/* Developer Guide */}
      {tab === "guide" && (
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.12)" }}>
          <div className="text-sm font-black text-cyan-400">Developer Guide — Custom Items</div>
          {[
            { title: "Item ID Format", body: "Use snake_case unique IDs. They must not conflict with existing items. Examples: `plasma_cannon`, `nano_fabric`, `void_crystal`." },
            { title: "Tiers & Rarity", body: "Tier 1 = Stone Age primitives. Tier 5 = Galactic-era tech. Match your item's epoch. Rarity: common < uncommon < rare < epic < legendary." },
            { title: "Crafting Recipe", body: 'Use existing item IDs as ingredients. Format: `{"iron_ingot": 3, "coal": 2}`. An empty recipe `{}` means the item is gathered directly (raw material).' },
            { title: "Crafting Station", body: "Choose the right station: hand, workbench, forge, kiln, factory, chemical_plant, electronics_lab, advanced_factory, research_lab, space_foundry." },
            { title: "Review Process", body: "Submissions start as `pending`. The community votes. Items with high votes and quality recipes are reviewed by game developers for inclusion. Approved items appear in the main encyclopedia." },
            { title: "Quality Guidelines", body: "Items must be unique, realistic, and fit thematically into an epoch. No duplicates. No overpowered stat boosts. Balance weight and stack size to match tier." },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs font-bold text-white mb-1">{title}</div>
              <div className="text-[11px] text-slate-400 leading-relaxed">{body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}