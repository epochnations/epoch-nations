import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Swords, Factory, Users, Shield, Package, Flag } from "lucide-react";
import LendLeaseModal from "../modals/LendLeaseModal";

export default function WarRoom({ nation, allNations, onRefresh }) {
  const [lendTarget, setLendTarget] = useState(null);
  const [endWarTarget, setEndWarTarget] = useState(null);
  const [endingWar, setEndingWar] = useState(false);

  const allies = allNations.filter(n => nation.allies?.includes(n.id));
  const enemies = allNations.filter(n => nation.at_war_with?.includes(n.id));

  async function handleEndWar(enemy) {
    setEndingWar(true);
    const CEASEFIRE_COST = 50;
    if (nation.currency < CEASEFIRE_COST) {
      alert(`You need ${CEASEFIRE_COST} cr to declare a ceasefire.`);
      setEndingWar(false);
      setEndWarTarget(null);
      return;
    }

    // Remove war from both nations
    const newMyWars = (nation.at_war_with || []).filter(id => id !== enemy.id);
    const enemyFresh = (await base44.entities.Nation.filter({ id: enemy.id }))[0];
    const newEnemyWars = (enemyFresh?.at_war_with || []).filter(id => id !== nation.id);

    await base44.entities.Nation.update(nation.id, {
      at_war_with: newMyWars,
      currency: nation.currency - CEASEFIRE_COST,
      stability: Math.max(0, (nation.stability || 75) - 5),
      war_started_at: newMyWars.length === 0 ? "" : nation.war_started_at
    });
    if (enemyFresh) {
      await base44.entities.Nation.update(enemy.id, {
        at_war_with: newEnemyWars,
        war_started_at: newEnemyWars.length === 0 ? "" : enemyFresh.war_started_at
      });
    }

    await base44.entities.NewsArticle.create({
      headline: `CEASEFIRE: ${nation.name} ends war with ${enemy.name}`,
      body: `${nation.name} has declared a unilateral ceasefire and ended hostilities with ${enemy.name}. A stability penalty was applied.`,
      category: "war", tier: "standard",
      nation_name: nation.name, nation_flag: nation.flag_emoji, nation_color: nation.flag_color
    });

    setEndingWar(false);
    setEndWarTarget(null);
    onRefresh?.();
  }

  const stats = [
    { label: "Manufacturing Capacity", value: `${nation.manufacturing}%`, icon: Factory, color: "text-orange-400" },
    { label: "Unit Power", value: nation.unit_power, icon: Swords, color: "text-red-400" },
    { label: "Defense Level", value: nation.defense_level, icon: Shield, color: "text-blue-400" },
    { label: "Population (M)", value: nation.population, icon: Users, color: "text-green-400" },
  ];

  return (
    <div className="space-y-5">
      {/* Mil stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
            <s.icon size={18} className={`${s.color} mb-2`} />
            <div className={`text-2xl font-mono font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Allies + Lend-Lease */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-blue-500/5">
            <Package size={14} className="text-blue-400" />
            <span className="text-sm font-bold text-white">Allied Nations</span>
            <span className="ml-auto text-xs text-slate-500">{allies.length} allies</span>
          </div>
          {allies.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              No allies yet. Use Lend-Lease in the World Map to forge alliances.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {allies.map(ally => (
                <div key={ally.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{ally.flag_emoji}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{ally.name}</div>
                      <div className="text-xs text-slate-500">{ally.epoch} · {ally.stability}% stability</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setLendTarget(ally)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all"
                  >
                    Lend-Lease
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active conflicts */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-red-500/5">
            <Swords size={14} className="text-red-400" />
            <span className="text-sm font-bold text-white">Active Conflicts</span>
            <span className="ml-auto text-xs text-slate-500">{enemies.length} wars</span>
          </div>
          {enemies.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              No active conflicts. Your nation is at peace.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {enemies.map(enemy => (
                <div key={enemy.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{enemy.flag_emoji}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{enemy.name}</div>
                      <div className="text-xs text-red-400">⚔ At War</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs">
                      <div className="text-slate-400">DEF {enemy.defense_level}</div>
                      <div className="text-slate-500">{enemy.epoch}</div>
                    </div>
                    <button
                      onClick={() => setEndWarTarget(enemy)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all whitespace-nowrap"
                    >
                      <Flag size={10} className="inline mr-1" />
                      Ceasefire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lendTarget && (
        <LendLeaseModal
          targetNation={lendTarget}
          myNation={nation}
          onClose={() => setLendTarget(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}