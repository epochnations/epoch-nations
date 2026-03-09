/**
 * ChatIntelligenceEngine
 *
 * Central coordinator for all AI chat response logic.
 * Determines: intent, topic, tone, target nation, importance,
 * which AI nations are relevant, response limits, timing, and
 * conversation continuity.
 *
 * Exported as pure functions — no React, no side effects.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
export const MAX_RESPONDERS_PER_MSG = 3;
export const COOLDOWN_MIN_MS = 30000;   // 30s per nation
export const COOLDOWN_MAX_MS = 30000;   // fixed 30s
export const RESPONSE_DELAY_MIN = 2000;
export const RESPONSE_DELAY_MAX = 6000;

// ─────────────────────────────────────────────────────────────────────────────
// LEADER NAME RECOGNITION
// Detects if a player is addressing a specific nation by name or leader name
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scan a message for nation names or leader name fragments.
 * Returns the matching nation object (full), or null.
 *
 * @param {string} message
 * @param {Array}  nations  — full nation objects with name + optional leader_name
 * @param {Function} getLeaderDisplay — (nation) => "Title First Last"
 */
export function detectAddressedNation(message, nations, getLeaderDisplay) {
  const lower = message.toLowerCase();
  let bestMatch = null;
  let bestLen = 0;

  for (const nation of nations) {
    // Check nation name
    const nName = (nation.name || "").toLowerCase();
    if (nName && lower.includes(nName) && nName.length > bestLen) {
      bestMatch = nation;
      bestLen = nName.length;
    }

    // Check leader display name fragments (first name, last name, full)
    const leaderDisplay = getLeaderDisplay ? getLeaderDisplay(nation) : "";
    if (leaderDisplay) {
      const parts = leaderDisplay.toLowerCase().split(/[\s–-]+/).filter(p => p.length > 2);
      for (const part of parts) {
        if (lower.includes(part) && part.length > bestLen) {
          bestMatch = nation;
          bestLen = part.length;
        }
      }
    }
  }

  return bestMatch;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE ANALYZER
// Extracts: intent, topic, tone, targetNation, importance, isQuestion
// ─────────────────────────────────────────────────────────────────────────────
const QUESTION_WORDS = /\b(who|what|when|where|why|is|are|does|would|can|should|will|do|how)\b/i;

/**
 * @param {string} text
 * @param {Array}  allNationNames  — list of nation name strings for direct-mention detection
 * @returns {{ intent, topic, tone, targetNation, importance, isQuestion, diplomaticEvent }}
 */
export function analyzeMessage(text = "", allNationNames = []) {
  const t = text.toLowerCase();

  // ── Intent ──────────────────────────────────────────────────────────────────
  let intent = "casual";
  let diplomaticEvent = null;

  if (/\b(hello|hi|hey|greetings|good morning|good evening|howdy|sup|yo)\b/.test(t))
    intent = "greeting";
  else if (/\b(accus|manipulat|cheat|steal|hoard|betray|fraud|corrupt|liar|dishonest)\b/.test(t))
    intent = "accusation";
  else if (/\b(sanction|embargo)\b/.test(t)) {
    intent = "diplomatic_statement"; diplomaticEvent = "sanction";
  } else if (/\b(declare war|going to war|attack|invad|launch|strike)\b/.test(t)) {
    intent = "military_discussion"; diplomaticEvent = "conflict";
  } else if (/\b(ally|alliance|join forces|mutual defense|coalition)\b/.test(t)) {
    intent = "diplomatic_statement"; diplomaticEvent = "alliance";
  } else if (/\b(trade|sell|buy|deal|offer|exchange|export|import|barter)\b/.test(t)) {
    intent = "trade_offer";
  } else if (/\b(resource|oil|iron|wood|gold|stone|food|supply|produce)\b/.test(t)) {
    intent = "resource_inquiry";
  } else if (QUESTION_WORDS.test(t) || t.includes("?")) {
    intent = "question";
  } else if (/\b(war|military|troops|army|weapon|nuclear|missile|defense)\b/.test(t)) {
    intent = "military_discussion";
  } else if (/\b(economy|gdp|market|inflation|recession|growth)\b/.test(t)) {
    intent = "diplomatic_statement";
  } else if (t.length < 50) {
    intent = "casual";
  }

  // ── Topic ───────────────────────────────────────────────────────────────────
  let topic = "general";
  if (/\b(oil|energy|renewable|solar|fuel|power)\b/.test(t))       topic = "energy";
  else if (/\b(war|military|troops|army|attack|weapon|nuclear)\b/.test(t)) topic = "war";
  else if (/\b(trade|market|price|gdp|finance|stock|economy)\b/.test(t))   topic = "economy";
  else if (/\b(tech|research|science|digital|space|ai|innovation)\b/.test(t)) topic = "technology";
  else if (/\b(food|famine|agriculture|farm|hunger|crop)\b/.test(t))        topic = "resources";
  else if (/\b(iron|wood|gold|stone|oil|resource|supply)\b/.test(t))        topic = "resources";
  else if (/\b(ally|alliance|partner|cooperat|treaty)\b/.test(t))           topic = "alliances";
  else if (/\b(sanction|embargo|ban|restrict)\b/.test(t))                   topic = "sanctions";
  else if (/\b(hello|hi|hey|greet|morning|evening)\b/.test(t))              topic = "greeting";

  // ── Tone ────────────────────────────────────────────────────────────────────
  let tone = "neutral";
  if (/\b(threat|warn|demand|ultimatum|attack|destroy|crush|defeat|punish)\b/.test(t))
    tone = "aggressive";
  else if (/\b(please|thank|grateful|appreciate|friend|cooperat|peace|respect)\b/.test(t))
    tone = "friendly";
  else if (/\b(accus|manipulat|cheat|fraud|betray|liar)\b/.test(t))
    tone = "accusatory";
  else if (QUESTION_WORDS.test(t) || t.includes("?"))
    tone = "inquisitive";

  // ── Target nation detection (direct mention) ─────────────────────────────────
  let targetNation = null;
  for (const name of allNationNames) {
    if (name && t.includes(name.toLowerCase())) {
      targetNation = name;
      break;
    }
  }

  // ── Importance ───────────────────────────────────────────────────────────────
  let importance = "low";
  if (intent === "accusation" || topic === "war" || diplomaticEvent === "conflict")
    importance = "high";
  else if (["diplomatic_statement","trade_offer","military_discussion","resource_inquiry"].includes(intent) || topic === "economy")
    importance = "medium";
  else if (intent === "question" && t.length > 30)
    importance = "medium";

  // ── Is question ──────────────────────────────────────────────────────────────
  const isQuestion = t.includes("?") || QUESTION_WORDS.test(t);

  return { intent, topic, tone, targetNation, importance, isQuestion, diplomaticEvent };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION HISTORY BUILDER
// Formats recent chat messages into a readable context string for LLM prompts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a concise conversation history string from recent messages.
 * @param {Array} recentMessages — array of ChatMessage objects, oldest first
 * @returns {string}
 */
export function buildConversationHistory(recentMessages) {
  if (!recentMessages || !recentMessages.length) return "";
  return recentMessages
    .slice(-6) // last 6 messages for context
    .map(m => `${m.sender_nation_name}: ${m.content}`)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// NATION RELEVANCE ENGINE
// Determines which AI nations should respond to a given analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score how relevant an AI nation is to respond to this message.
 * Higher = more likely to respond.
 *
 * @param {object} nation
 * @param {object} analysis  — from analyzeMessage()
 * @param {string} rawText
 * @param {object} personality — { type, topics }
 * @returns {number}
 */
export function scoreNationRelevance(nation, analysis, rawText, personality) {
  const t = (rawText || "").toLowerCase();
  let score = 0;

  // Direct name mention → highest priority
  if (analysis.targetNation &&
      (nation.name || "").toLowerCase().includes(analysis.targetNation.toLowerCase()))
    score += 70;

  // Personality topic overlap
  if (personality.topics && personality.topics.some(tp => t.includes(tp))) score += 25;

  // Topic-based relevance rules
  const topicRules = {
    war:          { aggressive_nationalist: 40, expansionist: 35, defensive_nationalist: 30, military_discussion: 20 },
    economy:      { economic_strategist: 40, pragmatic_realist: 30, diplomatic_mediator: 15 },
    resources:    { economic_strategist: 35, expansionist: 25 },
    sanctions:    { aggressive_nationalist: 30, defensive_nationalist: 45, diplomatic_mediator: 20 },
    alliances:    { diplomatic_mediator: 40, expansionist: 25, isolationist: 10 },
    technology:   { technocratic_state: 45 },
    energy:       { economic_strategist: 35, technocratic_state: 30 },
    greeting:     { diplomatic_mediator: 25 },
    general:      {},
  };
  const tRule = topicRules[analysis.topic] || {};
  score += tRule[personality.type] || 0;

  // Intent-based scoring
  const intentRules = {
    greeting:            { diplomatic_mediator: 20, technocratic_state: 10, isolationist: 5 },
    question:            { diplomatic_mediator: 25, economic_strategist: 20, technocratic_state: 30 },
    accusation:          { aggressive_nationalist: 40, defensive_nationalist: 50, expansionist: 25 },
    trade_offer:         { economic_strategist: 40, pragmatic_realist: 35, diplomatic_mediator: 20 },
    resource_inquiry:    { economic_strategist: 30, pragmatic_realist: 25 },
    military_discussion: { aggressive_nationalist: 35, expansionist: 40, defensive_nationalist: 30 },
    diplomatic_statement:{ diplomatic_mediator: 35, pragmatic_realist: 20 },
    casual:              { diplomatic_mediator: 10 },
  };
  const iRule = intentRules[analysis.intent] || {};
  score += iRule[personality.type] || 0;

  // Questions boost response probability across the board
  if (analysis.isQuestion) score += 18;

  // Importance multiplier
  if (analysis.importance === "high")   score += 15;
  else if (analysis.importance === "medium") score += 8;

  // Natural variance — prevents identical response order every time
  score += Math.random() * 18;

  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE LIMITS & TIMING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How many AI nations may respond to this message?
 */
export function maxResponders(analysis) {
  if (analysis.targetNation)            return 2; // direct mention: target + 1 observer
  if (analysis.importance === "high")   return Math.random() < 0.5 ? 3 : 2;
  if (analysis.importance === "medium") return Math.random() < 0.4 ? 2 : 1;
  if (analysis.intent === "greeting")   return Math.floor(Math.random() * 2) + 1; // 1–2
  return 1;
}

/**
 * Minimum score threshold for a nation to respond.
 * Casual/greetings have a lower bar; important topics require more relevance.
 */
export function responseThreshold(analysis) {
  if (analysis.intent === "greeting" || analysis.intent === "casual") return 14;
  if (analysis.importance === "high")   return 30;
  if (analysis.importance === "medium") return 26;
  return 22;
}

/**
 * Delay before the i-th responder replies (ms), to simulate natural stagger.
 * First reply: 2–6s, subsequent replies stagger further.
 */
export function responseDelay(index = 0) {
  const base = RESPONSE_DELAY_MIN + Math.random() * (RESPONSE_DELAY_MAX - RESPONSE_DELAY_MIN);
  return base + index * (4000 + Math.random() * 5000);
}

/**
 * Check if an AI nation is off cooldown.
 * @param {string} nationId
 * @param {object} cooldownMap — { [nationId]: lastSpokeTimestamp }
 */
export function isOffCooldown(nationId, cooldownMap) {
  const last = cooldownMap[nationId] || 0;
  const cd = COOLDOWN_MIN_MS + Math.random() * (COOLDOWN_MAX_MS - COOLDOWN_MIN_MS);
  return Date.now() - last > cd;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION CONTINUITY
// Tracks recent conversation threads so previously-involved nations get priority
// ─────────────────────────────────────────────────────────────────────────────

/** In-module conversation thread tracker (session-scoped) */
const recentThreads = {};   // { [topic]: { nationIds: string[], lastTs: number } }
const THREAD_TTL = 3 * 60 * 1000; // 3 minutes

/**
 * Record that a nation participated in a topic thread.
 */
export function recordThreadParticipation(topic, nationId) {
  if (!topic || !nationId) return;
  if (!recentThreads[topic]) recentThreads[topic] = { nationIds: [], lastTs: Date.now() };
  if (!recentThreads[topic].nationIds.includes(nationId)) {
    recentThreads[topic].nationIds.push(nationId);
  }
  recentThreads[topic].lastTs = Date.now();
}

/**
 * Returns a set of nation IDs that were recently involved in this topic thread.
 * Expired threads are pruned automatically.
 */
export function getThreadParticipants(topic) {
  const thread = recentThreads[topic];
  if (!thread) return new Set();
  if (Date.now() - thread.lastTs > THREAD_TTL) {
    delete recentThreads[topic];
    return new Set();
  }
  return new Set(thread.nationIds);
}

/**
 * Boost score for nations already in the conversation thread.
 */
export function applyThreadBoost(score, nationId, topic) {
  const participants = getThreadParticipants(topic);
  return participants.has(nationId) ? score + 20 : score;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SELECTOR
// Takes all AI nations + analysis, returns ordered list of responders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Select which AI nations should respond, in order.
 * Uses a 4-tier priority system:
 *   P1 — Reply target (player replied to this AI's message)
 *   P2 — Addressed by name/leader name
 *   P3 — Topic relevance
 *   P4 — Casual / fallback
 *
 * @param {Array}  aiNations        — pre-filtered (not real players, not myNation)
 * @param {object} analysis         — from analyzeMessage()
 * @param {string} rawText          — original message
 * @param {Function} getPersonality — (nation) => { type, topics, ... }
 * @param {object} cooldownMap      — { [nationId]: timestamp }
 * @param {string|null} replyTargetNationId  — nation ID the player is replying to (P1)
 * @param {object|null} addressedNation      — full nation object detected by detectAddressedNation (P2)
 * @returns {Array} ordered array of { nation, personality, delay }
 */
export function selectResponders(
  aiNations, analysis, rawText, getPersonality, cooldownMap,
  replyTargetNationId = null, addressedNation = null
) {
  if (!aiNations.length) return [];

  const selected = [];
  const usedIds  = new Set();

  // ── PRIORITY 1: Reply target ──────────────────────────────────────────────
  if (replyTargetNationId) {
    const p1 = aiNations.find(n => n.id === replyTargetNationId);
    if (p1) {
      selected.push({ nation: p1, personality: getPersonality(p1) });
      usedIds.add(p1.id);
    }
  }

  // ── PRIORITY 2: Addressed by name or leader name ──────────────────────────
  if (addressedNation && !usedIds.has(addressedNation.id)) {
    const p2 = aiNations.find(n => n.id === addressedNation.id);
    if (p2) {
      selected.unshift({ nation: p2, personality: getPersonality(p2) }); // goes first
      usedIds.add(p2.id);
    }
  }

  // ── PRIORITY 3 & 4: Score remaining nations for relevance ─────────────────
  const max = Math.max(1, 3 - selected.length); // fill up to 3 total
  const threshold = responseThreshold(analysis);

  const remaining = aiNations
    .filter(n => !usedIds.has(n.id))
    .map(n => {
      const personality = getPersonality(n);
      let score = scoreNationRelevance(n, analysis, rawText, personality);
      score = applyThreadBoost(score, n.id, analysis.topic);
      // Legacy targetNation string boost
      if (analysis.targetNation &&
          (n.name || "").toLowerCase().includes(analysis.targetNation.toLowerCase()))
        score += 60;
      return { nation: n, personality, score };
    })
    .sort((a, b) => b.score - a.score);

  // If we already have a direct target (P1 or P2), only add secondary responders
  // if the topic is important enough — avoid spam for casual/greeting if already targeted
  const hasDirectTarget = selected.length > 0;
  const secondaryThreshold = hasDirectTarget
    ? Math.max(threshold, analysis.importance === "low" ? 999 : threshold + 10)
    : threshold;

  const offCooldown = remaining.filter(s =>
    isOffCooldown(s.nation.id, cooldownMap) && s.score >= secondaryThreshold
  );

  const extras = offCooldown.slice(0, max);
  for (const e of extras) selected.push(e);

  // GUARANTEE: if still empty, force the highest-scored nation
  if (selected.length === 0) {
    const fallback = remaining[0] || aiNations.map(n => ({ nation: n, personality: getPersonality(n), score: 0 }))[0];
    if (fallback) selected.push(fallback);
  }

  // Attach staggered delays — P1/P2 target responds first
  return selected.map((s, i) => ({ ...s, delay: responseDelay(i) }));
}