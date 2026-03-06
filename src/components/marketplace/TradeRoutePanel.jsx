import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Pause, Play, ArrowRight, ArrowLeft } from "lucide-react";

const RESOURCE_META = {
  res_wood:  { label: "Wood",  emoji: "🪵", color: "text-amber-400" },
  res_stone: { label: "Stone", emoji: "🪨", color: "text-slate-300" },
  res_iron:  { label: "Iron",  emoji: "⚙️", color: "text-blue-400" },
  res_oil:   { label: "Oil",   emoji: "🛢️", color: "text-gray-400" },
  res_gold:  { label: "Gold",  emoji: "🥇", color: "text-yellow-400" },
};

const BASE_PRICE = { res_wood: 40, res_stone: 60, res_iron: 100, res_oil: 160, res_gold: 250 };

export default function TradeRoutePanel({ nation, allNations, agreements, onRefresh }) {
  const [routes, setRoutes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ to_nation_id: "", resource_key: "res_wood", quantity: 50, price_per_100: 40, direction: "export" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRoutes(); }, [nation?.id]);

  async function loadRoutes() {
    setLoading(true);
    const r = await base44.entities.TradeRoute.filter({ from_nation_id: nation.id });
    const r2 = await base44.entities.TradeRoute.filter({ to_nation_id: nation.id });
    setRoutes([...r, ...r2.filter(x => x.from_nation_id !== nation.id)]);
    setLoading(false);
  }

  // Get tariff modifier for a target nation
  function getTariff(targetNationId) {
    const ag = agreements.find(a =>
      (a.nation_a_id === nation.id && a.nation_b_id === targetNationId) ||
      (a.nation_b_id === nation.id && a.nation_a_id === targetNationId)
    );
    if (!ag || ag.status !== "active") return { modifier: 0, label: null };
    if (ag.agreement_type === "embargo") return { modifier: 0.5, label: "🚫 Embargo +50%" };
    if (ag.agreement_type === "free_trade") return { modifier: -0.15, label: "🤝 Free Trade −15%" };
    if (ag.agreement_type === "tariff_reduction") return { modifier: ag.tariff_modifier || -0.1, label: `📉 Tariff −${Math.abs((ag.tariff_modifier || -0.1) * 100).toFixed(0)}%` };
    return { modifier: 0, label: null };
  }

  function effectivePrice(resourceKey, price_per_100, targetId) {
    const { modifier } = getTariff(targetId);
    return Math.round(price_per_100 * (1 + modifier));
  }

  async function createRoute() {
    if (!form.to_nation_id || !form.resource_key || saving) return;
    setSaving(true);
    const targetNation = allNations.find(n => n.id === form.to_nation_id);
    await base44.entities.TradeRoute.create({
      from_nation_id: form.direction === "export" ? nation.id : form.to_nation_id,
      from_nation_name: form.direction === "export" ? nation.name : targetNation?.name,
      to_nation_id: form.direction === "export" ? form.to_nation_id : nation.id,
      to_nation_name: form.direction === "export" ? targetNation?.name : nation.name,
      resource_key: form.resource_key,
      quantity_per_cycle: Number(form.quantity),
      price_per_100: Number(form.price_per_100),
      direction: form.direction,
      status: "active",
      cycles_completed: 0,
      total_earned: 0,
      owner_email: nation.owner_email,
    });
    await base44.entities.NewsArticle.create({
      headline: `TRADE: ${nation.name} opens new ${form.direction} route for ${RESOURCE_META[form.resource_key].label}`,
      body: `${nation.name} has established a ${form.direction} route for ${RESOURCE_META[form.resource_key].label} with ${targetNation?.name}, trading ${form.quantity} units per cycle.`,
      category: "economy", tier: "standard",
      nation_name: nation.name, nation_flag: nation.flag_emoji, nation_color: nation.flag_color
    });
    setShowCreate(false);
    setSaving(false);
    await loadRoutes();
    onRefresh?.();
  }

  async function toggleRoute(route) {
    const newStatus = route.status === "active" ? "paused" : "active";
    await base44.entities.TradeRoute.update(route.id, { status: newStatus });
    await loadRoutes();
  }

  async function deleteRoute(route) {
    await base44.entities.TradeRoute.delete(route.id);
    await loadRoutes();
  }

  // Execute a manual trade cycle for a route
  async function executeCycle(route) {
    if (route.status !== "active") return;
    const isExport = route.from_nation_id === nation.id;
    const resKey = route.resource_key;
    const qty = route.quantity_per_cycle;
    const { modifier } = getTariff(isExport ? route.to_nation_id : route.from_nation_id);
    const price = Math.round((route.price_per_100 / 100) * qty * (1 + modifier));

    if (isExport) {
      if ((nation[resKey] || 0) < qty) { alert("Not enough resources for this trade cycle."); return; }
      await base44.entities.Nation.update(nation.id, {
        [resKey]: Math.max(0, (nation[resKey] || 0) - qty),
        currency: (nation.currency || 0) + price
      });
    } else {
      // import: pay treasury, receive resources
      if ((nation.currency || 0) < price) { alert("Not enough treasury for this import cycle."); return; }
      await base44.entities.Nation.update(nation.id, {
        [resKey]: (nation[resKey] || 0) + qty,
        currency: Math.max(0, (nation.currency || 0) - price)
      });
    }
    await base44.entities.TradeRoute.update(route.id, {
      cycles_completed: (route.cycles_completed || 0) + 1,
      total_earned: (route.total_earned || 0) + price
    });
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: route.from_nation_id,
      from_nation_name: route.from_nation_name,
      to_nation_id: route.to_nation_id,
      to_nation_name: route.to_nation_name,
      resource_type: resKey,
      resource_amount: qty,
      total_value: price,
      description: `Trade route: ${qty} ${RESOURCE_META[resKey].label} for ${price}💰 (${isExport ? "export" : "import"})`,
      epoch: nation.epoch
    });
    onRefresh?.();
    await loadRoutes();
  }

  const otherNations = allNations.filter(n => n.id !== nation.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-sm">Trade Routes</h3>
          <p className="text-xs text-slate-500">Establish ongoing export/import channels with other nations.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all">
          <Plus size={12} /> New Route
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 space-y-3">
          <div className="text-sm font-bold text-cyan-300 mb-2">Establish Trade Route</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Direction</label>
              <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                <option value="export">📤 Export (you sell)</option>
                <option value="import">📥 Import (you buy)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Partner Nation</label>
              <select value={form.to_nation_id} onChange={e => setForm(f => ({ ...f, to_nation_id: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                <option value="">— Select Nation —</option>
                {otherNations.map(n => <option key={n.id} value={n.id}>{n.flag_emoji} {n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Resource</label>
              <select value={form.resource_key} onChange={e => setForm(f => ({ ...f, resource_key: e.target.value, price_per_100: BASE_PRICE[e.target.value] || 50 }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                {Object.entries(RESOURCE_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Qty per cycle</label>
              <input type="number" min={10} max={500} step={10} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">
                Your price per 100 units (market base: {BASE_PRICE[form.resource_key]}💰)
                {form.to_nation_id && (() => { const t = getTariff(form.to_nation_id); return t.label ? <span className="ml-2 text-yellow-400">{t.label}</span> : null; })()}
              </label>
              <input type="number" min={1} value={form.price_per_100}
                onChange={e => setForm(f => ({ ...f, price_per_100: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
              {form.to_nation_id && (
                <div className="text-xs text-slate-500 mt-1">
                  Effective price per cycle: <span className="text-green-400 font-bold">{effectivePrice(form.resource_key, form.price_per_100, form.to_nation_id)}💰</span> (after tariffs)
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl text-xs border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
            <button onClick={createRoute} disabled={saving || !form.to_nation_id}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40">
              {saving ? "Creating..." : "✓ Establish Route"}
            </button>
          </div>
        </div>
      )}

      {/* Route List */}
      {loading ? (
        <div className="text-xs text-slate-500 text-center py-4">Loading routes...</div>
      ) : routes.length === 0 ? (
        <div className="text-xs text-slate-500 text-center py-6 rounded-xl border border-white/5 bg-white/3">
          No trade routes established. Create one above.
        </div>
      ) : (
        <div className="space-y-2">
          {routes.map(route => {
            const isExport = route.from_nation_id === nation.id;
            const partner = isExport ? route.to_nation_name : route.from_nation_name;
            const partnerId = isExport ? route.to_nation_id : route.from_nation_id;
            const meta = RESOURCE_META[route.resource_key] || { emoji: "📦", label: route.resource_key, color: "text-white" };
            const { label: tariffLabel } = getTariff(partnerId);
            const effPrice = effectivePrice(route.resource_key, route.price_per_100, partnerId);
            const statusColor = route.status === "active" ? "text-green-400 border-green-400/20 bg-green-400/5" : "text-slate-400 border-white/10 bg-white/3";

            return (
              <div key={route.id} className={`rounded-xl border p-3 ${statusColor}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold">{meta.emoji} {meta.label}</span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    {isExport ? <><ArrowRight size={10} /> Export to</> : <><ArrowLeft size={10} /> Import from</>}
                    <span className="text-white font-bold">{partner}</span>
                  </span>
                  {tariffLabel && <span className="text-xs bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded-lg">{tariffLabel}</span>}
                  <span className="ml-auto text-xs font-mono text-slate-400">{route.quantity_per_cycle} units → <span className="text-green-400 font-bold">{effPrice}💰</span></span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-slate-600">{route.cycles_completed} cycles · {route.total_earned}💰 earned</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button onClick={() => executeCycle(route)} disabled={route.status !== "active"}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 disabled:opacity-40">
                      ▶ Execute
                    </button>
                    <button onClick={() => toggleRoute(route)}
                      className="p-1.5 rounded-lg text-xs border border-white/10 text-slate-400 hover:bg-white/5">
                      {route.status === "active" ? <Pause size={11} /> : <Play size={11} />}
                    </button>
                    {route.owner_email === nation.owner_email && (
                      <button onClick={() => deleteRoute(route)}
                        className="p-1.5 rounded-lg text-xs border border-red-400/20 text-red-400 hover:bg-red-400/10">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}