/**
 * WorldEventBroadcaster — Headless
 *
 * Watches NewsEvents, Transactions (GlobalLedger), and Nation changes.
 * Auto-posts styled system announcements and triggers AI diplomatic reactions.
 * Manages tension reactions from emoji voting.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Tension delta from emoji reactions
const TENSION_EMOJI_DELTA = {
  "⚔️":  +3,
  "🔥":  +1.5,
  "💥":  +2,
  "🤝":  -2,
  "❤️":  -1,
  "💰":  -0.5,
  "👎":  +0.5,
  "👍":  -0.5,
};

// News agency bots — post as "player" role for immersion
const NEWS_AGENCIES = [
  { name: "Global Chronicle",    flag: "📰", color: "#f8fafc" },
  { name: "World Press",         flag: "🗞️", color: "#e2e8f0" },
  { name: "Economic Observer",   flag: "📊", color: "#fbbf24" },
  { name: "Defence Intelligence",flag: "🛡️", color: "#f87171" },
  { name: "Trade Gazette",       flag: "🏦", color: "#4ade80" },
];

function pickAgency(bias) {
  if (bias === "military")  return NEWS_AGENCIES[3];
  if (bias === "trade")     return NEWS_AGENCIES[4];
  if (bias === "economy")   return NEWS_AGENCIES[2];
  return NEWS_AGENCIES[Math.floor(Math.random() * 3)];
}

function classifyEvent(text = "") {
  const t = text.toLowerCase();
  if (/war|attack|invad|militar|troops/.test(t)) return "war";
  if (/trade|market|price|oil|resource|export|import/.test(t)) return "trade";
  if (/economy|gdp|crash|inflat|recession/.test(t)) return "economy";
  if (/tech|research|science|digital/.test(t)) return "tech";
  if (/disaster|famine|earthquake|flood/.test(t)) return "disaster";
  return "general";
}

function buildNewsPrompt(agency, headline, body, eventType) {
  return `You are a journalist writing for "${agency.name}", a neutral global news organization in a geopolitical world simulation.

HEADLINE: "${headline}"
SUMMARY: "${body || ""}"
EVENT TYPE: ${eventType}

Write one short news-wire sentence (max 130 chars) as this news agency would report it. Neutral, factual, journalistic tone. No emojis. No quotation marks around the sentence.`;
}

function buildAIReactionPrompt(aiNation, headline, eventType) {
  return `You are the leader of "${aiNation.name}" in the ${aiNation.epoch} era.

A breaking news event just occurred: "${headline}" (type: ${eventType}).

Respond in ONE terse sentence as a world leader commenting on this event. Max 100 characters. No emojis. No quotes.`;
}

// Detect if a message looks like propaganda
function isPropaganda(content = "") {
  const t = content.toLowerCase();
  return (
    (/collaps|bankrupt|defeated|humiliat|crush|destroy|annihilat/.test(t) && /economy|military|nation/.test(t)) ||
    /fake news|propaganda|lies|false report/.test(t)
  );
}

export default function WorldEventBroadcaster({ myNation }) {
  const seenEventsRef       = useRef(new Set());
  const seenTransactionsRef = useRef(new Set());
  const tensionRef          = useRef(50); // 0–100 internal tracker
  const lastDebateRef       = useRef(0);
  const lastIntelRef        = useRef(0);
  const userEmailsRef       = useRef(new Set());

  useEffect(() => {
    if (!myNation) return;

    // Load real user emails so we never post as their nations
    base44.entities.User.list().then(users => {
      userEmailsRef.current = new Set(users.map(u => u.email));
    }).catch(() => {});

    // Subscribe to new NewsEvents → broadcast major ones
    const unsubNews = base44.entities.NewsEvent.subscribe((event) => {
      if (event.type !== "create") return;
      const ev = event.data;
      if (!ev || seenEventsRef.current.has(ev.id)) return;
      seenEventsRef.current.add(ev.id);

      const isMajor = ev.severity === "critical" || ev.is_disaster || ev.category === "military" || ev.category === "international";
      if (isMajor) {
        setTimeout(() => broadcastNewsEvent(ev), 2000 + Math.random() * 4000);
      }
    });

    // Subscribe to Transactions → broadcast notable market moves
    const unsubTx = base44.entities.Transaction.subscribe((event) => {
      if (event.type !== "create") return;
      const tx = event.data;
      if (!tx || seenTransactionsRef.current.has(tx.id)) return;
      seenTransactionsRef.current.add(tx.id);
      if (tx.type === "war_attack" || tx.type === "market_crash") {
        setTimeout(() => broadcastTransaction(tx), 3000 + Math.random() * 5000);
      }
    });

    // Subscribe to chat reactions → tension system
    const unsubChat = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "update") return;
      const msg = event.data;
      if (!msg?.reactions) return;
      applyTensionFromReactions(msg.reactions);

      // Propaganda detection — AI nations may challenge it
      if (msg.sender_role === "player" && isPropaganda(msg.content)) {
        setTimeout(() => challengePropaganda(msg), 8000 + Math.random() * 12000);
      }
    });

    // Periodic world debate trigger
    const debateTimer = setInterval(() => {
      if (tensionRef.current > 65 && Date.now() - lastDebateRef.current > 300000) {
        triggerWorldDebate();
      }
    }, 60000);

    // Occasional intelligence intercept
    const intelTimer = setInterval(() => {
      if (Math.random() < 0.15 && Date.now() - lastIntelRef.current > 180000) {
        triggerIntelIntercept();
      }
    }, 90000);

    return () => {
      unsubNews();
      unsubTx();
      unsubChat();
      clearInterval(debateTimer);
      clearInterval(intelTimer);
    };
  }, [myNation?.id]);

  // ── Broadcast a news event as a system + agency message ──────────────────
  async function broadcastNewsEvent(ev) {
    const eventType = classifyEvent(ev.headline + " " + (ev.body || ""));
    const isWar = eventType === "war" || ev.category === "military";
    const isMarket = eventType === "trade" || eventType === "economy";

    // 1. System announcement
    const prefix = isWar ? "🚨 BREAKING NEWS" : isMarket ? "📈 GLOBAL MARKETS" : "📢 WORLD UPDATE";
    const sysContent = `${prefix}\n${ev.headline}`;
    await base44.entities.ChatMessage.create({
      channel: "system",
      sender_nation_name: "WORLD SYSTEM",
      sender_flag: "🌐",
      sender_color: "#a78bfa",
      sender_role: "system",
      content: sysContent,
    });

    // 2. News agency follow-up (as player role)
    const agency = pickAgency(isWar ? "military" : isMarket ? "trade" : null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildNewsPrompt(agency, ev.headline, ev.body, eventType),
      });
      const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
      const content = raw.trim().replace(/^["']|["']$/g, "").slice(0, 160);
      if (content.length > 5) {
        await base44.entities.ChatMessage.create({
          channel: "global",
          sender_nation_name: agency.name,
          sender_flag: agency.flag,
          sender_color: agency.color,
          sender_role: "ai",
          content,
        });
      }
    } catch (_) {}

    // 3. One AI nation reaction (with delay)
    setTimeout(() => triggerAIEventReaction(ev.headline, eventType), 6000 + Math.random() * 10000);

    // Update internal tension for war/crisis events
    if (isWar) tensionRef.current = Math.min(100, tensionRef.current + 8);
    if (ev.is_disaster) tensionRef.current = Math.min(100, tensionRef.current + 5);
  }

  // ── Broadcast a major transaction ─────────────────────────────────────────
  async function broadcastTransaction(tx) {
    let content = "";
    if (tx.type === "war_attack") {
      content = `⚔️ MILITARY ACTION\n${tx.from_nation_name} has launched an attack against ${tx.to_nation_name}.`;
      tensionRef.current = Math.min(100, tensionRef.current + 12);
    } else if (tx.type === "market_crash") {
      content = `📉 MARKET CRASH\n${tx.from_nation_name} is experiencing a severe market collapse.`;
      tensionRef.current = Math.min(100, tensionRef.current + 5);
    }
    if (!content) return;

    await base44.entities.ChatMessage.create({
      channel: "system",
      sender_nation_name: "WORLD SYSTEM",
      sender_flag: "🌐",
      sender_color: "#a78bfa",
      sender_role: "system",
      content,
    });

    setTimeout(() => triggerAIEventReaction(content, tx.type === "war_attack" ? "war" : "economy"), 5000 + Math.random() * 8000);
  }

  // ── Let one AI nation react to a headline ─────────────────────────────────
  async function triggerAIEventReaction(headline, eventType) {
    const allNations = await base44.entities.Nation.list("-gdp", 20);
    const userEmails = userEmailsRef.current;
    const candidates = allNations.filter(n =>
      n.id !== myNation?.id &&
      n.owner_email !== myNation?.owner_email &&
      (userEmails.size === 0 || !userEmails.has(n.owner_email)) // only AI nations
    );
    if (!candidates.length) return;

    // Pick 1–2 reactors
    const count = Math.random() < 0.4 ? 2 : 1;
    const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, count);

    for (let i = 0; i < shuffled.length; i++) {
      const nation = shuffled[i];
      await new Promise(r => setTimeout(r, i * (4000 + Math.random() * 3000)));
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: buildAIReactionPrompt(nation, headline, eventType),
        });
        const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
        const content = raw.trim().replace(/^["']|["']$/g, "").slice(0, 140);
        if (content.length > 5) {
          await base44.entities.ChatMessage.create({
            channel: "global",
            sender_nation_id: nation.id,
            sender_nation_name: nation.name,
            sender_flag: nation.flag_emoji || "🏴",
            sender_color: nation.flag_color || "#64748b",
            sender_role: "ai",
            content,
          });
        }
      } catch (_) {}
    }
  }

  // ── Tension system ─────────────────────────────────────────────────────────
  function applyTensionFromReactions(reactions) {
    let delta = 0;
    for (const [emoji, count] of Object.entries(reactions)) {
      if (TENSION_EMOJI_DELTA[emoji] && count > 0) {
        delta += TENSION_EMOJI_DELTA[emoji] * 0.5; // partial weight per reaction
      }
    }
    tensionRef.current = Math.max(0, Math.min(100, tensionRef.current + delta));
  }

  // ── World Debate: triggers when tension > 65 ───────────────────────────────
  async function triggerWorldDebate() {
    lastDebateRef.current = Date.now();

    const topics = [
      "military escalation and the threat of global war",
      "economic sanctions threatening international trade",
      "a disputed territorial claim between major powers",
      "resource shortages driving conflict between nations",
      "a proposed international peace treaty",
      "nuclear deterrence and arms control",
      "a global famine requiring coordinated response",
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    // System opens the debate
    await base44.entities.ChatMessage.create({
      channel: "system",
      sender_nation_name: "WORLD SYSTEM",
      sender_flag: "🌐",
      sender_color: "#a78bfa",
      sender_role: "system",
      content: `🏛️ EMERGENCY WORLD ASSEMBLY\n\nThe international community is called to address: ${topic}.\n\nAll nations are invited to state their position.`,
    });

    // 2–4 AI nations respond over the next 30s
    const allNations = await base44.entities.Nation.list("-gdp", 15);
    const userEmails = userEmailsRef.current;
    const candidates = allNations
      .filter(n => n.id !== myNation?.id && n.owner_email !== myNation?.owner_email && (userEmails.size === 0 || !userEmails.has(n.owner_email)))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 2));

    for (let i = 0; i < candidates.length; i++) {
      const nation = candidates[i];
      await new Promise(r => setTimeout(r, 6000 + i * (7000 + Math.random() * 4000)));
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are the leader of "${nation.name}" in the ${nation.epoch} era. In an international assembly, the topic is: "${topic}". State your nation's position in one firm sentence. Max 120 chars. No emojis. No quotes.`,
        });
        const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
        const content = raw.trim().replace(/^["']|["']$/g, "").slice(0, 140);
        if (content.length > 5) {
          await base44.entities.ChatMessage.create({
            channel: "global",
            sender_nation_id: nation.id,
            sender_nation_name: nation.name,
            sender_flag: nation.flag_emoji || "🏴",
            sender_color: nation.flag_color || "#64748b",
            sender_role: "ai",
            content,
          });
        }
      } catch (_) {}
    }

    // Reduce tension after debate
    tensionRef.current = Math.max(20, tensionRef.current - 15);
  }

  // ── Intelligence Intercept ──────────────────────────────────────────────────
  async function triggerIntelIntercept() {
    lastIntelRef.current = Date.now();

    const allNations = await base44.entities.Nation.list("-gdp", 20);
    const others = allNations.filter(n => n.id !== myNation?.id && n.owner_email !== myNation?.owner_email);
    if (others.length < 2) return;

    const [nation1, nation2] = others.sort(() => Math.random() - 0.5).slice(0, 2);
    const INTERCEPTS = [
      `Mobilization begins at dawn. Await orders.`,
      `Transfer the reserves to the secure account before inspection.`,
      `The alliance holds. Strike when the time is right.`,
      `Our spies confirm their defenses are undermanned.`,
      `Delay negotiations — we need more time to rearm.`,
      `Economic collapse imminent. Prepare for unrest.`,
      `Do not trust the trade agreement — it is a trap.`,
    ];
    const intercepted = INTERCEPTS[Math.floor(Math.random() * INTERCEPTS.length)];

    await base44.entities.ChatMessage.create({
      channel: "system",
      sender_nation_name: "WORLD SYSTEM",
      sender_flag: "🌐",
      sender_color: "#a78bfa",
      sender_role: "system",
      content: `🔍 INTELLIGENCE INTERCEPT\n\nClassified communiqué intercepted between ${nation1.name} and ${nation2.name}:\n\n"${intercepted}"`,
    });
  }

  // ── Propaganda challenge ───────────────────────────────────────────────────
  async function challengePropaganda(msg) {
    const allNations = await base44.entities.Nation.list("-gdp", 15);
    const userEmails = userEmailsRef.current;
    const challenger = allNations
      .filter(n => n.id !== myNation?.id && n.id !== msg.sender_nation_id && n.owner_email !== myNation?.owner_email && (userEmails.size === 0 || !userEmails.has(n.owner_email)))
      .sort(() => Math.random() - 0.5)[0];
    if (!challenger) return;

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the leader of "${challenger.name}". Another nation posted what appears to be propaganda: "${msg.content.slice(0, 100)}". Publicly challenge or refute this claim in one direct sentence. Max 110 chars. No emojis. No quotes.`,
      });
      const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
      const content = raw.trim().replace(/^["']|["']$/g, "").slice(0, 130);
      if (content.length > 5) {
        await base44.entities.ChatMessage.create({
          channel: "global",
          sender_nation_id: challenger.id,
          sender_nation_name: challenger.name,
          sender_flag: challenger.flag_emoji || "🏴",
          sender_color: challenger.flag_color || "#64748b",
          sender_role: "ai",
          content,
          reply_to_id: msg.id,
          reply_to_name: msg.sender_nation_name,
        });
      }
    } catch (_) {}
  }

  return null;
}