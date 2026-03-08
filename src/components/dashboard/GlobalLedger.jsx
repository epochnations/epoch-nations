import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Swords, Package, Cpu, AlertTriangle, Activity } from "lucide-react";

const TYPE_CONFIG = {
  stock_buy:    { icon: TrendingUp,    color: "#4ade80",  label: "BUY",   glow: "rgba(74,222,128,0.15)" },
  stock_sell:   { icon: TrendingDown,  color: "#f87171",  label: "SELL",  glow: "rgba(248,113,113,0.15)" },
  lend_lease:   { icon: Package,       color: "#60a5fa",  label: "AID",   glow: "rgba(96,165,250,0.15)" },
  war_attack:   { icon: Swords,        color: "#fb923c",  label: "WAR",   glow: "rgba(251,146,60,0.15)" },
  market_crash: { icon: AlertTriangle, color: "#ef4444",  label: "CRASH", glow: "rgba(239,68,68,0.2)" },
  tech_unlock:  { icon: Cpu,           color: "#a78bfa",  label: "TECH",  glow: "rgba(167,139,250,0.15)" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export default function GlobalLedger() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
    const unsub = base44.entities.Transaction.subscribe(() => loadTransactions());
    return unsub;
  }, []);

  async function loadTransactions() {
    const data = await base44.entities.Transaction.list("-created_date", 60);
    const cutoff = Date.now() - 30 * 60 * 1000;
    setTransactions(data.filter(tx => new Date(tx.created_date).getTime() > cutoff));
  }

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(160deg, rgba(4,8,16,0.97) 0%, rgba(139,92,246,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)"
      }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/6 flex items-center gap-2 shrink-0"
        style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.08) 0%, transparent 100%)" }}>
        <Activity size={13} className="text-violet-400" />
        <span className="text-xs font-black text-slate-200 tracking-widest uppercase">Global Activities</span>
        <span className="ml-auto text-[10px] text-slate-600 ep-mono">last 30 min</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-white/4">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-600 text-xs ep-mono">No activity in the last 30 minutes</div>
        ) : (
          transactions.map((tx, idx) => {
            const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.stock_buy;
            const Icon = cfg.icon;
            return (
              <div
                key={tx.id}
                className="px-3.5 py-2.5 flex items-center gap-3 transition-all duration-150 min-w-0"
                style={{ animationDelay: `${idx * 0.03}s` }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Icon badge */}
                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: cfg.glow, border: `1px solid ${cfg.color}33` }}>
                  <Icon size={11} style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-nowrap">
                    <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded ep-mono"
                      style={{ background: cfg.glow, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-300 truncate">{tx.description || tx.from_nation_name}</span>
                  </div>
                  {tx.total_value > 0 && (
                    <div className="text-[10px] ep-mono text-slate-500 mt-0.5">{tx.total_value.toFixed(0)} cr</div>
                  )}
                </div>

                <div className="text-[10px] text-slate-600 ep-mono shrink-0">{timeAgo(tx.created_date)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}