/**
 * WarFrontPanel — Dynamic war front visualization with moving lines,
 * battle zones, captured cities, and retreat mechanics.
 */
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, TrendingUp, TrendingDown } from "lucide-react";

const FRONT_EVENTS = [
  "Frontline push — enemy lines crumbling!",
  "Enemy counterattack repelled.",
  "Flanking maneuver executed.",
  "Supply lines disrupted.",
  "Artillery barrage ongoing.",
  "Reinforcements arriving.",
  "Strategic retreat to defensive positions.",
  "Breakthrough achieved at the northern front!",
  "Armored column advancing.",
  "Air support called in.",
];

function MomentumBar({ momentum }) {
  const pct = Math.min(100, Math.max(0, (momentum + 100) / 2));
  const color = pct > 60 ? "#4ade80" : pct < 40 ? "#f87171" : "#fbbf24";
  return (
    <div className="w-full h-3 rounded-full overflow-hidden relative" style={{ background:"rgba(255,255,255,0.07)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})` }}/>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black ep-mono" style={{ color: pct > 50 ? "#000" : "#fff", textShadow:"0 0 4px rgba(0,0,0,0.8)" }}>
          {momentum > 0 ? `+${momentum}` : momentum} MOMENTUM
        </span>
      </div>
    </div>
  );
}

export default function WarFrontPanel({ nation, onClose, onRefresh }) {
  const [fronts, setFronts] = useState([]);
  const [nations, setNations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("fronts");
  const tickRef = useRef(null);

  useEffect(() => {
    loadData();
    tickRef.current = setInterval(simulateFrontTick, 30000); // 30s tick
    return () => clearInterval(tickRef.current);
  }, [nation?.id]);

  async function loadData() {
    const [f, n] = await Promise.all([
      base44.entities.WarFront.filter({ attacker_nation_id: nation.id })
        .then(a => base44.entities.WarFront.filter({ defender_nation_id: nation.id }).then(d => [...a, ...d]))
        .catch(() => []),
      base44.entities.Nation.list("-gdp", 60),
    ]);
    setFronts(f.flat ? f.flat() : f);
    setNations(n);

    // Auto-create war fronts for active wars
    const enemies = nation.at_war_with || [];
    for (const eid of enemies) {
      const existing = f.find(x => (x.attacker_nation_id === nation.id && x.defender_nation_id === eid) ||
                                    (x.defender_nation_id === nation.id && x.attacker_nation_id === eid));
      if (!existing) {
        const enemy = n.find(x => x.id === eid);
        if (enemy) {
          await base44.entities.WarFront.create({
            attacker_nation_id: nation.id, attacker_nation_name: nation.name,
            defender_nation_id: enemy.id, defender_nation_name: enemy.name,
            momentum: 0, status: "active", battle_intensity: 50,
            front_x: 0, front_y: 0, captured_cities: [], last_event: "War front established.",
          }).catch(() => {});
        }
      }
    }
  }

  async function simulateFrontTick() {
    if (!nation?.at_war_with?.length) return;
    const myFronts = await base44.entities.WarFront.filter({ attacker_nation_id: nation.id }).catch(() => []);
    for (const front of myFronts) {
      const atkPwr = (nation.unit_power || 10) * (nation.tech_level || 1);
      const defNation = nations.find(n2 => n2.id === front.defender_nation_id);
      const defPwr = defNation ? (defNation.defense_level || 10) * (defNation.tech_level || 1) : 50;
      const delta = (atkPwr - defPwr) * 0.5 + (Math.random() - 0.5) * 20;
      const newMomentum = Math.min(100, Math.max(-100, (front.momentum || 0) + delta));
      const status = newMomentum > 60 ? "breakthrough" : newMomentum < -60 ? "retreat" : newMomentum > 20 ? "active" : "stalemate";
      const event = FRONT_EVENTS[Math.floor(Math.random() * FRONT_EVENTS.length)];
      await base44.entities.WarFront.update(front.id, {
        momentum: Math.round(newMomentum),
        status,
        last_event: event,
        battle_intensity: Math.min(100, 30 + Math.abs(delta) * 2),
      }).catch(() => {});
    }
    loadData();
  }

  async function pushOffensive(front) {
    const cost = 500;
    if ((nation.currency || 0) < cost) { alert("Need 500 cr for offensive push."); return; }
    setLoading(true);
    const newMomentum = Math.min(100, (front.momentum || 0) + 25 + Math.floor(Math.random() * 20));
    await Promise.all([
      base44.entities.WarFront.update(front.id, {
        momentum: newMomentum,
        status: newMomentum > 60 ? "breakthrough" : "active",
        last_event: "Major offensive launched! Enemy lines pushed back.",
        battle_intensity: Math.min(100, (front.battle_intensity || 50) + 20),
      }),
      base44.entities.Nation.update(nation.id, { currency: Math.max(0, (nation.currency||0) - cost) }),
    ]);
    setLoading(false);
    loadData(); onRefresh?.();
  }

  async function callRetreat(front) {
    setLoading(true);
    await base44.entities.WarFront.update(front.id, {
      momentum: Math.max(-100, (front.momentum || 0) - 30),
      status: "retreat",
      last_event: "Strategic retreat ordered. Forces regrouping.",
    });
    setLoading(false);
    loadData();
  }

  const isAtWar = (nation.at_war_with || []).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)" }}>
      <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background:"linear-gradient(135deg,#150000 0%,#040810 100%)", border:"1px solid rgba(239,68,68,0.25)", maxHeight:"90vh" }}>

        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor:"rgba(239,68,68,0.15)", background:"linear-gradient(90deg,rgba(239,68,68,0.08),transparent)" }}>
          <Swords size={18} className="text-red-400"/>
          <span className="font-bold text-white text-lg">Dynamic War Fronts</span>
          {!isAtWar && <span className="text-xs text-slate-500">— Not currently at war</span>}
          <button onClick={onClose} className="ml-auto"><X size={16} className="text-slate-400 hover:text-white"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isAtWar && (
            <div className="text-center text-slate-500 py-12">
              <Swords size={32} className="mx-auto mb-3 text-slate-600"/>
              <div>No active war fronts. Declare war on a nation to open fronts.</div>
            </div>
          )}

          {fronts.map(front => {
            const isAttacker = front.attacker_nation_id === nation.id;
            const enemyName = isAttacker ? front.defender_nation_name : front.attacker_nation_name;
            const momentum = isAttacker ? front.momentum : -(front.momentum || 0);
            const statusColors = {
              breakthrough: "#4ade80", active: "#fbbf24", stalemate: "#64748b",
              retreat: "#f87171", resolved: "#94a3b8"
            };
            const statusColor = statusColors[front.status] || "#fbbf24";

            return (
              <motion.div key={front.id} layout
                className="rounded-xl p-4 space-y-3"
                style={{ background:"rgba(239,68,68,0.05)", border:`1px solid ${statusColor}30` }}>

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚔️</span>
                    <div>
                      <div className="text-sm font-bold text-white">{nation.name} vs {enemyName}</div>
                      <div className="text-[10px] text-slate-500">{isAttacker ? "You are attacking" : "You are defending"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: statusColor, background:`${statusColor}15`, border:`1px solid ${statusColor}30` }}>
                      {front.status?.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Intensity: {Math.round(front.battle_intensity||50)}%</div>
                  </div>
                </div>

                {/* Momentum */}
                <MomentumBar momentum={momentum}/>

                {/* Battle intensity bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Battle Intensity</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.07)" }}>
                    <motion.div className="h-full rounded-full" style={{ background:"#ef4444" }}
                      animate={{ width:`${front.battle_intensity||50}%` }}/>
                  </div>
                  <span className="text-[10px] text-red-400 font-bold">{Math.round(front.battle_intensity||50)}%</span>
                </div>

                {/* Last event */}
                {front.last_event && (
                  <div className="text-xs text-slate-400 italic px-3 py-2 rounded-lg" style={{ background:"rgba(255,255,255,0.03)" }}>
                    📡 {front.last_event}
                  </div>
                )}

                {/* Captured cities */}
                {(front.captured_cities||[]).length > 0 && (
                  <div className="text-xs text-amber-400">🏴 Captured: {front.captured_cities.join(", ")}</div>
                )}

                {/* Actions */}
                {isAttacker && front.status !== "resolved" && (
                  <div className="flex gap-2">
                    <button onClick={()=>pushOffensive(front)} disabled={loading}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-black bg-red-500 hover:bg-red-400 transition-all disabled:opacity-40">
                      ⚔️ Push Offensive (-500 cr)
                    </button>
                    <button onClick={()=>callRetreat(front)} disabled={loading}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-500 text-slate-400 hover:bg-white/5 transition-all">
                      🏳️ Retreat
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}

          {isAtWar && fronts.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <div className="text-sm">War front data loading… Fronts auto-generate for active wars.</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}