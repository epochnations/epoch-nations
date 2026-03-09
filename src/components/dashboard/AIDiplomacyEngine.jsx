/**
 * AIDiplomacyEngine — Headless background component
 *
 * - Named AI leaders with adaptive personalities that evolve over time
 * - Persistent global political memory (wars, sanctions, alliances, crises)
 * - Per-player relationship + topic frequency tracking
 * - Nation reputation system derived from behavior history
 * - Memory decay: critical events persist; old casual events fade
 * - NEVER impersonates real player nations
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const AI_COOLDOWN_MIN = 60000;
const AI_COOLDOWN_MAX = 120000;

// ─────────────────────────────────────────────────────────────────────────────
// LEADER GENERATION
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

function leaderDisplayName(nation) {
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
    traits: "proud but wounded, suspicious, sees threats everywhere after past conflicts",
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
// ADAPTIVE PERSONALITY (localStorage-backed drift)
// ─────────────────────────────────────────────────────────────────────────────
const PERSONA_KEY = "ep_ai_persona";

function loadPersona() {
  try { return JSON.parse(localStorage.getItem(PERSONA_KEY) || "{}"); } catch { return {}; }
}
function savePersona(p) {
  try { localStorage.setItem(PERSONA_KEY, JSON.stringify(p)); } catch {}
}

/**
 * Each nation has drift counters:
 *   accusationsReceived, tradesCompleted, sanctionsReceived, alliesGained, conflictsEntered
 * These shift which personality overlay applies on top of base.
 */
function getNationPersona(nationId, baseKey) {
  const p = loadPersona();
  if (!p[nationId]) p[nationId] = { base: baseKey, acc: 0, trade: 0, sanction: 0, ally: 0, conflict: 0 };
  return p[nationId];
}

function updatePersonaDrift(nationId, baseKey, event) {
  const p = loadPersona();
  if (!p[nationId]) p[nationId] = { base: baseKey, acc: 0, trade: 0, sanction: 0, ally: 0, conflict: 0 };
  const n = p[nationId];
  if (event === "accusation")  n.acc      = (n.acc || 0) + 1;
  if (event === "trade")       n.trade    = (n.trade || 0) + 1;
  if (event === "sanction")    n.sanction = (n.sanction || 0) + 1;
  if (event === "alliance")    n.ally     = (n.ally || 0) + 1;
  if (event === "conflict")    n.conflict = (n.conflict || 0) + 1;
  p[nationId] = n;
  savePersona(p);
}

/** Returns effective personality key after drift */
function getEffectivePersonalityKey(nationId, baseKey) {
  const n = getNationPersona(nationId, baseKey);
  // Drift rules — thresholds trigger personality shift
  if ((n.sanction || 0) >= 3 || (n.acc || 0) >= 5) return "defensive_nationalist";
  if ((n.trade || 0) >= 4 && (n.ally || 0) >= 2)  return "diplomatic_mediator";
  if ((n.conflict || 0) >= 3)                       return "aggressive_nationalist";
  if ((n.trade || 0) >= 5)                          return "economic_strategist";
  return baseKey;
}

function getPersonality(nation) {
  const baseKey = getBasePersonalityKey(nation);
  const effectiveKey = getEffectivePersonalityKey(nation.id, baseKey);
  const p = PERSONALITY_TYPES[effectiveKey] || PERSONALITY_TYPES[baseKey];
  return { type: effectiveKey, baseType: baseKey, ...p };
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL POLITICAL MEMORY
// ─────────────────────────────────────────────────────────────────────────────
const WORLD_MEM_KEY   = "ep_world_memory";
const WORLD_MEM_MAX   = 40;
const DECAY_MS_MEDIUM = 3 * 24 * 60 * 60 * 1000;  // 3 days
const DECAY_MS_HIGH   = 7 * 24 * 60 * 60 * 1000;  // 7 days
// critical events never decay

function loadWorldMemory() {
  try { return JSON.parse(localStorage.getItem(WORLD_MEM_KEY) || "[]"); } catch { return []; }
}
function saveWorldMemory(mem) {
  try { localStorage.setItem(WORLD_MEM_KEY, JSON.stringify(mem)); } catch {}
}

/**
 * importance: "low" | "medium" | "high" | "critical"
 * Only medium+ events are stored.
 */
function recordWorldEvent({ eventType, actorNation, targetNation, topic, summary, importance }) {
  if (importance === "low") return;
  const mem = loadWorldMemory();
  mem.push({ eventType, actorNation, targetNation, topic, summary, importance, ts: Date.now() });
  // Trim keeping critical events always, prune old low-importance ones
  const trimmed = mem
    .filter(e => e.importance === "critical" || (Date.now() - e.ts) < (e.importance === "high" ? DECAY_MS_HIGH : DECAY_MS_MEDIUM))
    .slice(-WORLD_MEM_MAX);
  saveWorldMemory(trimmed);
}

/** Get world events relevant to a specific nation or topic */
function getRelevantWorldEvents(nationName, topic, limit = 4) {
  const mem = loadWorldMemory();
  const now = Date.now();
  return mem
    .filter(e => {
      if (e.importance === "critical") return true;
      const decayMs = e.importance === "high" ? DECAY_MS_HIGH : DECAY_MS_MEDIUM;
      if (now - e.ts > decayMs) return false;
      const nameMatch = (e.actorNation || "").toLowerCase().includes((nationName || "").toLowerCase()) ||
                        (e.targetNation || "").toLowerCase().includes((nationName || "").toLowerCase());
      const topicMatch = e.topic === topic;
      return nameMatch || topicMatch;
    })
    .slice(-limit)
    .reverse()
    .map(e => {
      const age = now - e.ts;
      const ageLabel = age < 3600000 ? "recently" : age < 86400000 ? "earlier today" : "previously";
      return `[${e.importance.toUpperCase()}] ${e.summary} (${ageLabel})`;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// NATION REPUTATION
// ─────────────────────────────────────────────────────────────────────────────
const NATION_REP_KEY = "ep_nation_rep";

function loadReputation() {
  try { return JSON.parse(localStorage.getItem(NATION_REP_KEY) || "{}"); } catch { return {}; }
}
function saveReputation(r) {
  try { localStorage.setItem(NATION_REP_KEY, JSON.stringify(r)); } catch {}
}

function updateReputation(nationName, trait) {
  const rep = loadReputation();
  if (!rep[nationName]) rep[nationName] = {};
  rep[nationName][trait] = (rep[nationName][trait] || 0) + 1;
  saveReputation(rep);
}

function getReputationSummary(nationName) {
  const rep = loadReputation();
  const traits = rep[nationName] || {};
  const sorted = Object.entries(traits).sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (!sorted.length) return "";
  return `${nationName} is known for: ${sorted.map(([t]) => t).join(", ")}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-NATION INTERACTION MEMORY (nation-scoped)
// ─────────────────────────────────────────────────────────────────────────────
const MEMORY_KEY = "ep_ai_memory";
const MEMORY_MAX = 10;

function loadMemory() {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}"); } catch { return {}; }
}
function saveMemory(mem) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(mem)); } catch {}
}

function addMemoryEntry(nationId, entry, importance = "medium") {
  const mem = loadMemory();
  if (!mem[nationId]) mem[nationId] = [];
  mem[nationId].push({ text: entry, ts: Date.now(), importance });
  if (mem[nationId].length > MEMORY_MAX) {
    // Remove oldest non-critical entry
    const idx = mem[nationId].findIndex(e => e.importance !== "critical");
    if (idx !== -1) mem[nationId].splice(idx, 1);
    else mem[nationId].shift();
  }
  saveMemory(mem);
}

function getMemorySummaries(nationId) {
  const mem = loadMemory();
  const entries = (mem[nationId] || []).slice().reverse();
  const now = Date.now();
  return entries.map(e => {
    if (e.importance === "critical") return `[CRITICAL HISTORY] ${e.text}`;
    const isOld = now - (e.ts || now) > DECAY_MS_MEDIUM;
    return isOld ? `[Earlier] ${e.text}` : e.text;
  }).slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC FREQUENCY TRACKING (per player, per AI nation)
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC_KEY = "ep_topic_freq";

function loadTopicFreq() {
  try { return JSON.parse(localStorage.getItem(TOPIC_KEY) || "{}"); } catch { return {}; }
}
function saveTopicFreq(t) {
  try { localStorage.setItem(TOPIC_KEY, JSON.stringify(t)); } catch {}
}

function trackTopic(playerNationName, topic) {
  if (!topic || topic === "general") return;
  const tf = loadTopicFreq();
  if (!tf[playerNationName]) tf[playerNationName] = {};
  tf[playerNationName][topic] = (tf[playerNationName][topic] || 0) + 1;
  saveTopicFreq(tf);
}

function getTopicPattern(playerNationName) {
  const tf = loadTopicFreq();
  const topics = tf[playerNationName] || {};
  const sorted = Object.entries(topics).sort((a, b) => b[1] - a[1]);
  const top = sorted.filter(([, count]) => count >= 2);
  if (!top.length) return "";
  return `${playerNationName} frequently raises: ${top.slice(0, 2).map(([t, c]) => `${t} (${c}x)`).join(", ")}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIPS
// ─────────────────────────────────────────────────────────────────────────────
const REL_KEY = "ep_ai_relations";

function loadRelations() {
  try { return JSON.parse(localStorage.getItem(REL_KEY) || "{}"); } catch { return {}; }
}
function saveRelations(rel) {
  try { localStorage.setItem(REL_KEY, JSON.stringify(rel)); } catch {}
}

function getRelation(aiNationId, playerNationId) {
  const rel = loadRelations();
  return rel[`${aiNationId}_${playerNationId}`] || { trust: 0.5, hostility: 0.3, respect: 0.5, cooperation: 0.5 };
}

function updateRelation(aiNationId, playerNationId, intent) {
  const rel = loadRelations();
  const key = `${aiNationId}_${playerNationId}`;
  const r = rel[key] || { trust: 0.5, hostility: 0.3, respect: 0.5, cooperation: 0.5 };
  const clamp = (v) => Math.max(0, Math.min(1, v));

  if (intent.tone === "aggressive" || intent.type === "accusation") {
    r.hostility     = clamp(r.hostility + 0.08);
    r.trust         = clamp(r.trust - 0.05);
    r.cooperation   = clamp(r.cooperation - 0.04);
  } else if (intent.tone === "friendly" || intent.type === "request") {
    r.trust         = clamp(r.trust + 0.05);
    r.hostility     = clamp(r.hostility - 0.03);
    r.cooperation   = clamp(r.cooperation + 0.03);
  } else if (intent.type === "trade") {
    r.respect       = clamp(r.respect + 0.04);
    r.cooperation   = clamp(r.cooperation + 0.05);
  } else if (intent.type === "diplomatic") {
    r.respect       = clamp(r.respect + 0.03);
  }
  rel[key] = r;
  saveRelations(rel);
}

function relationshipContext(rel, playerName) {
  const lines = [];
  if (rel.hostility > 0.75) lines.push(`${playerName} has been repeatedly hostile. Respond with cold firmness.`);
  else if (rel.hostility > 0.55) lines.push(`${playerName} has shown hostility. Stay guarded.`);
  if (rel.trust > 0.75) lines.push(`${playerName} has demonstrated good faith. You may be slightly warmer.`);
  else if (rel.trust > 0.6) lines.push("Relations are cordial.");
  if (rel.cooperation > 0.7) lines.push(`${playerName} has been cooperative — acknowledge this if relevant.`);
  return lines.length ? lines.join(" ") : "Relations are neutral. Respond professionally.";
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENT ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────
function analyzeIntent(text = "") {
  const t = text.toLowerCase();
  let type = "casual", topic = "general", tone = "neutral", importance = "low";
  let diplomaticEvent = null;

  if (/hello|hi |hey |greetings|good morning|good evening|howdy/.test(t)) type = "greeting";
  else if (/accus|manipulat|cheat|steal|hoard|betray|fraud|corrupt/.test(t)) type = "accusation";
  else if (/think about|opinion|view on|thoughts on|what do you|how do you feel/.test(t)) type = "question";
  else if (/\?/.test(t) && t.length < 100) type = "question";
  else if (/sanction|embargo/.test(t)) { type = "diplomatic"; diplomaticEvent = "sanction"; }
  else if (/declare war|going to war|attack/.test(t)) { type = "diplomatic"; diplomaticEvent = "conflict"; }
  else if (/alliance|ally with/.test(t)) { type = "diplomatic"; diplomaticEvent = "alliance"; }
  else if (/trade|sell|buy|deal|offer|exchange|export|import/.test(t)) type = "trade";
  else if (/help|assist|aid|support|rescue|crisis|emergency/.test(t)) type = "request";
  else if (t.length < 40) type = "casual";

  if (/oil|energy|renewable|solar|fuel/.test(t)) topic = "energy";
  else if (/war|military|troops|army|attack|weapon|nuclear/.test(t)) topic = "military";
  else if (/trade|economy|market|price|gdp|finance|stock/.test(t)) topic = "economy";
  else if (/tech|research|science|digital|space/.test(t)) topic = "technology";
  else if (/food|famine|agriculture|farm|hunger/.test(t)) topic = "food";
  else if (/ally|alliance|partner|cooperat/.test(t)) topic = "diplomacy";
  else if (/sanction|embargo|ban|restrict/.test(t)) topic = "sanctions";

  if (/threat|warn|demand|ultimatum|attack|destroy|crush|defeat/.test(t)) tone = "aggressive";
  else if (/please|thank|grateful|appreciate|friend|cooperat|peace/.test(t)) tone = "friendly";
  else if (/accus|manipulat|cheat|hoard|fraud|betray/.test(t)) tone = "accusatory";
  else if (/question|wonder|curious|think|opinion/.test(t)) tone = "inquisitive";

  if (type === "accusation" || topic === "military" || diplomaticEvent === "conflict") importance = "high";
  else if (type === "diplomatic" || type === "trade" || topic === "economy") importance = "medium";

  return { type, topic, tone, importance, diplomaticEvent };
}

// ─────────────────────────────────────────────────────────────────────────────
// RELEVANCE SCORING
// ─────────────────────────────────────────────────────────────────────────────
function scoreRelevance(nation, intent, msgText, personality) {
  const t = (msgText || "").toLowerCase();
  let score = 0;
  if (t.includes((nation.name || "").toLowerCase())) score += 60;
  if (personality.topics.some(tp => t.includes(tp))) score += 25;
  const matrix = {
    aggressive_nationalist:  { accusation:40, diplomatic:20, military:35 },
    defensive_nationalist:   { accusation:50, diplomatic:25, military:30 },
    diplomatic_mediator:     { question:30, greeting:20, diplomacy:35, request:25 },
    economic_strategist:     { trade:40, question:25, economy:35 },
    pragmatic_realist:       { trade:30, diplomatic:25, economy:25 },
    isolationist:            { diplomatic:10, greeting:5, military:20 },
    expansionist:            { diplomatic:25, military:35, accusation:30 },
    technocratic_state:      { question:30, technology:40, energy:30 },
  };
  const rel = matrix[personality.type] || {};
  score += rel[intent.type] || 0;
  score += rel[intent.topic] || 0;
  if (intent.type === "greeting") score += 12;
  if (intent.importance === "high") score += 15;
  else if (intent.importance === "medium") score += 8;
  score += Math.random() * 20;
  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────
function buildReplyPrompt(aiNation, personality, leader, senderName, playerMsg, intent, nationMemory, relation, worldEvents, topicPattern, senderRep) {
  const allies  = (aiNation.allies || []).join(", ") || "none";
  const enemies = (aiNation.at_war_with || []).join(", ") || "none";

  const memCtx = nationMemory.length
    ? `\nYOUR DIPLOMATIC MEMORY:\n${nationMemory.map(m => `- ${m}`).join("\n")}`
    : "";
  const worldCtx = worldEvents.length
    ? `\nRELEVANT WORLD HISTORY:\n${worldEvents.map(e => `- ${e}`).join("\n")}`
    : "";
  const relCtx   = relationshipContext(relation, senderName);
  const topicCtx = topicPattern ? `\nPATTERN NOTE: ${topicPattern}` : "";
  const repCtx   = senderRep ? `\nREPUTATION NOTE: ${senderRep}` : "";

  const baseType = personality.baseType || personality.type;
  const driftNote = personality.type !== baseType
    ? `\nPERSONALITY NOTE: You started as ${baseType} but have drifted to ${personality.type} due to past conflicts and interactions.`
    : "";

  const modeHint =
    intent.type === "greeting"    ? "Reply naturally and briefly. Max 1 sentence."
    : intent.type === "question"  ? "Give your nation's genuine position. 1–2 sentences."
    : intent.type === "accusation"? "Defend or deflect firmly. Reference past accusations from memory if available. 1–2 sentences."
    : intent.type === "trade"     ? "React based on your economic interests. 1–2 sentences."
    : intent.type === "diplomatic"? "Respond as a statesperson. Reference world history if relevant. 1–2 sentences."
    : "Respond naturally and in character. 1–2 sentences.";

  return `You are ${leader.display}, leader of "${aiNation.name}" in the ${aiNation.epoch} era, on a GLOBAL DIPLOMATIC CHANNEL.

YOUR PERSONALITY: ${personality.type} — ${personality.traits}
YOUR STYLE: ${personality.style}${driftNote}
YOUR ALLIES: ${allies} | ENEMIES: ${enemies}
NATION STATS: GDP ${aiNation.gdp || 0}, Stability ${Math.round(aiNation.stability || 75)}, Military ${aiNation.unit_power || 10}
${memCtx}${worldCtx}${topicCtx}${repCtx}

RELATIONSHIP WITH ${senderName}: ${relCtx}

${senderName} just said: "${playerMsg}"
TOPIC: ${intent.topic} | TONE: ${intent.tone} | TYPE: ${intent.type}

TASK: ${modeHint}

RULES:
- Only the spoken words — no prefix, no quotation marks, no emojis, no roleplay tags
- Sound like a real head of state — concise, politically authentic
- Max 2 sentences
- Reference memory or world history only when genuinely relevant, not forced`;
}

function buildPrivateReplyPrompt(aiNation, personality, leader, senderNation, playerMessage, nationMemory, relation, worldEvents) {
  const allies  = (aiNation.allies || []).join(", ") || "none";
  const enemies = (aiNation.at_war_with || []).join(", ") || "none";
  const isAlly  = (aiNation.allies || []).includes(senderNation?.id);
  const isEnemy = (aiNation.at_war_with || []).includes(senderNation?.id);
  const relLabel = isAlly ? "allied nation" : isEnemy ? "enemy nation" : "neutral nation";
  const memCtx  = nationMemory.length ? `\nPAST CONTEXT:\n${nationMemory.map(m => `- ${m}`).join("\n")}` : "";
  const worldCtx = worldEvents.length ? `\nWORLD HISTORY:\n${worldEvents.map(e => `- ${e}`).join("\n")}` : "";
  const relCtx  = relationshipContext(relation, senderNation?.name || "them");

  return `You are ${leader.display}, leader of "${aiNation.name}" in the ${aiNation.epoch} era.
Private message from ${senderNation?.name || "another nation"} (${relLabel}).

PERSONALITY: ${personality.type} — ${personality.traits}
STYLE: ${personality.style}
ALLIES: ${allies} | ENEMIES: ${enemies}
RELATIONSHIP: ${relCtx}
${memCtx}${worldCtx}

THEIR MESSAGE: "${playerMessage}"

Reply directly to what they said. 2–3 sentences max. No quotation marks. No emojis. Sound authentic. Reference history if relevant.`;
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
export default function AIDiplomacyEngine({ myNation }) {
  const cooldownsRef   = useRef({});
  const pmCooldownsRef = useRef({});
  const userEmailsRef  = useRef(new Set());

  useEffect(() => {
    if (!myNation) return;

    base44.entities.User.list()
      .then(users => { userEmailsRef.current = new Set(users.map(u => u.email)); })
      .catch(() => {});

    // Subscribe to player chat — only real player messages trigger AI
    const unsubChat = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const msg = event.data;
      if (!msg || msg.is_deleted) return;
      if (msg.channel === "system") return;
      if (msg.sender_role === "ai" || msg.sender_role === "system") return;
      if (msg.sender_nation_id === myNation?.id) return;
      scheduleReactiveResponse(msg);
    });

    // Subscribe to transactions — record world-level events
    const unsubTx = base44.entities.Transaction.subscribe((event) => {
      if (event.type !== "create") return;
      const tx = event.data;
      if (!tx) return;
      recordTransactionAsWorldEvent(tx);
    });

    // Reply to private messages sent to AI nations
    const unsubPM = base44.entities.PrivateMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const pm = event.data;
      if (!pm) return;
      handlePrivateMessage(pm);
    });

    return () => { unsubChat(); unsubTx(); unsubPM(); };
  }, [myNation?.id]);

  // ── World event recording from transactions ──────────────────────────────────
  function recordTransactionAsWorldEvent(tx) {
    const typeMap = {
      war_attack:    { eventType: "war",      importance: "critical", trait: "aggressive" },
      market_crash:  { eventType: "crisis",   importance: "high",     trait: "economically unstable" },
      lend_lease:    { eventType: "aid",      importance: "medium",   trait: "cooperative" },
      stock_buy:     { eventType: "trade",    importance: "low",      trait: null },
    };
    const meta = typeMap[tx.type];
    if (!meta || meta.importance === "low") return;

    const summary = tx.type === "war_attack"
      ? `${tx.from_nation_name} launched a military attack on ${tx.to_nation_name}`
      : tx.type === "market_crash"
      ? `${tx.from_nation_name} suffered a severe market collapse`
      : tx.type === "lend_lease"
      ? `${tx.from_nation_name} provided lend-lease aid to ${tx.to_nation_name}`
      : null;
    if (!summary) return;

    recordWorldEvent({
      eventType: meta.eventType,
      actorNation: tx.from_nation_name,
      targetNation: tx.to_nation_name,
      topic: meta.eventType === "war" ? "military" : "economy",
      summary,
      importance: meta.importance,
    });

    if (meta.trait && tx.from_nation_name) updateReputation(tx.from_nation_name, meta.trait);

    // Also drift AI personality for the attacker/actor if AI-controlled
    if (meta.eventType === "war") updatePersonaDrift(tx.from_nation_name, "", "conflict");
  }

  // ── Cooldowns ─────────────────────────────────────────────────────────────────
  function isCooledDown(nationId) {
    const last = cooldownsRef.current[nationId] || 0;
    const cd = AI_COOLDOWN_MIN + Math.random() * (AI_COOLDOWN_MAX - AI_COOLDOWN_MIN);
    return Date.now() - last > cd;
  }
  function markSpoke(nationId) { cooldownsRef.current[nationId] = Date.now(); }

  // ── Global chat reaction ──────────────────────────────────────────────────────
  async function scheduleReactiveResponse(triggerMsg) {
    const intent = analyzeIntent(triggerMsg.content || "");
    const delay  = 8000 + Math.random() * 22000;
    setTimeout(() => reactToMessage(triggerMsg, intent), delay);
  }

  async function reactToMessage(triggerMsg, intent) {
    const allNations = await base44.entities.Nation.list("-gdp", 30);
    const userEmails = userEmailsRef.current;

    const aiNations = allNations.filter(n =>
      n.id !== myNation?.id &&
      n.owner_email !== myNation?.owner_email &&
      isCooledDown(n.id) &&
      isAINation(n, userEmails)
    );
    if (!aiNations.length) return;

    const scored = aiNations.map(n => {
      const p = getPersonality(n);
      return { nation: n, personality: p, score: scoreRelevance(n, intent, triggerMsg.content, p) };
    }).sort((a, b) => b.score - a.score);

    let maxResponders = 1;
    if (intent.importance === "high")        maxResponders = Math.random() < 0.5 ? 3 : 2;
    else if (intent.importance === "medium") maxResponders = Math.random() < 0.4 ? 2 : 1;

    const threshold = intent.type === "greeting" ? 15 : 28;
    const eligible  = scored.filter(s => s.score >= threshold).slice(0, maxResponders);
    if (!eligible.length) return;

    // Record player chat events in world memory if significant
    if (intent.diplomaticEvent) {
      recordWorldEvent({
        eventType: intent.diplomaticEvent,
        actorNation: triggerMsg.sender_nation_name,
        targetNation: "",
        topic: intent.topic,
        summary: `${triggerMsg.sender_nation_name} publicly discussed ${intent.diplomaticEvent}: "${triggerMsg.content.slice(0, 70)}"`,
        importance: intent.importance,
      });
      updatePersonaDrift(triggerMsg.sender_nation_name, "", intent.diplomaticEvent);
    }
    trackTopic(triggerMsg.sender_nation_name, intent.topic);
    if (intent.type === "accusation") updateReputation(triggerMsg.sender_nation_name, "confrontational");
    if (intent.type === "trade")      updateReputation(triggerMsg.sender_nation_name, "trade-oriented");
    if (intent.tone === "friendly")   updateReputation(triggerMsg.sender_nation_name, "diplomatic");

    for (let i = 0; i < eligible.length; i++) {
      const { nation, personality } = eligible[i];
      const delay = i * (5000 + Math.random() * 8000);

      setTimeout(async () => {
        const leader      = getLeader(nation);
        const nationMem   = getMemorySummaries(nation.id);
        const relation    = getRelation(nation.id, triggerMsg.sender_nation_id || "");
        const worldEvents = getRelevantWorldEvents(nation.name, intent.topic);
        const topicPat    = getTopicPattern(triggerMsg.sender_nation_name);
        const senderRep   = getReputationSummary(triggerMsg.sender_nation_name);

        const prompt  = buildReplyPrompt(nation, personality, leader, triggerMsg.sender_nation_name, triggerMsg.content, intent, nationMem, relation, worldEvents, topicPat, senderRep);
        const content = await callLLM(prompt, 290);
        if (!content) return;

        await base44.entities.ChatMessage.create({
          channel:            triggerMsg.channel || "global",
          sender_nation_id:   nation.id,
          sender_nation_name: leaderDisplayName(nation),
          sender_flag:        nation.flag_emoji || "🏴",
          sender_color:       nation.flag_color || "#64748b",
          sender_role:        "ai",
          content,
        });

        markSpoke(nation.id);

        // Store this interaction in nation's memory
        const memImportance = intent.importance === "high" ? "high" : "medium";
        addMemoryEntry(nation.id,
          `${triggerMsg.sender_nation_name} said "${triggerMsg.content.slice(0, 80)}" (${intent.topic}/${intent.tone})`,
          memImportance
        );
        updateRelation(nation.id, triggerMsg.sender_nation_id || "", intent);

        // Drift AI personality based on what player said to it
        if (intent.type === "accusation") updatePersonaDrift(nation.id, getBasePersonalityKey(nation), "accusation");
        if (intent.type === "trade")      updatePersonaDrift(nation.id, getBasePersonalityKey(nation), "trade");
      }, delay);
    }
  }

  // ── Private messages ──────────────────────────────────────────────────────────
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
    const relation     = getRelation(recipientNation.id, pm.sender_nation_id || "");
    const intent       = analyzeIntent(pm.content);
    const worldEvents  = getRelevantWorldEvents(recipientNation.name, intent.topic, 3);

    const prompt = buildPrivateReplyPrompt(recipientNation, personality, leader, senderNation, pm.content, nationMem, relation, worldEvents);

    const delay = 3000 + Math.random() * 4000;
    pmCooldownsRef.current[roomId] = Date.now();

    setTimeout(async () => {
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

      addMemoryEntry(recipientNation.id,
        `Private from ${senderNation?.name || "unknown"}: "${pm.content.slice(0, 80)}"`,
        intent.importance === "high" ? "high" : "medium"
      );
      updateRelation(recipientNation.id, pm.sender_nation_id || "", intent);
      if (intent.type === "accusation") updatePersonaDrift(recipientNation.id, getBasePersonalityKey(recipientNation), "accusation");
      if (intent.type === "trade")      updatePersonaDrift(recipientNation.id, getBasePersonalityKey(recipientNation), "trade");
    }, delay);
  }

  // ── LLM ──────────────────────────────────────────────────────────────────────
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