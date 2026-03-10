import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { EPOCH_EMOJI, EPOCH_COLOR, EPOCH_UNLOCKS } from "./EpochConfig";

/**
 * EpochCelebration — full-screen confetti + announcement modal
 * Shown when a player advances to a new epoch.
 */
export default function EpochCelebration({ newEpoch, nation, onClose }) {
  useEffect(() => {
    if (!newEpoch) return;

    // Fire confetti from both sides
    const colors = ["#22d3ee", "#818cf8", "#a78bfa", "#fbbf24", "#34d399", "#f472b6"];

    function side(originX) {
      confetti({
        particleCount: 120,
        spread: 70,
        angle: originX > 0.5 ? 120 : 60,
        origin: { x: originX, y: 0.85 },
        colors,
        gravity: 0.9,
        scalar: 1.1,
        drift: originX > 0.5 ? -0.5 : 0.5,
      });
    }

    side(0.0);
    side(1.0);
    setTimeout(() => { side(0.05); side(0.95); }, 200);
    setTimeout(() => { side(0.0);  side(1.0);  }, 450);
    setTimeout(() => { side(0.0);  side(1.0);  }, 800);

    // Auto-close after 8s
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [newEpoch]);

  if (!newEpoch) return null;

  const color  = EPOCH_COLOR[newEpoch]  || "#22d3ee";
  const emoji  = EPOCH_EMOJI[newEpoch]  || "🚀";
  const unlocks = EPOCH_UNLOCKS[newEpoch] || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(135deg, rgba(4,8,16,0.98) 0%, ${color}18 100%)`,
            border: `1px solid ${color}60`,
          }}
        >
          {/* Animated top glow */}
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

          <div className="p-8 text-center">
            {/* Big epoch emoji */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="text-7xl mb-4 leading-none"
            >
              {emoji}
            </motion.div>

            <div className="text-xs text-slate-500 uppercase tracking-[0.3em] ep-mono mb-2">
              Civilization Advancement
            </div>

            <div className="text-4xl font-black tracking-tighter mb-1"
              style={{ background: `linear-gradient(90deg, ${color}, #818cf8)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {newEpoch}
            </div>

            <div className="text-slate-400 text-sm mb-6">
              <span style={{ color }}>{nation?.name}</span> has entered a new era of civilization!
            </div>

            {/* What's unlocked */}
            {unlocks.length > 0 && (
              <div className="rounded-2xl p-4 mb-6 text-left"
                style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                <div className="text-xs uppercase tracking-widest mb-3" style={{ color }}>
                  Now Unlocked
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {unlocks.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                      {u}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${color}cc, ${color}88)` }}
              >
                Continue Building 🚀
              </button>
            </div>

            <div className="text-[10px] text-slate-600 mt-3">
              Tap anywhere or wait 8 seconds to continue
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}