import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, CheckCircle, AlertCircle, TrendingUp, Lock } from "lucide-react";

const SECTORS = [
  {
    key: "military",
    label: "Military",
    emoji: "⚔️",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    gradient: "from-red-600 to-red-400",
    border: "border-red-500/40",
    impact: "Increases defense & war readiness",
    effectFn: (pct, nation) => ({
      unit_power: `+${Math.floor(pct * 0.3)}`,
      defense_level: `+${Math.floor(pct * 0.2)}`,
      stability: pct > 30 ? `${Math.floor((pct - 30) * -0.1)}` : "+0",
    }),
  },
  {
    key: "welfare",
    label: "Welfare",
    emoji: "🏥",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.4)",
    gradient: "from-green-600 to-green-400",
    border: "border-green-500/40",
    impact: "Improves stability & public morale",
    effectFn: (pct, nation) => ({
      stability: `+${Math.floor(pct * 0.4)}`,
      public_trust: `+${(pct * 0.008).toFixed(2)}`,
    }),
  },
  {
    key: "education",
    label: "Education",
    emoji: "📚",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.4)",
    gradient: "from-blue-600 to-blue-400",
    border: "border-blue-500/40",
    impact: "Generates Tech Points & accelerates epochs",
    effectFn: (pct, nation) => ({
      tech_points: `+${Math.floor(pct * 0.5)}`,
      gdp: `+${pct * 2}`,
    }),
  },
  {
    key: "agriculture",
    label: "Agriculture",
    emoji: "🌾",
    color: "#eab308",
    glow: "rgba(234,179,8,0.4)",
    gradient: "from-yellow-600 to-yellow-400",
    border: "border-yellow-500/40",
    impact: "Increases food output & population growth",
    effectFn: (pct, nation) => ({
      res_food: `+${Math.floor(pct * 1.5)}`,
      population: pct > 15 ? "+1 (growth chance)" : "—",
    }),
  },
  {
    key: "energy",
    label: "Energy",
    emoji: "⚡",
    color: "#f97316",
    glow: "rgba(249,115,22,0.4)",
    gradient: "from-orange-600 to-orange-400",
    border: "border-orange-500/40",
    impact: "Boosts production & GDP efficiency",
    effectFn: (pct, nation) => ({
      gdp: `+${Math.floor(pct * 1.5)}`,
      manufacturing: `+${Math.floor(pct * 0.3)}`,
    }),
  },
  {
    key: "resources",
    label: "Resources",
    emoji: "⛏️",
    color: "#a16207",
    glow: "rgba(161,98,7,0.4)",
    gradient: "from-yellow-800 to-yellow-600",
    border: "border-yellow-700/40",
    impact: "Increases extraction rate of natural resources",
    effectFn: (pct, nation) => ({
      res_gold: `+${Math.floor(pct * 0.4)}`,
      res_iron: `+${Math.floor(pct * 0.3)}`,
      res_wood: `+${Math.floor(pct * 0.5)}`,
    }),
  },
  {
    key: "treasury",
    label: "Treasury",
    emoji: "💰",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.4)",
    gradient: "from-cyan-600 to-cyan-400",
    border: "border-cyan-500/40",
    impact: "Retains liquid capital for trade & war",
    effectFn: (pct, nation) => ({
      currency: `+${Math.floor((nation.gdp || 500) * 0.05 * (pct / 100) * 60)}`,
    }),
  },
];

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function getProjectedImpact(alloc, nation) {
  const gdp = nation.gdp || 500;
  const mil = alloc.military || 0;
  const wel = alloc.welfare || 0;
  const edu = alloc.education || 0;
  const agr = alloc.agriculture || 0;
  const ene = alloc.energy || 0;
  const res = alloc.resources || 0;
  const tre = alloc.treasury || 0;

  const incomePerTick = Math.round(gdp * 0.05 * 1.5);
  const treasuryBonus = Math.round(incomePerTick * (tre / 100) * 1.5);
  const totalCurrency = incomePerTick + treasuryBonus;

  const techPoints = Math.floor(edu * 0.5 + (nation.workers_researchers || 0) * 2);
  const militaryStr = Math.floor(mil * 0.3);
  const defenseStr = Math.floor(mil * 0.2);
  const foodBonus = Math.floor(agr * 1.5);
  const stabilityDelta = Math.floor(wel * 0.4) - (mil > 40 ? Math.floor((mil - 40) * 0.1) : 0);
  const trustDelta = parseFloat((wel * 0.008 - (mil > 50 ? (mil - 50) * 0.005 : 0)).toFixed(2));
  const gdpDelta = Math.floor(edu * 2 + ene * 1.5);

  return { totalCurrency, techPoints, militaryStr, defenseStr, foodBonus, stabilityDelta, trustDelta, gdpDelta };
}

function ImpactRow({ label, value, unit = "", positive = true }) {
  const isPositive = typeof positive === "boolean" ? positive : value > 0;
  const color = isPositive ? "text-green-400" : "text-red-400";
  const prefix = typeof value === "number" ? (value >= 0 ? "+" : "") : "+";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-mono font-bold ${color}`}>{prefix}{value}{unit}</span>
    </div>
  );
}

export default function BudgetCyclePanel({ nation, onClose, onRefresh }) {
  const defaultAlloc = {
    military: nation?.military_spending ?? 20,
    welfare: 15,
    education: nation?.education_spending ?? 20,
    agriculture: 15,
    energy: 10,
    resources: 10,
    treasury: 10,
  };

  // Normalize to 100
  const total0 = Object.values(defaultAlloc).reduce((s, v) => s + v, 0);
  if (total0 !== 100) defaultAlloc.treasury = Math.max(0, defaultAlloc.treasury + (100 - total0));

  const [alloc, setAlloc] = useState(defaultAlloc);
  const [dragging, setDragging] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [pulse, setPulse] = useState(false);
  const [error, setError] = useState("");
  const cooldownRef = useRef(null);
  const countdownRef = useRef(null);

  const total = useMemo(() => Object.values(alloc).reduce((s, v) => s + v, 0), [alloc]);
  const impact = useMemo(() => getProjectedImpact(alloc, nation), [alloc, nation]);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setPulse(true);
          setTimeout(() => setPulse(false), 1000);
          return 60;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  function adjustAlloc(key, newVal) {
    if (cooldown > 0) { setError("Sliders locked during cooldown."); return; }
    setError("");
    setConfirmed(false);
    const clamped = clamp(newVal, 0, 100);
    const delta = clamped - alloc[key];
    // Drain/fill from other keys proportionally
    const others = SECTORS.map(s => s.key).filter(k => k !== key);
    let remaining = -delta;
    const newAlloc = { ...alloc, [key]: clamped };
    for (const k of others) {
      const adj = clamp(newAlloc[k] + remaining, 0, 100);
      remaining -= adj - newAlloc[k];
      newAlloc[k] = adj;
    }
    // Rounding fix
    const newTotal = Object.values(newAlloc).reduce((s, v) => s + v, 0);
    if (newTotal !== 100) {
      const diff = 100 - newTotal;
      for (const k of others) {
        if (newAlloc[k] + diff >= 0) { newAlloc[k] += diff; break; }
      }
    }
    setAlloc(newAlloc);
  }

  async function confirm() {
    if (total !== 100) { setError("Total must equal 100%"); return; }
    if (cooldown > 0) { setError("Please wait for cooldown."); return; }
    setLoading(true);
    setError("");

    const techGain = Math.floor(alloc.education * 0.5);
    const powerGain = Math.floor(alloc.military * 0.3);
    const defGain = Math.floor(alloc.military * 0.2);
    const stabilityGain = Math.floor(alloc.welfare * 0.4);
    const gdpGain = Math.floor(alloc.education * 2 + alloc.energy * 1.5);
    const trustDelta = parseFloat((alloc.welfare * 0.008).toFixed(2));
    const foodBonus = Math.floor(alloc.agriculture * 1.5);

    await base44.entities.Nation.update(nation.id, {
      education_spending: alloc.education,
      military_spending: alloc.military,
      tech_points: Math.min(99999, (nation.tech_points || 0) + techGain),
      unit_power: Math.min(200, (nation.unit_power || 10) + powerGain),
      defense_level: Math.min(200, (nation.defense_level || 10) + defGain),
      gdp: Math.min(100000, (nation.gdp || 500) + gdpGain),
      stability: Math.min(100, Math.round((nation.stability || 75) + stabilityGain)),
      public_trust: parseFloat(Math.min(2.0, (nation.public_trust || 1.0) + trustDelta).toFixed(2)),
      res_food: Math.min(99999, (nation.res_food || 200) + foodBonus),
    });

    setLoading(false);
    setConfirmed(true);
    setCooldown(5);
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(cooldownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    onRefresh?.();
  }

  if (!nation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#090d17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-base">📊</span>
            </div>
            <div>
              <div className="font-black text-white text-sm tracking-wide">BUDGET CYCLE</div>
              <div className="text-xs text-slate-500">National Economic Allocation</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Countdown */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-300 ${pulse ? "bg-cyan-400/20 border-cyan-400/60 text-cyan-300" : "bg-white/5 border-white/10 text-slate-400"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${pulse ? "bg-cyan-400 animate-ping" : "bg-slate-500"}`} />
              Next tick in {countdown}s
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
              <X size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-white/3 to-transparent overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max mx-auto w-fit">
            {/* GDP Node */}
            <div className="flex flex-col items-center">
              <div className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                <div className="text-xs text-slate-400">GDP</div>
                <div className="text-sm font-black text-cyan-400 font-mono">{(nation.gdp||500).toLocaleString()}</div>
              </div>
            </div>
            {/* Arrow */}
            <div className="flex items-center gap-0.5 px-1">
              <div className="w-6 h-px bg-gradient-to-r from-cyan-400 to-slate-500" />
              <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-slate-400" />
            </div>
            {/* Sectors */}
            <div className="flex gap-1.5">
              {SECTORS.slice(0,4).map(s => (
                <div key={s.key} className="flex flex-col items-center gap-1">
                  <div
                    className="px-2 py-1.5 rounded-lg border text-center transition-all duration-300"
                    style={{
                      borderColor: alloc[s.key] > 15 ? s.color + "88" : "rgba(255,255,255,0.08)",
                      backgroundColor: alloc[s.key] > 15 ? s.color + "18" : "rgba(255,255,255,0.03)",
                      boxShadow: alloc[s.key] > 20 ? `0 0 10px ${s.glow}` : "none",
                    }}
                  >
                    <div className="text-base leading-none">{s.emoji}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 whitespace-nowrap">{s.label}</div>
                    <div className="text-[10px] font-mono font-bold mt-0.5" style={{ color: s.color }}>{alloc[s.key]}%</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Arrow */}
            <div className="flex items-center gap-0.5 px-1">
              <div className="w-6 h-px bg-gradient-to-r from-slate-500 to-green-400" />
              <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-green-400" />
            </div>
            {/* Growth node */}
            <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
              <div className="text-xs text-slate-400">Growth</div>
              <div className="text-sm font-black text-green-400 font-mono">+{impact.gdpDelta}</div>
            </div>
            {/* Feedback arrow */}
            <div className="flex items-center gap-0.5 px-1">
              <div className="w-4 h-px bg-gradient-to-r from-green-400 to-violet-400" />
              <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-violet-400" />
            </div>
            <div className="px-2 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-center">
              <div className="text-[9px] text-slate-400">↺ GDP</div>
              <div className="text-[10px] font-black text-violet-400">Loop</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sliders - 2/3 width */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Sector Allocation</span>
              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                total === 100 ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"
              }`}>
                {total}% / 100%
              </span>
            </div>

            {SECTORS.map(sector => {
              const pct = alloc[sector.key] || 0;
              const isDragging = dragging === sector.key;
              return (
                <div key={sector.key}
                  className={`rounded-xl border p-3 transition-all duration-200 ${isDragging ? sector.border + " bg-white/5" : "border-white/8 bg-white/3 hover:bg-white/5"}`}
                  style={{ boxShadow: isDragging ? `0 0 16px ${sector.glow}` : "none" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{sector.emoji}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{sector.label}</div>
                        <div className="text-[10px] text-slate-500">{sector.impact}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cooldown > 0 && <Lock size={10} className="text-slate-500" />}
                      <span className="text-sm font-mono font-black" style={{ color: sector.color }}>{pct}%</span>
                    </div>
                  </div>

                  {/* Custom slider bar */}
                  <div className="relative h-8 flex items-center group">
                    <div
                      className="w-full h-2 rounded-full bg-white/10 relative cursor-pointer overflow-visible"
                      onClick={(e) => {
                        if (cooldown > 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const newPct = Math.round(clamp((x / rect.width) * 100, 0, 100));
                        adjustAlloc(sector.key, newPct);
                      }}
                    >
                      {/* Fill */}
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${sector.gradient} transition-all duration-150 relative overflow-hidden`}
                        style={{ width: `${pct}%` }}
                      >
                        {/* Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
                          style={{ backgroundSize: "200% 100%", animation: "shimmer 2s infinite" }} />
                      </div>
                      {/* Handle */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white/60 bg-[#090d17] shadow-lg cursor-grab active:cursor-grabbing transition-all duration-150 flex items-center justify-center"
                        style={{ left: `${pct}%`, boxShadow: isDragging ? `0 0 12px ${sector.glow}` : `0 2px 8px rgba(0,0,0,0.6)` }}
                        onMouseDown={(e) => {
                          if (cooldown > 0) return;
                          e.preventDefault();
                          setDragging(sector.key);
                          const barEl = e.currentTarget.parentElement;
                          const rect = barEl.getBoundingClientRect();
                          const move = (me) => {
                            const x = me.clientX - rect.left;
                            adjustAlloc(sector.key, Math.round(clamp((x / rect.width) * 100, 0, 100)));
                          };
                          const up = () => { setDragging(null); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
                          window.addEventListener("mousemove", move);
                          window.addEventListener("mouseup", up);
                        }}
                        onTouchStart={(e) => {
                          if (cooldown > 0) return;
                          setDragging(sector.key);
                          const barEl = e.currentTarget.parentElement;
                          const rect = barEl.getBoundingClientRect();
                          const move = (te) => {
                            const x = te.touches[0].clientX - rect.left;
                            adjustAlloc(sector.key, Math.round(clamp((x / rect.width) * 100, 0, 100)));
                          };
                          const up = () => { setDragging(null); document.removeEventListener("touchmove", move); document.removeEventListener("touchend", up); };
                          document.addEventListener("touchmove", move);
                          document.addEventListener("touchend", up);
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sector.color }} />
                      </div>
                    </div>

                    {/* Hidden native range as fallback for keyboard */}
                    <input
                      type="range" min={0} max={100} value={pct}
                      onChange={e => adjustAlloc(sector.key, +e.target.value)}
                      disabled={cooldown > 0}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      style={{ minHeight: 44 }}
                    />
                  </div>

                  {/* Sub-effects */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(sector.effectFn(pct, nation)).map(([k, v]) => (
                      <span key={k} className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400">
                        {k.replace(/_/g, " ")}: <span style={{ color: sector.color }}>{v}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs text-red-400">{error}</span>
              </div>
            )}

            {/* Confirm button */}
            <button
              onClick={confirm}
              disabled={total !== 100 || cooldown > 0 || loading}
              className={`w-full py-3.5 min-h-[48px] rounded-xl font-black text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                confirmed ? "bg-green-500/20 border border-green-500/40 text-green-400" :
                total !== 100 ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed" :
                cooldown > 0 ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed" :
                "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
              }`}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</>
              ) : confirmed ? (
                <><CheckCircle size={16} /> Allocation Confirmed — Applied at Next Tick</>
              ) : cooldown > 0 ? (
                <><Lock size={14} /> Locked — {cooldown}s cooldown</>
              ) : total !== 100 ? (
                `Total must equal 100% (currently ${total}%)`
              ) : (
                "✦ CONFIRM ALLOCATION"
              )}
            </button>
          </div>

          {/* Projected Impact Panel - 1/3 */}
          <div className="space-y-3">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Projected Next Tick Impact</div>

            <div className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-0">
              <ImpactRow label="💰 Treasury / tick" value={impact.totalCurrency} unit=" cr" positive={impact.totalCurrency > 0} />
              <ImpactRow label="📚 Tech Points" value={impact.techPoints} unit=" TP" positive={impact.techPoints > 0} />
              <ImpactRow label="⚔️ Military Strength" value={impact.militaryStr} positive={impact.militaryStr > 0} />
              <ImpactRow label="🛡️ Defense Level" value={impact.defenseStr} positive={impact.defenseStr > 0} />
              <ImpactRow label="🌾 Food Bonus" value={impact.foodBonus} positive={impact.foodBonus > 0} />
              <ImpactRow label="📈 GDP Delta" value={impact.gdpDelta} positive={impact.gdpDelta > 0} />
              <ImpactRow
                label="⚖️ Stability"
                value={impact.stabilityDelta >= 0 ? `+${impact.stabilityDelta}` : `${impact.stabilityDelta}`}
                unit="%"
                positive={impact.stabilityDelta >= 0}
              />
              <ImpactRow
                label="🤝 Investor Trust"
                value={impact.trustDelta >= 0 ? `+${impact.trustDelta}` : `${impact.trustDelta}`}
                positive={impact.trustDelta >= 0}
              />
            </div>

            {/* Warnings */}
            {alloc.military > 40 && (
              <div className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400">
                ⚠ High military spending erodes public trust over time.
              </div>
            )}
            {alloc.education < 10 && (
              <div className="rounded-xl p-3 border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400">
                💡 Low education slows epoch advancement significantly.
              </div>
            )}
            {alloc.welfare < 10 && (
              <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5 text-xs text-red-400">
                ⚠ Low welfare risks civil unrest and stability collapse.
              </div>
            )}

            {/* GDP Loop Visual */}
            <div className="rounded-xl p-3 border border-violet-500/20 bg-violet-500/5">
              <div className="text-xs text-violet-400 font-bold mb-2">↺ Economic Feedback Loop</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Current GDP</span>
                  <span className="text-cyan-400 font-mono">{(nation.gdp || 500).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">After Growth</span>
                  <span className="text-green-400 font-mono">+{impact.gdpDelta} → {((nation.gdp || 500) + impact.gdpDelta).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Income/tick</span>
                  <span className="text-yellow-400 font-mono">+{Math.floor(((nation.gdp||500) + impact.gdpDelta) * 0.05 * 1.5)} cr</span>
                </div>
              </div>
            </div>

            {/* Nation current stats summary */}
            <div className="rounded-xl p-3 border border-white/10 bg-white/3">
              <div className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wider">Current State</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "GDP", value: (nation.gdp || 0).toLocaleString(), color: "text-cyan-400" },
                  { label: "Treasury", value: (nation.currency || 0).toLocaleString(), color: "text-green-400" },
                  { label: "Stability", value: Math.round(nation.stability || 0) + "%", color: "text-blue-400" },
                  { label: "Tech Pts", value: nation.tech_points || 0, color: "text-yellow-400" },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-slate-500">{s.label}</div>
                    <div className={`text-xs font-mono font-bold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}