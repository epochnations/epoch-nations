/**
 * CheckingTab — Full bank checking account experience.
 * Shows transaction history (green = in, red = out), current balance,
 * and allows transfers to: Savings account or another nation.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Send, Landmark, Search } from "lucide-react";
import { format } from "date-fns";

// Build a synthetic transaction ledger from Transactions + Loans + TradeRoutes
async function buildLedger(nationId, nationName) {
  const [txns, loans, routes] = await Promise.all([
    base44.entities.Transaction.filter({ from_nation_id: nationId }, "-created_date", 50)
      .catch(() => []),
    base44.entities.Transaction.filter({ to_nation_id: nationId }, "-created_date", 50)
      .catch(() => []),
    base44.entities.Loan.filter({ borrower_nation_id: nationId }, "-created_date", 20)
      .catch(() => []),
  ]);

  const entries = [];

  // Outgoing transactions
  txns.forEach(t => {
    if (!t.total_value) return;
    entries.push({
      id: `out_${t.id}`,
      date: t.created_date,
      type: "debit",
      amount: t.total_value,
      description: t.description || labelTx(t, "out"),
      category: txCategory(t.type),
      counterparty: t.to_nation_name || "Market",
    });
  });

  // Incoming transactions
  loans.forEach(t => {
    if (!t.total_value) return;
    entries.push({
      id: `in_${t.id}`,
      date: t.created_date,
      type: "credit",
      amount: t.total_value,
      description: t.description || labelTx(t, "in"),
      category: txCategory(t.type),
      counterparty: t.from_nation_name || "Market",
    });
  });

  // Loan issuances as credits
  loans.forEach(l => {
    entries.push({
      id: `loan_${l.id}`,
      date: l.created_date || l.issued_at,
      type: "credit",
      amount: l.principal || 0,
      description: `Loan disbursement — ${l.purpose || l.loan_type}`,
      category: "Loan",
      counterparty: "National Bank",
    });
  });

  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function txCategory(type) {
  const map = {
    stock_buy: "Investment", stock_sell: "Investment",
    lend_lease: "Aid / Transfer", war_attack: "Military",
    market_crash: "Market Event", tech_unlock: "Technology",
  };
  return map[type] || "Transaction";
}

function labelTx(t, dir) {
  if (t.type === "stock_buy") return dir === "out" ? `Bought ${t.shares} shares of ${t.stock_ticker}` : `Sold ${t.shares} shares of ${t.stock_ticker}`;
  if (t.type === "lend_lease") return dir === "out" ? `Aid sent to ${t.to_nation_name}` : `Aid received from ${t.from_nation_name}`;
  if (t.type === "war_attack") return `Military operation — ${t.to_nation_name}`;
  return t.description || "Transaction";
}

const CAT_COLORS = {
  "Investment": "#34d399",
  "Aid / Transfer": "#60a5fa",
  "Military": "#f87171",
  "Market Event": "#fbbf24",
  "Technology": "#a78bfa",
  "Transaction": "#94a3b8",
  "Loan": "#22d3ee",
};

export default function CheckingTab({ nation, onRefresh }) {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferMode, setTransferMode] = useState(null); // "savings" | "player"
  const [amount, setAmount] = useState("");
  const [targetNation, setTargetNation] = useState(null);
  const [allNations, setAllNations] = useState([]);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState(null);
  const [filter, setFilter] = useState("all"); // all | credits | debits

  const balance = nation.currency || 0;
  const savings = nation.savings_balance || 0;

  useEffect(() => {
    load();
  }, [nation?.id]);

  async function load() {
    setLoading(true);
    const entries = await buildLedger(nation.id, nation.name);
    setLedger(entries);
    setLoading(false);
  }

  async function loadNations(q) {
    setSearch(q);
    if (q.length < 2) { setAllNations([]); return; }
    const res = await base44.entities.Nation.list("-gdp", 60);
    setAllNations(res.filter(n => n.id !== nation.id && n.name.toLowerCase().includes(q.toLowerCase())));
  }

  async function transferToSavings() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMsg({ type: "error", text: "Enter a valid amount." });
    if (amt > balance) return setMsg({ type: "error", text: "Insufficient checking balance." });
    setProcessing(true);
    await base44.entities.Nation.update(nation.id, {
      currency: balance - amt,
      savings_balance: savings + amt,
    });
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: nation.id, from_nation_name: nation.name,
      to_nation_id: nation.id, to_nation_name: nation.name,
      total_value: amt,
      description: `Transfer to Savings — ${amt.toLocaleString()} ${nation.currency_name || "Credits"}`,
    });
    setMsg({ type: "success", text: `Transferred ${amt.toLocaleString()} cr to Savings.` });
    setAmount(""); setProcessing(false); setTransferMode(null);
    onRefresh?.();
    load();
  }

  async function transferToPlayer() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMsg({ type: "error", text: "Enter a valid amount." });
    if (amt > balance) return setMsg({ type: "error", text: "Insufficient checking balance." });
    if (!targetNation) return setMsg({ type: "error", text: "Select a recipient nation." });
    setProcessing(true);

    const freshTarget = await base44.entities.Nation.filter({ id: targetNation.id });
    const recipient = freshTarget[0] || targetNation;

    await Promise.all([
      base44.entities.Nation.update(nation.id, { currency: balance - amt }),
      base44.entities.Nation.update(recipient.id, { currency: (recipient.currency || 0) + amt }),
    ]);
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: nation.id, from_nation_name: nation.name,
      to_nation_id: recipient.id, to_nation_name: recipient.name,
      total_value: amt,
      description: `Wire Transfer: ${nation.name} → ${recipient.name}`,
    });
    await base44.entities.Notification.create({
      target_nation_id: recipient.id,
      target_owner_email: recipient.owner_email,
      type: "lend_lease",
      title: `Wire Transfer from ${nation.name}`,
      message: `${nation.name} has sent you ${amt.toLocaleString()} ${nation.currency_name || "Credits"} via bank wire transfer.`,
      severity: "success",
    });
    setMsg({ type: "success", text: `Sent ${amt.toLocaleString()} cr to ${recipient.name}.` });
    setAmount(""); setTargetNation(null); setSearch(""); setProcessing(false); setTransferMode(null);
    onRefresh?.();
    load();
  }

  const filteredLedger = filter === "credits" ? ledger.filter(e => e.type === "credit")
    : filter === "debits" ? ledger.filter(e => e.type === "debit")
    : ledger;

  const totalIn  = ledger.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);
  const totalOut = ledger.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Balance Card */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(4,8,16,0.9) 100%)", border: "1px solid rgba(6,182,212,0.25)" }}>
        <div className="text-xs text-slate-500 uppercase tracking-widest ep-mono mb-1">Checking Balance</div>
        <div className="text-4xl font-black text-white ep-mono mb-0.5">{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="text-sm text-cyan-400 font-bold">{nation.currency_name || "Credits"}</div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <ArrowDownLeft size={13} className="text-green-400" />
            <div>
              <div className="text-[10px] text-slate-500">Total In</div>
              <div className="text-xs font-bold text-green-400 ep-mono">+{totalIn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight size={13} className="text-red-400" />
            <div>
              <div className="text-[10px] text-slate-500">Total Out</div>
              <div className="text-xs font-bold text-red-400 ep-mono">-{totalOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Landmark size={13} className="text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-500">Savings</div>
              <div className="text-xs font-bold text-amber-400 ep-mono">{savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Buttons */}
      <div className="flex gap-2">
        <button onClick={() => { setTransferMode("savings"); setMsg(null); setAmount(""); }}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
          🏦 Transfer to Savings
        </button>
        <button onClick={() => { setTransferMode("player"); setMsg(null); setAmount(""); setTargetNation(null); setSearch(""); setAllNations([]); }}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa" }}>
          <Send size={11} /> Wire Transfer
        </button>
      </div>

      {/* Transfer Form */}
      {transferMode && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${transferMode === "savings" ? "rgba(251,191,36,0.25)" : "rgba(96,165,250,0.25)"}` }}>
          <div className="font-bold text-white text-sm">
            {transferMode === "savings" ? "🏦 Transfer to Savings" : "📤 Wire Transfer to Another Nation"}
          </div>
          {transferMode === "player" && (
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Search Recipient Nation</label>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={e => loadNations(e.target.value)}
                  placeholder="Type nation name..." className="w-full pl-8 pr-3 py-2 text-xs text-white rounded-xl ep-input" />
              </div>
              {allNations.length > 0 && (
                <div className="mt-1 rounded-xl border border-white/10 overflow-hidden max-h-40 overflow-y-auto" style={{ background: "rgba(10,15,30,0.95)" }}>
                  {allNations.map(n => (
                    <button key={n.id} onClick={() => { setTargetNation(n); setSearch(n.name); setAllNations([]); }}
                      className="w-full px-3 py-2 text-left hover:bg-white/10 text-xs flex items-center gap-2">
                      <span>{n.flag_emoji || "🏴"}</span>
                      <span className="text-white font-bold">{n.name}</span>
                      <span className="text-slate-500 ml-auto">{n.epoch}</span>
                    </button>
                  ))}
                </div>
              )}
              {targetNation && (
                <div className="mt-2 px-3 py-2 rounded-xl text-xs flex items-center gap-2"
                  style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <span>{targetNation.flag_emoji || "🏴"}</span>
                  <span className="text-white font-bold">{targetNation.name}</span>
                  <span className="text-slate-500">— {targetNation.epoch}</span>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Amount (max: {balance.toLocaleString()} cr)</label>
            <input type="number" min="1" max={balance} value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0" className="w-full ep-input px-3 py-2 text-sm rounded-xl text-white placeholder-slate-600" />
          </div>
          {msg && <div className={`text-xs px-3 py-2 rounded-lg ${msg.type === "error" ? "text-red-400 bg-red-500/10 border border-red-500/20" : "text-green-400 bg-green-500/10 border border-green-500/20"}`}>{msg.text}</div>}
          <div className="flex gap-2">
            <button onClick={transferMode === "savings" ? transferToSavings : transferToPlayer}
              disabled={processing || !amount}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-30 transition-all"
              style={{ background: transferMode === "savings" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
              {processing ? "Processing..." : "Confirm Transfer"}
            </button>
            <button onClick={() => { setTransferMode(null); setMsg(null); }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/10 border border-white/10 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction Filter */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction History</div>
        <div className="flex gap-1">
          {[["all", "All"], ["credits", "Credits"], ["debits", "Debits"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${filter === v ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-500 hover:text-white"}`}>
              {l}
            </button>
          ))}
          <button onClick={load} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* Ledger */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLedger.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">No transactions yet.</div>
      ) : (
        <div className="space-y-1.5">
          {filteredLedger.slice(0, 40).map(entry => (
            <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
              {/* Icon */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: entry.type === "credit" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)" }}>
                {entry.type === "credit"
                  ? <ArrowDownLeft size={14} className="text-green-400" />
                  : <ArrowUpRight size={14} className="text-red-400" />
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{entry.description}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] ep-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${CAT_COLORS[entry.category] || "#94a3b8"}15`, color: CAT_COLORS[entry.category] || "#94a3b8" }}>
                    {entry.category}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {entry.date ? format(new Date(entry.date), "MMM d, HH:mm") : "—"}
                  </span>
                </div>
              </div>
              {/* Amount */}
              <div className={`text-sm font-black ep-mono shrink-0 ${entry.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                {entry.type === "credit" ? "+" : "-"}{entry.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}