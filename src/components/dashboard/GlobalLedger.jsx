import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const TYPE_CONFIG = {
  stock_buy:    { label: "Buy",       color: "#4ade80", bg: "rgba(74,222,128,0.1)",  icon: "📈" },
  stock_sell:   { label: "Sell",      color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: "📉" },
  lend_lease:   { label: "Lend",      color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  icon: "🤝" },
  war_attack:   { label: "War",       color: "#fb923c", bg: "rgba(251,146,60,0.1)",  icon: "⚔️" },
  market_crash: { label: "Crash",     color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "💥" },
  tech_unlock:  { label: "Tech",      color: "#34d399", bg: "rgba(52,211,153,0.1)",  icon: "🔬" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function GlobalLedger() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTx();
    const unsub = base44.entities.Transaction.subscribe(() => loadTx());
    return unsub;
  }, []);

  async function loadTx() {
    const data = await base44.entities.Transaction.list("-created_date", 30);
    setTransactions(data);
  }

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(96,165,250,0.05) 0%, rgba(4,8,16,0.97) 60%)",
        border: "1px solid rgba(96,165,250,0.12)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0 flex items-center gap-2"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(90deg, rgba(96,165,250,0.08) 0%, transparent 100%)" }}>
        <span className="ep-live-dot" />
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ep-mono">Global Activity</span>
        <span className="ml-auto text-[10px] text-slate-600 ep-mono">{transactions.length} events</span>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto divide-y" style={{ divideColor: "rgba(255,255,255,0.04)" }}>
        {transactions.length === 0 && (
          <div className="flex items-center justify-center h-16 text-slate-600 text-xs ep-mono">No activity yet</div>
        )}
        {transactions.map(tx => {
          const cfg = TYPE_CONFIG[tx.type] || { label: tx.type, color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: "📋" };
          return (
            <div key={tx.id} className="px-3 py-2 flex items-start gap-2 hover:bg-white/5 transition-colors">
              {/* Type badge */}
              <div className="shrink-0 mt-0.5 w-10 text-center rounded-lg px-1 py-0.5"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                <span className="text-[9px] font-black ep-mono" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-white font-semibold truncate">
                  {tx.description || `${tx.from_nation_name} → ${tx.to_nation_name || "—"}`}
                </div>
                <div className="text-[10px] text-slate-500 ep-mono">
                  {tx.from_nation_name}
                  {tx.total_value ? <span style={{ color: cfg.color }}> · {tx.total_value.toLocaleString()} cr</span> : null}
                </div>
              </div>

              {/* Time */}
              <div className="shrink-0 text-[10px] text-slate-600 ep-mono">{timeAgo(tx.created_date)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}