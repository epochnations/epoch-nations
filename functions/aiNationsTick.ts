import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_NATION_NAMES = [
  "Valdris", "Omneth", "Caelorum", "Drakonyx", "Solmara",
  "Xerathia", "Nuvaris", "Imperath", "Thymorex", "Celestara"
];

const AI_FLAGS = ["🏴", "⚑", "🚩", "🏳", "🎌", "⚔️", "🌐", "🗡️", "🔱", "🛡️"];
const AI_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#14b8a6"];

const EPOCHS_ORDER = [
  "Stone Age", "Copper Age", "Bronze Age", "Iron Age", "Dark Ages",
  "Middle Ages", "Renaissance", "Imperial Age", "Enlightenment Age",
  "Industrial Age", "Modern Age", "Atomic Age", "Digital Age",
  "Genetic Age", "Synthetic Age", "Nano Age"
];

const SECTOR_BY_EPOCH = {
  "Stone Age": "Agriculture", "Copper Age": "Agriculture",
  "Bronze Age": "Agriculture", "Iron Age": "Defense",
  "Dark Ages": "Defense", "Middle Ages": "Finance",
  "Renaissance": "Finance", "Imperial Age": "Finance",
  "Enlightenment Age": "Energy", "Industrial Age": "Energy",
  "Modern Age": "Technology", "Atomic Age": "Technology",
  "Digital Age": "Technology", "Genetic Age": "Nano",
  "Synthetic Age": "Nano", "Nano Age": "Nano"
};

const AI_EMAIL_PREFIX = "ai_nation_";

// ─── Personalities ────────────────────────────────────────────────────────────
// Each AI nation gets a personality that shapes its decisions permanently.
const PERSONALITIES = {
  "Valdris":   { archetype: "Expansionist",   aggression: 0.8, diplomacy: 0.3, economy: 0.5, tech: 0.4 },
  "Omneth":    { archetype: "Technocrat",      aggression: 0.2, diplomacy: 0.5, economy: 0.6, tech: 0.9 },
  "Caelorum":  { archetype: "Peacekeeper",     aggression: 0.1, diplomacy: 0.9, economy: 0.6, tech: 0.5 },
  "Drakonyx":  { archetype: "Warmonger",       aggression: 0.95,diplomacy: 0.1, economy: 0.3, tech: 0.3 },
  "Solmara":   { archetype: "Merchant",        aggression: 0.2, diplomacy: 0.7, economy: 0.95, tech: 0.5 },
  "Xerathia":  { archetype: "Isolationist",    aggression: 0.4, diplomacy: 0.2, economy: 0.7, tech: 0.6 },
  "Nuvaris":   { archetype: "Diplomat",        aggression: 0.15,diplomacy: 0.95, economy: 0.5, tech: 0.5 },
  "Imperath":  { archetype: "Imperialist",     aggression: 0.7, diplomacy: 0.4, economy: 0.6, tech: 0.4 },
  "Thymorex":  { archetype: "Revolutionary",   aggression: 0.6, diplomacy: 0.3, economy: 0.4, tech: 0.7 },
  "Celestara": { archetype: "Economist",       aggression: 0.1, diplomacy: 0.6, economy: 0.95, tech: 0.7 },
};

// Default personality for unknown AI names
const DEFAULT_PERSONALITY = { archetype: "Balanced", aggression: 0.4, diplomacy: 0.5, economy: 0.6, tech: 0.5 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function aiEmail(name) {
  return `${AI_EMAIL_PREFIX}${name.toLowerCase().replace(/\s+/g, "_")}@epochnations.internal`;
}
function isAiEmail(email) { return email?.startsWith(AI_EMAIL_PREFIX); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function rand(min, max) { return min + Math.random() * (max - min); }
function powerScore(nation) {
  const epochIdx = EPOCHS_ORDER.indexOf(nation.epoch || "Stone Age");
  return (nation.gdp || 500) + (epochIdx * 200) + (nation.stability || 75) * 2;
}
function getPersonality(name) {
  return PERSONALITIES[name] || DEFAULT_PERSONALITY;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allNations = await base44.asServiceRole.entities.Nation.list("-gdp", 200);
    const humanNations = allNations.filter(n => !isAiEmail(n.owner_email));
    const aiNations = allNations.filter(n => isAiEmail(n.owner_email));

    // 1. Ensure minimum AI nations
    await ensureAiNations(base44, aiNations, humanNations);

    // 2. Fetch fresh data after any creation
    const freshAll = await base44.asServiceRole.entities.Nation.list("-gdp", 200);
    const currentAi = freshAll.filter(n => isAiEmail(n.owner_email));
    const currentHumans = freshAll.filter(n => !isAiEmail(n.owner_email));

    const topHumanScore = currentHumans.length > 0
      ? Math.max(...currentHumans.map(powerScore)) : 1000;
    const globalAvgGdp = currentHumans.length > 0
      ? currentHumans.reduce((s, n) => s + (n.gdp || 500), 0) / currentHumans.length : 500;

    // 3. Tick every AI nation
    for (const ai of currentAi) {
      await runAiTick(base44, ai, topHumanScore, globalAvgGdp, currentHumans, currentAi);
    }

    // 4. Global world event (occasional)
    if (Math.random() < 0.15) {
      await generateWorldEvent(base44, currentAi, currentHumans);
    }

    return Response.json({ ok: true, ai_count: currentAi.length, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("aiNationsTick error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─── Ensure Minimum AI Nations ────────────────────────────────────────────────

async function ensureAiNations(base44, aiNations, humanNations) {
  const targetAiCount = 4;
  const usedNames = new Set(aiNations.map(n => n.name));
  if (aiNations.length >= targetAiCount) return;

  const topHumanScore = humanNations.length > 0
    ? Math.max(...humanNations.map(powerScore)) : 1000;

  const needed = targetAiCount - aiNations.length;
  const staggeredEpochs = ["Stone Age", "Iron Age", "Industrial Age", "Renaissance"];

  for (let i = 0; i < needed; i++) {
    const availableNames = AI_NATION_NAMES.filter(n => !usedNames.has(n));
    if (!availableNames.length) break;

    const newName = pick(availableNames);
    usedNames.add(newName);
    const p = getPersonality(newName);
    const epochIndex = staggeredEpochs[i] || "Stone Age";
    const epIdx = EPOCHS_ORDER.indexOf(epochIndex);
    const gdpCeiling = Math.max(500, topHumanScore * 0.6);
    const baseGdp = clamp(500 + epIdx * 150 + Math.random() * 200, 300, gdpCeiling);

    const nation = await base44.asServiceRole.entities.Nation.create({
      name: newName,
      leader: generateLeaderName(newName),
      owner_email: aiEmail(newName),
      epoch: epochIndex,
      tech_level: Math.max(1, epIdx),
      tech_points: epIdx * 50,
      gdp: Math.round(baseGdp),
      stability: clamp(60 + Math.random() * 30, 50, 90),
      public_trust: parseFloat(rand(0.8, 1.4).toFixed(2)),
      currency: Math.round(baseGdp * 1.5),
      manufacturing: 50 + epIdx * 10,
      education_spending: p.tech > 0.6 ? 30 : 20,
      military_spending: p.aggression > 0.6 ? 35 : 20,
      unit_power: 10 + epIdx * 5,
      defense_level: 10 + epIdx * 5,
      population: clamp(10 + epIdx * 3, 10, 60),
      housing_capacity: clamp(20 + epIdx * 5, 20, 100),
      flag_color: pick(AI_COLORS),
      flag_emoji: pick(AI_FLAGS),
      res_wood: 200 + epIdx * 50,
      res_stone: 150 + epIdx * 40,
      res_gold: 80 + epIdx * 30,
      res_iron: epIdx >= 3 ? 100 + epIdx * 20 : 0,
      res_oil: epIdx >= 9 ? 100 : 0,
      res_food: 300 + epIdx * 60,
      workers_farmers: 3, workers_hunters: 1, workers_fishermen: 1,
      workers_builders: 1, workers_lumberjacks: 2, workers_quarry: 1,
      workers_miners: 1, workers_oil_engineers: epIdx >= 9 ? 1 : 0,
      workers_soldiers: p.aggression > 0.6 ? 4 : 2,
      workers_researchers: p.tech > 0.6 ? 4 : 2,
      workers_industrial: epIdx >= 9 ? 2 : 0,
      at_war_with: [], allies: [],
      is_in_market_crash: false, crash_turns_remaining: 0,
      unlocked_techs: [],
      nation_description: generateNationBio(newName, p)
    });

    const ticker = newName.substring(0, 3).toUpperCase();
    const basePrice = parseFloat((5 + epIdx * 3 + Math.random() * 5).toFixed(2));
    await base44.asServiceRole.entities.Stock.create({
      company_name: `${newName} National Corp`, ticker,
      nation_id: nation.id, nation_name: newName,
      sector: SECTOR_BY_EPOCH[epochIndex] || "Agriculture",
      total_shares: 1000, available_shares: 700,
      base_price: basePrice, current_price: basePrice,
      price_history: [basePrice], market_cap: basePrice * 1000,
      is_crashed: false, epoch_required: "Stone Age"
    });

    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `NEW NATION: ${newName} rises — led by ${generateLeaderName(newName)}`,
      body: `The ${p.archetype} nation of ${newName} has emerged on the world stage. Analysts describe its government as "${p.archetype.toLowerCase()}" with a focus on ${p.tech > 0.7 ? "technological advancement" : p.economy > 0.7 ? "economic dominance" : p.aggression > 0.7 ? "military expansion" : "diplomatic outreach"}.`,
      category: "milestone", tier: "standard",
      nation_name: newName, nation_flag: pick(AI_FLAGS), nation_color: pick(AI_COLORS)
    });
  }
}

// ─── Main AI Tick ─────────────────────────────────────────────────────────────

async function runAiTick(base44, ai, topHumanScore, globalAvgGdp, humanNations, allAiNations) {
  const p = getPersonality(ai.name);
  const epochIdx = EPOCHS_ORDER.indexOf(ai.epoch || "Stone Age");
  const techMult = 1 + epochIdx * 0.08;
  const updates = {};

  // ── Resource Production ──
  const woodProd  = Math.floor((ai.workers_lumberjacks || 2) * 5 * techMult);
  const stoneProd = Math.floor((ai.workers_quarry || 1) * 4 * techMult);
  const goldProd  = Math.floor((ai.workers_miners || 1) * 2 * techMult);
  const ironProd  = epochIdx >= 3 ? Math.floor((ai.workers_miners || 1) * 3 * techMult) : 0;
  const oilProd   = epochIdx >= 9 ? Math.floor((ai.workers_oil_engineers || 0) * 6 * techMult) : 0;
  const foodProd  = Math.floor(
    (ai.workers_farmers || 3) * 8 * techMult +
    (ai.workers_hunters || 1) * 5 * techMult +
    (ai.workers_fishermen || 1) * 6 * techMult
  );
  const foodConsumption = Math.ceil((ai.population || 10) * 1.2);
  const netFood = foodProd - foodConsumption;

  updates.res_wood  = Math.min(99999, (ai.res_wood || 100) + woodProd);
  updates.res_stone = Math.min(99999, (ai.res_stone || 100) + stoneProd);
  updates.res_gold  = Math.min(99999, (ai.res_gold || 50) + goldProd);
  updates.res_iron  = Math.min(99999, (ai.res_iron || 0) + ironProd);
  updates.res_oil   = Math.min(99999, (ai.res_oil || 0) + oilProd);
  updates.res_food  = Math.max(0, (ai.res_food || 200) + netFood);

  // ── Tech ──
  const techGain = Math.floor(
    (ai.workers_researchers || 2) * 2 * techMult * (1 + p.tech * 0.5) +
    (ai.education_spending || 20) * 0.3
  );
  updates.tech_points = Math.min(99999, (ai.tech_points || 0) + techGain);

  // ── Population ──
  const pop = ai.population || 10;
  const stability = ai.stability || 75;
  const hasHousing = pop < (ai.housing_capacity || 20);
  if (netFood > 0 && hasHousing && stability >= 30 && Math.random() < 0.25) {
    updates.population = pop + 1;
    updates.housing_capacity = (ai.housing_capacity || 20) + (Math.random() < 0.3 ? 2 : 0);
  } else if (netFood < 0 && (ai.res_food || 0) <= 0 && Math.random() < 0.4) {
    updates.population = Math.max(1, pop - 1);
    updates.stability = Math.max(0, stability - 5);
  }

  // ── GDP & Treasury ──
  const industBoost = Math.floor((ai.workers_industrial || 0) * 10 * techMult * (1 + p.economy * 0.3));
  const gdpCap = topHumanScore * (0.7 + p.economy * 0.3);
  const newGdp = Math.min(gdpCap, (ai.gdp || 500) + industBoost + Math.floor((ai.manufacturing || 50) * 0.005) + Math.floor(rand(5, 25)));
  updates.gdp = Math.round(newGdp);

  const income = Math.round(newGdp * 0.05 * (1 + p.economy * 0.5));
  const spending = Math.round(((ai.education_spending || 20) + (ai.military_spending || 20)) * 0.5);
  updates.currency = Math.max(0, (ai.currency || 500) + income - spending);

  // ── Stability drift (personality-weighted) ──
  const stabilityMood = (stability < 50 ? -1 : 1) + (Math.random() < p.diplomacy ? 1 : -1) * 0.5;
  updates.stability = clamp((ai.stability || 75) + stabilityMood, 30, 98);
  updates.public_trust = parseFloat(clamp((ai.public_trust || 1.0) + (Math.random() - 0.48) * 0.05, 0.5, 1.8).toFixed(2));

  // ── Adaptive Budget ──
  if (p.tech > 0.6) updates.education_spending = Math.min(60, (ai.education_spending || 20) + (Math.random() < 0.2 ? 2 : 0));
  if (p.aggression > 0.6) updates.military_spending = Math.min(70, (ai.military_spending || 20) + (Math.random() < 0.2 ? 2 : 0));
  if (p.economy > 0.7) updates.manufacturing = Math.min(200, (ai.manufacturing || 50) + (Math.random() < 0.25 ? 3 : 0));
  if (epochIdx >= 9) {
    updates.workers_oil_engineers = Math.min(5, (ai.workers_oil_engineers || 0) + (Math.random() < 0.2 ? 1 : 0));
    updates.workers_industrial    = Math.min(8, (ai.workers_industrial || 0) + (Math.random() < 0.2 ? 1 : 0));
  }

  // ── Epoch Advancement ──
  const nextEpoch = EPOCHS_ORDER[epochIdx + 1];
  const tpThreshold = 100 + epochIdx * 50;
  if (
    nextEpoch &&
    (updates.tech_points || ai.tech_points || 0) >= tpThreshold &&
    (updates.stability || stability) >= 55 &&
    powerScore({ ...ai, ...updates }) < topHumanScore * 0.95
  ) {
    updates.epoch = nextEpoch;
    updates.tech_level = (ai.tech_level || 1) + 1;
    updates.tech_points = (updates.tech_points || 0) - tpThreshold;

    const newSector = SECTOR_BY_EPOCH[nextEpoch] || "Technology";
    const basePrice = parseFloat((10 + epochIdx * 4 + Math.random() * 5).toFixed(2));
    await base44.asServiceRole.entities.Stock.create({
      company_name: `${ai.name} ${nextEpoch} Industries`,
      ticker: ai.name.substring(0, 2).toUpperCase() + nextEpoch.substring(0, 2).toUpperCase(),
      nation_id: ai.id, nation_name: ai.name,
      sector: newSector, total_shares: 1200, available_shares: 800,
      base_price: basePrice, current_price: basePrice,
      price_history: [basePrice], market_cap: basePrice * 1200,
      is_crashed: false, epoch_required: "Stone Age"
    });

    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `EPOCH LEAP: ${ai.name} enters the ${nextEpoch}`,
      body: `Under the direction of ${generateLeaderName(ai.name)}, ${ai.name} has crossed into the ${nextEpoch}. The ${p.archetype} nation's focus on ${p.tech > 0.6 ? "technology" : "military power"} has accelerated this transition. Global markets shift.`,
      category: "tech", tier: "gold",
      nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: ai.flag_color || "#6366f1"
    });
  }

  // ── Collapse Check ──
  if ((updates.currency || ai.currency || 0) <= 0 && (updates.stability || stability) <= 15) {
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `COLLAPSE: ${ai.name} descends into chaos`,
      body: `${ai.name} has collapsed after prolonged economic mismanagement and instability. The ${p.archetype} strategy has failed. A provisional government is forming.`,
      category: "war", tier: "breaking",
      nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: "#ef4444"
    });
    updates.gdp = 350; updates.stability = 45; updates.public_trust = 0.65;
    updates.currency = 300; updates.is_in_market_crash = true; updates.crash_turns_remaining = 5;
  }

  // ── Apply updates ──
  await base44.asServiceRole.entities.Nation.update(ai.id, updates);

  // ── Update AI Stocks ──
  const aiStocks = await base44.asServiceRole.entities.Stock.filter({ nation_id: ai.id });
  for (const stock of aiStocks) {
    const fundamental = (updates.gdp / 100) * ((updates.stability || 75) / 100) * (updates.public_trust || 1.0) * (stock.base_price || 5);
    const held = stock.total_shares - stock.available_shares;
    const demandMult = 0.7 + (held / Math.max(stock.total_shares, 1)) * 0.6;
    const noise = 0.95 + Math.random() * 0.1;
    let newPrice = parseFloat((fundamental * demandMult * noise).toFixed(2));
    newPrice = Math.max(0.01, newPrice);
    const history = [...(stock.price_history || []), newPrice].slice(-30);
    await base44.asServiceRole.entities.Stock.update(stock.id, {
      current_price: newPrice, price_history: history,
      market_cap: Math.round(newPrice * stock.total_shares),
      is_crashed: newPrice < (stock.base_price || 5) * 0.3
    });
  }

  // ── DIPLOMACY & INTER-NATION ACTIONS ──
  const allNations = [...humanNations, ...allAiNations.filter(n => n.id !== ai.id)];
  await runDiplomacyTick(base44, ai, updates, p, epochIdx, allNations, humanNations, allAiNations);
}

// ─── Diplomacy & Interaction Engine ──────────────────────────────────────────

async function runDiplomacyTick(base44, ai, updates, p, epochIdx, allNations, humanNations, allAiNations) {
  const currency = updates.currency || ai.currency || 0;
  const stability = updates.stability || ai.stability || 75;
  const atWar = ai.at_war_with || [];
  const allies = ai.allies || [];

  // ── 1. PROPOSE ALLIANCE (diplomatic AIs) ──
  if (p.diplomacy > 0.5 && Math.random() < 0.07 && allies.length < 3) {
    const candidates = allNations.filter(n =>
      !allies.includes(n.id) &&
      !atWar.includes(n.id) &&
      n.id !== ai.id &&
      (n.stability || 75) > 50
    );
    if (candidates.length > 0) {
      const target = pick(candidates);
      const targetIsAi = isAiEmail(target.owner_email);
      // AI-to-AI: auto-accept if compatible personalities
      let accepted = false;
      if (targetIsAi) {
        const tp = getPersonality(target.name);
        accepted = tp.diplomacy > 0.3 && !(target.at_war_with || []).includes(ai.id);
      } else {
        // Human player: they get a notification + the alliance is tentative
        accepted = false; // human must accept manually — just notify them
      }

      if (accepted) {
        // Mutual alliance
        await base44.asServiceRole.entities.Nation.update(ai.id, {
          allies: [...new Set([...allies, target.id])]
        });
        await base44.asServiceRole.entities.Nation.update(target.id, {
          allies: [...new Set([...(target.allies || []), ai.id])]
        });
        await base44.asServiceRole.entities.NewsArticle.create({
          headline: `ALLIANCE FORMED: ${ai.name} and ${target.name} sign mutual defense pact`,
          body: `In a formal ceremony, ${ai.name} (${getPersonality(ai.name).archetype}) and ${target.name} (${getPersonality(target.name).archetype}) have entered a mutual defense alliance. Both nations pledge military and economic cooperation.`,
          category: "policy", tier: "gold",
          nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: ai.flag_color || "#6366f1"
        });
      } else if (!targetIsAi) {
        // Send alliance request notification to human player
        await base44.asServiceRole.entities.Notification.create({
          target_nation_id: target.id,
          target_owner_email: target.owner_email,
          type: "ally_aid",
          title: `${ai.name} proposes an alliance`,
          message: `The ${getPersonality(ai.name).archetype} nation of ${ai.name} has formally requested a mutual defense alliance with ${target.name}. (This has been noted in international records.)`,
          severity: "info"
        });
        await base44.asServiceRole.entities.NewsArticle.create({
          headline: `DIPLOMACY: ${ai.name} extends alliance offer to ${target.name}`,
          body: `${ai.name} has formally offered an alliance to ${target.name}, citing shared interests in regional stability. ${target.name}'s response is awaited.`,
          category: "policy", tier: "standard",
          nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: ai.flag_color || "#6366f1"
        });
      }
    }
  }

  // ── 2. DECLARE WAR (aggressive AIs only) ──
  if (
    p.aggression > 0.55 &&
    Math.random() < (p.aggression * 0.08) &&
    atWar.length === 0 &&
    stability > 55 &&
    currency > 300
  ) {
    // Pick a target weaker than AI
    const myScore = powerScore({ ...ai, ...updates });
    const warCandidates = allNations.filter(n =>
      !allies.includes(n.id) &&
      !atWar.includes(n.id) &&
      n.id !== ai.id &&
      powerScore(n) < myScore * 0.85 // only attack weaker nations
    ).sort((a, b) => powerScore(a) - powerScore(b));

    if (warCandidates.length > 0) {
      const victim = warCandidates[0];
      const isHuman = !isAiEmail(victim.owner_email);

      await base44.asServiceRole.entities.Nation.update(ai.id, {
        at_war_with: [...atWar, victim.id],
        war_started_at: new Date().toISOString()
      });
      await base44.asServiceRole.entities.Nation.update(victim.id, {
        at_war_with: [...(victim.at_war_with || []), ai.id],
        war_started_at: new Date().toISOString(),
        stability: Math.max(10, (victim.stability || 75) - 15)
      });

      const warMessage = pick([
        `${ai.name}'s forces have crossed the border into ${victim.name}, citing "historical territorial claims."`,
        `${ai.name} has launched a surprise offensive against ${victim.name}. International condemnation follows.`,
        `Under orders from ${generateLeaderName(ai.name)}, ${ai.name}'s military has invaded ${victim.name}.`,
      ]);

      await base44.asServiceRole.entities.NewsArticle.create({
        headline: `⚔️ WAR DECLARED: ${ai.name} invades ${victim.name}`,
        body: warMessage + ` Global markets are in turmoil as both nations mobilize forces.`,
        category: "war", tier: "breaking",
        nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: "#ef4444"
      });

      if (isHuman) {
        await base44.asServiceRole.entities.Notification.create({
          target_nation_id: victim.id,
          target_owner_email: victim.owner_email,
          type: "war_declared",
          title: `⚔️ ${ai.name} has declared war on you!`,
          message: `${ai.name} (${p.archetype}) has launched a military offensive against your nation. Defend yourself or seek allies immediately.`,
          severity: "danger"
        });
        // War damage to human
        await base44.asServiceRole.entities.Nation.update(victim.id, {
          currency: Math.max(0, (victim.currency || 500) - 150),
          unit_power: Math.max(1, (victim.unit_power || 10) - 5),
        });
      }
    }
  }

  // ── 3. WAR TICK (ongoing wars) ──
  if (atWar.length > 0) {
    for (const enemyId of atWar) {
      const enemy = allNations.find(n => n.id === enemyId);
      if (!enemy) continue;

      const myPower = (updates.unit_power || ai.unit_power || 10) + epochIdx * 3;
      const enemyPower = (enemy.unit_power || 10) + EPOCHS_ORDER.indexOf(enemy.epoch || "Stone Age") * 3;
      const roll = Math.random();
      const isWinning = myPower > enemyPower * 0.8;

      if (isWinning && roll < 0.5) {
        // AI wins round — drain enemy
        const drain = Math.floor(rand(50, 200));
        const stabilityDmg = Math.floor(rand(3, 10));
        const newEnemyCurrency = Math.max(0, (enemy.currency || 500) - drain);
        const newEnemyStability = Math.max(5, (enemy.stability || 75) - stabilityDmg);
        await base44.asServiceRole.entities.Nation.update(enemyId, {
          currency: newEnemyCurrency, stability: newEnemyStability
        });
        // Notify human if victim
        if (!isAiEmail(enemy.owner_email)) {
          await base44.asServiceRole.entities.Notification.create({
            target_nation_id: enemyId,
            target_owner_email: enemy.owner_email,
            type: "attack_received",
            title: `${ai.name} is winning the war against you`,
            message: `${ai.name}'s forces have dealt another blow. You lost ${drain} currency and ${stabilityDmg} stability. Counter-attack or seek peace.`,
            severity: "danger"
          });
        }
      } else if (!isWinning && roll < 0.35) {
        // AI losing — consider peace
        await base44.asServiceRole.entities.Nation.update(ai.id, {
          at_war_with: atWar.filter(id => id !== enemyId)
        });
        await base44.asServiceRole.entities.Nation.update(enemyId, {
          at_war_with: (enemy.at_war_with || []).filter(id => id !== ai.id)
        });
        await base44.asServiceRole.entities.NewsArticle.create({
          headline: `CEASEFIRE: ${ai.name} withdraws from war with ${enemy.name}`,
          body: `After battlefield setbacks, ${ai.name} has unilaterally declared a ceasefire with ${enemy.name}. Peace negotiations are expected to begin shortly.`,
          category: "war", tier: "gold",
          nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: ai.flag_color || "#6366f1"
        });
      }

      // End very long wars automatically
      const warStart = ai.war_started_at ? new Date(ai.war_started_at).getTime() : 0;
      const warAge = Date.now() - warStart;
      if (warAge > 3 * 60 * 60 * 1000) { // 3 hours
        await base44.asServiceRole.entities.Nation.update(ai.id, {
          at_war_with: atWar.filter(id => id !== enemyId)
        });
        await base44.asServiceRole.entities.Nation.update(enemyId, {
          at_war_with: (enemy.at_war_with || []).filter(id => id !== ai.id)
        });
        await base44.asServiceRole.entities.NewsArticle.create({
          headline: `PEACE TREATY: ${ai.name} and ${enemy.name} end hostilities`,
          body: `After prolonged conflict, ${ai.name} and ${enemy.name} have signed a peace treaty brokered by neutral states. Both nations begin reconstruction.`,
          category: "policy", tier: "gold",
          nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: ai.flag_color || "#6366f1"
        });
      }
    }
  }

  // ── 4. STOCK MARKET BEHAVIOR (personality-driven) ──
  if (Math.random() < 0.3 && currency > 150) {
    const allStocks = await base44.asServiceRole.entities.Stock.list("-market_cap", 40);
    const candidates = allStocks.filter(s =>
      s.available_shares > 10 && !s.is_crashed && s.nation_id !== ai.id
    ).sort((a, b) => {
      const aVal = (a.current_price || 5) / Math.max(a.base_price || 5, 0.01);
      const bVal = (b.current_price || 5) / Math.max(b.base_price || 5, 0.01);
      return aVal - bVal; // buy undervalued
    });

    if (candidates.length > 0) {
      // Economy-focused AIs buy more aggressively
      const buyCount = Math.floor(rand(1, p.economy > 0.7 ? 20 : 10));
      const target = candidates[0];
      const sharesToBuy = Math.min(buyCount, Math.floor(currency / Math.max(target.current_price || 5, 0.01) * 0.15));
      if (sharesToBuy >= 1) {
        const totalCost = sharesToBuy * (target.current_price || 5);
        await base44.asServiceRole.entities.Stock.update(target.id, {
          available_shares: Math.max(0, target.available_shares - sharesToBuy)
        });
        await base44.asServiceRole.entities.Nation.update(ai.id, {
          currency: Math.max(0, currency - totalCost)
        });
        const existing = await base44.asServiceRole.entities.StockHolding.filter({ nation_id: ai.id, stock_id: target.id });
        if (existing.length > 0) {
          const h = existing[0];
          const newTotal = (h.shares_owned || 0) + sharesToBuy;
          const newAvg = ((h.avg_buy_price || target.current_price) * (h.shares_owned || 0) + totalCost) / newTotal;
          await base44.asServiceRole.entities.StockHolding.update(h.id, {
            shares_owned: newTotal, avg_buy_price: parseFloat(newAvg.toFixed(2))
          });
        } else {
          await base44.asServiceRole.entities.StockHolding.create({
            nation_id: ai.id, nation_name: ai.name,
            stock_id: target.id, stock_ticker: target.ticker,
            company_name: target.company_name,
            shares_owned: sharesToBuy,
            avg_buy_price: parseFloat((target.current_price || 5).toFixed(2))
          });
        }
        await base44.asServiceRole.entities.Transaction.create({
          type: "stock_buy",
          from_nation_id: ai.id, from_nation_name: ai.name,
          to_nation_id: target.nation_id, to_nation_name: target.nation_name,
          stock_id: target.id, stock_ticker: target.ticker,
          shares: sharesToBuy, price_per_share: parseFloat((target.current_price || 5).toFixed(2)),
          total_value: parseFloat(totalCost.toFixed(2)),
          description: `${ai.name} (${p.archetype}) acquired ${sharesToBuy} shares of ${target.ticker}`
        });
      }
    }
  }

  // ── 5. AI TAUNTS / GLOBAL ANNOUNCEMENTS (flavor) ──
  if (Math.random() < 0.06) {
    const news = generateAiPersonalityNews(ai, p, updates, humanNations);
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: news.headline, body: news.body,
      category: news.category, tier: news.tier,
      nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: ai.flag_color || "#6366f1"
    });
  }

  // ── 6. LEARN FROM PLAYER BEHAVIOR: if a human is wealthier, adapt ──
  const topHuman = humanNations.sort((a, b) => (b.gdp || 0) - (a.gdp || 0))[0];
  if (topHuman && (topHuman.gdp || 0) > (updates.gdp || 0) * 1.5 && Math.random() < 0.12) {
    // Mirror successful human's spending ratios
    const ratio = (topHuman.education_spending || 20) / Math.max((topHuman.military_spending || 20), 1);
    if (p.tech > 0.5) {
      updates.education_spending = Math.min(60, (updates.education_spending || ai.education_spending || 20) + 3);
    }
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `${ai.name} studies ${topHuman.name}'s economic model`,
      body: `Analysts in ${ai.name} are openly studying the policies that have made ${topHuman.name} a dominant economic power. Expect strategic shifts from the ${p.archetype} nation in coming cycles.`,
      category: "economy", tier: "standard",
      nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: ai.flag_color || "#6366f1"
    });
  }
}

// ─── World Events ─────────────────────────────────────────────────────────────

async function generateWorldEvent(base44, aiNations, humanNations) {
  const allNations = [...aiNations, ...humanNations];
  const wealthiest = allNations.sort((a, b) => (b.gdp || 0) - (a.gdp || 0))[0];
  const atWar = allNations.filter(n => (n.at_war_with || []).length > 0);

  const events = [
    {
      headline: "GLOBAL SUMMIT: World Leaders Convene Over Resource Crisis",
      body: `With ${atWar.length} active conflicts and growing resource shortages, world leaders have called an emergency summit. ${wealthiest?.name || "The dominant power"} is expected to chair the proceedings.`,
      category: "policy", tier: "breaking"
    },
    {
      headline: "BLACK MARKET TECH: Stolen Research Surfaces on Global Exchange",
      body: "Anonymous sellers are offering fragments of advanced epoch technology on the global black market. Multiple nations have confirmed their research labs were breached.",
      category: "tech", tier: "gold"
    },
    {
      headline: "FAMINE ALERT: International Food Reserves at Historic Low",
      body: "The Global Food Authority reports reserves are critically low. Nations with food surpluses are urged to export immediately or face international sanctions.",
      category: "economy", tier: "breaking"
    },
    {
      headline: "DIPLOMATIC CRISIS: Three Nations Sever Trade Relations",
      body: "A cascading diplomatic breakdown has seen three major nations suspend trade agreements amid accusations of currency manipulation.",
      category: "economy", tier: "gold"
    },
    {
      headline: `POWER SHIFT: ${wealthiest?.name || "A rising power"} now dominates global GDP rankings`,
      body: `New economic data confirms ${wealthiest?.name || "one nation"} holds an unprecedented share of global GDP. Analysts debate whether this concentration of wealth is sustainable or signals an incoming market correction.`,
      category: "economy", tier: "gold"
    },
    {
      headline: "ROGUE ASTEROID DETECTED: Nations Race to Develop Deflection Tech",
      body: "Astronomers confirm a rogue asteroid will pass near Earth in 48 cycles. Technologically advanced nations are being urged to accelerate space-defense research.",
      category: "tech", tier: "breaking"
    },
    {
      headline: "CYBER ATTACK: Global Stock Exchange Down for 6 Hours",
      body: "An unknown actor executed a sophisticated attack on global financial infrastructure. Stocks in all sectors have been frozen pending investigation.",
      category: "economy", tier: "breaking"
    }
  ];

  const chosen = pick(events);
  await base44.asServiceRole.entities.NewsArticle.create({
    ...chosen,
    nation_name: "Global Press Agency",
    nation_flag: "🌍",
    nation_color: "#64748b"
  });
}

// ─── Personality-Driven News ──────────────────────────────────────────────────

function generateAiPersonalityNews(ai, p, updates, humanNations) {
  const leader = generateLeaderName(ai.name);
  const richestHuman = humanNations.sort((a, b) => (b.gdp || 0) - (a.gdp || 0))[0];
  const richName = richestHuman?.name || "the human powers";

  const byArchetype = {
    "Expansionist": [
      { headline: `${ai.name} announces "New Territories" doctrine`, body: `${leader} has unveiled a policy of territorial expansion, warning neighboring states that ${ai.name} intends to "reclaim its historical sphere of influence."`, category: "war", tier: "gold" },
      { headline: `${ai.name} military parade shocks observers`, body: `A massive military parade through ${ai.name}'s capital showcased new weapons systems. Neighboring nations have called the display "provocative."`, category: "war", tier: "standard" },
    ],
    "Technocrat": [
      { headline: `${ai.name} unveils 5-year science megaplan`, body: `${leader} has pledged to invest 30% of national GDP into research. "${ai.name} will lead the world into the next epoch," the leader declared.`, category: "tech", tier: "gold" },
      { headline: `${ai.name} opens free university for all citizens`, body: `Universal higher education is now guaranteed in ${ai.name}. Enrollment has surged by 400% following the announcement.`, category: "tech", tier: "standard" },
    ],
    "Peacekeeper": [
      { headline: `${ai.name} calls for global disarmament treaty`, body: `${leader} addressed world leaders: "The only path to survival is collective disarmament. ${ai.name} will lead by example and reduce military spending by 20%."`, category: "policy", tier: "gold" },
      { headline: `${ai.name} sends aid convoy to war-torn regions`, body: `${ai.name} has dispatched food, medicine, and engineers to nations devastated by recent conflicts. The gesture has been praised internationally.`, category: "policy", tier: "standard" },
    ],
    "Warmonger": [
      { headline: `${ai.name}: "We fear no nation" — ${leader} threatens rivals`, body: `In a fiery address, ${leader} singled out multiple nations as "enemies of ${ai.name}" and promised "swift and decisive retaliation" for any perceived slight.`, category: "war", tier: "breaking" },
      { headline: `${ai.name} doubles military budget`, body: `${ai.name} has shocked markets by announcing a doubling of defense spending. Analysts warn this could destabilize the region.`, category: "war", tier: "gold" },
    ],
    "Merchant": [
      { headline: `${ai.name} opens free trade zones with 5 nations`, body: `${ai.name}'s economy-first strategy continues as ${leader} signs sweeping free trade agreements. GDP is expected to surge 12% this quarter.`, category: "economy", tier: "gold" },
      { headline: `${ai.name} stock exchange becomes world's largest`, body: `${ai.name}'s national exchange has overtaken rivals to become the largest by market cap. The ${p.archetype} strategy is paying off.`, category: "economy", tier: "gold" },
    ],
    "Isolationist": [
      { headline: `${ai.name} closes borders to foreign investment`, body: `In a surprise move, ${ai.name} has imposed strict controls on foreign capital, citing "national sovereignty." Markets react with uncertainty.`, category: "policy", tier: "gold" },
      { headline: `${ai.name} withdraws from global accords`, body: `${leader} announced withdrawal from several international agreements, declaring that "${ai.name} will chart its own course."`, category: "policy", tier: "standard" },
    ],
    "Diplomat": [
      { headline: `${ai.name} brokers peace deal between warring nations`, body: `${leader} facilitated multi-day negotiations that produced a historic ceasefire. The deal is considered a landmark diplomatic achievement.`, category: "policy", tier: "breaking" },
      { headline: `${ai.name} hosts international cultural festival`, body: `Thousands from across the world converge on ${ai.name} for its annual cultural exchange festival, reinforcing its reputation as a beacon of diplomacy.`, category: "policy", tier: "standard" },
    ],
    "Imperialist": [
      { headline: `${ai.name} demands tribute from smaller nations`, body: `${leader} has sent formal diplomatic notes to weaker nations demanding annual "security contributions." Critics call it modern imperialism.`, category: "war", tier: "gold" },
      { headline: `${ai.name} plants flag on unclaimed territory`, body: `${ai.name} has formally annexed a stretch of previously unclaimed land, drawing protests from several nations.`, category: "war", tier: "gold" },
    ],
    "Revolutionary": [
      { headline: `${ai.name} incites revolution — funds opposition in rival states`, body: `Intelligence agencies confirm ${ai.name} is funding revolutionary movements in neighboring countries. ${leader} calls it "spreading freedom."`, category: "war", tier: "gold" },
      { headline: `${ai.name} undergoes radical internal reform`, body: `${ai.name} has undergone a sweeping governmental overhaul. Old institutions have been dismantled. The world watches with a mix of fear and admiration.`, category: "policy", tier: "gold" },
    ],
    "Economist": [
      { headline: `${ai.name} posts 8th consecutive quarter of record growth`, body: `Under ${leader}'s guidance, ${ai.name} continues to outperform global averages. The secret? A laser focus on industrial productivity and trade.`, category: "economy", tier: "gold" },
      { headline: `${ai.name} predicts ${richName} economic collapse — offers aid package`, body: `${ai.name}'s treasury has issued a forecast predicting strain in ${richName}'s economy, while simultaneously offering a pre-emptive aid package — a calculated diplomatic move.`, category: "economy", tier: "standard" },
    ],
    "Balanced": [
      { headline: `${ai.name} announces balanced growth strategy`, body: `${leader} has unveiled a comprehensive national strategy balancing economic growth, military readiness, and diplomatic engagement.`, category: "policy", tier: "standard" },
    ]
  };

  const pool = byArchetype[p.archetype] || byArchetype["Balanced"];
  return pick(pool);
}

// ─── Name Generators ──────────────────────────────────────────────────────────

const LEADER_FIRST = ["Aldric", "Zara", "Corvus", "Elia", "Drath", "Mira", "Kael", "Vex", "Nora", "Harak", "Sable", "Theron", "Lyra", "Orin"];
const LEADER_LAST  = ["Vor", "Ashvane", "Malgrave", "Stormbind", "Hellfire", "Dawnwatch", "Ironveil", "Coldmark", "Serath", "Voss", "Crane", "Holt", "Deyn"];

function generateLeaderName(nationName) {
  const seed = nationName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${LEADER_FIRST[seed % LEADER_FIRST.length]} ${LEADER_LAST[(seed * 7) % LEADER_LAST.length]}`;
}

function generateNationBio(name, p) {
  const bios = {
    "Expansionist": `${name} is a relentlessly expanding power, driven by territorial ambition and a belief that strength is measured in land.`,
    "Technocrat":   `${name} is governed by a council of scientists and engineers. Innovation is the nation's religion.`,
    "Peacekeeper":  `${name} believes that the greatest power is the prevention of war. It invests heavily in diplomacy and humanitarian aid.`,
    "Warmonger":    `${name} has built its identity on military supremacy. Its leaders believe that peace is simply the pause between victories.`,
    "Merchant":     `${name} runs its nation like a corporation — every decision is measured by its return on investment.`,
    "Isolationist": `${name} prefers to develop in solitude, wary of foreign influence and committed to self-sufficiency.`,
    "Diplomat":     `${name} is famed for brokering deals others thought impossible. Its soft power rivals any military.`,
    "Imperialist":  `${name} views smaller nations as satellites waiting to be claimed. It is building an empire, one relationship at a time.`,
    "Revolutionary":`${name} seeks to overturn the existing world order. It funds dissent and celebrates upheaval as progress.`,
    "Economist":    `${name} has turned economic policy into an art form. Its GDP growth is the envy of the world.`,
  };
  return bios[p.archetype] || `${name} is a sovereign power rising through the epochs.`;
}