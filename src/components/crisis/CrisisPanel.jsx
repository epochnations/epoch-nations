/**
 * CrisisPanel — Emergency & Crisis management system.
 * 911-operator style: dispatch police, ambulances, firefighters.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Shield, Zap } from "lucide-react";

const CRISIS_CONFIG = {
  riot:                   { emoji:"🔥", color:"#ef4444", units:["police","national_guard"] },
  fire:                   { emoji:"🚒", color:"#f97316", units:["fire","ambulance"] },
  earthquake:             { emoji:"🌍", color:"#78716c", units:["rescue","ambulance","engineering"] },
  epidemic:               { emoji:"🦠", color:"#10b981", units:["ambulance","health_unit"] },
  power_outage:           { emoji:"⚡", color:"#fbbf24", units:["engineering","national_guard"] },
  infrastructure_failure: { emoji:"🏗️", color:"#64748b", units:["engineering","rescue"] },
  crime_wave:             { emoji:"🔫", color:"#dc2626", units:["police","swat"] },
  flood:                  { emoji:"💧", color:"#3b82f6", units:["rescue","engineering","ambulance"] },
  accident:               { emoji:"🚨", color:"#f59e0b", units:["ambulance","police","fire"] },
};

const SEVERITY_CONFIG = {
  minor:        { color:"#4ade80", label:"Minor",        cost:100,  stability:-2,  gdp:-50 },
  moderate:     { color:"#fbbf24", label:"Moderate",     cost:300,  stability:-8,  gdp:-200 },
  major:        { color:"#f97316", label:"Major",        cost:800,  stability:-20, gdp:-600 },
  catastrophic: { color:"#ef4444", label:"Catastrophic", cost:2000, stability:-40, gdp:-2000 },
};

const UNIT_LABELS = {
  police:"🚔 Police", ambulance:"🚑 Ambulance", fire:"🚒 Fire Dept",
  national_guard:"🪖 Nat. Guard", engineering:"🔧 Engineering",
  rescue:"🛡️ Rescue", health_unit:"💊 Health Unit", swat:"⚡ SWAT"
};

export default function CrisisPanel({ nation, onClose, onRefresh }) {
  const [crises, setCrises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("active");

  useEffect(() => { loadCrises(); }, [nation?.id]);

  async function loadCrises() {
    const data = await base44.entities.CrisisEvent.filter({ nation_id: nation.id });
    setCrises(data);
  }

  const active = crises.filter(c => c.status === "active" || c.status === "responding");
  const resolved = crises.filter(c => c.status === "resolved" || c.status === "contained");

  async function dispatch(crisis, unit) {
    setLoading(true);
    const cost = SEVERITY_CONFIG[crisis.severity]?.cost || 300;
    if ((nation.currency||0) < cost) { alert(`Need ${cost} cr to dispatch ${UNIT_LABELS[unit]}.`); setLoading(false); return; }
    const existing = crisis.response_units || [];
    if (existing.includes(unit)) { setLoading(false); return; }
    const newUnits = [...existing, unit];
    const allRequired = CRISIS_CONFIG[crisis.crisis_type]?.units || [];
    const covered = allRequired.every(u => newUnits.includes(u));
    await Promise.all([
      base44.entities.CrisisEvent.update(crisis.id, {
        response_units: newUnits,
        status: covered ? "contained" : "responding",
      }),
      base44.entities.Nation.update(nation.id, {
        currency: Math.max(0, (nation.currency||0) - cost),
      }),
    ]);
    if (covered) {
      // Crisis contained — partial stat recovery
      await base44.entities.Nation.update(nation.id, {
        stability: Math.min(100, (nation.stability||75) + Math.abs(Math.floor(crisis.stability_impact / 2))),
      });
    }
    setLoading(false);
    loadCrises(); onRefresh?.();
  }

  async function resolve(crisis) {
    setLoading(true);
    await base44.entities.CrisisEvent.update(crisis.id, { status:"resolved", resolved_at: new Date().toISOString() });
    setLoading(false);
    loadCrises(); onRefresh?.();
  }

  async function generateCrisis() {
    const types = Object.keys(CRISIS_CONFIG);
    const sevs = ["minor","moderate","major"];
    const t = types[Math.floor(Math.random()*types.length)];
    const s = sevs[Math.floor(Math.random()*sevs.length)];
    const cfg = SEVERITY_CONFIG[s];
    const TITLES = {
      riot:"Civil unrest erupts", fire:"Major fire breaks out", earthquake:"Seismic event detected",
      epidemic:"Disease outbreak reported", power_outage:"Power grid failure",
      infrastructure_failure:"Bridge collapse warning", crime_wave:"Crime wave hitting city",
      flood:"Flash flooding in progress", accident:"Mass casualty accident"
    };
    setLoading(true);
    const crisis = await base44.entities.CrisisEvent.create({
      nation_id: nation.id, owner_email: nation.owner_email,
      crisis_type: t, severity: s,
      title: TITLES[t] || "Emergency", description: `A ${s} ${t.replace(/_/g,' ')} event is underway.`,
      status:"active", response_units:[],
      stability_impact: cfg.stability, gdp_impact: cfg.gdp, response_cost: cfg.cost,
    });
    // Apply immediate stability hit
    await base44.entities.Nation.update(nation.id, {
      stability: Math.min(100, Math.max(0, (nation.stability||75) + cfg.stability)),
      gdp: Math.max(100, (nation.gdp||500) + cfg.gdp),
    });
    await base44.entities.Notification.create({
      target_owner_email: nation.owner_email, target_nation_id: nation.id,
      type:"attack_received", title:`🚨 ${TITLES[t]}`,
      message:`A ${s} crisis event requires your immediate response! Open the Crisis Panel.`,
      severity:"danger", is_read:false,
    }).catch(()=>{});
    setLoading(false);
    loadCrises(); onRefresh?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)" }}>
      <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background:"linear-gradient(135deg,#150505 0%,#040810 100%)", border:"1px solid rgba(239,68,68,0.25)", maxHeight:"90vh" }}>

        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor:"rgba(239,68,68,0.15)", background:"linear-gradient(90deg,rgba(239,68,68,0.08),transparent)" }}>
          <AlertTriangle size={18} className="text-red-400"/>
          <span className="font-bold text-white text-lg">Emergency Crisis Management</span>
          {active.length > 0 && (
            <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ repeat:Infinity, duration:1.2 }}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-red-400 bg-red-400/15 border border-red-400/30">
              {active.length} ACTIVE
            </motion.div>
          )}
          <div className="ml-auto flex gap-2 items-center">
            <button onClick={generateCrisis} disabled={loading}
              className="px-3 py-1 rounded-lg text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-all disabled:opacity-40">
              Simulate Crisis
            </button>
            <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-white"/></button>
          </div>
        </div>

        <div className="flex border-b" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
          {[["active",`🚨 Active (${active.length})`],["resolved","✅ Resolved"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-5 py-2.5 text-xs font-bold transition-all ${tab===id?"text-red-400 border-b-2 border-red-400":"text-slate-500 hover:text-slate-300"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === "active" && (
            <>
              {active.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  <div className="text-2xl mb-2">🟢</div>
                  No active crises. Your nation is stable.
                </div>
              )}
              {active.map(crisis => {
                const cfg = CRISIS_CONFIG[crisis.crisis_type] || CRISIS_CONFIG.riot;
                const sev = SEVERITY_CONFIG[crisis.severity] || SEVERITY_CONFIG.moderate;
                const units = cfg.units || [];
                const dispatched = crisis.response_units || [];
                const allCovered = units.every(u => dispatched.includes(u));
                return (
                  <motion.div key={crisis.id} layout
                    className="rounded-xl p-4 space-y-3"
                    style={{ background:`${cfg.color}08`, border:`1px solid ${cfg.color}30` }}>
                    <div className="flex items-start gap-3">
                      <motion.span className="text-2xl" animate={{ scale:[1,1.1,1] }} transition={{ repeat:Infinity, duration:1.5 }}>
                        {cfg.emoji}
                      </motion.span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{crisis.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color:sev.color, background:`${sev.color}15` }}>{sev.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${allCovered?"text-amber-400 bg-amber-400/10":"text-red-400 bg-red-400/10"}`}>
                            {allCovered ? "⏳ Contained" : "🚨 Active"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{crisis.description}</div>
                        <div className="flex gap-3 text-[10px] mt-1">
                          <span className="text-red-400">Stability: {sev.stability}</span>
                          <span className="text-red-400">GDP: {sev.gdp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Required Response Units</div>
                      <div className="flex flex-wrap gap-2">
                        {units.map(unit => {
                          const sent = dispatched.includes(unit);
                          return (
                            <button key={unit} onClick={()=>!sent && dispatch(crisis, unit)} disabled={sent || loading}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                              style={{
                                background: sent ? "rgba(74,222,128,0.12)" : `${cfg.color}15`,
                                border: `1px solid ${sent ? "rgba(74,222,128,0.3)" : cfg.color+"35"}`,
                                color: sent ? "#4ade80" : "#fff",
                                opacity: loading ? 0.5 : 1,
                              }}>
                              {sent ? "✅ " : ""}{UNIT_LABELS[unit]||unit}
                              {!sent && <span className="ml-1 text-slate-500">{sev.cost} cr</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {allCovered && (
                      <button onClick={()=>resolve(crisis)} disabled={loading}
                        className="w-full py-2 rounded-xl text-xs font-bold text-black bg-green-400 hover:bg-green-300 transition-all">
                        ✅ Declare Crisis Resolved
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}

          {tab === "resolved" && (
            resolved.length === 0
              ? <div className="text-center text-slate-500 py-8">No resolved crises yet.</div>
              : resolved.map(crisis => {
                const cfg = CRISIS_CONFIG[crisis.crisis_type] || CRISIS_CONFIG.riot;
                const sev = SEVERITY_CONFIG[crisis.severity] || SEVERITY_CONFIG.moderate;
                return (
                  <div key={crisis.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background:"rgba(74,222,128,0.04)", border:"1px solid rgba(74,222,128,0.15)" }}>
                    <span className="text-xl">{cfg.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{crisis.title}</div>
                      <div className="text-[10px] text-slate-500">{sev.label} · {new Date(crisis.resolved_at||crisis.updated_date).toLocaleDateString()}</div>
                    </div>
                    <span className="text-green-400 font-bold text-xs">Resolved ✅</span>
                  </div>
                );
              })
          )}
        </div>
      </motion.div>
    </div>
  );
}