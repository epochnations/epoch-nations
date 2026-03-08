import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Activity } from "lucide-react";

const TYPE_META = {
  stock_buy:    { emoji: "📈", color: "#4ade80", label: "Buy" },
  stock_sell:   { emoji: "📉", color: "#f87171", label: "Sell" },
  lend_lease:   { emoji: "🤝", color: "#22d3ee", label: "Aid" },
  war_attack:   { emoji: "⚔️", color: "#ef4444", label: "War" },
  market_crash: { emoji: "💥", color: "#f97316", label: "Crash" },
  tech_unlock:  { emoji: "🔬", color: "#a78bfa", label: "Tech" },
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
    base44.entities.Transaction.list("-created_date", 30).then(setTransactions);
    const unsub = base44.entities.Transaction.subscribe(() => {
      base44.entities.Transaction.list("-created_date", 30).then(setTransactions);
    });
    return unsub;
  }, []);

  return (
    <div className="h-full rounded-2xl flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, rgba(6,182,212,0.04) 0%, rgba(4,8,16,0.98) 60%)", border: "1px solid rgba(6,182,212,0.1)", backdropFilter: "blur(20px)" }}>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/5 shrink-0 flex items-center gap-2"
        style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.08) 0%, transparent 100%)" }}>
        <Activity size={11} className="text-cyan-400" />
        <span className="text-[10px] font-black text-white tracking-widest uppercase ep-mono">Global Ledger</span>
        <span className="ep-live-dot ml-auto" />
      </div>

      {/* Transactions */}
      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs ep-mono">No activity yet</div>
        ) : transactions.map(tx => {
          const meta = TYPE_META[tx.type] || { emoji: "📋", color: "#94a3b8", label: tx.type };
          return (
            <div key={tx.id} className="flex items-center gap-2.5 px-3 py-2 border-b hover:bg-white/5 transition-all"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-sm"
                style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white truncate leading-tight">
                  {tx.description || `${tx.from_nation_name} — ${meta.label}`}
                </div>
                <div className="text-[9px] text-slate-600 ep-mono">{tx.from_nation_name}</div>
              </div>
              <div className="text-right shrink-0">
                {tx.total_value != null && (
                  <div className="text-[10px] font-bold ep-mono" style={{ color: meta.color }}>
                    {tx.type === "stock_sell" ? "-" : "+"}₵{Math.abs(tx.total_value).toFixed(0)}
                  </div>
                )}
                <div className="text-[9px] text-slate-600 ep-mono">{timeAgo(tx.created_date)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}