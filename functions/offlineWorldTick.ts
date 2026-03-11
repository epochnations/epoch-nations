/**
 * offlineWorldTick — Persistent World Simulation
 *
 * Called by a scheduled automation every 5 minutes.
 * Advances resource production, food consumption, and population
 * for ALL nations (including offline players and AI nations).
 *
 * Actions that require player presence (war, treaties, megaprojects)
 * are NOT executed here.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const EPOCHS = [
  "Stone Age","Bronze Age","Iron Age","Classical Age","Medieval Age",
  "Renaissance Age","Industrial Age","Modern Age","Digital Age",
  "Information Age","Space Age","Galactic Age"
];

const OVERFLOW_CAP = 6000;

function capResource(val, storageCap) {
  return Math.min(storageCap, Math.max(0, val));
}

function getStorageCap(buildings) {
  let warehouseCap = 0;
  for (const b of (buildings || [])) {
    if (b.is_destroyed) continue;
    if (b.building_type === "warehouse_small")       warehouseCap += 5000;
    if (b.building_type === "warehouse_industrial")  warehouseCap += 25000;
    if (b.building_type === "warehouse_strategic")   warehouseCap += 100000;
  }
  return OVERFLOW_CAP + warehouseCap;
}

async function tickNation(base44, nation) {
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const techMult   = 1 + epochIndex * 0.08;
  const pop        = Math.max(1, nation.population || 1);

  // ── RESOURCE PRODUCTION (specialized workers) ──
  // Lumberjack → Wood only
  const woodProd  = Math.floor((nation.workers_lumberjacks  || 0) * 5  * techMult);
  // Stone Miner → Stone only
  const stoneProd = Math.floor((nation.workers_quarry       || 0) * 4  * techMult);
  // Gold Miner → Gold only
  const goldProd  = Math.floor((nation.workers_miners       || 0) * 2  * techMult);
  // Iron Miner → Iron only (Iron Age = index 2+)
  const ironProd  = epochIndex >= 2
    ? Math.floor((nation.workers_iron_miners || 0) * 3 * techMult)
    : 0;
  // Oil Worker → Oil only (Industrial Age = index 6+)
  const oilProd   = epochIndex >= 6
    ? Math.floor((nation.workers_oil_engineers || 0) * 6 * techMult)
    : 0;

  // ── FOOD ──
  const farmFood  = Math.floor((nation.workers_farmers    || 0) * 8 * techMult);
  const huntFood  = Math.floor((nation.workers_hunters    || 0) * 5 * techMult);
  const fishFood  = Math.floor((nation.workers_fishermen  || 0) * 6 * techMult);
  const totalFoodProd   = farmFood + huntFood + fishFood;
  const foodConsumption = Math.ceil(pop * 1.2);
  const netFood         = totalFoodProd - foodConsumption;

  // ── STORAGE CAP ──
  let buildings = [];
  try { buildings = await base44.asServiceRole.entities.Building.filter({ nation_id: nation.id }); } catch {}
  const storageCap = getStorageCap(buildings);

  const updates = {
    res_wood:  capResource((nation.res_wood  || 0) + woodProd,  storageCap),
    res_stone: capResource((nation.res_stone || 0) + stoneProd, storageCap),
    res_gold:  capResource((nation.res_gold  || 0) + goldProd,  storageCap),
    res_iron:  capResource((nation.res_iron  || 0) + ironProd,  storageCap),
    res_oil:   capResource((nation.res_oil   || 0) + oilProd,   storageCap),
    res_food:  capResource(Math.max(0, (nation.res_food || 0) + netFood), storageCap),
  };

  // ── POPULATION ──
  const hasHousingRoom  = pop < (nation.housing_capacity || 20);
  const hasFoodSurplus  = netFood > 0;
  const stability       = nation.stability || 75;
  const goodStability   = stability >= 30;
  const newFood         = updates.res_food;

  if (hasFoodSurplus && hasHousingRoom && goodStability && Math.random() < 0.3) {
    updates.population = pop + 1;
  } else if (netFood < 0 && newFood === 0 && Math.random() < 0.5) {
    updates.population = Math.max(1, pop - 1);
    updates.stability  = Math.max(0, stability - 2);
  } else if (stability < 20 && Math.random() < 0.2) {
    updates.population = Math.max(1, pop - 1);
  }

  // ── WAR AUTO-EXPIRY (3.5 real hours) ──
  if ((nation.at_war_with || []).length > 0 && nation.war_started_at) {
    const warAge = Date.now() - new Date(nation.war_started_at).getTime();
    if (warAge > 3.5 * 3600 * 1000) {
      updates.at_war_with   = [];
      updates.war_started_at = "";
    }
    // gradual stability drain during war
    updates.stability = Math.max(0, (updates.stability ?? stability) - 1);
  }

  await base44.asServiceRole.entities.Nation.update(nation.id, updates);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled (no auth) and manual (admin only) calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch {}

    // If called as a scheduled automation there's no user; proceed
    // If called manually, require admin
    const isScheduled = req.headers.get("x-automation-source") === "scheduled" ||
                        !req.headers.get("authorization");
    if (!isScheduled && !isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const nations = await base44.asServiceRole.entities.Nation.list("-updated_date", 100);
    let processed = 0;

    for (const nation of nations) {
      try {
        await tickNation(base44, nation);
        processed++;
      } catch { /* skip broken nation */ }
      // Stagger writes to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    return Response.json({
      ok: true,
      processed,
      timestamp: new Date().toISOString(),
      message: `Offline world tick complete — ${processed} nations updated.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});