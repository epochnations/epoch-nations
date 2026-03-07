import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { EPOCHS } from "../game/EpochConfig";
import ReactMarkdown from "react-markdown";
import { Send, ChevronDown, ChevronUp } from "lucide-react";

// ── Advisory logic (preserved from original) ──────────────────────────────────
function buildAdvisories(nation) {
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const stability   = nation.stability || 0;
  const atWar       = (nation.at_war_with || []).length > 0;
  const incomePerMin   = Math.floor((nation.gdp || 0) * 0.05);
  const spendingPerMin = Math.round(((nation.education_spending || 20) + (nation.military_spending || 20)) * 0.5);

  const raw = [
    // Critical
    atWar && {
      severity: "critical", system: "Military",
      title: "Active War",
      summary: "Stability draining −1%/min. Seek ceasefire or boost defense immediately.",
    },
    stability < 50 && {
      severity: "critical", system: "Domestic",
      title: "Civil Unrest Imminent",
      summary: `Stability at ${stability}% — welfare policies urgently needed.`,
    },
    (nation.currency || 0) < 200 && {
      severity: "critical", system: "Economic",
      title: "Treasury Critical",
      summary: "Treasury below 200 — pause military spending to avoid collapse.",
    },
    // Warnings
    stability < 70 && stability >= 50 && {
      severity: "warning", system: "Domestic",
      title: "Epoch Advance Blocked",
      summary: `Stability ${stability}% — must reach ≥70% to advance epoch.`,
    },
    (nation.res_food || 0) < 50 && {
      severity: "warning", system: "Domestic",
      title: "Food Reserves Low",
      summary: "Assign more farmers before population drops.",
    },
    (nation.population || 0) >= (nation.housing_capacity || 20) && {
      severity: "warning", system: "Domestic",
      title: "Housing Capacity Full",
      summary: "Population growth is blocked. Build more Houses.",
    },
    (nation.unit_power || 0) < 30 && {
      severity: "warning", system: "Military",
      title: "Weak Military",
      summary: "Build Barracks and research military techs to raise unit power.",
    },
    (nation.defense_level || 0) < 20 && {
      severity: "warning", system: "Military",
      title: "Low Defense",
      summary: "Consider building a Defense Lab.",
    },
    incomePerMin - spendingPerMin < 50 && {
      severity: "warning", system: "Economic",
      title: "Thin Net Income",
      summary: "Raise GDP or reduce education/military spending.",
    },
    // Info
    (nation.gdp || 0) < 1000 && {
      severity: "info", system: "Economic",
      title: "GDP Growth Opportunity",
      summary: "Assign more industrial workers to boost GDP output.",
    },
    (nation.allies || []).length === 0 && {
      severity: "info", system: "Diplomatic",
      title: "No Allies",
      summary: "Form alliances via the War Room for shared defense bonuses.",
    },
    epochIndex > 5 && (nation.allies || []).length < 2 && {
      severity: "info", system: "Diplomatic",
      title: "Coalition Risk",
      summary: "Dominant nations attract coalition threats. Build alliances now.",
    },
    (nation.tech_points || 0) < 50 && {
      severity: "info", system: "Scientific",
      title: "Slow Tech Progress",
      summary: "Build Schools or Universities and assign researcher workers.",
    },
    epochIndex < 3 && {
      severity: "info", system: "Scientific",
      title: "Early Epoch Tip",
      summary: "Prioritize School construction for rapid TP gain.",
    },
  ].filter(Boolean);

  // Sort: critical → warning → info
  const order = { critical: 0, warning: 1, info: 2 };
  return raw.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
}

const SEV = {
  critical: { border: "border-red-500/40",   bg: "bg-red-500/10",   badge: "bg-red-500/20 text-red-300",    dot: "bg-red-400 animate-pulse" },
  warning:  { border: "border-yellow-500/40", bg: "bg-yellow-500/8", badge: "bg-yellow-500/20 text-yellow-300", dot: "bg-yellow-400" },
  info:     { border: "border-blue-500/30",   bg: "bg-blue-500/8",   badge: "bg-blue-500/20 text-blue-300",  dot: "bg-blue-400" },
};

export default function NationalAdvisorPanel({ nation }) {
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
    const context = `[Nation: ${nation?.name}, Epoch: ${nation?.epoch}, GDP: ${nation?.gdp}, Stability: ${nation?.stability}%, Treasury: ${nation?.currency}] `;
    await base44.agents.addMessage(conversation, { role: "user", content: context + text });
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
      className="flex flex-col backdrop-blur-xl bg-[#0a0f1e]/90 border border-white/10 rounded-2xl overflow-hidden transition-all duration-200"
      style={{ height: collapsed ? "auto" : "100%" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center justify-between cursor-pointer shrink-0 bg-gradient-to-r from-violet-900/30 to-blue-900/30"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <span className="text-xs font-bold text-white tracking-wide uppercase">National Advisor</span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 animate-pulse">
              {criticalCount} CRITICAL
            </span>
          )}
          {criticalCount === 0 && warningCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300">
              {warningCount} WARNING
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {advisories.slice(0, 5).map((a, i) => (
              <div key={i} className={`w-2 h-2 rounded-full shadow-md ${SEV[a.severity].dot}`} />
            ))}
          </div>
          {collapsed
            ? <ChevronDown size={14} className="text-slate-400" />
            : <ChevronUp size={14} className="text-slate-400" />}
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Advisory Feed */}
          <div className="px-3 py-2.5 space-y-2 border-b border-white/5 shrink-0">
            {advisories.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-2">All systems nominal ✓</div>
            ) : (
              advisories.map((a, i) => {
                const s = SEV[a.severity];
                return (
                  <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 ${s.border} ${s.bg}`}>
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{a.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.badge}`}>{a.system}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{a.summary}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {convLoading ? (
              <div className="flex items-center justify-center h-16">
                <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.filter(m => m.role !== "system").length === 0 ? (
              <div className="text-center text-slate-600 text-xs pt-3">
                Ask your advisor for strategic guidance...
              </div>
            ) : (
              messages.filter(m => m.role !== "system").map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600/80 text-white"
                      : "bg-white/8 border border-white/10 text-slate-200"
                  }`}>
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="prose prose-xs prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-0.5">
                        {msg.content || "..."}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white/8 border border-white/10 rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-white/10 shrink-0">
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
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}