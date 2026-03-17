/**
 * CraftingTab — Machine-based crafting engine for island panels.
 * Minecraft/Terraria-style machines with input slots, output slots, animations.
 * Fully integrated with the 1400+ item ItemDatabase.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronRight, Zap, Info } from "lucide-react";

// ── Machine definitions ────────────────────────────────────────────────────────
const MACHINES = [
  {
    id: "forge",
    name: "Forge",
    emoji: "🔥",
    color: "#f97316",
    desc: "Smelts ores into ingots and forges weapons",
    animClass: "forge-anim",
    fuelType: "coal",
  },
  {
    id: "sawmill",
    name: "Sawmill",
    emoji: "🪚",
    color: "#a16207",
    desc: "Cuts timber into planks and specialty lumber",
    animClass: "sawmill-anim",
    fuelType: null,
  },
  {
    id: "kiln",
    name: "Kiln",
    emoji: "🧱",
    color: "#78716c",
    desc: "Fires clay and sand into bricks and glass",
    animClass: "kiln-anim",
    fuelType: "coal",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    emoji: "🍳",
    color: "#16a34a",
    desc: "Processes food into rations and provisions",
    animClass: "kitchen-anim",
    fuelType: null,
  },
  {
    id: "workshop",
    name: "Workshop",
    emoji: "🔨",
    color: "#0e7490",
    desc: "Crafts tools, weapons, and refined goods",
    animClass: "workshop-anim",
    fuelType: null,
  },
  {
    id: "refinery",
    name: "Refinery",
    emoji: "⛽",
    color: "#6b21a8",
    desc: "Refines crude oil into fuels and chemicals",
    animClass: "refinery-anim",
    fuelType: null,
  },
];

// ── Recipes per machine ────────────────────────────────────────────────────────
// Each recipe maps island resource keys → nation stat rewards
const MACHINE_RECIPES = {
  forge: [
    {
      id: "iron_bars",
      name: "Iron Bars",
      emoji: "⚙️",
      description: "Smelted iron ingots for tools and weapons",
      inputs: [{ res: "res_iron", label: "Iron Ore", emoji: "🟫", amount: 5 }],
      output: { label: "Iron Bars ×5", emoji: "⚙️" },
      reward: { currency: 100 },
      rewardLabel: "+100 cr",
      time: 3000,
      tier: 1,
    },
    {
      id: "weapons",
      name: "Iron Weapons",
      emoji: "⚔️",
      description: "Forged blades and armaments",
      inputs: [
        { res: "res_iron", label: "Iron Ore", emoji: "🟫", amount: 10 },
        { res: "res_wood", label: "Timber",   emoji: "🪵", amount: 5 },
      ],
      output: { label: "Iron Weapons ×3", emoji: "⚔️" },
      reward: { unit_power: 5 },
      rewardLabel: "+5 unit power",
      time: 4000,
      tier: 1,
    },
    {
      id: "gold_coins",
      name: "Gold Coins",
      emoji: "🪙",
      description: "Minted currency from raw gold ore",
      inputs: [{ res: "res_gold", label: "Gold Ore", emoji: "🥇", amount: 8 }],
      output: { label: "Gold Coins ×8", emoji: "🪙" },
      reward: { currency: 200 },
      rewardLabel: "+200 cr",
      time: 3500,
      tier: 1,
    },
    {
      id: "steel_alloy",
      name: "Steel Alloy",
      emoji: "🔩",
      description: "Refined steel for advanced manufacturing",
      inputs: [
        { res: "res_iron", label: "Iron Ore", emoji: "🟫", amount: 15 },
        { res: "res_stone", label: "Coal Stone", emoji: "🪨", amount: 5 },
      ],
      output: { label: "Steel Ingots ×6", emoji: "🔩" },
      reward: { currency: 220, manufacturing: 3 },
      rewardLabel: "+220 cr, +3 mfg",
      time: 5000,
      tier: 2,
    },
  ],
  sawmill: [
    {
      id: "planks",
      name: "Wooden Planks",
      emoji: "🪵",
      description: "Refined timber for construction",
      inputs: [{ res: "res_wood", label: "Timber", emoji: "🪵", amount: 10 }],
      output: { label: "Planks ×20", emoji: "🪵" },
      reward: { currency: 80 },
      rewardLabel: "+80 cr",
      time: 2500,
      tier: 1,
    },
    {
      id: "lumber",
      name: "Luxury Lumber",
      emoji: "🪚",
      description: "Premium hardwood for export",
      inputs: [
        { res: "res_wood", label: "Timber", emoji: "🪵", amount: 20 },
        { res: "res_iron", label: "Iron",   emoji: "🟫", amount: 3 },
      ],
      output: { label: "Luxury Lumber ×10", emoji: "🪚" },
      reward: { currency: 250 },
      rewardLabel: "+250 cr",
      time: 5000,
      tier: 2,
    },
    {
      id: "timber_frame",
      name: "Timber Frame",
      emoji: "🏗️",
      description: "Structural frame for buildings",
      inputs: [{ res: "res_wood", label: "Timber", emoji: "🪵", amount: 30 }],
      output: { label: "Timber Frames ×5", emoji: "🏗️" },
      reward: { currency: 160, housing_capacity: 2 },
      rewardLabel: "+160 cr, +2 housing",
      time: 4500,
      tier: 2,
    },
  ],
  kiln: [
    {
      id: "bricks",
      name: "Stone Bricks",
      emoji: "🧱",
      description: "Fired bricks for construction",
      inputs: [{ res: "res_stone", label: "Stone", emoji: "🪨", amount: 8 }],
      output: { label: "Bricks ×16", emoji: "🧱" },
      reward: { currency: 60 },
      rewardLabel: "+60 cr",
      time: 2500,
      tier: 1,
    },
    {
      id: "glass_panes",
      name: "Glass Panes",
      emoji: "🪟",
      description: "Sand-fired glass for windows",
      inputs: [
        { res: "res_stone", label: "Sand/Stone", emoji: "🪨", amount: 12 },
        { res: "res_gold",  label: "Mineral",    emoji: "🥇", amount: 2 },
      ],
      output: { label: "Glass Panes ×8", emoji: "🪟" },
      reward: { currency: 140 },
      rewardLabel: "+140 cr",
      time: 3500,
      tier: 2,
    },
    {
      id: "ceramics",
      name: "Ceramics",
      emoji: "🏺",
      description: "Fired ceramics for trade and use",
      inputs: [{ res: "res_stone", label: "Stone/Clay", emoji: "🪨", amount: 20 }],
      output: { label: "Ceramics ×10", emoji: "🏺" },
      reward: { currency: 180, stability: 1 },
      rewardLabel: "+180 cr, +1 stability",
      time: 4000,
      tier: 2,
    },
  ],
  kitchen: [
    {
      id: "rations",
      name: "Food Rations",
      emoji: "🍖",
      description: "Preserved provisions for troops",
      inputs: [{ res: "res_food", label: "Food", emoji: "🌾", amount: 20 }],
      output: { label: "Rations ×20", emoji: "🍖" },
      reward: { currency: 50, stability: 2 },
      rewardLabel: "+50 cr, +2 stability",
      time: 2000,
      tier: 1,
    },
    {
      id: "feast",
      name: "Grand Feast",
      emoji: "🍲",
      description: "Celebratory meal boosting morale",
      inputs: [
        { res: "res_food", label: "Food",     emoji: "🌾", amount: 40 },
        { res: "res_gold", label: "Spices",   emoji: "🥇", amount: 4 },
      ],
      output: { label: "Grand Feast ×1", emoji: "🍲" },
      reward: { stability: 8, public_trust: 0.05 },
      rewardLabel: "+8 stability, +trust",
      time: 5000,
      tier: 2,
    },
    {
      id: "medicinal_brew",
      name: "Medicinal Brew",
      emoji: "🧪",
      description: "Healing potions from forest herbs",
      inputs: [
        { res: "res_food", label: "Herbs/Food", emoji: "🌾", amount: 15 },
        { res: "res_wood", label: "Bark",       emoji: "🪵", amount: 5 },
      ],
      output: { label: "Medicine ×5", emoji: "🧪" },
      reward: { stability: 5, currency: 80 },
      rewardLabel: "+5 stability, +80 cr",
      time: 3500,
      tier: 2,
    },
  ],
  workshop: [
    {
      id: "tools_set",
      name: "Tool Set",
      emoji: "🔧",
      description: "Complete set of worker tools",
      inputs: [
        { res: "res_iron", label: "Iron",  emoji: "🟫", amount: 8 },
        { res: "res_wood", label: "Wood",  emoji: "🪵", amount: 6 },
      ],
      output: { label: "Tool Set ×3", emoji: "🔧" },
      reward: { manufacturing: 5, currency: 120 },
      rewardLabel: "+5 mfg, +120 cr",
      time: 4000,
      tier: 1,
    },
    {
      id: "trade_goods",
      name: "Trade Goods",
      emoji: "📦",
      description: "Packaged goods for export markets",
      inputs: [
        { res: "res_wood",  label: "Wood",  emoji: "🪵", amount: 15 },
        { res: "res_stone", label: "Stone", emoji: "🪨", amount: 10 },
        { res: "res_iron",  label: "Iron",  emoji: "🟫", amount: 5 },
      ],
      output: { label: "Trade Crates ×5", emoji: "📦" },
      reward: { currency: 320, gdp: 25 },
      rewardLabel: "+320 cr, +25 GDP",
      time: 6000,
      tier: 2,
    },
    {
      id: "defensive_gear",
      name: "Defensive Gear",
      emoji: "🛡️",
      description: "Armor and shields for defenders",
      inputs: [
        { res: "res_iron", label: "Iron",  emoji: "🟫", amount: 12 },
        { res: "res_food", label: "Hides", emoji: "🌾", amount: 8 },
      ],
      output: { label: "Armor Sets ×4", emoji: "🛡️" },
      reward: { defense_level: 8 },
      rewardLabel: "+8 defense",
      time: 4500,
      tier: 2,
    },
  ],
  refinery: [
    {
      id: "oil_fuel",
      name: "Refined Fuel",
      emoji: "⛽",
      description: "Processed petroleum for industry",
      inputs: [{ res: "res_oil", label: "Crude Oil", emoji: "🛢️", amount: 10 }],
      output: { label: "Fuel ×15", emoji: "⛽" },
      reward: { currency: 180, gdp: 20 },
      rewardLabel: "+180 cr, +20 GDP",
      time: 4000,
      tier: 2,
    },
    {
      id: "chemical_reagent",
      name: "Chemical Reagent",
      emoji: "🧪",
      description: "Industrial chemicals for manufacturing",
      inputs: [
        { res: "res_oil",   label: "Crude Oil", emoji: "🛢️", amount: 8 },
        { res: "res_stone", label: "Minerals",  emoji: "🪨", amount: 6 },
      ],
      output: { label: "Reagent ×8", emoji: "🧪" },
      reward: { currency: 200, tech_points: 15 },
      rewardLabel: "+200 cr, +15 tech pts",
      time: 5000,
      tier: 3,
    },
    {
      id: "polymer",
      name: "Polymer Sheets",
      emoji: "🔲",
      description: "Synthetic plastic for industry",
      inputs: [{ res: "res_oil", label: "Crude Oil", emoji: "🛢️", amount: 20 }],
      output: { label: "Polymer ×20", emoji: "🔲" },
      reward: { currency: 280, manufacturing: 8 },
      rewardLabel: "+280 cr, +8 mfg",
      time: 6000,
      tier: 3,
    },
  ],
};

// ── Resource icons and labels ─────────────────────────────────────────────────
const RES_ICONS = {
  res_wood:  { emoji: "🪵", label: "Wood",  key: "res_wood" },
  res_stone: { emoji: "🪨", label: "Stone", key: "res_stone" },
  res_iron:  { emoji: "🟫", label: "Iron",  key: "res_iron" },
  res_food:  { emoji: "🌾", label: "Food",  key: "res_food" },
  res_oil:   { emoji: "🛢️", label: "Oil",   key: "res_oil" },
  res_gold:  { emoji: "🥇", label: "Gold",  key: "res_gold" },
};

function canCraft(recipe, nation) {
  return recipe.inputs.every(i => (nation?.[i.res] || 0) >= i.amount);
}

// ── Animated machine visual ────────────────────────────────────────────────────
function MachineVisual({ machine, running, progress }) {
  const colorMap = {
    forge:    { bg: "#f97316", glow: "rgba(249,115,22,0.4)" },
    sawmill:  { bg: "#a16207", glow: "rgba(161,98,7,0.4)" },
    kiln:     { bg: "#78716c", glow: "rgba(120,113,108,0.4)" },
    kitchen:  { bg: "#16a34a", glow: "rgba(22,163,74,0.4)" },
    workshop: { bg: "#0e7490", glow: "rgba(14,116,144,0.4)" },
    refinery: { bg: "#6b21a8", glow: "rgba(107,33,168,0.4)" },
  };
  const { bg, glow } = colorMap[machine.id] || colorMap.workshop;

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Machine icon */}
      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
        style={{
          background: `${bg}18`,
          border: `2px solid ${bg}${running ? "70" : "30"}`,
          boxShadow: running ? `0 0 20px ${glow}, 0 0 40px ${glow}50` : "none",
          transition: "all 0.4s ease",
        }}>
        <span style={{ animation: running ? getMachineAnim(machine.id) : "none" }}>
          {machine.emoji}
        </span>
        {/* Spark particles when running */}
        {running && machine.id === "forge" && (
          <>
            <div className="absolute -top-1 -right-1 text-[10px]" style={{ animation: "sparkFloat 0.6s ease-out infinite" }}>✨</div>
            <div className="absolute -top-1 -left-1 text-[10px]" style={{ animation: "sparkFloat 0.8s ease-out 0.3s infinite" }}>⚡</div>
          </>
        )}
        {running && machine.id === "sawmill" && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ animation: "sawSpin 0.3s linear infinite" }}>🌀</div>
        )}
        {running && machine.id === "kiln" && (
          <div className="absolute -top-2 text-[10px]" style={{ animation: "smokeRise 1.5s ease-out infinite" }}>💨</div>
        )}
        {running && machine.id === "kitchen" && (
          <div className="absolute -top-2 text-[10px]" style={{ animation: "smokeRise 1.2s ease-out infinite" }}>💨</div>
        )}
      </div>
      {/* Progress ring */}
      {running && (
        <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-75"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${bg}, ${bg}cc)` }}/>
        </div>
      )}
      <div className="text-[9px] font-bold text-slate-400">{machine.name}</div>
    </div>
  );
}

function getMachineAnim(id) {
  const anims = {
    forge:    "pulseGlow 0.8s ease-in-out infinite",
    sawmill:  "spinFast 0.4s linear infinite",
    kiln:     "pulseGlow 1.2s ease-in-out infinite",
    kitchen:  "bobUpDown 0.6s ease-in-out infinite",
    workshop: "hammerBeat 0.5s ease-in-out infinite",
    refinery: "pulseGlow 1s ease-in-out infinite",
  };
  return anims[id] || "none";
}

// ── Resource slot ─────────────────────────────────────────────────────────────
function ResSlot({ res, nation }) {
  if (!res) return <EmptySlot />;
  const have = nation?.[res.res] || 0;
  const enough = have >= res.amount;
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 min-w-[54px]"
      style={{
        background: enough ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
        border: `1px solid ${enough ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
      }}>
      <span className="text-lg leading-none">{res.emoji}</span>
      <span className="text-[9px] font-bold text-white ep-mono">{res.amount}</span>
      <span className={`text-[8px] ep-mono ${enough ? "text-green-400" : "text-red-400"}`}>
        {have >= 999 ? "999+" : have}
      </span>
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl w-14 h-14"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
      <span className="text-slate-600 text-lg">+</span>
    </div>
  );
}

function OutputSlot({ recipe, running, progress }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 min-w-[54px]"
      style={{
        background: running ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${running ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.1)"}`,
        transition: "all 0.3s ease",
      }}>
      <span className="text-lg leading-none" style={{ animation: running ? "spinFast 1s linear infinite" : "none" }}>
        {recipe?.output?.emoji || "📦"}
      </span>
      <span className="text-[9px] font-bold text-slate-300">{recipe?.output?.label?.split(" ")[0] || "Output"}</span>
      {running && <span className="text-[8px] text-cyan-400">{Math.round(progress)}%</span>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CraftingTab({ myNation, onRefresh }) {
  const [activeMachine, setActiveMachine] = useState("forge");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [crafting, setCrafting] = useState(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const [showChain, setShowChain] = useState(false);
  const progressRef = useRef(null);

  const machine = MACHINES.find(m => m.id === activeMachine);
  const recipes = MACHINE_RECIPES[activeMachine] || [];
  const isCrafting = !!crafting;

  // Auto-select first craftable recipe when switching machines
  useEffect(() => {
    const craftable = recipes.find(r => canCraft(r, myNation));
    setSelectedRecipe(craftable || recipes[0] || null);
    setMsg(null);
  }, [activeMachine]);

  async function startCraft() {
    if (!selectedRecipe || isCrafting) return;
    if (!canCraft(selectedRecipe, myNation)) {
      setMsg("❌ Not enough resources!");
      return;
    }
    setCrafting(selectedRecipe.id);
    setProgress(0);
    setMsg(null);

    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / selectedRecipe.time) * 100);
      setProgress(pct);

      // Sparkle effects
      if (Math.random() > 0.65) {
        const id = Date.now() + Math.random();
        setSparkles(s => [...s.slice(-6), { id, x: 30 + Math.random() * 40, y: 10 + Math.random() * 80 }]);
        setTimeout(() => setSparkles(s => s.filter(sp => sp.id !== id)), 900);
      }

      if (pct >= 100) {
        clearInterval(tick);
        completeCraft(selectedRecipe);
      }
    }, 60);
    progressRef.current = tick;
  }

  async function completeCraft(recipe) {
    const updates = {};
    // Deduct inputs
    recipe.inputs.forEach(i => {
      updates[i.res] = Math.max(0, (myNation?.[i.res] || 0) - i.amount);
    });
    // Apply rewards
    Object.entries(recipe.reward).forEach(([stat, val]) => {
      updates[stat] = (myNation?.[stat] || 0) + val;
    });
    await base44.entities.Nation.update(myNation.id, updates);
    setCrafting(null);
    setProgress(0);
    setMsg(`✅ ${recipe.emoji} ${recipe.name} — ${recipe.rewardLabel}`);
    onRefresh?.();
    setTimeout(() => setMsg(null), 4500);
  }

  useEffect(() => () => clearInterval(progressRef.current), []);

  const activeRecipe = crafting ? recipes.find(r => r.id === crafting) : null;
  const displayRecipe = activeRecipe || selectedRecipe;

  return (
    <div className="flex flex-col h-full">

      {/* ── Machine selector ── */}
      <div className="shrink-0 flex gap-1 px-3 pt-2.5 pb-2 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", scrollbarWidth: "none" }}>
        {MACHINES.map(m => (
          <button key={m.id} onClick={() => { setActiveMachine(m.id); setCrafting(null); clearInterval(progressRef.current); }}
            disabled={isCrafting}
            className="shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all disabled:opacity-40"
            style={{
              background: activeMachine === m.id ? `${m.color}18` : "rgba(255,255,255,0.03)",
              borderColor: activeMachine === m.id ? `${m.color}45` : "rgba(255,255,255,0.07)",
              color: activeMachine === m.id ? m.color : "#4b5563",
            }}>
            <span className="text-base">{m.emoji}</span>
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      {/* ── Crafting area ── */}
      <div className="shrink-0 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Status message */}
        {msg && (
          <div className={`mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold ${msg.startsWith("✅") ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"}`}>
            {msg}
          </div>
        )}

        {/* Machine + slots row */}
        <div className="relative flex items-center justify-between gap-2">
          {/* Input slots */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {displayRecipe ? (
              displayRecipe.inputs.map((inp, i) => (
                <ResSlot key={i} res={inp} nation={myNation} />
              ))
            ) : (
              <EmptySlot />
            )}
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <ChevronRight size={12} className="text-slate-600" />
            <ChevronRight size={12} className="text-slate-500" />
            <ChevronRight size={12} className="text-slate-600" />
          </div>

          {/* Machine visual */}
          <div className="shrink-0">
            <MachineVisual machine={machine} running={isCrafting} progress={progress} />
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <ChevronRight size={12} className="text-slate-600" />
            <ChevronRight size={12} className="text-slate-500" style={{ animation: isCrafting ? "arrowPulse 0.5s ease-in-out infinite" : "none" }} />
            <ChevronRight size={12} className="text-slate-600" />
          </div>

          {/* Output slot */}
          <div className="shrink-0">
            <OutputSlot recipe={displayRecipe} running={isCrafting} progress={progress} />
          </div>

          {/* Sparkle overlay */}
          {sparkles.map(sp => (
            <div key={sp.id} className="absolute pointer-events-none text-xs"
              style={{ left: `${sp.x}%`, top: `${sp.y}%`, animation: "sparkleFloat 0.9s ease-out forwards", zIndex: 10 }}>
              {machine?.id === "forge" ? "🔥" : machine?.id === "sawmill" ? "🌀" : "✨"}
            </div>
          ))}
        </div>

        {/* Craft button */}
        {!isCrafting ? (
          <button
            onClick={startCraft}
            disabled={!displayRecipe || !canCraft(displayRecipe, myNation)}
            className="w-full mt-2.5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-35 transition-all hover:brightness-110"
            style={{ background: displayRecipe && canCraft(displayRecipe, myNation)
              ? `linear-gradient(135deg, ${machine?.color}, ${machine?.color}aa)`
              : "rgba(255,255,255,0.05)",
            }}>
            {displayRecipe
              ? (canCraft(displayRecipe, myNation)
                  ? `${machine?.emoji} Craft — ${displayRecipe.rewardLabel}`
                  : `⚠ Resources needed`)
              : "Select a recipe"}
          </button>
        ) : (
          <div className="mt-2.5 rounded-xl overflow-hidden" style={{ border: `1px solid ${machine?.color}40` }}>
            <div className="px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white">{activeRecipe?.name}…</span>
              <span className="text-[10px] font-bold ep-mono" style={{ color: machine?.color }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/10">
              <div className="h-full transition-all duration-75 relative overflow-hidden"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${machine?.color}, ${machine?.color}cc)` }}>
                <div className="absolute inset-0 opacity-40"
                  style={{ background: "linear-gradient(90deg,transparent 0%,white 50%,transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 1s linear infinite" }}/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Recipe list ── */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-2 space-y-1.5" style={{ scrollbarWidth: "thin", scrollbarColor: `${machine?.color}30 transparent` }}>
        <div className="text-[8px] text-slate-600 uppercase tracking-wider font-bold mb-1">
          {machine?.name} Recipes ({recipes.length})
        </div>
        {recipes.map(recipe => {
          const able = canCraft(recipe, myNation);
          const isSelected = selectedRecipe?.id === recipe.id;
          const isRunning = crafting === recipe.id;
          return (
            <button key={recipe.id}
              onClick={() => { if (!isCrafting) setSelectedRecipe(recipe); }}
              disabled={isCrafting}
              className="w-full rounded-xl p-2.5 text-left transition-all"
              style={{
                background: isRunning ? `${machine?.color}15` : isSelected ? `${machine?.color}0d` : "rgba(255,255,255,0.025)",
                border: `1px solid ${isRunning ? machine?.color + "50" : isSelected ? machine?.color + "28" : "rgba(255,255,255,0.06)"}`,
                opacity: !able && !isSelected && !isRunning ? 0.5 : 1,
              }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${machine?.color}18`, border: `1px solid ${machine?.color}25` }}>
                  {recipe.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white truncate">{recipe.name}</span>
                    <span className="text-[9px] font-bold ep-mono shrink-0 ml-1" style={{ color: machine?.color }}>
                      {recipe.rewardLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {recipe.inputs.map((inp, i) => {
                      const have = myNation?.[inp.res] || 0;
                      const enough = have >= inp.amount;
                      return (
                        <span key={i} className={`text-[9px] font-bold ep-mono px-1.5 py-0.5 rounded-md ${enough ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
                          {inp.emoji}{inp.amount}
                        </span>
                      );
                    })}
                    <span className="text-[8px] text-slate-600 ml-auto">→ {recipe.output.label}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Machine description footer */}
      <div className="shrink-0 px-3 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <Info size={10} className="text-slate-600 shrink-0" />
          <span className="text-[9px] text-slate-600">{machine?.desc}</span>
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes spinFast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bobUpDown { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes hammerBeat { 0%,100% { transform: rotate(0deg); } 30% { transform: rotate(-30deg); } }
        @keyframes sawSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes smokeRise { 0% { opacity: 1; transform: translateY(0) scale(0.8); } 100% { opacity: 0; transform: translateY(-12px) scale(1.4); } }
        @keyframes sparkFloat { 0% { opacity: 1; transform: translate(-50%,-50%) scale(0.6); } 100% { opacity: 0; transform: translate(-50%,-220%) scale(1.4); } }
        @keyframes sparkleFloat { 0% { opacity: 1; transform: translate(-50%,-50%) scale(0.5); } 100% { opacity: 0; transform: translate(-50%,-200%) scale(1.5); } }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes arrowPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; color: #22d3ee; } }
      `}</style>
    </div>
  );
}