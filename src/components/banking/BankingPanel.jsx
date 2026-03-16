import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Landmark, TrendingDown, AlertTriangle, Clock, CheckCircle, ShoppingCart } from "lucide-react";
import CheckingTab from "./CheckingTab.jsx";
import SavingsTab from "./SavingsTab.jsx";

const LOAN_TYPES = {
  short_term: {
    label: "Short-Term Emergency",
    emoji: "⚡",
    description: "Emergency funds. Very high interest, short repayment window.",
    interest_rate: 18,
    duration_days: 30,
    max_multiplier: 0.15,   // max loan = 15% of national wealth
    color: "red",
  },
  development: {
    label: "Development Loan",
    emoji: "🏗️",
    description: "For infrastructure, city expansion, and industry. Medium interest.",
    interest_rate: 8,
    duration_days: 365,
    max_multiplier: 0.35,
    color: "cyan",
  },
  sovereign_bond: {
    label: "Sovereign Bond",
    emoji: "📜",
    description: "Large national projects. Investors can purchase. Long-term interest payments.",
    interest_rate: 5,
    duration_days: 730,
    max_multiplier: 0.60,
    color: "violet",
  },
};

// Computes max borrowable based on nation performance
function getLoanCap(nation, loanType) {
  const gdp = nation.gdp || 500;
  const nw  = nation.national_wealth || 500;
  const trust = nation.public_trust || 1.0;
  const stability = (nation.stability || 75) / 100;

  // Debt ratio: existing debt vs national wealth
  // (We'll derive from the caller who passes currentDebt)
  const base = (gdp * 0.5 + nw * 0.3) * trust * stability;
  return Math.floor(base * LOAN_TYPES[loanType].max_multiplier);
}

function getDebtRatio(loans, nw) {
  const totalDebt = loans
    .filter(l => l.status === "active")
    .reduce((s, l) => s + (l.balance_remaining || 0), 0);
  return nw > 0 ? totalDebt / nw : 0;
}

function colorClasses(color) {
  const map = {
    red:    { border: "border-red-500/30",    bg: "bg-red-500/10",    text: "text-red-400",    badge: "bg-red-500/20 text-red-300" },
    cyan:   { border: "border-cyan-500/30",   bg: "bg-cyan-500/10",   text: "text-cyan-400",   badge: "bg-cyan-500/20 text-cyan-300" },
    violet: { border: "border-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-300" },
    amber:  { border: "border-amber-500/30",  bg: "bg-amber-500/10",  text: "text-amber-400",  badge: "bg-amber-500/20 text-amber-300" },
  };
  return map[color] || map.cyan;
}

export default function BankingPanel({ nation, onClose, onRefresh }) {
  const [tab, setTab] = useState("checking");     // checking | savings | loans | debt_market | my_loans
  const [loans, setLoans] = useState([]);
  const [debtMarket, setDebtMarket] = useState([]); // defaulted loans from other nations
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [repaying, setRepaying] = useState(null);
  const [buying, setBuying] = useState(null);

  // Loan form
  const [loanType, setLoanType] = useState("short_term");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [formError, setFormError] = useState("");

  const hasBankBuilding = (() => { return true; })(); // determined by caller

  useEffect(() => { load(); }, [nation?.id]);

  async function load() {
    setLoading(true);
    const [myLoans, allDefaulted] = await Promise.all([
      base44.entities.Loan.filter({ borrower_nation_id: nation.id }),
      base44.entities.Loan.filter({ status: "defaulted" }),
    ]);
    setLoans(myLoans);
    // Debt market: defaulted loans NOT from this nation
    setDebtMarket(allDefaulted.filter(l => l.borrower_nation_id !== nation.id && !l.creditor_nation_id));
    setLoading(false);
  }

  const activeLoans   = loans.filter(l => l.status === "active");
  const debtRatio     = getDebtRatio(loans, nation.national_wealth || 500);
  const maxAllowed    = debtRatio < 0.7;  // no new loans if debt > 70% NW

  async function applyLoan() {
    setFormError("");
    const amount = parseFloat(loanAmount);
    if (!amount || amount <= 0) return setFormError("Enter a valid loan amount.");
    const cap = getLoanCap(nation, loanType);
    if (amount > cap) return setFormError(`Max you can borrow for this type: ${cap.toLocaleString()} cr`);
    if (!maxAllowed) return setFormError("Debt ratio too high. Repay existing loans first.");

    setApplying(true);
    const def = LOAN_TYPES[loanType];
    const now = new Date();
    const due = new Date(now.getTime() + def.duration_days * 86400_000);

    // Repayment per tick (every 60s real time = 1440 ticks/day)
    const totalRepayable = amount * (1 + def.interest_rate / 100);
    const totalTicks     = def.duration_days * 1440;
    const perTick        = totalRepayable / totalTicks;

    await base44.entities.Loan.create({
      borrower_nation_id:   nation.id,
      borrower_nation_name: nation.name,
      borrower_email:       nation.owner_email,
      loan_type:            loanType,
      purpose:              loanPurpose,
      principal:            amount,
      balance_remaining:    totalRepayable,
      interest_rate:        def.interest_rate,
      interest_accrued:     0,
      repayment_per_tick:   parseFloat(perTick.toFixed(6)),
      issued_at:            now.toISOString(),
      due_date:             due.toISOString(),
      status:               "active",
      is_defaulted:         false,
      investor_premium:     10,
      bond_total_shares:    loanType === "sovereign_bond" ? Math.floor(amount / 100) : 0,
      bond_available:       loanType === "sovereign_bond" ? Math.floor(amount / 100) : 0,
    });

    // Inject funds into treasury
    await base44.entities.Nation.update(nation.id, {
      currency: (nation.currency || 0) + amount,
    });

    // News
    await base44.entities.NewsArticle.create({
      headline: `${nation.name} secures a ${def.label} of ${amount.toLocaleString()} Credits`,
      body:     `${nation.name} has taken out a ${def.label} from the National Bank to fund ${loanPurpose || "national development"}.`,
      category: "economy", tier: "standard",
      nation_name: nation.name, nation_flag: nation.flag_emoji, nation_color: nation.flag_color,
    });

    setLoanAmount(""); setLoanPurpose(""); setApplying(false);
    await load();
    onRefresh?.();
  }

  async function repayLoan(loan, partial = null) {
    setRepaying(loan.id);
    const payment = partial ?? loan.balance_remaining;
    const actualpay = Math.min(payment, nation.currency || 0, loan.balance_remaining);
    if (actualpay <= 0) { setRepaying(null); return; }

    const newBalance = Math.max(0, loan.balance_remaining - actualpay);
    const newStatus  = newBalance <= 0.01 ? "repaid" : "active";

    await Promise.all([
      base44.entities.Loan.update(loan.id, { balance_remaining: newBalance, status: newStatus }),
      base44.entities.Nation.update(nation.id, { currency: Math.max(0, (nation.currency || 0) - actualpay) }),
    ]);

    setRepaying(null);
    await load();
    onRefresh?.();
  }

  async function buyDebt(loan) {
    setBuying(loan.id);
    const cost = loan.balance_remaining * 0.7; // buyer pays 70% of face value
    if ((nation.currency || 0) < cost) { setBuying(null); return; }

    const investorRate = loan.interest_rate + (loan.investor_premium || 10);

    await Promise.all([
      base44.entities.Loan.update(loan.id, {
        status:              "active",      // reactivated under new creditor
        creditor_nation_id:  nation.id,
        creditor_nation_name: nation.name,
        creditor_email:      nation.owner_email,
        interest_rate:       investorRate,  // bank rate + 10% premium
        is_defaulted:        false,
      }),
      base44.entities.Nation.update(nation.id, {
        currency: Math.max(0, (nation.currency || 0) - cost),
      }),
    ]);

    setBuying(null);
    await load();
    onRefresh?.();
  }

  if (loading) return (
    <PanelShell onClose={onClose}>
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </PanelShell>
  );

  return (
    <PanelShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Landmark size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-3">
              National Bank
              {/* Checking / Savings quick tabs inline with title */}
              <div className="flex gap-1">
                <button onClick={() => setTab("checking")}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${tab === "checking" ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40" : "text-slate-500 hover:text-slate-300 border border-transparent"}`}>
                  Checking
                </button>
                <button onClick={() => setTab("savings")}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${tab === "savings" ? "bg-amber-500/25 text-amber-300 border border-amber-500/40" : "text-slate-500 hover:text-slate-300 border border-transparent"}`}>
                  Savings
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-500">Lending &amp; Financial Services</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("loans")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${["loans","my_loans","debt_market"].includes(tab) ? "bg-green-500/20 text-green-300 border border-green-500/30" : "text-slate-500 hover:text-slate-300 border border-transparent"}`}>
            Loans
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Checking & Savings tabs — full content */}
      {tab === "checking" && <CheckingTab nation={nation} onRefresh={onRefresh} />}
      {tab === "savings" && <SavingsTab nation={nation} onRefresh={onRefresh} />}

      {/* Loans section — only shown when on a loans tab */}
      {(tab === "loans" || tab === "my_loans" || tab === "debt_market") && (<>

      {/* Debt summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Active Debt", val: `${activeLoans.reduce((s,l)=>s+(l.balance_remaining||0),0).toLocaleString(undefined,{maximumFractionDigits:0})} cr`, color: "text-red-400" },
          { label: "Debt Ratio", val: `${(debtRatio*100).toFixed(1)}%`, color: debtRatio > 0.5 ? "text-red-400" : debtRatio > 0.3 ? "text-amber-400" : "text-green-400" },
          { label: "Treasury", val: `${Math.floor(nation.currency||0).toLocaleString()} cr`, color: "text-cyan-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`font-bold text-sm ep-mono ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-5">
        {[
          { id: "loans", label: "Apply for Loan" },
          { id: "my_loans", label: `My Loans (${activeLoans.length})` },
          { id: "debt_market", label: `Debt Market (${debtMarket.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${tab===t.id ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: APPLY ── */}
      {tab === "loans" && (
        <div className="space-y-4">
          {!maxAllowed && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
              <AlertTriangle size={13} /> Debt ratio too high ({(debtRatio*100).toFixed(0)}%). Repay existing loans before borrowing more.
            </div>
          )}

          {/* Loan type selector */}
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(LOAN_TYPES).map(([key, def]) => {
              const c = colorClasses(def.color);
              const cap = getLoanCap(nation, key);
              return (
                <button key={key} onClick={() => setLoanType(key)}
                  className={`text-left p-4 rounded-xl border transition-all ${loanType===key ? `${c.border} ${c.bg}` : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{def.emoji} {def.label}</span>
                    <span className={`text-xs font-bold ep-mono px-2 py-0.5 rounded-lg ${c.badge}`}>{def.interest_rate}% APR</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{def.description}</div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-slate-500"><Clock size={9} className="inline mr-1" />{def.duration_days}d term</span>
                    <span className={c.text}>Max: {cap.toLocaleString()} cr</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Amount + purpose */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Loan Amount (Credits)</label>
              <input
                type="number"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                placeholder={`Max: ${getLoanCap(nation, loanType).toLocaleString()}`}
                className="w-full ep-input px-3 py-2 text-sm rounded-xl text-white placeholder-slate-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Purpose (optional)</label>
              <input
                type="text"
                value={loanPurpose}
                onChange={e => setLoanPurpose(e.target.value)}
                placeholder="e.g. Infrastructure expansion..."
                className="w-full ep-input px-3 py-2 text-sm rounded-xl text-white placeholder-slate-600"
              />
            </div>
            {formError && <div className="text-xs text-red-400">{formError}</div>}

            {loanAmount > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-1">
                <div className="text-slate-400">Repayment Summary</div>
                <div className="flex justify-between"><span className="text-slate-500">Principal</span><span className="text-white ep-mono">{parseFloat(loanAmount||0).toLocaleString()} cr</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Interest ({LOAN_TYPES[loanType].interest_rate}%)</span><span className="text-red-400 ep-mono">+{(parseFloat(loanAmount||0)*(LOAN_TYPES[loanType].interest_rate/100)).toLocaleString(undefined,{maximumFractionDigits:0})} cr</span></div>
                <div className="flex justify-between font-bold"><span className="text-white">Total Repayable</span><span className="text-amber-400 ep-mono">{(parseFloat(loanAmount||0)*(1+LOAN_TYPES[loanType].interest_rate/100)).toLocaleString(undefined,{maximumFractionDigits:0})} cr</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="text-slate-300">{new Date(Date.now()+LOAN_TYPES[loanType].duration_days*86400000).toLocaleDateString()}</span></div>
              </div>
            )}

            <button
              onClick={applyLoan}
              disabled={applying || !maxAllowed || !loanAmount}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {applying ? "Processing..." : "Apply for Loan"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: MY LOANS ── */}
      {tab === "my_loans" && (
        <div className="space-y-3">
          {activeLoans.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">No active loans.</div>
          )}
          {activeLoans.map(loan => {
            const def = LOAN_TYPES[loan.loan_type] || LOAN_TYPES.short_term;
            const c   = colorClasses(def.color);
            const pct = loan.principal > 0 ? ((loan.balance_remaining / (loan.principal * (1 + loan.interest_rate/100))) * 100) : 0;
            const isOverdue = loan.due_date && new Date(loan.due_date) < new Date();
            return (
              <div key={loan.id} className={`rounded-xl border p-4 ${isOverdue ? "border-red-500/40 bg-red-500/5" : `${c.border} ${c.bg}`}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-white text-sm">{def.emoji} {def.label}</div>
                    {loan.purpose && <div className="text-xs text-slate-500">{loan.purpose}</div>}
                  </div>
                  {isOverdue && <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-lg">OVERDUE</span>}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-white/10 rounded-full mb-2">
                  <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div><div className="text-slate-500">Remaining</div><div className="font-bold text-white ep-mono">{loan.balance_remaining.toLocaleString(undefined,{maximumFractionDigits:0})} cr</div></div>
                  <div><div className="text-slate-500">Rate</div><div className={`font-bold ep-mono ${c.text}`}>{loan.interest_rate}% APR</div></div>
                  <div><div className="text-slate-500">Due</div><div className="font-bold text-white">{loan.due_date ? new Date(loan.due_date).toLocaleDateString() : "—"}</div></div>
                </div>

                {/* Creditor info */}
                {loan.creditor_nation_name && (
                  <div className="text-xs text-amber-400 mb-2">📋 Creditor: {loan.creditor_nation_name}</div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => repayLoan(loan, Math.min(loan.balance_remaining, (nation.currency||0)))}
                    disabled={repaying === loan.id || (nation.currency||0) <= 0}
                    className="flex-1 py-2 rounded-lg text-xs font-bold bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 disabled:opacity-30 transition-all"
                  >
                    {repaying === loan.id ? "Repaying..." : "Repay Max"}
                  </button>
                  <button
                    onClick={() => repayLoan(loan, Math.min(loan.balance_remaining * 0.1, (nation.currency||0)))}
                    disabled={repaying === loan.id || (nation.currency||0) <= 0}
                    className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/10 border border-white/10 text-slate-300 hover:bg-white/15 disabled:opacity-30 transition-all"
                  >
                    Repay 10%
                  </button>
                </div>
              </div>
            );
          })}

          {/* Defaulted / repaid loans */}
          {loans.filter(l => l.status !== "active").length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Loan History</div>
              {loans.filter(l => l.status !== "active").map(loan => (
                <div key={loan.id} className="rounded-xl border border-white/10 bg-white/5 p-3 mb-2 flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-400">{LOAN_TYPES[loan.loan_type]?.label || loan.loan_type}</div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    loan.status === "repaid" ? "bg-green-500/20 text-green-400" :
                    loan.status === "defaulted" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                  }`}>{loan.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DEBT MARKET ── */}
      {tab === "debt_market" && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 mb-3">
            Purchase defaulted sovereign debt. You become the creditor and collect interest at the original bank rate + 10% investor premium.
            Debtors cannot purchase assets until debt is repaid.
          </div>
          {debtMarket.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">No defaulted debt available.</div>
          )}
          {debtMarket.map(loan => {
            const cost = Math.floor(loan.balance_remaining * 0.7);
            const investorRate = (loan.interest_rate || 0) + (loan.investor_premium || 10);
            const canAfford = (nation.currency || 0) >= cost;
            return (
              <div key={loan.id} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-white text-sm">🏴 {loan.borrower_nation_name}</div>
                    <div className="text-xs text-slate-400">{LOAN_TYPES[loan.loan_type]?.label}</div>
                  </div>
                  <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-lg">DEFAULTED</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div><div className="text-slate-500">Face Value</div><div className="font-bold text-white ep-mono">{loan.balance_remaining.toLocaleString(undefined,{maximumFractionDigits:0})} cr</div></div>
                  <div><div className="text-slate-500">Your Cost</div><div className="font-bold text-amber-400 ep-mono">{cost.toLocaleString()} cr</div></div>
                  <div><div className="text-slate-500">Your Rate</div><div className="font-bold text-green-400 ep-mono">{investorRate}% APR</div></div>
                </div>
                {loan.purpose && <div className="text-xs text-slate-500 mb-3">Purpose: {loan.purpose}</div>}
                <button
                  onClick={() => buyDebt(loan)}
                  disabled={buying === loan.id || !canAfford}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={12} />
                  {buying === loan.id ? "Purchasing..." : !canAfford ? `Need ${cost.toLocaleString()} cr` : `Buy Debt for ${cost.toLocaleString()} cr`}
                </button>
              </div>
            );
          })}
        </div>
      )}
      </>)}
    </PanelShell>
  );
}

function PanelShell({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 ep-slide-in"
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}