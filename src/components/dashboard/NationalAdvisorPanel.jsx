import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { EPOCHS } from "../game/EpochConfig";
import ReactMarkdown from "react-markdown";
import { Send, ChevronDown, ChevronUp, X } from "lucide-react";

const TABS = [
  { id: "economic", label: "Economic", emoji: "💰" },
  { id: "military", label: "Military", emoji: "⚔️" },
  { id: "domestic", label: "Domestic", emoji: "🏛️" },
  { id: "diplomatic", label: "Diplomatic", emoji: "🤝" },
  { id: "scientific", label: "Scientific", emoji: "🔬" },
];

function getLED(value, thresholds) {
  if (value >= thresholds[1]) return "green";
  if (value >= thresholds[0]) return "yellow";
  return "red";
}

function LED({ color }) {
  const colors = {
    green: "bg-green-400 shadow-green-400/60",
    yellow: "bg-yellow-400 shadow-yellow-400/60",
    red: "bg-red-400 shadow-red-400/60 animate-pulse",
  };
  return <div className={`w-2 h-2 rounded-full shadow-md ${colors[color]}`} />;
}

function TabIndicators({ nation }) {
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const stability = nation.stability || 0;
  const pop = nation.population || 1;
  const gdp = nation.gdp || 0;
  const currency = nation.currency || 0;
  const techPts = nation.tech_points || 0;
  const atWar = (nation.at_war_with || []).length > 0;

  return {
    economic: getLED(gdp, [500, 2000]),
    military: atWar ? "red" : getLED(nation.unit_power || 0, [20, 80]),
    domestic: getLED(stability, [50, 75]),
    diplomatic: atWar ? "red" : getLED((nation.allies || []).length, [1, 3]),
    scientific: getLED(epochIndex, [3, 8]),
  };
}

function TabContent({ tab, nation, messages, sending, input, setInput, onSend, convLoading, bottomRef, handleKey }) {
  const epochIndex = Math.max(0, EPOCHS.indexOf(nation.epoch));
  const stability = nation.stability || 0;
  const atWar = (nation.at_war_with || []).length > 0;
  const incomePerMin = Math.floor((nation.gdp || 0) * 0.05);
  const spendingPerMin = Math.round(((nation.education_spending || 20) + (nation.military_spending || 20)) * 0.5);

  const recommendations = {
    economic: [
      incomePerMin - spendingPerMin < 50 && "⚠ Net income is low — raise GDP or reduce spending",
      (nation.gdp || 0) < 1000 && "💡 Assign more industrial workers to boost GDP",
      (nation.currency || 0) < 500 && "🚨 Treasury critically low — pause military spending",
    ].filter(Boolean),
    military: [
      atWar && "⚔️ ACTIVE WAR — stability draining −1%/min",
      (nation.unit_power || 0) < 30 && "🏹 Unit power is weak — build Barracks and research military techs",
      (nation.defense_level || 0) < 20 && "🛡️ Defense is low — consider Defense Lab",
    ].filter(Boolean),
    domestic: [
      stability < 70 && `🔴 Stability ${stability}% — EPOCH ADVANCE BLOCKED until ≥70%`,
      stability < 50 && "🚨 CRITICAL: Civil unrest likely — welfare policies urgently needed",
      (nation.res_food || 0) < 50 && "🌾 Food reserves critical — assign more farmers",
      (nation.population || 0) >= (nation.housing_capacity || 20) && "🏠 Housing full — build more Houses to grow population",
    ].filter(Boolean),
    diplomatic: [
      atWar && "⚔️ WAR ACTIVE: Alliance formation is harder. Seek ceasefire first.",
      (nation.allies || []).length === 0 && "🤝 No allies — form alliances via the War Room for shared defense",
      epochIndex > 5 && (nation.allies || []).length < 2 && "📡 Dominant nations attract coalition threats. Build alliances.",
    ].filter(Boolean),
    scientific: [
      (nation.tech_points || 0) < 50 && "🔬 TP generation is slow — build Schools/Universities",
      epochIndex < 3 && "📚 Early epochs: prioritize School construction for rapid TP gain",
      epochIndex >= 8 && "🚀 Late-game: University clusters + researcher workers = fastest TP",
    ].filter(Boolean),
  };

  const recs = recommendations[tab] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Live Recommendations */}
      {recs.length > 0 && (
        <div className="px-3 py-2 space-y-1.5 border-b border-white/5">
          {recs.map((r, i) => (
            <div key={i} className="text-xs text-slate-300 bg-white/5 rounded-lg px-3 py-1.5 leading-relaxed">
              {r}
            </div>
          ))}
        </div>
      )}
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {convLoading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.filter(m => m.role !== "system").length === 0 ? (
          <div className="text-center text-slate-600 text-xs pt-4 px-3">
            Ask your advisor about {tab} matters...
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
              <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
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
            placeholder={`Ask about ${tab} strategy...`}
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-400/50 resize-none"
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || sending}
            className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 transition-all shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NationalAdvisorPanel({ nation }) {
  const [activeTab, setActiveTab] = useState("economic");
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const bottomRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!nation?.id || collapsed) return;
    loadConversation(activeTab);
  }, [activeTab, nation?.id, collapsed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversation(tab) {
    if (conversations[tab]) {
      const conv = conversations[tab];
      setMessages(conv.messages || []);
      subscribeToConv(conv.id);
      return;
    }
    setConvLoading(true);
    const conv = await base44.agents.createConversation({
      agent_name: "NationalAdvisor",
      metadata: { name: `${nation?.name} — ${tab} advisor` }
    });
    setConversations(prev => ({ ...prev, [tab]: conv }));
    setMessages(conv.messages || []);
    subscribeToConv(conv.id);
    setConvLoading(false);
  }

  function subscribeToConv(convId) {
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = base44.agents.subscribeToConversation(convId, data => {
      setMessages(data.messages || []);
    });
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const conv = conversations[activeTab];
    if (!conv) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const context = `[Tab: ${activeTab}] [Nation: ${nation?.name}, Epoch: ${nation?.epoch}, GDP: ${nation?.gdp}, Stability: ${nation?.stability}%, Treasury: ${nation?.currency}] `;
    await base44.agents.addMessage(conv, { role: "user", content: context + text });
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  if (!nation) return null;
  const indicators = TabIndicators({ nation });

  return (
    <div
      className="flex flex-col backdrop-blur-xl bg-[#0a0f1e]/90 border border-white/10 rounded-2xl overflow-hidden"
      style={{ height: collapsed ? "auto" : "100%", minHeight: collapsed ? 0 : 0 }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-white/10 flex items-center justify-between cursor-pointer shrink-0 bg-gradient-to-r from-violet-900/30 to-blue-900/30"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <span className="text-xs font-bold text-white tracking-wide uppercase">National Advisor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {TABS.map(t => <LED key={t.id} color={indicators[t.id]} />)}
          </div>
          {collapsed ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-white/10 shrink-0 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-violet-400 text-violet-300 bg-violet-500/10"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <LED color={indicators[tab.id]} />
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            <TabContent
              tab={activeTab}
              nation={nation}
              messages={messages}
              sending={sending}
              input={input}
              setInput={setInput}
              onSend={sendMessage}
              convLoading={convLoading}
              bottomRef={bottomRef}
              handleKey={handleKey}
            />
          </div>
        </>
      )}
    </div>
  );
}