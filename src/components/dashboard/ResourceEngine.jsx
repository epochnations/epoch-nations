import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { EPOCHS } from "../game/EpochConfig";
import { BUILDING_MAP } from "../game/BuildingConfig";

/**
 * ResourceEngine — headless component
 * Runs every 60s to simulate:
 * 1. Worker-based resource production (wood, stone, gold, oil, food)
 * 2. Food consumption by population
 * 3. Population growth / decline based on food surplus & housing
 * 4. Notifications for famine, shortages
 */
export default function ResourceEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;
    const firstTick = setTimeout(() => runTick(), 20_000);
    intervalRef.current = setInterval(() => runTick(), 90_000);
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
    try {
      const nationBuildings = await base44.entities.Building.filter({ nation_id: fresh.id });
      for (const b of nationBuildings) {
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
    const pop = fresh.population || 1;
    const foodConsumption = Math.ceil(pop * 1.2); // each person eats 1.2 food/min

    // --- NET FOOD ---
    const netFood = totalFoodProd - foodConsumption;
    const newFood = Math.max(0, (fresh.res_food || 0) + netFood);

    updates.res_wood = Math.min(99999, (fresh.res_wood || 0) + woodProd);
    updates.res_stone = Math.min(99999, (fresh.res_stone || 0) + stoneProd);
    updates.res_gold = Math.min(99999, (fresh.res_gold || 0) + goldProd);
    updates.res_iron = Math.min(99999, (fresh.res_iron || 0) + ironProd);
    updates.res_oil = Math.min(99999, (fresh.res_oil || 0) + oilProd);
    updates.res_food = Math.max(0, newFood + buildingFoodBonus);
    updates.tech_points = Math.min(99999, (fresh.tech_points || 0) + techGain);

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

    // --- WAR AUTO-RESET after 30 minutes of inactivity ---
    if ((fresh.at_war_with || []).length > 0 && fresh.war_started_at) {
      const warAge = Date.now() - new Date(fresh.war_started_at).getTime();
      if (warAge > 30 * 60 * 1000) {
        updates.at_war_with = [];
        updates.war_started_at = "";
        notifications.push({
          type: "war_declared",
          title: "☮️ WAR EXPIRED",
          message: "Your conflict has expired after 30 minutes of inactivity. Peace has been restored.",
          severity: "info",
          is_read: false
        });
      }
    }

    // --- GDP from workers ---
    const industrialBoost = Math.floor((fresh.workers_industrial || 0) * 10 * techMult);
    updates.gdp = Math.min(100000, (fresh.gdp || 500) + industrialBoost + Math.floor((fresh.manufacturing || 50) * 0.005));

    // --- TREASURY INCOME ACCUMULATION (fix: actually add income each tick) ---
    const incomePerMin = Math.floor((updates.gdp || fresh.gdp || 500) * 0.05);
    // Tick runs every 90s ≈ 1.5 min, so multiply income accordingly
    const tickIncome = Math.round(incomePerMin * 1.5);
    // Spending deduction: education + military spending drains treasury
    const spendingDrain = Math.round(
      ((fresh.education_spending || 20) + (fresh.military_spending || 20)) * 0.5
    );
    updates.currency = Math.max(0, (fresh.currency || 500) + tickIncome - spendingDrain);

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