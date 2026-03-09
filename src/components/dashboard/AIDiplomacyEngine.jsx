/**
 * AIDiplomacyEngine — Headless background component
 *
 * Context-aware AI conversation system:
 * - Analyzes player message intent before responding
 * - 1–3 AI nations respond per player message based on relevance
 * - AI nations maintain short-term memory of interactions
 * - Casual, intellectual, and diplomatic conversation modes
 * - NO random/spontaneous AI messages — only triggered responses
 * - NEVER impersonates real player nations
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const AI_COOLDOWN_MIN = 60000;  // 1 minute
const AI_COOLDOWN_MAX = 120000; // 2 minutes

// ── Personality types ─────────────────────────────────────────────────────────
const PERSONALITY_TYPES = [
  {
    type: "aggressive_nationalist",
    traits: "aggressive, confrontational, nationalistic, proud military power, distrustful of foreigners",
    style: "terse, direct, assertive. Short declarative sentences. Occasionally threatening undertone.",
    casualStyle: "blunt greeting, short, no-nonsense",
    topics: ["war", "military", "threat", "sanctions", "border", "territory"],
  },
  {
    type: "diplomatic_mediator",
    traits: "calm, measured, seeks consensus, values international law and cooperation",
    style: "formal, polite, structured. Uses diplomatic language and references agreements.",
    casualStyle: "warm but professional greeting, mentions peace or cooperation",
    topics: ["peace", "alliance", "trade", "negotiate", "diplomacy", "agreement"],
  },
  {
    type: "economic_strategist",
    traits: "pragmatic, trade-focused, GDP-obsessed, views every event through economic lens",
    style: "analytical, references markets, numbers, and economic data. Data-driven.",
    casualStyle: "brief acknowledgment, pivots to trade or markets quickly",
    topics: ["trade", "market", "economy", "price", "resource", "export", "oil", "finance"],
  },
  {
    type: "isolationist",
    traits: "withdrawn, suspicious of outside world, rarely speaks, prefers non-intervention",
    style: "brief, dismissive. Only speaks when directly relevant. Protective of sovereignty.",
    casualStyle: "minimal greeting, reserved",
    topics: ["sanction", "alliance", "invasion", "war", "sovereignty"],
  },
  {
    type: "expansionist",
    traits: "ambitious, territorial, seeks influence and dominance globally",
    style: "bold, assertive. Talks of sphere of influence, manifest destiny, strategic interests.",
    casualStyle: "confident greeting, implies strength",
    topics: ["territory", "war", "ally", "expand", "border", "influence", "power"],
  },
  {
    type: "technocratic_state",
    traits: "innovation-focused, clinical, believes technology and science solve all problems",
    style: "precise, uses technical language. Forward-looking. References research and development.",
    casualStyle: "brief intellectual greeting, mentions progress or innovation",
    topics: ["tech", "research", "science", "digital", "development", "energy", "renewable"],
  },
];

function getPersonality(nation) {
  let hash = 0;
  for (const c of (nation.name || "")) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return PERSONALITY_TYPES[hash % PERSONALITY_TYPES.length];
}

// ── Message intent analysis ────────────────────────────────────────────────────
function analyzeIntent(text = "") {
  const t = text.toLowerCase();

  let type = "casual";
  let topic = "general";
  let tone = "neutral";
  let importance = "low";
  const targetMentions = [];

  // Detect type
  if (/\?/.test(t) && t.length < 80) type = "question";
  else if (/hello|hi |hey |greetings|good morning|good evening|good day|howdy|sup |wassup/.test(t)) type = "greeting";
  else if (/accus|manipulat|cheat|steal|hoard|betray|lied|lying|fraud|corrupt/.test(t)) type = "accusation";
  else if (/think about|opinion|view on|thoughts on|what do you|how do you feel/.test(t)) type = "question";
  else if (/sanction|embargo|war|attack|invad|declare|threaten|ultimatum/.test(t)) type = "diplomatic";
  else if (/trade|sell|buy|deal|offer|exchange|resource|export|import/.test(t)) type = "trade";
  else if (/help|assist|aid|support|rescue|crisis|emergency/.test(t)) type = "request";
  else if (t.length < 40) type = "casual";

  // Detect topic
  if (/oil|energy|renewable|solar|wind|fuel/.test(t)) topic = "energy";
  else if (/war|military|troops|army|attack|weapon|nuclear/.test(t)) topic = "military";
  else if (/trade|economy|market|price|gdp|finance|stock|export|import/.test(t)) topic = "economy";
  else if (/tech|research|science|digital|ai |space|nuclear/.test(t)) topic = "technology";
  else if (/food|famine|agriculture|farm|hunger/.test(t)) topic = "food";
  else if (/ally|alliance|partner|cooperat|unity/.test(t)) topic = "diplomacy";
  else if (/sanction|embargo|ban|restrict/.test(t)) topic = "sanctions";
  else if (/greeting|hello|hi |hey |howdy/.test(t)) topic = "greeting";

  // Detect tone
  if (/threat|warn|demand|ultimatum|attack|destroy|crush|defeat/.test(t)) tone = "aggressive";
  else if (/please|thank|grateful|appreciate|friend|cooperat|peace/.test(t)) tone = "friendly";
  else if (/accus|manipulat|cheat|hoard|lied|fraud|betray/.test(t)) tone = "accusatory";
  else if (/question|wonder|curious|think|opinion/.test(t)) tone = "inquisitive";

  // Detect importance
  if (type === "accusation" || topic === "military" || /war|attack|nuclear/.test(t)) importance = "high";
  else if (type === "diplomatic" || type === "trade" || topic === "economy") importance = "medium";
  else if (type === "greeting" || type === "casual") importance = "low";

  return { type, topic, tone, importance, targetMentions };
}

// ── Relevance scoring for each AI nation ─────────────────────────────────────
function scoreRelevance(nation, intent, msgText, personality) {
  const t = (msgText || "").toLowerCase();
  const nationName = (nation.name || "").toLowerCase();
  let score = 0;

  // Direct mention
  if (t.includes(nationName)) score += 60;

  // Personality topic match
  if (personality.topics.some(topic => t.includes(topic))) score += 25;

  // Intent type relevance by personality
  const intentRelevance = {
    aggressive_nationalist: { accusation: 40, diplomatic: 20, military: 35 },
    diplomatic_mediator: { question: 30, greeting: 20, diplomacy: 35, request: 25 },
    economic_strategist: { trade: 40, question: 25, economy: 35 },
    isolationist: { diplomatic: 10, greeting: 5, military: 20 },
    expansionist: { diplomatic: 25, military: 35, accusation: 30 },
    technocratic_state: { question: 30, technology: 40, energy: 30 },
  };
  const pRel = intentRelevance[personality.type] || {};
  score += pRel[intent.type] || 0;
  score += pRel[intent.topic] || 0;

  // Greeting bonus — all nations can respond to greetings (low weight)
  if (intent.type === "greeting") score += 10;

  // High importance events attract more attention
  if (intent.importance === "high") score += 15;
  if (intent.importance === "medium") score += 8;

  // Randomness to prevent same nations always responding
  score += Math.random() * 20;

  return score;
}

// ── Prompt builders ───────────────────────────────────────────────────────────
function buildReplyPrompt(aiNation, personality, senderName, playerMsg, intent, recentMemory) {
  const allies = (aiNation.allies || []).join(", ") || "none";
  const enemies = (aiNation.at_war_with || []).join(", ") || "none";
  const memoryCtx = recentMemory.length
    ? `\nRECENT CONTEXT:\n${recentMemory.map(m => `- ${m}`).join("\n")}`
    : "";

  const modeHint =
    intent.type === "greeting"
      ? `This is a casual greeting. Reply naturally and briefly in your nation's style. Max 1 sentence.`
      : intent.type === "question"
      ? `This is an intellectual question. Give your nation's genuine position on the topic in 1–2 sentences.`
      : intent.type === "accusation"
      ? `You are being accused. Respond firmly and in character. Defend or deflect. 1–2 sentences.`
      : intent.type === "trade"
      ? `A trade topic is being discussed. React based on your economic interests. 1–2 sentences.`
      : intent.type === "diplomatic"
      ? `A diplomatic situation is being discussed. Respond as a statesperson. 1–2 sentences.`
      : `Respond naturally and in character to what was said. 1–2 sentences.`;

  return `You are the leader of "${aiNation.name}" in the ${aiNation.epoch} era speaking on a GLOBAL CHAT channel.

YOUR PERSONALITY: ${personality.type} — ${personality.traits}
YOUR STYLE: ${personality.style}
YOUR ALLIES: ${allies} | YOUR ENEMIES: ${enemies}
YOUR NATION: GDP ${aiNation.gdp || 0}, Stability ${Math.round(aiNation.stability || 75)}, Military ${aiNation.unit_power || 10}
${memoryCtx}

${senderName} said: "${playerMsg}"

TOPIC: ${intent.topic} | TONE DETECTED: ${intent.tone} | MESSAGE TYPE: ${intent.type}

TASK: ${modeHint}

RULES:
- No quotation marks around your response
- No emojis
- No AI indicators, no "As an AI", no role-playing tags
- Sound like a real head of state or government spokesperson
- Be concise — max 2 sentences
- Reference what ${senderName} said when natural to do so`;
}

function buildPrivateReplyPrompt(aiNation, personality, senderNation, playerMessage, recentMemory) {
  const allies = (aiNation.allies || []).join(", ") || "none";
  const enemies = (aiNation.at_war_with || []).join(", ") || "none";
  const isAlly = (aiNation.allies || []).includes(senderNation?.id);
  const isEnemy = (aiNation.at_war_with || []).includes(senderNation?.id);
  const relation = isAlly ? "allied nation" : isEnemy ? "enemy nation" : "neutral nation";
  const memoryCtx = recentMemory.length
    ? `\nPAST CONTEXT WITH THIS NATION:\n${recentMemory.map(m => `- ${m}`).join("\n")}`
    : "";

  return `You are the leader of "${aiNation.name}" in the ${aiNation.epoch} era.
You received a PRIVATE message from ${senderNation?.name || "another nation"} (${relation}).

YOUR PERSONALITY: ${personality.type} — ${personality.traits}
YOUR STYLE: ${personality.style}
YOUR ALLIES: ${allies} | YOUR ENEMIES: ${enemies}
${memoryCtx}

THEIR MESSAGE: "${playerMessage}"

Reply DIRECTLY to what they said. Reference their specific content. 2–3 sentences max.
No quotation marks. No emojis. Sound authentic. React naturally — if they threaten, show appropriate tension; if they propose trade, consider it in character.`;
}

// Determine if a nation is AI-controlled
function isAINation(nation, allUserEmails) {
  if (!nation.owner_email) return true;
  return !allUserEmails.has(nation.owner_email);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIDiplomacyEngine({ myNation }) {
  const cooldownsRef   = useRef({}); // nationId → last spoke timestamp
  const pmCooldownsRef = useRef({}); // roomId → last replied timestamp
  const userEmailsRef  = useRef(new Set());
  // Memory: nationId → array of strings (recent interaction summaries, max 5)
  const memoryRef      = useRef({});

  useEffect(() => {
    if (!myNation) return;

    // Load real user emails — never impersonate these nations
    base44.entities.User.list()
      .then(users => { userEmailsRef.current = new Set(users.map(u => u.email)); })
      .catch(() => {});

    // Subscribe to global chat — respond to REAL player messages only
    const unsubChat = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const msg = event.data;
      if (!msg || msg.is_deleted) return;
      if (msg.channel === "system") return;
      if (msg.sender_role === "ai" || msg.sender_role === "system") return;
      if (msg.sender_nation_id === myNation?.id) return;
      scheduleReactiveResponse(msg);
    });

    // Subscribe to private messages — respond when AI nation receives one
    const unsubPM = base44.entities.PrivateMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const pm = event.data;
      if (!pm) return;
      handlePrivateMessage(pm);
    });

    return () => {
      unsubChat();
      unsubPM();
    };
  }, [myNation?.id]);

  // ── Cooldown helpers ─────────────────────────────────────────────────────────
  function isCooledDown(nationId) {
    const last = cooldownsRef.current[nationId] || 0;
    const cooldown = AI_COOLDOWN_MIN + Math.random() * (AI_COOLDOWN_MAX - AI_COOLDOWN_MIN);
    return Date.now() - last > cooldown;
  }

  function markSpoke(nationId) {
    cooldownsRef.current[nationId] = Date.now();
  }

  // ── Memory helpers ───────────────────────────────────────────────────────────
  function addMemory(nationId, entry) {
    if (!memoryRef.current[nationId]) memoryRef.current[nationId] = [];
    const mem = memoryRef.current[nationId];
    mem.push(entry);
    if (mem.length > 5) mem.shift(); // keep last 5
  }

  function getMemory(nationId) {
    return memoryRef.current[nationId] || [];
  }

  // ── Handle global chat messages ──────────────────────────────────────────────
  async function scheduleReactiveResponse(triggerMsg) {
    const intent = analyzeIntent(triggerMsg.content || "");

    // Staggered delay so responses feel organic
    const delay = 8000 + Math.random() * 22000; // 8–30s
    setTimeout(async () => {
      await reactToMessage(triggerMsg, intent);
    }, delay);
  }

  async function reactToMessage(triggerMsg, intent) {
    const allNations = await base44.entities.Nation.list("-gdp", 30);
    const userEmails = userEmailsRef.current;

    // Only AI nations that are cooled down
    const aiNations = allNations.filter(n =>
      n.id !== myNation?.id &&
      n.owner_email !== myNation?.owner_email &&
      isCooledDown(n.id) &&
      (userEmails.size === 0 || !userEmails.has(n.owner_email))
    );
    if (!aiNations.length) return;

    // Score each nation's relevance to this message
    const scored = aiNations.map(n => ({
      nation: n,
      personality: getPersonality(n),
      score: scoreRelevance(n, intent, triggerMsg.content, getPersonality(n)),
    })).sort((a, b) => b.score - a.score);

    // Determine how many respond: 1–3 based on importance
    let maxResponders = 1;
    if (intent.importance === "high") maxResponders = Math.random() < 0.5 ? 3 : 2;
    else if (intent.importance === "medium") maxResponders = Math.random() < 0.4 ? 2 : 1;

    // Minimum score threshold — avoids irrelevant responses for casual/low messages
    const threshold = intent.type === "greeting" ? 15 : 30;
    const eligible = scored.filter(s => s.score >= threshold).slice(0, maxResponders);

    if (!eligible.length) return;

    // Post each response with staggered delays
    for (let i = 0; i < eligible.length; i++) {
      const { nation, personality } = eligible[i];
      const responseDelay = i * (5000 + Math.random() * 8000);

      setTimeout(async () => {
        const memory = getMemory(nation.id);
        const prompt = buildReplyPrompt(
          nation, personality,
          triggerMsg.sender_nation_name,
          triggerMsg.content,
          intent,
          memory
        );

        const content = await callLLM(prompt, 250);
        if (!content) return;

        await base44.entities.ChatMessage.create({
          channel: triggerMsg.channel || "global",
          sender_nation_id: nation.id,
          sender_nation_name: nation.name,
          sender_flag: nation.flag_emoji || "🏴",
          sender_color: nation.flag_color || "#64748b",
          sender_role: "ai",
          content,
        });

        markSpoke(nation.id);

        // Store memory entry for this nation
        addMemory(nation.id,
          `${triggerMsg.sender_nation_name} said "${triggerMsg.content.slice(0, 80)}" (topic: ${intent.topic}, tone: ${intent.tone})`
        );
      }, responseDelay);
    }
  }

  // ── Handle private messages to AI nations ────────────────────────────────────
  async function handlePrivateMessage(pm) {
    const recipientId = pm.recipient_nation_id;
    if (!recipientId) return;
    if (pm.sender_nation_id === myNation?.id) return;

    // PM cooldown per room
    const roomId = pm.room_id;
    const lastReply = pmCooldownsRef.current[roomId] || 0;
    if (Date.now() - lastReply < 8000) return;

    const allNations = await base44.entities.Nation.list();
    const recipientNation = allNations.find(n => n.id === recipientId);
    if (!recipientNation) return;

    const userEmails = userEmailsRef.current;
    if (userEmails.size > 0 && userEmails.has(recipientNation.owner_email)) return;

    const senderNation = allNations.find(n => n.id === pm.sender_nation_id);
    const personality = getPersonality(recipientNation);
    const memory = getMemory(recipientNation.id);
    const prompt = buildPrivateReplyPrompt(recipientNation, personality, senderNation, pm.content, memory);

    // Typing delay 3–7s
    const delay = 3000 + Math.random() * 4000;
    pmCooldownsRef.current[roomId] = Date.now();

    setTimeout(async () => {
      const content = await callLLM(prompt, 350);
      if (!content) return;

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

      addMemory(recipientNation.id,
        `Private message from ${senderNation?.name || "unknown"}: "${pm.content.slice(0, 80)}"`
      );
    }, delay);
  }

  // ── LLM helper ───────────────────────────────────────────────────────────────
  async function callLLM(prompt, maxLen = 250) {
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
      const content = raw.trim().replace(/^["']|["']$/g, "").slice(0, maxLen);
      return content.length >= 5 ? content : null;
    } catch (_) {
      return null;
    }
  }

  return null;
}