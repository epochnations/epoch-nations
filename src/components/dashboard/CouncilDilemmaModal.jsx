import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Building2, Lightbulb, Shield, X } from "lucide-react";

const SOURCE_CONFIG = {
  citizen:  { icon: Users,      color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  label: "THE PEOPLE"   },
  company:  { icon: Building2,  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  label: "CORP LOBBY"   },
  advisor:  { icon: Lightbulb,  color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   label: "ROYAL ADVISOR" },
  ally:     { icon: Shield,     color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", label: "ALLIED STATE"  },
};

export default function CouncilDilemmaModal({ dilemma, nation, onClose, onRefresh }) {
  const [choosing, setChoosing] = useState(null);
  const [toast, setToast] = useState(null);

  if (!dilemma) return null;

  const cfg = SOURCE_CONFIG[dilemma.source] || SOURCE_CONFIG.advisor;
  const Icon = cfg.icon;

  async function choose(option) {
    setChoosing(option);

    // Apply stat effects based on option
    const effects = option === "a"
      ? parseEffect(dilemma.option_a_effect)
      : parseEffect(dilemma.option_b_effect);

    const updates = {};
    if (effects.stability)   updates.stability   = Math.min(100, Math.max(0, (nation.stability || 75) + effects.stability));
    if (effects.gdp)         updates.gdp         = Math.max(100, (nation.gdp || 1000) + effects.gdp);
    if (effects.currency)    updates.currency    = Math.max(0, (nation.currency || 5000) + effects.currency);
    if (effects.public_trust) updates.public_trust = Math.min(2.0, Math.max(0, (nation.public_trust || 1.0) + effects.public_trust));
    if (effects.unit_power)  updates.unit_power  = Math.max(0, (nation.unit_power || 50) + effects.unit_power);

    if (Object.keys(updates).length > 0) {
      await base44.entities.Nation.update(nation.id, updates);
    }

    const label = option === "a" ? dilemma.option_a_label : dilemma.option_b_label;
    const reactionText = buildReaction(dilemma.source, option);

    await base44.entities.CouncilDilemma.update(dilemma.id, {
      chosen: option,
      is_resolved: true,
      reaction_toast: reactionText
    });

    // Post live news flash
    await base44.entities.NewsArticle.create({
      headline: `${nation.name}: "${label}" — Dilemma Resolved`,
      body: `${nation.flag_emoji} ${nation.name} has responded to a ${dilemma.source} council dilemma. ${reactionText}`,
      category: "policy",
      tier: "standard",
      nation_name: nation.name,
      nation_flag: nation.flag_emoji,
      nation_color: nation.flag_color
    });

    setToast(reactionText);
    setChoosing(null);

    setTimeout(() => {
      onRefresh?.();
      onClose();
    }, 2500);
  }

  function parseEffect(effectStr) {
    if (!effectStr) return {};
    const map = {};
    const parts = (effectStr || "").split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      const match = trimmed.match(/([a-z_]+)\s*([+-]\d+\.?\d*)/i);
      if (match) {
        map[match[1]] = parseFloat(match[2]);
      }
    }
    return map;
  }

  function buildReaction(source, option) {
    const positive = option === "a";
    const reactions = {
      citizen:  positive ? "The streets are alive with celebration. Approval ratings surge!" : "Protests erupt in the capital. The people are restless.",
      company:  positive ? "Markets respond positively. Corporate confidence is high."        : "Business leaders warn of declining investment.",
      advisor:  positive ? "The council nods in approval. A wise decision, Commander."        : "Your advisor looks troubled. The road ahead may be harder.",
      ally:     positive ? "Your ally sends warm regards. The alliance strengthens."          : "Diplomatic cables flood in. Your ally is displeased.",
    };
    return reactions[source] || "The nation watches and waits.";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md backdrop-blur-2xl bg-[#0d1424]/95 border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-white/10 flex items-center justify-between ${cfg.bg}`}>
          <div className="flex items-center gap-2">
            <Icon size={16} className={cfg.color} />
            <span className={`text-xs font-bold tracking-widest ${cfg.color}`}>{cfg.label} SPEAKS</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white leading-snug mb-2">{dilemma.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{dilemma.body}</p>
          </div>

          {/* Reaction toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-4 text-cyan-300 text-sm font-medium text-center"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {!toast && (
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => choose("a")}
                disabled={!!choosing}
                className={`text-left p-4 rounded-xl border transition-all min-h-[44px] ${cfg.border} ${cfg.bg} hover:brightness-125 disabled:opacity-50`}
              >
                <div className={`text-xs font-bold mb-1 ${cfg.color}`}>OPTION A</div>
                <div className="text-white font-bold text-sm">{dilemma.option_a_label}</div>
                <div className="text-slate-500 text-xs mt-1">{dilemma.option_a_effect}</div>
              </button>
              <button
                onClick={() => choose("b")}
                disabled={!!choosing}
                className="text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all min-h-[44px] disabled:opacity-50"
              >
                <div className="text-xs font-bold text-slate-500 mb-1">OPTION B</div>
                <div className="text-white font-bold text-sm">{dilemma.option_b_label}</div>
                <div className="text-slate-500 text-xs mt-1">{dilemma.option_b_effect}</div>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}