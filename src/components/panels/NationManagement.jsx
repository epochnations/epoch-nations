import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Sliders } from "lucide-react";

export default function NationManagement({ nation, onClose, onRefresh }) {
  const [edu, setEdu] = useState(nation?.education_spending ?? 20);
  const [mil, setMil] = useState(nation?.military_spending ?? 20);
  const [loading, setLoading] = useState(false);

  if (!nation) return null;

  const totalSpending = edu + mil;

  async function save() {
    setLoading(true);
    const techGain = Math.floor(edu * 0.5);
    const powerGain = Math.floor(mil * 0.3);
    const defGain = Math.floor(mil * 0.2);

    await base44.entities.Nation.update(nation.id, {
      education_spending: edu,
      military_spending: mil,
      tech_points: nation.tech_points + techGain,
      unit_power: Math.min(200, nation.unit_power + powerGain),
      defense_level: Math.min(200, nation.defense_level + defGain),
      gdp: nation.gdp + Math.floor(edu * 2),
      stability: Math.min(100, nation.stability + Math.floor((100 - totalSpending) * 0.1)),
    });
    setLoading(false);
    onRefresh?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-cyan-400" />
            <span className="font-bold text-white">Nation Management</span>
          </div>
          <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-white" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-slate-300 font-bold">📚 Education Budget</label>
              <span className="font-mono text-cyan-400">{edu}%</span>
            </div>
            <input type="range" min={0} max={60} value={edu} onChange={e => setEdu(+e.target.value)}
              className="w-full accent-cyan-400" />
            <div className="text-xs text-slate-500 mt-1">+{Math.floor(edu * 0.5)} Tech Points · +{edu * 2} GDP per cycle</div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-slate-300 font-bold">⚔️ Military Budget</label>
              <span className="font-mono text-red-400">{mil}%</span>
            </div>
            <input type="range" min={0} max={60} value={mil} onChange={e => setMil(+e.target.value)}
              className="w-full accent-red-400" />
            <div className="text-xs text-slate-500 mt-1">+{Math.floor(mil * 0.3)} Unit Power · +{Math.floor(mil * 0.2)} Defense per cycle</div>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Total Spending</div>
              <div className={`font-bold font-mono text-sm ${totalSpending > 80 ? "text-red-400" : "text-white"}`}>{totalSpending}%</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Welfare Budget</div>
              <div className="font-bold font-mono text-sm text-green-400">{Math.max(0, 100 - totalSpending)}%</div>
            </div>
          </div>

          {totalSpending > 80 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
              <div className="text-xs text-amber-400 font-bold">⚠ High spending may reduce public trust over time</div>
            </div>
          )}

          <button
            onClick={save}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
          >
            <Save size={14} />
            {loading ? "Saving..." : "APPLY BUDGET CYCLE"}
          </button>
        </div>
      </div>
    </div>
  );
}