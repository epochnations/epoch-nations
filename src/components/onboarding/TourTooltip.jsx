import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Zap, MapPin } from "lucide-react";

const STEPS = [
  {
    title: "Welcome, Commander 🌍",
    body: "You've just founded a nation in Epoch Nations — a real-time grand strategy civilization simulator. Every decision ripples across the world. Let's take a quick tour!",
    icon: "🌍",
    tip: "You can skip this tutorial at any time and replay it later from the Dashboard.",
  },
  {
    title: "Your Nation Stats 📊",
    body: "The left panel shows your live nation stats: GDP, Stability, Public Trust, and Treasury. These update every 60 seconds as your economy runs in real time.",
    icon: "📊",
    tip: "Glowing numbers mean your stats just changed — green is good, red means trouble.",
  },
  {
    title: "Resources & Workers 👷",
    body: "Click Workers in the top bar to assign citizens as Farmers, Lumberjacks, Miners, and Researchers. Workers generate resources every tick. No workers = no production.",
    icon: "🌾",
    tip: "Always keep Farmers assigned first — food shortage causes population to decline!",
  },
  {
    title: "Economy & Tax 💰",
    body: "Open Manage to set tax rates and spending. Your GDP grows from manufacturing, trade, and population. Inflation rises if you print money faster than you produce goods.",
    icon: "💰",
    tip: "Income tax raises revenue but lowers public trust. Balance carefully.",
  },
  {
    title: "Construction Hub 🏗️",
    body: "Build structures in the Construction Hub. Each building provides lasting bonuses — Farms grow food, Schools generate Tech Points, Banks unlock loans and bonds.",
    icon: "🏗️",
    tip: "Build a Granary early to boost food storage. A School is essential for advancing epochs.",
  },
  {
    title: "World Map & Diplomacy 🗺️",
    body: "The center map shows all nations on the globe. Click any nation to view their stats, declare war, offer trade, or form alliances. Your hex tiles are your territory.",
    icon: "🗺️",
    tip: "Allies share resources and defend each other in war. Diplomacy is your first line of defense.",
  },
  {
    title: "Tech Tree & Epochs ⚙️",
    body: "Spend Tech Points in the Tech Tree to unlock upgrades. Once you meet all requirements, click Advance Epoch to enter a new era — Bronze Age, Classical Age, and beyond.",
    icon: "⚙️",
    tip: "Each new epoch unlocks new buildings, units, mechanics, and economic systems.",
  },
  {
    title: "Global Chat & News 🌐",
    body: "Chat live with other civilizations in the World Chat. Read breaking news in Global Chronicles. Every war, tech advance, and economic crash gets posted there in real time.",
    icon: "💬",
    tip: "Use /trade @Nation, /ally @Nation and /war @Nation commands directly in chat!",
  },
];

export default function TourTooltip({ step, onNext, onPrev, onSkip }) {
  const current = STEPS[step];
  if (!current) return null;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4 pointer-events-auto"
      >
        <div className="backdrop-blur-2xl bg-[#0d1424]/95 border border-cyan-400/30 rounded-2xl p-5 shadow-2xl shadow-cyan-400/10">
          {/* Progress bar */}
          <div className="flex gap-1 mb-4">
            {STEPS.map((_, i) => (
              <div key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === step ? "flex-[3] bg-cyan-400" : i < step ? "flex-1 bg-cyan-400/40" : "flex-1 bg-white/10"}`}
              />
            ))}
          </div>

          {/* Step counter */}
          <div className="text-[10px] text-slate-500 ep-mono mb-3 uppercase tracking-widest">
            Step {step + 1} of {STEPS.length}
          </div>

          {/* Content */}
          <div className="flex items-start gap-3 mb-3">
            <div className="text-2xl leading-none mt-0.5 shrink-0">{current.icon}</div>
            <div>
              <div className="font-bold text-white text-sm mb-1.5">{current.title}</div>
              <div className="text-slate-300 text-xs leading-relaxed">{current.body}</div>
            </div>
          </div>

          {/* Tip */}
          {current.tip && (
            <div className="rounded-xl bg-amber-400/5 border border-amber-400/20 px-3 py-2 mb-4 flex items-start gap-2">
              <span className="text-amber-400 text-xs shrink-0 mt-0.5">💡</span>
              <div className="text-xs text-amber-300/80 leading-relaxed">{current.tip}</div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onSkip}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors px-2 py-1 min-h-[36px]"
            >
              Skip Tutorial
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5 transition-all min-h-[40px]"
                >
                  <ChevronLeft size={12} /> Back
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all min-h-[40px]"
              >
                {isLast ? (
                  <><Zap size={12} /> Start Playing!</>
                ) : (
                  <>Next <ChevronRight size={12} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}