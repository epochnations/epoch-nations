import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { EPOCHS } from "../game/EpochConfig";
import ReactMarkdown from "react-markdown";
import { Send, ChevronDown, ChevronUp, X } from "lucide-react";

function buildAdvisories(nation) {
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const stability   = nation.stability || 0;
  const atWar       = (nation.at_war_with || []).length > 0;
  const incomePerMin   = Math.floor((nation.gdp || 0) * 0.05);
  const spendingPerMin = Math.round(((nation.education_spending || 20) + (nation.military_spending || 20)) * 0.5);

  const raw = [
    atWar && { severity: "critical", system: "Military",  title: "Active War",             summary: "Stability draining −1%/min. Seek ceasefire or boost defense immediately." },
    stability < 50 && { severity: "critical", system: "Domestic", title: "Civil Unrest Imminent", summary: `Stability at ${stability}% — welfare policies urgently needed.` },
    (nation.currency || 0) < 200 && { severity: "critical", system: "Economic", title: "Treasury Critical", summary: "Treasury below 200 — pause military spending to avoid collapse." },
    stability < 70 && stability >= 50 && { severity: "warning", system: "Domestic", title: "Epoch Advance Blocked", summary: `Stability ${stability}% — must reach ≥70% to advance epoch.` },
    (nation.res_food || 0) < 50 && { severity: "warning", system: "Domestic", title: "Food Reserves Low", summary: "Assign more farmers before population drops." },
    (nation.population || 0) >= (nation.housing_capacity || 20) && { severity: "warning", system: "Domestic", title: "Housing Capacity Full", summary: "Population growth is blocked. Build more Houses." },
    (nation.unit_power || 0) < 30 && { severity: "warning", system: "Military", title: "Weak Military", summary: "Build Barracks and research military techs to raise unit power." },
    incomePerMin - spendingPerMin < 50 && { severity: "warning", system: "Economic", title: "Thin Net Income", summary: "Raise GDP or reduce education/military spending." },
    (nation.gdp || 0) < 1000 && { severity: "info", system: "Economic", title: "GDP Growth Opportunity", summary: "Assign more industrial workers to boost GDP output." },
    (nation.allies || []).length === 0 && { severity: "info", system: "Diplomatic", title: "No Allies", summary: "Form alliances via the War Room for shared defense bonuses." },
    (nation.tech_points || 0) < 50 && { severity: "info", system: "Scientific", title: "Slow Tech Progress", summary: "Build Schools or Universities and assign researcher workers." },
    epochIndex < 3 && { severity: "info", system: "Scientific", title: "Early Epoch Tip", summary: "Prioritize School construction for rapid TP gain." },
  ].filter(Boolean);

  const order = { critical: 0, warning: 1, info: 2 };
  return raw.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
}

const SEV = {
  critical: { border: "rgba(239,68,68,0.3)",   bg: "rgba(239,68,68,0.08)",   badge: "rgba(239,68,68,0.2)",    badgeText: "#fca5a5",  dot: "#ef4444" },
  warning:  { border: "rgba(234,179,8,0.3)",   bg: "rgba(234,179,8,0.07)",   badge: "rgba(234,179,8,0.2)",    badgeText: "#fde68a",  dot: "#eab308" },
  info:     { border: "rgba(96,165,250,0.25)", bg: "rgba(96,165,250,0.06)", badge: "rgba(96,165,250,0.2)", badgeText: "#93c5fd", dot: "#60a5fa" },
};

export default function NationalAdvisorPanel({ nation, onClose }) {
  const [collapsed, setCollapsed]   = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [sending, setSending]       = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const bottomRef = useRef(null);
  const unsubRef  = useRef(null);

  useEffect(() => {
    if (!nation?.id || collapsed) return;
    if (!conversation) loadConversation();
  }, [nation?.id, collapsed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversation() {
    setConvLoading(true);
    const conv = await base44.agents.createConversation({
      agent_name: "NationalAdvisor",
      metadata: { name: `${nation?.name} — Strategic Advisor` }
    });
    setConversation(conv);
    setMessages(conv.messages || []);
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = base44.agents.subscribeToConversation(conv.id, data => {
      setMessages(data.messages || []);
    });
    setConvLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  if (!nation) return null;

  const advisories = buildAdvisories(nation);
  const criticalCount = advisories.filter(a => a.severity === "critical").length;
  const warningCount  = advisories.filter(a => a.severity === "warning").length;

  return (
    <div
      className="flex flex-col overflow-hidden transition-all duration-200 rounded-2xl"
      style={{
        height: collapsed ? "auto" : "100%",
        background: "linear-gradient(160deg, rgba(139,92,246,0.06) 0%, rgba(4,8,16,0.97) 50%)",
        border: "1px solid rgba(139,92,246,0.18)",
        backdropFilter: "blur(20px)"
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-white/6 flex items-center justify-between cursor-pointer shrink-0"
        style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.06) 100%)" }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base" style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.7))" }}>⚡</span>
          <span className="text-xs font-black text-white tracking-widest uppercase ep-mono">National Advisor</span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black ep-mono animate-pulse"
              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>
              {criticalCount} CRITICAL
            </span>
          )}
          {criticalCount === 0 && warningCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black ep-mono"
              style={{ background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.4)", color: "#fde68a" }}>
              {warningCount} WARN
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}
          {collapsed
            ? <ChevronDown size={13} className="text-slate-500" />
            : <ChevronUp size={13} className="text-slate-500" />}
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Advisory Feed */}
          <div className="px-3 py-2 space-y-1.5 border-b border-white/5 shrink-0">
            {advisories.length > 0 && advisories.map((a, i) => {
                const s = SEV[a.severity];
                return (
                  <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}`, animation: a.severity === "critical" ? "ep-live-pulse 1.5s infinite" : "none" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{a.title}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded ep-mono"
                          style={{ background: s.badge, color: s.badgeText }}>{a.system}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{a.summary}</p>
                    </div>
                  </div>
                );
              })
            }
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {convLoading ? (
              <div className="flex items-center justify-center h-16">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "rgba(139,92,246,0.6)", borderTopColor: "transparent" }} />
              </div>
            ) : messages.filter(m => m.role !== "system").length === 0 ? (
              <div className="text-center text-slate-600 text-xs pt-4 ep-mono">
                Ask your advisor for strategic guidance...
              </div>
            ) : (
              messages.filter(m => m.role !== "system").map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed"
                    style={msg.role === "user"
                      ? { background: "linear-gradient(135deg, rgba(139,92,246,0.7), rgba(99,102,241,0.6))", color: "white", border: "1px solid rgba(139,92,246,0.4)" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1" }
                    }>
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="ep-prose [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content || "..."}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "#a78bfa", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-white/6 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask your advisor..."
                rows={1}
                className="flex-1 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 resize-none focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.45)"; e.target.style.background = "rgba(139,92,246,0.04)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="p-2 rounded-xl text-white transition-all shrink-0 ep-btn-lift disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 12px rgba(124,58,237,0.4)" }}
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}