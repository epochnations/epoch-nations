import { motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { DEEP_DIVES } from "./deepDiveData";

export default function DeepDivePanel({ deepDiveKey, sectionColor, onClose }) {
  const dd = DEEP_DIVES[deepDiveKey];
  if (!dd) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="mt-4 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${sectionColor}30`, background: `${sectionColor}06` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: `${sectionColor}20`, background: `${sectionColor}10` }}>
        <div className="flex items-center gap-2">
          <ExternalLink size={12} style={{ color: sectionColor }} />
          <span className="text-xs font-black text-white">{dd.title}</span>
        </div>
        <button onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
          <X size={12} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Screenshot mockup */}
        {dd.screenshot && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-3 py-1.5 text-[10px] font-bold ep-mono text-slate-500 border-b"
              style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.06)" }}>
              📸 {dd.screenshot.label}
            </div>
            <div className="p-3" style={{ background: "rgba(0,0,0,0.3)" }}>
              <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">{dd.screenshot.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {dd.screenshot.visual.map((item, i) => (
                  item === "→" || item === "=" || item === "+" ? (
                    <span key={i} className="text-slate-600 text-[10px] self-center">{item}</span>
                  ) : (
                    <span key={i} className="px-2 py-1 rounded-lg text-[10px] ep-mono font-bold"
                      style={{ background: `${sectionColor}12`, color: sectionColor, border: `1px solid ${sectionColor}25` }}>
                      {item}
                    </span>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="space-y-1">
          {dd.content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return <div key={i} className="text-xs font-black text-white mt-3 mb-1">{line.replace(/\*\*/g, '')}</div>;
            }
            if (line.startsWith('| ')) {
              const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
              if (line.includes('---|')) return null;
              return (
                <div key={i} className="flex gap-0 text-[10px] ep-mono border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {cells.map((cell, ci) => (
                    <div key={ci} className="flex-1 px-2 py-1 text-slate-300" style={{ minWidth: 0 }}>
                      {cell}
                    </div>
                  ))}
                </div>
              );
            }
            if (line.startsWith('- ') || line.startsWith('• ')) {
              return (
                <div key={i} className="text-[11px] text-slate-300 leading-relaxed flex gap-1.5">
                  <span className="text-slate-600 shrink-0">•</span>
                  <span>{line.replace(/^[-•]\s*/, '')}</span>
                </div>
              );
            }
            if (line.trim() === '') return <div key={i} className="h-1" />;
            return <p key={i} className="text-[11px] text-slate-300 leading-relaxed">{line}</p>;
          })}
        </div>

        {/* Extra tips */}
        {dd.tips?.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-black text-amber-400/70 ep-mono uppercase tracking-widest">Pro Tips</div>
            {dd.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)" }}>
                <span className="text-amber-400 text-sm shrink-0">💡</span>
                <span className="text-[11px] text-amber-200/80 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}