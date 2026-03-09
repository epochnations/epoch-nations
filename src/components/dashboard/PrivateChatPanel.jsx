import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send, MessageCircle, ChevronLeft } from "lucide-react";

function makeRoomId(idA, idB) {
  return [idA, idB].sort().join("_");
}

function timeStr(d) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function PrivateChatPanel({ myNation, initialTarget, onClose }) {
  const [rooms, setRooms]       = useState([]); // { nation, lastMsg }
  const [activeRoom, setActiveRoom] = useState(null); // { nationId, nationName, flag, color }
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Build rooms list from received + sent messages
  const loadRooms = useCallback(async () => {
    if (!myNation) return;
    const sent     = await base44.entities.PrivateMessage.filter({ sender_nation_id: myNation.id });
    const received = await base44.entities.PrivateMessage.filter({ recipient_nation_id: myNation.id });
    const all = [...sent, ...received];

    const seen = {};
    for (const m of all) {
      const otherId   = m.sender_nation_id === myNation.id ? m.recipient_nation_id : m.sender_nation_id;
      const otherName = m.sender_nation_id === myNation.id ? m.recipient_nation_name : m.sender_nation_name;
      const otherFlag = m.sender_nation_id === myNation.id ? (m.recipient_flag || "🏴") : (m.sender_flag || "🏴");
      const otherColor= m.sender_nation_id === myNation.id ? (m.recipient_color || "#64748b") : (m.sender_color || "#64748b");
      if (!seen[otherId] || new Date(m.created_date) > new Date(seen[otherId].lastMsg.created_date)) {
        seen[otherId] = { nationId: otherId, nationName: otherName, flag: otherFlag, color: otherColor, lastMsg: m };
      }
    }
    setRooms(Object.values(seen).sort((a, b) => new Date(b.lastMsg.created_date) - new Date(a.lastMsg.created_date)));
  }, [myNation?.id]);

  useEffect(() => {
    loadRooms();
    const unsub = base44.entities.PrivateMessage.subscribe(() => {
      loadRooms();
      if (activeRoom) loadMessages(activeRoom.nationId);
    });
    return unsub;
  }, [loadRooms]);

  // Open initial target if passed
  useEffect(() => {
    if (initialTarget) openRoom(initialTarget);
  }, [initialTarget?.nationId]);

  const loadMessages = useCallback(async (otherId) => {
    if (!myNation || !otherId) return;
    const roomId = makeRoomId(myNation.id, otherId);
    const msgs = await base44.entities.PrivateMessage.filter({ room_id: roomId }, "created_date", 100);
    setMessages(msgs);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [myNation?.id]);

  function openRoom(target) {
    setActiveRoom(target);
    loadMessages(target.nationId);
    inputRef.current?.focus();
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || !myNation || !activeRoom || sending) return;
    setSending(true);
    const roomId = makeRoomId(myNation.id, activeRoom.nationId);
    await base44.entities.PrivateMessage.create({
      room_id: roomId,
      sender_nation_id: myNation.id,
      sender_nation_name: myNation.name,
      sender_flag: myNation.flag_emoji || "🏴",
      sender_color: myNation.flag_color || "#3b82f6",
      recipient_nation_id: activeRoom.nationId,
      recipient_nation_name: activeRoom.nationName,
      content: text,
    });
    setInput("");
    setSending(false);
    await loadMessages(activeRoom.nationId);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        width: 340, height: 480,
        background: "linear-gradient(160deg, rgba(6,182,212,0.06) 0%, rgba(4,8,16,0.98) 100%)",
        border: "1px solid rgba(6,182,212,0.2)",
        backdropFilter: "blur(24px)",
      }}>

      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)" }}>
        {activeRoom && (
          <button onClick={() => setActiveRoom(null)} className="p-1 text-slate-500 hover:text-white transition-colors">
            <ChevronLeft size={13} />
          </button>
        )}
        <MessageCircle size={11} className="text-cyan-400 shrink-0" />
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ep-mono flex-1">
          {activeRoom ? (
            <span className="flex items-center gap-1">
              <span>{activeRoom.flag}</span>
              <span style={{ color: activeRoom.color }}>{activeRoom.nationName}</span>
            </span>
          ) : "Private Messages"}
        </span>
        <button onClick={onClose} className="p-1 text-slate-600 hover:text-white transition-colors">
          <X size={12} />
        </button>
      </div>

      {/* Room list or message thread */}
      {!activeRoom ? (
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 && (
            <div className="text-center text-slate-700 text-xs ep-mono mt-16 px-4">
              No private conversations yet.<br />Use @NationName in chat to start one.
            </div>
          )}
          {rooms.map(r => (
            <button key={r.nationId} onClick={() => openRoom(r)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors border-b text-left"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <span className="text-lg shrink-0">{r.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold" style={{ color: r.color }}>{r.nationName}</div>
                <div className="text-[10px] text-slate-600 truncate">{r.lastMsg.content}</div>
              </div>
              <div className="text-[9px] text-slate-700 ep-mono shrink-0">{timeStr(r.lastMsg.created_date)}</div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
            {messages.length === 0 && (
              <div className="text-center text-slate-700 text-xs ep-mono mt-12">Start the conversation...</div>
            )}
            {messages.map(m => {
              const isMe = m.sender_nation_id === myNation?.id;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    {!isMe && (
                      <div className="text-[10px] font-bold mb-0.5" style={{ color: m.sender_color }}>
                        {m.sender_flag} {m.sender_nation_name}
                      </div>
                    )}
                    <div className="px-2.5 py-1.5 rounded-xl text-[12px] leading-relaxed"
                      style={{
                        background: isMe ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isMe ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.08)"}`,
                        color: isMe ? "#e0f7fa" : "#cbd5e1",
                      }}>
                      {m.content}
                    </div>
                    <div className={`text-[9px] text-slate-700 ep-mono mt-0.5 ${isMe ? "text-right" : ""}`}>
                      {timeStr(m.created_date)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-2 py-2 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex gap-1.5 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${activeRoom.nationName}…`}
                maxLength={400}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all"
                style={{ color: "#000000", background: "#ffffff" }}
              />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="shrink-0 p-1.5 rounded-xl border transition-all disabled:opacity-25"
                style={{ background: "rgba(34,211,238,0.12)", borderColor: "rgba(34,211,238,0.2)", color: "#22d3ee" }}>
                <Send size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}