import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, X, Send, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AdvisorPanel({ nation }) {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConv, setCurrentConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && !currentConv) initConversation();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentConv?.id) return;
    const unsub = base44.agents.subscribeToConversation(currentConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [currentConv?.id]);

  async function initConversation() {
    setLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "NationalAdvisor",
        metadata: { name: `${nation?.name || "Nation"} Advisor Session` }
      });
      setCurrentConv(conv);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error("Advisor init error:", e);
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || !currentConv || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(currentConv, { role: "user", content: text });
    } catch (e) {
      console.error("Advisor send error:", e);
    }
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/30 flex items-center justify-center hover:scale-110 transition-all lg:bottom-6"
        title="National Advisor"
      >
        <Bot size={22} className="text-white" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[100] w-80 sm:w-96 h-[480px] backdrop-blur-xl bg-[#0f172a]/95 border border-violet-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 shrink-0 bg-gradient-to-r from-violet-900/50 to-blue-900/50">
            <Bot size={16} className="text-violet-400" />
            <div className="flex-1">
              <div className="text-sm font-bold text-white">National Advisor</div>
              <div className="text-xs text-slate-400">{nation?.name || "Your Nation"}</div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={14} className="text-slate-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-slate-500 text-xs mt-8 px-4">
                <Bot size={28} className="mx-auto mb-2 text-violet-500/50" />
                <p>Your Advisor awaits. Ask about your economy, military, epoch advancement, or market strategy.</p>
                <div className="mt-4 space-y-2">
                  {["What should I focus on next?", "How do I advance my epoch?", "Analyze my stock market position"].map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.filter(m => m.role !== "system").map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role !== "user" && (
                    <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <Bot size={12} className="text-violet-400" />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600/80 text-white"
                      : "bg-white/8 border border-white/10 text-slate-200"
                  }`}>
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        className="prose prose-xs prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0"
                      >
                        {msg.content || "..."}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center mr-2 shrink-0">
                  <Bot size={12} className="text-violet-400" />
                </div>
                <div className="bg-white/8 border border-white/10 rounded-2xl px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask your advisor..."
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-400/50 resize-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 transition-all shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}