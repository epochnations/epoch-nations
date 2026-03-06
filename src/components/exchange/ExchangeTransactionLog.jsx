import { useState, useEffect, useRef } from "react";
import { Activity } from "lucide-react";

const TX_TYPE = {
  stock_buy:     { icon: "📈", label: "BUY",     color: "text-green-400" },
  stock_sell:    { icon: "📉", label: "SELL",     color: "text-red-400" },
  lend_lease:    { icon: "🤝", label: "AID",      color: "text-blue-400" },
  war_attack:    { icon: "⚔️", label: "WAR",      color: "text-orange-400" },
  market_crash:  { icon: "💥", label: "CRASH",    color: "text-red-500" },
  tech_unlock:   { icon: "🔬", label: "TECH",     color: "text-violet-400" },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function ExchangeTransactionLog({ transactions }) {
  const [expanded, setExpanded] = useState(false);
  const logRef = useRef(null);

  const recent = transactions.slice(0, expanded ? 40 : 8);

  return (
    <div className={`border-t border-white/10 bg-black/60 backdrop-blur-xl shrink-0 transition-all duration-300 ${expanded ? "h-48" : "h-28"}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">High-Speed Transaction Log</span>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          {expanded ? "Collapse ▼" : "Expand ▲"}
        </button>
      </div>
      <div ref={logRef} className="overflow-y-auto h-full pb-8 px-4 pt-1 space-y-0.5">
        {recent.length === 0 && (
          <div className="text-xs text-slate-700 py-3 text-center">No recent transactions</div>
        )}
        {recent.map((tx, i) => {
          const cfg = TX_TYPE[tx.type] || { icon: "📋", label: tx.type?.toUpperCase(), color: "text-slate-400" };
          return (
            <div
              key={tx.id}
              className="flex items-center gap-2 py-1 text-xs border-b border-white/3 animate-fadeIn"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <span className="text-sm leading-none shrink-0">{cfg.icon}</span>
              <span className={`font-bold font-mono shrink-0 w-10 ${cfg.color}`}>{cfg.label}</span>
              <span className="text-slate-400 flex-1 truncate">{tx.description || `${tx.from_nation_name} · ${tx.stock_ticker || ""}`}</span>
              {tx.total_value > 0 && (
                <span className="font-mono text-slate-300 shrink-0">{Math.round(tx.total_value).toLocaleString()} cr</span>
              )}
              <span className="text-slate-700 shrink-0 whitespace-nowrap font-mono">{timeAgo(tx.created_date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}