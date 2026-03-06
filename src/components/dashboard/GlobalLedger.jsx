import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ScrollText, TrendingUp, TrendingDown, Swords, Package, Cpu, AlertTriangle } from "lucide-react";

const TYPE_CONFIG = {
  stock_buy: { icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10", label: "BUY" },
  stock_sell: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-400/10", label: "SELL" },
  lend_lease: { icon: Package, color: "text-blue-400", bg: "bg-blue-400/10", label: "AID" },
  war_attack: { icon: Swords, color: "text-orange-400", bg: "bg-orange-400/10", label: "WAR" },
  market_crash: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", label: "CRASH" },
  tech_unlock: { icon: Cpu, color: "text-violet-400", bg: "bg-violet-400/10", label: "TECH" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function GlobalLedger() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
    const unsub = base44.entities.Transaction.subscribe(() => loadTransactions());
    return unsub;
  }, []);

  async function loadTransactions() {
    const data = await base44.entities.Transaction.list("-created_date", 50);
    // Filter to last 30 minutes
    const cutoff = Date.now() - 30 * 60 * 1000;
    setTransactions(data.filter(tx => new Date(tx.created_date).getTime() > cutoff));
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl h-full flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
        <ScrollText size={14} className="text-cyan-400" />
        <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Global Activities</span>
        <span className="ml-auto text-xs text-slate-600">last 30 min</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-white/5">
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">No transactions in the last 30 minutes</div>
        ) : (
          transactions.map((tx) => {
            const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.stock_buy;
            const Icon = cfg.icon;
            return (
              <div key={tx.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors min-w-0">
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                  <Icon size={12} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-nowrap">
                    <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-white whitespace-nowrap overflow-hidden text-ellipsis">{tx.description || tx.from_nation_name}</span>
                    {tx.total_value > 0 && (
                      <span className="shrink-0 text-xs font-mono text-slate-400 ml-auto">{tx.total_value.toFixed(0)} cr</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-600 shrink-0 whitespace-nowrap ml-2">{timeAgo(tx.created_date)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}