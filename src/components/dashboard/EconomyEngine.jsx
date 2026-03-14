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

      const stocks = await base44.entities.Stock.filter({ nation_id: fresh.id });
      if (!stocks.length) return;

      const gdp = fresh.gdp || 500;
      const stability = (fresh.stability || 75) / 100;        // 0–1
      const trust = Math.min(2.0, fresh.public_trust || 1.0); // 0.1–2.0
      const isAtWar = (fresh.at_war_with || []).length > 0;
      const isCrashed = fresh.is_in_market_crash || false;

      for (const stock of stocks) {
        const basePrice = Math.max(1, Math.min(25, stock.base_price || 5)); // Realistic base: $1–$25
        const totalShares = stock.total_shares || 500;
        const availableShares = Math.max(0, stock.available_shares || 500);
        const heldRatio = (totalShares - availableShares) / Math.max(1, totalShares);

        // Realistic fundamental value: base × (stability factor) × (trust factor) × (demand)
        // GDP normalised to 500 = 1.0, so $500 GDP nation is baseline
        const gdpFactor = Math.min(2.5, Math.max(0.2, gdp / 500));
        const stabilityFactor = 0.5 + stability * 0.7;           // 0.5 – 1.2
        const demandFactor = 0.85 + heldRatio * 0.4;              // 0.85 – 1.25

        // Random walk: small ±3% daily fluctuation
        const noise = 0.97 + Math.random() * 0.06;

        // War / crash penalties
        const warPenalty = isAtWar ? 0.92 : 1.0;
        const crashPenalty = isCrashed ? 0.6 : 1.0;

        let newPrice = basePrice * gdpFactor * stabilityFactor * trust * demandFactor * warPenalty * crashPenalty * noise;

        // Hard cap: no stock should exceed $150 realistically; floor $0.50
        newPrice = Math.max(0.50, Math.min(150, parseFloat(newPrice.toFixed(2))));

        // Smooth towards last price (avoid huge jumps)
        const lastPrice = stock.current_price || basePrice;
        const maxMove = lastPrice * 0.08; // max 8% change per tick
        if (newPrice > lastPrice + maxMove) newPrice = parseFloat((lastPrice + maxMove).toFixed(2));
        if (newPrice < lastPrice - maxMove) newPrice = parseFloat((lastPrice - maxMove).toFixed(2));
        newPrice = Math.max(0.50, newPrice);

        const history = [...(stock.price_history || []), newPrice].slice(-20);
        const isCrashedNow = newPrice < basePrice * 0.35;
        const marketCap = Math.round(newPrice * totalShares);

        await base44.entities.Stock.update(stock.id, {
          current_price: newPrice,
          price_history: history,
          market_cap: marketCap,
          is_crashed: isCrashedNow,
        });

        if (isCrashedNow && !stock.is_crashed) {
          await base44.entities.Notification.create({
            target_owner_email: fresh.owner_email,
            target_nation_id: fresh.id,
            type: "market_crash",
            title: `📉 ${stock.ticker} CRASHED`,
            message: `${stock.company_name} has crashed to $${newPrice.toFixed(2)}. Stability and public trust are critical.`,
            severity: "danger",
            is_read: false,
          });
        }
      }

      const updatedStocks = await base44.entities.Stock.filter({ nation_id: fresh.id });
      const allCrashed = updatedStocks.every(s => s.is_crashed);
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