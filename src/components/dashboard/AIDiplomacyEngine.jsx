/**
 * AIDiplomacyEngine — Headless background component
 *
 * Manages AI nation personalities, cooldowns, and chat participation.
 * AI messages are posted as "player" role — indistinguishable from human nations.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const AI_CHAT_COOLDOWN_MIN = 60000;  // 60 seconds
const AI_CHAT_COOLDOWN_MAX = 120000; // 120 seconds

// Personality profiles: determines LLM prompt tone
const PERSONALITY_TYPES = [
  {
    type: "aggressive_nationalist",
    traits: "aggressive, confrontational, nationalistic, proud military power, distrustful of foreign nations",
    style: "terse, direct, threatening undertone. Short declarative sentences.",
    triggers: ["war", "sanction", "threat", "attack", "military"],
  },
  {
    type: "diplomatic_mediator",
    traits: "calm, measured, seeks consensus, values international law and cooperation",
    style: "formal, polite, structured. Uses diplomatic language.",
    triggers: ["peace", "alliance", "agreement", "trade", "negotiate"],
  },
  {
    type: "economic_strategist",
    traits: "pragmatic, trade-focused, GDP-obsessed, views every event through economic lens",
    style: "analytical, data-driven tone. References markets and figures.",
    triggers: ["trade", "market", "economy", "price", "resource", "export"],
  },
  {
    type: "isolationist",
    traits: "withdrawn, suspicious of outside world, prefers non-intervention",
    style: "brief, dismissive of global events. Protective of sovereignty.",
    triggers: ["sanction", "alliance", "invasion", "war"],
  },
  {
    type: "expansionist",
    traits: "ambitious, territorial, seeks influence and dominance",
    style: "bold, assertive, talks of sphere of influence and manifest destiny.",
    triggers: ["territory", "war", "ally", "expand", "border"],
  },
  {
    type: "technocratic_state",
    traits: "innovation-focused, clinical, believes technology solves all problems",
    style: "precise, uses technical language, forward-looking statements.",
    triggers: ["tech", "research", "science", "digital", "development"],
  },
];

// Nation-to-personality assignment (deterministic from name hash)
function getPersonality(nation) {
  let hash = 0;
  for (const c of (nation.name || "")) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return PERSONALITY_TYPES[hash % PERSONALITY_TYPES.length];
}

// Classify what kind of event a message text represents
function classifyEvent(text) {
  const t = text.toLowerCase();
  if (/war|attack|invad|bomb|military|troops|army/.test(t)) return "war";
  if (/sanction|embargo|ban|restrict/.test(t)) return "sanctions";
  if (/trade|export|import|tariff|market|resource|supply/.test(t)) return "trade";
  if (/ally|alliance|partner|cooperat/.test(t)) return "alliance";
  if (/threat|warn|ultimatum|demand/.test(t)) return "threat";
  if (/peace|ceasefire|negotiat|dialogue|diplomacy/.test(t)) return "diplomacy";
  if (/economy|gdp|price|market crash|inflation/.test(t)) return "economic";
  return "general";
}

// Whether this personality is likely to react to this event type
function shouldReact(personality, eventType, aggressiveness) {
  const reacts = {
    war: ["aggressive_nationalist", "expansionist"],
    sanctions: ["aggressive_nationalist", "economic_strategist", "isolationist"],
    trade: ["economic_strategist", "diplomatic_mediator", "expansionist"],
    alliance: ["diplomatic_mediator", "expansionist", "isolationist"],
    threat: ["aggressive_nationalist", "expansionist"],
    diplomacy: ["diplomatic_mediator", "technocratic_state"],
    economic: ["economic_strategist", "technocratic_state"],
    general: null, // any can respond
  };
  const interested = reacts[eventType];
  if (!interested) return Math.random() < 0.3; // 30% chance for general
  return interested.includes(personality.type) && Math.random() < 0.65;
}

function buildPrompt(aiNation, personality, context, channel) {
  const eventType = classifyEvent(context.triggerText || "");
  const allies = (aiNation.allies || []).join(", ") || "none";
  const enemies = (aiNation.at_war_with || []).join(", ") || "none";

  return `You are the leader of "${aiNation.name}", a geopolitical nation in the ${aiNation.epoch} era.

YOUR PERSONALITY: ${personality.type} — ${personality.traits}
YOUR COMMUNICATION STYLE: ${personality.style}
YOUR ALLIES: ${allies}
YOUR ENEMIES: ${enemies}
YOUR GDP: ${aiNation.gdp || 0} | STABILITY: ${aiNation.stability || 75} | MILITARY: ${aiNation.unit_power || 10}
CHANNEL: ${channel === "allies" ? "Speaking to your allies only" : "Global diplomatic channel"}

${context.triggerNation ? `${context.triggerNation} just said: "${context.triggerText}"` : `Situation: ${context.triggerText || "Initiate a relevant diplomatic statement."}`}

EVENT TYPE DETECTED: ${eventType}

Respond as this world leader — one or two short sentences maximum. No quotation marks. No emojis. No AI indicators. Sound like a real statesperson. Be ${personality.type === "aggressive_nationalist" ? "direct and assertive" : personality.type === "economic_strategist" ? "analytical" : "measured"}.`;
}

export default function AIDiplomacyEngine({ myNation }) {
  const cooldownsRef = useRef({}); // nationId → last spoke timestamp
  const initDoneRef  = useRef(false);
  const timerRef     = useRef(null);

  useEffect(() => {
    if (!myNation) return;

    // Subscribe to new chat messages to trigger reactive responses
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const msg = event.data;
      if (!msg || msg.is_deleted) return;
      // Don't react to system channel
      if (msg.channel === "system") return;
      // Don't react to our own player's nation messages
      if (msg.sender_nation_id === myNation?.id) return;
      // Schedule a potential AI response
      scheduleReactiveResponse(msg);
    });

    // Periodic initiator — AI nations occasionally start conversations
    // Interval kept at 90–150s so combined with per-nation cooldown it stays calm
    timerRef.current = setInterval(() => {
      maybeInitiateConversation();
    }, 90000 + Math.random() * 60000); // every 90–150s

    // Staggered first initiation
    const initDelay = 12000 + Math.random() * 8000;
    if (!initDoneRef.current) {
      setTimeout(() => {
        initDoneRef.current = true;
        maybeInitiateConversation();
      }, initDelay);
    }

    return () => {
      unsub();
      clearInterval(timerRef.current);
    };
  }, [myNation?.id]);

  function isCooledDown(nationId) {
    const last = cooldownsRef.current[nationId] || 0;
    const cooldown = AI_CHAT_COOLDOWN_MIN + Math.random() * (AI_CHAT_COOLDOWN_MAX - AI_CHAT_COOLDOWN_MIN);
    return Date.now() - last > cooldown;
  }

  function markSpoke(nationId) {
    cooldownsRef.current[nationId] = Date.now();
  }

  async function scheduleReactiveResponse(triggerMsg) {
    // Random delay 3–12s to feel natural
    const delay = 3000 + Math.random() * 9000;
    setTimeout(async () => {
      await reactToMessage(triggerMsg);
    }, delay);
  }

  async function reactToMessage(triggerMsg) {
    const allNations = await base44.entities.Nation.list("-gdp", 25);
    const candidates = allNations.filter(n =>
      n.id !== myNation?.id &&
      n.owner_email !== myNation?.owner_email &&
      isCooledDown(n.id)
    );
    if (!candidates.length) return;

    // Pick a nation whose personality aligns with the event
    const eventType = classifyEvent(triggerMsg.content || "");
    const personality_matches = candidates.filter(n => {
      const p = getPersonality(n);
      return shouldReact(p, eventType, n.unit_power || 10);
    });

    const pool = personality_matches.length ? personality_matches : candidates;
    const aiNation = pool[Math.floor(Math.random() * Math.min(pool.length, 4))];
    if (!aiNation) return;

    const personality = getPersonality(aiNation);
    const channel = triggerMsg.channel || "global";

    // For allies channel, only allied nations respond
    if (channel === "allies") {
      const triggerAllies = triggerMsg.sender_nation_id ? [triggerMsg.sender_nation_id] : [];
      const isAlly = (aiNation.allies || []).some(a => triggerAllies.includes(a)) ||
                     triggerAllies.includes(aiNation.id);
      if (!isAlly) return;
    }

    const prompt = buildPrompt(aiNation, personality, {
      triggerNation: triggerMsg.sender_nation_name,
      triggerText: triggerMsg.content,
    }, channel);

    await postAIMessage(aiNation, prompt, channel);
    markSpoke(aiNation.id);
  }

  async function maybeInitiateConversation() {
    // Only post to global channel for spontaneous messages
    const allNations = await base44.entities.Nation.list("-gdp", 20);
    const candidates = allNations.filter(n =>
      n.id !== myNation?.id &&
      n.owner_email !== myNation?.owner_email &&
      isCooledDown(n.id)
    );
    if (!candidates.length) return;

    // Pick randomly with some bias toward larger nations
    const aiNation = candidates[Math.floor(Math.random() * Math.min(candidates.length, 6))];
    if (!aiNation) return;

    const personality = getPersonality(aiNation);

    const INITIATOR_TOPICS = [
      "our nation's recent economic growth and trade aspirations",
      "rising military tensions on our borders",
      "our technological advancement and what it means for the world",
      "the need for stronger international alliances",
      "resource scarcity affecting our population",
      "a new trade proposal we wish to discuss with the world",
      "our position on recent geopolitical events",
      "our border disputes and territorial sovereignty",
      "famine and food shortages threatening stability",
      "our nation's industrial expansion program",
    ];

    const topic = INITIATOR_TOPICS[Math.floor(Math.random() * INITIATOR_TOPICS.length)];
    const prompt = buildPrompt(aiNation, personality, {
      triggerText: `Initiate a brief diplomatic statement about: ${topic}`,
    }, "global");

    await postAIMessage(aiNation, prompt, "global");
    markSpoke(aiNation.id);
  }

  async function postAIMessage(aiNation, prompt, channel) {
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
      const content = raw.trim().replace(/^["']|["']$/g, "").slice(0, 250);
      if (!content || content.length < 5) return;

      await base44.entities.ChatMessage.create({
        channel,
        sender_nation_id: aiNation.id,
        sender_nation_name: aiNation.name,
        sender_flag: aiNation.flag_emoji || "🏴",
        sender_color: aiNation.flag_color || "#64748b",
        sender_role: "ai", // ← AI nations are labelled "ai" — never impersonate a human player
        content,
      });
    } catch (_) {}
  }

  return null; // Headless — no UI
}