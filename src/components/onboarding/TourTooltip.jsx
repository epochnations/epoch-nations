import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Zap } from "lucide-react";

const STEPS = [
  {
    title: "Welcome, Commander",
    body: "You've just founded a nation. This is your Command Center — a real-time geopolitical sim where every decision ripples across the world.",
    icon: "🌍",
    target: "header"
  },
  {
    title: "Your Nation Stats",
    body: "GDP, Stability, Public Trust and Currency update every 60 seconds. Watch for glowing numbers — they signal live market shifts.",
    icon: "📊",
    target: "stats"
  },
  {
    title: "The Stock Exchange",
    body: "Buy and sell stocks in other nations. Prices fluctuate in real-time. A crash is dangerous — but also an opportunity.",
    icon: "📈",
    target: "stocks"
  },
  {
    title: "Tech Tree & Epochs",
    body: "Spend Tech Points to unlock powerful upgrades. Advance from Industrial → Information → Nano Age for massive bonuses.",
    icon: "⚙️",
    target: "tech"
  },
  {
    title: "Council Dilemmas",
    body: "Every 15–30 minutes, your citizens, advisors, allies or corporations will bring you a choice. Your decision posts live to the Global Chronicles.",
    icon: "🗳️",
    target: "dilemma"
  }
];

export default function TourTooltip({ step, onNext, onPrev, onSkip }) {
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4"
      >
        <div className="backdrop-blur-2xl bg-[#0d1424]/90 border border-cyan-400/30 rounded-2xl p-5 shadow-2xl shadow-cyan-400/10">
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-cyan-400" : "w-2 bg-white/20"}`} />
            ))}
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="text-2xl leading-none mt-0.5">{current.icon}</div>
            <div>
              <div className="font-bold text-white text-sm mb-1">{current.title}</div>
              <div className="text-slate-400 text-xs leading-relaxed">{current.body}</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onSkip}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors px-2 py-1"
            >
              Skip Tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5 transition-all min-h-[44px]"
                >
                  <ChevronLeft size={12} /> Back
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all min-h-[44px]"
              >
                {isLast ? (
                  <><Zap size={12} /> Command Now</>
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