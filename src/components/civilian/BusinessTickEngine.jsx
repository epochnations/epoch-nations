/**
 * BusinessTickEngine — Headless engine that runs every 10 seconds.
 * Generates revenue/expenses for open businesses and updates citizen savings + XP.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const TICK_MS = 10000; // 10 seconds

export default function BusinessTickEngine({ citizen, businesses, onRefresh }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!citizen?.id || !businesses?.length) return;

    async function tick() {
      if (!citizen?.id) return;
      const openBizs = businesses.filter(b => b.is_open);
      if (!openBizs.length) return;

      let totalProfit = 0;
      const updates = [];

      for (const biz of openBizs) {
        const profit = (biz.revenue_per_tick || 0) - (biz.expenses_per_tick || 0);
        const repGain = profit > 0 ? Math.ceil(profit / 10) : -1;
        const newRep  = Math.min(100, Math.max(0, (biz.reputation || 50) + repGain));
        const custGain = Math.max(0, Math.floor((biz.revenue_per_tick || 0) / 5 + Math.random() * 3));
        totalProfit += profit;
        updates.push(base44.entities.Business.update(biz.id, {
          total_earned: (biz.total_earned || 0) + Math.max(0, profit),
          reputation:   newRep,
          customers_served: (biz.customers_served || 0) + custGain,
        }));
      }

      // Update citizen savings + XP
      const xpGain = openBizs.length * 2;
      const newXP  = (citizen.experience || 0) + xpGain;
      const newLvl = 1 + Math.floor(newXP / 100);
      const vitals = {
        savings: Math.max(0, (citizen.savings || 0) + totalProfit),
        experience: newXP,
        level: newLvl,
        hunger: Math.max(0, (citizen.hunger || 100) - 2),
        energy: Math.max(0, (citizen.energy || 100) - 1),
        happiness: Math.min(100, (citizen.happiness || 75) + (totalProfit > 0 ? 1 : -1)),
      };
      updates.push(base44.entities.Citizen.update(citizen.id, vitals));

      await Promise.allSettled(updates);
      onRefresh();
    }

    timerRef.current = setInterval(tick, TICK_MS);
    return () => clearInterval(timerRef.current);
  }, [citizen?.id, businesses?.length]);

  return null;
}