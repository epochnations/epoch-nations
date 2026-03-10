import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * CivilizationEconomyEngine — headless simulation component
 *
 * TIME: 1 tick = 60 seconds real-time
 *       1 game-day = 1440 ticks
 *
 * Runs every 60s and simulates:
 * - Citizen spending by social class
 * - Unemployment and its effects
 * - GDP formula: (Pop × DailySpend) + IndustryOutput + GovSpend + (Exports - Imports)
 * - National Wealth = GDP + Infrastructure + Resources + Corporate Market Value
 * - Wage/class-based tax revenue
 * - Spending approval impact
 */

// Spending per day by social class (credits)
const DAILY_SPEND = { low: 2.0, middle: 2.74, upper: 4.5 };

// Per-tick spending = daily / 1440
const TICK_SPEND = {
  low:    DAILY_SPEND.low    / 1440,
  middle: DAILY_SPEND.middle / 1440,
  upper:  DAILY_SPEND.upper  / 1440,
};

// Spending distribution
const SPEND_DIST = {
  food:          0.30,
  housing:       0.30,
  transport:     0.10,
  utilities:     0.10,
  entertainment: 0.10,
  goods:         0.10,
};

// Wage multipliers (× daily spending to derive daily wage)
const WAGE_MULT = { low: 2.5, middle: 3.88, upper: 5.66 };

// Education → class mapping (used to derive class distribution from education_spending)
function getClassDistribution(educationLevel) {
  // educationLevel 0–100 proxy
  const upper  = Math.min(0.25, educationLevel / 400);       // up to 25%
  const middle = Math.min(0.55, educationLevel / 182);       // up to 55%
  const low    = Math.max(0.20, 1 - upper - middle);
  return { low, middle, upper };
}

export default function CivilizationEconomyEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;
    // First tick after 30s, then every 60s
    const first = setTimeout(() => runTick(), 30_000);
    intervalRef.current = setInterval(() => runTick(), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(intervalRef.current);
    };
  }, [nation?.id]);

  async function runTick() {
    const nations = await base44.entities.Nation.filter({ owner_email: nation.owner_email });
    const fresh = nations[0];
    if (!fresh) return;

    const pop        = Math.max(1, fresh.population || 1);
    const epochIndex = Math.max(0, ["Stone Age","Copper Age","Bronze Age","Iron Age","Dark Ages",
      "Middle Ages","Renaissance","Imperial Age","Enlightenment Age","Industrial Age","Modern Age",
      "Atomic Age","Digital Age","Genetic Age","Synthetic Age","Nano Age"].indexOf(fresh.epoch));
    const techLevel  = 1 + epochIndex * 0.08;

    // ── SOCIAL CLASSES ──────────────────────────────────────────
    const eduLevel   = Math.min(100, fresh.education_spending || 20);
    const dist       = getClassDistribution(eduLevel);
    const popLow     = Math.floor(pop * dist.low);
    const popMiddle  = Math.floor(pop * dist.middle);
    const popUpper   = pop - popLow - popMiddle;

    // ── UNEMPLOYMENT ────────────────────────────────────────────
    const workforce = Math.floor(pop * 0.60);
    const totalWorkers =
      (fresh.workers_farmers       || 0) +
      (fresh.workers_hunters        || 0) +
      (fresh.workers_fishermen      || 0) +
      (fresh.workers_builders       || 0) +
      (fresh.workers_lumberjacks    || 0) +
      (fresh.workers_quarry         || 0) +
      (fresh.workers_miners         || 0) +
      (fresh.workers_oil_engineers  || 0) +
      (fresh.workers_soldiers       || 0) +
      (fresh.workers_researchers    || 0) +
      (fresh.workers_industrial     || 0);

    const unemployed      = Math.max(0, workforce - totalWorkers);
    const unemploymentRate = workforce > 0 ? (unemployed / workforce) * 100 : 0;

    // Unemployment dampens spending
    const employmentFactor = Math.max(0.5, 1 - unemploymentRate / 200);

    // ── CITIZEN SPENDING THIS TICK ───────────────────────────────
    const tickSpendTotal =
      (popLow    * TICK_SPEND.low  +
       popMiddle * TICK_SPEND.middle +
       popUpper  * TICK_SPEND.upper) * employmentFactor;

    // ── WAGE INCOME (what citizens earn → taxable base) ──────────
    const wagePerTick =
      popLow    * WAGE_MULT.low    * TICK_SPEND.low  +
      popMiddle * WAGE_MULT.middle * TICK_SPEND.middle +
      popUpper  * WAGE_MULT.upper  * TICK_SPEND.upper;

    // ── PRODUCTION OUTPUT ────────────────────────────────────────
    // Production Output = Workers × Efficiency × TechLevel
    const efficiency    = Math.min(1.5, (fresh.manufacturing || 50) / 100 + 0.5);
    const industryOutput = totalWorkers * efficiency * techLevel * 0.1; // scaled to credits/tick

    // ── GOVERNMENT SPENDING (education + military → stimulus) ───
    const govSpendPerTick =
      ((fresh.education_spending || 20) + (fresh.military_spending || 20)) * 0.002;

    // ── TRADE BALANCE (tick-level approximation) ─────────────────
    // We'll use trade routes if available, else approximate from resources
    let exportValue = 0, importValue = 0;
    try {
      const routes = await base44.entities.TradeRoute.filter({ owner_email: fresh.owner_email });
      for (const r of routes) {
        if (r.status !== "active") continue;
        const tickValue = (r.price_per_100 / 100) * (r.quantity_per_cycle / 1440);
        if (r.direction === "export") exportValue += tickValue;
        else importValue += tickValue;
      }
    } catch (_) {}

    const tradeBalance = exportValue - importValue;

    // ── GDP FORMULA ──────────────────────────────────────────────
    // GDP = (Pop × DailySpend) + IndustryOutput + GovSpend + (X - M)
    // We accumulate per-tick contributions and project to daily equivalent
    const dailyPopSpend = (popLow * DAILY_SPEND.low + popMiddle * DAILY_SPEND.middle + popUpper * DAILY_SPEND.upper) * employmentFactor;
    const dailyIndustry  = industryOutput * 1440;
    const dailyGovSpend  = govSpendPerTick * 1440;
    const dailyTrade     = tradeBalance * 1440;

    // Target GDP (smooth toward it rather than snap)
    const targetGDP = Math.max(100,
      dailyPopSpend + dailyIndustry + dailyGovSpend + dailyTrade
    );
    const currentGDP = fresh.gdp || 500;
    // Smooth convergence: move 2% per tick toward target
    const newGDP = Math.round(currentGDP + (targetGDP - currentGDP) * 0.02);

    // ── TAX REVENUE THIS TICK ────────────────────────────────────
    const taxRate = Math.min(0.40, (fresh.tax_rates?.income || 15) / 100);
    const taxRevenue = wagePerTick * taxRate;

    // ── TREASURY INCOME ──────────────────────────────────────────
    const govDrain     = govSpendPerTick;
    const netTreasury  = taxRevenue - govDrain;
    const newCurrency  = Math.max(0, (fresh.currency || 500) + netTreasury);

    // ── NATIONAL WEALTH ──────────────────────────────────────────
    // NW = GDP + InfraValue + ResourceReserves + CorporateMarketValue
    const infraValue      = (fresh.infrastructure_level || 0) * 50;
    const resourceReserves =
      (fresh.res_wood  || 0) * 0.5 +
      (fresh.res_stone || 0) * 0.4 +
      (fresh.res_gold  || 0) * 5 +
      (fresh.res_iron  || 0) * 2 +
      (fresh.res_oil   || 0) * 8;

    let corpMarketCap = 0;
    try {
      const stocks = await base44.entities.Stock.filter({ nation_id: fresh.id });
      corpMarketCap = stocks.reduce((sum, s) => sum + (s.market_cap || 0), 0);
    } catch (_) {}

    const nationalWealth = Math.round(newGDP + infraValue + resourceReserves + corpMarketCap);

    // ── STABILITY / TRUST IMPACT FROM UNEMPLOYMENT ───────────────
    const updates = {
      gdp:           newGDP,
      currency:      Math.round(newCurrency),
      national_wealth: nationalWealth,
      unemployment_rate: Math.round(unemploymentRate * 10) / 10,
    };

    if (unemploymentRate > 20) {
      const penalty = (unemploymentRate - 20) / 200;
      updates.stability   = Math.max(0,   (fresh.stability    || 75)  - penalty * 10);
      updates.public_trust = Math.max(0.1, (fresh.public_trust || 1.0) - penalty * 0.02);
    }

    // ── WAR DRAIN ON CURRENCY ────────────────────────────────────
    if ((fresh.at_war_with || []).length > 0) {
      updates.currency = Math.max(0, (updates.currency || newCurrency) - (fresh.military_spending || 20) * 0.1);
    }

    await base44.entities.Nation.update(fresh.id, updates);
    onRefresh?.();
  }

  return null;
}