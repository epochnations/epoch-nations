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
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;
    const firstTick = setTimeout(() => runTick(), 20_000);
    intervalRef.current = setInterval(() => runTick(), TICK_MS);
    return () => {
      clearTimeout(firstTick);
      clearInterval(intervalRef.current);
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
    // Worker-based production
    const woodProd = Math.floor((fresh.workers_lumberjacks || 0) * 5 * techMult);
    const stoneProd = Math.floor((fresh.workers_quarry || 0) * 4 * techMult);
    const goldProd = Math.floor((fresh.workers_miners || 0) * 2 * techMult);
    // Iron: available from Iron Age+
    const ironProd = epochIndex >= 3
      ? Math.floor((fresh.workers_miners || 0) * 3 * techMult)
      : 0;
    const oilProd = epochIndex >= 9 // Industrial Age+
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

    const techGain = Math.floor(
      (fresh.workers_researchers || 0) * 2 * techMult +
      (fresh.education_spending || 0) * 0.3 +
      buildingTpBonus
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
    // Natural cap: 5000  | Soft buffer: 6000 | Warehouse expands cap
    const NATURAL_CAP  = 5000;
    const OVERFLOW_CAP = 6000;

    let warehouseCap = 0;
    try {
      const nationBuildings = nationBuildings_ || await base44.entities.Building.filter({ nation_id: fresh.id });
      for (const b of nationBuildings) {
        if (b.is_destroyed) continue;
        if (b.building_type === "warehouse_small")    warehouseCap += 5000;
        if (b.building_type === "warehouse_industrial") warehouseCap += 25000;
        if (b.building_type === "warehouse_strategic")  warehouseCap += 100000;
      }
    } catch (_) {}

    const storageCap = OVERFLOW_CAP + warehouseCap;

    function capResource(current, added) {
      const newVal = current + added;
      if (newVal > storageCap) return storageCap; // hard cap — excess lost
      return newVal;
    }

    updates.res_wood  = Math.max(0, capResource(fresh.res_wood  || 0, woodProd));
    updates.res_stone = Math.max(0, capResource(fresh.res_stone || 0, stoneProd));
    updates.res_gold  = Math.max(0, capResource(fresh.res_gold  || 0, goldProd));
    updates.res_iron  = Math.max(0, capResource(fresh.res_iron  || 0, ironProd));
    updates.res_oil   = Math.max(0, capResource(fresh.res_oil   || 0, oilProd));
    updates.res_food  = Math.max(0, capResource((fresh.res_food || 0) + netFood, buildingFoodBonus));
    updates.tech_points = Math.min(99999, (fresh.tech_points || 0) + techGain);

    // ── STORAGE WARNINGS ─────────────────────────────────────────────────────
    const resKeys = ["res_wood","res_stone","res_gold","res_iron","res_oil","res_food"];
    for (const key of resKeys) {
      const val = updates[key] ?? (fresh[key] || 0);
      if (val >= storageCap && storageCap > 0) {
        notifications.push({
          type: "market_crash", is_read: false,
          title: "⚠️ Storage Exceeded",
          message: `${key.replace("res_","").toUpperCase()} storage is full (${storageCap.toLocaleString()} cap). Build warehouses or sell surplus — production is being lost!`,
          severity: "warning",
        });
        break; // one warning per tick is enough
      } else if (val >= NATURAL_CAP && val < storageCap && warehouseCap === 0) {
        notifications.push({
          type: "market_crash", is_read: false,
          title: "📦 Storage Nearing Capacity",
          message: `${key.replace("res_","").toUpperCase()} is at ${val.toLocaleString()} units. Natural cap is 5,000. Build a Warehouse or sell surplus soon.`,
          severity: "info",
        });
        break;
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