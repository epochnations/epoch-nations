/**
 * ExplorationPanel — Terraria-style discovery system.
 * Manage exploration missions, send heroes, uncover ruins/artifacts/resources.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Map, Search, Zap, Star, Compass } from "lucide-react";

const SITE_CONFIG = {
  ancient_ruins:  { emoji: "🏛️", color: "#d97706", label: "Ancient Ruins",   reward: "Tech Points + Artifacts" },
  lost_city:      { emoji: "🏙️", color: "#8b5cf6", label: "Lost City",        reward: "GDP + Population" },
  rare_resource:  { emoji: "💎", color: "#06b6d4", label: "Rare Resource",    reward: "Resources + Currency" },
  artifact:       { emoji: "⚗️", color: "#ec4899", label: "Artifact",         reward: "Tech + Stability Boost" },
  wonder_site:    { emoji: "🗿", color: "#f59e0b", label: "Wonder Site",      reward: "Massive GDP Bonus" },
  buried_vault:   { emoji: "🏴‍☠️", color: "#10b981", label: "Buried Vault",    reward: "Massive Currency" },
};

const DIFF_CONFIG = {
  easy:      { color: "#4ade80", ticks: 2,  cost: 200  },
  medium:    { color: "#fbbf24", ticks: 5,  cost: 500  },
  hard:      { color: "#f97316", ticks: 10, cost: 1200 },
  legendary: { color: "#a78bfa", ticks: 20, cost: 3000 },
};

const HERO_EMOJIS = {
  explorer: "🧭", general: "⚔️", governor: "🏛️",
  spy: "🕵️", scientist: "🔬", merchant: "💼"
};

// Procedurally generate exploration sites for a nation
function generateSites(nationId, seed) {
  const types = Object.keys(SITE_CONFIG);
  const diffs = ["easy","easy","medium","medium","hard","legendary"];
  const sites = [];
  const NAMES = [
    "Valley of Echoes","Temple of the Ancients","Forgotten Citadel","Iron Vaults of Old",
    "Sunken Archives","The Lost Quarter","Oracle's Rest","Chamber of Relics",
    "Golden Wastes","Storm Shrine","Nameless Deep","The Shattered Keep",
    "Ruins of Aldor","Crystalline Catacombs","Ember Tombs","Ghostwind Pass",
  ];
  for (let i = 0; i < 8; i++) {
    const s = (seed * 7 + i * 13 + 37) % 1000;
    sites.push({
      _tempId: `${nationId}_site_${i}`,
      site_type: types[(s * 3 + i) % types.length],
      site_name: NAMES[(s + i * 3) % NAMES.length],
      x: 100 + ((s * 17 + i * 99) % 1400),
      y: 60  + ((s * 11 + i * 73) % 780),
      difficulty: diffs[(s + i) % diffs.length],
      reward_amount: 500 + s * 3,
    });
  }
  return sites;
}

export default function ExplorationPanel({ nation, onClose, onRefresh }) {
  const [explorations, setExplorations] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [generatedSites, setGeneratedSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedHero, setSelectedHero] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("discover"); // discover | active | heroes

  useEffect(() => {
    if (!nation) return;
    loadData();
  }, [nation?.id]);

  async function loadData() {
    const [exps, heros] = await Promise.all([
      base44.entities.Exploration.filter({ nation_id: nation.id }),
      base44.entities.Hero.filter({ nation_id: nation.id }),
    ]);
    setExplorations(exps);
    setHeroes(heros);
    // Generate sites not yet discovered
    const seed = parseInt(nation.id.replace(/\D/g,'').slice(0,6) || "42");
    const all = generateSites(nation.id, seed);
    setGeneratedSites(all.filter(s => !exps.find(e => e.site_name === s.site_name)));
  }

  async function startExcavation(site) {
    if (!selectedHero) return;
    const cost = DIFF_CONFIG[site.difficulty].cost;
    if ((nation.currency || 0) < cost) {
      alert(`Need ${cost} cr to send expedition.`);
      return;
    }
    setLoading(true);
    await base44.entities.Exploration.create({
      nation_id: nation.id,
      nation_name: nation.name,
      owner_email: nation.owner_email,
      site_type: site.site_type,
      site_name: site.site_name,
      x: site.x, y: site.y,
      status: "excavating",
      difficulty: site.difficulty,
      excavation_progress: 0,
      excavation_cost: cost,
      reward_amount: site.reward_amount,
      reward_type: "currency",
      reward_desc: SITE_CONFIG[site.site_type].reward,
    });
    await base44.entities.Nation.update(nation.id, { currency: Math.max(0, (nation.currency||0) - cost) });
    await base44.entities.Hero.update(selectedHero.id, { status: "on_mission" });
    setLoading(false);
    setSelectedSite(null);
    setSelectedHero(null);
    loadData();
    onRefresh?.();
  }

  async function claimReward(exp) {
    if (exp.status !== "completed") return;
    setLoading(true);
    const rewards = {};
    if (exp.site_type === "rare_resource") {
      rewards.res_gold = (nation.res_gold||0) + Math.floor(exp.reward_amount / 10);
      rewards.currency = (nation.currency||0) + exp.reward_amount;
    } else if (exp.site_type === "lost_city") {
      rewards.gdp = (nation.gdp||500) + Math.floor(exp.reward_amount / 5);
      rewards.population = (nation.population||10) + 3;
    } else if (exp.site_type === "artifact") {
      rewards.tech_points = (nation.tech_points||0) + Math.floor(exp.reward_amount / 8);
      rewards.stability = Math.min(100, (nation.stability||75) + 5);
    } else {
      rewards.currency = (nation.currency||0) + exp.reward_amount;
      rewards.tech_points = (nation.tech_points||0) + Math.floor(exp.reward_amount / 20);
    }
    await Promise.all([
      base44.entities.Nation.update(nation.id, rewards),
      base44.entities.Exploration.update(exp.id, { status: "completed" }),
    ]);
    await base44.entities.NewsArticle.create({
      headline: `🗺️ Discovery: ${nation.name} uncovers ${exp.site_name}!`,
      body: `Explorers from ${nation.name} have uncovered ${exp.site_name} — a ${exp.site_type.replace(/_/g,' ')}. Rewards: ${exp.reward_desc}`,
      category: "milestone", tier: "gold",
      nation_name: nation.name, nation_flag: nation.flag_emoji, nation_color: nation.flag_color,
    }).catch(()=>{});
    setLoading(false);
    loadData();
    onRefresh?.();
  }

  async function createHero() {
    const NAMES = ["Aric","Erana","Vos","Lyra","Drenn","Sael","Tova","Oryn","Kael","Mira"];
    const types = ["explorer","general","governor","scientist","spy","merchant"];
    const t = types[Math.floor(Math.random() * types.length)];
    const cost = 300;
    if ((nation.currency||0) < cost) { alert("Need 300 cr to recruit a hero."); return; }
    setLoading(true);
    await base44.entities.Hero.create({
      nation_id: nation.id, nation_name: nation.name, owner_email: nation.owner_email,
      name: NAMES[Math.floor(Math.random()*NAMES.length)] + " the " + t.charAt(0).toUpperCase()+t.slice(1),
      hero_type: t, level: 1, experience: 0, status: "idle",
      portrait_emoji: HERO_EMOJIS[t], bonuses: {}, skills: [],
    });
    await base44.entities.Nation.update(nation.id, { currency: Math.max(0,(nation.currency||0)-cost) });
    setLoading(false);
    loadData(); onRefresh?.();
  }

  const activeExps = explorations.filter(e => e.status === "excavating");
  const completedExps = explorations.filter(e => e.status === "completed");
  const availableHeroes = heroes.filter(h => h.status === "idle");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)" }}>
      <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background:"linear-gradient(135deg,#0a1520 0%,#040810 100%)", border:"1px solid rgba(251,191,36,0.2)", maxHeight:"90vh" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor:"rgba(251,191,36,0.15)", background:"linear-gradient(90deg,rgba(251,191,36,0.08),transparent)" }}>
          <Compass size={18} className="text-amber-400"/>
          <span className="font-bold text-white text-lg">Exploration & Discovery</span>
          <div className="ml-auto flex gap-2 items-center">
            <span className="text-xs text-amber-400 ep-mono">{nation.currency?.toLocaleString()} cr</span>
            <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-white"/></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
          {[["discover","🗺️ Discover"],["active","⛏️ Active"],["heroes","🧙 Heroes"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-5 py-2.5 text-xs font-bold transition-all ${tab===id?"text-amber-400 border-b-2 border-amber-400":"text-slate-500 hover:text-slate-300"}`}>
              {label}
              {id==="active" && (activeExps.length+completedExps.length)>0 && (
                <span className="ml-1.5 bg-amber-500 text-black rounded-full text-[9px] px-1.5 py-0.5">{activeExps.length+completedExps.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {/* ── DISCOVER TAB ── */}
          {tab === "discover" && (
            <div className="space-y-3">
              {availableHeroes.length === 0 && (
                <div className="text-xs text-amber-400 p-3 rounded-xl text-center" style={{ background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.15)" }}>
                  ⚠️ You need an idle Hero to send on expeditions. Go to the Heroes tab to recruit one.
                </div>
              )}
              {/* Hero selector */}
              {availableHeroes.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Select Hero to Send</div>
                  <div className="flex gap-2 flex-wrap">
                    {availableHeroes.map(h => (
                      <button key={h.id} onClick={()=>setSelectedHero(selectedHero?.id===h.id ? null : h)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${selectedHero?.id===h.id?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/30"}`}>
                        {h.portrait_emoji} {h.name} <span className="text-slate-500">Lv{h.level}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {generatedSites.map((site, i) => {
                  const cfg = SITE_CONFIG[site.site_type];
                  const diff = DIFF_CONFIG[site.difficulty];
                  return (
                    <motion.div key={i} whileHover={{ scale:1.01 }}
                      onClick={()=>setSelectedSite(selectedSite?._tempId===site._tempId ? null : site)}
                      className="rounded-xl p-3 cursor-pointer transition-all"
                      style={{
                        background: selectedSite?._tempId===site._tempId ? `${cfg.color}15` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedSite?._tempId===site._tempId ? cfg.color+"50" : "rgba(255,255,255,0.07)"}`,
                      }}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">{site.site_name}</div>
                          <div className="text-[10px] text-slate-500">{cfg.label}</div>
                          <div className="text-[10px] mt-1" style={{ color: cfg.color }}>{cfg.reward}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold" style={{ color: diff.color }}>{site.difficulty.toUpperCase()}</div>
                          <div className="text-[10px] text-amber-400 ep-mono">{diff.cost} cr</div>
                          <div className="text-[10px] text-slate-500">{diff.ticks} min</div>
                        </div>
                      </div>
                      {selectedSite?._tempId===site._tempId && selectedHero && (
                        <motion.button initial={{opacity:0}} animate={{opacity:1}}
                          onClick={(e)=>{ e.stopPropagation(); startExcavation(site); }}
                          disabled={loading}
                          className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold text-black transition-all"
                          style={{ background:`linear-gradient(90deg,${cfg.color},${cfg.color}cc)` }}>
                          {loading ? "Sending..." : `⛏️ Send ${selectedHero.portrait_emoji} ${selectedHero.name.split(" ")[0]}`}
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {generatedSites.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">🌍 All sites explored! Check back as new ones appear.</div>
              )}
            </div>
          )}

          {/* ── ACTIVE TAB ── */}
          {tab === "active" && (
            <div className="space-y-3">
              {[...activeExps, ...completedExps].length === 0 && (
                <div className="text-center text-slate-500 py-8">No active expeditions. Start exploring!</div>
              )}
              {[...activeExps, ...completedExps].map(exp => {
                const cfg = SITE_CONFIG[exp.site_type] || SITE_CONFIG.ancient_ruins;
                const isComplete = exp.status === "completed";
                const elapsed = (Date.now() - new Date(exp.created_date).getTime()) / 60000;
                const total = DIFF_CONFIG[exp.difficulty]?.ticks || 5;
                const pct = Math.min(100, Math.round((elapsed / total) * 100));
                const autoComplete = pct >= 100 && exp.status === "excavating";
                return (
                  <div key={exp.id} className="rounded-xl p-4" style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${isComplete||autoComplete ? cfg.color+"50" : "rgba(255,255,255,0.08)"}` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cfg.emoji}</span>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{exp.site_name}</div>
                        <div className="text-xs text-slate-500">{cfg.label} · {exp.difficulty}</div>
                        {!isComplete && !autoComplete && (
                          <div className="mt-1.5">
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.07)" }}>
                              <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${cfg.color}88,${cfg.color})` }}/>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{pct}% complete · ~{Math.max(0,total-Math.floor(elapsed))} min remaining</div>
                          </div>
                        )}
                        {(isComplete || autoComplete) && (
                          <div className="text-xs text-green-400 font-bold mt-1">✅ {exp.reward_desc}</div>
                        )}
                      </div>
                      {(isComplete || autoComplete) && (
                        <button onClick={()=>claimReward({...exp, status:"completed"})} disabled={loading}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-black transition-all"
                          style={{ background:`linear-gradient(90deg,${cfg.color},${cfg.color}cc)` }}>
                          Claim!
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── HEROES TAB ── */}
          {tab === "heroes" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Your Heroes ({heroes.length})</span>
                <button onClick={createHero} disabled={loading}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-all disabled:opacity-40">
                  + Recruit Hero (300 cr)
                </button>
              </div>
              {heroes.length === 0 && (
                <div className="text-center text-slate-500 py-8">No heroes yet. Recruit one to begin exploring!</div>
              )}
              {heroes.map(hero => (
                <div key={hero.id} className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div className="text-3xl">{hero.portrait_emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{hero.name}</div>
                    <div className="text-xs text-slate-500 capitalize">{hero.hero_type} · Level {hero.level}</div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    hero.status==="idle" ? "text-green-400 bg-green-400/10" :
                    hero.status==="on_mission" ? "text-amber-400 bg-amber-400/10" :
                    "text-red-400 bg-red-400/10"
                  }`}>{hero.status.replace("_"," ")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}