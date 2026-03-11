import { useRef, useEffect, useState } from "react";
import { EPOCHS } from "../game/EpochConfig";
import { getCitiesForNation } from "../news/CityConfig";
import { TICKS_PER_DAY } from "../game/GameClock";
import { getResourceEmoji, getResourceColor } from "../game/ResourceIcons";

/** Flash a glow when a numeric value changes */
function useFlash(value) {
  const prev = useRef(value);
  const [dir, setDir] = useState(null); // 'up' | 'down' | null

  useEffect(() => {
    if (prev.current === value) return;
    const went = value > prev.current ? "up" : "down";
    prev.current = value;
    setDir(went);
    const t = setTimeout(() => setDir(null), 1200);
    return () => clearTimeout(t);
  }, [value]);

  return dir;
}

const RESOURCE_DEFS = [
  { key: "res_wood",  label: "Wood",  resKey: "wood"  },
  { key: "res_stone", label: "Stone", resKey: "stone" },
  { key: "res_gold",  label: "Gold",  resKey: "gold"  },
  { key: "res_iron",  label: "Iron",  resKey: "iron"  },
  { key: "res_oil",   label: "Oil",   resKey: "oil"   },
  { key: "res_food",  label: "Food",  resKey: "food"  },
];

const CORE_METRICS = [
  { key: "stability",       label: "Stability",      max: 100, color: "#22d3ee" },
  { key: "public_trust",    label: "Public Trust",   max: 1,   color: "#a78bfa", format: v => `${Math.round(v * 100)}%` },
  { key: "manufacturing",   label: "Manufacturing",  max: 200, color: "#34d399" },
  { key: "defense_level",   label: "Defense",        max: 200, color: "#f87171" },
  { key: "unit_power",      label: "Unit Power",     max: 200, color: "#fb923c" },
];

/** Wraps a value display with a glow flash when it changes */
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

function fmtRes(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function ResourceCell({ label, resKey, value }) {
  const color = getResourceColor(resKey);
  const emoji = getResourceEmoji(resKey);
  const dir = useFlash(value);
  const ring = dir === "up"
    ? `0 0 12px 3px rgba(74,222,128,0.5)`
    : dir === "down"
    ? `0 0 12px 3px rgba(248,113,113,0.5)`
    : "none";
  return (
    <div
      className="rounded-xl p-2 flex flex-col items-center gap-0.5"
      style={{
        background: `${color}0d`,
        border: `1px solid ${color}22`,
        boxShadow: ring,
        transition: "box-shadow 0.6s"
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, userSelect: "none" }}>{emoji}</span>
      <span className="text-[10px] text-slate-500 ep-mono">{label}</span>
      <span className="text-[13px] font-black ep-mono" style={{ color }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function Bar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 6px ${color}55` }}
      />
    </div>
  );
}

export default function NationStatsPanel({ nation }) {
  if (!nation) return (
    <div className="ep-card p-4 h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const epochIndex   = EPOCHS.indexOf(nation.epoch);
  const epochPct     = Math.round(((epochIndex + 1) / EPOCHS.length) * 100);
  const allies       = nation.allies || [];
  const allyCount    = allies.length;
  const cityCount    = getCitiesForNation(nation).length;

  // ── Per-tick economy (mirrors CivilizationEconomyEngine tick math) ──
  // 1 tick = 1 real minute = 1 display "per min"
  const pop        = Math.max(1, nation.population || 1);
  const epochMult  = 1 + Math.max(0, epochIndex) * 0.08;
  const totalWorkers =
    (nation.workers_farmers     || 0) + (nation.workers_hunters      || 0) +
    (nation.workers_fishermen   || 0) + (nation.workers_builders     || 0) +
    (nation.workers_lumberjacks || 0) + (nation.workers_quarry       || 0) +
    (nation.workers_miners      || 0) + (nation.workers_oil_engineers|| 0) +
    (nation.workers_soldiers    || 0) + (nation.workers_researchers  || 0) +
    (nation.workers_industrial  || 0);
  const efficiency     = Math.min(1.5, (nation.manufacturing || 50) / 100 + 0.5);
  const productionTick = totalWorkers * efficiency * epochMult * 0.1;

  // Tax rates
  const taxRates     = nation.tax_rates || {};
  const incomeTaxR   = Math.min(0.50, (taxRates.income    ?? 15) / 100);
  const salesTaxR    = Math.min(0.30, (taxRates.sales     ??  8) / 100);
  const corpTaxR     = Math.min(0.40, (taxRates.corporate ?? 12) / 100);

  // Social class distribution (simplified — mirrors engine)
  const eduLevel  = Math.min(100, nation.education_spending || 20);
  const upper     = Math.min(0.25, eduLevel / 400);
  const middle    = Math.min(0.55, eduLevel / 182);
  const low       = Math.max(0.20, 1 - upper - middle);
  const DAILY_SPEND  = { low: 2.0, middle: 2.74, upper: 4.5 };
  const WAGE_MULT    = { low: 2.5, middle: 3.88, upper: 5.66 };
  const TICK_SPEND   = { low: DAILY_SPEND.low / TICKS_PER_DAY, middle: DAILY_SPEND.middle / TICKS_PER_DAY, upper: DAILY_SPEND.upper / TICKS_PER_DAY };
  const workforce    = Math.floor(pop * 0.60);
  const unemployed   = Math.max(0, workforce - totalWorkers);
  const unempRate    = workforce > 0 ? unemployed / workforce : 0;
  const empFactor    = Math.max(0.5, 1 - unempRate / 2);

  const wagePerTick    = (pop * low) * WAGE_MULT.low * TICK_SPEND.low + (pop * middle) * WAGE_MULT.middle * TICK_SPEND.middle + (pop * upper) * WAGE_MULT.upper * TICK_SPEND.upper;
  const spendPerTick   = ((pop * low) * TICK_SPEND.low + (pop * middle) * TICK_SPEND.middle + (pop * upper) * TICK_SPEND.upper) * empFactor;
  const incomeTaxTick  = wagePerTick * incomeTaxR;
  const salesTaxTick   = spendPerTick * salesTaxR;
  const corpTaxTick    = productionTick * corpTaxR;
  const gdpDividend    = (nation.gdp || 500) * 0.001;
  const incomePerMin   = parseFloat((incomeTaxTick + salesTaxTick + corpTaxTick + gdpDividend).toFixed(2));
  const spendingPerMin = parseFloat(((( (nation.education_spending || 20) + (nation.military_spending || 20)) * 0.002)).toFixed(2));
  const netPerMin      = parseFloat((incomePerMin - spendingPerMin).toFixed(2));

  // Food calculations (matching ResourceEngine — per tick)
  const farmFood  = Math.floor((nation.workers_farmers    || 0) * 8 * epochMult);
  const huntFood  = Math.floor((nation.workers_hunters    || 0) * 3 * epochMult);  // avg
  const fishFood  = Math.floor((nation.workers_fishermen  || 0) * 6 * epochMult);
  const foodProd  = farmFood + huntFood + fishFood;
  const foodCons  = Math.ceil(pop * 1.2);   // per-tick consumption (pop × 1.2 / TICKS_PER_DAY × TICKS_PER_DAY)
  const foodNet   = foodProd - foodCons;

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-2xl h-full overflow-y-auto"
      style={{
        background: "linear-gradient(160deg, rgba(6,182,212,0.05) 0%, rgba(4,8,16,0.97) 60%)",
        border: "1px solid rgba(6,182,212,0.14)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* ── Nation identity ── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative shrink-0">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${nation.flag_color || "#3b82f6"}33, ${nation.flag_color || "#3b82f6"}11)`,
              border: `1.5px solid ${nation.flag_color || "#3b82f6"}55`,
              boxShadow: `0 0 18px ${nation.flag_color || "#3b82f6"}33`,
            }}
          >
            {nation.flag_image_url
              ? <img src={nation.flag_image_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
              : nation.flag_emoji || "🏴"}
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#080c14]" style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade8088" }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-black text-white leading-tight truncate">{nation.name}</h2>
          <div className="text-[13px] text-slate-400 truncate">{nation.leader}</div>
          <div className="text-[12px] font-bold mt-0.5" style={{ color: "#22d3ee" }}>{nation.epoch}</div>
        </div>
      </div>

      {/* ── Epoch progress ── */}
      <div className="shrink-0">
        <div className="flex justify-between text-[12px] mb-1.5">
          <span className="text-slate-500 ep-mono font-bold">EPOCH PROGRESS</span>
          <span className="ep-mono font-black text-cyan-400">{epochPct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${epochPct}%`, background: "linear-gradient(90deg, #06b6d4, #818cf8)", boxShadow: "0 0 8px rgba(6,182,212,0.5)" }}
          />
        </div>
        <div className="flex justify-between text-[11px] mt-1 text-slate-600 ep-mono">
          <span>Epoch {epochIndex + 1}/{EPOCHS.length}</span>
          <span>Tech LVL {nation.tech_level || 1}</span>
        </div>
      </div>

      {/* ── Top 3 quick stats: Allies | Cities | Pop ── */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        {/* Allies */}
        <div className="rounded-xl p-2.5 flex flex-col items-center gap-0.5"
          style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)" }}>
          <span className="text-[11px] text-slate-500 font-bold ep-mono uppercase">Allies</span>
          <span className="text-xl font-black ep-mono text-cyan-400">{allyCount}</span>
        </div>
        {/* Cities */}
        <div className="rounded-xl p-2.5 flex flex-col items-center gap-0.5"
          style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.15)" }}>
          <span className="text-[11px] text-slate-500 font-bold ep-mono uppercase">Cities</span>
          <span className="text-xl font-black ep-mono" style={{ color: "#fb923c" }}>{cityCount}</span>
        </div>
        {/* Population */}
        <div className="rounded-xl p-2.5 flex flex-col items-center gap-0.5"
          style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.15)" }}>
          <span className="text-[11px] text-slate-500 font-bold ep-mono uppercase">Pop</span>
          <FlashStat value={nation.population || 0} className="text-xl font-black ep-mono text-violet-400">
            {pop >= 1_000_000
              ? `${(pop / 1_000_000).toFixed(2)}M`
              : pop >= 1_000
              ? `${(pop / 1_000).toFixed(1)}K`
              : pop}
          </FlashStat>
        </div>
      </div>

      {/* ── Treasury ── */}
      <div className="rounded-xl px-3 py-2.5 shrink-0"
        style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.14)" }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase">Treasury</div>
            <FlashStat value={Math.round(nation.currency || 0)} className="text-lg font-black ep-mono text-amber-400">
              {(nation.currency || 0).toLocaleString()} <span className="text-[11px] text-amber-600">{nation.currency_name || "Credits"}</span>
            </FlashStat>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase">GDP</div>
            <FlashStat value={Math.round(nation.gdp || 0)} className="text-lg font-black ep-mono text-green-400">
              {(nation.gdp || 0).toLocaleString()}
            </FlashStat>
          </div>
        </div>
        {/* Nation Stock Index — placed directly under Treasury */}
        <div className="flex justify-between items-center pt-2 border-t border-amber-500/10">
          <span className="text-[11px] text-slate-500 font-bold ep-mono uppercase">Stock Index</span>
          <span className="text-[15px] font-black ep-mono text-cyan-400 ep-glow-cyan">
            {Math.round((nation.gdp || 0) * (nation.stability || 75) / 100 * (nation.public_trust || 1)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Fuel Prices ── */}
      {(() => {
        const oilSupply  = Math.max(1, nation.res_oil || 0);
        const warMod     = (nation.at_war_with || []).length > 0 ? 1.25 : 1.0;
        const stability  = Math.max(0.1, (nation.stability || 75) / 100);
        const baseGas    = 2.80;
        // demand scales up with population, down with oil reserves
        const demandMod  = Math.max(0.75, 1 + (pop * 0.02 / 1000) - oilSupply * 0.0001);
        const gasPrice   = parseFloat((baseGas * demandMod * warMod * (1.5 - stability * 0.5)).toFixed(2));
        const dieselPrice = parseFloat((gasPrice * 1.15).toFixed(2)); // diesel always ~15% more
        return (
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
        );
      })()}

      {/* ── Natural Resources (moved above economy) ── */}
      <div className="shrink-0">
        <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase mb-2">NATURAL RESOURCES</div>
        <div className="grid grid-cols-3 gap-1.5">
          {RESOURCE_DEFS.map(({ key, label, resKey }) => {
            const val = nation[key] || 0;
            return (
              <ResourceCell key={key} label={label} resKey={resKey} value={val} />
            );
          })}
        </div>
      </div>

      {/* ── Income / Expense per tick (1 tick = 1 real min) ── */}
      <div className="rounded-xl px-3 py-2.5 shrink-0" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase">ECONOMY / MIN</div>
          <div className="text-[9px] text-slate-600 ep-mono">1 tick = 1 min</div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[11px] text-slate-500">Income</div>
            <div className="text-[14px] font-black ep-mono text-green-400">+{incomePerMin}</div>
            <div className="text-[9px] text-slate-600 ep-mono">cr/min</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Expense</div>
            <div className="text-[14px] font-black ep-mono text-red-400">-{spendingPerMin}</div>
            <div className="text-[9px] text-slate-600 ep-mono">cr/min</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Net</div>
            <div className={`text-[14px] font-black ep-mono ${netPerMin >= 0 ? "text-cyan-400" : "text-red-400"}`}>
              {netPerMin >= 0 ? "+" : ""}{netPerMin}
            </div>
            <div className="text-[9px] text-slate-600 ep-mono">cr/min</div>
          </div>
        </div>
      </div>

      {/* ── Food production / consumption per min ── */}
      <div className="rounded-xl px-3 py-2.5 shrink-0" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.10)" }}>
        <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase mb-2">FOOD / MIN</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[11px] text-slate-500">Produce</div>
            <div className="text-[14px] font-black ep-mono text-green-400">+{foodProd}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Consume</div>
            <div className="text-[14px] font-black ep-mono text-red-400">-{foodCons}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Net</div>
            <div className={`text-[14px] font-black ep-mono ${foodNet >= 0 ? "text-green-400" : "text-red-400"}`}>
              {foodNet >= 0 ? "+" : ""}{foodNet}
            </div>
          </div>
        </div>
      </div>

      {/* ── Housing Cap ── */}
      <div className="rounded-xl px-3 py-2.5 shrink-0" style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.12)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase">HOUSING CAPACITY</div>
          <div className="text-[11px] ep-mono font-black text-orange-400">{pop.toLocaleString()} / {(nation.housing_capacity || 20).toLocaleString()}</div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.round((pop / Math.max(1, nation.housing_capacity || 20)) * 100))}%`,
              background: pop >= (nation.housing_capacity || 20) * 0.9
                ? "linear-gradient(90deg, #f87171aa, #f87171)"
                : "linear-gradient(90deg, #fb923caa, #fb923c)",
              boxShadow: pop >= (nation.housing_capacity || 20) * 0.9 ? "0 0 6px #f8717155" : "0 0 6px #fb923c55"
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] ep-mono text-slate-600 mt-1">
          <span>Population</span>
          <span>{Math.min(100, Math.round((pop / Math.max(1, nation.housing_capacity || 20)) * 100))}% full</span>
        </div>
      </div>

      {/* ── Core Metrics ── */}
      <div className="shrink-0">
        <div className="text-[11px] text-slate-500 font-bold ep-mono uppercase mb-2">CORE METRICS</div>
        <div className="space-y-2.5">
          {CORE_METRICS.map(({ key, label, max, color, format }) => {
            const val = nation[key] ?? 0;
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

      {/* ── Military ── */}
      <div className="rounded-xl px-3 py-2.5 shrink-0 grid grid-cols-2 gap-3"
        style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)" }}>
        <div>
          <div className="text-[11px] text-slate-500 ep-mono uppercase">Spending</div>
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