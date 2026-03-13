import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Swords, AlertTriangle, DollarSign, Zap, Shield, TrendingDown, Users } from "lucide-react";

// ── Animated particles for battle scene ──────────────────────────────────────
function Particle({ x, y, color, size, delay }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color }}
      initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      animate={{ opacity: 0, scale: 0, x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 }}
      transition={{ duration: 0.8 + Math.random() * 0.6, delay, ease: "easeOut" }}
    />
  );
}

function ExplosionBurst({ active, isCritical }) {
  const particles = Array.from({ length: isCritical ? 24 : 14 }, (_, i) => ({
    id: i,
    x: `${40 + Math.random() * 20}%`,
    y: `${30 + Math.random() * 40}%`,
    color: isCritical
      ? ["#ff4444","#ff8800","#ffdd00","#ff2200","#ffffff"][i % 5]
      : ["#ff4444","#ff8800","#ffdd00","#ff6600"][i % 4],
    size: 4 + Math.random() * 8,
    delay: i * 0.04,
  }));
  if (!active) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => <Particle key={p.id} {...p} />)}
    </div>
  );
}

// ── Animated stat bar ──────────────────────────────────────────────────────────
function DamageBar({ label, value, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between"
    >
      <span className="text-slate-500 text-xs flex items-center gap-1">{icon}{label}</span>
      <motion.span
        className="text-red-400 font-mono text-xs font-bold"
        initial={{ scale: 1.4, color: "#ff0000" }}
        animate={{ scale: 1, color: "#f87171" }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {value}
      </motion.span>
    </motion.div>
  );
}

// ── Loading battle screen ──────────────────────────────────────────────────────
function BattleLoadingScreen({ myNation, targetNation, phase }) {
  const phases = [
    "Mobilizing forces...",
    "Launching assault...",
    "Calculating casualties...",
    "Transferring territory & assets...",
    "Updating world records...",
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}>

      {/* Animated war background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-px"
            style={{
              left: `${Math.random() * 100}%`,
              top: "-10%",
              height: `${30 + Math.random() * 40}%`,
              background: `linear-gradient(180deg, transparent, ${i % 3 === 0 ? "#ff4400" : i % 3 === 1 ? "#ff8800" : "#ffdd00"}88, transparent)`,
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: [0, 0.8, 0], y: ["0%", "120%"] }}
            transition={{ duration: 1 + Math.random(), delay: Math.random() * 1.5, repeat: Infinity, repeatDelay: Math.random() * 2 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative text-center space-y-8 z-10 max-w-sm w-full"
      >
        {/* Battle scene */}
        <div className="flex items-center justify-center gap-6">
          <motion.div
            animate={{ x: [0, 8, 0], rotate: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
            className="text-center"
          >
            <div className="text-5xl filter drop-shadow-lg">{myNation.flag_emoji}</div>
            <div className="text-[10px] text-green-400 font-bold ep-mono mt-1">ATTACKING</div>
          </motion.div>

          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 0.3 }}
              className="text-4xl"
            >
              ⚔️
            </motion.div>
            {/* Shockwave rings */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-red-500"
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 3 + i, opacity: 0 }}
                transition={{ duration: 1, delay: i * 0.3, repeat: Infinity, repeatDelay: 0.5 }}
              />
            ))}
          </div>

          <motion.div
            animate={{ x: [0, -5, 0], rotate: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 0.35 }}
            className="text-center"
          >
            <div className="text-5xl filter drop-shadow-lg">{targetNation.flag_emoji}</div>
            <div className="text-[10px] text-red-400 font-bold ep-mono mt-1">DEFENDING</div>
          </motion.div>
        </div>

        {/* Phase text */}
        <div className="space-y-3">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-bold text-lg"
          >
            {phases[Math.min(phase, phases.length - 1)]}
          </motion.div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #ef4444, #f97316, #fbbf24)" }}
              initial={{ width: "5%" }}
              animate={{ width: `${Math.min(95, (phase + 1) * 20)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          <div className="text-xs text-slate-500 ep-mono">
            {myNation.name} vs {targetNation.name}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function WarModal({ targetNation, myNation, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [loadPhase, setLoadPhase] = useState(0);
  const [result, setResult] = useState(null);
  const [showExplosion, setShowExplosion] = useState(false);
  const [warFundPct, setWarFundPct] = useState(8); // slider: 5–30%

  if (!targetNation || !myNation) return null;

  const treasury = myNation.currency || 0;
  const warCost = Math.floor(treasury * (warFundPct / 100));
  const canAffordWar = treasury >= warCost && warCost > 0;

  // Damage scales with how much you're willing to spend (more investment = more firepower)
  const fundMultiplier = warFundPct / 8; // baseline at 8%
  const baseDamage = (myNation.tech_level / Math.max(targetNation.defense_level, 1)) * myNation.unit_power;
  const damage = baseDamage * fundMultiplier;
  const isCritical = damage > 40;

  // ── "Remaining to conquer" — how many more hits needed ──────────────────
  const defStab    = targetNation.stability     || 0;
  const defGdp     = targetNation.gdp           || 0;
  const defMfg     = targetNation.manufacturing || 0;
  const defTreasury= targetNation.currency      || 0;

  // Damage per attack to each stat
  const dmgStab = Math.floor(damage * 0.4);
  const dmgGdp  = Math.floor(damage * 3);
  const dmgMfg  = Math.floor(damage * 0.2);
  const dmgTrs  = Math.floor(damage * 5);

  // How many strikes to zero each pillar (capped so it doesn't divide by 0)
  const hitsNeeded = dmgStab > 0 ? Math.ceil(defStab / dmgStab)       : Infinity;
  const hitsGdp    = dmgGdp  > 0 ? Math.ceil((defGdp - 100) / dmgGdp) : Infinity;
  const hitsMfg    = dmgMfg  > 0 ? Math.ceil((defMfg - 10)  / dmgMfg) : Infinity;
  const hitsTrs    = dmgTrs  > 0 ? Math.ceil(defTreasury / dmgTrs)     : Infinity;
  const conquestHits = Math.max(hitsNeeded, Math.max(hitsGdp, Math.max(hitsMfg, hitsTrs)));

  // Progress bars for each pillar (0% = already at floor, 100% = full health)
  const stabPct = Math.min(100, (defStab / 100) * 100);
  const gdpPct  = Math.min(100, Math.max(0, (defGdp - 100) / (defGdp || 1) * 100));
  const mfgPct  = Math.min(100, Math.max(0, (defMfg - 10)  / (defMfg || 1) * 100));
  const trsPct  = Math.min(100, (defTreasury / Math.max(defTreasury, 1)) * 100);

  async function launchAttack() {
    if (!canAffordWar) return;
    setLoading(true);
    setLoadPhase(0);

    const damageDealt = parseFloat(damage.toFixed(1));
    const phaseTimer = setInterval(() => setLoadPhase(p => Math.min(p + 1, 4)), 600);

    const attackerWarList = [...(myNation.at_war_with || [])];
    if (!attackerWarList.includes(targetNation.id)) attackerWarList.push(targetNation.id);
    const defenderWarList = [...(targetNation.at_war_with || [])];
    if (!defenderWarList.includes(myNation.id)) defenderWarList.push(myNation.id);

    let defenderUpdates = {
      at_war_with: defenderWarList,
      stability: Math.max(0, targetNation.stability - Math.floor(damageDealt * 0.4)),
      gdp: Math.max(100, targetNation.gdp - Math.floor(damageDealt * 3)),
      manufacturing: Math.max(10, targetNation.manufacturing - Math.floor(damageDealt * 0.2)),
      public_trust: Math.max(0.1, (targetNation.public_trust || 1.0) - (damageDealt * 0.005)),
      currency: Math.max(0, targetNation.currency - Math.floor(damageDealt * 5)),
      unit_power: Math.max(1, targetNation.unit_power - Math.floor(damageDealt * 0.1)),
    };

    let crashTriggered = false;

    if (isCritical) {
      defenderUpdates.manufacturing = Math.max(10, targetNation.manufacturing - Math.floor(targetNation.manufacturing * 0.15));
      defenderUpdates.is_in_market_crash = true;
      defenderUpdates.crash_turns_remaining = 3;
      crashTriggered = true;

      const defenderStocks = await base44.entities.Stock.filter({ nation_id: targetNation.id });
      const sorted = defenderStocks.sort((a, b) => b.market_cap - a.market_cap).slice(0, 3);
      for (const s of sorted) {
        const newPrice = parseFloat((s.current_price * 0.8).toFixed(2));
        await base44.entities.Stock.update(s.id, {
          current_price: newPrice,
          price_history: [...(s.price_history || []), newPrice].slice(-20),
          market_cap: parseFloat((newPrice * s.total_shares).toFixed(2)),
          is_crashed: true
        });
        const holdings = await base44.entities.StockHolding.filter({ stock_id: s.id });
        for (const h of holdings) {
          if (h.nation_id === myNation.id) continue;
          const loss = Math.floor(h.shares_owned * s.current_price * 0.2);
          const holderNations = await base44.entities.Nation.filter({ id: h.nation_id });
          if (holderNations[0]) {
            await base44.entities.Nation.update(h.nation_id, { currency: Math.max(0, holderNations[0].currency - loss) });
          }
        }
      }

      await base44.entities.Notification.create({
        target_owner_email: targetNation.owner_email,
        target_nation_id: targetNation.id,
        type: "market_crash",
        title: "⚠ Market Crash Triggered!",
        message: `${myNation.name}'s critical strike triggered a market crash! Manufacturing -15%, top stocks -20%.`,
        severity: "danger", is_read: false
      });
    } else {
      await base44.entities.Notification.create({
        target_owner_email: targetNation.owner_email,
        target_nation_id: targetNation.id,
        type: "attack_received",
        title: `⚔ War Declared!`,
        message: `${myNation.name} declared war, dealing ${damageDealt} damage.`,
        severity: "danger", is_read: false
      });
    }

    await base44.entities.Nation.update(targetNation.id, defenderUpdates);

    const now = new Date().toISOString();
    await base44.entities.Nation.update(myNation.id, {
      at_war_with: attackerWarList,
      war_started_at: now,
      currency: Math.max(0, myNation.currency - warCost)
    });
    await base44.entities.Nation.update(targetNation.id, { war_started_at: now });

    await base44.entities.Transaction.create({
      type: "war_attack",
      from_nation_id: myNation.id,
      from_nation_name: myNation.name,
      to_nation_id: targetNation.id,
      to_nation_name: targetNation.name,
      description: `${myNation.name} declared war on ${targetNation.name} · Damage: ${damageDealt}${crashTriggered ? " (CRITICAL)" : ""} · War cost: ${warCost} cr`,
      total_value: damageDealt
    });

    // Fire image generation WITHOUT awaiting — non-blocking
    base44.entities.NewsArticle.create({
      headline: crashTriggered
        ? `⚔ INVASION: ${myNation.name} Launches Critical Strike on ${targetNation.name}! Markets Crash!`
        : `⚔ WAR DECLARED: ${myNation.name} Attacks ${targetNation.name}`,
      body: `${myNation.name} declared war on ${targetNation.name}, paying ${warCost} credits. Damage dealt: ${damageDealt}.${crashTriggered ? " A critical strike triggered a market crash!" : ""}`,
      category: "war",
      tier: crashTriggered ? "gold" : "breaking",
      nation_name: myNation.name,
      nation_flag: myNation.flag_emoji,
      nation_color: myNation.flag_color,
    }).catch(() => {});

    const newStability = defenderUpdates.stability;
    const newGdp = defenderUpdates.gdp;
    const newManufacturing = defenderUpdates.manufacturing;
    const newTreasury = defenderUpdates.currency;
    let annexed = false;
    if (newStability <= 0 && newGdp <= 100 && newManufacturing <= 10 && newTreasury <= 0) {
      await handleAnnexation(damageDealt);
      annexed = true;
    }

    clearInterval(phaseTimer);
    setLoading(false);
    setShowExplosion(true);
    setTimeout(() => setShowExplosion(false), 1200);
    setResult({ damage: damageDealt, critical: crashTriggered, annexed });
    onRefresh?.();
  }

  async function handleAnnexation(damageDealt) {
    const allResources = {
      res_wood: targetNation.res_wood || 0, res_stone: targetNation.res_stone || 0,
      res_gold: targetNation.res_gold || 0, res_iron: targetNation.res_iron || 0,
      res_oil: targetNation.res_oil || 0, res_food: targetNation.res_food || 0,
    };
    const totalResources = Object.values(allResources).reduce((a, b) => a + b, 0);
    const seizedTreasury = targetNation.currency || 0;
    const seizedPop = targetNation.population || 0;
    const seizedHousing = targetNation.housing_capacity || 0;

    await base44.entities.Nation.update(myNation.id, {
      currency: (myNation.currency || 0) + seizedTreasury,
      gdp: (myNation.gdp || 0) + Math.floor((targetNation.gdp || 0) * 0.6),
      manufacturing: (myNation.manufacturing || 0) + Math.floor((targetNation.manufacturing || 0) * 0.5),
      national_wealth: (myNation.national_wealth || 0) + Math.floor((targetNation.national_wealth || 0) * 0.4),
      population: (myNation.population || 0) + Math.floor(seizedPop * 0.7),
      housing_capacity: (myNation.housing_capacity || 0) + Math.floor(seizedHousing * 0.5),
      ...Object.fromEntries(Object.entries(allResources).map(([k, v]) => [k, (myNation[k] || 0) + v])),
      workers_farmers: (myNation.workers_farmers || 0) + Math.floor((targetNation.workers_farmers || 0) * 0.5),
      workers_lumberjacks: (myNation.workers_lumberjacks || 0) + Math.floor((targetNation.workers_lumberjacks || 0) * 0.5),
      workers_quarry: (myNation.workers_quarry || 0) + Math.floor((targetNation.workers_quarry || 0) * 0.5),
      workers_miners: (myNation.workers_miners || 0) + Math.floor((targetNation.workers_miners || 0) * 0.5),
    });

    await base44.entities.Nation.update(targetNation.id, {
      stability: 0, gdp: 0, currency: 0, manufacturing: 0, national_wealth: 0, population: 1,
      res_wood: 0, res_stone: 0, res_gold: 0, res_iron: 0, res_oil: 0, res_food: 0,
      workers_farmers: 0, workers_lumberjacks: 0, workers_quarry: 0, workers_miners: 0,
      workers_hunters: 0, workers_fishermen: 0, workers_builders: 0,
      workers_iron_miners: 0, workers_oil_engineers: 0, workers_researchers: 0,
      workers_soldiers: 0, workers_industrial: 0,
      at_war_with: [], war_started_at: "", allies: [],
      is_in_market_crash: true, crash_turns_remaining: 10
    });

    const defStocks = await base44.entities.Stock.filter({ nation_id: targetNation.id });
    for (const s of defStocks) {
      const newPrice = parseFloat((s.current_price * 0.05).toFixed(2));
      await base44.entities.Stock.update(s.id, {
        current_price: newPrice,
        price_history: [...(s.price_history || []), newPrice].slice(-20),
        market_cap: parseFloat((newPrice * s.total_shares).toFixed(2)),
        is_crashed: true
      });
    }

    await Promise.all([
      base44.entities.Notification.create({
        target_owner_email: targetNation.owner_email, target_nation_id: targetNation.id,
        type: "attack_received", title: "💀 YOUR NATION HAS BEEN CONQUERED!",
        message: `${myNation.name} seized all your treasury, resources, population, and workers. You must rebuild from nothing.`,
        severity: "danger", is_read: false
      }),
      base44.entities.Notification.create({
        target_owner_email: myNation.owner_email, target_nation_id: myNation.id,
        type: "tech_unlocked", title: `⚔️ CONQUEST COMPLETE: ${targetNation.name} Defeated!`,
        message: `You seized ${seizedTreasury} cr, ${totalResources} resources, ${Math.floor(seizedPop * 0.7)} population from ${targetNation.name}.`,
        severity: "success", is_read: false
      }),
      base44.entities.NewsArticle.create({
        headline: `💀 CONQUERED: ${targetNation.name} Falls to ${myNation.name}!`,
        body: `${myNation.name} conquered ${targetNation.name}, seizing all assets. "${targetNation.name}" is left in ruins.`,
        category: "war", tier: "gold",
        nation_name: myNation.name, nation_flag: myNation.flag_emoji, nation_color: myNation.flag_color,
      })
    ]);

    // ── Map: transfer all hex tiles from defeated to victor ─────────────────
    try {
      const defeatedHexes = await base44.entities.HexTile.filter({ owner_nation_id: targetNation.id });
      for (const hex of defeatedHexes) {
        await base44.entities.HexTile.update(hex.id, {
          owner_nation_id: myNation.id,
          owner_nation_name: myNation.name,
          owner_color: myNation.flag_color,
          owner_flag: myNation.flag_emoji,
        });
      }
    } catch (_) {}

    // ── Buildings: transfer ownership to victor ──────────────────────────────
    try {
      const defeatedBuildings = await base44.entities.Building.filter({ nation_id: targetNation.id });
      for (const b of defeatedBuildings) {
        await base44.entities.Building.update(b.id, {
          nation_id: myNation.id,
          nation_name: myNation.name,
          owner_email: myNation.owner_email,
        });
      }
    } catch (_) {}

    // ── Cities: transfer ownership to victor ─────────────────────────────────
    try {
      const defeatedCities = await base44.entities.City.filter({ nation_id: targetNation.id });
      for (const c of defeatedCities) {
        await base44.entities.City.update(c.id, {
          nation_id: myNation.id,
          owner_email: myNation.owner_email,
          happiness: Math.max(10, (c.happiness || 50) - 30), // occupied cities are unhappy
        });
      }
    } catch (_) {}

    // ── Trade routes: break all routes involving the defeated nation ─────────
    try {
      const routesFrom = await base44.entities.TradeRoute.filter({ from_nation_id: targetNation.id });
      const routesTo   = await base44.entities.TradeRoute.filter({ to_nation_id: targetNation.id });
      for (const r of [...routesFrom, ...routesTo]) {
        await base44.entities.TradeRoute.update(r.id, { status: "broken" });
      }
    } catch (_) {}

    // ── Diplomacy: break/expire all agreements involving the defeated nation ─
    try {
      const diploA = await base44.entities.DiplomacyAgreement.filter({ nation_a_id: targetNation.id });
      const diploB = await base44.entities.DiplomacyAgreement.filter({ nation_b_id: targetNation.id });
      for (const d of [...diploA, ...diploB]) {
        await base44.entities.DiplomacyAgreement.update(d.id, { status: "broken" });
      }
    } catch (_) {}

    // ── TradeAgreements: cancel all ──────────────────────────────────────────
    try {
      const taA = await base44.entities.TradeAgreement.filter({ nation_a_id: targetNation.id });
      const taB = await base44.entities.TradeAgreement.filter({ nation_b_id: targetNation.id });
      for (const t of [...taA, ...taB]) {
        await base44.entities.TradeAgreement.update(t.id, { status: "cancelled" });
      }
    } catch (_) {}

    // ── Policy: zero out the defeated nation's policy ────────────────────────
    try {
      const policies = await base44.entities.Policy.filter({ nation_id: targetNation.id });
      for (const p of policies) {
        await base44.entities.Policy.update(p.id, {
          healthcare: false, martial_law: false, tech_subsidies: false,
          tax_cuts: false, conscription: false, influence_points: 0,
        });
      }
    } catch (_) {}

    // ── WorldChronicle: record the conquest ─────────────────────────────────
    base44.entities.WorldChronicle.create({
      event_type: "war",
      title: `${myNation.name} Conquers ${targetNation.name}`,
      summary: `After a decisive military campaign, ${myNation.name} (led by ${myNation.leader || "unknown"}) has completely conquered ${targetNation.name}. All territory, resources, population and infrastructure have been absorbed. ${targetNation.name} ceases to exist as a sovereign nation.`,
      actors: [myNation.name, targetNation.name],
      importance: "critical",
      era_tag: myNation.epoch || "Unknown Age",
    }).catch(() => {});

    const isAILoser = !targetNation.owner_email || !(await isHumanPlayer(targetNation.owner_email));
    if (isAILoser) {
      await spawnReplacementAINation(targetNation);
      // Delete all stocks belonging to the defeated AI nation
      try {
        const defeatedStocks = await base44.entities.Stock.filter({ nation_id: targetNation.id });
        for (const s of defeatedStocks) {
          await base44.entities.Stock.delete(s.id);
        }
      } catch (_) {}
      // Delete the defeated AI nation so it no longer appears on the map
      await base44.entities.Nation.delete(targetNation.id);
    }
  }

  async function isHumanPlayer(email) {
    if (!email) return false;
    try {
      const users = await base44.entities.User.list();
      return users.some(u => u.email === email);
    } catch { return false; }
  }

  async function spawnReplacementAINation(defeatedNation) {
    const AI_NAMES = ["New Veldoria","Rising Caldeth","Restored Aethon","Reborn Morkai","Nova Herath","Phoenix Solund","Renewed Kalvos","Ascendant Thyra"];
    const FLAG_EMOJIS = ["🏴","⚔️","🦅","🐉","🌟","🔱","🛡️","🌙","☀️","🦁"];
    const FLAG_COLORS = ["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#06b6d4","#f97316","#ec4899"];
    const GOV_TYPES = ["Democracy","Federal Republic","Technocracy","Military Junta","Oligarchy"];
    const LEADER_FIRSTS = ["Arman","Erika","Viktor","Soren","Yuna","Marcus","Dayo","Leila","Otto","Zara"];
    const LEADER_LASTS = ["Petrov","Vogel","Laurent","Stahl","Osei","Tanaka","Reyes","Novak","Kimura","Torres"];
    const seed = Date.now();
    const pick = arr => arr[seed % arr.length];
    const existingNations = await base44.entities.Nation.list();
    const existingNames = new Set(existingNations.map(n => n.name));
    let newName = pick(AI_NAMES);
    if (existingNames.has(newName)) newName = `${pick(AI_NAMES)} ${Math.floor(Math.random() * 900) + 100}`;
    const flagEmoji = FLAG_EMOJIS[seed % FLAG_EMOJIS.length];
    const flagColor = FLAG_COLORS[(seed >> 2) % FLAG_COLORS.length];
    const leaderName = `${LEADER_FIRSTS[(seed >> 3) % LEADER_FIRSTS.length]} ${LEADER_LASTS[(seed >> 5) % LEADER_LASTS.length]}`;
    const newNation = await base44.entities.Nation.create({
      name: newName, leader: leaderName, owner_email: defeatedNation.owner_email || "",
      government_type: pick(GOV_TYPES), epoch: "Stone Age", tech_points: 0, tech_level: 1,
      gdp: 200, stability: 65, public_trust: 0.9, currency: 500, manufacturing: 20,
      education_spending: 20, military_spending: 20, unit_power: 10, defense_level: 10,
      population: 10, housing_capacity: 20, tax_rates: { income: 15, sales: 8, corporate: 12, tariff: 5 },
      flag_color: flagColor, flag_emoji: flagEmoji, allies: [], at_war_with: [],
      is_in_market_crash: false, crash_turns_remaining: 0, unlocked_techs: [],
      res_wood: 100, res_stone: 100, res_gold: 50, res_oil: 0, res_food: 200, res_iron: 0,
      workers_farmers: 3, workers_hunters: 2, workers_fishermen: 0, workers_lumberjacks: 2,
      workers_quarry: 1, workers_miners: 1, workers_oil_engineers: 0, workers_builders: 1,
      workers_soldiers: 0, workers_researchers: 0, workers_industrial: 0,
    });
    await base44.entities.Stock.create({
      company_name: `${newName} Trading Co.`, ticker: newName.replace(/\s+/g,"").substring(0,3).toUpperCase()+"T",
      nation_id: newNation.id, nation_name: newName, sector: "Agriculture",
      total_shares: 500, available_shares: 500, base_price: 5, current_price: 5,
      price_history: [5], market_cap: 2500, is_crashed: false, epoch_required: "Stone Age"
    });
    base44.entities.NewsArticle.create({
      headline: `🌱 NEW NATION RISES: ${newName} Emerges from the Ashes of ${defeatedNation.name}`,
      body: `A new civilization emerges — ${newName}, led by ${leaderName}. This fledgling nation enters at Stone Age, ready to forge a new path.`,
      category: "milestone", tier: "standard", nation_name: newName, nation_flag: flagEmoji, nation_color: flagColor,
    }).catch(() => {});
  }

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  if (loading) {
    return <BattleLoadingScreen myNation={myNation} targetNation={targetNation} phase={loadPhase} />;
  }

  // ── RESULT STATE ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)" }}>

        {/* Ambient red glow for critical/annex */}
        {(result.critical || result.annexed) && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.1] }}
            transition={{ duration: 1.5 }}
            style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.25) 0%, transparent 70%)" }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative w-full max-w-xl rounded-2xl overflow-hidden"
          style={{
            background: result.annexed
              ? "linear-gradient(135deg, #1a0a00 0%, #0f0800 100%)"
              : result.critical
              ? "linear-gradient(135deg, #1a0000 0%, #0f0a0a 100%)"
              : "linear-gradient(135deg, #0f172a 0%, #040810 100%)",
            border: `1px solid ${result.annexed ? "rgba(251,191,36,0.3)" : result.critical ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.15)"}`,
            boxShadow: result.annexed
              ? "0 0 60px rgba(251,191,36,0.15)"
              : result.critical
              ? "0 0 60px rgba(239,68,68,0.15)"
              : "none"
          }}
        >
          <ExplosionBurst active={showExplosion} isCritical={result.critical || result.annexed} />

          <div className="p-8 text-center space-y-5">
            {/* Main icon with bounce */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              className="text-6xl"
            >
              {result.annexed ? "💀" : result.critical ? "💥" : "⚔️"}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-2xl font-black text-white">
                {result.annexed ? "CONQUEST COMPLETE!" : result.critical ? "CRITICAL STRIKE!" : "ATTACK LAUNCHED!"}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {myNation.name} → {targetNation.name}
              </div>
            </motion.div>

            {/* Damage dealt */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl p-3 inline-block"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <div className="text-xs text-slate-500 mb-0.5">DAMAGE DEALT</div>
              <div className="text-3xl font-black font-mono text-red-400">{result.damage}</div>
            </motion.div>

            {/* Damage breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl p-3 space-y-1.5 text-left"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { label: "Stability", value: `-${Math.floor(result.damage * 0.4)}`, icon: "⚖️" },
                { label: "GDP", value: `-${Math.floor(result.damage * 3)} cr`, icon: "💹" },
                { label: "Manufacturing", value: `-${Math.floor(result.damage * 0.2)}%`, icon: "🏭" },
                { label: "Treasury", value: `-${Math.floor(result.damage * 5)} cr`, icon: "💰" },
              ].map((d, i) => (
                <motion.div key={d.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-slate-500">{d.icon} {d.label}</span>
                  <span className="text-red-400 font-mono font-bold">{d.value}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Conquest spoils */}
            {result.annexed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="rounded-xl p-4 space-y-2 text-left"
                style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)" }}
              >
                <div className="font-bold text-yellow-400 text-sm text-center mb-2">⚔️ SPOILS OF WAR</div>
                {[
                  "✅ Full treasury seized",
                  "✅ All resources transferred",
                  "✅ 70% of population absorbed",
                  "✅ 50% of workforce absorbed",
                  "✅ GDP & manufacturing boosted",
                  "🔴 Enemy stocks collapsed to near-zero",
                  "🔴 Enemy nation left in total ruin",
                ].map((line, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.06 }}
                    className="text-xs text-yellow-200/70">{line}</motion.div>
                ))}
              </motion.div>
            )}

            {result.critical && !result.annexed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl p-3"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <div className="font-bold text-red-400 text-sm">💥 CRITICAL HIT EFFECTS</div>
                <div className="text-xs text-red-300/70 mt-1">Manufacturing −15% · Market Crash triggered · Top 3 stocks −20% · Investor losses applied</div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="rounded-lg p-2 text-xs text-slate-500"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              War cost deducted: <span className="text-red-400 font-mono font-bold">{warCost} cr</span>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-bold text-white transition-all min-h-[44px]"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── DECLARATION FORM ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(16px)" }}>

      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #040810 100%)", border: "1px solid rgba(239,68,68,0.2)", boxShadow: "0 0 60px rgba(239,68,68,0.08)" }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(239,68,68,0.15)", background: "linear-gradient(90deg, rgba(239,68,68,0.07) 0%, transparent 100%)" }}>
          <div className="flex items-center gap-2">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <Swords size={18} className="text-red-400" />
            </motion.div>
            <span className="font-bold text-white">War Declaration</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Nations vs banner */}
          <div className="relative flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <div className="text-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                className="text-4xl">{myNation.flag_emoji}</motion.div>
              <div className="text-xs text-white font-bold mt-1">{myNation.name}</div>
              <div className="text-[10px] text-green-400 ep-mono">T{myNation.tech_level} · {myNation.unit_power} PWR</div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-2xl"
              >⚔️</motion.div>
              <div className="text-[9px] text-red-400 font-bold ep-mono tracking-widest">VS</div>
            </div>

            <div className="text-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                className="text-4xl">{targetNation.flag_emoji}</motion.div>
              <div className="text-xs text-white font-bold mt-1">{targetNation.name}</div>
              <div className="text-[10px] text-red-400 ep-mono">DEF {targetNation.defense_level}</div>
            </div>
          </div>

          {/* War fund slider */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: canAffordWar ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${canAffordWar ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)"}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <DollarSign size={12} className="text-red-400" /> War Fund Allocation
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Your treasury:</span>
                <span className="font-mono text-xs text-slate-300">{Math.floor(treasury).toLocaleString()} cr</span>
              </div>
            </div>
            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range" min={5} max={30} step={1}
                value={warFundPct}
                onChange={e => setWarFundPct(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "#ef4444" }}
              />
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>5% (min)</span><span>15%</span><span>30% (max)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Committing <span className="font-bold text-white">{warFundPct}%</span> of treasury</span>
              <motion.span
                key={warCost}
                initial={{ scale: 1.3, color: "#ff4444" }}
                animate={{ scale: 1, color: canAffordWar ? "#f87171" : "#6b7280" }}
                className="font-mono font-black text-lg"
              >
                {warCost.toLocaleString()} cr
              </motion.span>
            </div>
            {!canAffordWar && <div className="text-xs text-red-400 font-bold">⚠ Insufficient funds to declare war</div>}
          </div>

          {/* Combat sim */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Combat Simulation</div>
            <div className="font-mono text-xs text-slate-400">
              ({myNation.tech_level} Tech ÷ {targetNation.defense_level} Defense) × {myNation.unit_power} Power
            </div>
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-3xl font-black font-mono"
              style={{ color: isCritical ? "#ff4444" : "#f97316" }}
            >
              {damage.toFixed(1)} <span className="text-sm font-normal text-slate-400">damage</span>
              {isCritical && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">CRITICAL</span>}
            </motion.div>
          </div>

          {/* Damage preview */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Expected Impact on {targetNation.name}</div>
            {[
              { label: "Stability", val: `-${Math.floor(damage * 0.4)}`, icon: <Shield size={10} /> },
              { label: "GDP", val: `-${Math.floor(damage * 3)} cr`, icon: <TrendingDown size={10} /> },
              { label: "Manufacturing", val: `-${Math.floor(damage * 0.2)}%`, icon: <Zap size={10} /> },
              { label: "Treasury", val: `-${Math.floor(damage * 5)} cr`, icon: <DollarSign size={10} /> },
            ].map(({ label, val, icon }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className="text-slate-500 flex items-center gap-1">{icon}{label}</span>
                <span className="text-red-400 font-mono font-bold">{val}</span>
              </div>
            ))}
          </div>

          {/* Conquest progress — remaining to defeat */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.15)" }}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-orange-300 uppercase tracking-wider">Conquest Progress</div>
              <div className="text-xs ep-mono px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: conquestHits <= 1 ? "rgba(239,68,68,0.2)" : conquestHits <= 3 ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.06)",
                  color: conquestHits <= 1 ? "#f87171" : conquestHits <= 3 ? "#fb923c" : "#94a3b8",
                  border: `1px solid ${conquestHits <= 1 ? "rgba(239,68,68,0.3)" : conquestHits <= 3 ? "rgba(251,146,60,0.3)" : "rgba(255,255,255,0.1)"}`
                }}
              >
                {conquestHits === Infinity ? "∞ strikes" : conquestHits <= 1 ? "⚠ 1 strike left!" : `~${conquestHits} strikes to conquer`}
              </div>
            </div>
            {[
              { label: "Stability", cur: defStab, floor: 0, max: 100, pct: stabPct, hits: hitsNeeded, color: "#60a5fa" },
              { label: "GDP",       cur: defGdp,  floor: 100, max: Math.max(defGdp, 500), pct: gdpPct, hits: hitsGdp, color: "#34d399" },
              { label: "Mfg",      cur: defMfg,  floor: 10,  max: 100, pct: mfgPct, hits: hitsMfg, color: "#a78bfa" },
              { label: "Treasury", cur: defTreasury, floor: 0, max: Math.max(defTreasury, 1000), pct: trsPct, hits: hitsTrs, color: "#fbbf24" },
            ].map(({ label, cur, floor, pct, hits, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-mono" style={{ color }}>
                    {cur.toLocaleString()} → {floor} 
                    <span className="text-slate-600 ml-1">({hits === Infinity ? "∞" : hits <= 1 ? "💀 1" : hits} hits)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color, width: `${pct}%` }}
                    animate={{ width: [`${pct}%`, `${Math.max(0, pct - (100 / Math.max(conquestHits, 1)))}%`, `${pct}%`] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {isCritical && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
                <AlertTriangle size={14} />
                <motion.span animate={{ opacity: [1, 0.6, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  CRITICAL STRIKE — Market Crash Triggered
                </motion.span>
              </div>
              <div className="text-xs text-red-300/60 mt-1">Investors holding {targetNation.name}'s stocks will lose real currency.</div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 min-h-[44px] rounded-xl font-bold text-sm border text-slate-400 hover:bg-white/5 transition-all"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              Stand Down
            </button>
            <motion.button
              onClick={launchAttack}
              disabled={!canAffordWar}
              whileHover={canAffordWar ? { scale: 1.02, filter: "brightness(1.15)" } : {}}
              whileTap={canAffordWar ? { scale: 0.97 } : {}}
              className="flex-1 py-3 min-h-[44px] rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
              style={{ background: isCritical ? "linear-gradient(135deg, #dc2626, #991b1b)" : "linear-gradient(135deg, #dc2626, #b91c1c)" }}
            >
              {isCritical ? `⚡ CRITICAL STRIKE (-${warCost} cr)` : `⚔️ DECLARE WAR (-${warCost} cr)`}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}