/**
 * WorldSimulationEngine — Headless background component
 *
 * Drives the living geopolitical world:
 * - AI Strategic Decision ticks (alliances, trade proposals, war threats)
 * - Global Event Generator (disasters, crises, breakthroughs)
 * - World Chronicle recording
 * - AI faction pressure messages
 * - Diplomatic agreement monitoring
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS, TICKS_PER_DAY, TICKS_PER_WEEK } from "../game/GameClock";

// ─────────────────────────────────────────────────────────────────────────────
// CULTURAL IDENTITY SYSTEM
// Deterministic per nation name
// ─────────────────────────────────────────────────────────────────────────────
const CULTURES = [
  { id: "military_empire",       label: "Military Empire",       traits: "values strength, expansion, and strategic dominance",        diplomacyBias: "aggressive" },
  { id: "economic_powerhouse",   label: "Economic Powerhouse",   traits: "trade-focused, values GDP, negotiates through leverage",     diplomacyBias: "trade" },
  { id: "technological_society", label: "Technological Society", traits: "innovation-driven, believes in science and progress",         diplomacyBias: "cooperative" },
  { id: "environmental_coalition",label:"Environmental Coalition","traits": "sustainability-focused, anti-fossil-fuel, seeks green alliances", diplomacyBias: "cooperative" },
  { id: "religious_state",       label: "Religious State",       traits: "values ideology, morality in politics, cautious of outsiders", diplomacyBias: "isolationist" },
  { id: "mercantile_republic",   label: "Mercantile Republic",   traits: "trade guilds run policy, profit-driven foreign relations",    diplomacyBias: "trade" },
  { id: "warrior_clans",         label: "Warrior Clans",         traits: "honor-bound, martial culture, respect earned through strength", diplomacyBias: "aggressive" },
];

export function getCulture(nation) {
  let h = 0;
  for (const c of (nation.name || "X")) h = (h * 17 + c.charCodeAt(0)) & 0xffff;
  return CULTURES[h % CULTURES.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIC GOALS SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const STRATEGIC_GOALS = [
  { id: "dominate_oil",       label: "Dominate the global oil market",          relevantIf: n => (n.res_oil || 0) > 50 },
  { id: "expand_military",    label: "Expand military strength",                relevantIf: n => (n.unit_power || 0) > 15 },
  { id: "economic_growth",    label: "Achieve rapid economic growth",           relevantIf: n => (n.gdp || 0) > 300 },
  { id: "secure_food",        label: "Secure food supply for population",       relevantIf: n => (n.res_food || 0) < 100 },
  { id: "tech_advancement",   label: "Advance technological capabilities",      relevantIf: n => (n.tech_level || 1) > 2 },
  { id: "forge_alliances",    label: "Build a coalition of allied nations",     relevantIf: n => (n.allies || []).length < 2 },
  { id: "resource_security",  label: "Secure critical resource supply chains",  relevantIf: () => true },
  { id: "global_influence",   label: "Project global political influence",      relevantIf: n => (n.gdp || 0) > 500 },
];

export function getStrategicGoal(nation) {
  let h = 0;
  for (const c of (nation.name || "X")) h = (h * 13 + c.charCodeAt(0)) & 0xffff;
  // Prefer relevant goals
  const relevant = STRATEGIC_GOALS.filter(g => g.relevantIf(nation));
  const pool = relevant.length ? relevant : STRATEGIC_GOALS;
  return pool[h % pool.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL FACTION PRESSURES
// ─────────────────────────────────────────────────────────────────────────────
const FACTIONS = [
  { id: "military_council",   label: "Military Council",     message: (n) => `The Military Council of ${n.name} demands increased defense spending to counter regional threats.` },
  { id: "industrial_sector",  label: "Industrial Sector",    message: (n) => `${n.name}'s Industrial Sector urges trade expansion and resource acquisition.` },
  { id: "science_ministry",   label: "Science Ministry",     message: (n) => `${n.name}'s Science Ministry is pushing for accelerated technological research funding.` },
  { id: "political_hardliners",label:"Political Hardliners", message: (n) => `Hardline factions within ${n.name} are pressuring leadership to take a stronger stance on foreign policy.` },
  { id: "economic_reformers", label: "Economic Reformers",   message: (n) => `Economic reformers in ${n.name} are calling for tax restructuring and reduced military spending.` },
];

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL EVENTS POOL
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_EVENTS = [
  { type: "disaster",    importance: "high",   title: "Major Earthquake",         template: (n) => `A devastating earthquake has struck ${n.name}, causing widespread infrastructure damage and humanitarian crisis.` },
  { type: "crisis",      importance: "high",   title: "Energy Shortage",          template: (n) => `A severe energy shortage is gripping ${n.name}, driving up global fuel prices.` },
  { type: "tech",        importance: "medium", title: "Technological Breakthrough",template: (n) => `${n.name}'s research division has announced a major breakthrough in renewable energy technology.` },
  { type: "revolution",  importance: "critical",title: "Political Revolution",    template: (n) => `A political revolution is underway in ${n.name}. The government's stability is under severe threat.` },
  { type: "crisis",      importance: "high",   title: "Famine Warning",           template: (n) => `${n.name} is facing a catastrophic famine warning as food reserves fall below critical levels.` },
  { type: "crisis",      importance: "medium", title: "Market Collapse",          template: (n) => `Financial markets in ${n.name} have collapsed, sending shockwaves through the global economy.` },
  { type: "tech",        importance: "medium", title: "Military Advancement",     template: (n) => `${n.name} has successfully tested a new generation of military technology, raising regional tensions.` },
  { type: "disaster",    importance: "high",   title: "Severe Flooding",          template: (n) => `Catastrophic flooding has devastated agricultural regions of ${n.name}, threatening food supply chains.` },
  { type: "narrative",   importance: "medium", title: "Population Boom",          template: (n) => `${n.name} is experiencing unprecedented population growth, straining infrastructure and resources.` },
  { type: "crisis",      importance: "high",   title: "Diplomatic Incident",      template: (n) => `A serious diplomatic incident involving ${n.name} is escalating tensions across the region.` },
];

// ─────────────────────────────────────────────────────────────────────────────
// WORLD CHRONICLE HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function recordChronicle({ event_type, title, summary, actors = [], importance = "medium", era_tag = "" }) {
  try {
    await base44.entities.WorldChronicle.create({ event_type, title, summary, actors, importance, era_tag });
  } catch { /* non-blocking */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI STRATEGIC DECISION TICK
// Runs periodically — AI nations take proactive actions
// ─────────────────────────────────────────────────────────────────────────────
async function runStrategicTick(myNationId) {
  try {
    const allNations = await base44.entities.Nation.list("-gdp", 30);
    const users = await base44.entities.User.list();
    const userEmails = new Set(users.map(u => u.email));

    const aiNations = allNations.filter(n =>
      n.id !== myNationId &&
      n.owner_email &&
      !userEmails.has(n.owner_email)
    );

    if (!aiNations.length) return;

    // Pick 1–2 AI nations to act this tick
    const shuffled = [...aiNations].sort(() => Math.random() - 0.5).slice(0, 2);

    for (const nation of shuffled) {
      const goal = getStrategicGoal(nation);
      const culture = getCulture(nation);
      const action = pickStrategicAction(nation, goal, culture, allNations);
      if (!action) continue;

      // Small delay between actions
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
      await executeStrategicAction(nation, action, goal, allNations);
    }
  } catch { /* non-blocking */ }
}

function pickStrategicAction(nation, goal, culture, allNations) {
  const roll = Math.random();

  // War-related (rare, only when at conflict or high military)
  const isAtWar = (nation.at_war_with || []).length > 0;
  if (isAtWar && roll < 0.15) return "war_statement";

  // Trade/alliance proposals
  if (goal.id === "forge_alliances" && roll < 0.4) return "propose_alliance";
  if (goal.id === "dominate_oil" && (nation.res_oil || 0) > 30 && roll < 0.35) return "oil_trade_offer";
  if (goal.id === "economic_growth" && roll < 0.3) return "trade_proposal";
  if (goal.id === "expand_military" && roll < 0.25) return "military_posture";
  if (goal.id === "secure_food" && (nation.res_food || 0) < 80 && roll < 0.4) return "request_food_aid";

  // Aid — resource/credit-wealthy AI nations can send aid
  if ((nation.currency || 0) > 500 && roll < 0.12) return "send_aid";

  // AI stock buying — AI nations invest in other nations' stocks
  if ((nation.currency || 0) > 200 && roll < 0.18) return "buy_stock";

  // General diplomacy
  if (roll < 0.2) return "diplomatic_statement";
  return null;
}

async function executeStrategicAction(nation, action, goal, allNations) {
  const culture = getCulture(nation);

  let content = null;
  let systemMsg = null;

  // Pick a target nation for bilateral messages
  const others = allNations.filter(n => n.id !== nation.id && n.name !== nation.name);
  const target = others[Math.floor(Math.random() * others.length)];

  const prompt = buildStrategicPrompt(nation, action, goal, culture, target);

  try {
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    content = typeof res === "string" ? res : res?.response || res?.text || String(res);
    content = content?.trim().replace(/^["']|["']$/g, "").slice(0, 300);
    if (!content || content.length < 5) return;
  } catch { return; }

  // Post as a chat message from this AI nation
  const { leaderDisplayName } = await import("./AIDiplomacyEngine");
  await base44.entities.ChatMessage.create({
    channel: "global",
    sender_nation_id:   nation.id,
    sender_nation_name: leaderDisplayName(nation),
    sender_flag:        nation.flag_emoji || "🏴",
    sender_color:       nation.flag_color || "#64748b",
    sender_role:        "ai",
    content,
    reply_to_id:   "",
    reply_to_name: "",
  });

  // Execute real transfer for trade/aid actions targeting player nations
  if (["oil_trade_offer", "trade_proposal", "send_aid"].includes(action) && target) {
    executeGlobalChatAid(nation, target, action).catch(() => {});
  }

  // Execute AI stock purchase
  if (action === "buy_stock") {
    executeAIStockPurchase(nation).catch(() => {});
  }

  // Record in chronicle for high-importance actions
  if (["propose_alliance", "oil_trade_offer", "war_statement"].includes(action)) {
    await recordChronicle({
      event_type: action === "propose_alliance" ? "alliance" : action === "war_statement" ? "war" : "trade",
      title: `${nation.name}: ${goal.label}`,
      summary: content.slice(0, 200),
      actors: [nation.name, target?.name].filter(Boolean),
      importance: action === "war_statement" ? "high" : "medium",
      era_tag: nation.epoch || "",
    });
  }
}

function buildStrategicPrompt(nation, action, goal, culture, target) {
  const gameCtx = `
Nation: ${nation.name} | Era: ${nation.epoch || "Stone Age"}
Culture: ${culture.label} — ${culture.traits}
Strategic Goal: ${goal.label}
Resources: Oil=${nation.res_oil || 0}, Food=${nation.res_food || 0}, Iron=${nation.res_iron || 0}, Gold=${nation.res_gold || 0}
GDP: ${nation.gdp || 0} | Military: ${nation.unit_power || 0} | Stability: ${Math.round(nation.stability || 75)}%
At War: ${(nation.at_war_with || []).join(", ") || "No"}
Allies: ${(nation.allies || []).join(", ") || "None"}
Target nation for message: ${target?.name || "the global community"}`.trim();

  const actionPrompts = {
    propose_alliance: `You are the leader of ${nation.name}. Propose a formal alliance or coalition to ${target?.name || "other nations"} on the world stage. Reference your strategic goal: "${goal.label}". Be diplomatic but self-interested. 1–2 sentences only, no prefix or quotes.`,
    oil_trade_offer:  `You are the leader of ${nation.name}. You have ${nation.res_oil} oil reserves. Publicly offer oil trade to interested nations. Include a brief terms suggestion. 1–2 sentences, no prefix.`,
    trade_proposal:   `You are the leader of ${nation.name}. Make a strategic trade proposal to ${target?.name || "the world"} based on your economic goals. Reference actual resource values. 1–2 sentences, no prefix.`,
    military_posture: `You are the leader of ${nation.name}. Make a strong but measured statement about your military capabilities and strategic interests. Warn without direct threats. 1–2 sentences, no prefix.`,
    request_food_aid: `You are the leader of ${nation.name}. Your food reserves are critically low (${nation.res_food}). Formally request humanitarian food assistance from the international community. Be dignified but urgent. 1–2 sentences, no prefix.`,
    war_statement:    `You are the leader of ${nation.name}, currently at war with ${(nation.at_war_with || []).join(", ")}. Make a brief wartime public statement on the global channel. Assertive, determined. 1 sentence, no prefix.`,
    diplomatic_statement: `You are the leader of ${nation.name}. Make a brief, authentic diplomatic statement on the world stage that reflects your culture (${culture.label}) and current strategic goal. 1–2 sentences, no prefix.`,
    send_aid: `You are the leader of ${nation.name}. You are sending financial aid or resources to ${target?.name || "a nation in need"}. Announce this generosity on the world stage. Mention the act of aid. 1–2 sentences, no prefix.`,
    buy_stock: `You are the leader of ${nation.name}. Your nation's sovereign wealth fund is investing in foreign stock markets. Announce this investment strategy briefly. 1 sentence, no prefix.`,
  };

  return `${gameCtx}\n\n${actionPrompts[action] || actionPrompts.diplomatic_statement}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI GLOBAL CHAT AID EXECUTOR
// When AI posts trade/aid in global chat, execute the real transfer to players
// ─────────────────────────────────────────────────────────────────────────────
async function executeGlobalChatAid(aiNation, targetNation, action) {
  try {
    const users = await base44.entities.User.list();
    const userEmails = new Set(users.map(u => u.email));
    // Only transfer to real player nations
    if (!targetNation.owner_email || !userEmails.has(targetNation.owner_email)) return;

    const freshNations = await base44.entities.Nation.list();
    const freshAI     = freshNations.find(n => n.id === aiNation.id);
    const freshTarget = freshNations.find(n => n.id === targetNation.id);
    if (!freshAI || !freshTarget) return;

    let transferAmt = 0;
    let resKey = null;
    let resLabel = null;

    if (action === "oil_trade_offer" && (freshAI.res_oil || 0) > 40) {
      resKey = "res_oil"; resLabel = "oil";
      transferAmt = Math.min(150, Math.floor((freshAI.res_oil || 0) * 0.25));
    } else if (action === "send_aid" && (freshAI.currency || 0) > 200) {
      transferAmt = Math.min(500, Math.floor((freshAI.currency || 0) * 0.15));
    } else if (action === "trade_proposal" && (freshAI.currency || 0) > 100) {
      transferAmt = Math.min(300, Math.floor((freshAI.currency || 0) * 0.10));
    }

    if (transferAmt < 10) return;

    if (resKey) {
      await base44.entities.Nation.update(freshAI.id, { [resKey]: Math.max(0, (freshAI[resKey] || 0) - transferAmt) });
      await base44.entities.Nation.update(freshTarget.id, { [resKey]: (freshTarget[resKey] || 0) + transferAmt });
      await base44.entities.Transaction.create({
        type: "lend_lease",
        from_nation_id: freshAI.id, from_nation_name: freshAI.name,
        to_nation_id: freshTarget.id, to_nation_name: freshTarget.name,
        resource_type: resKey, resource_amount: transferAmt, total_value: transferAmt,
        description: `${freshAI.name} sent ${transferAmt} ${resLabel} to ${freshTarget.name} via global trade offer`,
      });
    } else {
      await base44.entities.Nation.update(freshAI.id, { currency: Math.max(0, (freshAI.currency || 0) - transferAmt) });
      await base44.entities.Nation.update(freshTarget.id, { currency: (freshTarget.currency || 0) + transferAmt });
      await base44.entities.Transaction.create({
        type: "lend_lease",
        from_nation_id: freshAI.id, from_nation_name: freshAI.name,
        to_nation_id: freshTarget.id, to_nation_name: freshTarget.name,
        total_value: transferAmt,
        description: `${freshAI.name} sent ${transferAmt} credits to ${freshTarget.name} via global aid`,
      });
    }

    await base44.entities.Notification.create({
      target_nation_id: freshTarget.id,
      target_owner_email: freshTarget.owner_email,
      type: "lend_lease",
      title: `Aid Received from ${freshAI.name}`,
      message: resKey
        ? `${freshAI.name} has shipped ${transferAmt} ${resLabel} to your nation following their public trade announcement.`
        : `${freshAI.name} has wired ${transferAmt} credits to your treasury as announced in global chat.`,
      severity: "success",
      is_read: false,
    });

    await base44.entities.ChatMessage.create({
      channel: "global",
      sender_nation_name: "TRADE BUREAU",
      sender_flag: "🤝",
      sender_color: "#10b981",
      sender_role: "system",
      content: resKey
        ? `✅ TRANSFER CONFIRMED — ${freshAI.name} shipped ${transferAmt} ${resLabel} → ${freshTarget.name}.`
        : `✅ TRANSFER CONFIRMED — ${freshAI.name} wired ${transferAmt} credits → ${freshTarget.name}'s treasury.`,
    });
  } catch { /* non-blocking */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI STOCK PURCHASE
// AI nations buy shares in other nations' stocks using their treasury
// ─────────────────────────────────────────────────────────────────────────────
async function executeAIStockPurchase(aiNation) {
  try {
    const freshNations = await base44.entities.Nation.list();
    const freshAI = freshNations.find(n => n.id === aiNation.id);
    if (!freshAI || (freshAI.currency || 0) < 100) return;

    // Find stocks from other nations that aren't crashed
    const allStocks = await base44.entities.Stock.list("-market_cap", 30);
    const eligible = allStocks.filter(s =>
      s.nation_id !== aiNation.id &&
      !s.is_crashed &&
      (s.available_shares || 0) > 0 &&
      (s.current_price || 0) > 0 &&
      (s.current_price || 0) < (freshAI.currency || 0) * 0.3
    );
    if (!eligible.length) return;

    // Pick a stock — prefer higher epoch, stable nations
    const pick = eligible[Math.floor(Math.random() * Math.min(eligible.length, 8))];
    const maxSpend = Math.min(300, Math.floor((freshAI.currency || 0) * 0.15));
    const sharesToBuy = Math.max(1, Math.floor(maxSpend / (pick.current_price || 1)));
    if (sharesToBuy < 1 || sharesToBuy > (pick.available_shares || 0)) return;

    const totalCost = parseFloat((sharesToBuy * pick.current_price).toFixed(2));
    if (totalCost > (freshAI.currency || 0)) return;

    // Deduct from AI treasury
    await base44.entities.Nation.update(freshAI.id, {
      currency: Math.max(0, (freshAI.currency || 0) - totalCost),
    });

    // Update stock
    const newAvail = Math.max(0, (pick.available_shares || 0) - sharesToBuy);
    const newPrice = parseFloat((pick.current_price * (1 + sharesToBuy / Math.max(pick.total_shares, 1) * 0.5)).toFixed(2));
    const history = [...(pick.price_history || []), newPrice].slice(-20);
    await base44.entities.Stock.update(pick.id, {
      available_shares: newAvail,
      current_price: newPrice,
      price_history: history,
      market_cap: parseFloat((newPrice * (pick.total_shares || 500)).toFixed(2)),
    });

    // Upsert holding
    const existing = await base44.entities.StockHolding.filter({ nation_id: freshAI.id, stock_id: pick.id });
    if (existing.length) {
      const h = existing[0];
      const newAvgPrice = parseFloat(((h.avg_buy_price * h.shares_owned + totalCost) / (h.shares_owned + sharesToBuy)).toFixed(2));
      await base44.entities.StockHolding.update(h.id, {
        shares_owned: h.shares_owned + sharesToBuy,
        avg_buy_price: newAvgPrice,
      });
    } else {
      await base44.entities.StockHolding.create({
        nation_id: freshAI.id, nation_name: freshAI.name,
        stock_id: pick.id, stock_ticker: pick.ticker,
        company_name: pick.company_name,
        shares_owned: sharesToBuy, avg_buy_price: pick.current_price,
      });
    }

    // Log transaction
    await base44.entities.Transaction.create({
      type: "stock_buy",
      from_nation_id: freshAI.id, from_nation_name: freshAI.name,
      to_nation_id: pick.nation_id, to_nation_name: pick.nation_name,
      stock_id: pick.id, stock_ticker: pick.ticker,
      shares: sharesToBuy, price_per_share: pick.current_price,
      total_value: totalCost,
      description: `${freshAI.name} AI sovereign fund bought ${sharesToBuy} shares of ${pick.ticker}`,
    }).catch(() => {});
  } catch { /* non-blocking */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI STOCK ISSUANCE
// Periodically lists stocks for qualifying AI nations that haven't listed yet
// ─────────────────────────────────────────────────────────────────────────────
async function runAIStockIssuance(myNationId) {
  try {
    const allNations = await base44.entities.Nation.list("-gdp", 30);
    const users      = await base44.entities.User.list();
    const userEmails = new Set(users.map(u => u.email));

    const aiNations = allNations.filter(n =>
      n.id !== myNationId &&
      n.owner_email &&
      !userEmails.has(n.owner_email) &&
      (n.gdp || 0) >= 200 &&
      (n.stability || 0) >= 35
    );
    if (!aiNations.length) return;

    const allStocks = await base44.entities.Stock.list();
    const listedIds = new Set(allStocks.map(s => s.nation_id));

    for (const nation of aiNations) {
      if (listedIds.has(nation.id)) continue;

      const ticker     = nation.name.replace(/[^A-Za-z]/g, "").substring(0, 4).toUpperCase() || "NATL";
      // Realistic IPO price: capped at $80, based on GDP/stability/epoch
      const gdpFactor = Math.min(2.0, (nation.gdp || 200) / 500);
      const stabFactor = Math.min(1.2, (nation.stability || 65) / 100 + 0.3);
      const trustFactor = Math.min(1.5, nation.public_trust || 1.0);
      const epochIdx = ["Stone Age","Bronze Age","Iron Age","Classical Age","Medieval Age","Renaissance Age","Industrial Age","Modern Age","Digital Age","Information Age","Space Age","Galactic Age"].indexOf(nation.epoch || "Stone Age");
      const epochFactor = 1 + Math.max(0, epochIdx) * 0.15;
      const basePrice = Math.max(3, Math.min(80, parseFloat((5 * gdpFactor * stabFactor * trustFactor * epochFactor).toFixed(2))));
      const totalShares = 500 + Math.floor((epochIdx || 0) * 100);
      const sector = (nation.res_oil || 0) > 30 ? "Energy"
        : (nation.unit_power || 0) > 25 ? "Defense"
        : (nation.tech_level || 1) > 5 ? "Technology"
        : (nation.tech_level || 1) > 3 ? "Finance"
        : "Agriculture";

      await base44.entities.Stock.create({
        company_name:     `${nation.name} National Corp`,
        ticker,
        nation_id:        nation.id,
        nation_name:      nation.name,
        sector,
        total_shares:     totalShares,
        available_shares: totalShares,
        base_price:       basePrice,
        current_price:    basePrice,
        price_history:    [],
        market_cap:       basePrice * totalShares,
        epoch_required:   nation.epoch || "Stone Age",
        is_crashed:       false,
      });

      await base44.entities.ChatMessage.create({
        channel:            "global",
        sender_nation_name: "GLOBAL EXCHANGE",
        sender_flag:        "📈",
        sender_color:       "#10b981",
        sender_role:        "system",
        content:            `📊 IPO ALERT — ${nation.name} has listed "${nation.name} National Corp" [${ticker}] on the Global Exchange. ${totalShares} shares at ${basePrice} credits each. Sector: ${sector}.`,
      });

      listedIds.add(nation.id); // prevent duplicate in same run
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch { /* non-blocking */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL EVENT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
async function generateGlobalEvent() {
  try {
    const allNations = await base44.entities.Nation.list("-gdp", 20);
    if (!allNations.length) return;

    // Pick a random nation + event
    const nation = allNations[Math.floor(Math.random() * allNations.length)];
    const event  = GLOBAL_EVENTS[Math.floor(Math.random() * GLOBAL_EVENTS.length)];
    const body   = event.template(nation);

    // Post as system message
    await base44.entities.ChatMessage.create({
      channel: "system",
      sender_nation_name: "WORLD EVENTS",
      sender_flag: "🌍",
      sender_color: "#f59e0b",
      sender_role: "system",
      content: `🌐 ${event.title.toUpperCase()}\n${body}`,
    });

    // Record in chronicle
    await recordChronicle({
      event_type: event.type,
      title: `${event.title}: ${nation.name}`,
      summary: body,
      actors: [nation.name],
      importance: event.importance,
      era_tag: nation.epoch || "",
    });
  } catch { /* non-blocking */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTION PRESSURE GENERATOR
// Occasional internal politics messages
// ─────────────────────────────────────────────────────────────────────────────
async function generateFactionPressure(myNationId) {
  try {
    const allNations = await base44.entities.Nation.list("-gdp", 20);
    const users = await base44.entities.User.list();
    const userEmails = new Set(users.map(u => u.email));

    const aiNations = allNations.filter(n =>
      n.id !== myNationId &&
      n.owner_email &&
      !userEmails.has(n.owner_email)
    );
    if (!aiNations.length) return;

    const nation  = aiNations[Math.floor(Math.random() * aiNations.length)];
    const faction = FACTIONS[Math.floor(Math.random() * FACTIONS.length)];
    const msg     = faction.message(nation);

    await base44.entities.ChatMessage.create({
      channel: "system",
      sender_nation_name: "INTEL DISPATCH",
      sender_flag: "📡",
      sender_color: "#8b5cf6",
      sender_role: "system",
      content: `🏛 INTERNAL REPORT — ${nation.name}\n${msg}`,
    });
  } catch { /* non-blocking */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function WorldSimulationEngine({ myNation }) {
  const tickRef       = useRef(null);
  const eventRef      = useRef(null);
  const factionRef    = useRef(null);
  const stockRef      = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!myNation?.id || initializedRef.current) return;
    initializedRef.current = true;

    // Strategic AI tick: every 5 game ticks (5 real minutes)
    const stratInterval = 5 * TICK_MS + Math.random() * 2 * TICK_MS;
    tickRef.current = setInterval(() => {
      runStrategicTick(myNation.id);
    }, stratInterval);

    // Global events: every 1 game day (30 real minutes) ±10%
    const eventInterval = TICKS_PER_DAY * TICK_MS * (0.9 + Math.random() * 0.2);
    eventRef.current = setInterval(() => {
      generateGlobalEvent();
    }, eventInterval);

    // Faction pressure: every 1.5 game days (45 real minutes) ±10%
    const factionInterval = TICKS_PER_DAY * 1.5 * TICK_MS * (0.9 + Math.random() * 0.2);
    factionRef.current = setInterval(() => {
      generateFactionPressure(myNation.id);
    }, factionInterval);

    // AI Stock issuance: run on mount + every 10 ticks (10 real minutes)
    runAIStockIssuance(myNation.id);
    stockRef.current = setInterval(() => {
      runAIStockIssuance(myNation.id);
    }, 10 * TICK_MS);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(eventRef.current);
      clearInterval(factionRef.current);
      clearInterval(stockRef.current);
      initializedRef.current = false;
    };
  }, [myNation?.id]);

  return null;
}