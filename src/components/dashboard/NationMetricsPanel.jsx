import { useRef, useEffect, useState } from "react";
import { EPOCHS } from "../game/EpochConfig";
import { TICKS_PER_DAY } from "../game/GameClock";
import NationStatsOverlay from "./NationStatsOverlay";

/** Flash glow when a value changes */
function useFlash(value) {
  const prev = useRef(value);
  const [dir, setDir] = useState(null);
  useEffect(() => {
    if (prev.current === value) return;
    setDir(value > prev.current ? "up" : "down");
    prev.current = value;
    const t = setTimeout(() => setDir(null), 1200);
    return () => clearTimeout(t);
  }, [value]);
  return dir;
}

function FlashStat({ value, className = "", style = {}, children }) {
  const dir = useFlash(value);
  const glowStyle = dir === "up"
    ? { boxShadow: "0 0 14px 3px rgba(74,222,128,0.55)", background: "rgba(74,222,128,0.08)", borderRadius: 8, transition: "box-shadow 0.3s, background 0.3s" }
    : dir === "down"
    ? { boxShadow: "0 0 14px 3px rgba(248,113,113,0.55)", background: "rgba(248,113,113,0.08)", borderRadius: 8, transition: "box-shadow 0.3s, background 0.3s" }
    : { transition: "box-shadow 0.6s, background 0.6s" };
  return (
    <span className={className} style={{ ...style, ...glowStyle, padding: "0 4px" }}>
      {children}
    </span>
  );
}

function Bar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 6px ${color}55` }} />
    </div>
  );
}

const CORE_METRICS = [
  { key: "stability",    label: "Stability",    max: 100, color: "#22d3ee", clamp: true },
  { key: "public_trust", label: "Public Trust", max: 1,   color: "#a78bfa", format: v => `${Math.round(v * 100)}%` },
  { key: "manufacturing",label: "Manufacturing",max: 200, color: "#34d399" },
  { key: "defense_level",label: "Defense",      max: 200, color: "#f87171" },
  { key: "unit_power",   label: "Unit Power",   max: 200, color: "#fb923c" },
];

export default function NationMetricsPanel({ nation, allNations }) {
  if (!nation) return null;

  const epochIndex = EPOCHS.indexOf(nation.epoch);
  const pop        = Math.max(1, nation.population || 1);

  // Fuel prices
  const oilSupply   = Math.max(1, nation.res_oil || 0);
  const warMod      = (nation.at_war_with || []).length > 0 ? 1.25 : 1.0;
  const stability   = Math.max(0.1, (nation.stability || 75) / 100);
  const demandMod   = Math.max(0.75, 1 + (pop * 0.02 / 1000) - oilSupply * 0.0001);
  const gasPrice    = parseFloat((2.80 * demandMod * warMod * (1.5 - stability * 0.5)).toFixed(2));
  const dieselPrice = parseFloat((gasPrice * 1.20).toFixed(2));

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl h-full overflow-y-auto"
      style={{ background: "linear-gradient(160deg, rgba(139,92,246,0.05) 0%, rgba(4,8,16,0.97) 60%)", border: "1px solid rgba(139,92,246,0.14)", backdropFilter: "blur(20px)" }}>

      {/* Header */}
      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest ep-mono shrink-0">📊 Nation Metrics</div>

      {/* ── Core Metrics ── */}
      <div className="shrink-0">
        <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase mb-2">CORE METRICS</div>
        <div className="space-y-2.5">
          {CORE_METRICS.map(({ key, label, max, color, format, clamp }) => {
            const rawVal = nation[key] ?? 0;
            const val = clamp ? Math.min(max, Math.max(0, rawVal)) : rawVal;
            const display = format ? format(val) : Math.round(val);
            return (
              <div key={key}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-slate-400 font-medium">{label}</span>
                  <span className="ep-mono font-bold" style={{ color }}>{display}</span>
                </div>
                <Bar value={key === "public_trust" ? val * 100 : val} max={key === "public_trust" ? 100 : max} color={color} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Fuel Prices ── */}
      <div className="rounded-xl px-3 py-2.5 shrink-0" style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.12)" }}>
        <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase mb-2">FUEL PRICES</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-slate-500 ep-mono">⛽ Gasoline</div>
            <div className="text-[14px] font-black ep-mono text-orange-400">${gasPrice}/gal</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 ep-mono">🚛 Diesel</div>
            <div className="text-[14px] font-black ep-mono text-amber-400">${dieselPrice}/gal</div>
          </div>
        </div>
      </div>

      {/* ── Spending & Education ── */}
      <div className="rounded-xl px-3 py-2.5 shrink-0 grid grid-cols-2 gap-3"
        style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)" }}>
        <div>
          <div className="text-[11px] text-slate-500 ep-mono uppercase">Military</div>
          <div className="text-[14px] font-black ep-mono text-red-400">{nation.military_spending || 20}%</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 ep-mono uppercase">Education</div>
          <div className="text-[14px] font-black ep-mono text-blue-400">{nation.education_spending || 20}%</div>
        </div>
      </div>

      {/* ── Technology ── */}
      <div className="shrink-0">
        <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase mb-2">TECHNOLOGY</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl px-2.5 py-2 text-center" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="text-[11px] text-slate-500 ep-mono">Tech Points</div>
            <FlashStat value={Math.round(nation.tech_points || 0)} className="text-[15px] font-black ep-mono text-violet-400">
              {(nation.tech_points || 0).toLocaleString()}
            </FlashStat>
          </div>
          <div className="rounded-xl px-2.5 py-2 text-center" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="text-[11px] text-slate-500 ep-mono">Techs</div>
            <div className="text-[15px] font-black ep-mono text-violet-400">{(nation.unlocked_techs || []).length}</div>
          </div>
        </div>
      </div>



    </div>
  );
}