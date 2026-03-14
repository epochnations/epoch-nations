/**
 * WarEngine — Realistic war simulation system.
 *
 * Handles:
 * - Ongoing war tick damage (attrition, supply lines, morale)
 * - Territory contested/captured during active wars
 * - War score calculation (used for peace terms)
 * - Automatic war events (border skirmishes, sieges, breakthroughs)
 * - War fatigue (stability drain scales with war duration)
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS } from "./GameClock";

// ── War score factors ─────────────────────────────────────────────────────────
function calcWarScore(attacker, defender) {
  const atkPower  = (attacker.unit_power || 10) * (attacker.tech_level || 1);
  const defPower  = (defender.defense_level || 10) * (defender.tech_level || 1);
  const atkEcon   = (attacker.gdp || 200) / 200;
  const defEcon   = (defender.gdp || 200) / 200;
  const atkMoral  = (attacker.stability || 50) / 100;
  const defMoral  = (defender.stability || 50) / 100;

  const atkScore = atkPower * atkEcon * atkMoral;
  const defScore = defPower * defEcon * defMoral;

  return { atkScore, defScore, advantage: atkScore / Math.max(defScore, 1) };
}

// ── Attrition damage per tick ─────────────────────────────────────────────────
function calcAttritionDamage(nation, warAge_ms) {
  const warDays  = warAge_ms / (30 * TICK_MS); // game days
  const fatigue  = Math.min(1.0, warDays / 30); // 0→1 over 30 game days
  const baseDrain = 0.5 + fatigue * 1.5; // 0.5 to 2.0 per tick
  const supplyCost = (nation.military_spending || 20) * 0.005;
  return { stabilityDrain: baseDrain, currencyCost: supplyCost };
}

// War event types with narrative messages
const WAR_EVENTS = [
  { id: "skirmish",    prob: 0.4, msg: (a, d) => `Border skirmish reported between ${a} and ${d} forces.` },
  { id: "siege",       prob: 0.15, msg: (a, d) => `${a} forces are besieging a key ${d} stronghold.` },
  { id: "breakthrough",prob: 0.1, msg: (a, d) => `${a} achieved a tactical breakthrough against ${d} defensive lines!` },
  { id: "retreat",     prob: 0.15, msg: (a, d) => `${d} troops have fallen back to defensive positions against ${a}.` },
  { id: "supply_cut",  prob: 0.1, msg: (a, d) => `${a} has disrupted ${d}'s supply lines, degrading their combat effectiveness.` },
  { id: "civilian",    prob: 0.1, msg: (a, d) => `Civilian displacement reported in the ${a}–${d} conflict zone.` },
];

function pickWarEvent(seed) {
  const roll = (seed % 1000) / 1000;
  let cum = 0;
  for (const e of WAR_EVENTS) {
    cum += e.prob;
    if (roll < cum) return e;
  }
  return WAR_EVENTS[0];
}

// ── Main war tick ─────────────────────────────────────────────────────────────
async function runWarTick(myNationId) {
  try {
    const allNations = await base44.entities.Nation.list("-gdp", 60);
    const warNations = allNations.filter(n => (n.at_war_with || []).length > 0);
    if (!warNations.length) return;

    const processed = new Set();

    for (const nation of warNations) {
      for (const enemyId of (nation.at_war_with || [])) {
        const pairKey = [nation.id, enemyId].sort().join("_");
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const enemy = allNations.find(n => n.id === enemyId);
        if (!enemy) continue;

        const warAge = nation.war_started_at
          ? Date.now() - new Date(nation.war_started_at).getTime()
          : 0;

        const { atkScore, defScore, advantage } = calcWarScore(nation, enemy);
        const atkAttrition = calcAttritionDamage(nation, warAge);
        const defAttrition = calcAttritionDamage(enemy, warAge);

        // Apply attrition to both sides
        const nationUpdates = {
          stability: Math.min(100, Math.max(0, Math.round((nation.stability || 50) - atkAttrition.stabilityDrain))),
          currency: Math.max(0, Math.round((nation.currency || 0) - atkAttrition.currencyCost * (nation.gdp || 200))),
        };
        const enemyUpdates = {
          stability: Math.min(100, Math.max(0, Math.round((enemy.stability || 50) - defAttrition.stabilityDrain))),
          currency: Math.max(0, Math.round((enemy.currency || 0) - defAttrition.currencyCost * (enemy.gdp || 200))),
        };

        // Stronger side deals extra damage to weaker
        if (advantage > 1.4) {
          const bonusDmg = Math.round((advantage - 1) * 2);
          enemyUpdates.stability = Math.min(100, Math.max(0, Math.round((enemyUpdates.stability ?? (enemy.stability || 50)) - bonusDmg)));
          enemyUpdates.gdp       = Math.max(100, Math.round((enemy.gdp || 200) - bonusDmg * 3));
        } else if (advantage < 0.7) {
          const bonusDmg = Math.round((1 - advantage) * 2);
          nationUpdates.stability = Math.min(100, Math.max(0, Math.round((nationUpdates.stability ?? (nation.stability || 50)) - bonusDmg)));
          nationUpdates.gdp       = Math.max(100, Math.round((nation.gdp || 200) - bonusDmg * 3));
        }

        await Promise.allSettled([
          base44.entities.Nation.update(nation.id, nationUpdates),
          base44.entities.Nation.update(enemy.id, enemyUpdates),
        ]);

        // Random war event narrative (20% chance per tick)
        if (Math.random() < 0.2) {
          const seed = Math.floor(Date.now() / 10000);
          const evt = pickWarEvent(seed);
          const msgA = advantage >= 1 ? nation.name : enemy.name;
          const msgD = advantage >= 1 ? enemy.name  : nation.name;
          await base44.entities.ChatMessage.create({
            channel: "system",
            sender_nation_name: "WAR DISPATCH",
            sender_flag: "⚔️",
            sender_color: "#ef4444",
            sender_role: "system",
            content: `⚔️ WAR UPDATE — ${evt.msg(msgA, msgD)}`,
          }).catch(() => {});
        }

        // Territorial pressure — contested hex tile transfer (5% chance)
        if (advantage > 1.2 && Math.random() < 0.05) {
          try {
            const enemyHexes = await base44.entities.HexTile.filter({ owner_nation_id: enemy.id });
            if (enemyHexes.length > 1) {
              const pick = enemyHexes[Math.floor(Math.random() * enemyHexes.length)];
              await base44.entities.HexTile.update(pick.id, {
                owner_nation_id: nation.id,
                owner_nation_name: nation.name,
                owner_color: nation.flag_color || "#3b82f6",
                owner_flag: nation.flag_emoji || "🏴",
              });
              await base44.entities.ChatMessage.create({
                channel: "system",
                sender_nation_name: "TERRITORIAL REPORT",
                sender_flag: "🗺️",
                sender_color: "#f97316",
                sender_role: "system",
                content: `🗺️ TERRITORY CAPTURED — ${nation.name} has seized a ${pick.terrain_type} hex tile from ${enemy.name}.`,
              }).catch(() => {});
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
}

export default function WarEngine({ myNation }) {
  const timerRef = useRef(null);
  const initRef  = useRef(false);

  useEffect(() => {
    if (!myNation?.id || initRef.current) return;
    initRef.current = true;

    // War tick every 3 minutes
    timerRef.current = setInterval(() => runWarTick(myNation.id), 3 * TICK_MS);

    return () => {
      clearInterval(timerRef.current);
      initRef.current = false;
    };
  }, [myNation?.id]);

  return null;
}