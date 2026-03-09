import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Shield, Trash2, VolumeX, Reply, X, MessageSquare, Volume2, Megaphone } from "lucide-react";

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

// Only show special badges for admin, moderator, developer, system — NOT for ai or player
const ROLE_BADGE = {
  admin:     { label: "ADMIN",  color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  moderator: { label: "MOD",   color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
  developer: { label: "DEV",   color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  // ai and player → no badge (immersion rule)
};

// Slash commands
const COMMANDS = [
  { cmd: "/announce", desc: "Broadcast a system announcement", role: "admin" },
  { cmd: "/mute",     desc: "/mute <nation>",                  role: "moderator" },
  { cmd: "/unmute",   desc: "/unmute <nation>",                role: "moderator" },
  { cmd: "/delete",   desc: "/delete <message-id>",            role: "moderator" },
  { cmd: "/promote",  desc: "/promote <nation> moderator",     role: "admin" },
  { cmd: "/demote",   desc: "/demote <nation>",                role: "admin" },
  { cmd: "/ban",      desc: "/ban <nation>",                   role: "admin" },
];

function timeStr(d) {
  const t = new Date(d);
  return t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function SystemAnnouncement({ msg }) {
  const content = msg.content || "";
  const isBreaking = content.toLowerCase().includes("war") || content.toLowerCase().includes("attack") || content.toLowerCase().includes("crisis");
  const isMarket   = content.toLowerCase().includes("market") || content.toLowerCase().includes("price") || content.toLowerCase().includes("trade");

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

function ChatMessage({ msg, myNation, isMod, onReact, onReply, onDelete, onMute, onUnmute }) {
  const [hovered, setHovered] = useState(false);
  const [showAllEmojis, setShowAllEmojis] = useState(false);

  if (msg.sender_role === "system") return <SystemAnnouncement msg={msg} />;

  const isMe = msg.sender_nation_id === myNation?.id;
  // Only show badge for admin/moderator/developer — not ai or player
  const badge = ROLE_BADGE[msg.sender_role];
  const isMuted = msg.is_muted;

  return (
    <div
      className="group relative rounded-xl px-2.5 py-1.5 transition-colors"
      style={{ background: hovered ? "rgba(255,255,255,0.025)" : "transparent" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowAllEmojis(false); }}
    >
      {/* Reply reference */}
      {msg.reply_to_name && (
        <div className="text-[10px] text-slate-600 mb-0.5 pl-2 border-l-2 border-slate-700 italic truncate">
          ↩ <span className="text-slate-500">{msg.reply_to_name}</span>
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Flag */}
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

          <ReactionBar msg={msg} onReact={onReact} />
        </div>
      </div>

      {/* Hover action tray */}
      {hovered && (
        <div className="absolute right-2 top-1 flex items-center gap-0.5 bg-[#0c1220] border border-white/10 rounded-lg px-1.5 py-0.5 shadow-2xl z-10">
          {/* Quick reactions */}
          {(showAllEmojis ? EMOJIS : EMOJIS.slice(0, 5)).map(e => (
            <button key={e} onClick={() => onReact(msg, e)}
              title={EMOJI_LABELS[e]}
              className="text-sm hover:scale-125 transition-transform leading-none">{e}</button>
          ))}
          <button onClick={() => setShowAllEmojis(s => !s)}
            className="text-[10px] text-slate-500 hover:text-white px-0.5">
            {showAllEmojis ? "‹" : "›"}
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Reply */}
          <button onClick={() => onReply(msg)} title="Reply"
            className="p-0.5 text-slate-400 hover:text-cyan-400 transition-colors">
            <Reply size={11} />
          </button>

          {/* Mod controls */}
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const msgCacheRef = useRef({});

  const userRole = user?.role || "player";
  const isAdmin = userRole === "admin" || userRole === "developer";
  const isMod = isAdmin || userRole === "moderator";
  const myRole = isAdmin ? "admin" : (userRole === "moderator" ? "moderator" : "player");

  // Load + cache messages
  const loadMessages = useCallback(async () => {
    const data = await base44.entities.ChatMessage.filter({ channel, is_deleted: false }, "-created_date", 80);
    const reversed = data.reverse();
    reversed.forEach(m => { msgCacheRef.current[m.id] = m; });
    setMessages(reversed);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 30);
  }, [channel]);

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.ChatMessage.subscribe(() => loadMessages());
    return unsub;
  }, [loadMessages]);

  // Slash command suggestions
  useEffect(() => {
    if (input.startsWith("/")) {
      const relevant = COMMANDS.filter(c => c.cmd.startsWith(input.split(" ")[0]) && (isMod || c.role === "player"));
      setCmdSuggestions(relevant);
    } else {
      setCmdSuggestions([]);
    }
  }, [input, isMod]);

  async function handleCommand(raw) {
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "/announce" && isAdmin) {
      const text = parts.slice(1).join(" ");
      if (!text) return;
      await base44.entities.ChatMessage.create({
        channel: "system",
        sender_nation_name: "WORLD SYSTEM",
        sender_flag: "🌐",
        sender_color: "#a78bfa",
        sender_role: "system",
        content: text,
      });
      return;
    }
    if ((cmd === "/mute" || cmd === "/unmute") && isMod) {
      // handled inline via message hover — command form is informational
      return;
    }
    // Unknown command — send as regular message so user sees it
    return false;
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || !myNation || sending) return;

    if (trimmed.startsWith("/")) {
      const result = await handleCommand(trimmed);
      if (result !== false) {
        setInput("");
        return;
      }
    }

    setSending(true);
    await base44.entities.ChatMessage.create({
      channel,
      sender_nation_id: myNation.id,
      sender_nation_name: myNation.name,
      sender_flag: myNation.flag_emoji || "🏴",
      sender_color: myNation.flag_color || "#3b82f6",
      sender_role: myRole,
      content: trimmed,
      reply_to_id: replyTo?.id || "",
      reply_to_name: replyTo ? replyTo.sender_nation_name : "",
    });

    setInput("");
    setReplyTo(null);
    setSending(false);
    inputRef.current?.focus();
  }

  async function triggerAIResponse(playerMsg) {
    const allNations = await base44.entities.Nation.list("-gdp", 20);
    const others = allNations.filter(n => n.id !== myNation?.id && n.owner_email !== user?.email);
    if (!others.length) return;
    const aiNation = others[Math.floor(Math.random() * others.length)];

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the leader of "${aiNation.name}", a nation in the ${aiNation.epoch} era of a geopolitical world simulation game. A nation just said: "${playerMsg}". Respond in character as a world leader — one concise sentence, no emojis, no quotation marks. Sound like a real statesperson.`,
      });
      const content = typeof res === "string" ? res : res?.response || res?.text || String(res);
      await base44.entities.ChatMessage.create({
        channel: "global",
        sender_nation_id: aiNation.id,
        sender_nation_name: aiNation.name,
        sender_flag: aiNation.flag_emoji || "🏴",
        sender_color: aiNation.flag_color || "#818cf8",
        sender_role: "player",  // ← intentionally "player" so no AI badge is shown
        content: content.trim().replace(/^["']|["']$/g, "").slice(0, 220),
      });
    } catch (_) {}
  }

  async function deleteMessage(msg) {
    await base44.entities.ChatMessage.update(msg.id, { is_deleted: true });
  }

  async function mutePlayer(msg) {
    await base44.entities.ChatMessage.update(msg.id, { is_muted: true });
  }

  async function unmutePlayer(msg) {
    await base44.entities.ChatMessage.update(msg.id, { is_muted: false });
  }

  async function handleReact(msg, emoji) {
    const reactions = { ...(msg.reactions || {}) };
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    await base44.entities.ChatMessage.update(msg.id, { reactions });
  }

  const filtered = messages.filter(m => {
    if (channel === "allies") {
      return myNation?.allies?.includes(m.sender_nation_id) || m.sender_nation_id === myNation?.id;
    }
    return true;
  });

  const activeChannel = CHANNELS.find(c => c.id === channel);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(34,211,238,0.03) 0%, rgba(4,8,16,0.99) 70%)",
        border: "1px solid rgba(34,211,238,0.10)",
        backdropFilter: "blur(20px)",
      }}>

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
              style={{
                color:      channel === ch.id ? ch.color : "#475569",
                background: channel === ch.id ? `${ch.color}18` : "transparent",
                border:     `1px solid ${channel === ch.id ? ch.color + "44" : "transparent"}`,
              }}>
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto py-1" style={{ minHeight: 0 }}>
        {filtered.length === 0 && (
          <div className="text-center text-slate-700 text-xs ep-mono mt-10 px-4">
            {channel === "allies" ? "No allied messages yet." : "No messages yet — be the first!"}
          </div>
        )}
        {filtered.map(msg => (
          <ChatMessage
            key={msg.id}
            msg={msg}
            myNation={myNation}
            isMod={isMod}
            onReact={handleReact}
            onReply={(m) => { setReplyTo(m); inputRef.current?.focus(); }}
            onDelete={deleteMessage}
            onMute={mutePlayer}
            onUnmute={unmutePlayer}
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
          <button onClick={() => setReplyTo(null)} className="text-slate-600 hover:text-white ml-auto shrink-0">
            <X size={10} />
          </button>
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
        {/* Emoji picker */}
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
          {/* Emoji toggle */}
          <button onClick={() => setShowEmoji(s => !s)}
            className="shrink-0 text-base px-1.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
            title="Emoji">😊</button>

          {/* Announce shortcut for admins */}
          {isAdmin && channel !== "system" && (
            <button
              onClick={() => { setInput("/announce "); setChannel("system"); inputRef.current?.focus(); }}
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
            placeholder={myNation
              ? `Message #${channel}${isMod ? " or /command" : ""}…`
              : "Create a nation to chat"}
            disabled={!myNation}
            maxLength={400}
            className="flex-1 bg-white/4 border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 focus:bg-cyan-500/4 transition-all"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || !myNation || sending}
            className="shrink-0 p-1.5 rounded-xl border transition-all disabled:opacity-25"
            style={{
              background: "rgba(34,211,238,0.12)",
              borderColor: "rgba(34,211,238,0.2)",
              color: "#22d3ee",
            }}>
            <Send size={13} />
          </button>
        </div>

        {isMod && (
          <div className="mt-1 flex items-center gap-1">
            <Shield size={8} className="text-orange-400/50" />
            <span className="text-[9px] text-orange-400/40 ep-mono">Mod active — hover messages to manage</span>
          </div>
        )}
      </div>
    </div>
  );
}