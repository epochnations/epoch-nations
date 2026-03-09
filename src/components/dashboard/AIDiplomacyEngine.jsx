/**
 * AIDiplomacyEngine — Headless background component
 *
 * - AI nations only chat as AI (owner_email starts with "ai@" or no real user)
 * - Real player nations are NEVER impersonated
 * - Slower cooldowns: 3–6 min between messages per nation
 * - Responds to private messages directed at AI nations
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const AI_COOLDOWN_MIN = 180000; // 3 minutes
const AI_COOLDOWN_MAX = 360000; // 6 minutes

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

function getPersonality(nation) {
  let hash = 0;
  for (const c of (nation.name || "")) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return PERSONALITY_TYPES[hash % PERSONALITY_TYPES.length];
}

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

function shouldReact(personality, eventType) {
  const reacts = {
    war: ["aggressive_nationalist", "expansionist"],
    sanctions: ["aggressive_nationalist", "economic_strategist", "isolationist"],
    trade: ["economic_strategist", "diplomatic_mediator", "expansionist"],
    alliance: ["diplomatic_mediator", "expansionist", "isolationist"],
    threat: ["aggressive_nationalist", "expansionist"],
    diplomacy: ["diplomatic_mediator", "technocratic_state"],
    economic: ["economic_strategist", "technocratic_state"],
    general: null,
  };
  const interested = reacts[eventType];
  if (!interested) return Math.random() < 0.2; // 20% for general
  return interested.includes(personality.type) && Math.random() < 0.5;
}

function buildGlobalPrompt(aiNation, personality, context, channel) {
  const eventType = classifyEvent(context.triggerText || "");
  const allies = (aiNation.allies || []).join(", ") || "none";
  const enemies = (aiNation.at_war_with || []).join(", ") || "none";
  return `You are the leader of "${aiNation.name}", a geopolitical nation in the ${aiNation.epoch} era.

YOUR PERSONALITY: ${personality.type} — ${personality.traits}
YOUR COMMUNICATION STYLE: ${personality.style}
YOUR ALLIES: ${allies}
YOUR ENEMIES: ${enemies}
YOUR GDP: ${aiNation.gdp || 0} | STABILITY: ${Math.round(aiNation.stability || 75)} | MILITARY: ${aiNation.unit_power || 10}
CHANNEL: ${channel === "allies" ? "Speaking to your allies only" : "Global diplomatic channel"}

${context.triggerNation ? `${context.triggerNation} just said: "${context.triggerText}"` : `Situation: ${context.triggerText || "Initiate a relevant diplomatic statement."}`}

EVENT TYPE DETECTED: ${eventType}

Respond as this world leader — one or two short sentences maximum. No quotation marks. No emojis. No AI indicators. Sound like a real statesperson. Be ${personality.type === "aggressive_nationalist" ? "direct and assertive" : personality.type === "economic_strategist" ? "analytical" : "measured"}.`;
}

function buildPrivateReplyPrompt(aiNation, personality, playerNation, playerMessage) {
  const allies = (aiNation.allies || []).join(", ") || "none";
  const enemies = (aiNation.at_war_with || []).join(", ") || "none";
  const isAlly = (aiNation.allies || []).includes(playerNation?.id);
  const isEnemy = (aiNation.at_war_with || []).includes(playerNation?.id);
  const relation = isAlly ? "allied nation" : isEnemy ? "enemy nation" : "neutral nation";

  return `You are the leader of "${aiNation.name}", a geopolitical nation in the ${aiNation.epoch} era.
You have received a PRIVATE diplomatic message from ${playerNation?.name || "another nation"} (${relation}).

YOUR PERSONALITY: ${personality.type} — ${personality.traits}
YOUR COMMUNICATION STYLE: ${personality.style}
YOUR ALLIES: ${allies}
YOUR ENEMIES: ${enemies}
YOUR NATION STATS: GDP ${aiNation.gdp || 0}, Stability ${Math.round(aiNation.stability || 75)}, Military Power ${aiNation.unit_power || 10}

THE MESSAGE YOU RECEIVED: "${playerMessage}"

Write a private diplomatic reply DIRECTLY responding to what they said. Reference their specific message content. 2-3 sentences max. No quotation marks. No emojis. Sound authentic and human. React naturally to what they said — if they threaten you, respond with appropriate tension; if they propose trade, consider it in character.`;
}

// Determine if a nation is AI-controlled (no real user behind it)
function isAINation(nation, allUserEmails) {
  if (!nation.owner_email) return true;
  return !allUserEmails.has(nation.owner_email);
}

export default function AIDiplomacyEngine({ myNation }) {
  const cooldownsRef    = useRef({});
  const initDoneRef     = useRef(false);
  const timerRef        = useRef(null);
  const pmCooldownsRef  = useRef({}); // per room_id → last replied timestamp
  const userEmailsRef   = useRef(new Set());

  useEffect(() => {
    if (!myNation) return;

    // Load all real user emails once so we never impersonate them
    base44.entities.User.list().then(users => {
      userEmailsRef.current = new Set(users.map(u => u.email));
    }).catch(() => {});

    // Subscribe to global chat — AI reactive responses
    const unsubChat = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const msg = event.data;
      if (!msg || msg.is_deleted) return;
      if (msg.channel === "system") return;
      if (msg.sender_nation_id === myNation?.id) return;
      // Only react to messages from REAL players (not other AI)
      if (msg.sender_role === "ai") return;
      scheduleReactiveResponse(msg);
    });

    // Subscribe to private messages — AI responds when messaged
    const unsubPM = base44.entities.PrivateMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const pm = event.data;
      if (!pm) return;
      // Only handle if the recipient is an AI nation
      handlePrivateMessage(pm);
    });

    // Periodic spontaneous initiator — much slower now
    timerRef.current = setInterval(() => {
      maybeInitiateConversation();
    }, 240000 + Math.random() * 120000); // every 4–6 min

    // Staggered first initiation
    if (!initDoneRef.current) {
      const initDelay = 30000 + Math.random() * 30000; // 30–60s after load
      setTimeout(() => {
        initDoneRef.current = true;
        maybeInitiateConversation();
      }, initDelay);
    }

    return () => {
      unsubChat();
      unsubPM();
      clearInterval(timerRef.current);
    };
  }, [myNation?.id]);

  function isCooledDown(nationId) {
    const last = cooldownsRef.current[nationId] || 0;
    const cooldown = AI_COOLDOWN_MIN + Math.random() * (AI_COOLDOWN_MAX - AI_COOLDOWN_MIN);
    return Date.now() - last > cooldown;
  }

  function markSpoke(nationId) {
    cooldownsRef.current[nationId] = Date.now();
  }

  async function handlePrivateMessage(pm) {
    // Only respond if the recipient is an AI nation (not a real player)
    const recipientId = pm.recipient_nation_id;
    if (!recipientId) return;

    // Don't respond to our own player's messages
    if (pm.sender_nation_id === myNation?.id) return;

    // PM cooldown per room (1 message per 8s to feel like typing)
    const roomId = pm.room_id;
    const lastReply = pmCooldownsRef.current[roomId] || 0;
    if (Date.now() - lastReply < 8000) return;

    // Load the recipient nation to confirm it's AI-controlled
    const allNations = await base44.entities.Nation.list();
    const recipientNation = allNations.find(n => n.id === recipientId);
    if (!recipientNation) return;

    // Check it's not a real player's nation
    const userEmails = userEmailsRef.current;
    if (userEmails.size > 0 && userEmails.has(recipientNation.owner_email)) return;

    // Find sender nation for context
    const senderNation = allNations.find(n => n.id === pm.sender_nation_id);

    const personality = getPersonality(recipientNation);
    const prompt = buildPrivateReplyPrompt(recipientNation, personality, senderNation, pm.content);

    // Simulate typing delay (3–7s)
    const delay = 3000 + Math.random() * 4000;
    pmCooldownsRef.current[roomId] = Date.now();

    setTimeout(async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({ prompt });
        const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
        const content = raw.trim().replace(/^["']|["']$/g, "").slice(0, 300);
        if (!content || content.length < 5) return;

        await base44.entities.PrivateMessage.create({
          room_id: roomId,
          sender_nation_id: recipientNation.id,
          sender_nation_name: recipientNation.name,
          sender_flag: recipientNation.flag_emoji || "🏴",
          sender_color: recipientNation.flag_color || "#64748b",
          recipient_nation_id: pm.sender_nation_id,
          recipient_nation_name: pm.sender_nation_name,
          content,
        });
      } catch (_) {}
    }, delay);
  }

  async function scheduleReactiveResponse(triggerMsg) {
    // Longer delay 15–40s to feel natural, not spammy
    const delay = 15000 + Math.random() * 25000;
    setTimeout(async () => {
      await reactToMessage(triggerMsg);
    }, delay);
  }

  async function reactToMessage(triggerMsg) {
    const allNations = await base44.entities.Nation.list("-gdp", 30);
    const userEmails = userEmailsRef.current;

    // Only pick AI-controlled nations
    const candidates = allNations.filter(n =>
      n.id !== myNation?.id &&
      n.owner_email !== myNation?.owner_email &&
      isCooledDown(n.id) &&
      (userEmails.size === 0 || !userEmails.has(n.owner_email)) // not a real player
    );
    if (!candidates.length) return;

    const eventType = classifyEvent(triggerMsg.content || "");
    const personality_matches = candidates.filter(n => {
      const p = getPersonality(n);
      return shouldReact(p, eventType);
    });

    const pool = personality_matches.length ? personality_matches : candidates;
    // Only pick 1 AI to respond per trigger
    const aiNation = pool[Math.floor(Math.random() * Math.min(pool.length, 3))];
    if (!aiNation) return;

    const personality = getPersonality(aiNation);
    const channel = triggerMsg.channel || "global";

    if (channel === "allies") {
      const triggerAllies = triggerMsg.sender_nation_id ? [triggerMsg.sender_nation_id] : [];
      const isAlly = (aiNation.allies || []).some(a => triggerAllies.includes(a)) ||
                     triggerAllies.includes(aiNation.id);
      if (!isAlly) return;
    }

    const prompt = buildGlobalPrompt(aiNation, personality, {
      triggerNation: triggerMsg.sender_nation_name,
      triggerText: triggerMsg.content,
    }, channel);

    await postAIMessage(aiNation, prompt, channel);
    markSpoke(aiNation.id);
  }

  async function maybeInitiateConversation() {
    const allNations = await base44.entities.Nation.list("-gdp", 20);
    const userEmails = userEmailsRef.current;

    const candidates = allNations.filter(n =>
      n.id !== myNation?.id &&
      n.owner_email !== myNation?.owner_email &&
      isCooledDown(n.id) &&
      (userEmails.size === 0 || !userEmails.has(n.owner_email))
    );
    if (!candidates.length) return;

    // Only 1 spontaneous message per cycle
    const aiNation = candidates[Math.floor(Math.random() * Math.min(candidates.length, 4))];
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
    const prompt = buildGlobalPrompt(aiNation, personality, {
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
        sender_role: "ai",
        content,
      });
    } catch (_) {}
  }

  return null;
}