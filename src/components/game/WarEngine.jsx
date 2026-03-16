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

// ── AI Nation name/leader pools ───────────────────────────────────────────────
const AI_NATION_NAMES = [
  "Valdoria","Ironveil","Stormcrest","Ashenfell","Caldenmoor","Riftgate","Ebonshire",
  "Thornwall","Solmara","Duskholm","Velarion","Greyspire","Cindral","Aurenveil",
  "Frostmere","Brightmoor","Shadowfen","Ironpeak","Goldenvast","Embervale",
  "Stonereach","Wyverholt","Skymere","Ashvale","Copperfield","Ironwood","Silvanus",
  "Darkwater","Bloodhaven","Starforge","Ravenmoor","Dawnspire","Steelgate","Cinderhold",
  "Moonveil","Sunreach","Stormveil","Ironclad","Ashrock","Coldwater","Firehaven",
  "Thunderpeak","Stonewall","Ironmoor","Emberveil","Goldenrock","Silverstone",
  "Darkwood","Bloodstone","Starfall","Ravencrest","Dawnbreak","Steelwall","Cinderspire",
  "Moonstone","Sunfall","Stormrock","Ironsong","Ashwood","Coldstone","Firewood",
];
const AI_LEADERS = [
  "Emperor Valdris","Chancellor Meira","High Consul Doran","Warlord Thenka",
  "President Alek","Grand Marshal Sorin","Empress Lyria","Director Voss",
  "Archon Caelum","Supreme Leader Ryx","Protector Sable","Commander Vane",
  "Premier Orik","Grand Vizier Selene","Overseer Kael","Chieftain Brax",
  "Regent Mira","Admiral Zoryn","Governor Thessa","High King Edran",
  "Matriarch Zuna","Patriarch Drev","Chancellor Fyra","General Strix",
  "Consul Aven","Warden Tova","Elder Khosa","Duke Revas","Countess Lyren",
  "Baron Threx","Magistrate Cova","Warlord Skaar","Ambassador Vael","Praetor Nyx",
];
const AI_EPOCHS = ["Stone Age","Bronze Age","Iron Age","Classical Age","Medieval Age"];
const AI_GOV_TYPES = [
  "Democracy","Constitutional Monarchy","Absolute Monarchy","Federal Republic",
  "Socialist Republic","Military Junta","Oligarchy","Theocracy","Technocracy","Confederation"
];
const AI_EMOJIS = ["🦅","🐉","🌟","🔱","🛡️","🌙","☀️","🦁","🐯","🌊","⚔️","🏔️","🦊","🐺","🦋"];
const AI_COLORS = ["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#06b6d4","#f97316","#ec4899","#84cc16","#e11d48"];

const AI_OWNER_PREFIX = "ai_bot_";

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function createNewAINations(count) {
  const existing = await base44.entities.Nation.list("-created_date", 100).catch(() => []);
  const usedNames = new Set(existing.map(n => n.name));

  for (let i = 0; i < count; i++) {
    let name = randFrom(AI_NATION_NAMES);
    // Ensure unique name
    let attempts = 0;
    while (usedNames.has(name) && attempts < 20) {
      const suffix = ["Empire","Republic","Kingdom","State","Federation","Dominion","Alliance","Union","Pact","Coalition"];
      name = `${randFrom(AI_NATION_NAMES)} ${randFrom(suffix)}`;
      attempts++;
    }
    usedNames.add(name);

    const leader = randFrom(AI_LEADERS);
    const epoch = randFrom(AI_EPOCHS);
    const epochIdx = ["Stone Age","Bronze Age","Iron Age","Classical Age","Medieval Age"].indexOf(epoch);
    const govType = randFrom(AI_GOV_TYPES);
    const flagEmoji = randFrom(AI_EMOJIS);
    const flagColor = randFrom(AI_COLORS);
    const ownerEmail = `${AI_OWNER_PREFIX}${Date.now()}_${i}@epoch.nations`;

    // Scale starting stats based on epoch
    const techMult = 1 + epochIdx * 0.5;
    const gdp = Math.round((300 + Math.random() * 400) * techMult);
    const stability = Math.round(60 + Math.random() * 25);
    const currency = Math.round((400 + Math.random() * 600) * techMult);
    const unitPower = Math.round((15 + Math.random() * 20) * techMult);
    const techPoints = Math.round(epochIdx * 120 + Math.random() * 80);
    const techLevel = Math.max(1, epochIdx + 1);
    const population = Math.round(12 + Math.random() * 20 + epochIdx * 5);

    try {
      const nation = await base44.entities.Nation.create({
        name,
        leader,
        owner_email: ownerEmail,
        government_type: govType,
        epoch,
        tech_points: techPoints,
        tech_level: techLevel,
        gdp,
        gdp_prev_tick: gdp,
        national_wealth: gdp * 1.5,
        stability,
        public_trust: 0.9 + Math.random() * 0.4,
        currency,
        savings_balance: Math.round(currency * 0.3),
        currency_name: "Credits",
        currency_stability: 0.95 + Math.random() * 0.1,
        manufacturing: Math.round(40 + Math.random() * 60),
        education_spending: Math.round(20 + Math.random() * 20),
        military_spending: Math.round(15 + Math.random() * 25),
        unit_power: unitPower,
        defense_level: Math.round(unitPower * 0.8),
        population,
        housing_capacity: population + Math.round(5 + Math.random() * 10),
        flag_color: flagColor,
        flag_emoji: flagEmoji,
        allies: [],
        at_war_with: [],
        unlocked_techs: [],
        tax_rates: { income: 15 + Math.round(Math.random() * 10), sales: 8 + Math.round(Math.random() * 5), corporate: 12 + Math.round(Math.random() * 8), tariff: 5 + Math.round(Math.random() * 5) },
        res_wood: Math.round(150 + Math.random() * 200),
        res_stone: Math.round(100 + Math.random() * 200),
        res_gold: Math.round(60 + Math.random() * 100),
        res_oil: epochIdx >= 3 ? Math.round(Math.random() * 150) : 0,
        res_iron: epochIdx >= 1 ? Math.round(50 + Math.random() * 150) : 0,
        res_food: Math.round(200 + Math.random() * 300),
        workers_farmers: 3 + Math.round(Math.random() * 3),
        workers_hunters: 1 + Math.round(Math.random() * 2),
        workers_lumberjacks: 2 + Math.round(Math.random() * 2),
        workers_quarry: 1 + Math.round(Math.random() * 2),
        workers_miners: 1 + Math.round(Math.random() * 2),
        workers_iron_miners: epochIdx >= 1 ? Math.round(Math.random() * 2) : 0,
        workers_oil_engineers: epochIdx >= 3 ? Math.round(Math.random() * 2) : 0,
        workers_builders: 1,
        workers_soldiers: Math.round(1 + Math.random() * 3),
        workers_researchers: 1 + Math.round(Math.random() * 2),
        workers_industrial: epochIdx >= 2 ? Math.round(Math.random() * 3) : 0,
        workers_fishermen: Math.round(Math.random() * 2),
      });

      // Create initial stock
      const ticker = name.replace(/[^A-Za-z]/g, "").substring(0, 4).toUpperCase() || "NATN";
      const basePrice = Math.max(4, Math.min(60, parseFloat((5 + (gdp / 100) * techMult).toFixed(2))));
      const totalShares = 500 + epochIdx * 100;
      const sector = epochIdx >= 3 ? "Technology" : epochIdx >= 2 ? "Finance" : unitPower > 25 ? "Defense" : "Agriculture";
      await base44.entities.Stock.create({
        company_name: `${name} National Corp`,
        ticker,
        nation_id: nation.id,
        nation_name: name,
        sector,
        total_shares: totalShares,
        available_shares: totalShares,
        base_price: basePrice,
        current_price: basePrice,
        price_history: [basePrice],
        market_cap: basePrice * totalShares,
        is_crashed: false,
        epoch_required: epoch,
      });

      // Announce birth
      await base44.entities.ChatMessage.create({
        channel: "global",
        sender_nation_name: "WORLD HERALD",
        sender_flag: flagEmoji,
        sender_color: flagColor,
        sender_role: "system",
        content: `🌟 NEW NATION FOUNDED — ${flagEmoji} ${name} has risen! Led by ${leader} under a ${govType} government, entering the world stage in the ${epoch}. GDP: ${gdp.toLocaleString()} | Military Power: ${unitPower} | Population: ${population}M`,
      }).catch(() => {});

      await base44.entities.WorldChronicle.create({
        event_type: "narrative",
        title: `${name} Rises`,
        summary: `A new nation, ${name}, has emerged on the world stage under ${leader}'s ${govType} in the ${epoch}. With a GDP of ${gdp} and military power of ${unitPower}, they are ready to forge their destiny.`,
        actors: [name],
        importance: "medium",
        era_tag: epoch,
      }).catch(() => {});

    } catch (_) {}

    // Stagger creation
    await new Promise(r => setTimeout(r, 800));
  }
}

// ── Defeat detection & nation removal ────────────────────────────────────────
async function checkAndRemoveDefeatedNations() {
  try {
    const allNations = await base44.entities.Nation.list("-gdp", 100);

    for (const nation of allNations) {
      const isDefeated =
        (nation.stability || 0) <= 0 &&
        (nation.currency || 0) <= 0;

      if (!isDefeated) continue;

      // 1. Delete their stocks
      const stocks = await base44.entities.Stock.filter({ nation_id: nation.id }).catch(() => []);
      for (const stock of stocks) {
        // Delete all holdings of this stock
        const holdings = await base44.entities.StockHolding.filter({ stock_id: stock.id }).catch(() => []);
        for (const h of holdings) {
          await base44.entities.StockHolding.delete(h.id).catch(() => {});
        }
        await base44.entities.Stock.delete(stock.id).catch(() => {});
      }

      // 2. Remove from all other nations' allies / at_war_with lists
      for (const other of allNations) {
        if (other.id === nation.id) continue;
        const needsUpdate = {};
        if ((other.allies || []).includes(nation.id)) {
          needsUpdate.allies = (other.allies || []).filter(id => id !== nation.id);
        }
        if ((other.at_war_with || []).includes(nation.id)) {
          needsUpdate.at_war_with = (other.at_war_with || []).filter(id => id !== nation.id);
        }
        if (Object.keys(needsUpdate).length) {
          await base44.entities.Nation.update(other.id, needsUpdate).catch(() => {});
        }
      }

      // 3. Announce elimination
      await base44.entities.ChatMessage.create({
        channel: "global",
        sender_nation_name: "WORLD HERALD",
        sender_flag: "💀",
        sender_color: "#ef4444",
        sender_role: "system",
        content: `💀 NATION ELIMINATED — ${nation.name} has collapsed and been removed from the world stage.`,
      }).catch(() => {});

      // 4. Delete the nation
      await base44.entities.Nation.delete(nation.id).catch(() => {});
    }
  } catch (_) {}
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

    // Check for defeated nations immediately + on every war tick
    checkAndRemoveDefeatedNations();

    // War tick every 3 minutes
    timerRef.current = setInterval(() => {
      runWarTick(myNation.id);
      checkAndRemoveDefeatedNations();
    }, 3 * TICK_MS);

    return () => {
      clearInterval(timerRef.current);
      initRef.current = false;
    };
  }, [myNation?.id]);

  return null;
}