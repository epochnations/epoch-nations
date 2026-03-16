/**
 * SavingsTab — Savings account with interest accrual.
 * Transfer back to Checking incurs a 26% withdrawal fee.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownLeft, Landmark } from "lucide-react";

const WITHDRAWAL_FEE_PCT = 26;

export default function SavingsTab({ nation, onRefresh }) {
  const [mode, setMode] = useState(null); // "deposit" | "withdraw"
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState(null);

  const checking = nation.currency || 0;
  const savings  = nation.savings_balance || 0;
  const currencyName = nation.currency_name || "Credits";

  // Projected interest: 2% per game day (30 ticks = 1 day), compounding conceptually
  const projectedInterest = savings * 0.02;

  async function deposit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMsg({ type: "error", text: "Enter a valid amount." });
    if (amt > checking) return setMsg({ type: "error", text: "Insufficient checking balance." });
    setProcessing(true);
    await base44.entities.Nation.update(nation.id, {
      currency: checking - amt,
      savings_balance: savings + amt,
    });
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: nation.id, from_nation_name: nation.name,
      to_nation_id: nation.id, to_nation_name: nation.name,
      total_value: amt,
      description: `Savings Deposit — ${amt.toLocaleString()} ${currencyName}`,
    });
    setMsg({ type: "success", text: `${amt.toLocaleString()} cr deposited to Savings.` });
    setAmount(""); setProcessing(false); setMode(null);
    onRefresh?.();
  }

  async function withdraw() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMsg({ type: "error", text: "Enter a valid amount." });
    if (amt > savings) return setMsg({ type: "error", text: "Insufficient savings balance." });
    const fee  = parseFloat((amt * WITHDRAWAL_FEE_PCT / 100).toFixed(2));
    const net  = parseFloat((amt - fee).toFixed(2));
    setProcessing(true);
    await base44.entities.Nation.update(nation.id, {
      currency: checking + net,
      savings_balance: savings - amt,
    });
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: nation.id, from_nation_name: nation.name,
      to_nation_id: nation.id, to_nation_name: nation.name,
      total_value: net,
      description: `Savings Withdrawal — ${amt.toLocaleString()} cr (${WITHDRAWAL_FEE_PCT}% fee: ${fee.toLocaleString()} cr)`,
    });
    setMsg({ type: "success", text: `Withdrew ${net.toLocaleString()} cr to Checking (${fee.toLocaleString()} cr fee applied).` });
    setAmount(""); setProcessing(false); setMode(null);
    onRefresh?.();
  }

  const withdrawAmt = parseFloat(amount) || 0;
  const feePreview  = parseFloat((withdrawAmt * WITHDRAWAL_FEE_PCT / 100).toFixed(2));
  const netPreview  = parseFloat((withdrawAmt - feePreview).toFixed(2));

  return (
    <div className="space-y-5">
      {/* Savings Balance Card */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(4,8,16,0.9) 100%)", border: "1px solid rgba(251,191,36,0.3)" }}>
        <div className="text-xs text-slate-500 uppercase tracking-widest ep-mono mb-1">Savings Balance</div>
        <div className="text-4xl font-black text-white ep-mono mb-0.5">
          {savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div className="text-sm text-amber-400 font-bold">{currencyName}</div>

        <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-green-400" />
            <div>
              <div className="text-[10px] text-slate-500">Daily Interest (est.)</div>
              <div className="text-xs font-bold text-green-400 ep-mono">+{projectedInterest.toLocaleString(undefined, { maximumFractionDigits: 1 })} cr</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Landmark size={13} className="text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500">Checking</div>
              <div className="text-xs font-bold text-cyan-400 ep-mono">{checking.toLocaleString(undefined, { maximumFractionDigits: 0 })} cr</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2 h-2 rounded-full bg-amber-400" style={{ boxShadow: "0 0 6px rgba(251,191,36,0.6)" }} />
            <div>
              <div className="text-[10px] text-slate-500">APY</div>
              <div className="text-xs font-bold text-amber-400 ep-mono">2.0%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl px-4 py-3" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
        <div className="text-xs text-amber-200/80 leading-relaxed">
          💡 <strong>Savings Account:</strong> Your savings earn <strong>2% APY</strong> per game day while held here. Withdrawing back to Checking incurs a <strong>{WITHDRAWAL_FEE_PCT}% early withdrawal fee</strong>. The longer you save, the more you earn — and the more the fee pays off.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={() => { setMode("deposit"); setMsg(null); setAmount(""); }}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
          <ArrowDownLeft size={12} /> Deposit
        </button>
        <button onClick={() => { setMode("withdraw"); setMsg(null); setAmount(""); }}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
          <ArrowUpRight size={12} /> Withdraw
        </button>
      </div>

      {/* Transfer Form */}
      {mode && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${mode === "deposit" ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}` }}>
          <div className="font-bold text-white text-sm">
            {mode === "deposit" ? "💰 Deposit to Savings" : "🏧 Withdraw to Checking"}
          </div>

          {mode === "withdraw" && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-300 leading-relaxed">
                A <strong>{WITHDRAWAL_FEE_PCT}% early withdrawal fee</strong> will be deducted from the amount transferred back to Checking.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Amount (max: {mode === "deposit" ? checking.toLocaleString() : savings.toLocaleString()} cr)
            </label>
            <input type="number" min="1" max={mode === "deposit" ? checking : savings}
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0" className="w-full ep-input px-3 py-2 text-sm rounded-xl text-white placeholder-slate-600" />
          </div>

          {/* Withdraw preview */}
          {mode === "withdraw" && withdrawAmt > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Withdrawal Amount</span><span className="text-white ep-mono">{withdrawAmt.toLocaleString()} cr</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fee ({WITHDRAWAL_FEE_PCT}%)</span><span className="text-red-400 ep-mono">-{feePreview.toLocaleString()} cr</span></div>
              <div className="flex justify-between border-t border-white/10 pt-1 font-bold"><span className="text-white">You Receive</span><span className="text-green-400 ep-mono">{netPreview.toLocaleString()} cr</span></div>
            </div>
          )}

          {/* Deposit preview */}
          {mode === "deposit" && parseFloat(amount) > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Deposit Amount</span><span className="text-green-400 ep-mono">+{parseFloat(amount).toLocaleString()} cr</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Checking After</span><span className="text-white ep-mono">{(checking - parseFloat(amount)).toLocaleString()} cr</span></div>
              <div className="flex justify-between font-bold"><span className="text-white">Savings After</span><span className="text-amber-400 ep-mono">{(savings + parseFloat(amount)).toLocaleString()} cr</span></div>
            </div>
          )}

          {msg && <div className={`text-xs px-3 py-2 rounded-lg ${msg.type === "error" ? "text-red-400 bg-red-500/10 border border-red-500/20" : "text-green-400 bg-green-500/10 border border-green-500/20"}`}>{msg.text}</div>}

          <div className="flex gap-2">
            <button onClick={mode === "deposit" ? deposit : withdraw}
              disabled={processing || !amount}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-30 transition-all"
              style={{ background: mode === "deposit" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #f87171, #dc2626)" }}>
              {processing ? "Processing..." : mode === "deposit" ? "Confirm Deposit" : `Withdraw (${WITHDRAWAL_FEE_PCT}% fee)`}
            </button>
            <button onClick={() => { setMode(null); setMsg(null); }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/10 border border-white/10 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Savings Tips */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Savings Strategy</div>
        {[
          { icon: "📈", title: "Compound Growth", desc: "Savings earn 2% APY per game day. At 1,000 cr saved, that's 20 cr/day passively." },
          { icon: "⚠️", title: "Fee Awareness", desc: `Withdrawing early costs ${WITHDRAWAL_FEE_PCT}% of the amount transferred out. Save only what you won't need immediately.` },
          { icon: "🛡️", title: "War Reserve", desc: "Keeping reserves in Savings protects them from war damage calculations that target your Checking balance." },
          { icon: "💡", title: "Long-Term Play", desc: "The longer you save, the more the fee becomes negligible vs. interest earned. Ideal for multi-week holds." },
        ].map(tip => (
          <div key={tip.title} className="flex items-start gap-2">
            <span className="text-base shrink-0">{tip.icon}</span>
            <div>
              <div className="text-xs font-bold text-white">{tip.title}</div>
              <div className="text-[11px] text-slate-400 leading-relaxed">{tip.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}