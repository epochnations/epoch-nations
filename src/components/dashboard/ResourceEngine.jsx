import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { EPOCHS } from "../game/EpochConfig";
import { BUILDING_MAP } from "../game/BuildingConfig";
import { TICK_MS, TICKS_PER_DAY, WAR_DURATION_MS } from "../game/GameClock";

/**
 * ResourceEngine — headless component
 * Runs every game tick (60s real-time = 1 game tick).
 * 1. Worker-based resource production
 * 2. Food consumption (daily rate spread over ticks)
 * 3. Population growth / decline
 * 4. War expiry based on GameClock.WAR_DURATION_MS
 */
export default function ResourceEngine({ nation, onRefresh }) {
  // Use a ref to guard against React Strict Mode double-invocation
  const activeRef = useRef(false);
  // Track which resources have already triggered a cap warning (reset when resource drops below threshold)
  const warnedCap  = useRef(new Set()); // resources at hard cap
  const warnedNear = useRef(new Set()); // resources at 5000 near-cap

  useEffect(() => {
    if (!nation?.id) return;
    // Prevent duplicate loops — only one tick chain allowed per nation
    if (activeRef.current) return;
    activeRef.current = true;

    let timer;
    let alive = true;

    const schedule = () => {
      if (!alive) return;
      timer = setTimeout(async () => {
        if (!alive) return;
        await runTick();
        schedule(); // chain next tick only after current completes
      }, TICK_MS);
    };

    // First tick fires after 20s to allow data to load
    timer = setTimeout(async () => {
      if (!alive) return;
      await runTick();
      schedule();
    }, 20_000);

    return () => {
      alive = false;
      activeRef.current = false;
      clearTimeout(timer);
    };
  }, [nation?.id]);

  async function runTick() {
    const fresh = (await base44.entities.Nation.filter({ owner_email: nation.owner_email }))[0];
    if (!fresh) return;

    const epochIndex = EPOCHS.indexOf(fresh.epoch) || 0;
    const techMult = 1 + epochIndex * 0.08; // each epoch adds 8% efficiency

    const updates = {};
    const notifications = [];

    // --- PRODUCTION ---
    // Specialized worker-based production — each role produces ONE resource only
    // Lumberjack → Wood only
    const woodProd  = Math.floor((fresh.workers_lumberjacks  || 0) * 5 * techMult);
    // Stone Miner → Stone only
    const stoneProd = Math.floor((fresh.workers_quarry       || 0) * 4 * techMult);
    // Gold Miner → Gold only
    const goldProd  = Math.floor((fresh.workers_miners       || 0) * 2 * techMult);
    // Iron Miner → Iron only (Iron Age = index 2+)
    const ironProd  = epochIndex >= 2
      ? Math.floor((fresh.workers_iron_miners || 0) * 3 * techMult)
      : 0;
    // Oil Worker → Oil only (Industrial Age = index 6+)
    const oilProd   = epochIndex >= 6
      ? Math.floor((fresh.workers_oil_engineers || 0) * 6 * techMult)
      : 0;
    const farmFood = Math.floor((fresh.workers_farmers || 0) * 8 * techMult);
    const huntFood = Math.floor((fresh.workers_hunters || 0) * (3 + Math.random() * 4) * techMult);
    const fishFood = Math.floor((fresh.workers_fishermen || 0) * 6 * techMult);
    const totalFoodProd = farmFood + huntFood + fishFood;

    // Tech points from researchers + education + buildings
    let buildingTpBonus = 0;
    let buildingFoodBonus = 0;
    let nationBuildings_ = [];
    try {
      nationBuildings_ = await base44.entities.Building.filter({ nation_id: fresh.id });
      for (const b of nationBuildings_) {
        if (b.is_destroyed) continue;
        const def = BUILDING_MAP[b.building_type];
        if (def?.benefits?.tpBonus) buildingTpBonus += def.benefits.tpBonus;
        if (def?.benefits?.farmBonus) buildingFoodBonus += def.benefits.farmBonus;
      }
    } catch (_) {}

    // ── TECH POINTS — school/university count model ───────────────────────────
    const schoolCount = nationBuildings_.filter(b => !b.is_destroyed && b.building_type === "school").length;
    const uniCount    = nationBuildings_.filter(b => !b.is_destroyed && b.building_type === "university").length;
    // Other buildings (science_academy, cyber_command, etc.) still contribute via tpBonus
    const otherBuildingTP = nationBuildings_
      .filter(b => !b.is_destroyed && b.building_type !== "school" && b.building_type !== "university")
      .reduce((sum, b) => sum + (BUILDING_MAP[b.building_type]?.benefits?.tpBonus || 0), 0);
    const researchFundingBonus = (fresh.education_spending || 20) * 0.1;
    const techGain = Math.floor(
      schoolCount * 1 +
      uniCount    * 4 +
      (fresh.population || 1) * 0.001 +
      researchFundingBonus +
      otherBuildingTP
    );

    // --- CONSUMPTION ---
    // Daily food consumption spread evenly across ticks per game day
    // 1 game day = TICKS_PER_DAY ticks; citizens consume daily_need / TICKS_PER_DAY per tick
    const pop = fresh.population || 1;
    const dailyFoodNeed  = pop * 1.2 * TICKS_PER_DAY; // total daily need
    const foodConsumption = Math.ceil(dailyFoodNeed / TICKS_PER_DAY); // per-tick portion (= pop * 1.2)

    // --- NET FOOD ---
    const netFood = totalFoodProd - foodConsumption;
    const newFood = Math.max(0, (fresh.res_food || 0) + netFood);

    // ── WAREHOUSE STORAGE CAPS ────────────────────────────────────────────────
    // Natural storage: 5,000 | Grace overflow: 6,000 | Warehouse expands beyond 6,000
    const OVERFLOW_CAP = 6000; // max without any warehouse

    let warehouseCap = 0;
    for (const b of nationBuildings_) {
      if (b.is_destroyed) continue;
      if (b.building_type === "warehouse_small")       warehouseCap += 5000;
      if (b.building_type === "warehouse_industrial")  warehouseCap += 25000;
      if (b.building_type === "warehouse_strategic")   warehouseCap += 100000;
    }

    const totalStorageCap = OVERFLOW_CAP + warehouseCap;

    // Apply cap: excess above OVERFLOW_CAP moves to warehouse if space exists,
    // otherwise is discarded. Result is clamped to totalStorageCap.
    function capResource(rawNewVal) {
      return Math.min(totalStorageCap, Math.max(0, rawNewVal));
    }

    updates.res_wood  = capResource((fresh.res_wood  || 0) + woodProd);
    updates.res_stone = capResource((fresh.res_stone || 0) + stoneProd);
    updates.res_gold  = capResource((fresh.res_gold  || 0) + goldProd);
    updates.res_iron  = capResource((fresh.res_iron  || 0) + ironProd);
    updates.res_oil   = capResource((fresh.res_oil   || 0) + oilProd);
    updates.res_food  = capResource(Math.max(0, (fresh.res_food || 0) + netFood + buildingFoodBonus));
    // ── TECH POINT STORAGE CAP ──────────────────────────────────────────────
    // Each education building has a TP storage capacity:
    // School: 1,000 | College: 3,000 | University: 6,000
    const schoolCount_ = nationBuildings_.filter(b => !b.is_destroyed && b.building_type === "school").length;
    const collegeCount = nationBuildings_.filter(b => !b.is_destroyed && b.building_type === "college").length;
    const uniCount_    = nationBuildings_.filter(b => !b.is_destroyed && b.building_type === "university").length;
    const tpStorageCap = 500  // base capacity (no buildings)
      + schoolCount_ * 1000
      + collegeCount * 3000
      + uniCount_    * 6000;
    updates.tech_points = Math.min(tpStorageCap, (fresh.tech_points || 0) + techGain);

    // ── STORAGE WARNINGS ─────────────────────────────────────────────────────
    // Warn at 5,000 (natural cap); hard cap at 6,000 + warehouse
    const resKeys = ["res_wood","res_stone","res_gold","res_iron","res_oil","res_food"];
    let warnedThisTick = false;
    for (const key of resKeys) {
      const val = updates[key] ?? (fresh[key] || 0);
      if (!warnedThisTick && val >= totalStorageCap) {
        const resourceName = key.replace("res_", "").toUpperCase();
        const isNaturalCap = warehouseCap === 0;
        notifications.push({
          type: "market_crash", is_read: false,
          title: `🏗️ ${resourceName} Storage Full — Excess Removed`,
          message: isNaturalCap
            ? `${resourceName} hit the natural cap of 6,000 units. Excess has been discarded. Build a Warehouse (Small, Industrial, or Strategic) to expand your storage capacity!`
            : `${resourceName} hit your storage cap of ${totalStorageCap.toLocaleString()} units. Excess has been discarded. Build more Warehouses to expand further!`,
          severity: "warning",
        });
        warnedThisTick = true;
      } else if (!warnedThisTick && val >= 5000) {
        notifications.push({
          type: "market_crash", is_read: false,
          title: `📦 ${key.replace("res_","").toUpperCase()} Nearing Natural Cap (5,000)`,
          message: `You are approaching the 6,000 unit natural storage limit. Build a Warehouse to expand capacity or sell your surplus on the market.`,
          severity: "info",
        });
        warnedThisTick = true;
      }
    }

    // --- POPULATION GROWTH / DECLINE ---
    const hasHousingRoom = pop < (fresh.housing_capacity || 20);
    const hasFoodSurplus = netFood > 0;
    const stability = fresh.stability || 75;
    const hasGoodStability = stability >= 30;

    if (hasFoodSurplus && hasHousingRoom && hasGoodStability && Math.random() < 0.3) {
      // 30% chance of pop growth each tick when conditions are met
      updates.population = pop + 1;
    } else if (netFood < 0 && newFood === 0) {
      // FAMINE — population shrinks
      if (Math.random() < 0.5) {
        updates.population = Math.max(1, pop - 1);
        updates.stability = Math.max(0, stability - 3);
        updates.public_trust = Math.max(0.1, (fresh.public_trust || 1.0) - 0.05);
        notifications.push({
          type: "market_crash",
          title: "🌾 FAMINE WARNING!",
          message: "Your people are starving. Population declining. Assign more farmers or hunters!",
          severity: "danger",
          is_read: false
        });
      }
    } else if (stability < 20 && Math.random() < 0.2) {
      // Civil unrest — pop decline
      updates.population = Math.max(1, pop - 1);
      notifications.push({
        type: "market_crash",
        title: "⚡ CIVIL UNREST",
        message: "Low stability is causing citizens to flee. Raise stability above 20 to halt decline.",
        severity: "warning",
        is_read: false
      });
    }

    // War reduces population
    if ((fresh.at_war_with || []).length > 0 && Math.random() < 0.15) {
      const warPop = updates.population ?? pop;
      updates.population = Math.max(1, warPop - 1);
    }

    // --- WAR AUTO-RESET after 1 game week (WAR_DURATION_MS = 3.5 real hours) ---
    if ((fresh.at_war_with || []).length > 0 && fresh.war_started_at) {
      const warAge = Date.now() - new Date(fresh.war_started_at).getTime();
      if (warAge > WAR_DURATION_MS) {
        updates.at_war_with = [];
        updates.war_started_at = "";
        notifications.push({
          type: "war_declared",
          title: "☮️ WAR EXPIRED",
          message: "Your conflict has expired after 1 game week. Peace has been restored.",
          severity: "info",
          is_read: false
        });
      }
    }

    // GDP and treasury are now fully managed by CivilizationEconomyEngine.
    // ResourceEngine only handles physical production & population.

    // --- WAR STABILITY DRAIN (gradual: −1% per tick while at war) ---
    if ((fresh.at_war_with || []).length > 0) {
      updates.stability = Math.max(0, (updates.stability ?? (fresh.stability || 75)) - 1);
    }

    await base44.entities.Nation.update(fresh.id, updates);

    for (const n of notifications) {
      await base44.entities.Notification.create({
        target_owner_email: fresh.owner_email,
        target_nation_id: fresh.id,
        ...n
      });
    }

    onRefresh?.();
  }

  return null;
}