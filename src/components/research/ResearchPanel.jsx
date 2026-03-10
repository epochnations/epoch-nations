import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Zap, Lock, CheckCircle, Clock, ChevronRight, Trophy } from "lucide-react";
import { RESEARCH_TREE, RESEARCH_BRANCHES, RESEARCH_MAP, calcResearchSpeed } from "../game/ResearchConfig";
import { EPOCHS } from "../game/EpochConfig";

function LayerBadge({ layer, req }) {
  const isUni = req === "university";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${isUni
      ? "text-violet-300 border-violet-500/40 bg-violet-500/10"
      : "text-blue-300 border-blue-500/40 bg-blue-500/10"}`}>
      L{layer} {isUni ? "🎓 Uni" : "🏫 School"}
    </span>
  );
}

function TechCard({ tech, status, progress, nationEpoch, hasBuilding, prereqsMet, onStart, loading }) {
  const epochIndex = EPOCHS.indexOf(nationEpoch);
  const reqEpochIndex = EPOCHS.indexOf(tech.epoch_req);
  const hasEpoch = epochIndex >= reqEpochIndex;

  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  const isLocked = !hasEpoch || !hasBuilding || !prereqsMet;
  const canStart = !isCompleted && !isInProgress && !isLocked;

  let borderClass = "border-white/8 bg-white/3";
  if (isCompleted) borderClass = "border-green-400/30 bg-green-400/5";
  else if (isInProgress) borderClass = "border-cyan-400/30 bg-cyan-400/8";
  else if (!isLocked) borderClass = "border-white/12 bg-white/5 hover:border-violet-400/30 hover:bg-violet-400/5";

  return (
    <div className={`rounded-xl border p-3 transition-all ${borderClass}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{tech.emoji}</span>
          <span className={`font-bold text-sm ${isCompleted ? "text-green-400" : isInProgress ? "text-cyan-300" : isLocked ? "text-slate-500" : "text-white"}`}>
            {tech.name}
          </span>
          {tech.is_global_breakthrough && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-amber-400/40 bg-amber-400/10 text-amber-300 flex items-center gap-0.5">
              <Trophy size={8} /> BREAKTHROUGH
            </span>
          )}
        </div>
        <LayerBadge layer={tech.layer} req={tech.building_req} />
      </div>

      <p className="text-[11px] text-slate-400 mb-2">{tech.desc}</p>

      {/* Lock reasons */}
      {!hasEpoch && (
        <div className="text-[10px] text-red-400/70 flex items-center gap-1 mb-1">
          <Lock size={9} /> Requires {tech.epoch_req}
        </div>
      )}
      {hasEpoch && !hasBuilding && (
        <div className="text-[10px] text-amber-400/70 flex items-center gap-1 mb-1">
          <Lock size={9} /> Requires {tech.building_req === "university" ? "University" : "School"}
        </div>
      )}
      {hasEpoch && hasBuilding && !prereqsMet && (
        <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
          <Lock size={9} /> Complete prerequisites first
        </div>
      )}

      {/* Progress bar */}
      {isInProgress && (
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-cyan-400 mb-1">
            <span className="flex items-center gap-1"><Clock size={9} /> Researching...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-[10px] text-slate-500">
          {isCompleted ? "" : `${tech.base_points} research pts`}
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
            <CheckCircle size={10} /> Complete
          </span>
        )}
        {canStart && (
          <button
            onClick={() => onStart(tech)}
            disabled={!!loading}
            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30 transition-all disabled:opacity-40"
          >
            {loading === tech.id ? "Starting..." : "Research"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ResearchPanel({ nation, onClose }) {
  const [activeBranch, setActiveBranch] = useState("agriculture");
  const [allResearch, setAllResearch] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("tree"); // tree | breakthroughs

  useEffect(() => {
    if (!nation?.id) return;
    Promise.all([
      base44.entities.Research.filter({ nation_id: nation.id }),
      base44.entities.Building.filter({ nation_id: nation.id })
    ]).then(([r, b]) => { setAllResearch(r); setBuildings(b); });
  }, [nation?.id]);

  if (!nation) return null;

  const researchSpeed = calcResearchSpeed(nation, buildings);
  const schoolCount = buildings.filter(b => b.building_type === "school" && !b.is_destroyed).length;
  const uniCount = buildings.filter(b => b.building_type === "university" && !b.is_destroyed).length;
  const inProgress = allResearch.filter(r => r.status === "in_progress");
  const completed = allResearch.filter(r => r.status === "completed").map(r => r.tech_id);

  function getStatus(techId) {
    const r = allResearch.find(r => r.tech_id === techId);
    return r ? r.status : null;
  }
  function getProgress(techId) {
    const r = allResearch.find(r => r.tech_id === techId);
    return r ? r.progress : 0;
  }
  function hasBuilding(req) {
    if (req === "school") return schoolCount > 0;
    if (req === "university") return uniCount > 0;
    return true;
  }
  function prereqsMet(tech) {
    return (tech.requires || []).every(id => completed.includes(id));
  }

  async function startResearch(tech) {
    if (inProgress.length >= 2) {
      alert("You can research up to 2 technologies simultaneously.");
      return;
    }
    setLoading(tech.id);

    // Check if global breakthrough already discovered
    let diffusionPenalty = 0;
    if (tech.is_global_breakthrough) {
      const existing = await base44.entities.Research.filter({ tech_id: tech.id, status: "completed" });
      if (existing.length > 0) {
        diffusionPenalty = 0.5; // 50% slower
      }
    }

    await base44.entities.Research.create({
      nation_id: nation.id,
      nation_name: nation.name,
      owner_email: nation.owner_email,
      tech_id: tech.id,
      tech_name: tech.name,
      tech_layer: tech.layer,
      tree_branch: activeBranch,
      status: "in_progress",
      progress: 0,
      required_points: Math.round(tech.base_points * (1 + diffusionPenalty)),
      points_invested: 0,
      is_global_breakthrough: !!tech.is_global_breakthrough,
      diffusion_penalty: diffusionPenalty
    });

    // Reload
    const updated = await base44.entities.Research.filter({ nation_id: nation.id });
    setAllResearch(updated);
    setLoading(null);
  }

  const branchTechs = RESEARCH_TREE[activeBranch] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden border border-white/15"
        style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0f172a 100%)" }}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-violet-400" />
            <span className="font-bold text-white">Research Lab</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              🏫 <span className="text-blue-300 font-bold">{schoolCount}</span> schools
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              🎓 <span className="text-violet-300 font-bold">{uniCount}</span> universities
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Zap size={11} className="text-cyan-400" />
              <span className="text-cyan-300 font-bold">{researchSpeed} pts/tick</span>
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-white/8 shrink-0 overflow-x-auto">
          {["tree", "breakthroughs", "active"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab
                ? "bg-violet-500/20 border border-violet-500/40 text-violet-300"
                : "text-slate-500 hover:text-slate-300"}`}>
              {tab === "tree" ? "🌿 Tech Tree" : tab === "breakthroughs" ? "🏆 Breakthroughs" : `⚗️ Active (${inProgress.length})`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {activeTab === "tree" && (
            <>
              {/* Branch selector */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {Object.entries(RESEARCH_BRANCHES).map(([key, b]) => (
                  <button key={key} onClick={() => setActiveBranch(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${activeBranch === key
                      ? "text-white border-white/30 bg-white/10"
                      : "text-slate-400 border-white/8 hover:border-white/20 hover:text-slate-200"}`}
                    style={activeBranch === key ? { borderColor: b.color + "55", color: b.color } : {}}>
                    {b.emoji} {b.name}
                  </button>
                ))}
              </div>

              {/* Layer groups */}
              {[1, 2, 3, 4, 5].map(layer => {
                const layerTechs = branchTechs.filter(t => t.layer === layer);
                if (!layerTechs.length) return null;
                const isAdv = layer >= 3;
                return (
                  <div key={layer} className="mb-5">
                    <div className={`flex items-center gap-2 mb-2 text-xs font-bold ${isAdv ? "text-violet-400" : "text-blue-400"}`}>
                      <div className={`h-px flex-1 ${isAdv ? "bg-violet-400/20" : "bg-blue-400/20"}`} />
                      <span>{isAdv ? "🎓" : "🏫"} Layer {layer} — {isAdv ? "University Required" : "School Required"}</span>
                      <div className={`h-px flex-1 ${isAdv ? "bg-violet-400/20" : "bg-blue-400/20"}`} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {layerTechs.map(tech => (
                        <TechCard key={tech.id} tech={tech}
                          status={getStatus(tech.id)}
                          progress={getProgress(tech.id)}
                          nationEpoch={nation.epoch}
                          hasBuilding={hasBuilding(tech.building_req)}
                          prereqsMet={prereqsMet(tech)}
                          onStart={startResearch}
                          loading={loading} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {activeTab === "breakthroughs" && (
            <BreakthroughsTab completed={completed} />
          )}

          {activeTab === "active" && (
            <ActiveResearchTab
              inProgress={inProgress}
              researchSpeed={researchSpeed}
              nation={nation}
              onRefresh={async () => {
                const updated = await base44.entities.Research.filter({ nation_id: nation.id });
                setAllResearch(updated);
              }}
            />
          )}
        </div>

        {/* Footer tip */}
        <div className="px-5 py-3 border-t border-white/8 shrink-0">
          <p className="text-[11px] text-slate-500">
            💡 Research speed scales with Schools, Universities, Education Spending, and GDP. Universities unlock Layers 3–5.
            {inProgress.length >= 2 && <span className="text-amber-400 font-bold ml-1"> Max 2 concurrent research projects.</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function BreakthroughsTab({ completed }) {
  const [allDiscovered, setAllDiscovered] = useState([]);

  useEffect(() => {
    base44.entities.Research.filter({ is_global_breakthrough: true, status: "completed" })
      .then(setAllDiscovered);
  }, []);

  const breakthroughs = Object.values(RESEARCH_MAP).filter(t => t.is_global_breakthrough);

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400 mb-4">
        Global breakthroughs grant massive bonuses to the <span className="text-amber-300 font-bold">first nation</span> that discovers them.
        Later nations can still research them but at 50% slower speed.
      </div>
      {breakthroughs.map(tech => {
        const discoveries = allDiscovered.filter(r => r.tech_id === tech.id);
        const firstDiscover = discoveries[0];
        const ownCompleted = completed.includes(tech.id);
        return (
          <div key={tech.id} className={`rounded-xl border p-4 ${ownCompleted
            ? "border-green-400/30 bg-green-400/5"
            : firstDiscover ? "border-amber-400/20 bg-amber-400/5"
            : "border-white/8 bg-white/3"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{tech.emoji}</span>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    {tech.name}
                    <Trophy size={12} className="text-amber-400" />
                  </div>
                  <div className="text-[11px] text-slate-400">{tech.desc}</div>
                </div>
              </div>
              {ownCompleted && <CheckCircle size={16} className="text-green-400 shrink-0" />}
            </div>
            {firstDiscover ? (
              <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1.5">
                🏆 First discovered by <span className="font-bold">{firstDiscover.nation_name}</span>
                {discoveries.length > 1 && <span className="text-slate-500">· {discoveries.length - 1} other{discoveries.length > 2 ? "s" : ""} followed</span>}
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1"><Clock size={9} /> Not yet discovered by any nation</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActiveResearchTab({ inProgress, researchSpeed, nation, onRefresh }) {
  if (inProgress.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <FlaskConical size={40} className="mx-auto mb-3 opacity-20" />
        <div className="text-sm">No active research projects.</div>
        <div className="text-xs mt-1">Switch to the Tech Tree tab to start researching.</div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {inProgress.map(r => {
        const tech = RESEARCH_MAP[r.tech_id];
        const ptsLeft = r.required_points - r.points_invested;
        const ticksLeft = researchSpeed > 0 ? Math.ceil(ptsLeft / researchSpeed) : "∞";
        return (
          <div key={r.id} className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{tech?.emoji || "🔬"}</span>
                <div>
                  <div className="font-bold text-cyan-300 text-sm">{r.tech_name}</div>
                  <div className="text-[11px] text-slate-400">
                    {RESEARCH_BRANCHES[r.tree_branch]?.emoji} {RESEARCH_BRANCHES[r.tree_branch]?.name} · Layer {r.tech_layer}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-400 font-bold">{Math.round(r.progress)}%</div>
                <div className="text-[10px] text-slate-500">~{ticksLeft} ticks left</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                style={{ width: `${r.progress}%` }} />
            </div>
            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
              <span>{r.points_invested.toLocaleString()} / {r.required_points.toLocaleString()} pts</span>
              {r.diffusion_penalty > 0 && <span className="text-amber-400">⚠ 50% slower (discovered nation)</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}