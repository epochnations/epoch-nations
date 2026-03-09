import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Shield, Trash2, VolumeX, Reply, X, MessageSquare } from "lucide-react";

const CHANNELS = [
  { id: "global", label: "🌐 Global", color: "#22d3ee" },
  { id: "allies", label: "🤝 Allies",  color: "#4ade80" },
  { id: "system", label: "⚙️ System",  color: "#a78bfa" },
];

const EMOJIS = ["👍","👎","❤️","😂","😱","⚔️","🤝","💰","🔥","💥","🏆","👑"];

const ROLE_BADGE = {
  admin:     { label: "ADMIN",  color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  moderator: { label: "MOD",   color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
  ai:        { label: "AI",    color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  system:    { label: "SYS",   color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  player:    null,
};

function timeStr(d) {
  const t = new Date(d);
  return t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function ReactionBar({ msg, onReact }) {
  const counts = msg.reactions || {};
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(counts).filter(([,v]) => v > 0).map(([emoji, count]) => (
        <button key={emoji} onClick={() => onReact(msg, emoji)}
          className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
          {emoji} {count}
        </button>
      ))}
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
  const [hoveredId, setHoveredId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const isAdmin = user?.role === "admin";
  const isMod = isAdmin || user?.role === "moderator";

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.ChatMessage.subscribe(() => loadMessages());
    return unsub;
  }, [channel]);

  async function loadMessages() {
    const data = await base44.entities.ChatMessage.filter({ channel, is_deleted: false }, "-created_date", 60);
    setMessages(data.reverse());
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function sendMessage() {
    if (!input.trim() || !myNation || sending) return;
    setSending(true);
    await base44.entities.ChatMessage.create({
      channel,
      sender_nation_id: myNation.id,
      sender_nation_name: myNation.name,
      sender_flag: myNation.flag_emoji || "🏴",
      sender_color: myNation.flag_color || "#3b82f6",
      sender_role: isAdmin ? "admin" : isMod ? "moderator" : "player",
      content: input.trim(),
      reply_to_id: replyTo?.id || "",
      reply_to_name: replyTo ? replyTo.sender_nation_name : "",
    });

    // Chance for an AI nation to respond
    if (channel === "global" && Math.random() < 0.25) {
      triggerAIResponse(input.trim());
    }

    setInput("");
    setReplyTo(null);
    setSending(false);
    inputRef.current?.focus();
  }

  async function triggerAIResponse(playerMsg) {
    const allNations = await base44.entities.Nation.list("-gdp", 20);
    const aiNations = allNations.filter(n => n.id !== myNation?.id);
    if (!aiNations.length) return;
    const aiNation = aiNations[Math.floor(Math.random() * aiNations.length)];

    const prompts = [
      `A nation leader of "${aiNation.name}" (${aiNation.epoch} era) responds briefly and in character to a player who said: "${playerMsg}". One short sentence, geopolitical game style.`,
    ];
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[0],
      });
      const content = typeof res === "string" ? res : res?.response || res?.text || String(res);
      await base44.entities.ChatMessage.create({
        channel: "global",
        sender_nation_id: aiNation.id,
        sender_nation_name: aiNation.name,
        sender_flag: aiNation.flag_emoji || "🤖",
        sender_color: aiNation.flag_color || "#818cf8",
        sender_role: "ai",
        content: content.trim().slice(0, 200),
      });
    } catch (_) {}
  }

  async function deleteMessage(msg) {
    await base44.entities.ChatMessage.update(msg.id, { is_deleted: true });
  }

  async function mutePlayer(msg) {
    // Mark all their messages as muted
    await base44.entities.ChatMessage.update(msg.id, { is_muted: true });
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

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(34,211,238,0.04) 0%, rgba(4,8,16,0.98) 60%)",
        border: "1px solid rgba(34,211,238,0.12)",
        backdropFilter: "blur(20px)",
      }}>
      {/* Header */}
      <div className="px-3 py-2 border-b shrink-0 flex items-center gap-2"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(90deg, rgba(34,211,238,0.07) 0%, transparent 100%)" }}>
        <MessageSquare size={12} className="text-cyan-400" />
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ep-mono">World Chat</span>
        <span className="ep-live-dot ml-1" />
        <div className="ml-auto flex gap-1">
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => setChannel(ch.id)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all"
              style={{
                color: channel === ch.id ? ch.color : "#64748b",
                background: channel === ch.id ? `${ch.color}18` : "transparent",
                border: `1px solid ${channel === ch.id ? ch.color + "44" : "transparent"}`,
              }}>
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" style={{ minHeight: 0 }}>
        {filtered.length === 0 && (
          <div className="text-center text-slate-600 text-xs ep-mono mt-8">No messages yet. Start the conversation!</div>
        )}
        {filtered.map(msg => {
          const badge = ROLE_BADGE[msg.sender_role];
          const isMe = msg.sender_nation_id === myNation?.id;
          return (
            <div key={msg.id}
              className="group relative rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/3"
              onMouseEnter={() => setHoveredId(msg.id)}
              onMouseLeave={() => setHoveredId(null)}>
              {/* Reply reference */}
              {msg.reply_to_name && (
                <div className="text-[10px] text-slate-600 mb-0.5 pl-2 border-l-2 border-slate-600 italic">
                  ↩ {msg.reply_to_name}
                </div>
              )}
              <div className="flex items-start gap-2">
                {/* Flag */}
                <span className="text-sm shrink-0 mt-0.5">{msg.sender_flag}</span>
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
                    {isMe && <span className="text-[9px] text-slate-600 ep-mono">(you)</span>}
                    <span className="text-[10px] text-slate-600 ep-mono ml-auto">{timeStr(msg.created_date)}</span>
                  </div>
                  <div className="text-[12px] text-slate-300 leading-relaxed break-words">{msg.content}</div>
                  <ReactionBar msg={msg} onReact={handleReact} />
                </div>
              </div>

              {/* Action buttons on hover */}
              {hoveredId === msg.id && (
                <div className="absolute right-2 top-1 flex gap-1 bg-[#0f172a] border border-white/10 rounded-lg px-1 py-0.5 shadow-xl z-10">
                  {EMOJIS.slice(0, 6).map(e => (
                    <button key={e} onClick={() => handleReact(msg, e)}
                      className="text-sm hover:scale-125 transition-transform">{e}</button>
                  ))}
                  <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                    className="p-0.5 text-slate-400 hover:text-cyan-400 transition-colors">
                    <Reply size={11} />
                  </button>
                  {isMod && (
                    <>
                      <button onClick={() => mutePlayer(msg)} className="p-0.5 text-slate-400 hover:text-orange-400 transition-colors">
                        <VolumeX size={11} />
                      </button>
                      <button onClick={() => deleteMessage(msg)} className="p-0.5 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="px-3 py-1 flex items-center gap-2 border-t text-[11px] text-slate-400"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(34,211,238,0.04)" }}>
          <Reply size={11} className="text-cyan-400 shrink-0" />
          <span>Replying to <span className="text-cyan-400 font-bold">{replyTo.sender_nation_name}</span></span>
          <button onClick={() => setReplyTo(null)} className="ml-auto text-slate-500 hover:text-white">
            <X size={11} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-2 py-2 border-t shrink-0 relative" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {showEmoji && (
          <div className="absolute bottom-full left-2 mb-1 bg-[#0f172a] border border-white/10 rounded-xl p-2 flex flex-wrap gap-1 w-52 shadow-2xl z-20">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => { setInput(i => i + e); setShowEmoji(false); inputRef.current?.focus(); }}
                className="text-lg hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
        )}
        <div className="flex gap-1.5 items-center">
          <button onClick={() => setShowEmoji(s => !s)}
            className="shrink-0 text-base px-1.5 py-1 rounded-lg hover:bg-white/5 transition-colors">😊</button>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={myNation ? `Message #${channel}…` : "Create a nation to chat"}
            disabled={!myNation}
            maxLength={300}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:bg-cyan-500/5 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !myNation || sending}
            className="shrink-0 p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-30 transition-all">
            <Send size={13} />
          </button>
        </div>
        {isMod && (
          <div className="mt-1 flex items-center gap-1">
            <Shield size={9} className="text-orange-400" />
            <span className="text-[9px] text-orange-400/60 ep-mono">Moderator controls active — hover messages to manage</span>
          </div>
        )}
      </div>
    </div>
  );
}