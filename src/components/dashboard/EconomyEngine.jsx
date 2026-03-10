import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS } from "../game/GameClock";

/**
 * EconomyEngine — headless component
 * Runs every game tick (TICK_MS = 60s). Stock prices update once per tick;
 * they settle on game-day boundaries (every 30 ticks).
 */
export default function EconomyEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;
    const firstTick = setTimeout(() => runTick(), 40_000);
    intervalRef.current = setInterval(() => runTick(), TICK_MS);
    return () => {
      clearTimeout(firstTick);
      clearInterval(intervalRef.current);
    };
  }, [nation?.id]);

  async function runTick() {
    try {
      const fresh = (await base44.entities.Nation.filter({ owner_email: nation.owner_email }))[0];
      if (!fresh) return;

      // Fetch all stocks for this nation
      const stocks = await base44.entities.Stock.filter({ nation_id: fresh.id });
      if (!stocks.length) return;

      const gdp = fresh.gdp || 500;
      const stability = fresh.stability || 75;
      const trust = fresh.public_trust || 1.0;
      const isAtWar = (fresh.at_war_with || []).length > 0;
      const isCrashed = fresh.is_in_market_crash || false;

      for (const stock of stocks) {
        // Base value from nation fundamentals
        const fundamentalValue = (gdp / 100) * (stability / 100) * trust * (stock.base_price || 5);

        // Demand ratio: shares sold vs total
        const totalShares = stock.total_shares || 500;
        const availableShares = stock.available_shares || 500;
        const heldRatio = (totalShares - availableShares) / totalShares;
        const demandMultiplier = 0.7 + heldRatio * 0.6; // 0.7 to 1.3

        // War/crash impact
        const warPenalty = isAtWar ? 0.85 : 1.0;
        const crashPenalty = isCrashed ? 0.5 : 1.0;

        // Random walk ±5%
        const noise = 0.95 + Math.random() * 0.1;

        let newPrice = fundamentalValue * demandMultiplier * warPenalty * crashPenalty * noise;
        newPrice = Math.max(0.01, parseFloat(newPrice.toFixed(2)));

        // Price history (keep last 20)
        const history = [...(stock.price_history || []), newPrice].slice(-20);

        const isCrashedNow = newPrice < (stock.base_price || 5) * 0.3;
        const marketCap = newPrice * totalShares;

        await base44.entities.Stock.update(stock.id, {
          current_price: newPrice,
          price_history: history,
          market_cap: Math.round(marketCap),
          is_crashed: isCrashedNow
        });

        // Notify if crashed
        if (isCrashedNow && !stock.is_crashed) {
          await base44.entities.Notification.create({
            target_owner_email: fresh.owner_email,
            target_nation_id: fresh.id,
            type: "market_crash",
            title: `📉 ${stock.ticker} CRASHED`,
            message: `${stock.company_name} has crashed to ${newPrice.toFixed(2)}. Stability and public trust are critical.`,
            severity: "danger",
            is_read: false
          });
        }
      }

      // Nation-level crash flag
      const allCrashed = stocks.every(s => s.is_crashed);
      if (allCrashed !== fresh.is_in_market_crash) {
        await base44.entities.Nation.update(fresh.id, { is_in_market_crash: allCrashed });
      }

      onRefresh?.();
    } catch (e) {
      console.error("EconomyEngine tick error:", e);
    }
  }

  return null;
}