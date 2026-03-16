import { useState } from "react";
import { X, Landmark, CreditCard, PiggyBank, FileText, ChevronRight, Shield, Building2 } from "lucide-react";
import CheckingTab from "./CheckingTab.jsx";
import SavingsTab from "./SavingsTab.jsx";
import LoansTab from "./LoansTab.jsx";

const TABS = [
  { id: "checking", label: "Checking", icon: CreditCard, color: "#22d3ee", desc: "Manage daily transactions & wire transfers" },
  { id: "savings",  label: "Savings",  icon: PiggyBank,  color: "#fbbf24", desc: "Earn 2% APY on your deposits" },
  { id: "loans",    label: "Loans",    icon: FileText,   color: "#a78bfa", desc: "Apply for loans & manage debt" },
];

// Generate a deterministic account number from nation id
function accountNumber(nationId = "") {
  const h = nationId.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffffff, 0);
  const n = String(h).padStart(8, "0");
  return `****  ****  ${n.slice(0, 4)}  ${n.slice(4)}`;
}

function memberSince(createdDate) {
  if (!createdDate) return "2025";
  return new Date(createdDate).getFullYear();
}

export default function BankingPanel({ nation, onClose, onRefresh }) {
  const [tab, setTab] = useState(null); // null = home, or "checking" | "savings" | "loans"

  const checking = nation.currency || 0;
  const savings  = nation.savings_balance || 0;
  const acct     = accountNumber(nation.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[95vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(160deg, #0a0f1e 0%, #060b14 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Bank Header ── */}
        <div className="shrink-0" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.08) 100%)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0891b2, #1e40af)", boxShadow: "0 4px 20px rgba(8,145,178,0.4)" }}>
                  <Building2 size={22} className="text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-[0.25em] uppercase text-cyan-400/80 ep-mono">Epoch Nations</div>
                  <div className="text-xl font-black text-white tracking-tight">National Bank</div>
                  <div className="text-xs text-slate-500">Online Banking Portal</div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-500 hover:text-white mt-1">
                <X size={16} />
              </button>
            </div>

            {/* Account Summary Card */}
            <div className="mt-4 rounded-2xl p-4 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="text-[10px] text-slate-500 ep-mono uppercase tracking-widest mb-0.5">Account Holder</div>
                  <div className="text-base font-black text-white">{nation.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{nation.leader || "National Treasury"}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 ep-mono uppercase tracking-widest mb-0.5">Member Since</div>
                  <div className="text-sm font-bold text-slate-300">{memberSince(nation.created_date)}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
                <div className="text-[11px] ep-mono text-slate-500">{acct}</div>
                <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                  <Shield size={9} /> SECURE
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 relative z-10">
                <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
                  <div className="text-[9px] text-slate-500 uppercase ep-mono">Checking Balance</div>
                  <div className="text-lg font-black text-cyan-400 ep-mono">{checking.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div className="text-[10px] text-slate-500">{nation.currency_name || "Credits"}</div>
                </div>
                <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <div className="text-[9px] text-slate-500 uppercase ep-mono">Savings Balance</div>
                  <div className="text-lg font-black text-amber-400 ep-mono">{savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div className="text-[10px] text-slate-500">{nation.currency_name || "Credits"}</div>
                </div>
              </div>
            </div>

            {/* Tab selector */}
            {!tab && (
              <div className="mt-4 text-[11px] text-slate-500 text-center">Select an account to continue</div>
            )}
          </div>

          {/* Tab Buttons */}
          <div className="flex px-6 pb-0 gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex flex-col items-center gap-1 px-3 py-2.5 transition-all rounded-t-xl"
                style={{
                  background: tab === t.id ? "rgba(255,255,255,0.06)" : "transparent",
                  borderTop: tab === t.id ? `1px solid ${t.color}40` : "1px solid transparent",
                  borderLeft: tab === t.id ? `1px solid ${t.color}20` : "1px solid transparent",
                  borderRight: tab === t.id ? `1px solid ${t.color}20` : "1px solid transparent",
                  borderBottom: tab === t.id ? "1px solid rgba(10,15,30,1)" : "1px solid transparent",
                  marginBottom: tab === t.id ? "-1px" : "0",
                }}>
                <t.icon size={14} style={{ color: tab === t.id ? t.color : "#64748b" }} />
                <span className="text-[11px] font-bold" style={{ color: tab === t.id ? t.color : "#64748b" }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto">
          {!tab && (
            <div className="p-6 space-y-3">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01] group"
                  style={{ background: `${t.color}08`, border: `1px solid ${t.color}20` }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${t.color}18`, border: `1px solid ${t.color}30` }}>
                    <t.icon size={18} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm group-hover:text-white">{t.label} Account</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {tab && (
            <div className="p-6">
              {/* Tab Back + Title */}
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setTab(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-500 hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                {(() => {
                  const t = TABS.find(x => x.id === tab);
                  return (
                    <div className="flex items-center gap-2">
                      <t.icon size={14} style={{ color: t.color }} />
                      <span className="font-bold text-white text-sm">{t.label} Account</span>
                      <span className="text-xs text-slate-500">— {nation.name}</span>
                    </div>
                  );
                })()}
              </div>

              {tab === "checking" && <CheckingTab nation={nation} onRefresh={onRefresh} />}
              {tab === "savings"  && <SavingsTab  nation={nation} onRefresh={onRefresh} />}
              {tab === "loans"    && <LoansTab    nation={nation} onRefresh={onRefresh} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}