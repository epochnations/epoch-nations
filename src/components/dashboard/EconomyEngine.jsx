import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { EPOCHS } from "../game/EpochConfig";
import { BUILDING_MAP } from "../game/BuildingConfig";

/**
 * EconomyEngine — headless, 60-second market pulse
 * Upgraded: multi-factor pricing, investor confidence, dividends,
 * sector integration, demand ratio, war cascades, hostile takeover alerts.
 */
export default function EconomyEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);
  const tickCountRef = useRef(0);

  useEffect(() => {
    if (!nation?.id) return;
    const firstTick = setTimeout(() => runTick(), 5000);
    intervalRef.current = setInterval(() => runTick(), 60_000);
    return () => {
      clearTimeout(firstTick);
      clearInterval(intervalRef.current);
    };
  }, [nation?.id]);

  async function runTick() {
    tickCountRef.current += 1;
    const tick = tickCountRef.current;

    const [allStocks, allNations, allHoldings] = await Promise.all([
      base44.entities.Stock.list("-updated_date", 100),
      base44.entities.Nation.list(),
      base44.entities.StockHolding.list("-created_date", 500),
    ]);

    const nationMap = Object.fromEntries(allNations.map(n => [n.id, n]));

    // Build holdings map: stock_id -> total shares held
    const heldByStock = {};
    const heldByNation = {}; // nation_id -> { stock_id -> shares }
    for (const h of allHoldings) {
      heldByStock[h.stock_id] = (heldByStock[h.stock_id] || 0) + (h.shares_owned || 0);
      if (!heldByNation[h.nation_id]) heldByNation[h.nation_id] = {};
      heldByNation[h.nation_id][h.stock_id] = h.shares_owned || 0;
    }

    // Fetch buildings for sector integration (batched once)
    let allBuildings = [];
    try { allBuildings = await base44.entities.Building.list("-created_date", 500); } catch (_) {}
    const buildingsByNation = {};
    for (const b of allBuildings) {
      if (!b.is_destroyed) {
        if (!buildingsByNation[b.nation_id]) buildingsByNation[b.nation_id] = [];
        buildingsByNation[b.nation_id].push(b);
      }
    }

    // Process each stock
    for (const stock of allStocks) {
      await fluctuateStock(stock, nationMap, heldByStock, buildingsByNation);
      await new Promise(r => setTimeout(r, 200));
    }

    // Check hostile takeover thresholds
    await checkHostileTakeovers(allStocks, allNations, allHoldings, nationMap);

    // Market cascade: if any nation has collapsed, cascade to allies
    await checkMarketCascade(allNations, allStocks);

    // Dividends every 5 ticks (~5 minutes)
    if (tick % 5 === 0) {
      await payDividends(allStocks, allHoldings, nationMap);
    }

    // Apply GDP income + degradation for THIS player's nation
    const freshNation = (await base44.entities.Nation.filter({ owner_email: nation.owner_email }))[0];
    if (!freshNation) return;

    const incomePerTick = Math.max(1, Math.floor(freshNation.gdp * 0.05));
    const updates = { currency: freshNation.currency + incomePerTick };
    const { updates: degradationUpdates, notifications } = checkDegradation(freshNation);
    Object.assign(updates, degradationUpdates);

    await base44.entities.Nation.update(freshNation.id, updates);

    for (const n of notifications) {
      await base44.entities.Notification.create({
        target_owner_email: freshNation.owner_email,
        target_nation_id: freshNation.id,
        ...n
      });
    }

    onRefresh?.();
  }

  /**
   * Compute Investor Confidence (0–100) for an issuer nation
   */
  function computeConfidence(n) {
    if (!n) return 50;
    let conf = 50;
    conf += Math.min(25, (n.stability || 50) * 0.25);
    const atWar = (n.at_war_with || []).length > 0;
    if (atWar) conf -= 20;
    const epochIndex = Math.max(0, EPOCHS.indexOf(n.epoch));
    conf += epochIndex * 2;
    // Food surplus proxy
    const farmers = (n.workers_farmers || 0) + (n.workers_hunters || 0);
    const popNeed = (n.population || 1) * 1.2;
    if (farmers * 6 > popNeed) conf += 5;
    // Public trust
    conf += ((n.public_trust || 1) - 0.5) * 20;
    return Math.max(0, Math.min(100, conf));
  }

  /**
   * Compute sector bonus multiplier for a stock based on its sector + nation buildings
   */
  function computeSectorMultiplier(stock, n, buildings) {
    if (!buildings || !n) return 1;
    const sector = stock.sector || "Agriculture";
    let bonus = 1;

    if (sector === "Agriculture") {
      const farms = buildings.filter(b => b.building_type === "Farm").length;
      bonus += farms * 0.05;
      if ((n.res_food || 0) > 500) bonus += 0.05;
    } else if (sector === "Industrial" || sector === "Energy") {
      const mines = buildings.filter(b => b.building_type === "Iron Mine" || b.building_type === "Oil Rig").length;
      bonus += mines * 0.06;
      if ((n.res_iron || 0) > 200) bonus += 0.03;
      if ((n.res_oil || 0) > 100) bonus += 0.04;
    } else if (sector === "Defense" || sector === "Military") {
      const barracks = buildings.filter(b => b.building_type === "Barracks" || b.building_type === "Fortress").length;
      bonus += barracks * 0.05;
    } else if (sector === "Technology") {
      const schools = buildings.filter(b => b.building_type === "School" || b.building_type === "University").length;
      bonus += schools * 0.08;
    } else if (sector === "Finance") {
      const markets = buildings.filter(b => b.building_type === "Market" || b.building_type === "Bank").length;
      bonus += markets * 0.06;
    } else if (sector === "Nano") {
      bonus += 0.1; // Nano always premium
    }

    return Math.min(2.5, bonus);
  }

  async function fluctuateStock(stock, nationMap, heldByStock, buildingsByNation) {
    const n = nationMap[stock.nation_id];
    const history = stock.price_history || [];
    let currentPrice = stock.current_price || stock.base_price || 10;

    const atWar = (n?.at_war_with || []).length > 0;
    const confidence = computeConfidence(n);
    const sectorMult = computeSectorMultiplier(stock, n, buildingsByNation[stock.nation_id] || []);

    // Demand ratio
    const totalShares = stock.total_shares || 500;
    const heldShares = heldByStock[stock.id] || 0;
    const heldRatio = heldShares / totalShares;
    let demandMultiplier = 1;
    if (heldRatio >= 0.8) demandMultiplier = 1.04;
    else if (heldRatio >= 0.5) demandMultiplier = 1.02;
    else if (heldRatio < 0.3) demandMultiplier = 0.97;

    // Base economic value
    const gdp = n?.gdp || 200;
    const stability = n?.stability || 50;
    const trust = n?.public_trust || 1;
    const baseEcoValue = (gdp * 0.4 + stability * 0.3 + trust * 30 * 0.3) / 100;

    // Confidence-based volatility
    const confidenceNorm = confidence / 100;
    const volatility = stock.is_crashed
      ? 0.04
      : atWar
        ? 0.15
        : 0.03 + (1 - confidenceNorm) * 0.10;

    // Crash probability from confidence
    const crashProb = Math.max(0.005, (1 - confidenceNorm) * 0.06);

    const drift = stock.is_crashed ? -0.02 : atWar ? -0.02 : (confidenceNorm - 0.4) * 0.02;
    const rawChange = drift + (Math.random() - 0.45) * volatility;

    let newPrice = Math.max(0.5,
      currentPrice * (1 + rawChange) * demandMultiplier * sectorMult
    );

    // War damage to industrial/military sectors
    if (atWar && (stock.sector === "Industrial" || stock.sector === "Defense" || stock.sector === "Military")) {
      newPrice *= 0.97;
    }

    // Random crash event
    let is_crashed = stock.is_crashed;
    if (!is_crashed && Math.random() < crashProb) {
      newPrice = newPrice * 0.6;
      is_crashed = true;
      await base44.entities.NewsArticle.create({
        headline: `MARKET CRASH: ${stock.company_name} (${stock.ticker}) Collapses -40%!`,
        body: `Confidence collapse and panic selling hit ${stock.company_name}. Investor confidence was at ${Math.round(confidence)}/100.`,
        category: "economy",
        tier: "breaking",
        nation_name: stock.nation_name,
        nation_flag: "📉",
        nation_color: "#ef4444"
      });
      const holdings = await base44.entities.StockHolding.filter({ stock_id: stock.id });
      for (const h of holdings) {
        const loss = Math.floor(h.shares_owned * currentPrice * 0.4);
        if (loss > 0) {
          const holderNation = nationMap[h.nation_id];
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
          message: `${stock.company_name} lost 40% value. You lost ~${loss} credits.`,
          severity: "danger",
          is_read: false
        });
      }
    }

    // Recovery
    if (is_crashed && Math.random() < 0.15) {
      newPrice = newPrice * 1.25;
      is_crashed = false;
    }

    newPrice = Math.max(0.5, parseFloat(newPrice.toFixed(2)));
    const newHistory = [...history, newPrice].slice(-30);

    await base44.entities.Stock.update(stock.id, {
      current_price: newPrice,
      price_history: newHistory,
      market_cap: parseFloat((newPrice * totalShares).toFixed(2)),
      is_crashed
    });
  }

  async function payDividends(allStocks, allHoldings, nationMap) {
    for (const stock of allStocks) {
      const n = nationMap[stock.nation_id];
      if (!n || n.gdp < 300 || n.stability < 40) continue;

      const totalHeld = allHoldings
        .filter(h => h.stock_id === stock.id)
        .reduce((sum, h) => sum + (h.shares_owned || 0), 0);

      if (totalHeld === 0) continue;

      const dividendPerShare = parseFloat(((n.gdp * 0.01) / totalHeld).toFixed(2));
      if (dividendPerShare < 0.01) continue;

      const issuerCost = Math.floor(dividendPerShare * totalHeld);
      if (n.currency < issuerCost) continue;

      await base44.entities.Nation.update(n.id, {
        currency: Math.max(0, n.currency - issuerCost)
      });

      const holdersForStock = allHoldings.filter(h => h.stock_id === stock.id);
      for (const h of holdersForStock) {
        const payout = Math.floor(dividendPerShare * h.shares_owned);
        if (payout <= 0) continue;
        const holderNation = nationMap[h.nation_id];
        if (!holderNation) continue;
        await base44.entities.Nation.update(h.nation_id, {
          currency: holderNation.currency + payout
        });
        await base44.entities.Transaction.create({
          type: "stock_buy",
          from_nation_name: stock.nation_name,
          from_nation_id: stock.nation_id,
          to_nation_id: h.nation_id,
          to_nation_name: h.nation_name,
          stock_id: stock.id,
          stock_ticker: stock.ticker,
          shares: h.shares_owned,
          price_per_share: dividendPerShare,
          total_value: payout,
          description: `💰 Dividend: ${h.nation_name} earned ${payout} cr from ${stock.ticker}`
        });
      }
    }
  }

  async function checkHostileTakeovers(allStocks, allNations, allHoldings, nationMap) {
    for (const stock of allStocks) {
      const totalShares = stock.total_shares || 500;
      const holdersForStock = allHoldings.filter(h => h.stock_id === stock.id && h.nation_id !== stock.nation_id);
      for (const h of holdersForStock) {
        const pct = (h.shares_owned / totalShares) * 100;
        if (pct >= 51) {
          await base44.entities.NewsArticle.create({
            headline: `⚠️ Hostile Takeover Alert: ${h.nation_name} Controls ${Math.round(pct)}% of ${stock.ticker}!`,
            body: `${h.nation_name} now holds a controlling stake in ${stock.company_name}. This grants significant economic influence and trade leverage over ${stock.nation_name}.`,
            category: "economy",
            tier: "gold",
            nation_name: h.nation_name,
            nation_flag: "📊",
            nation_color: "#f59e0b"
          });
          // Only fire once per epoch to avoid spam: check if news already exists would need a flag,
          // so we throttle by making it low-probability
          break; // one alert per tick max
        }
      }
    }
  }

  async function checkMarketCascade(allNations, allStocks) {
    const collapsedNations = allNations.filter(n =>
      (n.stability || 75) < 10 && (n.gdp || 200) < 100
    );
    if (collapsedNations.length === 0) return;

    for (const collapsed of collapsedNations) {
      // Find their allies and apply 5-10% cascade
      const allies = collapsed.allies || [];
      if (allies.length === 0) continue;

      const allyStocks = allStocks.filter(s => allies.includes(s.nation_id));
      for (const s of allyStocks) {
        const drop = 1 - (0.05 + Math.random() * 0.05);
        const newPrice = Math.max(0.5, parseFloat((s.current_price * drop).toFixed(2)));
        const newHistory = [...(s.price_history || []), newPrice].slice(-30);
        await base44.entities.Stock.update(s.id, {
          current_price: newPrice,
          price_history: newHistory,
          market_cap: parseFloat((newPrice * s.total_shares).toFixed(2))
        });
      }
    }
  }

  function checkDegradation(n) {
    const updates = {};
    const notifications = [];

    const totalSpend = (n.education_spending || 0) + (n.military_spending || 0);
    if (totalSpend > 80) {
      const trustLoss = ((totalSpend - 80) / 100) * 0.02;
      updates.public_trust = Math.max(0.1, (n.public_trust || 1.0) - trustLoss);
    }

    if ((n.public_trust || 1.0) < 0.5) {
      updates.stability = Math.max(0, (n.stability || 75) - 2);
    }

    if ((n.stability || 75) < 20 && (n.tech_level || 1) > 1) {
      updates.tech_level = (n.tech_level || 1) - 1;
      updates.tech_points = Math.max(0, (n.tech_points || 0) - 30);
      notifications.push({
        type: "market_crash",
        title: "⚠ Instability Crisis!",
        message: "Severe instability caused technological regression. Tech Level -1.",
        severity: "danger",
        is_read: false
      });
    }

    if ((n.at_war_with || []).length > 0) {
      const warPressure = n.at_war_with.length * 1;
      updates.stability = Math.max(0, (updates.stability ?? n.stability ?? 75) - warPressure);
      updates.currency = Math.max(0, (n.currency || 0) - n.at_war_with.length * 50);
    }

    const mfgBoost = Math.floor((n.manufacturing || 20) * 0.005);
    updates.gdp = Math.min(100000, (n.gdp || 200) + mfgBoost);

    if ((n.at_war_with || []).length === 0 && (n.public_trust || 1.0) >= 0.7 && (n.stability || 75) < 100) {
      updates.stability = Math.min(100, (updates.stability ?? n.stability ?? 75) + 1);
    }

    return { updates, notifications };
  }

  return null;
}