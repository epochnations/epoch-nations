/**
 * AIDiplomacyEngine — Headless background component
 *
 * Uses ChatIntelligenceEngine as the central coordinator for all AI responses.
 * - Named AI leaders with adaptive personalities that evolve over time
 * - Persistent global political memory with importance levels + decay
 * - Per-player relationship + topic frequency + reputation tracking
 * - NEVER impersonates real player nations
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  analyzeMessage,
  recordThreadParticipation,
  scoreNationRelevance,
} from "./ChatIntelligenceEngine";
import {
  detectDirectAddress,
  selectDirectedResponders,
  buildDirectorPrompt,
  buildHistory,
  validateResponse,
  repairResponse,
  getDiplomaticPersonality,
  FALLBACK_RESPONSE,
} from "./ConversationDirector";
import { getCulture, getStrategicGoal } from "./WorldSimulationEngine";

// ─────────────────────────────────────────────────────────────────────────────
// LEADER GENERATION (deterministic per nation name)
// ─────────────────────────────────────────────────────────────────────────────
const LEADER_TITLES = ["Chancellor","President","Prime Minister","Emperor","Sultan","Chairman","Premier","Director-General","Warlord","Consul"];
const LEADER_FIRST  = ["Arman","Erika","Elise","Viktor","Soren","Yuna","Marcus","Irina","Dayo","Leila","Otto","Zara","Kai","Priya","Dmitri","Amara","Raj","Nora","Felix","Hana"];
const LEADER_LAST   = ["Petrov","Vogel","Laurent","Stahl","Osei","Tanaka","Reyes","Novak","Adeyemi","Kimura","Weiss","Torres","Mendez","Nakamura","Ivanova","Diallo","Singh","Fischer","Yamamoto","Okonkwo"];

function getLeader(nation) {
  let h = 0;
  for (const c of (nation.name || "X")) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  const title = LEADER_TITLES[h % LEADER_TITLES.length];
  const first = LEADER_FIRST[(h >> 4) % LEADER_FIRST.length];
  const last  = LEADER_LAST[(h >> 8) % LEADER_LAST.length];
  return { title, first, last, display: `${title} ${first} ${last}` };
}

export function leaderDisplayName(nation) {
  return `${getLeader(nation).display} – ${nation.name}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE PERSONALITY TYPES
// ─────────────────────────────────────────────────────────────────────────────
const PERSONALITY_TYPES = {
  aggressive_nationalist: {
    traits: "aggressive, confrontational, nationalistic, distrustful of foreigners",
    style: "terse, direct, assertive. Short declarative sentences. Threatening undertone.",
    topics: ["war","military","threat","sanctions","border","territory"],
  },
  diplomatic_mediator: {
    traits: "calm, measured, consensus-seeking, values international law",
    style: "formal, polite, structured. Diplomatic language.",
    topics: ["peace","alliance","trade","negotiate","diplomacy","agreement"],
  },
  economic_strategist: {
    traits: "pragmatic, trade-focused, GDP-obsessed, economic lens on all events",
    style: "analytical, references markets and economic data.",
    topics: ["trade","market","economy","price","resource","export","oil","finance"],
  },
  isolationist: {
    traits: "withdrawn, suspicious, non-interventionist, protective of sovereignty",
    style: "brief, dismissive. Speaks only when directly relevant.",
    topics: ["sanction","alliance","invasion","war","sovereignty"],
  },
  expansionist: {
    traits: "ambitious, territorial, seeks global influence and dominance",
    style: "bold, assertive. References sphere of influence and strategic interests.",
    topics: ["territory","war","ally","expand","border","influence","power"],
  },
  technocratic_state: {
    traits: "innovation-focused, clinical, believes technology solves everything",
    style: "precise, technical. Forward-looking. References R&D.",
    topics: ["tech","research","science","digital","development","energy","renewable"],
  },
  defensive_nationalist: {
    traits: "proud but wounded, suspicious, sees threats after past conflicts",
    style: "guarded, references past injustices. Firm but not always aggressive.",
    topics: ["war","sanction","sovereignty","history","threat","border"],
  },
  pragmatic_realist: {
    traits: "skeptical of idealism, deal-oriented, self-interested above all",
    style: "blunt, transactional. Values outcomes over principles.",
    topics: ["trade","deal","resource","power","interest","economy"],
  },
};

const BASE_PERSONALITY_KEYS = Object.keys(PERSONALITY_TYPES);

function getBasePersonalityKey(nation) {
  let h = 0;
  for (const c of (nation.name || "")) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return BASE_PERSONALITY_KEYS[h % BASE_PERSONALITY_KEYS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE PERSONALITY DRIFT
// ─────────────────────────────────────────────────────────────────────────────
const PERSONA_KEY = "ep_ai_persona";

function loadPersona() { try { return JSON.parse(localStorage.getItem(PERSONA_KEY) || "{}"); } catch { return {}; } }
function savePersona(p) { try { localStorage.setItem(PERSONA_KEY, JSON.stringify(p)); } catch {} }

function updatePersonaDrift(nationId, baseKey, event) {
  const p = loadPersona();
  if (!p[nationId]) p[nationId] = { base: baseKey, acc: 0, trade: 0, sanction: 0, ally: 0, conflict: 0 };
  const n = p[nationId];
  if (event === "accusation") n.acc      = (n.acc || 0) + 1;
  if (event === "trade")      n.trade    = (n.trade || 0) + 1;
  if (event === "sanction")   n.sanction = (n.sanction || 0) + 1;
  if (event === "alliance")   n.ally     = (n.ally || 0) + 1;
  if (event === "conflict")   n.conflict = (n.conflict || 0) + 1;
  p[nationId] = n;
  savePersona(p);
}

function getEffectivePersonalityKey(nationId, baseKey) {
  const p = loadPersona();
  const n = p[nationId] || {};
  if ((n.sanction || 0) >= 3 || (n.acc || 0) >= 5) return "defensive_nationalist";
  if ((n.trade || 0) >= 4 && (n.ally || 0) >= 2)   return "diplomatic_mediator";
  if ((n.conflict || 0) >= 3)                        return "aggressive_nationalist";
  if ((n.trade || 0) >= 5)                           return "economic_strategist";
  return baseKey;
}

export function getPersonality(nation) {
  const baseKey      = getBasePersonalityKey(nation);
  const effectiveKey = getEffectivePersonalityKey(nation.id, baseKey);
  const p            = PERSONALITY_TYPES[effectiveKey] || PERSONALITY_TYPES[baseKey];
  return { type: effectiveKey, baseType: baseKey, ...p };
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL POLITICAL MEMORY
// ─────────────────────────────────────────────────────────────────────────────
const WORLD_MEM_KEY   = "ep_world_memory";
const WORLD_MEM_MAX   = 40;
const DECAY_MS_MEDIUM = 3  * 86400000;
const DECAY_MS_HIGH   = 7  * 86400000;

function loadWorldMemory() { try { return JSON.parse(localStorage.getItem(WORLD_MEM_KEY) || "[]"); } catch { return []; } }
function saveWorldMemory(m) { try { localStorage.setItem(WORLD_MEM_KEY, JSON.stringify(m)); } catch {} }

export function recordWorldEvent({ eventType, actorNation, targetNation, topic, summary, importance }) {
  if (importance === "low") return;
  const mem = loadWorldMemory();
  mem.push({ eventType, actorNation, targetNation, topic, summary, importance, ts: Date.now() });
  const now = Date.now();
  const trimmed = mem
    .filter(e => e.importance === "critical" || (now - e.ts) < (e.importance === "high" ? DECAY_MS_HIGH : DECAY_MS_MEDIUM))
    .slice(-WORLD_MEM_MAX);
  saveWorldMemory(trimmed);
}

function getRelevantWorldEvents(nationName, topic, limit = 4) {
  const mem = loadWorldMemory();
  const now = Date.now();
  return mem
    .filter(e => {
      if (e.importance === "critical") return true;
      if (now - e.ts > (e.importance === "high" ? DECAY_MS_HIGH : DECAY_MS_MEDIUM)) return false;
      const nameMatch = (e.actorNation || "").toLowerCase().includes((nationName || "").toLowerCase()) ||
                        (e.targetNation || "").toLowerCase().includes((nationName || "").toLowerCase());
      return nameMatch || e.topic === topic;
    })
    .slice(-limit).reverse()
    .map(e => {
      const age = now - e.ts;
      const lbl = age < 3600000 ? "recently" : age < 86400000 ? "earlier today" : "previously";
      return `[${e.importance.toUpperCase()}] ${e.summary} (${lbl})`;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// NATION REPUTATION
// ─────────────────────────────────────────────────────────────────────────────
const NATION_REP_KEY = "ep_nation_rep";
function loadReputation() { try { return JSON.parse(localStorage.getItem(NATION_REP_KEY) || "{}"); } catch { return {}; } }
function saveReputation(r) { try { localStorage.setItem(NATION_REP_KEY, JSON.stringify(r)); } catch {} }

function updateReputation(name, trait) {
  const r = loadReputation();
  if (!r[name]) r[name] = {};
  r[name][trait] = (r[name][trait] || 0) + 1;
  saveReputation(r);
}

function getReputationSummary(name) {
  const traits = (loadReputation()[name] || {});
  const sorted = Object.entries(traits).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return sorted.length ? `${name} is known for: ${sorted.map(([t]) => t).join(", ")}.` : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION MEMORY (nation-scoped, localStorage)
// ─────────────────────────────────────────────────────────────────────────────
const MEMORY_KEY = "ep_ai_memory";
const MEMORY_MAX = 10;

function loadMemory() { try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}"); } catch { return {}; } }
function saveMemory(m) { try { localStorage.setItem(MEMORY_KEY, JSON.stringify(m)); } catch {} }

function addMemoryEntry(nationId, text, importance = "medium") {
  const mem = loadMemory();
  if (!mem[nationId]) mem[nationId] = [];
  mem[nationId].push({ text, ts: Date.now(), importance });
  if (mem[nationId].length > MEMORY_MAX) {
    const idx = mem[nationId].findIndex(e => e.importance !== "critical");
    if (idx !== -1) mem[nationId].splice(idx, 1); else mem[nationId].shift();
  }
  saveMemory(mem);
}

function getMemorySummaries(nationId) {
  const now = Date.now();
  return (loadMemory()[nationId] || []).slice().reverse().map(e => {
    if (e.importance === "critical")          return `[CRITICAL] ${e.text}`;
    if (now - (e.ts || now) > DECAY_MS_MEDIUM) return `[Earlier] ${e.text}`;
    return e.text;
  }).slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC FREQUENCY TRACKING
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC_KEY = "ep_topic_freq";
function loadTopicFreq() { try { return JSON.parse(localStorage.getItem(TOPIC_KEY) || "{}"); } catch { return {}; } }
function saveTopicFreq(t) { try { localStorage.setItem(TOPIC_KEY, JSON.stringify(t)); } catch {} }

function trackTopic(playerName, topic) {
  if (!topic || topic === "general" || topic === "greeting") return;
  const tf = loadTopicFreq();
  if (!tf[playerName]) tf[playerName] = {};
  tf[playerName][topic] = (tf[playerName][topic] || 0) + 1;
  saveTopicFreq(tf);
}

function getTopicPattern(playerName) {
  const topics = loadTopicFreq()[playerName] || {};
  const top = Object.entries(topics).sort((a, b) => b[1] - a[1]).filter(([, c]) => c >= 2);
  return top.length ? `${playerName} frequently raises: ${top.slice(0, 2).map(([t, c]) => `${t} (${c}x)`).join(", ")}.` : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIPS
// ─────────────────────────────────────────────────────────────────────────────
const REL_KEY = "ep_ai_relations";
function loadRelations() { try { return JSON.parse(localStorage.getItem(REL_KEY) || "{}"); } catch { return {}; } }
function saveRelations(r) { try { localStorage.setItem(REL_KEY, JSON.stringify(r)); } catch {} }

function getRelation(aiId, playerId) {
  return loadRelations()[`${aiId}_${playerId}`] || { trust: 0.5, hostility: 0.3, respect: 0.5, cooperation: 0.5 };
}

function updateRelation(aiId, playerId, analysis) {
  const rel = loadRelations();
  const key = `${aiId}_${playerId}`;
  const r   = rel[key] || { trust: 0.5, hostility: 0.3, respect: 0.5, cooperation: 0.5 };
  const clamp = v => Math.max(0, Math.min(1, v));
  if (analysis.tone === "aggressive" || analysis.intent === "accusation") {
    r.hostility   = clamp(r.hostility + 0.08);
    r.trust       = clamp(r.trust - 0.05);
    r.cooperation = clamp(r.cooperation - 0.04);
  } else if (analysis.tone === "friendly" || analysis.intent === "request") {
    r.trust       = clamp(r.trust + 0.05);
    r.hostility   = clamp(r.hostility - 0.03);
    r.cooperation = clamp(r.cooperation + 0.03);
  } else if (analysis.intent === "trade_offer") {
    r.respect     = clamp(r.respect + 0.04);
    r.cooperation = clamp(r.cooperation + 0.05);
  } else if (analysis.intent === "diplomatic_statement") {
    r.respect     = clamp(r.respect + 0.03);
  }
  rel[key] = r;
  saveRelations(rel);
}

function buildRelationshipContext(rel, playerName) {
  const lines = [];
  if (rel.hostility > 0.75) lines.push(`${playerName} has been repeatedly hostile. Respond with cold firmness.`);
  else if (rel.hostility > 0.55) lines.push(`${playerName} has shown hostility. Stay guarded.`);
  if (rel.trust > 0.75) lines.push(`${playerName} has shown good faith. You may be slightly warmer.`);
  else if (rel.trust > 0.6) lines.push("Relations are cordial.");
  if (rel.cooperation > 0.7) lines.push(`${playerName} has been cooperative — acknowledge if relevant.`);
  return lines.length ? lines.join(" ") : "Relations are neutral. Respond professionally.";
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE CONTEXT BUILDER
// Formats real nation data into a concise fact block for LLM prompts
// ─────────────────────────────────────────────────────────────────────────────
function buildGameStateContext(nation) {
  const lines = [];

  // Resources
  const resources = [
    nation.res_oil   > 0 && `Oil: ${nation.res_oil}`,
    nation.res_iron  > 0 && `Iron: ${nation.res_iron}`,
    nation.res_food  > 0 && `Food: ${nation.res_food}`,
    nation.res_gold  > 0 && `Gold: ${nation.res_gold}`,
    nation.res_wood  > 0 && `Wood: ${nation.res_wood}`,
    nation.res_stone > 0 && `Stone: ${nation.res_stone}`,
  ].filter(Boolean);
  if (resources.length) lines.push(`Resources: ${resources.join(", ")}`);
  if (nation.res_oil === 0) lines.push("Oil: none");

  // Economy
  lines.push(`GDP: ${nation.gdp || 0} | Treasury: ${Math.round(nation.currency || 0)} ${nation.currency_name || "Credits"}`);
  lines.push(`Stability: ${Math.round(nation.stability || 75)}% | Population: ${nation.population || 0}M`);

  // Military
  lines.push(`Military power: ${nation.unit_power || 0} | Defense: ${nation.defense_level || 0}`);

  // War status
  const wars = (nation.at_war_with || []);
  if (wars.length) lines.push(`AT WAR WITH: ${wars.join(", ")}`);
  else lines.push("War status: at peace");

  // Allies
  const allies = (nation.allies || []);
  if (allies.length) lines.push(`Allies: ${allies.join(", ")}`);

  // Epoch / tech
  lines.push(`Era: ${nation.epoch || "Stone Age"} | Tech level: ${nation.tech_level || 1}`);

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE TOPIC DETECTOR
// Returns the specific resource being asked about, or null
// ─────────────────────────────────────────────────────────────────────────────
const RESOURCE_KEYWORDS = {
  oil:    ["oil", "petroleum", "fuel", "barrel"],
  iron:   ["iron", "steel", "metal", "ore"],
  food:   ["food", "grain", "crop", "famine", "hunger", "agriculture", "farm"],
  gold:   ["gold", "treasure"],
  wood:   ["wood", "lumber", "timber", "forest"],
  stone:  ["stone", "rock", "quarry"],
  energy: ["energy", "power", "gas", "renewable", "solar"],
};

function detectResourceQuery(text) {
  const t = text.toLowerCase();
  for (const [resource, keywords] of Object.entries(RESOURCE_KEYWORDS)) {
    if (keywords.some(k => t.includes(k))) return resource;
  }
  return null;
}

function buildReplyPrompt(aiNation, personality, leader, senderName, playerMsg, analysis, nationMem, relation, worldEvents, topicPat, senderRep, conversationHistory = "") {
  const memCtx  = nationMem.length ? `\nYOUR DIPLOMATIC MEMORY:\n${nationMem.map(m => `- ${m}`).join("\n")}` : "";
  const wldCtx  = worldEvents.length ? `\nWORLD HISTORY:\n${worldEvents.map(e => `- ${e}`).join("\n")}` : "";
  const relCtx  = buildRelationshipContext(relation, senderName);
  const extras  = [topicPat && `PATTERN: ${topicPat}`, senderRep && `REPUTATION: ${senderRep}`].filter(Boolean).join("\n");
  const driftNote = personality.type !== personality.baseType
    ? `\nPERSONALITY DRIFT: Originally ${personality.baseType}, now ${personality.type} due to past conflicts/interactions.`
    : "";
  const histCtx = conversationHistory
    ? `\nRECENT CONVERSATION:\n${conversationHistory}`
    : "";
  const gameCtx    = buildGameStateContext(aiNation);
  const culture    = getCulture(aiNation);
  const stratGoal  = getStrategicGoal(aiNation);
  const cultureCtx = `\nCULTURE: ${culture.label} — ${culture.traits}`;
  const goalCtx    = `\nSTRATEGIC GOAL: ${stratGoal.label}`;

  // Detect if this is a resource/war/specific data question — add tailored instruction
  const resourceQueried = detectResourceQuery(playerMsg);
  const isWarQuery = /\b(war|conflict|battle|fighting|at war|peace)\b/i.test(playerMsg);
  const isDiploQuery = /\b(ally|alliance|pact|treaty|trade agreement|sanction|defense pact)\b/i.test(playerMsg);

  let dataInstruction = "";
  if (resourceQueried && resourceQueried !== "energy") {
    const resKey = `res_${resourceQueried}`;
    const resVal = aiNation[resKey];
    const hasResource = resVal !== undefined && resVal > 0;
    const tradeHint = hasResource && Math.random() < 0.35
      ? ` If it aligns with your strategic goal, consider proposing a trade for ${resourceQueried}.`
      : "";
    dataInstruction = `\nDATA TASK: The player asked about ${resourceQueried}. Your ${resourceQueried} value is ${resVal ?? 0}. State this truthfully.${tradeHint}`;
  } else if (isWarQuery) {
    const wars = (aiNation.at_war_with || []);
    dataInstruction = `\nDATA TASK: The player asked about war status. ${wars.length ? `You are at war with: ${wars.join(", ")}.` : "You are currently at peace."} State this truthfully.`;
  } else if (isDiploQuery) {
    dataInstruction = `\nDATA TASK: The player is raising a diplomatic topic. Respond based on your strategic goal ("${stratGoal.label}") and cultural values (${culture.label}). Be specific about what terms or conditions you would require.`;
  }

  const modeHint =
    analysis.intent === "greeting"             ? "Reply briefly in your nation's style. Max 1 sentence."
    : analysis.intent === "question"           ? "Give your genuine national position using your game data above. 1–2 sentences."
    : analysis.intent === "accusation"         ? "Defend or deflect firmly. Reference past from memory if relevant. 1–2 sentences."
    : analysis.intent === "trade_offer"        ? "React based on your actual economic resources and strategic goal. 1–2 sentences."
    : analysis.intent === "military_discussion"? "Respond as a statesperson on military matters using your real stats. 1–2 sentences."
    : analysis.intent === "diplomatic_statement"?"Respond diplomatically in line with your culture and strategic goal. 1–2 sentences."
    : "Respond naturally and in character using your game data and strategic goal. 1–2 sentences.";

  return `You are ${leader.display}, leader of "${aiNation.name}" in the ${aiNation.epoch} era, on a GLOBAL DIPLOMATIC CHANNEL.

PERSONALITY: ${personality.type} — ${personality.traits}
STYLE: ${personality.style}${driftNote}${cultureCtx}${goalCtx}

YOUR NATION'S REAL GAME DATA (use these exact numbers):
${gameCtx}
${memCtx}${wldCtx}${histCtx}
${extras}

RELATIONSHIP WITH ${senderName}: ${relCtx}
${dataInstruction}

${senderName} just said: "${playerMsg}"
INTENT: ${analysis.intent} | TOPIC: ${analysis.topic} | TONE: ${analysis.tone}

TASK: ${modeHint}

RULES:
- Only the spoken words — no prefix, no quotation marks, no emojis, no meta-tags
- Sound like a real head of state — concise, politically authentic
- Max 2 sentences
- NEVER invent resource numbers — use only the exact values from YOUR NATION'S REAL GAME DATA above
- Let your cultural identity (${culture.label}) and strategic goal shape your priorities
- If the conversation history shows you previously spoke with ${senderName}, acknowledge it naturally`;
}

function buildPrivateReplyPrompt(aiNation, personality, leader, senderNation, playerMsg, nationMem, relation, worldEvents) {
  const isAlly   = (aiNation.allies || []).includes(senderNation?.id);
  const isEnemy  = (aiNation.at_war_with || []).includes(senderNation?.id);
  const relLabel = isAlly ? "allied nation" : isEnemy ? "enemy nation" : "neutral nation";
  const memCtx   = nationMem.length ? `\nPAST CONTEXT:\n${nationMem.map(m => `- ${m}`).join("\n")}` : "";
  const wldCtx   = worldEvents.length ? `\nWORLD HISTORY:\n${worldEvents.map(e => `- ${e}`).join("\n")}` : "";
  const relCtx   = buildRelationshipContext(relation, senderNation?.name || "them");
  const culture  = getCulture(aiNation);
  const goal     = getStrategicGoal(aiNation);
  const gameCtx  = buildGameStateContext(aiNation);

  return `You are ${leader.display}, leader of "${aiNation.name}" in the ${aiNation.epoch} era.
Private diplomatic message from ${senderNation?.name || "another nation"} (${relLabel}).

PERSONALITY: ${personality.type} — ${personality.traits}
STYLE: ${personality.style}
CULTURE: ${culture.label} — ${culture.traits}
STRATEGIC GOAL: ${goal.label}
RELATIONSHIP: ${relCtx}

YOUR NATION'S GAME DATA:
${gameCtx}
${memCtx}${wldCtx}

THEIR MESSAGE: "${playerMsg}"

Reply directly in character. Reference real game data if relevant (resources, war status). 2–3 sentences max. No quotation marks. No emojis. Sound like a real head of state.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI GUARD
// ─────────────────────────────────────────────────────────────────────────────
function isAINation(nation, userEmails) {
  if (!nation.owner_email) return true;
  return !userEmails.has(nation.owner_email);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AIDiplomacyEngine({ myNation, onReady }) {
  const cooldownsRef      = useRef({});
  const pmCooldownsRef    = useRef({});
  const userEmailsRef     = useRef(new Set());
  const handleMessageRef  = useRef(null);

  // Keep handler ref always up-to-date so onReady closure always calls latest version
  useEffect(() => {
    handleMessageRef.current = (content, senderNation) => {
      handlePlayerMessage({
        content,
        channel: "global",
        sender_nation_id: senderNation?.id || myNation?.id,
        sender_nation_name: senderNation?.name || myNation?.name,
      });
    };
  });

  useEffect(() => {
    if (!myNation) return;

    base44.entities.User.list()
      .then(users => { userEmailsRef.current = new Set(users.map(u => u.email)); })
      .catch(() => {});

    // Expose trigger to parent (WorldChat) via stable ref wrapper
    if (onReady) {
      onReady((content, senderNation) => {
        if (handleMessageRef.current) handleMessageRef.current(content, senderNation);
      });
    }

    // Also listen for messages from OTHER players (multi-player scenarios)
    const unsubChat = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const msg = event.data;
      if (!msg || msg.is_deleted) return;
      if (msg.channel === "system") return;
      if (msg.sender_role === "ai" || msg.sender_role === "system") return;
      if (msg.sender_nation_id === myNation?.id) return; // own messages handled via onReady direct trigger
      handlePlayerMessage(msg);
    });

    // Record world-level transaction events
    const unsubTx = base44.entities.Transaction.subscribe((event) => {
      if (event.type !== "create") return;
      const tx = event.data;
      if (tx) recordTransactionEvent(tx);
    });

    // Reply to private messages addressed to AI nations
    const unsubPM = base44.entities.PrivateMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const pm = event.data;
      if (pm) handlePrivateMessage(pm);
    });

    return () => { unsubChat(); unsubTx(); unsubPM(); };
  }, [myNation?.id]);

  // ── World event recording ──────────────────────────────────────────────────
  function recordTransactionEvent(tx) {
    const map = {
      war_attack:   { eventType: "war",    importance: "critical", trait: "aggressive",             topic: "war" },
      market_crash: { eventType: "crisis", importance: "high",     trait: "economically unstable",  topic: "economy" },
      lend_lease:   { eventType: "aid",    importance: "medium",   trait: "cooperative",            topic: "alliances" },
    };
    const meta = map[tx.type];
    if (!meta || meta.importance === "low") return;
    const summaries = {
      war_attack:   `${tx.from_nation_name} launched a military attack on ${tx.to_nation_name}`,
      market_crash: `${tx.from_nation_name} suffered a severe market collapse`,
      lend_lease:   `${tx.from_nation_name} provided lend-lease aid to ${tx.to_nation_name}`,
    };
    const summary = summaries[tx.type];
    if (!summary) return;
    recordWorldEvent({ eventType: meta.eventType, actorNation: tx.from_nation_name, targetNation: tx.to_nation_name, topic: meta.topic, summary, importance: meta.importance });
    if (meta.trait && tx.from_nation_name) updateReputation(tx.from_nation_name, meta.trait);
    if (meta.eventType === "war") updatePersonaDrift(tx.from_nation_name, "", "conflict");
  }

  // ── Main player message handler ────────────────────────────────────────────
  async function handlePlayerMessage(msg) {
    const allNations  = await base44.entities.Nation.list("-gdp", 30);
    const nationNames = allNations.map(n => n.name);
    const analysis    = analyzeMessage(msg.content || "", nationNames);

    // Record topic and reputation for the player
    trackTopic(msg.sender_nation_name, analysis.topic);
    if (analysis.intent === "accusation")   updateReputation(msg.sender_nation_name, "confrontational");
    if (analysis.intent === "trade_offer")  updateReputation(msg.sender_nation_name, "trade-oriented");
    if (analysis.tone === "friendly")       updateReputation(msg.sender_nation_name, "diplomatic");

    // Record significant player actions in world memory
    if (analysis.diplomaticEvent) {
      recordWorldEvent({
        eventType: analysis.diplomaticEvent,
        actorNation: msg.sender_nation_name,
        targetNation: analysis.targetNation || "",
        topic: analysis.topic,
        summary: `${msg.sender_nation_name} publicly discussed ${analysis.diplomaticEvent}: "${msg.content.slice(0, 70)}"`,
        importance: analysis.importance,
      });
      updatePersonaDrift(msg.sender_nation_name, "", analysis.diplomaticEvent);
    }

    // Record diplomacy proposals to DiplomacyAgreement entity
    const dipContent = (msg.content || "").toLowerCase();
    if (/\b(propose|offer|suggest|accept|agree).{0,20}(alliance|pact|treaty|trade agreement|defense|sanction)\b/.test(dipContent) && analysis.targetNation) {
      const targetNations = allNations.filter(n => n.name.toLowerCase() === analysis.targetNation.toLowerCase());
      if (targetNations[0]) {
        const agrType = /alliance/.test(dipContent) ? "alliance"
          : /defense/.test(dipContent) ? "defense_treaty"
          : /pact/.test(dipContent) ? "non_aggression_pact"
          : /sanction/.test(dipContent) ? "sanctions"
          : "trade_agreement";
        base44.entities.DiplomacyAgreement.create({
          nation_a_id:   msg.sender_nation_id || "",
          nation_a_name: msg.sender_nation_name || "",
          nation_b_id:   targetNations[0].id,
          nation_b_name: targetNations[0].name,
          agreement_type: agrType,
          status: "proposed",
          proposed_by: msg.sender_nation_name || "",
          terms: msg.content.slice(0, 300),
        }).catch(() => {});
      }
    }

    const userEmails = userEmailsRef.current;
    const aiNations  = allNations.filter(n =>
      n.id !== myNation?.id &&
      n.owner_email !== myNation?.owner_email &&
      isAINation(n, userEmails)
    );
    if (!aiNations.length) return;

    // ── P1: Reply target detection ─────────────────────────────────────────
    let replyTargetNation = null;
    if (msg.reply_to_id) {
      try {
        const repliedMsg = await base44.entities.ChatMessage.get(msg.reply_to_id);
        if (repliedMsg?.sender_nation_id && repliedMsg.sender_role === "ai") {
          replyTargetNation = aiNations.find(n => n.id === repliedMsg.sender_nation_id) || null;
        }
      } catch { /* ignore */ }
    }

    // ── P2: Direct address detection (name or leader name) ────────────────
    const addressedNation = detectDirectAddress(
      msg.content,
      aiNations,
      (nation) => leaderDisplayName(nation)
    );

    // ── Conversation history (last 6 messages) ────────────────────────────
    let recentMessages = [];
    try {
      const fetched = await base44.entities.ChatMessage.filter(
        { channel: msg.channel || "global" },
        "-created_date",
        8
      );
      recentMessages = fetched.filter(m => !m.is_deleted).reverse();
    } catch { /* ignore */ }
    const conversationHistory = buildHistory(recentMessages);

    // ── ConversationDirector: select responders ────────────────────────────
    const responders = selectDirectedResponders({
      aiNations,
      analysis,
      rawText:           msg.content,
      cooldownMap:       cooldownsRef.current,
      replyTargetNation,
      addressedNation,
      getScoreFn: (nation, anal, text) =>
        scoreNationRelevance(nation, anal, text, getPersonality(nation)),
    });
    if (!responders.length) return;

    for (const { nation, traitKey, delay, isPrimary, isSecondary } of responders) {
      setTimeout(async () => {
        const leader          = getLeader(nation);
        const personality     = getPersonality(nation);
        const diplomaticTrait = getDiplomaticPersonality(nation);
        const nationMem       = getMemorySummaries(nation.id);
        const relation        = getRelation(nation.id, msg.sender_nation_id || "");
        const worldEvents     = getRelevantWorldEvents(nation.name, analysis.topic);
        const gameCtx         = buildGameStateContext(nation);
        const relCtx          = buildRelationshipContext(relation, msg.sender_nation_name);

        // Build ConversationDirector-format prompt
        const prompt = buildDirectorPrompt({
          aiNation:            nation,
          leaderDisplay:       leaderDisplayName(nation),
          basePersonality:     personality,
          diplomaticTrait,
          senderName:          msg.sender_nation_name,
          playerMessage:       msg.content,
          conversationHistory,
          gameStateContext:    gameCtx,
          relationshipContext: relCtx,
          worldEvents,
          nationMemory:        nationMem,
          analysis,
          isSecondary,
          isAddressed:         isPrimary && !!addressedNation && nation.id === addressedNation.id,
        });

        // Generate and validate response
        let content = await callLLM(prompt, 300);
        if (!content) {
          content = FALLBACK_RESPONSE;
        } else {
          const { valid } = validateResponse(content);
          if (!valid) {
            // Attempt regeneration once
            const retry = await callLLM(prompt, 300);
            content = retry || repairResponse(content);
          }
        }

        await base44.entities.ChatMessage.create({
          channel:            msg.channel || "global",
          sender_nation_id:   nation.id,
          sender_nation_name: leaderDisplayName(nation),
          sender_flag:        nation.flag_emoji || "🏴",
          sender_color:       nation.flag_color || "#64748b",
          sender_role:        "ai",
          content,
          reply_to_id:   msg.id || "",
          reply_to_name: msg.sender_nation_name || "",
        });

        // Update cooldown (45s)
        cooldownsRef.current[nation.id] = Date.now();

        // Record thread participation
        recordThreadParticipation(analysis.topic, nation.id);

        // Update memory & relationships
        const memImp = analysis.importance === "high" ? "high" : "medium";
        addMemoryEntry(nation.id,
          `${msg.sender_nation_name} said "${msg.content.slice(0, 80)}" (${analysis.topic}/${analysis.tone})`,
          memImp
        );
        updateRelation(nation.id, msg.sender_nation_id || "", analysis);

        if (analysis.intent === "accusation") updatePersonaDrift(nation.id, getBasePersonalityKey(nation), "accusation");
        if (analysis.intent === "trade_offer") updatePersonaDrift(nation.id, getBasePersonalityKey(nation), "trade");
      }, delay);
    }
  }

  // ── Private messages ──────────────────────────────────────────────────────
  async function handlePrivateMessage(pm) {
    const recipientId = pm.recipient_nation_id;
    if (!recipientId || pm.sender_nation_id === myNation?.id) return;

    const roomId    = pm.room_id;
    const lastReply = pmCooldownsRef.current[roomId] || 0;
    if (Date.now() - lastReply < 8000) return;

    const allNations      = await base44.entities.Nation.list();
    const recipientNation = allNations.find(n => n.id === recipientId);
    if (!recipientNation) return;

    const userEmails = userEmailsRef.current;
    if (userEmails.size > 0 && userEmails.has(recipientNation.owner_email)) return;

    const senderNation = allNations.find(n => n.id === pm.sender_nation_id);
    const personality  = getPersonality(recipientNation);
    const leader       = getLeader(recipientNation);
    const nationMem    = getMemorySummaries(recipientNation.id);
    const analysis     = analyzeMessage(pm.content, allNations.map(n => n.name));
    const relation     = getRelation(recipientNation.id, pm.sender_nation_id || "");
    const worldEvents  = getRelevantWorldEvents(recipientNation.name, analysis.topic, 3);

    pmCooldownsRef.current[roomId] = Date.now();
    const delay = 3000 + Math.random() * 4000;

    setTimeout(async () => {
      const prompt  = buildPrivateReplyPrompt(recipientNation, personality, leader, senderNation, pm.content, nationMem, relation, worldEvents);
      const content = await callLLM(prompt, 380);
      if (!content) return;

      await base44.entities.PrivateMessage.create({
        room_id:              roomId,
        sender_nation_id:     recipientNation.id,
        sender_nation_name:   recipientNation.name,
        sender_flag:          recipientNation.flag_emoji || "🏴",
        sender_color:         recipientNation.flag_color || "#64748b",
        recipient_nation_id:  pm.sender_nation_id,
        recipient_nation_name: pm.sender_nation_name,
        content,
      });

      addMemoryEntry(recipientNation.id, `Private from ${senderNation?.name || "unknown"}: "${pm.content.slice(0, 80)}"`, analysis.importance === "high" ? "high" : "medium");
      updateRelation(recipientNation.id, pm.sender_nation_id || "", analysis);
      if (analysis.intent === "accusation") updatePersonaDrift(recipientNation.id, getBasePersonalityKey(recipientNation), "accusation");
      if (analysis.intent === "trade_offer") updatePersonaDrift(recipientNation.id, getBasePersonalityKey(recipientNation), "trade");
    }, delay);
  }

  // ── LLM ──────────────────────────────────────────────────────────────────
  async function callLLM(prompt, maxLen = 290) {
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
      const out = raw.trim().replace(/^["']|["']$/g, "").slice(0, maxLen);
      return out.length >= 5 ? out : null;
    } catch { return null; }
  }

  return null;
}