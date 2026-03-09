import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TX_LABELS = {
  war_attack:    { icon: "⚔️", text: (t) => `${t.from_nation_name} launched a military attack on ${t.to_nation_name}`, color: "#f87171" },
  lend_lease:    { icon: "🤝", text: (t) => `${t.from_nation_name} sent aid to ${t.to_nation_name}`, color: "#4ade80" },
  stock_buy:     { icon: "📈", text: (t) => `${t.from_nation_name} acquired ${t.shares || ""} shares of ${t.stock_ticker || "a company"}`, color: "#22d3ee" },
  stock_sell:    { icon: "📉", text: (t) => `${t.from_nation_name} sold ${t.shares || ""} shares of ${t.stock_ticker || "a company"}`, color: "#fb923c" },
  market_crash:  { icon: "💥", text: (t) => `Market collapse in ${t.from_nation_name}`, color: "#f87171" },
  tech_unlock:   { icon: "🔬", text: (t) => `${t.from_nation_name} achieved a technological breakthrough`, color: "#818cf8" },
};

export default function ActivityFeed() {
  const [feed, setFeed] = useState([]);
  const [chatMsgs, setChatMsgs] = useState([]);

  useEffect(() => {
    load();
    const u1 = base44.entities.Transaction.subscribe(() => load());
    const u2 = base44.entities.ChatMessage.subscribe(() => loadChat());
    return () => { u1(); u2(); };
  }, []);

  async function load() {
    try {
      const txs = await base44.entities.Transaction.list("-created_date", 20);
      setFeed(txs);
    } catch {}
    loadChat();
  }

  async function loadChat() {
    try {
      const msgs = await base44.entities.ChatMessage.filter(
        { channel: "global" }, "-created_date", 15
      );
      setChatMsgs(msgs.filter(m => !m.is_deleted));
    } catch {}
  }

  // Merge transactions + chat messages into a unified feed
  const merged = [
    ...feed.map(t => ({ ...t, _type: "tx", _ts: new Date(t.created_date).getTime() })),
    ...chatMsgs.map(m => ({ ...m, _type: "chat", _ts: new Date(m.created_date).getTime() })),
  ].sort((a, b) => b._ts - a._ts).slice(0, 25);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/08"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(4,8,16,0.95) 100%)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/08 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-2">
          <span className="ep-live-dot" />
          <span className="text-[11px] font-black text-white tracking-widest">GLOBAL ACTIVITY FEED</span>
        </div>
        <span className="text-[10px] text-slate-600 ep-mono">live · {merged.length} events</span>
      </div>

      {/* Feed */}
      <div className="divide-y divide-white/04 max-h-[600px] overflow-y-auto">
        {merged.map((item, i) => {
          if (item._type === "tx") {
            const cfg = TX_LABELS[item.type];
            if (!cfg) return null;
            return (
              <div key={`tx-${item.id}`} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base"
                    style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-slate-200 leading-snug">{cfg.text(item)}</div>
                    {item.total_value > 0 && (
                      <div className="text-[10px] ep-mono mt-0.5" style={{ color: cfg.color }}>
                        Value: {item.total_value?.toLocaleString()} credits
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-[9px] text-slate-700 ep-mono">{timeAgo(item.created_date)}</div>
                </div>
              </div>
            );
          }

          if (item._type === "chat") {
            const isAI = item.sender_role === "ai";
            return (
              <div key={`chat-${item.id}`} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${item.sender_color || "#64748b"}20`, border: `1px solid ${item.sender_color || "#64748b"}30` }}>
                    {item.sender_flag || "🏴"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-bold" style={{ color: item.sender_color || "#94a3b8" }}>
                        {item.sender_nation_name}
                      </span>
                      {isAI && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-400 ep-mono font-bold">AI</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">{item.content}</div>
                  </div>
                  <div className="shrink-0 text-[9px] text-slate-700 ep-mono">{timeAgo(item.created_date)}</div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {!merged.length && (
        <div className="text-center py-10 text-slate-600 text-sm ep-mono">No activity yet.</div>
      )}

      {/* Guest CTA */}
      <div className="px-4 py-3 border-t border-white/05 text-center"
        style={{ background: "rgba(0,0,0,0.3)" }}>
        <span className="text-[10px] text-slate-600">
          Want to post? {" "}
          <a href="?page=Onboarding" className="text-cyan-400 hover:underline font-bold">Create your nation →</a>
        </span>
      </div>
    </div>
  );
}