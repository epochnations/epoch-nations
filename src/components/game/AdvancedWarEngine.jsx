/**
 * AdvancedWarEngine — Full military simulation with unit types, weapons, tactics, and real-time combat.
 *
 * Unit types: Infantry, Tanks, Warships, Artillery, Air Force, Missiles, Special Ops
 * Each unit type has attack, defense, range, and cost stats.
 * Combat resolution uses rock-paper-scissors style counters + dice rolls.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS } from "./GameClock";

// ── Unit type definitions ──────────────────────────────────────────────────────
export const UNIT_TYPES = {
  infantry:    { name: "Infantry",    emoji: "👊", atk: 1.0, def: 0.8,  counter: "artillery", cost: 5,   range: "close"  },
  tanks:       { name: "Tanks",       emoji: "🪖", atk: 2.5, def: 2.0,  counter: "air",       cost: 30,  range: "medium" },
  warships:    { name: "Warships",    emoji: "⚓", atk: 3.0, def: 2.5,  counter: "missiles",  cost: 80,  range: "long"   },
  artillery:   { name: "Artillery",   emoji: "💣", atk: 2.0, def: 0.5,  counter: "air",       cost: 20,  range: "long"   },
  air_force:   { name: "Air Force",   emoji: "✈️", atk: 3.5, def: 1.5,  counter: "missiles",  cost: 60,  range: "global" },
  missiles:    { name: "Missiles",    emoji: "🚀", atk: 5.0, def: 0.1,  counter: "tanks",     cost: 50,  range: "global" },
  special_ops: { name: "Special Ops", emoji: "🥷", atk: 4.0, def: 1.0,  counter: "tanks",     cost: 40,  range: "close"  },
  navy_subs:   { name: "Submarines",  emoji: "🌊", atk: 3.5, def: 2.5,  counter: "warships",  cost: 70,  range: "global" },
};

// ── Weapons technology by epoch ────────────────────────────────────────────────
export const EPOCH_WEAPONS = {
  "Stone Age":      ["infantry"],
  "Bronze Age":     ["infantry"],
  "Iron Age":       ["infantry", "artillery"],
  "Classical Age":  ["infantry", "artillery"],
  "Medieval Age":   ["infantry", "artillery"],
  "Renaissance Age":["infantry", "artillery", "warships"],
  "Industrial Age": ["infantry", "artillery", "warships", "tanks"],
  "Modern Age":     ["infantry", "artillery", "warships", "tanks", "air_force"],
  "Digital Age":    ["infantry", "artillery", "warships", "tanks", "air_force", "missiles", "special_ops"],
  "Information Age":["infantry", "artillery", "warships", "tanks", "air_force", "missiles", "special_ops", "navy_subs"],
  "Space Age":      ["infantry", "artillery", "warships", "tanks", "air_force", "missiles", "special_ops", "navy_subs"],
  "Galactic Age":   ["infantry", "artillery", "warships", "tanks", "air_force", "missiles", "special_ops", "navy_subs"],
};

// ── Advanced war combat resolver ───────────────────────────────────────────────
function resolveAdvancedCombat(attacker, defender) {
  const atkUnits = getAvailableUnits(attacker);
  const defUnits = getAvailableUnits(defender);

  // Calculate composite military power with unit-type bonuses
  let atkPower = (attacker.unit_power || 10) * (attacker.tech_level || 1);
  let defPower = (defender.defense_level || 10) * (defender.tech_level || 1);

  // Unit type multipliers
  for (const unitKey of atkUnits) {
    const unit = UNIT_TYPES[unitKey];
    if (unit) atkPower *= (1 + unit.atk * 0.05);
  }
  for (const unitKey of defUnits) {
    const unit = UNIT_TYPES[unitKey];
    if (unit) defPower *= (1 + unit.def * 0.05);
  }

  // Economy modifier
  atkPower *= ((attacker.gdp || 200) / 500 + 0.5);
  defPower *= ((defender.gdp || 200) / 500 + 0.5);

  // Morale modifier
  atkPower *= ((attacker.stability || 50) / 100 + 0.2);
  defPower *= ((defender.stability || 50) / 100 + 0.2);

  // Random dice roll ±20%
  const atkRoll = atkPower * (0.8 + Math.random() * 0.4);
  const defRoll = defPower * (0.8 + Math.random() * 0.4);

  const advantage = atkRoll / Math.max(defRoll, 1);

  // Determine battle result
  let battleResult = "skirmish";
  if (advantage > 2.0)      battleResult = "decisive_victory";
  else if (advantage > 1.4) battleResult = "victory";
  else if (advantage > 0.7) battleResult = "stalemate";
  else if (advantage > 0.4) battleResult = "defeat";
  else                       battleResult = "rout";

  return { atkPower: atkRoll, defPower: defRoll, advantage, battleResult, atkUnits, defUnits };
}

function getAvailableUnits(nation) {
  const available = EPOCH_WEAPONS[nation.epoch] || ["infantry"];
  // Weight by military spending
  const milSpend = (nation.military_spending || 20) / 100;
  const count = Math.max(1, Math.floor(milSpend * available.length));
  return available.slice(0, count);
}

// ── Battle narrative generator ─────────────────────────────────────────────────
const BATTLE_NARRATIVES = {
  decisive_victory: [
    (a, d, u) => `${a}'s ${UNIT_TYPES[u]?.emoji || "⚔️"} ${UNIT_TYPES[u]?.name || "forces"} overwhelm ${d}'s defenses in a decisive engagement!`,
    (a, d)    => `DECISIVE VICTORY — ${a} forces have broken through ${d}'s lines completely.`,
    (a, d, u) => `${a}'s ${UNIT_TYPES[u]?.name || "forces"} achieve a crushing tactical victory against ${d}.`,
  ],
  victory: [
    (a, d, u) => `${a} ${UNIT_TYPES[u]?.emoji || "⚔️"} forces push back ${d}'s defenders in sustained fighting.`,
    (a, d)    => `${a} gains the upper hand in the ongoing conflict with ${d}.`,
    (a, d, u) => `${a}'s ${UNIT_TYPES[u]?.name || "forces"} advance against ${d} on multiple fronts.`,
  ],
  stalemate: [
    (a, d)    => `${a} and ${d} forces are locked in brutal trench warfare with no breakthrough.`,
    (a, d)    => `Neither ${a} nor ${d} can achieve a decisive advantage — the front holds.`,
    (a, d)    => `Heavy casualties on both sides as ${a}–${d} conflict grinds on.`,
  ],
  defeat: [
    (a, d, u) => `${a}'s ${UNIT_TYPES[u]?.name || "forces"} are pushed back by ${d}'s superior defenses.`,
    (a, d)    => `${a} suffers significant losses against ${d}'s defensive lines.`,
  ],
  rout: [
    (a, d)    => `${a} forces are in full retreat — ${d}'s military has routed the attacking army!`,
    (a, d)    => `CATASTROPHIC DEFEAT — ${a}'s offensive collapses under ${d}'s counterattack.`,
  ],
};

const UNIT_SPECIFIC_EVENTS = [
  { units: ["warships","navy_subs"], msg: (a, d) => `⚓ Naval engagement off the coast — ${a} and ${d} warships exchange fire.` },
  { units: ["air_force"],            msg: (a, d) => `✈️ Air superiority battle — ${a} fighters engage ${d}'s air defenses.` },
  { units: ["missiles"],             msg: (a, d) => `🚀 Missile strike launched by ${a} targeting ${d} infrastructure.` },
  { units: ["tanks"],                msg: (a, d) => `🪖 Armored column from ${a} advances into ${d} territory.` },
  { units: ["special_ops"],          msg: (a, d) => `🥷 ${a} special operations units conduct covert strike behind ${d} lines.` },
  { units: ["artillery"],            msg: (a, d) => `💣 ${a} artillery barrages ${d} fortifications across the front line.` },
];

function generateBattleNarrative(attackerName, defenderName, result, atkUnits, defUnits) {
  const narratives = BATTLE_NARRATIVES[result.battleResult] || BATTLE_NARRATIVES.stalemate;
  const allUnits = [...new Set([...atkUnits, ...defUnits])];
  const pickUnit = allUnits[Math.floor(Math.random() * allUnits.length)];
  const pickNarrative = narratives[Math.floor(Math.random() * narratives.length)];
  const mainMsg = pickNarrative(attackerName, defenderName, pickUnit);

  // Maybe add unit-specific flavor
  const unitEvent = UNIT_SPECIFIC_EVENTS.find(e =>
    e.units.some(u => atkUnits.includes(u) || defUnits.includes(u))
  );

  const messages = [mainMsg];
  if (unitEvent && Math.random() < 0.5) messages.push(unitEvent.msg(attackerName, defenderName));

  return messages;
}

// ── Damage calculation by battle result ───────────────────────────────────────
function calcBattleDamage(result, nation) {
  const base = { stability: 0.3, currency: 0, gdp: 0 };
  const multipliers = {
    decisive_victory: { winner: 0.1, loser: 3.0 },
    victory:          { winner: 0.3, loser: 1.5 },
    stalemate:        { winner: 0.8, loser: 0.8 },
    defeat:           { winner: 1.5, loser: 0.3 },
    rout:             { winner: 3.0, loser: 0.1 },
  };
  return multipliers[result] || multipliers.stalemate;
}

// ── Main advanced war tick ─────────────────────────────────────────────────────
async function runAdvancedWarTick() {
  try {
    const allNations = await base44.entities.Nation.list("-unit_power", 80);
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

        // Full advanced combat resolution
        const combatResult = resolveAdvancedCombat(nation, enemy);
        const { advantage, battleResult, atkUnits, defUnits } = combatResult;

        // Fatigue modifier
        const warDays = warAge / (30 * TICK_MS);
        const fatigue = Math.min(1.5, warDays / 20);

        // Damage multipliers
        const dmg = calcBattleDamage(battleResult);
        const atkIsWinner = advantage >= 1.0;
        const atkMult = atkIsWinner ? dmg.winner_mult || dmg.winner : dmg.loser;
        const defMult = atkIsWinner ? dmg.loser : dmg.winner_mult || dmg.winner;

        const baseStabDrain = 0.4 + fatigue * 0.6;
        const baseCurrDrain = (nation.military_spending || 20) * 0.003;

        const nationUpdates = {
          stability: Math.min(100, Math.max(0, Math.round(
            (nation.stability || 50) - baseStabDrain * (atkIsWinner ? 1 : (dmg.loser || 1.5))
          ))),
          currency: Math.max(0, Math.round(
            (nation.currency || 0) - baseCurrDrain * (nation.gdp || 200) * (atkIsWinner ? 0.5 : 1.5)
          )),
        };
        const enemyUpdates = {
          stability: Math.min(100, Math.max(0, Math.round(
            (enemy.stability || 50) - baseStabDrain * (atkIsWinner ? (dmg.loser || 1.5) : 1)
          ))),
          currency: Math.max(0, Math.round(
            (enemy.currency || 0) - baseCurrDrain * (enemy.gdp || 200) * (atkIsWinner ? 1.5 : 0.5)
          )),
        };

        // GDP damage on decisive results
        if (battleResult === "decisive_victory" || battleResult === "rout") {
          const loser = atkIsWinner ? enemy : nation;
          const loserUpdates = atkIsWinner ? enemyUpdates : nationUpdates;
          loserUpdates.gdp = Math.max(100, Math.round((loser.gdp || 200) - advantage * 5));
          loserUpdates.manufacturing = Math.max(10, Math.round((loser.manufacturing || 50) - advantage * 2));
        }

        await Promise.allSettled([
          base44.entities.Nation.update(nation.id, nationUpdates),
          base44.entities.Nation.update(enemy.id, enemyUpdates),
        ]);

        // Generate battle narrative messages
        if (Math.random() < 0.35) {
          const attackerName = atkIsWinner ? nation.name : enemy.name;
          const defenderName = atkIsWinner ? enemy.name : nation.name;
          const msgs = generateBattleNarrative(attackerName, defenderName, combatResult, atkUnits, defUnits);

          for (const msg of msgs) {
            await base44.entities.ChatMessage.create({
              channel: "system",
              sender_nation_name: "WAR DISPATCH",
              sender_flag: "⚔️",
              sender_color: "#ef4444",
              sender_role: "system",
              content: `⚔️ ${msg}`,
            }).catch(() => {});
          }
        }

        // Territorial pressure with unit-type flavor (5% per tick)
        if (advantage > 1.2 && Math.random() < 0.06) {
          try {
            const winner = atkIsWinner ? nation : enemy;
            const loser  = atkIsWinner ? enemy  : nation;
            const enemyHexes = await base44.entities.HexTile.filter({ owner_nation_id: loser.id });
            if (enemyHexes.length > 1) {
              const pick = enemyHexes[Math.floor(Math.random() * enemyHexes.length)];
              await base44.entities.HexTile.update(pick.id, {
                owner_nation_id: winner.id,
                owner_nation_name: winner.name,
                owner_color: winner.flag_color || "#3b82f6",
                owner_flag: winner.flag_emoji || "🏴",
              });
              const capUnit = atkUnits.includes("tanks") ? "🪖 Armored forces" : atkUnits.includes("air_force") ? "✈️ Air-supported troops" : "⚔️ Ground forces";
              await base44.entities.ChatMessage.create({
                channel: "system",
                sender_nation_name: "TERRITORIAL REPORT",
                sender_flag: "🗺️",
                sender_color: "#f97316",
                sender_role: "system",
                content: `🗺️ TERRITORY CAPTURED — ${capUnit} from ${winner.name} have seized a ${pick.terrain_type} hex tile from ${loser.name}.`,
              }).catch(() => {});
            }
          } catch (_) {}
        }

        // News article for major battles (decisive results)
        if ((battleResult === "decisive_victory" || battleResult === "rout") && Math.random() < 0.4) {
          const winner = atkIsWinner ? nation : enemy;
          const loser  = atkIsWinner ? enemy  : nation;
          const unitEmojis = atkUnits.map(u => UNIT_TYPES[u]?.emoji || "⚔️").join("");
          await base44.entities.NewsArticle.create({
            headline: `${unitEmojis} MAJOR BATTLE: ${winner.name} Scores ${battleResult === "rout" ? "Crushing" : "Decisive"} Victory Over ${loser.name}`,
            body: `In a major military engagement, ${winner.name} forces achieved a ${battleResult.replace("_", " ")} against ${loser.name}. Units deployed: ${atkUnits.map(u => UNIT_TYPES[u]?.name).join(", ")}.`,
            category: "war", tier: "breaking",
            nation_name: winner.name, nation_flag: winner.flag_emoji, nation_color: winner.flag_color,
          }).catch(() => {});
        }
      }
    }
  } catch (_) {}
}

export default function AdvancedWarEngine({ myNation }) {
  const timerRef = useRef(null);
  const initRef  = useRef(false);

  useEffect(() => {
    if (!myNation?.id || initRef.current) return;
    initRef.current = true;
    // Advanced war tick every 3 minutes (same as original but with richer simulation)
    timerRef.current = setInterval(() => runAdvancedWarTick(), 3 * TICK_MS);
    return () => {
      clearInterval(timerRef.current);
      initRef.current = false;
    };
  }, [myNation?.id]);

  return null;
}