import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Swords, AlertTriangle, Shield } from "lucide-react";

export default function WarModal({ targetNation, myNation, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!targetNation || !myNation) return null;

  // Combat formula: Damage = (Attacker Tech Level / Defender Defense Level) * Unit Power
  const damage = (myNation.tech_level / Math.max(targetNation.defense_level, 1)) * myNation.unit_power;
  const isCritical = damage > 40;

  async function launchAttack() {
    setLoading(true);

    const damageDealt = parseFloat(damage.toFixed(1));

    // Update attacker — go to war
    const attackerWarList = [...(myNation.at_war_with || [])];
    if (!attackerWarList.includes(targetNation.id)) attackerWarList.push(targetNation.id);

    const defenderWarList = [...(targetNation.at_war_with || [])];
    if (!defenderWarList.includes(myNation.id)) defenderWarList.push(myNation.id);

    let defenderUpdates = {
      at_war_with: defenderWarList,
      stability: Math.max(0, targetNation.stability - Math.floor(damageDealt * 0.3)),
      gdp: Math.max(100, targetNation.gdp - Math.floor(damageDealt * 2)),
    };

    let crashTriggered = false;

    // Critical damage => 15% manufacturing loss + market crash
    if (isCritical) {
      defenderUpdates.manufacturing = Math.max(10, targetNation.manufacturing - Math.floor(targetNation.manufacturing * 0.15));
      defenderUpdates.is_in_market_crash = true;
      defenderUpdates.crash_turns_remaining = 3;
      crashTriggered = true;

      // Devalue top 3 stocks by 20%
      const defenderStocks = await base44.entities.Stock.filter({ nation_id: targetNation.id });
      const sorted = defenderStocks.sort((a, b) => b.market_cap - a.market_cap).slice(0, 3);
      for (const s of sorted) {
        const newPrice = parseFloat((s.current_price * 0.8).toFixed(2));
        const history = [...(s.price_history || []), newPrice];
        await base44.entities.Stock.update(s.id, {
          current_price: newPrice,
          price_history: history.slice(-20),
          market_cap: parseFloat((newPrice * s.total_shares).toFixed(2)),
          is_crashed: true
        });
      }

      // Market crash transaction
      await base44.entities.Transaction.create({
        type: "market_crash",
        from_nation_name: myNation.name,
        to_nation_name: targetNation.name,
        to_nation_id: targetNation.id,
        description: `MARKET CRASH in ${targetNation.name} triggered by ${myNation.name}'s strike`,
        total_value: 0
      });

      // Notify defender
      await base44.entities.Notification.create({
        target_owner_email: targetNation.owner_email,
        target_nation_id: targetNation.id,
        type: "market_crash",
        title: "⚠ Market Crash Triggered!",
        message: `${myNation.name}'s attack caused critical damage! Manufacturing -15%, top stocks devalued 20%.`,
        severity: "danger",
        is_read: false
      });
    } else {
      // Normal attack notification
      await base44.entities.Notification.create({
        target_owner_email: targetNation.owner_email,
        target_nation_id: targetNation.id,
        type: "attack_received",
        title: `⚔ You Were Attacked!`,
        message: `${myNation.name} launched an attack dealing ${damageDealt} damage. GDP -${Math.floor(damageDealt * 2)}, Stability -${Math.floor(damageDealt * 0.3)}.`,
        severity: "danger",
        is_read: false
      });
    }

    await base44.entities.Nation.update(targetNation.id, defenderUpdates);
    await base44.entities.Nation.update(myNation.id, { at_war_with: attackerWarList });

    await base44.entities.Transaction.create({
      type: "war_attack",
      from_nation_id: myNation.id,
      from_nation_name: myNation.name,
      to_nation_id: targetNation.id,
      to_nation_name: targetNation.name,
      description: `${myNation.name} attacked ${targetNation.name} · Damage: ${damageDealt}${crashTriggered ? " (CRITICAL - Market Crash!)" : ""}`,
      total_value: damageDealt
    });

    // Auto-post news
    await base44.entities.NewsArticle.create({
      headline: crashTriggered
        ? `FLASH: ${myNation.name} Invades ${targetNation.name}! Markets Bracing for Impact`
        : `BREAKING: ${myNation.name} Launches Military Strike Against ${targetNation.name}`,
      body: crashTriggered
        ? `A devastating critical strike by ${myNation.name} has triggered a market crash in ${targetNation.name}. Manufacturing output has fallen 15% and top stocks have been devalued. Global investors are watching nervously.`
        : `${myNation.name} has declared war on ${targetNation.name}, dealing ${damageDealt} damage units in the opening offensive.`,
      category: "war",
      tier: crashTriggered ? "gold" : "breaking",
      nation_name: myNation.name,
      nation_flag: myNation.flag_emoji,
      nation_color: myNation.flag_color
    });

    setResult({ damage: damageDealt, critical: crashTriggered });
    setLoading(false);
    onRefresh?.();
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl p-8 text-center space-y-4">
          <div className="text-5xl">{result.critical ? "💥" : "⚔️"}</div>
          <div className="text-2xl font-black text-white">Attack Launched!</div>
          <div className="text-slate-300">Damage dealt: <span className="font-mono font-bold text-red-400">{result.damage}</span></div>
          {result.critical && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="font-bold text-red-400">CRITICAL HIT!</div>
              <div className="text-sm text-red-300/70 mt-1">Manufacturing -15% · Market Crash triggered · Top 3 stocks devalued 20%</div>
            </div>
          )}
          <button onClick={() => { onClose(); }} className="w-full py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all">
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

        <div className="p-6 space-y-5">
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

          <div className="rounded-xl bg-white/5 p-4 space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Combat Simulation</div>
            <div className="font-mono text-sm text-slate-300">
              ({myNation.tech_level} Tech / {targetNation.defense_level} Defense) × {myNation.unit_power} Power
            </div>
            <div className="text-2xl font-black font-mono text-white">
              = {damage.toFixed(1)} <span className="text-sm font-normal text-slate-400">damage</span>
            </div>
          </div>

          {isCritical && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <AlertTriangle size={14} />
                Critical Strike Predicted
              </div>
              <div className="text-xs text-red-300/70 mt-1">
                This attack will trigger a Market Crash in {targetNation.name}, devaluing their top 3 stocks by 20%.
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:bg-white/5 transition-all">
              Stand Down
            </button>
            <button
              onClick={launchAttack}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-500 hover:to-rose-600 transition-all disabled:opacity-50"
            >
              {loading ? "Launching..." : "DECLARE WAR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}