/**
 * ResearchEngine — headless component
 * Runs every 90 seconds, advances all in-progress research for the player's nation.
 * On completion: applies effects, posts global announcement for breakthroughs.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { RESEARCH_MAP, calcResearchSpeed } from "../game/ResearchConfig";
import { TICK_MS } from "../game/GameClock";

export default function ResearchEngine({ nation, buildings, onRefresh }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!nation?.id) return;
    tick();
    timerRef.current = setInterval(tick, TICK_MS);
    return () => clearInterval(timerRef.current);
  }, [nation?.id]);

  async function tick() {
    if (!nation?.id) return;

    const [activeResearch, freshBuildings] = await Promise.all([
      base44.entities.Research.filter({ nation_id: nation.id, status: "in_progress" }),
      base44.entities.Building.filter({ nation_id: nation.id })
    ]);

    if (activeResearch.length === 0) return;

    const speed = calcResearchSpeed(nation, freshBuildings);
    const nationEffectUpdates = {};

    for (const r of activeResearch) {
      const tech = RESEARCH_MAP[r.tech_id];
      if (!tech) continue;

      const newInvested = r.points_invested + speed;
      const newProgress = Math.min(100, (newInvested / r.required_points) * 100);
      const completed = newProgress >= 100;

      if (completed) {
        // Apply tech effects to nation
        const effects = tech.effects || {};
        for (const [key, val] of Object.entries(effects)) {
          // Skip special bonus keys (handled elsewhere)
          if (["food_prod_bonus", "wood_prod_bonus", "stone_prod_bonus", "pop_growth_bonus"].includes(key)) continue;
          nationEffectUpdates[key] = (nationEffectUpdates[key] || (nation[key] || 0)) + val;
        }
        if (nationEffectUpdates.public_trust !== undefined) {
          nationEffectUpdates.public_trust = Math.min(2.0, nationEffectUpdates.public_trust);
        }

        await base44.entities.Research.update(r.id, {
          status: "completed",
          progress: 100,
          points_invested: r.required_points,
          first_discovered_by: r.is_global_breakthrough ? nation.name : ""
        });

        // Global breakthrough announcement
        if (r.is_global_breakthrough) {
          // Check if this nation is first
          const prev = await base44.entities.Research.filter({
            tech_id: r.tech_id, status: "completed"
          });
          const alreadyDiscovered = prev.filter(p => p.nation_id !== nation.id).length > 0;

          if (!alreadyDiscovered) {
            // First discovery! Big bonuses
            nationEffectUpdates.gdp = (nationEffectUpdates.gdp || (nation.gdp || 0)) + 500;
            nationEffectUpdates.stability = Math.min(100, (nationEffectUpdates.stability || (nation.stability || 75)) + 5);

            await base44.entities.NewsArticle.create({
              headline: `⚡ GLOBAL BREAKTHROUGH: ${nation.name} has discovered ${tech.name}!`,
              body: `In a landmark scientific achievement, ${nation.name} became the first nation in the world to unlock ${tech.name} (${tech.emoji}). This breakthrough grants economic and prestige bonuses to ${nation.name}. Other nations may now research this technology, but at reduced speed.`,
              category: "tech",
              tier: "breaking",
              nation_name: nation.name,
              nation_flag: nation.flag_emoji,
              nation_color: nation.flag_color
            });

            await base44.entities.Notification.create({
              target_owner_email: nation.owner_email,
              target_nation_id: nation.id,
              type: "tech_unlocked",
              title: `🏆 Global Breakthrough: ${tech.name}!`,
              message: `Your nation is the FIRST in the world to discover ${tech.name}! +500 GDP, +5 Stability prestige bonus awarded.`,
              severity: "success",
              is_read: false
            });
          } else {
            // Diffusion completion
            await base44.entities.Notification.create({
              target_owner_email: nation.owner_email,
              target_nation_id: nation.id,
              type: "tech_unlocked",
              title: `🔬 Research Complete: ${tech.name}`,
              message: `${nation.name} has completed research on ${tech.name}. Effects applied.`,
              severity: "success",
              is_read: false
            });
          }
        } else {
          // Normal research complete
          await base44.entities.Notification.create({
            target_owner_email: nation.owner_email,
            target_nation_id: nation.id,
            type: "tech_unlocked",
            title: `🔬 Research Complete: ${tech.name}`,
            message: `${tech.name} research finished! ${tech.desc}`,
            severity: "success",
            is_read: false
          });
        }
      } else {
        await base44.entities.Research.update(r.id, {
          points_invested: newInvested,
          progress: parseFloat(newProgress.toFixed(1))
        });
      }
    }

    // Apply accumulated nation updates
    if (Object.keys(nationEffectUpdates).length > 0) {
      await base44.entities.Nation.update(nation.id, nationEffectUpdates);
    }

    onRefresh?.();
  }

  return null;
}