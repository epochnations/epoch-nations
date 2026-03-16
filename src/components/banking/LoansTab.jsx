/**
 * LoansTab — View and apply for loans from the National Bank.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const LOAN_TYPES = [
  { id: "emergency",    label: "Emergency Relief",    amount: 200,  interest: 0.08, termTicks: 30,  desc: "Quick short-term relief for immediate crises." },
  { id: "development",  label: "Development Loan",    amount: 500,  interest: 0.10, termTicks: 60,  desc: "Fund infrastructure and national development." },
  { id: "military",     label: "Military Bond",       amount: 800,  interest: 0.12, termTicks: 90,  desc: "Finance military expansion and defense upgrades." },
  { id: "sovereign",    label: "Sovereign Bond",      amount: 2000, interest: 0.15, termTicks: 180, desc: "Large-scale sovereign debt for major investments." },
];

const STATUS_STYLES = {
  active:    { color: "#22d3ee", bg: "rgba(34,211,238,0.1)",  border: "rgba(34,211,238,0.25)", label: "Active" },
  repaid:    { color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)", label: "Repaid" },
  defaulted: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", label: "Defaulted" },
};

export default function LoansTab({ nation, onRefresh }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [msg, setMsg] = useState(null);

  const checking = nation.currency || 0;
  const activeLoans = loans.filter(l => l.status === "active");
  const totalDebt = activeLoans.reduce((s, l) => s + (l.remaining_balance || l.principal || 0), 0);

  useEffect(() => {
    load();
  }, [nation?.id]);

  async function load() {
    setLoading(true);
    const data = await base44.entities.Loan.filter({ borrower_nation_id: nation.id }, "-created_date", 20).catch(() => []);
    setLoans(data);
    setLoading(false);
  }

  async function applyForLoan() {
    if (!selectedLoan) return;
    setApplying(true);
    setMsg(null);

    const loanDef = LOAN_TYPES.find(l => l.id === selectedLoan);
    const totalOwed = parseFloat((loanDef.amount * (1 + loanDef.interest)).toFixed(2));

    await base44.entities.Loan.create({
      borrower_nation_id: nation.id,
      borrower_nation_name: nation.name,
      principal: loanDef.amount,
      interest_rate: loanDef.interest,
      total_owed: totalOwed,
      remaining_balance: totalOwed,
      loan_type: loanDef.id,
      purpose: loanDef.label,
      status: "active",
      issued_at: new Date().toISOString(),
      due_ticks: loanDef.termTicks,
    });

    await base44.entities.Nation.update(nation.id, {
      currency: checking + loanDef.amount,
    });

    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: nation.id, from_nation_name: "National Bank",
      to_nation_id: nation.id, to_nation_name: nation.name,
      total_value: loanDef.amount,
      description: `Loan Disbursement — ${loanDef.label} (${loanDef.amount} cr at ${(loanDef.interest * 100).toFixed(0)}% interest)`,
    }).catch(() => {});

    setMsg({ type: "success", text: `${loanDef.amount.toLocaleString()} cr disbursed to your treasury.` });
    setSelectedLoan(null);
    setApplying(false);
    onRefresh?.();
    load();
  }

  return (
    <div className="space-y-5">
      {/* Debt Summary */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(4,8,16,0.9) 100%)", border: "1px solid rgba(167,139,250,0.3)" }}>
        <div className="text-xs text-slate-500 uppercase tracking-widest ep-mono mb-1">Total Outstanding Debt</div>
        <div className="text-4xl font-black text-white ep-mono mb-0.5">{totalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="text-sm text-violet-400 font-bold">{nation.currency_name || "Credits"}</div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <FileText size={13} className="text-violet-400" />
            <div>
              <div className="text-[10px] text-slate-500">Active Loans</div>
              <div className="text-xs font-bold text-violet-400 ep-mono">{activeLoans.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle size={13} className="text-green-400" />
            <div>
              <div className="text-[10px] text-slate-500">Repaid</div>
              <div className="text-xs font-bold text-green-400 ep-mono">{loans.filter(l => l.status === "repaid").length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply for Loan */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Apply for a Loan</div>
        <div className="space-y-2">
          {LOAN_TYPES.map(loan => (
            <button key={loan.id} onClick={() => setSelectedLoan(selectedLoan === loan.id ? null : loan.id)}
              className="w-full text-left p-3 rounded-xl transition-all"
              style={{
                background: selectedLoan === loan.id ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selectedLoan === loan.id ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)"}`,
              }}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-sm">{loan.label}</div>
                <div className="text-xs font-black text-violet-400 ep-mono">{loan.amount.toLocaleString()} cr</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-[11px] text-slate-400">{loan.desc}</div>
                <div className="text-[10px] text-slate-500 ep-mono shrink-0 ml-2">{(loan.interest * 100).toFixed(0)}% · {loan.termTicks} ticks</div>
              </div>
              {selectedLoan === loan.id && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div><div className="text-slate-500">Principal</div><div className="font-bold text-white ep-mono">{loan.amount.toLocaleString()} cr</div></div>
                    <div><div className="text-slate-500">Interest</div><div className="font-bold text-red-400 ep-mono">+{(loan.amount * loan.interest).toLocaleString()} cr</div></div>
                    <div><div className="text-slate-500">Total Owed</div><div className="font-bold text-violet-400 ep-mono">{(loan.amount * (1 + loan.interest)).toLocaleString()} cr</div></div>
                  </div>
                  {msg && <div className={`text-xs px-3 py-2 rounded-lg mb-2 ${msg.type === "error" ? "text-red-400 bg-red-500/10 border border-red-500/20" : "text-green-400 bg-green-500/10 border border-green-500/20"}`}>{msg.text}</div>}
                  <button onClick={applyForLoan} disabled={applying}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white disabled:opacity-30 transition-all"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
                    {applying ? "Processing..." : "Apply Now"}
                  </button>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loan History */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Loan History</div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No loan history yet.</div>
        ) : (
          <div className="space-y-2">
            {loans.map(loan => {
              const st = STATUS_STYLES[loan.status] || STATUS_STYLES.active;
              return (
                <div key={loan.id} className="px-3 py-3 rounded-xl flex items-center gap-3"
                  style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${st.color}18` }}>
                    {loan.status === "active" ? <Clock size={14} style={{ color: st.color }} />
                      : loan.status === "repaid" ? <CheckCircle size={14} style={{ color: st.color }} />
                      : <AlertTriangle size={14} style={{ color: st.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">{loan.purpose || loan.loan_type}</div>
                    <div className="text-[10px] text-slate-500 ep-mono">
                      {loan.created_date ? format(new Date(loan.created_date), "MMM d, yyyy") : "—"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black ep-mono" style={{ color: st.color }}>
                      {(loan.remaining_balance || loan.principal || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} cr
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: st.color }}>{st.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}