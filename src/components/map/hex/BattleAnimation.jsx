/**
 * BattleAnimation — Epic naval battle animation overlay.
 * Plays when a player attempts to claim another nation's island.
 */
import { useState, useEffect, useRef } from "react";

const CANNON_SOUNDS = ["💥","🔥","💣","⚡"];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

export default function BattleAnimation({ attackerNation, defenderTile, onComplete }) {
  const [phase, setPhase] = useState("approach"); // approach → combat → result → done
  const [cannonFire, setCannonFire] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [damageNums, setDamageNums] = useState([]);
  const [smoke, setSmoke] = useState([]);
  const [cameraShake, setCameraShake] = useState(false);
  const [result, setResult] = useState(null); // "victory" | "repelled"
  const intervalRef = useRef(null);
  const idRef = useRef(0);

  const cfg = defenderTile?.terrain_type || "tropical";

  function nextId() { return ++idRef.current; }

  function addExplosion(x, y) {
    const id = nextId();
    setExplosions(e => [...e, { id, x, y }]);
    setTimeout(() => setExplosions(e => e.filter(ex => ex.id !== id)), 800);
  }

  function addCannon(x1, y1, x2, y2) {
    const id = nextId();
    setCannonFire(c => [...c, { id, x1, y1, x2, y2 }]);
    setTimeout(() => setCannonFire(c => c.filter(cf => cf.id !== id)), 600);
  }

  function addDamage(x, y, val) {
    const id = nextId();
    setDamageNums(d => [...d, { id, x, y, val }]);
    setTimeout(() => setDamageNums(d => d.filter(dm => dm.id !== id)), 1200);
  }

  function addSmoke(x, y) {
    const id = nextId();
    setSmoke(s => [...s, { id, x, y }]);
    setTimeout(() => setSmoke(s => s.filter(sm => sm.id !== id)), 1500);
  }

  useEffect(() => {
    // Phase 1: Fleet approach (0–1.5s)
    setTimeout(() => {
      setPhase("combat");
      // Start combat effects
      let tick = 0;
      intervalRef.current = setInterval(() => {
        tick++;
        // Random cannon fire
        const shots = Math.floor(randomBetween(1, 4));
        for (let i = 0; i < shots; i++) {
          const x1 = randomBetween(5, 35);
          const y1 = randomBetween(55, 80);
          const x2 = randomBetween(40, 75);
          const y2 = randomBetween(25, 55);
          setTimeout(() => {
            addCannon(x1, y1, x2, y2);
            setTimeout(() => {
              addExplosion(x2 + randomBetween(-3, 3), y2 + randomBetween(-3, 3));
              addDamage(x2 + randomBetween(-5, 5), y2 - 5, Math.floor(randomBetween(15, 80)));
              if (Math.random() > 0.5) addSmoke(x2 + randomBetween(-5, 5), y2 + randomBetween(-5, 5));
            }, 300);
          }, i * 200);
        }
        // Camera shake on big shots
        if (tick % 2 === 0) {
          setCameraShake(true);
          setTimeout(() => setCameraShake(false), 200);
        }
      }, 400);

      setTimeout(() => {
        clearInterval(intervalRef.current);
        setPhase("result");
      }, 2800);
    }, 1500);

    return () => clearInterval(intervalRef.current);
  }, []);

  function handleResult(won) {
    setResult(won ? "victory" : "repelled");
    setTimeout(() => {
      setPhase("done");
      onComplete(won);
    }, 1800);
  }

  // Auto-resolve when result phase starts — will be called by parent
  useEffect(() => {
    if (phase === "result") {
      // Wait a beat then show result buttons
    }
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(4px)" }}>

      {/* Battle arena */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-3xl overflow-hidden"
        style={{
          height: "min(520px, 80vh)",
          background: "linear-gradient(180deg, #071428 0%, #0a1e38 50%, #061020 100%)",
          border: "2px solid rgba(239,68,68,0.4)",
          boxShadow: "0 0 60px rgba(239,68,68,0.3), inset 0 0 40px rgba(0,0,0,0.5)",
          transform: cameraShake ? `translate(${Math.random()*6-3}px, ${Math.random()*4-2}px)` : "none",
          transition: cameraShake ? "none" : "transform 0.1s ease",
        }}>

        {/* Ocean background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="battleOcean" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#061428"/>
              <stop offset="100%" stopColor="#0a2444"/>
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#battleOcean)"/>
          {/* Animated waves */}
          {[20,35,50,65,80].map((y,i) => (
            <path key={i}
              d={`M0 ${y} Q25 ${y-4} 50 ${y} Q75 ${y+4} 100 ${y}`}
              stroke="#1a4a7a" strokeWidth="0.6" fill="none" opacity="0.4">
              <animateTransform attributeName="transform" type="translate"
                from={`${i%2===0?'-10':'-5'} 0`} to={`${i%2===0?'10':'5'} 0`}
                dur={`${2+i*0.4}s`} repeatCount="indefinite" additive="sum"/>
            </path>
          ))}
          {/* Island */}
          <ellipse cx="60" cy="38" rx="18" ry="12" fill="#1e7a32" opacity="0.9"/>
          <ellipse cx="60" cy="37" rx="14" ry="9" fill="#27ae60"/>
          <polygon points="60,20 55,35 65,35" fill="#0f4a1e" opacity="0.7"/>
          {/* Island flag */}
          <line x1="60" y1="28" x2="60" y2="20" stroke="#64748b" strokeWidth="0.8"/>
          <polygon points="60,20 67,23 60,26" fill="#ef4444" opacity="0.9"/>
        </svg>

        {/* Attacker fleet (left side) */}
        <div className={`absolute transition-all duration-1000 ${phase === "approach" ? "left-[-20%]" : "left-[5%]"}`}
          style={{ bottom: "22%", display: "flex", gap: 8 }}>
          {[0,1,2].map(i => (
            <div key={i} className="text-3xl" style={{
              filter: "drop-shadow(0 0 8px rgba(34,211,238,0.6))",
              animation: `float ${1.2+i*0.3}s ease-in-out infinite alternate`,
              animationDelay: `${i*0.2}s`,
            }}>
              ⛵
            </div>
          ))}
        </div>

        {/* Defender fleet (right side) */}
        <div className="absolute right-[8%]" style={{ bottom: "28%", display: "flex", gap: 6, flexDirection: "row-reverse" }}>
          {[0,1].map(i => (
            <div key={i} className="text-2xl" style={{
              filter: "drop-shadow(0 0 8px rgba(239,68,68,0.6))",
              animation: `float ${1.4+i*0.3}s ease-in-out infinite alternate`,
              animationDelay: `${i*0.3}s`,
            }}>
              🚢
            </div>
          ))}
        </div>

        {/* Cannon fire lines (SVG overlay) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          {cannonFire.map(cf => (
            <line key={cf.id}
              x1={cf.x1+"%"} y1={cf.y1+"%"} x2={cf.x2+"%"} y2={cf.y2+"%"}
              stroke="#fbbf24" strokeWidth="0.8" opacity="0.9"
              strokeDasharray="2,1"/>
          ))}
        </svg>

        {/* Explosions */}
        {explosions.map(ex => (
          <div key={ex.id} className="absolute pointer-events-none" style={{
            left: `${ex.x}%`, top: `${ex.y}%`,
            transform: "translate(-50%,-50%)",
            animation: "explode 0.8s ease-out forwards",
          }}>
            <div style={{ fontSize: "clamp(20px,3vw,28px)" }}>💥</div>
            <div className="absolute inset-0 rounded-full" style={{
              background: "radial-gradient(circle, rgba(255,150,0,0.7) 0%, transparent 70%)",
              animation: "expandGlow 0.8s ease-out forwards",
            }}/>
          </div>
        ))}

        {/* Smoke clouds */}
        {smoke.map(sm => (
          <div key={sm.id} className="absolute pointer-events-none text-2xl"
            style={{ left: `${sm.x}%`, top: `${sm.y}%`, transform: "translate(-50%,-50%)",
              animation: "smokeRise 1.5s ease-out forwards", opacity: 0.7 }}>
            💨
          </div>
        ))}

        {/* Damage numbers */}
        {damageNums.map(dm => (
          <div key={dm.id} className="absolute pointer-events-none font-black text-red-400"
            style={{ left: `${dm.x}%`, top: `${dm.y}%`, transform: "translate(-50%,-50%)",
              fontSize: "clamp(14px,2.5vw,20px)",
              animation: "damageFloat 1.2s ease-out forwards",
              textShadow: "0 0 10px rgba(239,68,68,0.8)",
              zIndex: 10 }}>
            -{dm.val}
          </div>
        ))}

        {/* Phase label */}
        <div className="absolute top-4 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(239,68,68,0.4)", color: "#fbbf24" }}>
            {phase === "approach" && "⚓ FLEET APPROACHING..."}
            {phase === "combat"   && <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"/> NAVAL BATTLE IN PROGRESS</>}
            {phase === "result"   && "⚔️ COMBAT RESOLVED"}
            {phase === "done"     && ""}
          </div>
        </div>

        {/* Combatants */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)" }}>
            <span className="text-lg">{attackerNation?.flag_emoji || "⚔️"}</span>
            <div>
              <div className="text-[10px] text-slate-400">Attacker</div>
              <div className="text-xs font-bold text-cyan-400">{attackerNation?.name || "Your Nation"}</div>
            </div>
          </div>
          <div className="text-2xl font-black text-red-400" style={{ textShadow: "0 0 20px rgba(239,68,68,0.8)" }}>VS</div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Defender</div>
              <div className="text-xs font-bold text-red-400">{defenderTile?.owner_nation_name || "Unknown"}</div>
            </div>
            <span className="text-lg">🏰</span>
          </div>
        </div>

        {/* Result buttons */}
        {phase === "result" && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}>
            <div className="text-center space-y-4 px-6">
              <div className="text-4xl">⚔️</div>
              <div className="text-white font-bold text-lg">Resolve Battle Outcome</div>
              <div className="flex gap-3">
                <button onClick={() => handleResult(true)}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                  🏆 Claim Victory
                </button>
                <button onClick={() => handleResult(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}>
                  🛡️ Repelled
                </button>
              </div>
              <div className="text-[10px] text-slate-500">Click to apply combat result</div>
            </div>
          </div>
        )}

        {/* Victory/defeat splash */}
        {result && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ background: result==="victory" ? "rgba(5,150,105,0.3)" : "rgba(220,38,38,0.3)" }}>
            <div className="text-center" style={{ animation: "victoryPop 0.5s ease-out" }}>
              <div className="text-6xl">{result==="victory" ? "🏆" : "🛡️"}</div>
              <div className={`text-2xl font-black mt-2 ${result==="victory" ? "text-green-400" : "text-red-400"}`}
                style={{ textShadow: result==="victory" ? "0 0 30px rgba(74,222,128,0.8)" : "0 0 30px rgba(239,68,68,0.8)" }}>
                {result==="victory" ? "ISLAND CAPTURED!" : "ASSAULT REPELLED!"}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px); }
          to   { transform: translateY(-6px); }
        }
        @keyframes explode {
          0%   { transform: translate(-50%,-50%) scale(0.3); opacity: 1; }
          50%  { transform: translate(-50%,-50%) scale(1.5); opacity: 0.9; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
        @keyframes expandGlow {
          from { transform: scale(0); opacity: 0.8; }
          to   { transform: scale(4); opacity: 0; }
        }
        @keyframes smokeRise {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.7; }
          100% { transform: translate(-50%,-200%) scale(2); opacity: 0; }
        }
        @keyframes damageFloat {
          0%   { transform: translate(-50%,-50%); opacity: 1; }
          100% { transform: translate(-50%,-200%); opacity: 0; }
        }
        @keyframes victoryPop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}