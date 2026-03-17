import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Check, Lock, ChevronRight, TrendingUp, Shield, BookOpen, Wheat, Zap, Mountain, Banknote, AlertTriangle } from "lucide-react";
import WorkforcePanel from "./WorkforcePanel";

// ─── Sector config ──────────────────────────────────────────────────────────
const SECTORS = [
  {
    key: "military",
    label: "Military",
    emoji: "⚔️",
    icon: Shield,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    gradient: "from-red-900/60 to-red-700/30",
    border: "border-red-500/40",
    impact: "Increases defense & war readiness",
    statKey: "unit_power",
  },
  {
    key: "welfare",
    label: "Welfare",
    emoji: "🏥",
    icon: TrendingUp,
    color: "#22c55e",
    glow: "rgba(34,197,94,0.4)",
    gradient: "from-green-900/60 to-green-700/30",
    border: "border-green-500/40",
    impact: "Improves stability & morale",
    statKey: "stability",
  },
  {
    key: "education",
    label: "Education",
    emoji: "📚",
    icon: BookOpen,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.4)",
    gradient: "from-blue-900/60 to-blue-700/30",
    border: "border-blue-500/40",
    impact: "Generates Tech Points faster",
    statKey: "tech_points",
  },
  {
    key: "agriculture",
    label: "Agriculture",
    emoji: "🌾",
    icon: Wheat,
    color: "#eab308",
    glow: "rgba(234,179,8,0.4)",
    gradient: "from-yellow-900/60 to-yellow-700/30",
    border: "border-yellow-500/40",
    impact: "Boosts food & population growth",
    statKey: "res_food",
  },
  {
    key: "energy",
    label: "Energy",
    emoji: "⚡",
    icon: Zap,
    color: "#f97316",
    glow: "rgba(249,115,22,0.4)",
    gradient: "from-orange-900/60 to-orange-700/30",
    border: "border-orange-500/40",
    impact: "Boosts production efficiency",
    statKey: "manufacturing",
  },
  {
    key: "resources",
    label: "Resources",
    emoji: "⛏️",
    icon: Mountain,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.4)",
    gradient: "from-violet-900/60 to-violet-700/30",
    border: "border-violet-500/40",
    impact: "Increases extraction rate",
    statKey: "res_gold",
  },
  {
    key: "treasury",
    label: "Treasury",
    emoji: "💰",
    icon: Banknote,
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.4)",
    gradient: "from-cyan-900/60 to-cyan-700/30",
    border: "border-cyan-500/40",
    impact: "Increases liquid capital for trade & war",
    statKey: "currency",
  },
];

const DEFAULT_ALLOC = { military: 15, welfare: 10, education: 20, agriculture: 15, energy: 10, resources: 10, treasury: 20 };

function computeProjections(alloc, nation) {
  const gdp = nation?.gdp || 500;
  const stability = nation?.stability || 75;
  const pop = nation?.population || 10;
  const isAtWar = (nation?.at_war_with || []).length > 0;

  const warPenalty = isAtWar ? 0.7 : 1.0;
  const stabilityBonus = stability / 100;

  const treasury = Math.floor(gdp * 0.05 * (alloc.treasury / 20) * warPenalty);
  const techPoints = Math.floor(alloc.education * 0.5 * stabilityBonus);
  const military = Math.floor(alloc.military * 0.3 * warPenalty);
  const food = Math.floor(alloc.agriculture * 0.4 * (pop / 10));
  const efficiency = Math.floor(alloc.energy * 0.25);
  const extraction = Math.floor(alloc.resources * 0.35);
  const stabilityChange = Math.floor((alloc.welfare - alloc.military * 0.3) * 0.15) - (isAtWar ? 2 : 0);
  const confidence = parseFloat(((alloc.education + alloc.welfare - alloc.military * 0.4) * 0.005).toFixed(3));

  return { treasury, techPoints, military, food, efficiency, extraction, stabilityChange, confidence };
}

// ─── Animated Flow Diagram ────────────────────────────────────────────────
function FlowDiagram({ alloc, nation }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 800); }, 8000);
    return () => clearInterval(id);
  }, []);

  const nodes = [
    { label: "GDP", sub: `${(nation?.gdp || 0).toLocaleString()}`, color: "#06b6d4" },
    { label: "Allocation", sub: "7 Sectors", color: "#8b5cf6" },
    { label: "Investment", sub: "Growing", color: "#f97316" },
    { label: "Growth", sub: "Output", color: "#22c55e" },
  ];

  return (
    <div className="relative rounded-xl border border-white/10 bg-white/3 p-4 mb-5 overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{ background: "radial-gradient(ellipse at 30% 50%, #06b6d4 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, #8b5cf6 0%, transparent 60%)" }} />
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Economic Feedback Loop</div>
      <div className="flex items-center justify-between gap-1">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex items-center gap-1 flex-1">
            <div className={`flex-1 flex flex-col items-center px-2 py-2 rounded-lg border transition-all duration-500 ${pulse ? "scale-105" : "scale-100"}`}
              style={{ borderColor: node.color + "55", background: node.color + "11", boxShadow: pulse ? `0 0 12px ${node.color}44` : "none" }}>
              <span className="text-[9px] text-slate-400 uppercase tracking-wide leading-none">{node.label}</span>
              <span className="text-xs font-bold font-mono mt-0.5" style={{ color: node.color }}>{node.sub}</span>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className={`h-px w-5 transition-all duration-700 ${pulse ? "opacity-100" : "opacity-40"}`}
                  style={{ background: `linear-gradient(to right, ${nodes[i].color}, ${nodes[i + 1].color})` }} />
                <ChevronRight size={8} style={{ color: nodes[i + 1].color }} className={`transition-opacity ${pulse ? "opacity-100" : "opacity-40"}`} />
              </div>
            )}
          </div>
        ))}
        {/* Feedback arrow */}
        <div className="absolute bottom-2 left-4 right-4 flex items-center justify-center">
          <div className="w-full h-px border-b border-dashed border-cyan-500/20" />
          <div className="absolute right-4 text-[9px] text-cyan-500/40">↩ loop</div>
        </div>
      </div>
    </div>
  );
}

// ─── Individual Sector Slider ─────────────────────────────────────────────
function SectorSlider({ sector, value, onChange, locked }) {
  const [dragging, setDragging] = useState(false);
  const Icon = sector.icon;

  return (
    <div className={`rounded-xl border p-3 transition-all duration-200 ${sector.border} bg-gradient-to-r ${sector.gradient} ${locked ? "opacity-50 pointer-events-none" : ""} ${dragging ? "ring-1" : ""}`}
      style={{ ringColor: sector.color }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{sector.emoji}</span>
          <span className="text-xs font-bold text-white">{sector.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {value >= 25 && <span className="text-[9px]" style={{ color: sector.color }}>↑ Strong</span>}
          <span className="font-mono font-black text-sm" style={{ color: sector.color }}>{value}%</span>
        </div>
      </div>

      {/* Custom slider track */}
      <div className="relative h-7 flex items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-white/10" />
        <div className="absolute h-2 rounded-full transition-all duration-150"
          style={{ width: `${value}%`, background: `linear-gradient(to right, ${sector.color}88, ${sector.color})`, boxShadow: dragging ? `0 0 8px ${sector.glow}` : "none" }} />
        {/* Shimmer */}
        <div className="absolute h-2 rounded-full overflow-hidden pointer-events-none" style={{ width: `${value}%` }}>
          <div className="absolute inset-0 animate-pulse opacity-30"
            style={{ background: `linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)`, backgroundSize: "200% 100%", animation: "shimmer 2s infinite" }} />
        </div>
        <input
          type="range" min={0} max={60} value={value}
          onChange={e => onChange(sector.key, +e.target.value)}
          onMouseDown={() => setDragging(true)} onMouseUp={() => setDragging(false)}
          onTouchStart={() => setDragging(true)} onTouchEnd={() => setDragging(false)}
          disabled={locked}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: 44, zIndex: 2 }}
        />
        <div className="absolute h-5 w-5 rounded-full border-2 shadow-lg transition-all duration-150 pointer-events-none"
          style={{ left: `calc(${value}% - 10px)`, backgroundColor: sector.color, borderColor: "white", boxShadow: dragging ? `0 0 12px ${sector.glow}` : "0 2px 6px rgba(0,0,0,0.5)", zIndex: 1 }} />
      </div>

      <div className="text-[10px] text-slate-500 mt-1">{sector.impact}</div>
    </div>
  );
}

// ─── Projected Impact Panel ───────────────────────────────────────────────
function ProjectedImpact({ projections, isAtWar }) {
  const rows = [
    { label: "Treasury/min", val: projections.treasury, prefix: "+", suffix: " cr", color: projections.treasury >= 0 ? "text-green-400" : "text-red-400" },
    { label: "Tech Points/min", val: projections.techPoints, prefix: "+", suffix: " TP", color: "text-blue-400" },
    { label: "Military Str/min", val: projections.military, prefix: "+", suffix: "", color: "text-red-400" },
    { label: "Food Bonus", val: projections.food, prefix: "+", suffix: "/min", color: "text-yellow-400" },
    { label: "Efficiency Boost", val: projections.efficiency, prefix: "+", suffix: "%", color: "text-orange-400" },
    { label: "Extraction Rate", val: projections.extraction, prefix: "+", suffix: "%", color: "text-violet-400" },
    { label: "Stability Δ", val: projections.stabilityChange, prefix: projections.stabilityChange >= 0 ? "+" : "", suffix: "%", color: projections.stabilityChange >= 0 ? "text-green-400" : "text-red-400" },
    { label: "Investor Conf.", val: projections.confidence, prefix: projections.confidence >= 0 ? "+" : "", suffix: "", color: projections.confidence >= 0 ? "text-cyan-400" : "text-red-400" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-4 h-full">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Projected Next Tick Impact</div>
      {isAtWar && (
        <div className="flex items-center gap-1.5 text-[10px] text-orange-400 bg-orange-500/10 rounded-lg px-2 py-1.5 mb-3">
          <AlertTriangle size={10} /> War penalty active on some sectors
        </div>
      )}
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">{r.label}</span>
            <span className={`font-mono font-bold text-xs ${r.color}`}>{r.prefix}{r.val}{r.suffix}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Countdown Timer ─────────────────────────────────────────────────────
function TickTimer({ onTick }) {
  const [secs, setSecs] = useState(60);
  const [pulsing, setPulsing] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          if (!firedRef.current) { firedRef.current = true; onTick(); }
          setPulsing(true);
          setTimeout(() => { setPulsing(false); firedRef.current = false; }, 1000);
          return 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = (secs / 60) * 100;

  return (
    <div className={`rounded-xl border p-3 transition-all duration-300 ${pulsing ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 bg-white/3"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Next Budget Cycle</span>
        <span className={`font-mono font-black text-base ${secs <= 10 ? "text-red-400" : "text-cyan-400"} ${pulsing ? "scale-110" : ""} transition-transform`}>
          {secs}s
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: secs <= 10 ? "#ef4444" : "linear-gradient(to right, #0891b2, #06b6d4)" }} />
      </div>
      {pulsing && <div className="text-[10px] text-cyan-400 text-center mt-1.5 font-bold animate-pulse">✓ Budget Applied!</div>}
    </div>
  );
}

// ─── Main BudgetCyclePanel ───────────────────────────────────────────────
export default function BudgetCyclePanel({ nation, onClose, onRefresh }) {
  const saved = useMemo(() => {
    const edu = nation?.education_spending ?? 20;
    const mil = nation?.military_spending ?? 20;
    return {
      military: mil,
      welfare: Math.max(0, Math.round((100 - edu - mil) * 0.2)),
      education: edu,
      agriculture: Math.max(0, Math.round((100 - edu - mil) * 0.25)),
      energy: Math.max(0, Math.round((100 - edu - mil) * 0.2)),
      resources: Math.max(0, Math.round((100 - edu - mil) * 0.15)),
      treasury: 0,
    };
  }, [nation]);

  const [alloc, setAlloc] = useState(() => {
    const s = saved;
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    if (total !== 100) s.treasury = Math.max(0, s.treasury + (100 - total));
    return s;
  });

  const [confirmed, setConfirmed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);

  const total = useMemo(() => Object.values(alloc).reduce((a, b) => a + b, 0), [alloc]);
  const projections = useMemo(() => computeProjections(alloc, nation), [alloc, nation]);
  const isAtWar = (nation?.at_war_with || []).length > 0;

  const handleSlider = useCallback((key, val) => {
    if (locked) return;
    setError("");
    setConfirmed(false);
    setDirty(true);
    setAlloc(prev => {
      const next = { ...prev, [key]: val };
      const t = Object.values(next).reduce((a, b) => a + b, 0);
      if (t > 100) {
        const diff = t - 100;
        // Reduce treasury first, then other sectors
        if (key !== "treasury" && next.treasury >= diff) {
          next.treasury = next.treasury - diff;
        } else {
          // spread reduction across others
          const others = SECTORS.filter(s => s.key !== key).map(s => s.key);
          let rem = diff;
          for (const k of others) {
            if (rem <= 0) break;
            const cut = Math.min(rem, next[k]);
            next[k] = next[k] - cut;
            rem -= cut;
          }
        }
      }
      return next;
    });
  }, [locked]);

  async function applyAllocations(currentAlloc) {
    if (!nation?.id) return;
    const edu = currentAlloc.education;
    const mil = currentAlloc.military;
    const welfare = currentAlloc.welfare;
    const agri = currentAlloc.agriculture;
    const energy = currentAlloc.energy;
    const resources = currentAlloc.resources;
    const treas = currentAlloc.treasury;

    const techGain = Math.floor(edu * 0.5);
    const powerGain = Math.floor(mil * 0.3);
    const defGain = Math.floor(mil * 0.2);
    const gdpGain = Math.floor(edu * 2 + energy * 1.5 + agri * 1.2);
    const stabilityGain = Math.floor((welfare - mil * 0.3) * 0.15) - (isAtWar ? 2 : 0);
    const currencyBonus = Math.floor(treas * 3);
    const foodBonus = Math.floor(agri * 2);
    const extractBonus = Math.floor(resources * 0.5);

    await base44.entities.Nation.update(nation.id, {
      education_spending: edu,
      military_spending: mil,
      tech_points: Math.min(99999, nation.tech_points + techGain),
      unit_power: Math.min(500, nation.unit_power + powerGain),
      defense_level: Math.min(500, nation.defense_level + defGain),
      gdp: Math.min(100000, nation.gdp + gdpGain),
      stability: Math.min(100, Math.max(0, nation.stability + stabilityGain)),
      currency: Math.max(0, nation.currency + currencyBonus),
      res_food: Math.min(99999, (nation.res_food || 0) + foodBonus),
      res_gold: Math.min(99999, (nation.res_gold || 0) + extractBonus),
    });
    onRefresh?.();
  }

  async function confirmAlloc() {
    if (total !== 100) { setError(`Total must equal 100%. Currently: ${total}%`); return; }
    if (locked) return;
    setSaving(true);
    await applyAllocations(alloc);
    setSaving(false);
    setConfirmed(true);
    setDirty(false);
    setLocked(true);
    setTimeout(() => setLocked(false), 5000);
  }

  function handleTick() {
    // Auto-apply confirmed allocations on tick
    if (confirmed) applyAllocations(alloc);
  }

  if (!nation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl backdrop-blur-xl bg-[#080c14]/95 border border-white/15 rounded-2xl overflow-hidden my-4">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-sm">💹</span>
            </div>
            <div>
              <div className="font-bold text-white text-sm">Budget Cycle</div>
              <div className="text-[10px] text-slate-500">National Economic Allocation System</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${total === 100 ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
              {total}% / 100%
            </div>
            <button
              onClick={() => setShowWorkers(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
            >
              👷 Workers
            </button>
            <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-white" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Flow diagram */}
          <FlowDiagram alloc={alloc} nation={nation} />

          {/* Main grid: sliders left, impact right */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Sliders */}
            <div className="lg:col-span-3 space-y-2">
              {locked && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <Lock size={12} /> Cooldown — sliders unlock in 5 seconds
                </div>
              )}
              {SECTORS.map(s => (
                <SectorSlider key={s.key} sector={s} value={alloc[s.key]} onChange={handleSlider} locked={locked} />
              ))}
            </div>

            {/* Right column: Impact + Timer */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <ProjectedImpact projections={projections} isAtWar={isAtWar} />
              <TickTimer onTick={handleTick} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertTriangle size={12} /> {error}
            </div>
          )}

          {/* Confirm button */}
          {dirty && !locked && (
            <button
              onClick={confirmAlloc}
              disabled={saving || total !== 100}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
              style={{
                background: total === 100 ? "linear-gradient(135deg, #0891b2, #06b6d4)" : "#374151",
                boxShadow: total === 100 ? "0 0 20px rgba(6,182,212,0.3)" : "none"
              }}
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</>
              ) : (
                <><Check size={16} /> Confirm Allocation {total !== 100 ? `(Need 100%, got ${total}%)` : ""}</>
              )}
            </button>
          )}

          {confirmed && !dirty && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-bold">
              <Check size={14} /> Allocation Confirmed — Applies each tick
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      {showWorkers && nation && (
        <WorkforcePanel nation={nation} onClose={() => setShowWorkers(false)} onRefresh={onRefresh} />
      )}
    </div>
  );
}