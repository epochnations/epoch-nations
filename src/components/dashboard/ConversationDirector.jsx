/**
 * ConversationDirector
 *
 * Sits between WorldChat → AIDiplomacyEngine → ChatIntelligenceEngine.
 * Controls WHO responds, HOW MANY respond, WHAT their prompt contains,
 * and validates responses before posting.
 *
 * Pure utility module — no React, no side effects.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
export const COOLDOWN_MS            = 45000;   // 45s per nation
export const MAX_RESPONSE_WORDS     = 40;
export const MAX_SENTENCES          = 2;
export const SECONDARY_CHANCE       = 0.20;    // 20% chance another nation comments
export const FALLBACK_RESPONSE      = "We will review this matter and provide further clarification.";

// ─────────────────────────────────────────────────────────────────────────────
// DIPLOMATIC PERSONALITY ENGINE
// Each AI leader has a distinct personality trait that shapes response STYLE
// ─────────────────────────────────────────────────────────────────────────────
export const DIPLOMATIC_TRAITS = {
  aggressive: {
    label: "Aggressive",
    prompt_hint: "Respond with confidence bordering on aggression. Short, declarative, challenging. Do not back down.",
    opening_styles: [
      "Let me be direct —",
      "We will not tolerate —",
      "Your question implies weakness. Know this:",
    ],
  },
  cautious: {
    label: "Cautious",
    prompt_hint: "Respond carefully and guardedly. Avoid committing to strong positions. Hedge your statements.",
    opening_styles: [
      "We must proceed carefully here.",
      "Before answering, we note that",
      "Our position, with appropriate caution, is",
    ],
  },
  economic_strategist: {
    label: "Economic Strategist",
    prompt_hint: "Frame everything through an economic lens. Reference trade, GDP, resources, market leverage.",
    opening_styles: [
      "Economically speaking,",
      "The market implications are clear:",
      "From a resource perspective,",
    ],
  },
  diplomatic_negotiator: {
    label: "Diplomatic Negotiator",
    prompt_hint: "Respond with measured, formal diplomacy. Seek middle ground. Acknowledge all parties.",
    opening_styles: [
      "With the utmost respect to all parties,",
      "We propose a measured approach:",
      "In the interest of dialogue,",
    ],
  },
  expansionist: {
    label: "Expansionist",
    prompt_hint: "Assert dominance and strategic ambition. Reference influence, power, and territorial interests.",
    opening_styles: [
      "Our sphere of influence dictates that",
      "The balance of power is clear:",
      "We are expanding, and this is relevant —",
    ],
  },
  isolationist: {
    label: "Isolationist",
    prompt_hint: "Be brief and dismissive unless directly addressed. Sovereign and withdrawn.",
    opening_styles: [
      "We prefer not to involve ourselves, however —",
      "Our internal affairs take precedence, but",
      "Briefly —",
    ],
  },
  technocratic: {
    label: "Technocratic",
    prompt_hint: "Reference data, research, and technological advancement. Clinical and forward-looking.",
    opening_styles: [
      "The data suggests",
      "From an analytical standpoint,",
      "Our research indicates that",
    ],
  },
  nationalist: {
    label: "Nationalist",
    prompt_hint: "Proud of national identity. Defensive of sovereignty. References historical precedent.",
    opening_styles: [
      "Our nation has always —",
      "History makes our position clear:",
      "We stand by our sovereignty —",
    ],
  },
};

const TRAIT_KEYS = Object.keys(DIPLOMATIC_TRAITS);

/**
 * Deterministically assign a diplomatic trait to a nation.
 * Consistent across sessions for the same nation name.
 */
export function getDiplomaticTrait(nation) {
  let h = 5381;
  for (const c of (nation.name || "X")) h = ((h << 5) + h + c.charCodeAt(0)) & 0xffffff;
  return TRAIT_KEYS[Math.abs(h) % TRAIT_KEYS.length];
}

export function getDiplomaticPersonality(nation) {
  const key = getDiplomaticTrait(nation);
  return { key, ...DIPLOMATIC_TRAITS[key] };
}

// ─────────────────────────────────────────────────────────────────────────────
// TARGETING ENGINE
// Determines who should respond based on message content
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect if a specific AI nation or its leader is directly addressed.
 * Returns the matched nation object or null.
 *
 * @param {string}   text
 * @param {Array}    aiNations
 * @param {Function} getLeaderDisplay - (nation) => "Title First Last"
 */
export function detectDirectAddress(text, aiNations, getLeaderDisplay) {
  if (!text || !aiNations.length) return null;
  const lower = text.toLowerCase();
  let best = null;
  let bestLen = 0;

  for (const nation of aiNations) {
    // Nation name match
    const nName = (nation.name || "").toLowerCase();
    if (nName.length > 2 && lower.includes(nName) && nName.length > bestLen) {
      best = nation; bestLen = nName.length;
    }

    // Leader name fragments (skip very short parts)
    if (getLeaderDisplay) {
      const display = getLeaderDisplay(nation).toLowerCase();
      const parts = display.split(/[\s–,\-]+/).filter(p => p.length > 3);
      for (const part of parts) {
        if (lower.includes(part) && part.length > bestLen) {
          best = nation; bestLen = part.length;
        }
      }
    }
  }

  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONDER COUNT RULES
// How many AI nations may respond per scenario
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the maximum number of AI responders for a given scenario.
 *
 * @param {{ isDirectAddress: boolean, isReplyTarget: boolean, intent: string, importance: string }} params
 */
export function maxResponderCount({ isDirectAddress, isReplyTarget, intent, importance }) {
  if (isDirectAddress || isReplyTarget) return 1;          // Direct question → only that nation
  if (intent === "greeting" || intent === "casual")        return Math.random() < 0.5 ? 1 : 2;
  if (importance === "high" || intent === "military_discussion") return Math.random() < 0.6 ? 3 : 2;
  if (importance === "medium" || intent === "trade_offer") return Math.random() < 0.5 ? 2 : 1;
  return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// COOLDOWN MANAGER
// ─────────────────────────────────────────────────────────────────────────────

export function isNationOffCooldown(nationId, cooldownMap) {
  return Date.now() - (cooldownMap[nationId] || 0) >= COOLDOWN_MS;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONDER SELECTOR
// Picks which AI nations respond, using strict targeting rules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns ordered list of AI nations that should respond, with staggered delays.
 *
 * Priority:
 *   P1 — Reply target (player replied to this AI's message)
 *   P2 — Directly addressed by name / leader name
 *   P3 — Relevance-scored secondary responders (only if open discussion)
 *   P4 — Forced fallback if P1/P2/P3 all empty
 *
 * @param {object} opts
 * @returns {Array<{ nation, traitKey, delay, isPrimary, isSecondary }>}
 */
export function selectDirectedResponders({
  aiNations,
  analysis,
  rawText,
  cooldownMap,
  replyTargetNation,   // full nation object or null
  addressedNation,     // full nation object or null
  getScoreFn,          // (nation, analysis, text) => number
}) {
  const selected = [];
  const usedIds  = new Set();

  // ── P1: Reply target ──────────────────────────────────────────────────────
  if (replyTargetNation && !usedIds.has(replyTargetNation.id)) {
    selected.push({ nation: replyTargetNation, isPrimary: true, isSecondary: false });
    usedIds.add(replyTargetNation.id);
  }

  // ── P2: Direct address (overrides P1 order — goes first) ─────────────────
  if (addressedNation && !usedIds.has(addressedNation.id)) {
    // Insert at front so addressed nation replies first
    selected.unshift({ nation: addressedNation, isPrimary: true, isSecondary: false });
    usedIds.add(addressedNation.id);
  }

  // Determine whether secondary responses are appropriate
  const maxCount = maxResponderCount({
    isDirectAddress: !!addressedNation,
    isReplyTarget:   !!replyTargetNation,
    intent:     analysis.intent,
    importance: analysis.importance,
  });

  const slotsLeft = maxCount - selected.length;

  // ── P3: Scored secondary responders ───────────────────────────────────────
  if (slotsLeft > 0 && !addressedNation && !replyTargetNation) {
    const candidates = aiNations
      .filter(n => !usedIds.has(n.id) && isNationOffCooldown(n.id, cooldownMap))
      .map(n => ({ nation: n, score: getScoreFn ? getScoreFn(n, analysis, rawText) : Math.random() * 50 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, slotsLeft);

    for (const c of candidates) {
      selected.push({ nation: c.nation, isPrimary: false, isSecondary: false });
      usedIds.add(c.nation.id);
    }
  }

  // ── P4: Forced fallback ────────────────────────────────────────────────────
  if (selected.length === 0) {
    const fallback = aiNations.find(n => isNationOffCooldown(n.id, cooldownMap)) || aiNations[0];
    if (fallback) selected.push({ nation: fallback, isPrimary: false, isSecondary: false });
  }

  // ── Optional secondary commentary (20% chance, only if not direct address) ─
  if (!addressedNation && !replyTargetNation && Math.random() < SECONDARY_CHANCE) {
    const commentator = aiNations.find(n =>
      !usedIds.has(n.id) && isNationOffCooldown(n.id, cooldownMap)
    );
    if (commentator) {
      selected.push({ nation: commentator, isPrimary: false, isSecondary: true });
    }
  }

  // Attach staggered delays
  return selected.map((s, i) => ({
    ...s,
    traitKey: getDiplomaticTrait(s.nation),
    delay: i === 0
      ? 2000 + Math.random() * 3000          // primary: 2–5s
      : 6000 + i * (3000 + Math.random() * 4000), // secondaries stagger further
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER
// Constructs the ConversationDirector-style prompt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the ConversationDirector-format LLM prompt.
 *
 * @param {object} opts
 */
export function buildDirectorPrompt({
  aiNation,
  leaderDisplay,
  basePersonality,    // from existing personality system { type, traits, style }
  diplomaticTrait,    // from getDiplomaticPersonality()
  senderName,
  playerMessage,
  conversationHistory,
  gameStateContext,
  relationshipContext,
  worldEvents,
  nationMemory,
  analysis,
  isSecondary,
  isAddressed,
}) {
  const convBlock = conversationHistory
    ? `\nRECENT CONVERSATION:\n${conversationHistory}\n`
    : "";

  const memBlock = nationMemory.length
    ? `\nDIPLOMATIC MEMORY:\n${nationMemory.map(m => `- ${m}`).join("\n")}\n`
    : "";

  const worldBlock = worldEvents.length
    ? `\nWORLD HISTORY:\n${worldEvents.map(e => `- ${e}`).join("\n")}\n`
    : "";

  const secondaryNote = isSecondary
    ? "\nROLE: You are a SECONDARY OBSERVER adding brief commentary on this topic. Do not directly answer the question — just add a relevant geopolitical observation."
    : isAddressed
    ? "\nROLE: You were DIRECTLY ADDRESSED. Answer the question clearly and directly."
    : "";

  const taskInstruction = isSecondary
    ? "Add one brief, relevant observation about this topic. Do not answer the question directly."
    : analysis.intent === "greeting"
    ? "Greet them briefly in your nation's style. Max 1 sentence."
    : analysis.intent === "accusation"
    ? "Defend your position or deflect firmly. Reference past context if relevant."
    : analysis.intent === "trade_offer"
    ? "React to this trade proposal based on your resources and strategic interests."
    : analysis.intent === "military_discussion"
    ? "Respond as a statesperson on this military matter using your real data."
    : "Answer the question directly and concisely using your game data.";

  return `You are ${leaderDisplay}, leader of "${aiNation.name}" in the ${aiNation.epoch || "Stone Age"} era, speaking on a GLOBAL DIPLOMATIC CHANNEL.

PERSONALITY TYPE: ${basePersonality.type} — ${basePersonality.traits}
COMMUNICATION STYLE: ${basePersonality.style}
DIPLOMATIC TRAIT: ${diplomaticTrait.label} — ${diplomaticTrait.prompt_hint}
${secondaryNote}

YOUR NATION'S REAL DATA (use exact numbers, never fabricate):
${gameStateContext}
${memBlock}${worldBlock}${convBlock}
RELATIONSHIP WITH ${senderName}: ${relationshipContext}

${senderName} said: "${playerMessage}"
INTENT: ${analysis.intent} | TOPIC: ${analysis.topic} | TONE: ${analysis.tone}

TASK: ${taskInstruction}

STRICT RULES:
- Output ONLY the spoken words — no name prefix, no quotation marks, no stage directions, no emojis
- Maximum ${MAX_RESPONSE_WORDS} words total
- Maximum ${MAX_SENTENCES} sentences
- End with proper punctuation (. ! or ?)
- Sound like a real head of state — concise, politically authentic
- NEVER invent statistics — use only the exact values from YOUR NATION'S REAL DATA above
- If you were directly addressed, answer what was asked
- Do not repeat what the player just said back to them`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE VALIDATOR
// Checks if the AI response is complete and on-topic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate an AI-generated response.
 * Returns { valid: boolean, reason: string }
 */
export function validateResponse(text) {
  if (!text || text.trim().length < 5) return { valid: false, reason: "too short" };

  const trimmed = text.trim();

  // Must end with sentence-ending punctuation
  if (!/[.!?]$/.test(trimmed)) return { valid: false, reason: "incomplete sentence" };

  // Must not be excessively long (hard cutoff at 80 words)
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 80) return { valid: false, reason: "too long" };

  // Must not start with quotes or stage directions
  if (/^["'([]/.test(trimmed)) return { valid: false, reason: "bad prefix" };

  return { valid: true, reason: "ok" };
}

/**
 * Attempt to repair a response that lacks terminal punctuation.
 * Finds the last complete sentence and returns it, or appends a period.
 */
export function repairResponse(text) {
  if (!text) return FALLBACK_RESPONSE;
  // Find last sentence boundary
  const match = text.match(/^(.*[.!?])\s*[^.!?]*$/);
  if (match && match[1].length > 10) return match[1].trim();
  // Just add a period if no boundary found
  return text.trim() + ".";
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION HISTORY BUILDER
// Formats recent messages into a readable block for LLM context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a 6-message conversation history string.
 * @param {Array} messages  - ChatMessage objects, oldest first
 */
export function buildHistory(messages) {
  if (!messages || !messages.length) return "";
  return messages
    .slice(-6)
    .map(m => `${m.sender_nation_name}: ${m.content}`)
    .join("\n");
}