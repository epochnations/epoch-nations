import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Minus } from "lucide-react";

const WORKER_TYPES = [
  { key:"workers_farmers",       label:"Farmers",      emoji:"👨‍🌾", produces:"Food",  rate:8  },
  { key:"workers_hunters",       label:"Hunters",      emoji:"🏹",  produces:"Food",  rate:5  },
  { key:"workers_fishermen",     label:"Fishermen",    emoji:"🎣",  produces:"Food",  rate:6  },
  { key:"workers_lumberjacks",   label:"Lumberjacks",  emoji:"🪓",  produces:"Wood",  rate:6  },
  { key:"workers_quarry",        label:"Quarry",       emoji:"⛏️",  produces:"Stone", rate:5  },
  { key:"workers_miners",        label:"Miners",       emoji:"⛏️",  produces:"Gold",  rate:4  },
  { key:"workers_iron_miners",   label:"Iron Miners",  emoji:"🔩",  produces:"Iron",  rate:5  },
  { key:"workers_oil_engineers", label:"Oil Engrs",    emoji:"🛢️",  produces:"Oil",   rate:6  },
  { key:"workers_soldiers",      label:"Soldiers",     emoji:"⚔️",  produces:"Power", rate:3  },
  { key:"workers_researchers",   label:"Researchers",  emoji:"🔬",  produces:"Tech",  rate:10 },
  { key:"workers_builders",      label:"Builders",     emoji:"🏗️",  produces:"Infra", rate:5  },
  { key:"workers_industrial",    label:"Industrial",   emoji:"🏭",  produces:"GDP",   rate:8  },
];

const PRODUCE_COLORS = { Food:"#16a34a", Wood:"#a16207", Stone:"#78716c", Gold:"#d97706", Iron:"#6b7280", Oil:"#6b21a8", Power:"#f87171", Tech:"#818cf8", Infra:"#0e7490", GDP:"#34d399" };

export default function IslandWorkersTab({ tile, myNation, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [draft, setDraft] = useState(() => {
    const d = {};
    WORKER_TYPES.forEach(w => { d[w.key] = myNation?.[w.key] || 0; });
    return d;
  });

  const totalPop = myNation?.population || 10;
  const totalAssigned = Object.values(draft).reduce((s, v) => s + v, 0);
  const unassigned = Math.max(0, totalPop - totalAssigned);

  function adjust(key, delta) {
    setDraft(d => {
      const next = Math.max(0, (d[key] || 0) + delta);
      const newTotal = Object.entries(d).reduce((s, [k, v]) => s + (k === key ? next : v), 0);
      if (newTotal > totalPop) return d;
      return { ...d, [key]: next };
    });
  }

  async function save() {
    if (!myNation) return;
    setSaving(true); setMsg(null);
    await base44.entities.Nation.update(myNation.id, draft);
    setSaving(false);
    setMsg("✅ Workers reassigned!");
    onRefresh?.();
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-3 text-center" style={{ background:"rgba(34,211,238,0.06)", border:"1px solid rgba(34,211,238,0.15)" }}>
          <div className="text-[9px] text-slate-500 mb-1">Population</div>
          <div className="text-xl font-black text-cyan-400">{totalPop}M</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.15)" }}>
          <div className="text-[9px] text-slate-500 mb-1">Assigned</div>
          <div className="text-xl font-black text-green-400">{totalAssigned}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background:`${unassigned>0?"rgba(251,191,36,0.06)":"rgba(255,255,255,0.03)"}`, border:`1px solid ${unassigned>0?"rgba(251,191,36,0.2)":"rgba(255,255,255,0.08)"}` }}>
          <div className="text-[9px] text-slate-500 mb-1">Unassigned</div>
          <div className={`text-xl font-black ${unassigned>0?"text-amber-400":"text-slate-500"}`}>{unassigned}</div>
        </div>
      </div>

      {msg && <div className="px-3 py-2 rounded-lg text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20">{msg}</div>}

      {/* Worker rows */}
      <div className="space-y-1.5">
        {WORKER_TYPES.map(w => {
          const count = draft[w.key] || 0;
          const color = PRODUCE_COLORS[w.produces] || "#64748b";
          return (
            <div key={w.key} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xl shrink-0">{w.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">{w.label}</div>
                <div className="text-[9px] font-bold" style={{ color }}>+{w.rate * count}/tick {w.produces}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => adjust(w.key, -1)} disabled={count === 0}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-25 transition-all border border-white/10">
                  <Minus size={12}/>
                </button>
                <span className="text-sm font-black text-white ep-mono w-5 text-center">{count}</span>
                <button onClick={() => adjust(w.key, 1)} disabled={totalAssigned >= totalPop}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-25 transition-all border border-white/10">
                  <Plus size={12}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:brightness-110"
        style={{ background:"linear-gradient(135deg,#0891b2,#0e7490)" }}>
        {saving ? "⏳ Saving…" : "👷 Apply Worker Assignments"}
      </button>
    </div>
  );
}