import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * LoanRepaymentEngine — headless component
 *
 * Runs every 60s (1 tick). For each active loan owned by this nation:
 * - Deducts repayment_per_tick from treasury
 * - Reduces balance_remaining
 * - If balance hits 0 → marks as "repaid"
 * - If due_date passed and still active → marks as "defaulted"
 * - Pays interest to creditor nation if debt was purchased
 */
export default function LoanRepaymentEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;
    const first = setTimeout(() => runTick(), 45_000);
    intervalRef.current = setInterval(() => runTick(), 60_000);
    return () => { clearTimeout(first); clearInterval(intervalRef.current); };
  }, [nation?.id]);

  async function runTick() {
    const loans = await base44.entities.Loan.filter({
      borrower_nation_id: nation.id,
      status: "active",
    });
    if (loans.length === 0) return;

    // Fetch fresh nation state
    const nations = await base44.entities.Nation.filter({ owner_email: nation.owner_email });
    const fresh = nations[0];
    if (!fresh) return;

    const now = new Date();
    let treasuryDelta = 0;

    for (const loan of loans) {
      const due = loan.due_date ? new Date(loan.due_date) : null;

      // ── DEFAULT CHECK ─────────────────────────────────────────
      if (due && due < now && loan.balance_remaining > 0.01) {
        await base44.entities.Loan.update(loan.id, {
          status:       "defaulted",
          is_defaulted: true,
          defaulted_at: now.toISOString(),
        });
        // Notify
        await base44.entities.Notification.create({
          target_nation_id:  nation.id,
          target_owner_email: nation.owner_email,
          type:     "market_crash",
          title:    "Loan Defaulted!",
          message:  `Your ${loan.loan_type.replace("_"," ")} loan of ${loan.principal?.toLocaleString()} cr has defaulted. It is now available on the debt market.`,
          severity: "danger",
          is_read:  false,
        });
        continue;
      }

      // ── REPAYMENT THIS TICK ───────────────────────────────────
      const payment = Math.min(loan.repayment_per_tick || 0, loan.balance_remaining);
      if (payment <= 0) continue;

      // Only deduct if treasury can cover, otherwise let it ride (balance grows risk)
      const canPay = (fresh.currency || 0) + treasuryDelta >= payment;
      if (!canPay) continue; // underpayment — balance stays, default risk increases

      const newBalance = Math.max(0, loan.balance_remaining - payment);
      const newStatus  = newBalance <= 0.01 ? "repaid" : "active";

      await base44.entities.Loan.update(loan.id, {
        balance_remaining: parseFloat(newBalance.toFixed(6)),
        status:            newStatus,
      });

      treasuryDelta -= payment;

      // ── CREDITOR PAYOUT ───────────────────────────────────────
      // If another nation owns this debt, they receive the payment + premium
      if (loan.creditor_nation_id && loan.creditor_nation_id !== nation.id) {
        const premiumRate = 1 + (loan.investor_premium || 10) / 100;
        const creditorPayment = payment * premiumRate;
        try {
          const credNations = await base44.entities.Nation.filter({ id: loan.creditor_nation_id });
          if (credNations[0]) {
            await base44.entities.Nation.update(loan.creditor_nation_id, {
              currency: (credNations[0].currency || 0) + creditorPayment,
            });
          }
        } catch (_) {}
      }

      if (newStatus === "repaid") {
        await base44.entities.Notification.create({
          target_nation_id:   nation.id,
          target_owner_email: nation.owner_email,
          type:     "tech_unlocked",
          title:    "Loan Fully Repaid!",
          message:  `Your ${loan.loan_type.replace("_"," ")} loan has been fully repaid.`,
          severity: "success",
          is_read:  false,
        });
      }
    }

    if (treasuryDelta !== 0) {
      await base44.entities.Nation.update(fresh.id, {
        currency: Math.max(0, (fresh.currency || 0) + treasuryDelta),
      });
      onRefresh?.();
    }
  }

  return null;
}