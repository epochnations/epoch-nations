import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS } from "../game/GameClock";

/**
 * GlobalCommodityEngine — headless admin-only price simulation
 * Runs every 90s. Aggregates all nations' production & consumption,
 * computes global supply/demand ratio, updates GlobalMarket prices.
 *
 * Price = BasPrice × (GlobalDemand / GlobalSupply)
 *
 * Only runs for admin to avoid N×players writes per tick.
 */

const BASE_PRICES = {
  food:          5,
  wood:          8,
  stone:         7,
  iron:          15,
  steel:         25,
  oil:           40,
  energy:        35,
  rare_minerals: 80,
};

// Commodity → nation resource field mapping
const COMMODITY_FIELD = {
  food:  "res_food",
  wood:  "res_wood",
  stone: "res_stone",
  iron:  "res_iron",
  oil:   "res_oil",
};

export default function GlobalCommodityEngine({ user }) {
  const intervalRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (user?.role !== "admin") return;
    const first = setTimeout(() => runTick(), 15_000);
    intervalRef.current = setInterval(() => runTick(), 90_000);
    return () => { clearTimeout(first); clearInterval(intervalRef.current); };
  }, [user?.role]);

  async function ensureMarketRecords() {
    if (initializedRef.current) return;
    const existing = await base44.entities.GlobalMarket.list();
    const existingSet = new Set(existing.map(m => m.commodity));
    for (const [commodity, base_price] of Object.entries(BASE_PRICES)) {
      if (!existingSet.has(commodity)) {
        await base44.entities.GlobalMarket.create({
          commodity,
          base_price,
          current_price: base_price,
          global_supply: 5000,
          global_demand: 5000,
          price_history: [base_price],
          shortage_active: false,
          shortage_reason: "",
          last_updated: new Date().toISOString(),
        });
      }
    }
    initializedRef.current = true;
  }

  async function runTick() {
    await ensureMarketRecords();

    // Aggregate all nation resource stockpiles as supply proxy
    const allNations = await base44.entities.Nation.list("-gdp", 100);

    const supplyTotals = { food: 0, wood: 0, stone: 0, iron: 0, oil: 0, steel: 0, energy: 0, rare_minerals: 0 };
    const demandTotals = { food: 0, wood: 0, stone: 0, iron: 0, oil: 0, steel: 0, energy: 0, rare_minerals: 0 };

    for (const n of allNations) {
      const pop      = n.population || 1;
      const epochIdx = ["Stone Age","Copper Age","Bronze Age","Iron Age","Dark Ages","Middle Ages",
        "Renaissance","Imperial Age","Enlightenment Age","Industrial Age","Modern Age","Atomic Age",
        "Digital Age","Genetic Age","Synthetic Age","Nano Age"].indexOf(n.epoch) || 0;

      // Supply = current stockpiles
      supplyTotals.food  += n.res_food  || 0;
      supplyTotals.wood  += n.res_wood  || 0;
      supplyTotals.stone += n.res_stone || 0;
      supplyTotals.iron  += n.res_iron  || 0;
      supplyTotals.oil   += n.res_oil   || 0;
      // Steel and energy are derived commodities — scale from iron/oil
      supplyTotals.steel         += Math.floor((n.res_iron || 0) * 0.3);
      supplyTotals.energy        += Math.floor((n.res_oil  || 0) * 0.5);
      supplyTotals.rare_minerals += Math.floor((n.res_gold || 0) * 0.2);

      // Demand = population needs + war consumption + industrial use
      const warMult  = (n.at_war_with || []).length > 0 ? 1.4 : 1.0;
      const indMult  = 1 + epochIdx * 0.05;
      demandTotals.food  += pop * 1.2;
      demandTotals.wood  += pop * 0.3 * indMult;
      demandTotals.stone += pop * 0.2 * indMult;
      demandTotals.iron  += pop * 0.15 * indMult * warMult;
      demandTotals.oil   += pop * 0.1  * indMult * warMult;
      demandTotals.steel         += pop * 0.08 * indMult * warMult;
      demandTotals.energy        += pop * 0.12 * indMult;
      demandTotals.rare_minerals += pop * 0.02 * indMult;
    }

    // War shortage: if any nation is in active war → boost demand for strategic goods
    const atWarCount = allNations.filter(n => (n.at_war_with || []).length > 0).length;
    if (atWarCount > 0) {
      const warBoost = 1 + atWarCount * 0.08;
      demandTotals.iron  *= warBoost;
      demandTotals.oil   *= warBoost;
      demandTotals.steel *= warBoost;
    }

    const markets = await base44.entities.GlobalMarket.list();

    for (const market of markets) {
      const c        = market.commodity;
      const supply   = Math.max(1, supplyTotals[c] || 1);
      const demand   = Math.max(1, demandTotals[c] || 1);
      const ratio    = demand / supply;

      // Price = BasePrice × (Demand / Supply), clamped 0.2×–5× base
      const rawPrice  = market.base_price * ratio;
      const newPrice  = Math.max(market.base_price * 0.2, Math.min(market.base_price * 5, rawPrice));

      // Smooth: move 5% per tick
      const smoothed  = parseFloat((market.current_price + (newPrice - market.current_price) * 0.05).toFixed(2));

      const history   = [...(market.price_history || []), smoothed].slice(-48); // keep 48 ticks

      const shortage  = ratio > 2.5;

      await base44.entities.GlobalMarket.update(market.id, {
        current_price:   smoothed,
        global_supply:   Math.round(supply),
        global_demand:   Math.round(demand),
        price_history:   history,
        shortage_active: shortage,
        shortage_reason: shortage
          ? atWarCount > 0 ? "War disrupting supply chains" : "High global demand"
          : "",
        last_updated: new Date().toISOString(),
      });
    }
  }

  return null;
}