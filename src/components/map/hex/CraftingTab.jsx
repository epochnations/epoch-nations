/**
 * CraftingTab — Progressive crafting system for islands.
 * Consumes nation resources, produces bonuses and crafted goods.
 */
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const RECIPES = [
  {
    id: "planks",
    name: "Wooden Planks",
    emoji: "🪵",
    category: "materials",
    description: "Refined timber for advanced construction",
    inputs: { res_wood: 10 },
    reward: { currency: 80 },
    rewardLabel: "+80 credits",
    time: 2500,
    color: "#a16207",
  },
  {
    id: "bricks",
    name: "Stone Bricks",
    emoji: "🧱",
    category: "materials",
    description: "Quarried and shaped building blocks",
    inputs: { res_stone: 8 },
    reward: { currency: 60 },
    rewardLabel: "+60 credits",
    time: 2500,
    color: "#78716c",
  },
  {
    id: "iron_bars",
    name: "Iron Bars",
    emoji: "⚙️",
    category: "materials",
    description: "Smelted iron ingots for tools and weapons",
    inputs: { res_iron: 5 },
    reward: { currency: 100 },
    rewardLabel: "+100 credits",
    time: 3000,
    color: "#64748b",
  },
  {
    id: "rations",
    name: "Food Rations",
    emoji: "🍖",
    category: "food",
    description: "Preserved provisions for troops and workers",
    inputs: { res_food: 20 },
    reward: { currency: 50, stability: 2 },
    rewardLabel: "+50 credits, +2 stability",
    time: 2000,
    color: "#16a34a",
  },
  {
    id: "weapons",
    name: "Iron Weapons",
    emoji: "⚔️",
    category: "military",
    description: "Forged blades and armaments for combat",
    inputs: { res_iron: 10, res_wood: 5 },
    reward: { unit_power: 5 },
    rewardLabel: "+5 unit power",
    time: 4000,
    color: "#dc2626",
  },
  {
    id: "gold_coins",
    name: "Gold Coins",
    emoji: "🪙",
    category: "economy",
    description: "Minted currency from raw gold ore",
    inputs: { res_gold: 8 },
    reward: { currency: 200 },
    rewardLabel: "+200 credits",
    time: 3500,
    color: "#d97706",
  },
  {
    id: "oil_fuel",
    name: "Refined Fuel",
    emoji: "⛽",
    category: "industrial",
    description: "Processed petroleum for industry and trade",
    inputs: { res_oil: 10 },
    reward: { currency: 180, gdp: 20 },
    rewardLabel: "+180 credits, +20 GDP",
    time: 4000,
    color: "#6b21a8",
  },
  {
    id: "lumber",
    name: "Luxury Lumber",
    emoji: "🪚",
    category: "trade",
    description: "Premium hardwood for export markets",
    inputs: { res_wood: 20, res_iron: 3 },
    reward: { currency: 250 },
    rewardLabel: "+250 credits",
    time: 5000,
    color: "#92400e",
  },
];

const CAT_ICONS = { materials:"🔨", food:"🌾", military:"⚔️", economy:"💰", industrial:"⚙️", trade:"📦" };
const CAT_COLORS = { materials:"#a16207", food:"#16a34a", military:"#dc2626", economy:"#d97706", industrial:"#6b21a8", trade:"#0e7490" };

function canCraft(recipe, nation) {
  return Object.entries(recipe.inputs).every(([res, amt]) => (nation?.[res] || 0) >= amt);
}

function ResIcon({ res, amount, nation }) {
  const icons = { res_wood:"🪵", res_stone:"🪨", res_iron:"⚙️", res_food:"🌾", res_oil:"🛢️", res_gold:"🥇" };
  const has = nation?.[res] || 0;
  const enough = has >= amount;
  return (
    <span className={`text-[10px] font-bold ep-mono px-1.5 py-0.5 rounded-lg ${enough ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
      {icons[res] || "📦"}{amount} {enough ? `✓(${has})` : `✗(${has})`}
    </span>
  );
}

export default function CraftingTab({ myNation, onRefresh }) {
  const [activeCat, setActiveCat] = useState("materials");
  const [crafting, setCrafting] = useState(null); // recipe id
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const progressRef = useRef(null);

  const cats = [...new Set(RECIPES.map(r => r.category))];

  async function startCraft(recipe) {
    if (crafting) return;
    if (!canCraft(recipe, myNation)) { setMsg("❌ Not enough resources!"); return; }

    setCrafting(recipe.id);
    setProgress(0);
    setMsg(null);

    // Animated progress
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / recipe.time) * 100);
      setProgress(pct);

      // Sparkles during crafting
      if (Math.random() > 0.6) {
        const id = Date.now();
        setSparkles(s => [...s, { id, x: randomBetween(20, 80), y: randomBetween(20, 80) }]);
        setTimeout(() => setSparkles(s => s.filter(sp => sp.id !== id)), 800);
      }

      if (pct >= 100) {
        clearInterval(tick);
        completeCraft(recipe);
      }
    }, 60);
    progressRef.current = tick;
  }

  function randomBetween(a, b) { return a + Math.random() * (b - a); }

  async function completeCraft(recipe) {
    const updates = {};
    // Deduct inputs
    Object.entries(recipe.inputs).forEach(([res, amt]) => {
      updates[res] = Math.max(0, (myNation?.[res] || 0) - amt);
    });
    // Apply rewards
    Object.entries(recipe.reward).forEach(([stat, val]) => {
      updates[stat] = (myNation?.[stat] || 0) + val;
    });

    await base44.entities.Nation.update(myNation.id, updates);
    setCrafting(null);
    setProgress(0);
    setMsg(`✅ ${recipe.emoji} ${recipe.name} crafted! ${recipe.rewardLabel}`);
    onRefresh?.();
    setTimeout(() => setMsg(null), 4000);
  }

  useEffect(() => {
    return () => clearInterval(progressRef.current);
  }, []);

  const activeRecipe = crafting ? RECIPES.find(r => r.id === crafting) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-2 overflow-x-auto shrink-0" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        {cats.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
            style={{
              background: activeCat===cat ? `${CAT_COLORS[cat]}18` : "transparent",
              borderColor: activeCat===cat ? `${CAT_COLORS[cat]}40` : "rgba(255,255,255,0.08)",
              color: activeCat===cat ? CAT_COLORS[cat] : "#64748b",
            }}>
            {CAT_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Active crafting progress */}
      {crafting && activeRecipe && (
        <div className="mx-3 mt-3 mb-1 rounded-xl p-3 relative overflow-hidden shrink-0"
          style={{ background:`${activeRecipe.color}12`, border:`1px solid ${activeRecipe.color}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" style={{ animation: "spin 1s linear infinite" }}>{activeRecipe.emoji}</span>
            <div>
              <div className="text-xs font-bold text-white">Crafting {activeRecipe.name}…</div>
              <div className="text-[10px] text-slate-400">{Math.round(progress)}%</div>
            </div>
            <div className="ml-auto text-xs font-bold" style={{ color: activeRecipe.color }}>{activeRecipe.rewardLabel}</div>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-75 relative overflow-hidden"
              style={{ width:`${progress}%`, background:`linear-gradient(90deg, ${activeRecipe.color}, ${activeRecipe.color}cc)` }}>
              <div className="absolute inset-0 opacity-40"
                style={{ background:"linear-gradient(90deg,transparent 0%, white 50%, transparent 100%)", backgroundSize:"200% 100%", animation:"shimmer 1s linear infinite" }}/>
            </div>
          </div>
          {/* Sparkle particles */}
          {sparkles.map(sp => (
            <div key={sp.id} className="absolute pointer-events-none text-xs"
              style={{ left:`${sp.x}%`, top:`${sp.y}%`, animation:"sparkleFloat 0.8s ease-out forwards" }}>
              ✨
            </div>
          ))}
        </div>
      )}

      {/* Status message */}
      {msg && (
        <div className={`mx-3 mt-2 px-3 py-2 rounded-lg text-xs font-bold shrink-0 ${msg.startsWith("✅") ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"}`}>
          {msg}
        </div>
      )}

      {/* Recipe list */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3 space-y-2"
        style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(34,211,238,0.2) transparent" }}>
        {RECIPES.filter(r => r.category === activeCat).map(recipe => {
          const able = canCraft(recipe, myNation) && !crafting;
          const active = crafting === recipe.id;
          return (
            <button key={recipe.id}
              onClick={() => startCraft(recipe)}
              disabled={!able && !active}
              className="w-full rounded-xl p-3 text-left transition-all hover:scale-[1.01] disabled:cursor-not-allowed"
              style={{
                background: active ? `${recipe.color}18` : able ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${active ? recipe.color+"50" : able ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                opacity: !able && !active ? 0.55 : 1,
              }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background:`${recipe.color}20`, border:`1px solid ${recipe.color}30` }}>
                  {recipe.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white">{recipe.name}</span>
                    <span className="text-[10px] font-bold ep-mono" style={{ color: recipe.color }}>{recipe.rewardLabel}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mb-1.5">{recipe.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(recipe.inputs).map(([res, amt]) => (
                      <ResIcon key={res} res={res} amount={amt} nation={myNation} />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to   { background-position: 200% 0; }
        }
        @keyframes sparkleFloat {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%,-200%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}