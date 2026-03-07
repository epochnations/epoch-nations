/**
 * AI Diplomacy & Espionage Engine
 * Runs full diplomatic relations, trade deals, sanctions, espionage ops,
 * counter-intel, double agents, and tech theft between all nations.
 * Call this alongside aiNationsTick (scheduled every ~10 min).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const AI_EMAIL_PREFIX = "ai_nation_";
const EPOCHS_ORDER = [
  "Stone Age","Copper Age","Bronze Age","Iron Age","Dark Ages",
  "Middle Ages","Renaissance","Imperial Age","Enlightenment Age",
  "Industrial Age","Modern Age","Atomic Age","Digital Age",
  "Genetic Age","Synthetic Age","Nano Age"
];

// ─── Personality Registry ──────────────────────────────────────────────────────
const PERSONALITIES = {
  "Valdris":   { archetype:"Expansionist",  aggression:0.8,  diplomacy:0.3, economy:0.5, tech:0.4, espionage:0.6, trust:0.3 },
  "Omneth":    { archetype:"Technocrat",    aggression:0.2,  diplomacy:0.5, economy:0.6, tech:0.9, espionage:0.7, trust:0.6 },
  "Caelorum":  { archetype:"Peacekeeper",   aggression:0.1,  diplomacy:0.9, economy:0.6, tech:0.5, espionage:0.1, trust:0.9 },
  "Drakonyx":  { archetype:"Warmonger",     aggression:0.95, diplomacy:0.1, economy:0.3, tech:0.3, espionage:0.5, trust:0.1 },
  "Solmara":   { archetype:"Merchant",      aggression:0.2,  diplomacy:0.7, economy:0.95,tech:0.5, espionage:0.4, trust:0.7 },
  "Xerathia":  { archetype:"Isolationist",  aggression:0.4,  diplomacy:0.2, economy:0.7, tech:0.6, espionage:0.6, trust:0.2 },
  "Nuvaris":   { archetype:"Diplomat",      aggression:0.15, diplomacy:0.95,economy:0.5, tech:0.5, espionage:0.2, trust:0.9 },
  "Imperath":  { archetype:"Imperialist",   aggression:0.7,  diplomacy:0.4, economy:0.6, tech:0.4, espionage:0.7, trust:0.3 },
  "Thymorex":  { archetype:"Revolutionary", aggression:0.6,  diplomacy:0.3, economy:0.4, tech:0.7, espionage:0.8, trust:0.2 },
  "Celestara": { archetype:"Economist",     aggression:0.1,  diplomacy:0.6, economy:0.95,tech:0.7, espionage:0.3, trust:0.8 },
};
const DEFAULT_P = { archetype:"Balanced", aggression:0.4, diplomacy:0.5, economy:0.6, tech:0.5, espionage:0.4, trust:0.5 };

// ─── Diplomatic Relation States ────────────────────────────────────────────────
// Relations score: -100 (hostile) to +100 (close ally)
// States: "hostile" < -50, "cold" -50..0, "neutral" 0..30, "friendly" 30..60, "allied" > 60

const RELATION_THRESHOLDS = { hostile:-50, cold:0, neutral:30, friendly:60 };

function getRelationState(score) {
  if (score >= 60) return "allied";
  if (score >= 30) return "friendly";
  if (score >= 0)  return "neutral";
  if (score >= -50) return "cold";
  return "hostile";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isAiEmail(e) { return e?.startsWith(AI_EMAIL_PREFIX); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v,mn,mx) { return Math.max(mn,Math.min(mx,v)); }
function rand(mn,mx) { return mn + Math.random()*(mx-mn); }
function getP(name) { return PERSONALITIES[name] || DEFAULT_P; }
function epochIdx(nation) { return EPOCHS_ORDER.indexOf(nation.epoch || "Stone Age"); }
function powerScore(n) { return (n.gdp||500)+(epochIdx(n)*200)+(n.stability||75)*2; }

const LEADER_FIRST = ["Aldric","Zara","Corvus","Elia","Drath","Mira","Kael","Vex","Nora","Harak","Sable","Theron","Lyra","Orin"];
const LEADER_LAST  = ["Vor","Ashvane","Malgrave","Stormbind","Hellfire","Dawnwatch","Ironveil","Coldmark","Serath","Voss","Crane","Holt","Deyn"];
function leaderOf(name) {
  const s = name.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  return `${LEADER_FIRST[s%LEADER_FIRST.length]} ${LEADER_LAST[(s*7)%LEADER_LAST.length]}`;
}

// ─── Relation Memory Store (in-memory per tick — persisted via NewsArticle/Notification) ──
// We encode a compact relations map in each AI nation's nation_bylaws field as JSON.
// Format: { "nationId": score, ... }
function loadRelations(nation) {
  try { return JSON.parse(nation.nation_bylaws || "{}"); }
  catch { return {}; }
}
function buildRelationsUpdate(relations) {
  return { nation_bylaws: JSON.stringify(relations) };
}
function adjustRelation(relations, targetId, delta) {
  const cur = relations[targetId] || 0;
  relations[targetId] = clamp(cur + delta, -100, 100);
  return relations;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const allNations = await base44.asServiceRole.entities.Nation.list("-gdp", 200);
    const aiNations  = allNations.filter(n => isAiEmail(n.owner_email));
    const humanNations = allNations.filter(n => !isAiEmail(n.owner_email));

    // Run diplomacy + espionage for every AI
    for (const ai of aiNations) {
      await runDiplomacyAndEspionage(base44, ai, allNations, aiNations, humanNations);
    }

    // Cross-AI relation decay / drift
    await runRelationDrift(base44, aiNations);

    // Occasional multi-nation diplomatic event
    if (Math.random() < 0.2) {
      await generateDiplomaticEvent(base44, allNations);
    }

    return Response.json({ ok:true, processed: aiNations.length, ts: new Date().toISOString() });
  } catch(e) {
    console.error("aiDiplomacyEspionage error:", e);
    return Response.json({ error: e.message }, { status:500 });
  }
});

// ─── Core Per-Nation Loop ─────────────────────────────────────────────────────
async function runDiplomacyAndEspionage(base44, ai, allNations, aiNations, humanNations) {
  const p = getP(ai.name);
  const relations = loadRelations(ai);
  const relUpdates = { ...relations };
  const others = allNations.filter(n => n.id !== ai.id);

  // 1. Personality-Driven Relation Drift (natural affinities/antipathies)
  for (const other of others) {
    const op = getP(other.name);
    // Diplomats like everyone, Warmongers distrust everyone
    const naturalDrift = (p.diplomacy - 0.5) * 0.8 - (p.aggression - 0.5) * 0.5;
    // Mutual ideology bonus: same archetype = like each other more
    const ideologyBonus = p.archetype === op.archetype ? 0.5 : 0;
    // Mutual enemy enemy-of-enemy bonus
    const sharedEnemy = (ai.at_war_with||[]).some(id => (other.at_war_with||[]).includes(id)) ? 1.0 : 0;
    adjustRelation(relUpdates, other.id, naturalDrift + ideologyBonus + sharedEnemy);
  }

  // 2. Trade Deal Proposals (economy + diplomatic AIs)
  if (p.economy > 0.5 && Math.random() < 0.08) {
    await runTradeDiplomacy(base44, ai, p, others, relUpdates, humanNations);
  }

  // 3. Sanctions & Embargoes (aggressive / imperialist AIs against weaker nations)
  if (p.aggression > 0.5 && Math.random() < 0.06) {
    await runSanctionsLogic(base44, ai, p, others, relUpdates);
  }

  // 4. Espionage Operations
  if (p.espionage > 0.3 && Math.random() < p.espionage * 0.15) {
    await runEspionageOp(base44, ai, p, others, relUpdates, humanNations);
  }

  // 5. Counter-Intelligence
  if (Math.random() < 0.1 + p.tech * 0.1) {
    await runCounterIntel(base44, ai, p, humanNations, relUpdates);
  }

  // 6. Personality mood events: grudges, forgiveness, rivalry declarations
  if (Math.random() < 0.05) {
    await runMoodEvent(base44, ai, p, others, relUpdates);
  }

  // Persist relation updates
  await base44.asServiceRole.entities.Nation.update(ai.id, buildRelationsUpdate(relUpdates));
}

// ─── Trade Diplomacy ─────────────────────────────────────────────────────────
async function runTradeDiplomacy(base44, ai, p, others, relUpdates, humanNations) {
  const candidates = others.filter(n =>
    (relUpdates[n.id]||0) >= -20 &&
    !(ai.at_war_with||[]).includes(n.id)
  ).sort((a,b) => (relUpdates[b.id]||0) - (relUpdates[a.id]||0));

  if (!candidates.length) return;
  const target = candidates[0];
  const isHuman = !isAiEmail(target.owner_email);
  const relationScore = relUpdates[target.id] || 0;

  // Decide deal type
  let dealType, dealDesc, relBonus;
  if (relationScore >= 40) {
    dealType = "free_trade";
    dealDesc = "a comprehensive free trade agreement, eliminating all tariffs";
    relBonus = 8;
  } else if (relationScore >= 10) {
    dealType = "tariff_reduction";
    dealDesc = "a tariff reduction agreement, cutting import duties by 30%";
    relBonus = 4;
  } else {
    dealType = "tariff_reduction";
    dealDesc = "a preliminary trade dialogue framework";
    relBonus = 2;
  }

  // If AI-to-AI: auto-finalize if target's personality is compatible
  if (!isHuman) {
    const tp = getP(target.name);
    if (tp.economy > 0.4 && !(target.at_war_with||[]).includes(ai.id)) {
      // Create TradeAgreement
      const existing = await base44.asServiceRole.entities.TradeAgreement.filter({
        nation_a_id: ai.id, nation_b_id: target.id
      });
      if (!existing.length) {
        await base44.asServiceRole.entities.TradeAgreement.create({
          nation_a_id: ai.id, nation_a_name: ai.name,
          nation_b_id: target.id, nation_b_name: target.name,
          agreement_type: dealType,
          tariff_modifier: dealType === "free_trade" ? -0.15 : -0.08,
          status: "active",
          duration_cycles: 20, cycles_remaining: 20,
          owner_email: ai.owner_email
        });
        adjustRelation(relUpdates, target.id, relBonus);
        await base44.asServiceRole.entities.NewsArticle.create({
          headline: `TRADE DEAL: ${ai.name} and ${target.name} sign ${dealType.replace("_"," ")}`,
          body: `${leaderOf(ai.name)} and ${leaderOf(target.name)} have finalized ${dealDesc}. Economists project ${Math.floor(rand(3,12))}% GDP uplift for both nations.`,
          category: "economy", tier: "gold",
          nation_name: ai.name, nation_flag: ai.flag_emoji||"🌐", nation_color: ai.flag_color||"#6366f1"
        });
      }
    }
  } else {
    // Notify human player of deal offer
    await base44.asServiceRole.entities.Notification.create({
      target_nation_id: target.id,
      target_owner_email: target.owner_email,
      type: "lend_lease",
      title: `🤝 ${ai.name} proposes a ${dealType.replace("_"," ")} with you`,
      message: `${ai.name} (${getP(ai.name).archetype}) has proposed ${dealDesc} with your nation. The offer strengthens regional economic ties.`,
      severity: "info"
    });
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `OFFER: ${ai.name} proposes ${dealType.replace("_"," ")} to ${target.name}`,
      body: `${ai.name} has extended a formal trade proposal to ${target.name} covering ${dealDesc}. ${target.name}'s response is pending.`,
      category: "economy", tier: "standard",
      nation_name: ai.name, nation_flag: ai.flag_emoji||"🌐", nation_color: ai.flag_color||"#6366f1"
    });
  }
}

// ─── Sanctions & Embargoes ────────────────────────────────────────────────────
async function runSanctionsLogic(base44, ai, p, others, relUpdates) {
  // Sanction targets: nations AI dislikes, is weaker than, or is at war with allies
  const myScore = powerScore(ai);
  const targets = others.filter(n =>
    (relUpdates[n.id]||0) < -30 &&
    powerScore(n) < myScore &&
    !(ai.at_war_with||[]).includes(n.id)
  );
  if (!targets.length) return;
  const victim = targets[Math.floor(Math.random()*targets.length)];
  const sanctionType = pick(["economic_sanctions","trade_embargo","asset_freeze","diplomatic_expulsion"]);

  const outcomes = {
    economic_sanctions: { gdpHit:-Math.floor(rand(20,80)), stabilityHit:-Math.floor(rand(2,6)), relDelta:-10 },
    trade_embargo:      { gdpHit:-Math.floor(rand(30,100)), stabilityHit:0, relDelta:-15 },
    asset_freeze:       { currencyHit:-Math.floor(rand(50,150)), relDelta:-12 },
    diplomatic_expulsion:{ stabilityHit:-3, relDelta:-20 }
  };

  const outcome = outcomes[sanctionType];
  const victimUpdates = {};
  if (outcome.gdpHit) victimUpdates.gdp = Math.max(200, (victim.gdp||500) + outcome.gdpHit);
  if (outcome.stabilityHit) victimUpdates.stability = clamp((victim.stability||75)+outcome.stabilityHit, 5, 99);
  if (outcome.currencyHit) victimUpdates.currency = Math.max(0, (victim.currency||500) + outcome.currencyHit);

  if (Object.keys(victimUpdates).length) {
    await base44.asServiceRole.entities.Nation.update(victim.id, victimUpdates);
  }
  adjustRelation(relUpdates, victim.id, outcome.relDelta);

  const labels = {
    economic_sanctions: "sweeping economic sanctions",
    trade_embargo: "a full trade embargo",
    asset_freeze: "an international asset freeze",
    diplomatic_expulsion: "diplomatic expulsion of ambassadors"
  };

  await base44.asServiceRole.entities.NewsArticle.create({
    headline: `SANCTIONS: ${ai.name} imposes ${labels[sanctionType]} on ${victim.name}`,
    body: `${leaderOf(ai.name)} has announced ${labels[sanctionType]} targeting ${victim.name}, citing "threats to regional stability." Markets react as cross-border trade halts.`,
    category: "policy", tier: "gold",
    nation_name: ai.name, nation_flag: ai.flag_emoji||"🌐", nation_color: ai.flag_color||"#ef4444"
  });

  // Notify human victim
  if (!isAiEmail(victim.owner_email)) {
    await base44.asServiceRole.entities.Notification.create({
      target_nation_id: victim.id, target_owner_email: victim.owner_email,
      type: "market_crash",
      title: `⚠️ ${ai.name} has imposed ${labels[sanctionType]} on you`,
      message: `${ai.name} (${p.archetype}) has targeted your nation with ${labels[sanctionType]}. GDP and stability effects are active.`,
      severity: "warning"
    });
  }
}

// ─── Espionage Operations ─────────────────────────────────────────────────────
async function runEspionageOp(base44, ai, p, others, relUpdates, humanNations) {
  // Choose target: prefer rivals (low relation), or wealthier nations worth stealing from
  const myEpochIdx = epochIdx(ai);
  const opCandidates = others.filter(n =>
    n.id !== ai.id && !(ai.allies||[]).includes(n.id)
  ).sort((a,b) => {
    // Prefer high-value targets
    const aVal = powerScore(a) + Math.abs(relUpdates[a.id]||0);
    const bVal = powerScore(b) + Math.abs(relUpdates[b.id]||0);
    return bVal - aVal;
  });

  if (!opCandidates.length) return;
  const target = opCandidates[Math.floor(Math.random() * Math.min(3, opCandidates.length))];
  const targetEpochIdx = epochIdx(target);
  const isHuman = !isAiEmail(target.owner_email);

  // Espionage success chance: based on AI's tech + espionage trait vs target's defense
  const successChance = clamp(0.2 + p.espionage * 0.5 + (myEpochIdx - targetEpochIdx) * 0.05, 0.1, 0.85);
  const caught = Math.random() > successChance;

  const ops = [
    { type:"tech_theft",        weight: p.tech > 0.5 ? 3 : 1 },
    { type:"economic_sabotage", weight: p.economy > 0.5 ? 2 : 1 },
    { type:"military_intel",    weight: p.aggression > 0.5 ? 3 : 1 },
    { type:"propaganda_plant",  weight: p.aggression > 0.4 ? 2 : 1 },
    { type:"double_agent",      weight: p.espionage > 0.6 ? 3 : 1 },
    { type:"resource_heist",    weight: 2 },
  ];

  // Weighted pick
  const total = ops.reduce((s,o)=>s+o.weight,0);
  let r = Math.random()*total;
  let opType = ops[0].type;
  for (const op of ops) { r-=op.weight; if(r<=0){opType=op.type;break;} }

  if (!caught) {
    await executeEspionageSuccess(base44, ai, target, p, opType, relUpdates, isHuman, successChance);
  } else {
    await executeEspionageFailure(base44, ai, target, p, opType, relUpdates, isHuman);
  }
}

async function executeEspionageSuccess(base44, ai, target, p, opType, relUpdates, isHuman, successChance) {
  const leader = leaderOf(ai.name);
  const targetUpdates = {};
  let newsHeadline, newsBody, notifTitle, notifMsg, notifSeverity = "warning";

  switch(opType) {
    case "tech_theft": {
      const techStolen = Math.floor(rand(10, 40) * (1 + p.tech * 0.5));
      // AI gains tech points
      await base44.asServiceRole.entities.Nation.update(ai.id, {
        tech_points: Math.min(99999, (ai.tech_points||0) + techStolen)
      });
      targetUpdates.tech_points = Math.max(0, (target.tech_points||0) - Math.floor(techStolen*0.3));
      newsHeadline = `🔬 ESPIONAGE: ${ai.name} steals research from ${target.name}`;
      newsBody = `Intelligence sources confirm agents from ${ai.name} infiltrated ${target.name}'s research network, extracting ${techStolen} tech points worth of classified data. ${target.name}'s R&D director has resigned.`;
      notifTitle = `🔬 Tech stolen by ${ai.name}`;
      notifMsg = `${ai.name} agents successfully stole ${Math.floor(techStolen*0.3)} tech points from your research network.`;
      adjustRelation(relUpdates, target.id, -5);
      break;
    }
    case "economic_sabotage": {
      const damage = Math.floor(rand(50, 200));
      const gdpDrop = Math.floor(rand(10, 50));
      targetUpdates.currency = Math.max(0, (target.currency||500) - damage);
      targetUpdates.gdp = Math.max(200, (target.gdp||500) - gdpDrop);
      targetUpdates.stability = clamp((target.stability||75) - Math.floor(rand(2,5)), 5, 99);
      newsHeadline = `💥 SABOTAGE: ${ai.name} operatives disrupt ${target.name} economy`;
      newsBody = `A coordinated operation attributed to ${ai.name} caused infrastructure failures in ${target.name}, leading to a ${gdpDrop} GDP point contraction and financial disruption.`;
      notifTitle = `💥 Economic sabotage by ${ai.name}`;
      notifMsg = `${ai.name} operatives caused infrastructure disruption. You lost ${damage} currency and ${gdpDrop} GDP.`;
      notifSeverity = "danger";
      adjustRelation(relUpdates, target.id, -8);
      break;
    }
    case "military_intel": {
      // AI gains tactical advantage (unit_power boost)
      const powerGain = Math.floor(rand(2, 8));
      await base44.asServiceRole.entities.Nation.update(ai.id, {
        unit_power: Math.min(999, (ai.unit_power||10) + powerGain),
        defense_level: Math.min(999, (ai.defense_level||10) + Math.floor(powerGain/2))
      });
      newsHeadline = `🎯 INTEL BREACH: ${ai.name} steals military secrets from ${target.name}`;
      newsBody = `${ai.name}'s intelligence apparatus has obtained classified military blueprints from ${target.name}. Defense analysts warn this could shift the regional balance of power.`;
      notifTitle = `🎯 Military intel stolen by ${ai.name}`;
      notifMsg = `${ai.name} has stolen your military blueprints. Their forces may be strengthened.`;
      adjustRelation(relUpdates, target.id, -6);
      break;
    }
    case "propaganda_plant": {
      const stabilityDmg = Math.floor(rand(3, 10));
      const trustDmg = parseFloat(rand(0.03, 0.08).toFixed(2));
      targetUpdates.stability = clamp((target.stability||75) - stabilityDmg, 5, 99);
      targetUpdates.public_trust = clamp((target.public_trust||1.0) - trustDmg, 0.2, 2.0);
      newsHeadline = `📢 PSYOP: ${ai.name} plants propaganda inside ${target.name}`;
      newsBody = `A sophisticated disinformation campaign traced to ${ai.name} has gone viral inside ${target.name}, eroding public trust and fueling civil unrest. Social networks report 40% of trending content is fabricated.`;
      notifTitle = `📢 Propaganda planted by ${ai.name}`;
      notifMsg = `${ai.name} ran a propaganda campaign against you. Stability -${stabilityDmg}, Public Trust -${trustDmg}.`;
      notifSeverity = "warning";
      adjustRelation(relUpdates, target.id, -4);
      break;
    }
    case "double_agent": {
      // Double agent: ongoing passive benefit — boost AI's own defense and drain target over time
      const defGain = Math.floor(rand(5, 15));
      await base44.asServiceRole.entities.Nation.update(ai.id, {
        defense_level: Math.min(999, (ai.defense_level||10) + defGain)
      });
      targetUpdates.currency = Math.max(0, (target.currency||500) - Math.floor(rand(30,80)));
      newsHeadline = `🕵️ DOUBLE AGENT: ${ai.name} plants mole inside ${target.name} government`;
      newsBody = `Leaked documents suggest a senior official in ${target.name}'s government has been feeding classified information to ${ai.name}. An emergency security review has been launched.`;
      notifTitle = `🕵️ Double agent discovered in your government`;
      notifMsg = `${ai.name} has a mole inside your administration. Currency drained and counter-measures required.`;
      notifSeverity = "danger";
      adjustRelation(relUpdates, target.id, -10);
      break;
    }
    case "resource_heist": {
      const res = pick(["res_gold","res_oil","res_iron","res_wood","res_stone"]);
      const amount = Math.floor(rand(20, 80));
      const resLabel = res.replace("res_","").toUpperCase();
      const targetHas = target[res] || 0;
      if (targetHas >= amount) {
        targetUpdates[res] = targetHas - amount;
        const aiUpdate = {};
        aiUpdate[res] = Math.min(99999, (ai[res]||0) + amount);
        await base44.asServiceRole.entities.Nation.update(ai.id, aiUpdate);
      }
      newsHeadline = `⛏️ HEIST: ${ai.name} operatives smuggle ${resLabel} from ${target.name}`;
      newsBody = `An audacious operation by ${ai.name} covert units has resulted in ${amount} units of ${resLabel} being smuggled across the border. ${target.name}'s ministry of resources confirmed the breach.`;
      notifTitle = `⛏️ Resource heist by ${ai.name}`;
      notifMsg = `${ai.name} stole ${amount} ${resLabel} from your stockpiles.`;
      adjustRelation(relUpdates, target.id, -5);
      break;
    }
  }

  if (Object.keys(targetUpdates).length) {
    await base44.asServiceRole.entities.Nation.update(target.id, targetUpdates);
  }
  await base44.asServiceRole.entities.NewsArticle.create({
    headline: newsHeadline, body: newsBody,
    category: "policy", tier: "gold",
    nation_name: ai.name, nation_flag: ai.flag_emoji||"🌐", nation_color: ai.flag_color||"#6366f1"
  });
  if (isHuman && notifTitle) {
    await base44.asServiceRole.entities.Notification.create({
      target_nation_id: target.id, target_owner_email: target.owner_email,
      type: "attack_received", title: notifTitle, message: notifMsg,
      severity: notifSeverity, is_read: false
    });
  }
}

async function executeEspionageFailure(base44, ai, target, p, opType, relUpdates, isHuman) {
  // Spy caught! Diplomatic fallout, counter-intel bonus for target
  const penalty = Math.floor(rand(20, 80));
  await base44.asServiceRole.entities.Nation.update(ai.id, {
    stability: clamp((ai.stability||75) - Math.floor(rand(2,6)), 5, 99),
    public_trust: parseFloat(clamp((ai.public_trust||1.0) - 0.05, 0.2, 2.0).toFixed(2)),
    currency: Math.max(0, (ai.currency||500) - penalty) // pay ransom / clean up
  });
  // Boost target's defense from catching spy
  await base44.asServiceRole.entities.Nation.update(target.id, {
    defense_level: Math.min(999, (target.defense_level||10) + Math.floor(rand(1,4)))
  });
  adjustRelation(relUpdates, target.id, -15);

  const catchMessages = [
    `${target.name}'s counter-intelligence service arrested a ${ai.name} operative attempting to infiltrate the national research lab.`,
    `${target.name} security forces captured a ${ai.name} spy network of 7 agents near the capital. Diplomatic notes have been exchanged.`,
    `A ${ai.name} covert operative was exposed and expelled from ${target.name} following a tip from a double agent within ${ai.name}'s own intelligence apparatus.`,
  ];
  await base44.asServiceRole.entities.NewsArticle.create({
    headline: `🚨 SPY CAUGHT: ${target.name} exposes ${ai.name} espionage ring`,
    body: pick(catchMessages) + ` ${ai.name} denies all involvement. Relations between the two nations have deteriorated sharply.`,
    category: "policy", tier: "gold",
    nation_name: target.name, nation_flag: target.flag_emoji||"🌐", nation_color: target.flag_color||"#10b981"
  });
  if (isHuman) {
    await base44.asServiceRole.entities.Notification.create({
      target_nation_id: target.id, target_owner_email: target.owner_email,
      type: "tech_unlocked",
      title: `🚨 You caught a ${ai.name} spy!`,
      message: `Your counter-intelligence caught an operative from ${ai.name}. Defense boosted. Their stability and relations have suffered.`,
      severity: "success", is_read: false
    });
  }
}

// ─── Counter-Intelligence ─────────────────────────────────────────────────────
async function runCounterIntel(base44, ai, p, humanNations, relUpdates) {
  // Boost own defenses based on tech + paranoia
  const defBoost = Math.floor(rand(1, 3 + p.tech * 3));
  await base44.asServiceRole.entities.Nation.update(ai.id, {
    defense_level: Math.min(999, (ai.defense_level||10) + defBoost)
  });
  // Occasionally expose another AI's espionage (flavor)
  if (Math.random() < 0.2) {
    const flavors = [
      `${ai.name}'s Directorate of National Security has neutralized a foreign intelligence network operating within its borders.`,
      `${ai.name} has launched a major counter-espionage sweep, arresting 14 suspected foreign agents.`,
      `${ai.name}'s signals intelligence unit has detected unauthorized communication intercepts — the source is believed to be a rival nation.`,
    ];
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `🛡️ COUNTER-INTEL: ${ai.name} neutralizes foreign spy network`,
      body: pick(flavors),
      category: "policy", tier: "standard",
      nation_name: ai.name, nation_flag: ai.flag_emoji||"🌐", nation_color: ai.flag_color||"#6366f1"
    });
  }
}

// ─── Relation Mood Events (grudges, forgiveness, rivalries) ───────────────────
async function runMoodEvent(base44, ai, p, others, relUpdates) {
  const allRelEntries = Object.entries(relUpdates).map(([id,score])=>({id,score}));

  // Find biggest grudge
  const grudge = allRelEntries.sort((a,b)=>a.score-b.score)[0];
  const bestFriend = allRelEntries.sort((a,b)=>b.score-a.score)[0];

  const grudgeNation = others.find(n=>n.id===grudge?.id);
  const friendNation = others.find(n=>n.id===bestFriend?.id);

  if (grudgeNation && grudge.score < -40 && Math.random() < 0.4) {
    // Public rivalry declaration
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `⚡ RIVALRY: ${ai.name} formally declares ${grudgeNation.name} a strategic rival`,
      body: `${leaderOf(ai.name)} addressed the nation: "${grudgeNation.name} represents everything we stand against. We will not rest until their influence is diminished." ${grudgeNation.name} called the statement "inflammatory and baseless."`,
      category: "policy", tier: "gold",
      nation_name: ai.name, nation_flag: ai.flag_emoji||"🌐", nation_color: ai.flag_color||"#ef4444"
    });
    adjustRelation(relUpdates, grudgeNation.id, -5);
  } else if (friendNation && bestFriend.score > 50 && Math.random() < 0.3) {
    // Deepen alliance / public praise
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `🤝 BOND: ${ai.name} pledges "iron partnership" with ${friendNation.name}`,
      body: `In a historic joint address, ${leaderOf(ai.name)} and ${leaderOf(friendNation.name)} pledged an "unbreakable bond" between their nations, promising military, economic, and cultural cooperation for generations.`,
      category: "policy", tier: "gold",
      nation_name: ai.name, nation_flag: ai.flag_emoji||"🌐", nation_color: ai.flag_color||"#6366f1"
    });
    adjustRelation(relUpdates, friendNation.id, +5);
  } else if (grudgeNation && grudge.score > -10 && grudge.score < 20 && p.diplomacy > 0.5 && Math.random() < 0.25) {
    // Forgiveness / olive branch
    await base44.asServiceRole.entities.NewsArticle.create({
      headline: `🕊️ DÉTENTE: ${ai.name} offers olive branch to ${grudgeNation.name}`,
      body: `In a surprise move, ${ai.name}'s foreign minister reached out to ${grudgeNation.name} with a formal offer to reset diplomatic relations. Analysts call it a "calculated act of statesmanship."`,
      category: "policy", tier: "standard",
      nation_name: ai.name, nation_flag: ai.flag_emoji||"🌐", nation_color: ai.flag_color||"#6366f1"
    });
    adjustRelation(relUpdates, grudgeNation.id, +10);
  }
}

// ─── Global Relation Drift ────────────────────────────────────────────────────
async function runRelationDrift(base44, aiNations) {
  // Small natural drift toward 0 over time (relations normalize unless actively maintained)
  for (const ai of aiNations) {
    const rels = loadRelations(ai);
    let changed = false;
    for (const id of Object.keys(rels)) {
      const cur = rels[id];
      if (cur > 5) { rels[id] = cur - 0.5; changed = true; }
      else if (cur < -5) { rels[id] = cur + 0.5; changed = true; }
    }
    if (changed) {
      await base44.asServiceRole.entities.Nation.update(ai.id, buildRelationsUpdate(rels));
    }
  }
}

// ─── Multi-Nation Diplomatic Events ──────────────────────────────────────────
async function generateDiplomaticEvent(base44, allNations) {
  const atWarCount = allNations.filter(n=>(n.at_war_with||[]).length>0).length;
  const richest = [...allNations].sort((a,b)=>(b.gdp||0)-(a.gdp||0))[0];
  const weakest = [...allNations].sort((a,b)=>(a.gdp||0)-(b.gdp||0))[0];
  const aiNations = allNations.filter(n=>isAiEmail(n.owner_email));
  const mostAllied = [...aiNations].sort((a,b)=>(b.allies||[]).length-(a.allies||[]).length)[0];

  const events = [
    {
      headline: "WORLD COURT: International tribunal convenes over war crimes allegations",
      body: `The World Tribunal has opened proceedings against multiple nations following documented atrocities during recent conflicts. ${atWarCount} nations are currently under scrutiny.`,
      category: "policy", tier: "breaking"
    },
    {
      headline: `DOMINANCE: ${richest?.name||"A superpower"} proposes global reserve currency backed by its GDP`,
      body: `${richest?.name||"The world's wealthiest nation"} has shocked global markets by proposing a new international reserve currency, backed by its dominant GDP. Smaller nations are divided over the proposal.`,
      category: "economy", tier: "breaking"
    },
    {
      headline: `BLOC FORMS: ${mostAllied?.name||"Rising power"} leads new multilateral security bloc`,
      body: `${mostAllied?.name||"A strategic player"} has formalized a multi-nation security coalition. Member states gain shared intelligence, combined military exercises, and coordinated economic policies.`,
      category: "policy", tier: "gold"
    },
    {
      headline: "REFUGEE CRISIS: Displaced populations surge across borders as conflicts escalate",
      body: `With ${atWarCount} active conflicts, the number of cross-border refugees has reached a historic high. Nations with high stability are being asked to absorb displaced populations.`,
      category: "policy", tier: "gold"
    },
    {
      headline: "NUCLEAR NON-PROLIFERATION SUMMIT fails as 3 nations refuse to sign",
      body: "The latest global disarmament summit ended without consensus. Three nations walked out, triggering a wave of diplomatic protests and stock market volatility.",
      category: "policy", tier: "breaking"
    },
    {
      headline: `AID RACE: ${richest?.name||"Major power"} and ${weakest?.name||"rival"} compete for influence in neutral zones`,
      body: `${richest?.name} and ${weakest?.name} are engaged in a humanitarian aid competition to win the allegiance of unaligned territories. Analysts call it "diplomacy through development."`,
      category: "economy", tier: "gold"
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