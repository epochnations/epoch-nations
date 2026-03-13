import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Swords, AlertTriangle, Clock, DollarSign } from "lucide-react";

export default function WarModal({ targetNation, myNation, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!targetNation || !myNation) return null;

  // War declaration cost: 8% of treasury
  const warCost = Math.floor((myNation.currency || 0) * 0.08);
  const canAffordWar = myNation.currency >= warCost && warCost > 0;

  // Combat formula
  const damage = (myNation.tech_level / Math.max(targetNation.defense_level, 1)) * myNation.unit_power;
  const isCritical = damage > 40;

  async function launchAttack() {
    if (!canAffordWar) return;
    setLoading(true);

    const damageDealt = parseFloat(damage.toFixed(1));

    // Deduct war cost from attacker
    const attackerWarList = [...(myNation.at_war_with || [])];
    if (!attackerWarList.includes(targetNation.id)) attackerWarList.push(targetNation.id);

    const defenderWarList = [...(targetNation.at_war_with || [])];
    if (!defenderWarList.includes(myNation.id)) defenderWarList.push(myNation.id);

    // Real damage to defender stats
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

      // Devalue top 3 stocks by 20% and lose holdings value
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

        // Investors holding these stocks lose money proportionally
        const holdings = await base44.entities.StockHolding.filter({ stock_id: s.id });
        for (const h of holdings) {
          if (h.nation_id === myNation.id) continue; // attacker benefits
          const loss = Math.floor(h.shares_owned * s.current_price * 0.2);
          const holderNations = await base44.entities.Nation.filter({ id: h.nation_id });
          if (holderNations[0]) {
            await base44.entities.Nation.update(h.nation_id, {
              currency: Math.max(0, holderNations[0].currency - loss)
            });
          }
        }
      }

      await base44.entities.Notification.create({
        target_owner_email: targetNation.owner_email,
        target_nation_id: targetNation.id,
        type: "market_crash",
        title: "⚠ Market Crash Triggered!",
        message: `${myNation.name}'s critical strike triggered a market crash! Manufacturing -15%, top stocks -20%. GDP, Stability, and Treasury all damaged.`,
        severity: "danger",
        is_read: false
      });
    } else {
      await base44.entities.Notification.create({
        target_owner_email: targetNation.owner_email,
        target_nation_id: targetNation.id,
        type: "attack_received",
        title: `⚔ War Declared!`,
        message: `${myNation.name} declared war, dealing ${damageDealt} damage. GDP, Stability, Manufacturing, and Treasury all took hits.`,
        severity: "danger",
        is_read: false
      });
    }

    // Apply defender damage
    await base44.entities.Nation.update(targetNation.id, defenderUpdates);

    // Attacker pays war cost + joins war; stamp war start time
    const now = new Date().toISOString();
    await base44.entities.Nation.update(myNation.id, {
      at_war_with: attackerWarList,
      war_started_at: now,
      currency: Math.max(0, myNation.currency - warCost)
    });
    await base44.entities.Nation.update(targetNation.id, {
      war_started_at: now
    });

    await base44.entities.Transaction.create({
      type: "war_attack",
      from_nation_id: myNation.id,
      from_nation_name: myNation.name,
      to_nation_id: targetNation.id,
      to_nation_name: targetNation.name,
      description: `${myNation.name} declared war on ${targetNation.name} · Damage: ${damageDealt}${crashTriggered ? " (CRITICAL)" : ""} · War cost: ${warCost} cr`,
      total_value: damageDealt
    });

    // Global news alert — generate image
    let warImageUrl = "";
    try {
      const imgRes = await base44.integrations.Core.GenerateImage({
        prompt: `Epic war scene between two nations, ${crashTriggered ? "massive destruction, market collapse, explosions" : "armies clashing, flags waving"}. Cinematic, dramatic, no text.`
      });
      warImageUrl = imgRes.url || "";
    } catch (_) {}
    await base44.entities.NewsArticle.create({
      headline: crashTriggered
        ? `⚔ INVASION: ${myNation.name} Launches Critical Strike on ${targetNation.name}! Markets Crash!`
        : `⚔ WAR DECLARED: ${myNation.name} Attacks ${targetNation.name}`,
      body: `${myNation.name} has officially declared war on ${targetNation.name}, paying ${warCost} credits for the war declaration. Damage dealt: ${damageDealt}. ${targetNation.name}'s stability, GDP, manufacturing, and treasury have all been impacted.${crashTriggered ? " A critical strike triggered a market crash!" : ""}`,
      category: "war",
      tier: crashTriggered ? "gold" : "breaking",
      nation_name: myNation.name,
      nation_flag: myNation.flag_emoji,
      nation_color: myNation.flag_color,
      image_url: warImageUrl
    });

    // Check defeat conditions: all four pillars collapsed
    const newStability = defenderUpdates.stability;
    const newGdp = defenderUpdates.gdp;
    const newManufacturing = defenderUpdates.manufacturing;
    const newTreasury = defenderUpdates.currency;
    if (newStability <= 0 && newGdp <= 100 && newManufacturing <= 10 && newTreasury <= 0) {
      await handleAnnexation(damageDealt);
      setResult({ damage: damageDealt, critical: crashTriggered, annexed: true });
    } else {
      setResult({ damage: damageDealt, critical: crashTriggered, annexed: false });
    }

    setLoading(false);
    onRefresh?.();
  }

  async function handleAnnexation(damageDealt) {
    // ── Tally all spoils from the defeated nation ──────────────────────────────
    const allResources = {
      res_wood:  targetNation.res_wood  || 0,
      res_stone: targetNation.res_stone || 0,
      res_gold:  targetNation.res_gold  || 0,
      res_iron:  targetNation.res_iron  || 0,
      res_oil:   targetNation.res_oil   || 0,
      res_food:  targetNation.res_food  || 0,
    };

    const totalResources = Object.values(allResources).reduce((a, b) => a + b, 0);
    const seizedTreasury  = targetNation.currency  || 0;
    const seizedPop       = targetNation.population || 0;
    const seizedHousing   = targetNation.housing_capacity || 0;

    // ── Winner absorbs EVERYTHING from the defeated nation ───────────────────
    await base44.entities.Nation.update(myNation.id, {
      // Treasury — full seizure
      currency: (myNation.currency || 0) + seizedTreasury,
      // Economy
      gdp: (myNation.gdp || 0) + Math.floor((targetNation.gdp || 0) * 0.6),
      manufacturing: (myNation.manufacturing || 0) + Math.floor((targetNation.manufacturing || 0) * 0.5),
      national_wealth: (myNation.national_wealth || 0) + Math.floor((targetNation.national_wealth || 0) * 0.4),
      // Population & housing
      population: (myNation.population || 0) + Math.floor(seizedPop * 0.7),
      housing_capacity: (myNation.housing_capacity || 0) + Math.floor(seizedHousing * 0.5),
      // All physical resources
      res_wood:  (myNation.res_wood  || 0) + allResources.res_wood,
      res_stone: (myNation.res_stone || 0) + allResources.res_stone,
      res_gold:  (myNation.res_gold  || 0) + allResources.res_gold,
      res_iron:  (myNation.res_iron  || 0) + allResources.res_iron,
      res_oil:   (myNation.res_oil   || 0) + allResources.res_oil,
      res_food:  (myNation.res_food  || 0) + allResources.res_food,
      // Workers absorbed (partial)
      workers_farmers:    (myNation.workers_farmers    || 0) + Math.floor((targetNation.workers_farmers    || 0) * 0.5),
      workers_lumberjacks:(myNation.workers_lumberjacks|| 0) + Math.floor((targetNation.workers_lumberjacks|| 0) * 0.5),
      workers_quarry:     (myNation.workers_quarry     || 0) + Math.floor((targetNation.workers_quarry     || 0) * 0.5),
      workers_miners:     (myNation.workers_miners     || 0) + Math.floor((targetNation.workers_miners     || 0) * 0.5),
    });

    // ── Defeated nation is fully collapsed — left as a ruin ───────────────────
    await base44.entities.Nation.update(targetNation.id, {
      stability: 0,
      gdp: 0,
      currency: 0,
      manufacturing: 0,
      national_wealth: 0,
      population: 1,
      res_wood: 0, res_stone: 0, res_gold: 0, res_iron: 0, res_oil: 0, res_food: 0,
      workers_farmers: 0, workers_lumberjacks: 0, workers_quarry: 0, workers_miners: 0,
      workers_hunters: 0, workers_fishermen: 0, workers_builders: 0,
      workers_iron_miners: 0, workers_oil_engineers: 0, workers_researchers: 0,
      workers_soldiers: 0, workers_industrial: 0,
      at_war_with: [],
      war_started_at: "",
      allies: [],
      is_in_market_crash: true,
      crash_turns_remaining: 10
    });

    // ── All defender stocks crash to near-zero ─────────────────────────────────
    const defStocks = await base44.entities.Stock.filter({ nation_id: targetNation.id });
    for (const s of defStocks) {
      const newPrice = parseFloat((s.current_price * 0.05).toFixed(2)); // near-total collapse
      await base44.entities.Stock.update(s.id, {
        current_price: newPrice,
        price_history: [...(s.price_history || []), newPrice].slice(-20),
        market_cap: parseFloat((newPrice * s.total_shares).toFixed(2)),
        is_crashed: true
      });
    }

    await base44.entities.Notification.create({
      target_owner_email: targetNation.owner_email,
      target_nation_id: targetNation.id,
      type: "attack_received",
      title: "💀 YOUR NATION HAS BEEN CONQUERED!",
      message: `${myNation.name} has completely conquered your nation. All your treasury (${seizedTreasury} cr), resources (${totalResources} total), population, and workers have been seized. Your stocks collapsed to near-zero. You must rebuild from nothing.`,
      severity: "danger",
      is_read: false
    });

    // Notify the winner
    await base44.entities.Notification.create({
      target_owner_email: myNation.owner_email,
      target_nation_id: myNation.id,
      type: "tech_unlocked",
      title: `⚔️ CONQUEST COMPLETE: ${targetNation.name} Defeated!`,
      message: `You seized ${seizedTreasury} cr treasury, ${totalResources} total resources, ${Math.floor(seizedPop * 0.7)} population, and workers from ${targetNation.name}. Their nation is in ruins.`,
      severity: "success",
      is_read: false
    });

    let annexImageUrl = "";
    try {
      const imgRes = await base44.integrations.Core.GenerateImage({
        prompt: `Epic military conquest, victorious army planting flag over defeated capital city, spoils of war, cinematic illustration. No text.`
      });
      annexImageUrl = imgRes.url || "";
    } catch (_) {}

    await base44.entities.NewsArticle.create({
      headline: `💀 CONQUERED: ${targetNation.name} Falls to ${myNation.name}!`,
      body: `In a total military victory, ${myNation.name} has conquered and stripped ${targetNation.name} of all remaining assets. The victorious nation seized the entire treasury (${seizedTreasury} cr), all physical resources (${totalResources} units), ${Math.floor(seizedPop * 0.7)} citizens, and a portion of the workforce. All stocks of the fallen nation collapsed to near-zero. "${targetNation.name}" is left as a ruin — its leader must rebuild from scratch.`,
      category: "war",
      tier: "gold",
      nation_name: myNation.name,
      nation_flag: myNation.flag_emoji,
      nation_color: myNation.flag_color,
      image_url: annexImageUrl
    });
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl p-8 text-center space-y-4">
          <div className="text-5xl">{result.annexed ? "💀" : result.critical ? "💥" : "⚔️"}</div>
          <div className="text-2xl font-black text-white">
            {result.annexed ? "Nation Annexed!" : "Attack Launched!"}
          </div>
          <div className="text-slate-300">Damage dealt: <span className="font-mono font-bold text-red-400">{result.damage}</span></div>
          {result.annexed && (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 space-y-2">
              <div className="font-bold text-yellow-400 text-base">⚔️ CONQUEST COMPLETE!</div>
              <div className="text-xs text-yellow-300/70 leading-relaxed space-y-1">
                <div>✅ Full treasury seized</div>
                <div>✅ All resources transferred to you</div>
                <div>✅ 70% of their population absorbed</div>
                <div>✅ 50% of workers absorbed into your workforce</div>
                <div>✅ GDP, manufacturing & national wealth boosted</div>
                <div>🔴 Their stocks collapsed to near-zero</div>
                <div>🔴 Their nation is in total ruin — allies disbanded</div>
              </div>
            </div>
          )}
          {result.critical && !result.annexed && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="font-bold text-red-400">CRITICAL HIT!</div>
              <div className="text-sm text-red-300/70 mt-1">Manufacturing -15% · Market Crash triggered · Top 3 stocks -20% · Investor losses applied</div>
            </div>
          )}
          <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-400">
            War cost deducted: <span className="text-red-400 font-mono">{warCost} cr</span>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-red-400" />
            <span className="font-bold text-white">War Declaration</span>
          </div>
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-3xl">{myNation.flag_emoji}</div>
              <div className="text-xs text-white font-bold mt-1">{myNation.name}</div>
              <div className="text-xs text-slate-500">T{myNation.tech_level} · {myNation.unit_power} PWR</div>
            </div>
            <div className="text-2xl text-red-400">⚔️</div>
            <div className="text-center">
              <div className="text-3xl">{targetNation.flag_emoji}</div>
              <div className="text-xs text-white font-bold mt-1">{targetNation.name}</div>
              <div className="text-xs text-slate-500">DEF {targetNation.defense_level}</div>
            </div>
          </div>

          {/* War cost */}
          <div className={`rounded-xl p-4 border ${canAffordWar ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/10 opacity-60"}`}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
              <DollarSign size={12} className="text-red-400" /> War Declaration Cost
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Treasury Fee (8%)</span>
              <span className={`font-mono font-bold ${canAffordWar ? "text-red-400" : "text-slate-600"}`}>{warCost} cr</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-slate-500">Your Treasury</span>
              <span className="text-slate-400 font-mono">{Math.floor(myNation.currency)} cr</span>
            </div>
            {!canAffordWar && (
              <div className="mt-2 text-xs text-red-400 font-bold">⚠ Insufficient funds to declare war</div>
            )}
          </div>

          <div className="rounded-xl bg-white/5 p-4 space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Combat Simulation</div>
            <div className="font-mono text-sm text-slate-300">
              ({myNation.tech_level} Tech / {targetNation.defense_level} Defense) × {myNation.unit_power} Power
            </div>
            <div className="text-2xl font-black font-mono text-white">
              = {damage.toFixed(1)} <span className="text-sm font-normal text-slate-400">damage</span>
            </div>
          </div>

          {/* Damage preview */}
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Expected Damage to {targetNation.name}</div>
            {[
              ["Stability", `-${Math.floor(damage * 0.4)}`],
              ["GDP", `-${Math.floor(damage * 3)}`],
              ["Manufacturing", `-${Math.floor(damage * 0.2)}`],
              ["Treasury", `-${Math.floor(damage * 5)} cr`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500">{k}</span>
                <span className="text-red-400 font-mono">{v}</span>
              </div>
            ))}
          </div>

          {isCritical && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
              <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
                <AlertTriangle size={14} /> Critical Strike — Market Crash Triggered
              </div>
              <div className="text-xs text-red-300/70 mt-1">
                Investors holding {targetNation.name}'s stocks will lose real currency.
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 min-h-[44px] rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:bg-white/5 transition-all">
              Stand Down
            </button>
            <button
              onClick={launchAttack}
              disabled={loading || !canAffordWar}
              className="flex-1 py-3 min-h-[44px] rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-500 hover:to-rose-600 transition-all disabled:opacity-40"
            >
              {loading ? "Launching..." : `DECLARE WAR (-${warCost} cr)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}