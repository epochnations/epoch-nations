import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X } from "lucide-react";

const AGREEMENT_TYPES = [
  { value: "free_trade",       label: "🤝 Free Trade Pact",    desc: "−15% tariff on all trades between nations", modifier: -0.15 },
  { value: "tariff_reduction", label: "📉 Tariff Reduction",   desc: "−10% tariff on traded resources",           modifier: -0.10 },
  { value: "embargo",          label: "🚫 Trade Embargo",      desc: "+50% cost penalty on all trades",           modifier: 0.50 },
];

const TYPE_COLOR = {
  free_trade:       "border-blue-400/20 bg-blue-400/5 text-blue-300",
  tariff_reduction: "border-green-400/20 bg-green-400/5 text-green-300",
  embargo:          "border-red-400/20 bg-red-400/5 text-red-400",
};

export default function TradeAgreementPanel({ nation, allNations, onRefresh }) {
  const [agreements, setAgreements] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nation_b_id: "", agreement_type: "free_trade", duration_cycles: 10 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAgreements(); }, [nation?.id]);

  async function loadAgreements() {
    const a = await base44.entities.TradeAgreement.filter({ nation_a_id: nation.id });
    const b = await base44.entities.TradeAgreement.filter({ nation_b_id: nation.id });
    const merged = [...a, ...b.filter(x => x.nation_a_id !== nation.id)];
    setAgreements(merged.filter(ag => ag.status === "active"));
  }

  async function createAgreement() {
    if (!form.nation_b_id || saving) return;
    setSaving(true);
    const target = allNations.find(n => n.id === form.nation_b_id);
    const typeDef = AGREEMENT_TYPES.find(t => t.value === form.agreement_type);
    const dur = Number(form.duration_cycles);
    await base44.entities.TradeAgreement.create({
      nation_a_id: nation.id,
      nation_a_name: nation.name,
      nation_b_id: form.nation_b_id,
      nation_b_name: target?.name,
      agreement_type: form.agreement_type,
      tariff_modifier: typeDef?.modifier || 0,
      status: "active",
      duration_cycles: dur,
      cycles_remaining: dur,
      owner_email: nation.owner_email,
    });
    await base44.entities.NewsArticle.create({
      headline: `DIPLOMACY: ${nation.name} signs ${typeDef?.label} with ${target?.name}`,
      body: `${nation.name} and ${target?.name} have entered a formal ${form.agreement_type.replace("_", " ")} agreement, altering trade dynamics in the region.`,
      category: "policy", tier: "standard",
      nation_name: nation.name, nation_flag: nation.flag_emoji, nation_color: nation.flag_color,
    });
    setShowCreate(false);
    setSaving(false);
    await loadAgreements();
    onRefresh?.();
  }

  async function cancelAgreement(ag) {
    await base44.entities.TradeAgreement.update(ag.id, { status: "cancelled" });
    await loadAgreements();
    onRefresh?.();
  }

  const otherNations = allNations.filter(n => n.id !== nation.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-sm">Trade Agreements & Tariffs</h3>
          <p className="text-xs text-slate-500">Negotiate pacts that modify prices on all trade routes with a nation.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-all">
          <Plus size={12} /> New Agreement
        </button>
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4 space-y-3">
          <div className="text-sm font-bold text-violet-300 mb-2">New Trade Agreement</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Partner Nation</label>
              <select value={form.nation_b_id} onChange={e => setForm(f => ({ ...f, nation_b_id: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                <option value="">— Select Nation —</option>
                {otherNations.map(n => <option key={n.id} value={n.id}>{n.flag_emoji} {n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Agreement Type</label>
              <select value={form.agreement_type} onChange={e => setForm(f => ({ ...f, agreement_type: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                {AGREEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div className="text-xs text-slate-500 mt-1">{AGREEMENT_TYPES.find(t => t.value === form.agreement_type)?.desc}</div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Duration (trade cycles)</label>
              <input type="number" min={1} max={50} value={form.duration_cycles}
                onChange={e => setForm(f => ({ ...f, duration_cycles: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl text-xs border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
            <button onClick={createAgreement} disabled={saving || !form.nation_b_id}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 disabled:opacity-40">
              {saving ? "Signing..." : "✓ Sign Agreement"}
            </button>
          </div>
        </div>
      )}

      {agreements.length === 0 ? (
        <div className="text-xs text-slate-500 text-center py-6 rounded-xl border border-white/5 bg-white/3">
          No active trade agreements. Sign one above to modify tariffs.
        </div>
      ) : (
        <div className="space-y-2">
          {agreements.map(ag => {
            const partner = ag.nation_a_id === nation.id ? ag.nation_b_name : ag.nation_a_name;
            const typeDef = AGREEMENT_TYPES.find(t => t.value === ag.agreement_type);
            return (
              <div key={ag.id} className={`rounded-xl border p-3 flex items-center gap-3 ${TYPE_COLOR[ag.agreement_type] || "border-white/10 bg-white/3 text-slate-300"}`}>
                <div className="flex-1">
                  <div className="text-xs font-bold">{typeDef?.label}</div>
                  <div className="text-xs text-slate-400">with <span className="text-white font-bold">{partner}</span> · {ag.cycles_remaining} cycles remaining</div>
                  <div className="text-xs text-slate-500">{typeDef?.desc}</div>
                </div>
                <button onClick={() => cancelAgreement(ag)}
                  className="p-1.5 rounded-lg text-xs border border-white/10 text-slate-400 hover:bg-red-400/10 hover:border-red-400/20 hover:text-red-400">
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}