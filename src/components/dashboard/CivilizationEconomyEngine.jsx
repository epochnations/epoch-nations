import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS, TICKS_PER_DAY } from "../game/GameClock";

/**
 * CivilizationEconomyEngine — headless simulation component
 *
 * TIME: 1 tick = 60s real | 1 game-day = 30 ticks (30 real minutes)
 *
 * Simulates per tick:
 * - Social class distribution & citizen spending (daily amounts / TICKS_PER_DAY)
 * - Unemployment effects
 * - GDP formula: (Pop×DailySpend) + IndustryOutput + GovSpend + TradeBalance
 * - Money Supply = CitizenCurrency + BusinessCapital + GovTreasury + BankLending
 * - Inflation: (MoneySupplyGrowth − ProductionGrowth) / 6
 * - Inflation effects on consumption cost, construction, resource prices
 * - Tax system: income, sales, corporate, tariff
 * - Currency stability score
 * - National Wealth = GDP + Infra + Resources + Corp Market Cap
 */

const EPOCHS = ["Stone Age","Copper Age","Bronze Age","Iron Age","Dark Ages",
  "Middle Ages","Renaissance","Imperial Age","Enlightenment Age","Industrial Age",
  "Modern Age","Atomic Age","Digital Age","Genetic Age","Synthetic Age","Nano Age"];

// Daily spending by social class (credits/day)
const DAILY_SPEND = { low: 2.0, middle: 2.74, upper: 4.5 };
// Per-tick share: 1 game day = TICKS_PER_DAY ticks (30 ticks = 30 real minutes)
const TICK_SPEND  = {
  low:    DAILY_SPEND.low    / TICKS_PER_DAY,
  middle: DAILY_SPEND.middle / TICKS_PER_DAY,
  upper:  DAILY_SPEND.upper  / TICKS_PER_DAY,
};

// Wage multipliers × daily spending
const WAGE_MULT = { low: 2.5, middle: 3.88, upper: 5.66 };

function getClassDistribution(educationLevel) {
  const upper  = Math.min(0.25, educationLevel / 400);
  const middle = Math.min(0.55, educationLevel / 182);
  const low    = Math.max(0.20, 1 - upper - middle);
  return { low, middle, upper };
}

export default function CivilizationEconomyEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);
  // Track previous money supply for growth rate calculation
  const prevMoneySupplyRef = useRef(null);
  const prevProductionRef  = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;
    const first = setTimeout(() => runTick(), 30_000);
    intervalRef.current = setInterval(() => runTick(), TICK_MS);
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
    const epochIndex = Math.max(0, EPOCHS.indexOf(fresh.epoch));
    const techLevel  = 1 + epochIndex * 0.08;

    // ── SOCIAL CLASSES ───────────────────────────────────────────
    const eduLevel  = Math.min(100, fresh.education_spending || 20);
    const dist      = getClassDistribution(eduLevel);
    const popLow    = Math.floor(pop * dist.low);
    const popMiddle = Math.floor(pop * dist.middle);
    const popUpper  = pop - popLow - popMiddle;

    // ── UNEMPLOYMENT ─────────────────────────────────────────────
    const workforce     = Math.floor(pop * 0.60);
    const totalWorkers  =
      (fresh.workers_farmers      || 0) + (fresh.workers_hunters       || 0) +
      (fresh.workers_fishermen    || 0) + (fresh.workers_builders      || 0) +
      (fresh.workers_lumberjacks  || 0) + (fresh.workers_quarry        || 0) +
      (fresh.workers_miners       || 0) + (fresh.workers_oil_engineers || 0) +
      (fresh.workers_soldiers     || 0) + (fresh.workers_researchers   || 0) +
      (fresh.workers_industrial   || 0);

    const unemployed       = Math.max(0, workforce - totalWorkers);
    const unemploymentRate = workforce > 0 ? (unemployed / workforce) * 100 : 0;
    const employmentFactor = Math.max(0.5, 1 - unemploymentRate / 200);

    // ── CITIZEN SPENDING / WAGES ──────────────────────────────────
    const tickSpendTotal =
      (popLow * TICK_SPEND.low + popMiddle * TICK_SPEND.middle + popUpper * TICK_SPEND.upper)
      * employmentFactor;

    const wagePerTick =
      popLow    * WAGE_MULT.low    * TICK_SPEND.low  +
      popMiddle * WAGE_MULT.middle * TICK_SPEND.middle +
      popUpper  * WAGE_MULT.upper  * TICK_SPEND.upper;

    // ── PRODUCTION OUTPUT ─────────────────────────────────────────
    // Production Output = Workers × Efficiency × TechLevel
    const efficiency     = Math.min(1.5, (fresh.manufacturing || 50) / 100 + 0.5);
    const productionTick = totalWorkers * efficiency * techLevel * 0.1;

    // ── TAX SYSTEM ───────────────────────────────────────────────
    // All four tax types; defaults if not set
    const taxRates = fresh.tax_rates || {};
    const incomeTaxRate    = Math.min(0.50, (taxRates.income    ?? 15) / 100);
    const salesTaxRate     = Math.min(0.30, (taxRates.sales     ??  8) / 100);
    const corpTaxRate      = Math.min(0.40, (taxRates.corporate ?? 12) / 100);
    const tariffRate       = Math.min(0.30, (taxRates.tariff    ??  5) / 100);

    // Income tax on wages
    const incomeTaxTick  = wagePerTick * incomeTaxRate;
    // Sales tax on citizen spending
    const salesTaxTick   = tickSpendTotal * salesTaxRate;
    // Corporate tax on business capital (production revenue proxy)
    const corpTaxTick    = productionTick * corpTaxRate;

    // ── TRADE BALANCE + TARIFF REVENUE ──────────────────────────
    let exportValue = 0, importValue = 0;
    try {
      const routes = await base44.entities.TradeRoute.filter({ owner_email: fresh.owner_email });
      for (const r of routes) {
        if (r.status !== "active") continue;
        const tickVal = (r.price_per_100 / 100) * (r.quantity_per_cycle / TICKS_PER_DAY);
        if (r.direction === "export") exportValue += tickVal;
        else importValue += tickVal;
      }
    } catch (_) {}

    // Tariff revenue applies to imports
    const tariffRevTick = importValue * tariffRate;
    const tradeBalance  = exportValue - importValue;

    // Total tax revenue this tick
    const totalTaxTick = incomeTaxTick + salesTaxTick + corpTaxTick + tariffRevTick;

    // ── GOVERNMENT SPENDING ───────────────────────────────────────
    // Injects money: infra + military + research + subsidies
    const govSpendTick =
      ((fresh.education_spending || 20) +   // research funding
       (fresh.military_spending  || 20)) * 0.002;

    // ── MONEY SUPPLY ─────────────────────────────────────────────
    // M = CitizenCurrency + BusinessCapital + GovTreasury + BankLending
    const citizenCurrency  = pop * wagePerTick * 10;           // proxy: pop × avg wage pool
    const businessCapital  = productionTick * TICKS_PER_DAY * 0.4; // business retains 40% of daily output
    const govTreasury      = fresh.currency || 500;
    const bankLending      = govTreasury * 0.3 * (fresh.stability / 100 || 0.75); // fractional reserve proxy
    const moneySupply      = citizenCurrency + businessCapital + govTreasury + bankLending;

    // ── INFLATION MODEL ──────────────────────────────────────────
    // Inflation Pressure = MoneySupplyGrowth − ProductionGrowth
    // Final Inflation% = Pressure / 6
    const prevMS   = prevMoneySupplyRef.current ?? moneySupply;
    const prevProd = prevProductionRef.current  ?? productionTick;
    const msGrowth   = prevMS   > 0 ? (moneySupply   - prevMS)   / prevMS   : 0;
    const prodGrowth = prevProd > 0 ? (productionTick - prevProd) / prevProd : 0;
    const inflationPressure = msGrowth - prodGrowth;
    const rawInflation = (inflationPressure / 6) * 100; // as percentage

    // Smooth toward new value (avoid wild swings)
    const currentInflation = fresh.inflation_rate ?? 0;
    const newInflation = parseFloat(
      (currentInflation + (rawInflation - currentInflation) * 0.05).toFixed(3)
    );

    prevMoneySupplyRef.current = moneySupply;
    prevProductionRef.current  = productionTick;

    // Inflation clamp: -5% to +25%
    const clampedInflation = Math.max(-5, Math.min(25, newInflation));

    // ── INFLATION EFFECTS ─────────────────────────────────────────
    // - citizen consumption cost rises (reduce purchasing power)
    // - construction costs rise (tracked as a multiplier)
    // - resource prices rise
    const inflationMult       = 1 + clampedInflation / 100;
    const adjustedTickSpend   = tickSpendTotal * inflationMult;    // citizens effectively spend more
    const constructionCostMod = inflationMult;                     // surfaces to UI components
    // Resource price impact stored as a modifier on nation
    const resourcePriceMod    = parseFloat(inflationMult.toFixed(4));

    // ── GDP FORMULA ───────────────────────────────────────────────
    // GDP = (Pop×DailySpend) + IndustryOutput + GovSpend + TradeBalance
    const dailyPopSpend = (popLow * DAILY_SPEND.low + popMiddle * DAILY_SPEND.middle + popUpper * DAILY_SPEND.upper) * employmentFactor;
    const dailyIndustry = productionTick * 1440;
    const dailyGovSpend = govSpendTick   * 1440;
    const dailyTrade    = tradeBalance   * 1440;

    const targetGDP = Math.max(100, dailyPopSpend + dailyIndustry + dailyGovSpend + dailyTrade);
    const currentGDP = fresh.gdp || 500;
    const newGDP     = Math.round(currentGDP + (targetGDP - currentGDP) * 0.02);

    // GDP growth rate (for currency stability)
    const gdpGrowthRate = currentGDP > 0 ? (newGDP - currentGDP) / currentGDP : 0;

    // ── TREASURY UPDATE ───────────────────────────────────────────
    // Taxes add money, government spending & war remove it
    // Baseline GDP dividend: 0.1% of GDP per tick ensures visible credit flow
    const gdpDividendTick = (fresh.gdp || 500) * 0.001;
    const netTreasury     = totalTaxTick - govSpendTick + gdpDividendTick;
    let   newCurrency     = Math.max(0, (fresh.currency || 500) + netTreasury);

    // Exports bring currency in, imports take it out
    newCurrency = Math.max(0, newCurrency + tradeBalance);

    // War drain
    if ((fresh.at_war_with || []).length > 0) {
      newCurrency = Math.max(0, newCurrency - (fresh.military_spending || 20) * 0.1);
    }

    // ── CURRENCY STABILITY ────────────────────────────────────────
    // Stability = f(GDP growth, inflation, national wealth, trade balance, investor confidence)
    const investorConfidence = Math.min(1.0, (fresh.public_trust || 1.0));
    const inflationPenalty   = Math.max(0, clampedInflation) / 25;          // 0–1 as inflation 0→25%
    const tradeBonus         = tradeBalance > 0 ? Math.min(0.1, tradeBalance / 1000) : tradeBalance / 500;
    const wealthFactor       = Math.min(0.2, (fresh.national_wealth || 500) / 50000);

    const targetStability =
      0.5                          // base
      + gdpGrowthRate * 2          // GDP growth lifts stability
      - inflationPenalty * 0.4     // high inflation erodes it
      + wealthFactor               // larger economy = more stability
      + tradeBonus                 // positive trade helps
      + investorConfidence * 0.3;  // trust matters

    const currentCurrencyStability = fresh.currency_stability ?? 1.0;
    const newCurrencyStability = parseFloat(
      Math.max(0.1, Math.min(2.0,
        currentCurrencyStability + (targetStability - currentCurrencyStability) * 0.03
      )).toFixed(4)
    );

    // ── NATIONAL WEALTH ───────────────────────────────────────────
    const infraValue       = (fresh.infrastructure_level || 0) * 50;
    const resourceReserves =
      (fresh.res_wood  || 0) * 0.5 * resourcePriceMod +
      (fresh.res_stone || 0) * 0.4 * resourcePriceMod +
      (fresh.res_gold  || 0) * 5   * resourcePriceMod +
      (fresh.res_iron  || 0) * 2   * resourcePriceMod +
      (fresh.res_oil   || 0) * 8   * resourcePriceMod;

    let corpMarketCap = 0;
    try {
      const stocks = await base44.entities.Stock.filter({ nation_id: fresh.id });
      corpMarketCap = stocks.reduce((sum, s) => sum + (s.market_cap || 0), 0);
    } catch (_) {}

    const nationalWealth = Math.round(newGDP + infraValue + resourceReserves + corpMarketCap);

    // ── STABILITY / TRUST — unemployment penalty ──────────────────
    const updates = {
      gdp:                newGDP,
      gdp_prev_tick:      currentGDP,
      currency:           Math.round(newCurrency),
      national_wealth:    nationalWealth,
      unemployment_rate:  Math.round(unemploymentRate * 10) / 10,
      inflation_rate:     clampedInflation,
      money_supply:       Math.round(moneySupply),
      currency_stability: newCurrencyStability,
      trade_balance:      parseFloat((tradeBalance * 1440).toFixed(2)),
      resource_price_mod: resourcePriceMod,
      construction_cost_mod: parseFloat(constructionCostMod.toFixed(4)),
    };

    if (unemploymentRate > 20) {
      const penalty = (unemploymentRate - 20) / 200;
      updates.stability    = Math.max(0,   (fresh.stability    || 75)  - penalty * 10);
      updates.public_trust = Math.max(0.1, (fresh.public_trust || 1.0) - penalty * 0.02);
    }

    // High inflation also erodes trust and stability
    if (clampedInflation > 5) {
      const inflPenalty = (clampedInflation - 5) / 100;
      updates.stability    = Math.max(0,   (updates.stability    ?? (fresh.stability    || 75))  - inflPenalty * 5);
      updates.public_trust = Math.max(0.1, (updates.public_trust ?? (fresh.public_trust || 1.0)) - inflPenalty * 0.01);
    }

    await base44.entities.Nation.update(fresh.id, updates);
    onRefresh?.();
  }

  return null;
}