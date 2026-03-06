import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const AI_NATION_NAMES = [
  "Valdris", "Omneth", "Caelorum", "Drakonyx", "Solmara",
  "Xerathia", "Nuvaris", "Imperath", "Thymorex", "Celestara"
];

const AI_FLAGS = ["🏴", "⚑", "🚩", "🏳", "🎌"];
const AI_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];
const AI_EPOCHS = [
  "Stone Age", "Copper Age", "Bronze Age", "Iron Age", "Dark Ages",
  "Middle Ages", "Renaissance", "Imperial Age", "Enlightenment Age",
  "Industrial Age", "Modern Age"
];

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

function aiEmail(name) {
  return `${AI_EMAIL_PREFIX}${name.toLowerCase().replace(/\s+/g, "_")}@epochnations.internal`;
}

function isAiEmail(email) {
  return email?.startsWith(AI_EMAIL_PREFIX);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Compute a "power score" for comparison
function powerScore(nation) {
  const epochIdx = EPOCHS_ORDER.indexOf(nation.epoch || "Stone Age");
  return (nation.gdp || 500) + (epochIdx * 200) + (nation.stability || 75) * 2;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all nations
    const allNations = await base44.asServiceRole.entities.Nation.list("-gdp", 200);
    const humanNations = allNations.filter(n => !isAiEmail(n.owner_email));
    const aiNations = allNations.filter(n => isAiEmail(n.owner_email));

    // --- 1. ENSURE MINIMUM 3 AI NATIONS ---
    const targetAiCount = 4;
    const usedNames = new Set(aiNations.map(n => n.name));

    if (aiNations.length < targetAiCount) {
      // Determine top human power score for ceiling
      const topHumanScore = humanNations.length > 0
        ? Math.max(...humanNations.map(powerScore))
        : 1000;

      const needed = targetAiCount - aiNations.length;
      const staggeredEpochs = ["Stone Age", "Iron Age", "Industrial Age", "Renaissance"];

      for (let i = 0; i < needed; i++) {
        const availableNames = AI_NATION_NAMES.filter(n => !usedNames.has(n));
        if (!availableNames.length) break;

        const newName = pick(availableNames);
        usedNames.add(newName);

        const epochIndex = i < staggeredEpochs.length ? staggeredEpochs[i] : "Stone Age";
        const epIdx = EPOCHS_ORDER.indexOf(epochIndex);

        // Scale GDP below top human
        const gdpCeiling = Math.max(500, topHumanScore * 0.6);
        const baseGdp = clamp(500 + epIdx * 150 + Math.random() * 200, 300, gdpCeiling);

        const nation = await base44.asServiceRole.entities.Nation.create({
          name: newName,
          leader: `Leader of ${newName}`,
          owner_email: aiEmail(newName),
          epoch: epochIndex,
          tech_level: Math.max(1, epIdx),
          tech_points: epIdx * 50,
          gdp: Math.round(baseGdp),
          stability: clamp(60 + Math.random() * 30, 50, 90),
          public_trust: parseFloat((0.8 + Math.random() * 0.4).toFixed(2)),
          currency: Math.round(baseGdp * 1.5),
          manufacturing: 50 + epIdx * 10,
          education_spending: 20,
          military_spending: 20,
          unit_power: 10 + epIdx * 5,
          defense_level: 10 + epIdx * 5,
          population: clamp(10 + epIdx * 3, 10, 60),
          housing_capacity: clamp(20 + epIdx * 5, 20, 100),
          flag_color: pick(AI_COLORS),
          flag_emoji: pick(["🏴", "⚑", "🎌", "🚀", "⚔️", "🌐", "🗡️"]),
          res_wood: 200 + epIdx * 50,
          res_stone: 150 + epIdx * 40,
          res_gold: 80 + epIdx * 30,
          res_iron: epIdx >= 3 ? 100 + epIdx * 20 : 0,
          res_oil: epIdx >= 9 ? 100 : 0,
          res_food: 300 + epIdx * 60,
          workers_farmers: 3,
          workers_hunters: 1,
          workers_fishermen: 1,
          workers_builders: 1,
          workers_lumberjacks: 2,
          workers_quarry: 1,
          workers_miners: 1,
          workers_oil_engineers: epIdx >= 9 ? 1 : 0,
          workers_soldiers: 2,
          workers_researchers: 2,
          workers_industrial: epIdx >= 9 ? 2 : 0,
          at_war_with: [],
          allies: [],
          is_in_market_crash: false,
          crash_turns_remaining: 0,
          unlocked_techs: [],
          nation_description: `A sovereign power rising through the epochs.`
        });

        // Issue initial stock
        const ticker = newName.substring(0, 3).toUpperCase();
        const basePrice = parseFloat((5 + epIdx * 3 + Math.random() * 5).toFixed(2));
        await base44.asServiceRole.entities.Stock.create({
          company_name: `${newName} National Corp`,
          ticker,
          nation_id: nation.id,
          nation_name: newName,
          sector: SECTOR_BY_EPOCH[epochIndex] || "Agriculture",
          total_shares: 1000,
          available_shares: 700,
          base_price: basePrice,
          current_price: basePrice,
          price_history: [basePrice],
          market_cap: basePrice * 1000,
          is_crashed: false,
          epoch_required: "Stone Age"
        });

        await base44.asServiceRole.entities.NewsArticle.create({
          headline: `NEW POWER: The nation of ${newName} rises on the world stage`,
          body: `${newName} has established itself as a sovereign nation, beginning its journey through the epochs. Markets react with cautious optimism.`,
          category: "milestone",
          tier: "standard",
          nation_name: newName,
          nation_flag: "🌐",
          nation_color: "#6366f1"
        });
      }
    }

    // --- 2. RUN TICK FOR EACH EXISTING AI NATION ---
    const freshAiNations = await base44.asServiceRole.entities.Nation.list("-gdp", 200);
    const currentAiNations = freshAiNations.filter(n => isAiEmail(n.owner_email));
    const currentHumans = freshAiNations.filter(n => !isAiEmail(n.owner_email));

    const topHumanScore = currentHumans.length > 0
      ? Math.max(...currentHumans.map(powerScore))
      : 1000;
    const globalAvgGdp = currentHumans.length > 0
      ? currentHumans.reduce((s, n) => s + (n.gdp || 500), 0) / currentHumans.length
      : 500;

    for (const ai of currentAiNations) {
      await runAiTick(base44, ai, topHumanScore, globalAvgGdp, currentHumans, currentAiNations);
    }

    return Response.json({ ok: true, ai_count: currentAiNations.length, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error("aiNationsTick error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function runAiTick(base44, ai, topHumanScore, globalAvgGdp, humanNations, allAiNations) {
  const epochIdx = EPOCHS_ORDER.indexOf(ai.epoch || "Stone Age");
  const techMult = 1 + epochIdx * 0.08;
  const updates = {};

  // --- RESOURCE PRODUCTION ---
  const woodProd = Math.floor((ai.workers_lumberjacks || 2) * 5 * techMult);
  const stoneProd = Math.floor((ai.workers_quarry || 1) * 4 * techMult);
  const goldProd = Math.floor((ai.workers_miners || 1) * 2 * techMult);
  const ironProd = epochIdx >= 3 ? Math.floor((ai.workers_miners || 1) * 3 * techMult) : 0;
  const oilProd = epochIdx >= 9 ? Math.floor((ai.workers_oil_engineers || 0) * 6 * techMult) : 0;
  const foodProd = Math.floor(
    (ai.workers_farmers || 3) * 8 * techMult +
    (ai.workers_hunters || 1) * 5 * techMult +
    (ai.workers_fishermen || 1) * 6 * techMult
  );
  const foodConsumption = Math.ceil((ai.population || 10) * 1.2);
  const netFood = foodProd - foodConsumption;

  updates.res_wood = Math.min(99999, (ai.res_wood || 100) + woodProd);
  updates.res_stone = Math.min(99999, (ai.res_stone || 100) + stoneProd);
  updates.res_gold = Math.min(99999, (ai.res_gold || 50) + goldProd);
  updates.res_iron = Math.min(99999, (ai.res_iron || 0) + ironProd);
  updates.res_oil = Math.min(99999, (ai.res_oil || 0) + oilProd);
  updates.res_food = Math.max(0, (ai.res_food || 200) + netFood);

  // --- TECH POINTS ---
  const techGain = Math.floor(
    (ai.workers_researchers || 2) * 2 * techMult +
    (ai.education_spending || 20) * 0.3
  );
  updates.tech_points = Math.min(99999, (ai.tech_points || 0) + techGain);

  // --- POPULATION ---
  const pop = ai.population || 10;
  const hasHousing = pop < (ai.housing_capacity || 20);
  const stability = ai.stability || 75;
  if (netFood > 0 && hasHousing && stability >= 30 && Math.random() < 0.25) {
    updates.population = pop + 1;
    updates.housing_capacity = (ai.housing_capacity || 20) + (Math.random() < 0.3 ? 2 : 0);
  } else if (netFood < 0 && (ai.res_food || 0) <= 0 && Math.random() < 0.4) {
    updates.population = Math.max(1, pop - 1);
    updates.stability = Math.max(0, stability - 5);
  }

  // --- GDP & TREASURY ---
  const industrialBoost = Math.floor((ai.workers_industrial || 0) * 10 * techMult);
  const newGdp = Math.min(topHumanScore * 0.85, (ai.gdp || 500) + industrialBoost + Math.floor((ai.manufacturing || 50) * 0.005) + Math.floor(Math.random() * 20));
  updates.gdp = Math.round(newGdp);

  const income = Math.round(newGdp * 0.05 * 1.5);
  const spending = Math.round(((ai.education_spending || 20) + (ai.military_spending || 20)) * 0.5);
  updates.currency = Math.max(0, (ai.currency || 500) + income - spending);

  // --- STABILITY DRIFT ---
  const stabilityDrift = Math.random() < 0.5 ? 1 : -1;
  updates.stability = clamp((ai.stability || 75) + stabilityDrift, 30, 95);
  updates.public_trust = parseFloat(clamp((ai.public_trust || 1.0) + (Math.random() - 0.5) * 0.05, 0.5, 1.8).toFixed(2));

  // --- BUDGET ADAPTATION ---
  if (stability < 50) {
    updates.education_spending = Math.min(50, (ai.education_spending || 20) + 2);
  }
  if (epochIdx >= 9) {
    updates.workers_oil_engineers = Math.min(5, (ai.workers_oil_engineers || 0) + (Math.random() < 0.2 ? 1 : 0));
    updates.workers_industrial = Math.min(8, (ai.workers_industrial || 0) + (Math.random() < 0.2 ? 1 : 0));
  }

  // --- EPOCH ADVANCEMENT (auto-advance if enough TP and conditions met) ---
  const nextEpoch = EPOCHS_ORDER[epochIdx + 1];
  const tpThreshold = 100 + epochIdx * 50;
  if (
    nextEpoch &&
    (updates.tech_points || ai.tech_points || 0) >= tpThreshold &&
    stability >= 60 &&
    powerScore({ ...ai, ...updates }) < topHumanScore * 0.9
  ) {
    updates.epoch = nextEpoch;
    updates.tech_level = (ai.tech_level || 1) + 1;
    updates.tech_points = (updates.tech_points || 0) - tpThreshold;

    // Issue a new stock for advanced epoch
    const newSector = SECTOR_BY_EPOCH[nextEpoch] || "Technology";
    const basePrice = parseFloat((10 + epochIdx * 4 + Math.random() * 5).toFixed(2));
    await base44.asServiceRole.entities.Stock.create({
      company_name: `${ai.name} ${nextEpoch} Industries`,
      ticker: ai.name.substring(0, 2).toUpperCase() + nextEpoch.substring(0, 2).toUpperCase(),
      nation_id: ai.id,
      nation_name: ai.name,
      sector: newSector,
      total_shares: 1200,
      available_shares: 800,
      base_price: basePrice,
      current_price: basePrice,
      price_history: [basePrice],
      market_cap: basePrice * 1200,
      is_crashed: false,
      epoch_required: "Stone Age"
    });

    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `EPOCH ADVANCEMENT: ${ai.name} enters the ${nextEpoch}`,
      body: `The sovereign nation of ${ai.name} has advanced to the ${nextEpoch} era. New industries emerge, and markets respond with a 15% surge across domestic stocks.`,
      category: "tech",
      tier: "gold",
      nation_name: ai.name,
      nation_flag: ai.flag_emoji || "🌐",
      nation_color: ai.flag_color || "#6366f1"
    });
  }

  // --- MARKET BEHAVIOR: buy undervalued stocks from stable nations ---
  if (Math.random() < 0.3 && (updates.currency || ai.currency || 0) > 200) {
    const allStocks = await base44.asServiceRole.entities.Stock.list("-market_cap", 30);
    const candidates = allStocks.filter(s =>
      s.available_shares > 20 &&
      !s.is_crashed &&
      s.nation_id !== ai.id
    ).sort((a, b) => {
      // prefer undervalued: low price vs base
      const aVal = (a.current_price || 5) / (a.base_price || 5);
      const bVal = (b.current_price || 5) / (b.base_price || 5);
      return aVal - bVal;
    });

    if (candidates.length > 0) {
      const target = candidates[0];
      const sharesToBuy = Math.min(10, Math.floor((updates.currency || ai.currency) / (target.current_price || 5) * 0.1));
      if (sharesToBuy >= 1) {
        const totalCost = sharesToBuy * (target.current_price || 5);
        await base44.asServiceRole.entities.Stock.update(target.id, {
          available_shares: Math.max(0, target.available_shares - sharesToBuy)
        });
        updates.currency = Math.max(0, (updates.currency || ai.currency || 0) - totalCost);

        // Check if there's already a holding
        const existing = await base44.asServiceRole.entities.StockHolding.filter({
          nation_id: ai.id, stock_id: target.id
        });
        if (existing.length > 0) {
          const h = existing[0];
          const newTotal = (h.shares_owned || 0) + sharesToBuy;
          const newAvg = ((h.avg_buy_price || target.current_price) * (h.shares_owned || 0) + totalCost) / newTotal;
          await base44.asServiceRole.entities.StockHolding.update(h.id, {
            shares_owned: newTotal,
            avg_buy_price: parseFloat(newAvg.toFixed(2))
          });
        } else {
          await base44.asServiceRole.entities.StockHolding.create({
            nation_id: ai.id,
            nation_name: ai.name,
            stock_id: target.id,
            stock_ticker: target.ticker,
            company_name: target.company_name,
            shares_owned: sharesToBuy,
            avg_buy_price: parseFloat((target.current_price || 5).toFixed(2))
          });
        }

        await base44.asServiceRole.entities.Transaction.create({
          type: "stock_buy",
          from_nation_id: ai.id,
          from_nation_name: ai.name,
          to_nation_id: target.nation_id,
          to_nation_name: target.nation_name,
          stock_id: target.id,
          stock_ticker: target.ticker,
          shares: sharesToBuy,
          price_per_share: parseFloat((target.current_price || 5).toFixed(2)),
          total_value: parseFloat(totalCost.toFixed(2)),
          description: `${ai.name} acquired ${sharesToBuy} shares of ${target.ticker}`
        });
      }
    }
  }

  // --- COLLAPSE CHECK ---
  if ((updates.currency || ai.currency || 0) <= 0 && stability <= 15) {
    // Nation collapses — post news, don't delete (admin handles replacement)
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `COLLAPSE: ${ai.name} descends into economic ruin`,
      body: `The nation of ${ai.name} has collapsed following prolonged economic instability. Its markets are in freefall and the government has dissolved.`,
      category: "war",
      tier: "breaking",
      nation_name: ai.name,
      nation_flag: ai.flag_emoji || "🌐",
      nation_color: "#ef4444"
    });
    // Reset nation to struggling state instead of deleting
    updates.gdp = 300;
    updates.stability = 40;
    updates.public_trust = 0.6;
    updates.currency = 200;
    updates.is_in_market_crash = true;
    updates.crash_turns_remaining = 5;
  }

  // --- UPDATE NATION ---
  await base44.asServiceRole.entities.Nation.update(ai.id, updates);

  // --- UPDATE AI STOCKS (run economy tick) ---
  const aiStocks = await base44.asServiceRole.entities.Stock.filter({ nation_id: ai.id });
  for (const stock of aiStocks) {
    const fundamental = (updates.gdp / 100) * ((updates.stability || 75) / 100) * (updates.public_trust || 1.0) * (stock.base_price || 5);
    const held = stock.total_shares - stock.available_shares;
    const demandMult = 0.7 + (held / Math.max(stock.total_shares, 1)) * 0.6;
    const noise = 0.95 + Math.random() * 0.1;
    let newPrice = parseFloat((fundamental * demandMult * noise).toFixed(2));
    newPrice = Math.max(0.01, newPrice);
    const history = [...(stock.price_history || []), newPrice].slice(-20);
    await base44.asServiceRole.entities.Stock.update(stock.id, {
      current_price: newPrice,
      price_history: history,
      market_cap: Math.round(newPrice * stock.total_shares),
      is_crashed: newPrice < (stock.base_price || 5) * 0.3
    });
  }

  // --- OCCASIONAL NEWS EVENT FROM AI NATION ---
  if (Math.random() < 0.08) {
    const events = [
      { h: `${ai.name} announces economic stimulus package`, b: `${ai.name}'s leadership unveils a major investment in infrastructure and education. Markets respond positively.`, cat: "economy" },
      { h: `${ai.name} reaches trade milestone`, b: `Cross-border commerce from ${ai.name} surges, boosting regional market liquidity.`, cat: "economy" },
      { h: `${ai.name} upgrades military readiness`, b: `${ai.name} has modernized its defensive capabilities, citing regional instability as motivation.`, cat: "policy" },
      { h: `${ai.name} scientists make breakthrough`, b: `Research teams in ${ai.name} have pioneered a new advancement, accelerating the nation's technological roadmap.`, cat: "tech" },
    ];
    const ev = pick(events);
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: ev.h, body: ev.b, category: ev.cat, tier: "standard",
      nation_name: ai.name, nation_flag: ai.flag_emoji || "🌐", nation_color: ai.flag_color || "#6366f1"
    });
  }
}