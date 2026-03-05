import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Users, Save } from "lucide-react";
import { EPOCHS } from "../game/EpochConfig";

const ROLES = [
  { key: "workers_farmers", label: "Farmers", emoji: "🌾", desc: "Produce Food" },
  { key: "workers_hunters", label: "Hunters", emoji: "🏹", desc: "Produce Food (random)" },
  { key: "workers_fishermen", label: "Fishermen", emoji: "🎣", desc: "Produce Food (coastal)" },
  { key: "workers_lumberjacks", label: "Lumberjacks", emoji: "🪵", desc: "Produce Wood" },
  { key: "workers_quarry", label: "Quarry Workers", emoji: "⛏️", desc: "Produce Stone" },
  { key: "workers_miners", label: "Miners", emoji: "⚒️", desc: "Produce Gold + Iron (Iron Age+)" },
  { key: "workers_oil_engineers", label: "Oil Engineers", emoji: "🛢️", desc: "Produce Oil (Industrial+)" },
  { key: "workers_builders", label: "Builders", emoji: "🔨", desc: "Speed up construction" },
  { key: "workers_soldiers", label: "Soldiers", emoji: "⚔️", desc: "Military power" },
  { key: "workers_researchers", label: "Researchers", emoji: "🔬", desc: "Generate Tech Points" },
  { key: "workers_industrial", label: "Industrial Workers", emoji: "🏭", desc: "Boost GDP (Industrial+)" },
];

export default function WorkforcePanel({ nation, onClose, onRefresh }) {
  const epochIndex = EPOCHS.indexOf(nation?.epoch) || 0;
  const pop = nation?.population || 1;

  const initial = {};
  ROLES.forEach(r => { initial[r.key] = nation?.[r.key] ?? 0; });
  const [assignments, setAssignments] = useState(initial);
  const [saving, setSaving] = useState(false);

  const totalAssigned = Object.values(assignments).reduce((a, b) => a + b, 0);
  const idle = Math.max(0, pop - totalAssigned);

  function set(key, val) {
    const newVal = Math.max(0, val);
    const others = Object.entries(assignments)
      .filter(([k]) => k !== key)
      .reduce((a, [, v]) => a + v, 0);
    if (others + newVal > pop) return; // can't exceed population
    setAssignments(prev => ({ ...prev, [key]: newVal }));
  }

  async function save() {
    setSaving(true);
    await base44.entities.Nation.update(nation.id, assignments);
    setSaving(false);
    onRefresh?.();
    onClose();
  }

  const techMult = 1 + epochIndex * 0.08;
  function productionFor(role) {
    const count = assignments[role.key] || 0;
    if (count === 0) return null;
    if (role.key === "workers_farmers") return `+${Math.floor(count * 8 * techMult)} Food/min`;
    if (role.key === "workers_hunters") return `+${Math.floor(count * 5 * techMult)}~${Math.floor(count * 7 * techMult)} Food/min`;
    if (role.key === "workers_fishermen") return `+${Math.floor(count * 6 * techMult)} Food/min`;
    if (role.key === "workers_lumberjacks") return `+${Math.floor(count * 5 * techMult)} Wood/min`;
    if (role.key === "workers_quarry") return `+${Math.floor(count * 4 * techMult)} Stone/min`;
    if (role.key === "workers_miners") return epochIndex >= 3
      ? `+${Math.floor(count * 2 * techMult)} Gold +${Math.floor(count * 3 * techMult)} Iron/min`
      : `+${Math.floor(count * 2 * techMult)} Gold/min`;
    if (role.key === "workers_oil_engineers") return epochIndex >= 9 ? `+${Math.floor(count * 6 * techMult)} Oil/min` : "Requires Industrial Age";
    if (role.key === "workers_researchers") return `+${Math.floor(count * 2 * techMult)} TP/min`;
    if (role.key === "workers_industrial") return epochIndex >= 9 ? `+${Math.floor(count * 10 * techMult)} GDP/min` : "Requires Industrial Age";
    return null;
  }

  const foodProd = Math.floor((assignments.workers_farmers || 0) * 8 * techMult)
    + Math.floor((assignments.workers_hunters || 0) * 5 * techMult)
    + Math.floor((assignments.workers_fishermen || 0) * 6 * techMult);
  const foodCons = Math.ceil(pop * 1.2);
  const netFood = foodProd - foodCons;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[92vh] backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-cyan-400" />
            <span className="font-bold text-white">Workforce Management</span>
          </div>
          <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-white" /></button>
        </div>

        {/* Summary bar */}
        <div className="px-6 py-3 border-b border-white/10 flex gap-4 flex-wrap shrink-0">
          <div className="text-xs text-slate-400">Population: <span className="text-white font-bold">{pop}</span></div>
          <div className="text-xs text-slate-400">Assigned: <span className="text-cyan-400 font-bold">{totalAssigned}</span></div>
          <div className="text-xs text-slate-400">Idle: <span className={idle > 0 ? "text-amber-400" : "text-green-400"} font-bold>{idle}</span></div>
          <div className={`text-xs font-bold ${netFood >= 0 ? "text-green-400" : "text-red-400"}`}>
            🌾 Net Food: {netFood >= 0 ? "+" : ""}{netFood}/min (prod {foodProd} - cons {foodCons})
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-3">
          {ROLES.map(role => {
            const prod = productionFor(role);
            const isLocked = (role.key === "workers_oil_engineers" || role.key === "workers_industrial") && epochIndex < 9;
            return (
              <div key={role.key} className={`rounded-xl p-3 border ${isLocked ? "border-white/5 bg-white/3 opacity-40" : "border-white/10 bg-white/5"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{role.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{role.label}</span>
                      {prod && <span className="text-xs text-green-400">{prod}</span>}
                    </div>
                    <div className="text-xs text-slate-500">{role.desc}</div>
                  </div>
                  {!isLocked && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => set(role.key, (assignments[role.key] || 0) - 1)}
                        className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                      >−</button>
                      <span className="w-8 text-center font-mono font-bold text-white text-sm">{assignments[role.key] || 0}</span>
                      <button
                        onClick={() => set(role.key, (assignments[role.key] || 0) + 1)}
                        disabled={totalAssigned >= pop}
                        className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-all disabled:opacity-30"
                      >+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6 pt-2 shrink-0">
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
          >
            <Save size={14} />
            {saving ? "Saving..." : "APPLY WORKFORCE ASSIGNMENTS"}
          </button>
        </div>
      </div>
    </div>
  );
}