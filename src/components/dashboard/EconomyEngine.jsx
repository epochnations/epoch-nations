import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * EconomyEngine — headless component
 * Runs every 60s to:
 * 1. Fluctuate all stock prices (+ possible crash events)
 * 2. Apply GDP income to player's treasury
 * 3. Check for stat-based level degradation (tech_level loss, stability loss)
 * 4. Notify the player if bad things happen
 */
export default function EconomyEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;

    // Immediate first tick (but only once mounted, delay 5s so initial data loads)
    const firstTick = setTimeout(() => runTick(), 5000);
    intervalRef.current = setInterval(() => runTick(), 60_000);

    return () => {
      clearTimeout(firstTick);
      clearInterval(intervalRef.current);
    };
  }, [nation?.id]);

  async function runTick() {
    // 1. Fluctuate all stocks in the world
    const allStocks = await base44.entities.Stock.list("-updated_date", 100);
    // Pre-fetch all nations once to avoid per-stock API calls
    const allNations = await base44.entities.Nation.list();
    const nationMap = Object.fromEntries(allNations.map(n => [n.id, n]));

    for (const stock of allStocks) {
      await fluctuateStock(stock, nationMap);
      // Small delay between stock updates to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }

    // 2. Apply GDP income to this player's treasury
    const freshNation = (await base44.entities.Nation.filter({ owner_email: nation.owner_email }))[0];
    if (!freshNation) return;

    const incomePerTick = Math.floor(freshNation.gdp * 0.05); // 5% of GDP per minute
    let updates = { currency: freshNation.currency + incomePerTick };

    // 3. Check for stat degradation
    const degradationResult = checkDegradation(freshNation);
    Object.assign(updates, degradationResult.updates);

    await base44.entities.Nation.update(freshNation.id, updates);

    // 4. Notify if something bad happened
    if (degradationResult.notifications.length > 0) {
      for (const n of degradationResult.notifications) {
        await base44.entities.Notification.create({
          target_owner_email: freshNation.owner_email,
          target_nation_id: freshNation.id,
          ...n
        });
      }
    }

    onRefresh?.();
  }

  async function fluctuateStock(stock, nationMap) {
    const history = stock.price_history || [];
    let currentPrice = stock.current_price || stock.base_price || 10;

    // Use pre-fetched nation map instead of per-stock API call
    const issuerNation = nationMap?.[stock.nation_id];
    const atWar = (issuerNation?.at_war_with || []).length > 0;
    const lowPerformance = issuerNation && (issuerNation.stability < 30 || issuerNation.gdp < 300);

    // War & low performance = higher volatility, negative drift
    const volatility = stock.is_crashed ? 0.04 : (atWar ? 0.12 : lowPerformance ? 0.09 : 0.06);
    const drift = stock.is_crashed ? -0.02 : (atWar ? -0.01 : lowPerformance ? -0.005 : 0.005);
    const change = drift + (Math.random() - 0.45) * volatility;
    let newPrice = Math.max(0.5, currentPrice * (1 + change));

    // Poor nation performance → proportional stock drop
    if (lowPerformance && !stock.is_crashed) {
      const performancePenalty = (30 - Math.min(30, issuerNation.stability)) / 30 * 0.03;
      newPrice = newPrice * (1 - performancePenalty);
    }

    // Random crash event (~3% chance per stock per tick, lower if already crashed)
    let is_crashed = stock.is_crashed;
    if (!is_crashed && Math.random() < 0.03) {
      newPrice = newPrice * 0.6; // -40% instant crash
      is_crashed = true;
      // Post breaking news
      await base44.entities.NewsArticle.create({
        headline: `MARKET CRASH: ${stock.company_name} (${stock.ticker}) Collapses -40%!`,
        body: `Panic selling erupted as ${stock.company_name} crashed catastrophically. Investors holding shares have sustained major losses.`,
        category: "economy",
        tier: "breaking",
        nation_name: stock.nation_name,
        nation_flag: "📉",
        nation_color: "#ef4444"
      });
      // Apply real currency loss to all holders (40% of their position value)
      const holdings = await base44.entities.StockHolding.filter({ stock_id: stock.id });
      for (const h of holdings) {
        const loss = Math.floor(h.shares_owned * currentPrice * 0.4);
        if (loss > 0) {
          const holderNation = nationMap?.[h.nation_id];
          if (holderNation) {
            await base44.entities.Nation.update(h.nation_id, {
              currency: Math.max(0, holderNation.currency - loss)
            });
          }
        }
        await base44.entities.Notification.create({
          target_nation_id: h.nation_id,
          target_owner_email: h.nation_id,
          type: "stock_drop",
          title: `💥 ${stock.ticker} CRASHED!`,
          message: `Your holdings in ${stock.company_name} lost 40% value. You lost approximately ${loss} credits from your treasury.`,
          severity: "danger",
          is_read: false
        });
      }
    }

    // Recovery: crashed stocks have 15% chance per tick to recover
    if (is_crashed && Math.random() < 0.15) {
      newPrice = newPrice * 1.25;
      is_crashed = false;
    }

    // Floor at 0.5
    newPrice = Math.max(0.5, parseFloat(newPrice.toFixed(2)));
    const newHistory = [...history, newPrice].slice(-30);

    await base44.entities.Stock.update(stock.id, {
      current_price: newPrice,
      price_history: newHistory,
      market_cap: parseFloat((newPrice * stock.total_shares).toFixed(2)),
      is_crashed
    });
  }

  function checkDegradation(n) {
    const updates = {};
    const notifications = [];

    // High spending → erode public trust
    const totalSpend = (n.education_spending || 0) + (n.military_spending || 0);
    if (totalSpend > 80) {
      const trustLoss = ((totalSpend - 80) / 100) * 0.02;
      updates.public_trust = Math.max(0.1, (n.public_trust || 1.0) - trustLoss);
    }

    // Low public trust → stability falls
    if ((n.public_trust || 1.0) < 0.5) {
      updates.stability = Math.max(0, (n.stability || 75) - 2);
    }

    // Very low stability → tech level degrades
    if ((n.stability || 75) < 20 && (n.tech_level || 1) > 1) {
      updates.tech_level = (n.tech_level || 1) - 1;
      updates.tech_points = Math.max(0, (n.tech_points || 0) - 30);
      notifications.push({
        type: "market_crash",
        title: "⚠ Instability Crisis!",
        message: "Severe instability has caused a technological regression. Tech Level decreased by 1.",
        severity: "danger",
        is_read: false
      });
    }

    // At war → stability pressure
    if ((n.at_war_with || []).length > 0) {
      const warPressure = n.at_war_with.length * 1;
      updates.stability = Math.max(0, (updates.stability ?? n.stability ?? 75) - warPressure);
      updates.currency = Math.max(0, (n.currency || 0) - n.at_war_with.length * 50); // war costs
    }

    // GDP naturally grows with manufacturing
    const mfgBoost = Math.floor((n.manufacturing || 100) * 0.005);
    updates.gdp = Math.min(100000, (n.gdp || 1000) + mfgBoost);

    // Stability slowly recovers if at peace and trust is OK
    if ((n.at_war_with || []).length === 0 && (n.public_trust || 1.0) >= 0.7 && (n.stability || 75) < 100) {
      updates.stability = Math.min(100, (updates.stability ?? n.stability ?? 75) + 1);
    }

    return { updates, notifications };
  }

  return null; // headless
}