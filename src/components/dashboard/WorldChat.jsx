import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Shield, Trash2, VolumeX, Reply, X, MessageSquare, Volume2, Megaphone, Lock } from "lucide-react";
import PrivateChatPanel from "./PrivateChatPanel.jsx";

const CHANNELS = [
  { id: "global", label: "🌐 Global", color: "#22d3ee" },
  { id: "allies", label: "🤝 Allies",  color: "#4ade80" },
  { id: "system", label: "⚙️ System",  color: "#a78bfa" },
];

const EMOJIS = ["👍","👎","❤️","😂","😱","⚔️","🤝","💰","🔥","💥","🏆","👑"];

const EMOJI_LABELS = {
  "👍": "Support", "👎": "Opposition", "❤️": "Approval", "😂": "Humor",
  "😱": "Shock", "⚔️": "War Sentiment", "🤝": "Diplomacy", "💰": "Trade Interest",
  "🔥": "Escalation", "💥": "Crisis", "🏆": "Victory", "👑": "Leadership",
};

const ROLE_BADGE = {
  admin:     { label: "ADMIN",  color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  moderator: { label: "MOD",   color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
  developer: { label: "DEV",   color: "#34d399", bg: "rgba(52,211,153,0.15)" },
};

const DEFAULT_BLOCKED_WORDS = [
  "nigger","nigga","faggot","fag","chink","spic","kike","wetback","tranny","retard",
  "cunt","whore","slut","bitch","bastard","motherfucker","fuck","shit","ass","dick",
  "pussy","cock","asshole","prick","twat","wanker","bullshit","crap","damn","hell",
  "nazi","kkk","jihad","rape","murder","kill yourself","kys",
];

function censorWord(word) {
  if (word.length <= 2) return "***";
  return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
}

function applyWordFilter(text, blockedList) {
  let result = text;
  for (const word of blockedList) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    result = result.replace(re, (m) => censorWord(m));
  }
  return result;
}

const COMMANDS = [
  { cmd: "/announce",         desc: "Broadcast a system announcement",              role: "admin" },
  { cmd: "/promote",          desc: "/promote <nation> moderator|admin",            role: "admin" },
  { cmd: "/demote",           desc: "/demote <nation>",                             role: "admin" },
  { cmd: "/ban",              desc: "/ban <nation>",                                role: "admin" },
  { cmd: "/unban",            desc: "/unban <nation>",                              role: "admin" },
  { cmd: "/addblockedword",   desc: "/addblockedword <word>",                       role: "admin" },
  { cmd: "/removeblockedword",desc: "/removeblockedword <word>",                    role: "admin" },
  { cmd: "/mute",             desc: "/mute <nation>",                               role: "moderator" },
  { cmd: "/unmute",           desc: "/unmute <nation>",                             role: "moderator" },
  { cmd: "/delete",           desc: "/delete <message-id>",                         role: "moderator" },
  { cmd: "/warn",             desc: "/warn <nation> <reason>",                      role: "moderator" },
  { cmd: "/trade",            desc: "/trade <nation> <resource> <amount>",          role: "player" },
  { cmd: "/diplomacy",        desc: "/diplomacy propose|reject <topic>",            role: "player" },
  { cmd: "/sanction",         desc: "/sanction <nation>",                           role: "player" },
  { cmd: "/spy",              desc: "/spy <nation>",                                role: "player" },
  { cmd: "/aid",              desc: "/aid <nation> <amount>",                       role: "player" },
];

function detectPropaganda(content = "") {
  const t = content.toLowerCase();
  return (
    (/collaps|bankrupt|defeated|humiliat|crush|destroy|annihilat/.test(t) && /economy|military|nation/.test(t)) ||
    /fake news|propaganda|lies|false report/.test(t)
  );
}

function parsePrivateMention(text) {
  const match = text.match(/^@([^@\s][^\s]*(?:\s[^\s]+)*)/);
  if (!match) return null;
  return match[1].trim();
}

function timeStr(d) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function SystemAnnouncement({ msg }) {
  const content = msg.content || "";
  const isBreaking = /war|attack|crisis|military/.test(content.toLowerCase());
  const isMarket   = /market|price|trade|economy/.test(content.toLowerCase());
  return (
    <div className="mx-1 my-2 rounded-xl px-3 py-2.5 ep-slide-in"
      style={{
        background: isBreaking
          ? "linear-gradient(135deg, rgba(248,113,113,0.12) 0%, rgba(239,68,68,0.06) 100%)"
          : isMarket
          ? "linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(16,185,129,0.06) 100%)"
          : "linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(139,92,246,0.06) 100%)",
        border: `1px solid ${isBreaking ? "rgba(248,113,113,0.25)" : isMarket ? "rgba(74,222,128,0.25)" : "rgba(167,139,250,0.25)"}`,
      }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-black ep-mono tracking-widest"
          style={{ color: isBreaking ? "#f87171" : isMarket ? "#4ade80" : "#a78bfa" }}>
          {isBreaking ? "🚨 BREAKING NEWS" : isMarket ? "📈 GLOBAL MARKETS" : "📢 WORLD ANNOUNCEMENT"}
        </span>
        <span className="text-[9px] text-slate-600 ep-mono">{timeStr(msg.created_date)}</span>
      </div>
      <div className="text-[11px] text-white font-semibold leading-relaxed">{content}</div>
    </div>
  );
}

function ReactionBar({ msg, onReact }) {
  const counts = msg.reactions || {};
  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, count]) => (
        <button key={emoji} onClick={() => onReact(msg, emoji)}
          title={EMOJI_LABELS[emoji] || emoji}
          className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors ep-mono">
          {emoji} {count}
        </button>
      ))}
    </div>
  );
}

function ChatMessageRow({ msg, myNation, isMod, onReact, onReply, onDelete, onMute, onUnmute, onPrivate }) {
  const [hovered, setHovered] = useState(false);
  const [showAllEmojis, setShowAllEmojis] = useState(false);

  if (msg.sender_role === "system") return <SystemAnnouncement msg={msg} />;

  const isMe = msg.sender_nation_id === myNation?.id;
  const badge = ROLE_BADGE[msg.sender_role];
  const isMuted = msg.is_muted;

  return (
    <div
      className="group relative rounded-xl px-2.5 py-1.5 transition-colors"
      style={{ background: hovered ? "rgba(255,255,255,0.025)" : "transparent" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowAllEmojis(false); }}
    >
      {msg.reply_to_name && (
        <div className="text-[10px] text-slate-600 mb-0.5 pl-2 border-l-2 border-slate-700 italic truncate">
          ↩ <span className="text-slate-500">{msg.reply_to_name}</span>
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5 select-none">{msg.sender_flag || "🏴"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold" style={{ color: msg.sender_color || "#22d3ee" }}>
              {msg.sender_nation_name}
            </span>
            {badge && (
              <span className="text-[9px] font-black px-1 py-0.5 rounded ep-mono"
                style={{ color: badge.color, background: badge.bg }}>
                {badge.label}
              </span>
            )}
            {isMe && <span className="text-[9px] text-slate-700 ep-mono">(you)</span>}
            {isMuted && <span className="text-[9px] text-orange-500/60 ep-mono">[muted]</span>}
            <span className="text-[10px] text-slate-600 ep-mono ml-auto shrink-0">{timeStr(msg.created_date)}</span>
          </div>
          {isMuted && !isMod ? (
            <div className="text-[11px] text-slate-700 italic">Message hidden (muted)</div>
          ) : (
            <div className="text-[12px] text-slate-300 leading-relaxed break-words">{msg.content}</div>
          )}
          {!isMuted && detectPropaganda(msg.content) && (
            <div className="mt-0.5 text-[9px] font-bold text-amber-500/60 ep-mono tracking-wider">⚠ POSSIBLE PROPAGANDA</div>
          )}
          {!isMuted && msg.content?.startsWith("[DIPLOMATIC ACTION]") && (
            <div className="mt-1 text-[10px] text-cyan-400/60 ep-mono">🏛 Official diplomatic record</div>
          )}
          <ReactionBar msg={msg} onReact={onReact} />
        </div>
      </div>
      {hovered && (
        <div className="absolute right-2 top-1 flex items-center gap-0.5 bg-[#0c1220] border border-white/10 rounded-lg px-1.5 py-0.5 shadow-2xl z-10">
          {(showAllEmojis ? EMOJIS : EMOJIS.slice(0, 5)).map(e => (
            <button key={e} onClick={() => onReact(msg, e)}
              title={EMOJI_LABELS[e]}
              className="text-sm hover:scale-125 transition-transform leading-none">{e}</button>
          ))}
          <button onClick={() => setShowAllEmojis(s => !s)}
            className="text-[10px] text-slate-500 hover:text-white px-0.5">
            {showAllEmojis ? "‹" : "›"}
          </button>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button onClick={() => onReply(msg)} title="Reply"
            className="p-0.5 text-slate-400 hover:text-cyan-400 transition-colors">
            <Reply size={11} />
          </button>
          {!isMe && (
            <button onClick={() => onPrivate(msg)} title="Private message"
              className="p-0.5 text-slate-400 hover:text-violet-400 transition-colors">
              <Lock size={11} />
            </button>
          )}
          {isMod && (
            <>
              <button onClick={() => isMuted ? onUnmute(msg) : onMute(msg)}
                title={isMuted ? "Unmute" : "Mute"}
                className="p-0.5 text-slate-400 hover:text-orange-400 transition-colors">
                {isMuted ? <Volume2 size={11} /> : <VolumeX size={11} />}
              </button>
              <button onClick={() => onDelete(msg)} title="Delete"
                className="p-0.5 text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 size={11} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorldChat({ myNation, user }) {
  const [channel, setChannel] = useState("global");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [cmdSuggestions, setCmdSuggestions] = useState([]);
  const [blockedWords, setBlockedWords] = useState([...DEFAULT_BLOCKED_WORDS]);
  const [privateTarget, setPrivateTarget] = useState(null);
  const [showPrivate, setShowPrivate] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const userRole = user?.role || "player";
  const isAdmin  = userRole === "admin" || userRole === "developer";
  const isMod    = isAdmin || userRole === "moderator";
  const myRole   = isAdmin ? "admin" : (userRole === "moderator" ? "moderator" : "player");

  useEffect(() => {
    base44.entities.WordFilter.list().then(rows => {
      if (rows.length) {
        setBlockedWords([...DEFAULT_BLOCKED_WORDS, ...rows.map(r => r.word.toLowerCase())]);
      }
    }).catch(() => {});
  }, []);

  const loadMessages = useCallback(async () => {
    const data = await base44.entities.ChatMessage.filter({ channel, is_deleted: false }, "-created_date", 80);
    setMessages(data.reverse());
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 30);
  }, [channel]);

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.ChatMessage.subscribe(() => loadMessages());
    return unsub;
  }, [loadMessages]);

  useEffect(() => {
    if (input.startsWith("/")) {
      const typed = input.split(" ")[0].toLowerCase();
      const relevant = COMMANDS.filter(c => {
        if (!c.cmd.startsWith(typed)) return false;
        if (c.role === "player") return true;
        if (c.role === "moderator") return isMod;
        if (c.role === "admin") return isAdmin;
        return false;
      });
      setCmdSuggestions(relevant);
    } else {
      setCmdSuggestions([]);
    }
  }, [input, isMod, isAdmin]);

  async function logModAction(action, targetName, targetId, detail) {
    await base44.entities.ModerationLog.create({
      moderator_name: myNation?.name || user?.email || "Unknown",
      moderator_email: user?.email || "",
      action,
      target_nation_name: targetName,
      target_nation_id: targetId || "",
      detail: detail || "",
    });
  }

  async function handleCommand(raw) {
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "/announce" && isAdmin) {
      const text = parts.slice(1).join(" ");
      if (!text) return;
      await base44.entities.ChatMessage.create({
        channel: "system", sender_nation_name: "WORLD SYSTEM",
        sender_flag: "🌐", sender_color: "#a78bfa", sender_role: "system", content: text,
      });
      return;
    }

    if (cmd === "/promote" && isAdmin) {
      const targetName = parts[1]; const newRole = parts[2] || "moderator";
      if (!targetName) return;
      const nations = await base44.entities.Nation.filter({ name: targetName });
      const target = nations[0];
      if (target) {
        const users = await base44.entities.User.filter({ email: target.owner_email });
        if (users[0]) await base44.entities.User.update(users[0].id, { role: newRole });
      }
      await logModAction("promote", targetName, target?.id, `promoted to ${newRole}`);
      await base44.entities.ChatMessage.create({
        channel: "system", sender_nation_name: "WORLD SYSTEM",
        sender_flag: "🌐", sender_color: "#a78bfa", sender_role: "system",
        content: `🛡️ ${targetName} has been promoted to ${newRole.toUpperCase()} by ${myNation?.name || "Admin"}.`,
      });
      return;
    }

    if (cmd === "/demote" && isAdmin) {
      const targetName = parts[1]; if (!targetName) return;
      const nations = await base44.entities.Nation.filter({ name: targetName });
      const target = nations[0];
      if (target) {
        const users = await base44.entities.User.filter({ email: target.owner_email });
        if (users[0]) await base44.entities.User.update(users[0].id, { role: "player" });
      }
      await logModAction("demote", targetName, target?.id, "demoted to player");
      await base44.entities.ChatMessage.create({
        channel: "system", sender_nation_name: "WORLD SYSTEM",
        sender_flag: "🌐", sender_color: "#a78bfa", sender_role: "system",
        content: `⬇️ ${targetName} has been demoted to PLAYER by ${myNation?.name || "Admin"}.`,
      });
      return;
    }

    if (cmd === "/ban" && isAdmin) {
      const targetName = parts[1]; if (!targetName) return;
      const nations = await base44.entities.Nation.filter({ name: targetName });
      const target = nations[0];
      if (target) {
        const users = await base44.entities.User.filter({ email: target.owner_email });
        if (users[0]) await base44.entities.User.update(users[0].id, { role: "banned" });
      }
      await logModAction("ban", targetName, target?.id);
      await base44.entities.ChatMessage.create({
        channel: "system", sender_nation_name: "WORLD SYSTEM",
        sender_flag: "🌐", sender_color: "#a78bfa", sender_role: "system",
        content: `🚫 ${targetName} has been BANNED by ${myNation?.name || "Admin"}.`,
      });
      return;
    }

    if (cmd === "/unban" && isAdmin) {
      const targetName = parts[1]; if (!targetName) return;
      const nations = await base44.entities.Nation.filter({ name: targetName });
      const target = nations[0];
      if (target) {
        const users = await base44.entities.User.filter({ email: target.owner_email });
        if (users[0]) await base44.entities.User.update(users[0].id, { role: "player" });
      }
      await logModAction("unban", targetName, target?.id);
      await base44.entities.ChatMessage.create({
        channel: "system", sender_nation_name: "WORLD SYSTEM",
        sender_flag: "🌐", sender_color: "#a78bfa", sender_role: "system",
        content: `✅ ${targetName} has been UNBANNED by ${myNation?.name || "Admin"}.`,
      });
      return;
    }

    if (cmd === "/addblockedword" && isAdmin) {
      const word = parts[1]?.toLowerCase(); if (!word) return;
      await base44.entities.WordFilter.create({ word, added_by: user?.email || "" });
      setBlockedWords(prev => [...prev, word]);
      await logModAction("add_blocked_word", word, "", word);
      return;
    }

    if (cmd === "/removeblockedword" && isAdmin) {
      const word = parts[1]?.toLowerCase(); if (!word) return;
      const rows = await base44.entities.WordFilter.filter({ word });
      for (const r of rows) await base44.entities.WordFilter.delete(r.id);
      setBlockedWords(prev => prev.filter(w => w !== word));
      await logModAction("remove_blocked_word", word, "", word);
      return;
    }

    if (cmd === "/mute" && isMod) {
      const targetName = parts[1]; if (!targetName) return;
      const msgs = await base44.entities.ChatMessage.filter({ sender_nation_name: targetName, channel });
      for (const m of msgs) await base44.entities.ChatMessage.update(m.id, { is_muted: true });
      await logModAction("mute", targetName, "");
      return;
    }

    if (cmd === "/unmute" && isMod) {
      const targetName = parts[1]; if (!targetName) return;
      const msgs = await base44.entities.ChatMessage.filter({ sender_nation_name: targetName, channel });
      for (const m of msgs) await base44.entities.ChatMessage.update(m.id, { is_muted: false });
      await logModAction("unmute", targetName, "");
      return;
    }

    if (cmd === "/delete" && isMod) {
      const msgId = parts[1]; if (!msgId) return;
      await base44.entities.ChatMessage.update(msgId, { is_deleted: true });
      await logModAction("delete", msgId, "", "message deleted");
      return;
    }

    if (cmd === "/warn" && isMod) {
      const targetName = parts[1];
      const reason = parts.slice(2).join(" ") || "No reason given";
      if (!targetName) return;
      await logModAction("warn", targetName, "", reason);
      await base44.entities.ChatMessage.create({
        channel: "system", sender_nation_name: "WORLD SYSTEM",
        sender_flag: "🌐", sender_color: "#a78bfa", sender_role: "system",
        content: `⚠️ WARNING issued to ${targetName}: ${reason}`,
      });
      return;
    }

    if (cmd === "/trade" && myNation) {
      const [, targetNation, resource, amount] = parts;
      if (!targetNation) return;
      await base44.entities.ChatMessage.create({
        channel, sender_nation_id: myNation.id, sender_nation_name: myNation.name,
        sender_flag: myNation.flag_emoji || "🏴", sender_color: myNation.flag_color || "#3b82f6",
        sender_role: myRole,
        content: `[DIPLOMATIC ACTION] 🤝 Trade Proposal — ${myNation.name} offers ${amount || "unspecified"} units of ${resource || "resources"} to ${targetNation}.`,
      });
      return;
    }

    if (cmd === "/diplomacy" && myNation) {
      const action = parts[1] || "propose";
      const subj = parts.slice(2).join(" ") || "unknown nation";
      await base44.entities.ChatMessage.create({
        channel, sender_nation_id: myNation.id, sender_nation_name: myNation.name,
        sender_flag: myNation.flag_emoji || "🏴", sender_color: myNation.flag_color || "#3b82f6",
        sender_role: myRole,
        content: `[DIPLOMATIC ACTION] 🏛️ ${myNation.name} formally ${action}s: ${subj}. All parties invited to respond.`,
      });
      return;
    }

    if (cmd === "/sanction" && myNation) {
      const target = parts.slice(1).join(" ") || "unknown nation";
      await base44.entities.ChatMessage.create({
        channel, sender_nation_id: myNation.id, sender_nation_name: myNation.name,
        sender_flag: myNation.flag_emoji || "🏴", sender_color: myNation.flag_color || "#3b82f6",
        sender_role: myRole,
        content: `[DIPLOMATIC ACTION] ⛔ ${myNation.name} announces economic sanctions against ${target}.`,
      });
      return;
    }

    if (cmd === "/spy" && myNation) {
      const target = parts.slice(1).join(" ") || "unknown nation";
      await base44.entities.ChatMessage.create({
        channel: "system", sender_nation_name: "INTEL AGENCY",
        sender_flag: "🔍", sender_color: "#94a3b8", sender_role: "system",
        content: `🔍 COVERT OPERATION\n${myNation.name} has initiated intelligence gathering on ${target}. Results pending.`,
      });
      return;
    }

    if (cmd === "/aid" && myNation) {
      const [, targetNation, amount] = parts; if (!targetNation) return;
      await base44.entities.ChatMessage.create({
        channel, sender_nation_id: myNation.id, sender_nation_name: myNation.name,
        sender_flag: myNation.flag_emoji || "🏴", sender_color: myNation.flag_color || "#3b82f6",
        sender_role: myRole,
        content: `[DIPLOMATIC ACTION] 🤲 ${myNation.name} pledges humanitarian aid of ${amount || "unspecified"} credits to ${targetNation}.`,
      });
      return;
    }

    return false;
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || !myNation || sending) return;

    if (trimmed.startsWith("/")) {
      const result = await handleCommand(trimmed);
      if (result !== false) { setInput(""); return; }
    }

    if (trimmed.startsWith("@")) {
      const mentionedName = parsePrivateMention(trimmed);
      if (mentionedName) {
        const allNations = await base44.entities.Nation.list();
        const targetNation = allNations.find(n =>
          n.name.toLowerCase() === mentionedName.toLowerCase() && n.id !== myNation.id
        );
        if (targetNation) {
          setPrivateTarget({ nationId: targetNation.id, nationName: targetNation.name, flag: targetNation.flag_emoji || "🏴", color: targetNation.flag_color || "#64748b" });
          setShowPrivate(true);
          setInput("");
          return;
        }
      }
    }

    const filtered = applyWordFilter(trimmed, blockedWords);
    setSending(true);
    await base44.entities.ChatMessage.create({
      channel, sender_nation_id: myNation.id, sender_nation_name: myNation.name,
      sender_flag: myNation.flag_emoji || "🏴", sender_color: myNation.flag_color || "#3b82f6",
      sender_role: myRole, content: filtered,
      reply_to_id: replyTo?.id || "", reply_to_name: replyTo ? replyTo.sender_nation_name : "",
    });
    setInput(""); setReplyTo(null); setSending(false);
    inputRef.current?.focus();
  }

  async function deleteMessage(msg) {
    await base44.entities.ChatMessage.update(msg.id, { is_deleted: true });
    await logModAction("delete", msg.sender_nation_name, msg.sender_nation_id, "deleted via hover");
  }
  async function mutePlayer(msg) {
    await base44.entities.ChatMessage.update(msg.id, { is_muted: true });
    await logModAction("mute", msg.sender_nation_name, msg.sender_nation_id);
  }
  async function unmutePlayer(msg) {
    await base44.entities.ChatMessage.update(msg.id, { is_muted: false });
    await logModAction("unmute", msg.sender_nation_name, msg.sender_nation_id);
  }
  async function handleReact(msg, emoji) {
    const reactions = { ...(msg.reactions || {}) };
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    await base44.entities.ChatMessage.update(msg.id, { reactions });
  }
  function openPrivateFromMsg(msg) {
    setPrivateTarget({ nationId: msg.sender_nation_id, nationName: msg.sender_nation_name, flag: msg.sender_flag || "🏴", color: msg.sender_color || "#64748b" });
    setShowPrivate(true);
  }

  const filtered = messages.filter(m => {
    if (channel === "allies") return myNation?.allies?.includes(m.sender_nation_id) || m.sender_nation_id === myNation?.id;
    return true;
  });

  return (
    <>
      <div className="flex flex-col h-full rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(34,211,238,0.03) 0%, rgba(4,8,16,0.99) 70%)", border: "1px solid rgba(34,211,238,0.10)", backdropFilter: "blur(20px)" }}>

        {/* Header */}
        <div className="px-3 py-2 border-b shrink-0 flex items-center gap-2"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
          <MessageSquare size={11} className="text-cyan-400 shrink-0" />
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ep-mono">World Chat</span>
          <span className="ep-live-dot ml-0.5" />
          <div className="ml-auto flex gap-1">
            {CHANNELS.map(ch => (
              <button key={ch.id} onClick={() => setChannel(ch.id)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ep-mono"
                style={{ color: channel === ch.id ? ch.color : "#475569", background: channel === ch.id ? `${ch.color}18` : "transparent", border: `1px solid ${channel === ch.id ? ch.color + "44" : "transparent"}` }}>
                {ch.label}
              </button>
            ))}
            <button onClick={() => { setPrivateTarget(null); setShowPrivate(true); }}
              title="Private messages"
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ep-mono"
              style={{ color: "#818cf8", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
              <Lock size={10} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-1" style={{ minHeight: 0 }}>
          {filtered.length === 0 && (
            <div className="text-center text-slate-700 text-xs ep-mono mt-10 px-4">
              {channel === "allies" ? "No allied messages yet." : "No messages yet — be the first!"}
            </div>
          )}
          {filtered.map(msg => (
            <ChatMessageRow key={msg.id} msg={msg} myNation={myNation} isMod={isMod}
              onReact={handleReact}
              onReply={(m) => { setReplyTo(m); inputRef.current?.focus(); }}
              onDelete={deleteMessage} onMute={mutePlayer} onUnmute={unmutePlayer}
              onPrivate={openPrivateFromMsg}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply bar */}
        {replyTo && (
          <div className="px-3 py-1.5 flex items-center gap-2 border-t text-[11px] shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(34,211,238,0.04)" }}>
            <Reply size={10} className="text-cyan-400 shrink-0" />
            <span className="text-slate-500">Replying to </span>
            <span className="font-bold" style={{ color: replyTo.sender_color || "#22d3ee" }}>{replyTo.sender_nation_name}</span>
            <span className="text-slate-600 truncate flex-1">: {replyTo.content?.slice(0, 40)}</span>
            <button onClick={() => setReplyTo(null)} className="text-slate-600 hover:text-white ml-auto shrink-0"><X size={10} /></button>
          </div>
        )}

        {/* Command suggestions */}
        {cmdSuggestions.length > 0 && (
          <div className="mx-2 mb-1 bg-[#0c1220] border border-white/10 rounded-xl overflow-hidden shrink-0">
            {cmdSuggestions.map(c => (
              <button key={c.cmd} onClick={() => { setInput(c.cmd + " "); inputRef.current?.focus(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors text-left">
                <span className="text-[11px] font-bold text-cyan-400 ep-mono">{c.cmd}</span>
                <span className="text-[10px] text-slate-500">{c.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="px-2 pb-2 pt-1 border-t shrink-0 relative" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {showEmoji && (
            <div className="absolute bottom-full left-2 mb-1 bg-[#0c1220] border border-white/10 rounded-xl p-2 flex flex-wrap gap-1 w-52 shadow-2xl z-20">
              {EMOJIS.map(e => (
                <button key={e} title={EMOJI_LABELS[e]}
                  onClick={() => { setInput(i => i + e); setShowEmoji(false); inputRef.current?.focus(); }}
                  className="text-lg hover:scale-125 transition-transform">{e}</button>
              ))}
            </div>
          )}
          <div className="flex gap-1.5 items-center">
            <button onClick={() => setShowEmoji(s => !s)}
              className="shrink-0 text-base px-1.5 py-1 rounded-lg hover:bg-white/5 transition-colors" title="Emoji">😊</button>
            {isAdmin && channel !== "system" && (
              <button onClick={() => { setInput("/announce "); setChannel("system"); inputRef.current?.focus(); }}
                title="Create announcement"
                className="shrink-0 p-1.5 rounded-lg hover:bg-violet-500/10 text-violet-500/50 hover:text-violet-400 transition-colors">
                <Megaphone size={12} />
              </button>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                if (e.key === "Escape") { setReplyTo(null); setShowEmoji(false); }
              }}
              placeholder={myNation ? `Message #${channel} or @NationName for DM${isMod ? " or /command" : ""}…` : "Create a nation to chat"}
              disabled={!myNation}
              maxLength={400}
              className="flex-1 border rounded-xl px-3 py-1.5 text-xs focus:outline-none transition-all"
              style={{ color: "#1e293b", background: "#f1f5f9", borderColor: "rgba(100,116,139,0.3)" }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || !myNation || sending}
              className="shrink-0 p-1.5 rounded-xl border transition-all disabled:opacity-25"
              style={{ background: "rgba(34,211,238,0.12)", borderColor: "rgba(34,211,238,0.2)", color: "#22d3ee" }}>
              <Send size={13} />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {["/trade", "/diplomacy", "/sanction", "/spy", "/aid"].map(cmd => (
              <button key={cmd} onClick={() => { setInput(cmd + " "); inputRef.current?.focus(); }}
                className="shrink-0 text-[9px] font-bold ep-mono px-1.5 py-0.5 rounded-md border border-white/10 text-slate-600 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors">
                {cmd}
              </button>
            ))}
            {isMod && (
              <>
                <div className="w-px h-3 bg-white/10 shrink-0" />
                <Shield size={8} className="text-orange-400/50 shrink-0" />
                <span className="text-[9px] text-orange-400/40 ep-mono shrink-0">Mod active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {showPrivate && myNation && (
        <PrivateChatPanel myNation={myNation} initialTarget={privateTarget}
          onClose={() => { setShowPrivate(false); setPrivateTarget(null); }} />
      )}
    </>
  );
}