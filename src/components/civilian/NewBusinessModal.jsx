/**
 * NewBusinessModal — Form to open a new business.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const BUSINESS_TYPES = [
  { id: "restaurant",   label: "Restaurant",  emoji: "🍽️", cost: 500,  desc: "Serve meals, build reputation, attract customers", rev: 25, exp: 8  },
  { id: "farm",         label: "Farm",        emoji: "🌾", cost: 300,  desc: "Grow crops and produce raw food resources",        rev: 15, exp: 4  },
  { id: "retail_store", label: "Retail Store",emoji: "🛍️", cost: 800,  desc: "Buy resources and sell goods for profit",          rev: 35, exp: 12 },
  { id: "factory",      label: "Factory",     emoji: "🏭", cost: 1500, desc: "Mass-produce goods from raw materials",            rev: 60, exp: 20 },
  { id: "workshop",     label: "Workshop",    emoji: "🔨", cost: 600,  desc: "Handcraft specialty items for premium prices",     rev: 30, exp: 9  },
];

export default function NewBusinessModal({ citizen, onClose, onCreated }) {
  const [selected, setSelected] = useState(null);
  const [name, setName]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const chosen = BUSINESS_TYPES.find(b => b.id === selected);

  async function handleCreate() {
    if (!chosen || !name.trim()) return;
    if ((citizen?.savings || 0) < chosen.cost) { setError("Not enough savings!"); return; }
    setSaving(true);
    await base44.entities.Business.create({
      owner_email: citizen.owner_email,
      nation_id: citizen.nation_id || "",
      name: name.trim(),
      business_type: chosen.id,
      level: 1,
      revenue_per_tick: chosen.rev,
      expenses_per_tick: chosen.exp,
      employees: 0,
      reputation: 50,
      is_open: true,
    });
    await base44.entities.Citizen.update(citizen.id, {
      savings: (citizen.savings || 0) - chosen.cost,
    });
    setSaving(false);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0d1424 0%,#040810 100%)", border: "1px solid rgba(245,158,11,0.25)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="font-black text-white">Open New Business</div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {BUSINESS_TYPES.map(bt => {
              const canAfford = (citizen?.savings || 0) >= bt.cost;
              const isSelected = selected === bt.id;
              return (
                <button key={bt.id} onClick={() => canAfford && setSelected(bt.id)}
                  disabled={!canAfford}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isSelected ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)"}`,
                    opacity: canAfford ? 1 : 0.4,
                  }}>
                  <span className="text-2xl shrink-0">{bt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{bt.label}</div>
                    <div className="text-[10px] text-slate-500">{bt.desc}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-green-400">+{bt.rev}/tick revenue</span>
                      <span className="text-[9px] text-red-400">-{bt.exp}/tick expenses</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-amber-400 ep-mono">{bt.cost.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-600">startup cost</div>
                  </div>
                </button>
              );
            })}
          </div>

          {chosen && (
            <div>
              <div className="text-[10px] text-slate-500 mb-1.5">Business Name</div>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder={`e.g. "${chosen.emoji} ${citizen?.display_name || ""}'s ${chosen.label}"`}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white ep-input"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">{error}</div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Savings: <span className="text-amber-400 font-bold ep-mono">{(citizen?.savings || 0).toLocaleString()} cr</span>
            </div>
            <button onClick={handleCreate}
              disabled={!chosen || !name.trim() || saving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
              {saving ? "⏳ Opening…" : `🏢 Open — ${chosen?.cost?.toLocaleString() || 0} cr`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}