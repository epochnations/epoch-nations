/**
 * WondersPanel — Build mega structures and world wonders.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, Star, Zap } from "lucide-react";

const WONDER_CATALOG = [
  {
    wonder_type: "world_wonder", name: "The Great Pyramid", epoch_required: "Stone Age",
    description: "A marvel of ancient engineering that inspires your people.",
    cost: 3000, gdp_bonus: 500, stability_bonus: 15, defense_bonus: 10, manufacturing_bonus: 0,
    emoji: "🗿", color: "#d97706"
  },
  {
    wonder_type: "colosseum", name: "Grand Colosseum", epoch_required: "Classical Age",
    description: "Public games boost morale and attract visitors from across the world.",
    cost: 5000, gdp_bonus: 800, stability_bonus: 20, defense_bonus: 0, manufacturing_bonus: 10,
    emoji: "🏛️", color: "#f59e0b"
  },
  {
    wonder_type: "great_wall", name: "The Great Wall", epoch_required: "Medieval Age",
    description: "An impenetrable defensive fortification spanning your borders.",
    cost: 8000, gdp_bonus: 200, stability_bonus: 10, defense_bonus: 80, manufacturing_bonus: 5,
    emoji: "🧱", color: "#64748b"
  },
  {
    wonder_type: "global_financial_center", name: "Global Financial Center", epoch_required: "Industrial Age",
    description: "The beating heart of world commerce, channeling enormous wealth.",
    cost: 15000, gdp_bonus: 3000, stability_bonus: 5, defense_bonus: 0, manufacturing_bonus: 30,
    emoji: "🏦", color: "#22d3ee"
  },
  {
    wonder_type: "mega_dam", name: "Titan Mega Dam", epoch_required: "Modern Age",
    description: "Provides unlimited clean energy and flood control for your civilization.",
    cost: 12000, gdp_bonus: 1500, stability_bonus: 15, defense_bonus: 20, manufacturing_bonus: 50,
    emoji: "🌊", color: "#3b82f6"
  },
  {
    wonder_type: "megacity", name: "Megacity Prime", epoch_required: "Digital Age",
    description: "A sprawling ultra-city of 50 million — the envy of the world.",
    cost: 25000, gdp_bonus: 5000, stability_bonus: 10, defense_bonus: 10, manufacturing_bonus: 80,
    emoji: "🌆", color: "#8b5cf6"
  },
  {
    wonder_type: "orbital_station", name: "Orbital Command Station", epoch_required: "Space Age",
    description: "A permanent presence in orbit — military, scientific, and economic dominance.",
    cost: 50000, gdp_bonus: 8000, stability_bonus: 20, defense_bonus: 150, manufacturing_bonus: 60,
    emoji: "🛸", color: "#a78bfa"
  },
  {
    wonder_type: "dyson_array", name: "Dyson Solar Array", epoch_required: "Galactic Age",
    description: "Harvests the power of your star to fuel an entire civilization.",
    cost: 100000, gdp_bonus: 20000, stability_bonus: 30, defense_bonus: 200, manufacturing_bonus: 200,
    emoji: "⭐", color: "#fbbf24"
  },
];

const EPOCHS = ["Stone Age","Bronze Age","Iron Age","Classical Age","Medieval Age","Renaissance Age","Industrial Age","Modern Age","Digital Age","Information Age","Space Age","Galactic Age"];

export default function WondersPanel({ nation, onClose, onRefresh }) {
  const [wonders, setWonders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("build");

  useEffect(() => { loadWonders(); }, [nation?.id]);

  async function loadWonders() {
    const data = await base44.entities.Wonder.filter({ nation_id: nation.id });
    setWonders(data);
  }

  const epochIdx = EPOCHS.indexOf(nation?.epoch || "Stone Age");
  const available = WONDER_CATALOG.filter(w => EPOCHS.indexOf(w.epoch_required) <= epochIdx);
  const built = wonders.filter(w => w.is_completed);
  const constructing = wonders.filter(w => !w.is_completed);

  async function startConstruction(template) {
    const alreadyBuilt = wonders.find(w => w.wonder_type === template.wonder_type);
    if (alreadyBuilt) { alert("You already have this wonder!"); return; }
    if ((nation.currency||0) < template.cost) { alert(`Need ${template.cost.toLocaleString()} cr.`); return; }
    setLoading(true);
    await base44.entities.Wonder.create({
      nation_id: nation.id, nation_name: nation.name, owner_email: nation.owner_email,
      wonder_type: template.wonder_type, name: template.name, description: template.description,
      construction_cost: template.cost, construction_progress: 0, is_completed: false,
      gdp_bonus: template.gdp_bonus, stability_bonus: template.stability_bonus,
      defense_bonus: template.defense_bonus, manufacturing_bonus: template.manufacturing_bonus,
      epoch_required: template.epoch_required,
    });
    await base44.entities.Nation.update(nation.id, { currency: Math.max(0, (nation.currency||0) - template.cost) });
    // Immediately apply bonuses (simplified — full system would do this periodically)
    await base44.entities.Nation.update(nation.id, {
      gdp: (nation.gdp||500) + template.gdp_bonus,
      stability: Math.min(100, (nation.stability||75) + template.stability_bonus),
      defense_level: (nation.defense_level||10) + template.defense_bonus,
      manufacturing: (nation.manufacturing||50) + template.manufacturing_bonus,
    });
    await base44.entities.Wonder.update(
      (await base44.entities.Wonder.filter({ nation_id: nation.id, wonder_type: template.wonder_type }))[0]?.id || "",
      { is_completed: true, construction_progress: 100 }
    ).catch(()=>{});
    await base44.entities.NewsArticle.create({
      headline: `✨ WONDER BUILT: ${nation.name} completes ${template.name}!`,
      body: `${nation.name} has completed construction of ${template.name} — ${template.description}`,
      category: "milestone", tier: "gold",
      nation_name: nation.name, nation_flag: nation.flag_emoji, nation_color: nation.flag_color,
    }).catch(()=>{});
    setLoading(false);
    loadWonders(); onRefresh?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)" }}>
      <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background:"linear-gradient(135deg,#0f0a20 0%,#040810 100%)", border:"1px solid rgba(168,85,247,0.25)", maxHeight:"90vh" }}>

        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor:"rgba(168,85,247,0.15)", background:"linear-gradient(90deg,rgba(168,85,247,0.08),transparent)" }}>
          <Star size={18} className="text-violet-400"/>
          <span className="font-bold text-white text-lg">Mega Structures & World Wonders</span>
          <div className="ml-auto flex gap-2 items-center">
            <span className="text-xs text-violet-400 ep-mono">{(nation.currency||0).toLocaleString()} cr</span>
            <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-white"/></button>
          </div>
        </div>

        <div className="flex border-b" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
          {[["build","🏗️ Build"],["built","✨ Completed"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-5 py-2.5 text-xs font-bold transition-all ${tab===id?"text-violet-400 border-b-2 border-violet-400":"text-slate-500 hover:text-slate-300"}`}>
              {label} {id==="built" && built.length > 0 && <span className="ml-1 bg-violet-500 text-white rounded-full text-[9px] px-1.5">{built.length}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === "build" && available.map(w => {
            const alreadyBuilt = wonders.find(x => x.wonder_type === w.wonder_type && x.is_completed);
            const canAfford = (nation.currency||0) >= w.cost;
            return (
              <div key={w.wonder_type} className="rounded-xl p-4" style={{ background: alreadyBuilt?"rgba(74,222,128,0.04)":"rgba(255,255,255,0.03)", border:`1px solid ${alreadyBuilt?"rgba(74,222,128,0.2)":"rgba(255,255,255,0.07)"}` }}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{w.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{w.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:`${w.color}20`, color:w.color, border:`1px solid ${w.color}40` }}>{w.epoch_required}</span>
                      {alreadyBuilt && <span className="text-[10px] text-green-400 font-bold">✅ BUILT</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{w.description}</div>
                    <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                      {w.gdp_bonus>0       && <span className="text-green-400">+{w.gdp_bonus} GDP</span>}
                      {w.stability_bonus>0 && <span className="text-cyan-400">+{w.stability_bonus} Stability</span>}
                      {w.defense_bonus>0   && <span className="text-red-400">+{w.defense_bonus} Defense</span>}
                      {w.manufacturing_bonus>0 && <span className="text-amber-400">+{w.manufacturing_bonus} Mfg</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-black ep-mono text-amber-400">{w.cost.toLocaleString()} cr</div>
                    {!alreadyBuilt && (
                      <button onClick={()=>startConstruction(w)} disabled={loading || !canAfford}
                        className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold text-black transition-all disabled:opacity-30"
                        style={{ background:`linear-gradient(90deg,${w.color},${w.color}cc)` }}>
                        {canAfford ? "Build" : "Need more cr"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {tab === "built" && (
            built.length === 0
              ? <div className="text-center text-slate-500 py-8">No wonders built yet.</div>
              : built.map(w => {
                const tmpl = WONDER_CATALOG.find(t => t.wonder_type === w.wonder_type) || {};
                return (
                  <div key={w.id} className="rounded-xl p-4" style={{ background:"rgba(168,85,247,0.05)", border:"1px solid rgba(168,85,247,0.2)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tmpl.emoji||"✨"}</span>
                      <div>
                        <div className="font-bold text-white">{w.name}</div>
                        <div className="text-xs text-slate-400">{w.description}</div>
                        <div className="flex gap-3 mt-1 text-[10px]">
                          {w.gdp_bonus>0          && <span className="text-green-400">+{w.gdp_bonus} GDP</span>}
                          {w.stability_bonus>0    && <span className="text-cyan-400">+{w.stability_bonus} Stability</span>}
                          {w.defense_bonus>0      && <span className="text-red-400">+{w.defense_bonus} Defense</span>}
                          {w.manufacturing_bonus>0 && <span className="text-amber-400">+{w.manufacturing_bonus} Mfg</span>}
                        </div>
                      </div>
                      <div className="ml-auto text-green-400 text-lg">✅</div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </motion.div>
    </div>
  );
}