/**
 * AIDiplomacyEngine — Headless background component
 *
 * - AI leaders respond ONLY when triggered by player messages or world events
 * - Each AI nation has a named leader (Title FirstName LastName) that appears in chat
 * - Diplomatic memory persists per session; relationship tracking adapts tone
 * - NEVER impersonates real player nations
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const AI_COOLDOWN_MIN = 60000;  // 1 minute
const AI_COOLDOWN_MAX = 120000; // 2 minutes

// ── Leader title pools ────────────────────────────────────────────────────────
const LEADER_TITLES = ["Chancellor", "President", "Prime Minister", "Emperor", "Sultan", "Chairman", "Premier", "Director-General", "Warlord", "Consul"];
const LEADER_FIRST  = ["Arman","Erika","Elise","Viktor","Soren","Yuna","Marcus","Irina","Dayo","Leila","Otto","Zara","Kai","Priya","Dmitri","Amara","Raj","Nora","Felix","Hana"];
const LEADER_LAST   = ["Petrov","Vogel","Laurent","Stahl","Osei","Tanaka","Reyes","Novak","Adeyemi","Kimura","Weiss","Torres","Mendez","Nakamura","Ivanova","Diallo","Singh","Fischer","Yamamoto","Okonkwo"];

/** Deterministic leader for a nation — same result every call */
function getLeader(nation) {
  let h = 0;
  for (const c of (nation.name || "X")) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  const title = LEADER_TITLES[h         % LEADER_TITLES.length];
  const first = LEADER_FIRST [(h >> 4)  % LEADER_FIRST.length];
  const last  = LEADER_LAST  [(h >> 8)  % LEADER_LAST.length];
  return { title, first, last, fullName: `${first} ${last}`, display: `${title} ${first} ${last}` };
}

/** The sender_nation_name shown in chat: "Chancellor Erika Vogel – Germany" */
function leaderDisplayName(nation) {
  const l = getLeader(nation);
  return `${l.display} – ${nation.name}`;
}

// ── Personality types ─────────────────────────────────────────────────────────
const PERSONALITY_TYPES = [
  {
    type: "aggressive_nationalist",
    traits: "aggressive, confrontational, nationalistic, proud military power, distrustful of foreigners",
    style: "terse, direct, assertive. Short declarative sentences. Occasionally threatening undertone.",
    topics: ["war","military","threat","sanctions","border","territory"],
  },
  {
    type: "diplomatic_mediator",
    traits: "calm, measured, seeks consensus, values international law and cooperation",
    style: "formal, polite, structured. Uses diplomatic language.",
    topics: ["peace","alliance","trade","negotiate","diplomacy","agreement"],
  },
  {
    type: "economic_strategist",
    traits: "pragmatic, trade-focused, GDP-obsessed, views everything through an economic lens",
    style: "analytical, references markets and figures. Data-driven.",
    topics: ["trade","market","economy","price","resource","export","oil","finance"],
  },
  {
    type: "isolationist",
    traits: "withdrawn, suspicious of outside world, rarely speaks, non-interventionist",
    style: "brief, dismissive. Only speaks when directly relevant.",
    topics: ["sanction","alliance","invasion","war","sovereignty"],
  },
  {
    type: "expansionist",
    traits: "ambitious, territorial, seeks influence and dominance globally",
    style: "bold, assertive. Talks of sphere of influence and strategic interests.",
    topics: ["territory","war","ally","expand","border","influence","power"],
  },
  {
    type: "technocratic_state",
    traits: "innovation-focused, clinical, believes technology solves all problems",
    style: "precise, technical language. Forward-looking. References R&D.",
    topics: ["tech","research","science","digital","development","energy","renewable"],
  },
];

function getPersonality(nation) {
  let h = 0;
  for (const c of (nation.name || "")) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return PERSONALITY_TYPES[h % PERSONALITY_TYPES.length];
}

// ── Intent analysis ───────────────────────────────────────────────────────────
function analyzeIntent(text = "") {
  const t = text.toLowerCase();
  let type = "casual", topic = "general", tone = "neutral", importance = "low";

  if (/hello|hi |hey |greetings|good morning|good evening|howdy/.test(t)) type = "greeting";
  else if (/accus|manipulat|cheat|steal|hoard|betray|fraud|corrupt/.test(t)) type = "accusation";
  else if (/think about|opinion|view on|thoughts on|what do you|how do you feel/.test(t)) type = "question";
  else if (/\?/.test(t) && t.length < 100) type = "question";
  else if (/sanction|embargo|war|attack|invad|declare|threaten|ultimatum/.test(t)) type = "diplomatic";
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

  if (type === "accusation" || topic === "military") importance = "high";
  else if (type === "diplomatic" || type === "trade" || topic === "economy") importance = "medium";

  return { type, topic, tone, importance };
}

// ── Relevance scoring ─────────────────────────────────────────────────────────
function scoreRelevance(nation, intent, msgText, personality) {
  const t = (msgText || "").toLowerCase();
  let score = 0;
  if (t.includes((nation.name || "").toLowerCase())) score += 60;
  if (personality.topics.some(tp => t.includes(tp))) score += 25;

  const matrix = {
    aggressive_nationalist: { accusation:40, diplomatic:20, military:35 },
    diplomatic_mediator:    { question:30, greeting:20, diplomacy:35, request:25 },
    economic_strategist:    { trade:40, question:25, economy:35 },
    isolationist:           { diplomatic:10, greeting:5, military:20 },
    expansionist:           { diplomatic:25, military:35, accusation:30 },
    technocratic_state:     { question:30, technology:40, energy:30 },
  };
  const rel = matrix[personality.type] || {};
  score += rel[intent.type] || 0;
  score += rel[intent.topic] || 0;
  if (intent.type === "greeting") score += 12;
  if (intent.importance === "high") score += 15;
  else if (intent.importance === "medium") score += 8;
  score += Math.random() * 20; // natural variance
  return score;
}

// ── Memory helpers (localStorage-backed) ─────────────────────────────────────
const MEMORY_KEY  = "ep_ai_memory";
const MEMORY_MAX  = 8;   // entries per nation
const MEMORY_DECAY_MS = 24 * 60 * 60 * 1000; // 1 day — older entries get half weight

function loadMemory() {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}"); } catch { return {}; }
}
function saveMemory(mem) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(mem)); } catch {}
}

function addMemoryEntry(nationId, entry) {
  const mem = loadMemory();
  if (!mem[nationId]) mem[nationId] = [];
  mem[nationId].push({ text: entry, ts: Date.now() });
  if (mem[nationId].length > MEMORY_MAX) mem[nationId].shift();
  saveMemory(mem);
}

/** Returns an array of summary strings, newer entries first, older entries labeled */
function getMemorySummaries(nationId) {
  const mem = loadMemory();
  const entries = (mem[nationId] || []).slice().reverse(); // newest first
  const now = Date.now();
  return entries.map(e => {
    const age = now - (e.ts || now);
    const isOld = age > MEMORY_DECAY_MS;
    return isOld ? `[Earlier] ${e.text}` : e.text;
  }).slice(0, 5); // max 5 in prompt context
}

// ── Relationship tracker (in-memory, session-scoped) ─────────────────────────
const REL_KEY = "ep_ai_relations";

function loadRelations() {
  try { return JSON.parse(localStorage.getItem(REL_KEY) || "{}"); } catch { return {}; }
}
function saveRelations(rel) {
  try { localStorage.setItem(REL_KEY, JSON.stringify(rel)); } catch {}
}

function getRelation(aiNationId, playerNationId) {
  const rel = loadRelations();
  return rel[`${aiNationId}_${playerNationId}`] || { trust: 0.5, hostility: 0.3, respect: 0.5 };
}

function updateRelation(aiNationId, playerNationId, intent) {
  const rel = loadRelations();
  const key = `${aiNationId}_${playerNationId}`;
  const current = rel[key] || { trust: 0.5, hostility: 0.3, respect: 0.5 };

  if (intent.tone === "aggressive" || intent.type === "accusation") {
    current.hostility = Math.min(1, current.hostility + 0.08);
    current.trust = Math.max(0, current.trust - 0.05);
  } else if (intent.tone === "friendly" || intent.type === "request") {
    current.trust = Math.min(1, current.trust + 0.05);
    current.hostility = Math.max(0, current.hostility - 0.03);
  } else if (intent.type === "trade") {
    current.respect = Math.min(1, current.respect + 0.04);
  }
  rel[key] = current;
  saveRelations(rel);
}

function relationshipContext(rel) {
  if (rel.hostility > 0.7) return "This nation has been repeatedly hostile or accusatory toward you. Respond with firm, cold professionalism.";
  if (rel.hostility > 0.5) return "This nation has shown some hostility. Maintain guarded diplomacy.";
  if (rel.trust > 0.75)    return "This nation has shown good faith. You may be slightly warmer in tone.";
  if (rel.trust > 0.6)     return "Relations are cordial. Respond professionally.";
  return "Relations are neutral. Respond professionally.";
}

// ── Prompt builders ───────────────────────────────────────────────────────────
function buildReplyPrompt(aiNation, personality, leader, senderName, playerMsg, intent, memory, relation) {
  const allies   = (aiNation.allies || []).join(", ") || "none";
  const enemies  = (aiNation.at_war_with || []).join(", ") || "none";
  const memCtx   = memory.length ? `\nPAST INTERACTIONS MEMORY:\n${memory.map(m => `- ${m}`).join("\n")}` : "";
  const relCtx   = relationshipContext(relation);

  const modeHint =
    intent.type === "greeting"    ? "Reply naturally and briefly in your nation's style. Max 1 sentence."
    : intent.type === "question"  ? "Give your nation's genuine position on the topic. 1–2 sentences."
    : intent.type === "accusation"? "You are being accused. Respond firmly and in character. Defend or deflect. Reference past accusations if in memory. 1–2 sentences."
    : intent.type === "trade"     ? "React based on your economic interests. 1–2 sentences."
    : intent.type === "diplomatic"? "Respond as a statesperson on this diplomatic matter. 1–2 sentences."
    : "Respond naturally and in character. 1–2 sentences.";

  return `You are ${leader.display}, the leader of "${aiNation.name}" in the ${aiNation.epoch} era, speaking on a GLOBAL DIPLOMATIC CHANNEL.

YOUR PERSONALITY: ${personality.type} — ${personality.traits}
YOUR STYLE: ${personality.style}
YOUR ALLIES: ${allies} | YOUR ENEMIES: ${enemies}
YOUR NATION STATS: GDP ${aiNation.gdp || 0}, Stability ${Math.round(aiNation.stability || 75)}, Military ${aiNation.unit_power || 10}
${memCtx}

RELATIONSHIP WITH ${senderName}: ${relCtx}

${senderName} just said: "${playerMsg}"
TOPIC: ${intent.topic} | TONE: ${intent.tone} | TYPE: ${intent.type}

TASK: ${modeHint}

CRITICAL RULES:
- Write only the spoken response — no labels, no nation name prefix, no quotation marks
- No emojis
- No "As an AI" or roleplay tags
- Sound like a real head of state — concise, politically authentic
- Max 2 sentences
- If memory shows this player has raised this before, briefly reference it`;
}

function buildPrivateReplyPrompt(aiNation, personality, leader, senderNation, playerMessage, memory, relation) {
  const allies   = (aiNation.allies || []).join(", ") || "none";
  const enemies  = (aiNation.at_war_with || []).join(", ") || "none";
  const isAlly   = (aiNation.allies || []).includes(senderNation?.id);
  const isEnemy  = (aiNation.at_war_with || []).includes(senderNation?.id);
  const relLabel = isAlly ? "allied nation" : isEnemy ? "enemy nation" : "neutral nation";
  const memCtx   = memory.length ? `\nPAST CONTEXT:\n${memory.map(m => `- ${m}`).join("\n")}` : "";
  const relCtx   = relationshipContext(relation);

  return `You are ${leader.display}, leader of "${aiNation.name}" in the ${aiNation.epoch} era.
You received a PRIVATE message from ${senderNation?.name || "another nation"} (${relLabel}).

YOUR PERSONALITY: ${personality.type} — ${personality.traits}
YOUR STYLE: ${personality.style}
YOUR ALLIES: ${allies} | YOUR ENEMIES: ${enemies}
RELATIONSHIP: ${relCtx}
${memCtx}

THEIR MESSAGE: "${playerMessage}"

Write a private diplomatic reply DIRECTLY responding to what they said. Reference their content. 2–3 sentences max.
No quotation marks. No emojis. Sound authentic. React naturally to their tone.`;
}

// ── AI check ─────────────────────────────────────────────────────────────────
function isAINation(nation, userEmails) {
  if (!nation.owner_email) return true;
  return !userEmails.has(nation.owner_email);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIDiplomacyEngine({ myNation }) {
  const cooldownsRef   = useRef({});
  const pmCooldownsRef = useRef({});
  const userEmailsRef  = useRef(new Set());

  useEffect(() => {
    if (!myNation) return;

    base44.entities.User.list()
      .then(users => { userEmailsRef.current = new Set(users.map(u => u.email)); })
      .catch(() => {});

    // React to real player messages only
    const unsubChat = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const msg = event.data;
      if (!msg || msg.is_deleted) return;
      if (msg.channel === "system") return;
      if (msg.sender_role === "ai" || msg.sender_role === "system") return;
      if (msg.sender_nation_id === myNation?.id) return;
      scheduleReactiveResponse(msg);
    });

    // Reply when AI nation receives a private message
    const unsubPM = base44.entities.PrivateMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const pm = event.data;
      if (!pm) return;
      handlePrivateMessage(pm);
    });

    return () => { unsubChat(); unsubPM(); };
  }, [myNation?.id]);

  // ── Cooldown helpers ─────────────────────────────────────────────────────────
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
    if (intent.importance === "high")   maxResponders = Math.random() < 0.5 ? 3 : 2;
    else if (intent.importance === "medium") maxResponders = Math.random() < 0.4 ? 2 : 1;

    const threshold = intent.type === "greeting" ? 15 : 28;
    const eligible  = scored.filter(s => s.score >= threshold).slice(0, maxResponders);
    if (!eligible.length) return;

    for (let i = 0; i < eligible.length; i++) {
      const { nation, personality } = eligible[i];
      const responseDelay = i * (5000 + Math.random() * 8000);

      setTimeout(async () => {
        const leader   = getLeader(nation);
        const memory   = getMemorySummaries(nation.id);
        const relation = getRelation(nation.id, triggerMsg.sender_nation_id || "");

        const prompt  = buildReplyPrompt(nation, personality, leader, triggerMsg.sender_nation_name, triggerMsg.content, intent, memory, relation);
        const content = await callLLM(prompt, 280);
        if (!content) return;

        await base44.entities.ChatMessage.create({
          channel:             triggerMsg.channel || "global",
          sender_nation_id:    nation.id,
          sender_nation_name:  leaderDisplayName(nation),
          sender_flag:         nation.flag_emoji || "🏴",
          sender_color:        nation.flag_color || "#64748b",
          sender_role:         "ai",
          content,
        });

        markSpoke(nation.id);

        // Update memory & relationship
        addMemoryEntry(nation.id,
          `${triggerMsg.sender_nation_name} said "${triggerMsg.content.slice(0, 80)}" (${intent.topic}/${intent.tone})`
        );
        updateRelation(nation.id, triggerMsg.sender_nation_id || "", intent);
      }, responseDelay);
    }
  }

  // ── Private message handling ─────────────────────────────────────────────────
  async function handlePrivateMessage(pm) {
    const recipientId = pm.recipient_nation_id;
    if (!recipientId) return;
    if (pm.sender_nation_id === myNation?.id) return;

    const roomId   = pm.room_id;
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
    const memory       = getMemorySummaries(recipientNation.id);
    const relation     = getRelation(recipientNation.id, pm.sender_nation_id || "");

    const prompt = buildPrivateReplyPrompt(recipientNation, personality, leader, senderNation, pm.content, memory, relation);

    const delay = 3000 + Math.random() * 4000;
    pmCooldownsRef.current[roomId] = Date.now();

    setTimeout(async () => {
      const content = await callLLM(prompt, 380);
      if (!content) return;

      await base44.entities.PrivateMessage.create({
        room_id:              roomId,
        sender_nation_id:     recipientNation.id,
        sender_nation_name:   recipientNation.name, // PMs use plain nation name
        sender_flag:          recipientNation.flag_emoji || "🏴",
        sender_color:         recipientNation.flag_color || "#64748b",
        recipient_nation_id:  pm.sender_nation_id,
        recipient_nation_name: pm.sender_nation_name,
        content,
      });

      const intent = analyzeIntent(pm.content);
      addMemoryEntry(recipientNation.id,
        `Private from ${senderNation?.name || "unknown"}: "${pm.content.slice(0, 80)}"`
      );
      updateRelation(recipientNation.id, pm.sender_nation_id || "", intent);
    }, delay);
  }

  // ── LLM helper ───────────────────────────────────────────────────────────────
  async function callLLM(prompt, maxLen = 280) {
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const raw = typeof res === "string" ? res : res?.response || res?.text || String(res);
      const out = raw.trim().replace(/^["']|["']$/g, "").slice(0, maxLen);
      return out.length >= 5 ? out : null;
    } catch { return null; }
  }

  return null;
}