import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, BookOpen, Search, ChevronDown, ChevronUp } from "lucide-react";
import { SECTIONS, READ_MORE } from "./tutorialData";

// ── Simple inline markdown renderer ──────────────────────────────────────────
function RenderContent({ content }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Table divider rows
        if (line.match(/^\|[-\s|]+\|?$/)) return null;
        // Table data rows
        if (line.startsWith('|')) {
          const cells = line.split('|').filter(c => c.trim());
          if (!cells.length) return null;
          const isHeader = lines[i + 1]?.match(/^\|[-\s|]+\|?$/);
          return (
            <div key={i} className="flex gap-1">
              {cells.map((cell, j) => (
                <div key={j} className={`flex-1 px-2 py-0.5 rounded text-[10px] ep-mono ${isHeader ? 'font-bold text-cyan-300 bg-cyan-900/20' : 'text-slate-400 bg-white/[0.02]'}`}>
                  {cell.trim()}
                </div>
              ))}
            </div>
          );
        }
        // Code block markers
        if (line.startsWith('```')) return null;
        // Headings (bold-only lines)
        if (line.match(/^\*\*[^*]+\*\*$/) || (line.startsWith('**') && line.endsWith('**') && !line.slice(2,-2).includes('**'))) {
          return <div key={i} className="font-bold text-white text-xs mt-2">{line.replace(/\*\*/g, '')}</div>;
        }
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const text = line.replace(/^[-•] /, '');
          return (
            <div key={i} className="flex gap-2 text-[11px]">
              <span className="text-cyan-500 mt-0.5 shrink-0">▸</span>
              <span className="text-slate-300" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white">$1</strong>').replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-family:monospace;font-size:10px">$1</code>') }} />
            </div>
          );
        }
        // Numbered list
        if (line.match(/^\d+\. /)) {
          const [num, ...rest] = line.split('. ');
          return (
            <div key={i} className="flex gap-2 text-[11px]">
              <span className="text-cyan-400 ep-mono shrink-0">{num}.</span>
              <span className="text-slate-300" dangerouslySetInnerHTML={{ __html: rest.join('. ').replace(/\*\*(.*?)\*\*/g, '<strong style="color:white">$1</strong>') }} />
            </div>
          );
        }
        // Regular paragraph
        return (
          <p key={i} className="text-slate-300 text-[11px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white">$1</strong>').replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-family:monospace;font-size:10px">$1</code>') }} />
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdvancedTutorial({ onClose }) {
  const [activeSection, setActiveSection] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("home");
  const [expandedReadMore, setExpandedReadMore] = useState(false);

  const section = SECTIONS[activeSection];
  const step = section?.steps[activeStep];
  const totalSteps = section?.steps.length || 0;
  const readMoreKey = `${section?.id}-${activeStep}`;
  const readMore = READ_MORE[readMoreKey];

  const filteredSections = searchQuery
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.steps.some(st => st.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : SECTIONS;

  function openSection(idx) {
    setActiveSection(idx);
    setActiveStep(0);
    setView("section");
    setSearchQuery("");
    setExpandedReadMore(false);
  }

  function nextStep() {
    setExpandedReadMore(false);
    if (activeStep < totalSteps - 1) setActiveStep(s => s + 1);
    else setView("home");
  }

  function prevStep() {
    setExpandedReadMore(false);
    if (activeStep > 0) setActiveStep(s => s - 1);
    else setView("home");
  }

  function goToStep(i) {
    setExpandedReadMore(false);
    setActiveStep(i);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d1424 0%, #040810 100%)", border: "1px solid rgba(34,211,238,0.2)", boxShadow: "0 0 80px rgba(34,211,238,0.08)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-3">
            {view === "section" && (
              <button onClick={() => setView("home")}
                className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <ChevronLeft size={16} />
              </button>
            )}
            <BookOpen size={16} className="text-cyan-400" />
            <div>
              <div className="font-black text-white text-sm">Epoch Nations — Advanced Tutorial</div>
              {view === "section"
                ? <div className="text-[10px] text-slate-500 ep-mono">{section.title} · Step {activeStep + 1} of {totalSteps}</div>
                : <div className="text-[10px] text-slate-500 ep-mono">{SECTIONS.length} topics · Full game guide</div>}
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div key="home" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="px-6 pt-5 pb-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Search size={13} className="text-slate-500 shrink-0" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search topics…"
                      className="bg-transparent text-white text-xs outline-none flex-1 placeholder-slate-600" />
                  </div>
                </div>
                <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSections.map((sec) => {
                    const realIdx = SECTIONS.indexOf(sec);
                    return (
                      <button key={sec.id} onClick={() => openSection(realIdx)}
                        className="text-left p-4 rounded-2xl transition-all hover:scale-[1.02] group"
                        style={{ background: `${sec.color}07`, border: `1px solid ${sec.color}20` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{sec.icon}</span>
                          <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">{sec.title}</div>
                        </div>
                        <div className="text-[11px] text-slate-400 leading-relaxed mb-2">{sec.summary}</div>
                        <div className="text-[10px] ep-mono" style={{ color: sec.color }}>{sec.steps.length} lessons →</div>
                      </button>
                    );
                  })}
                  {filteredSections.length === 0 && (
                    <div className="col-span-2 text-center text-slate-600 text-sm py-8">No topics match your search.</div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key={`${activeSection}-${activeStep}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-6">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${section.color}18`, border: `1px solid ${section.color}30` }}>
                    {section.icon}
                  </div>
                  <div>
                    <div className="font-black text-white text-base">{section.title}</div>
                    <div className="text-xs text-slate-500">{section.summary}</div>
                  </div>
                </div>

                {/* Step progress dots */}
                <div className="flex gap-1 mb-5">
                  {section.steps.map((_, i) => (
                    <button key={i} onClick={() => goToStep(i)}
                      className="h-1.5 rounded-full transition-all duration-300 flex-1"
                      style={{ background: i === activeStep ? section.color : i < activeStep ? section.color + "50" : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>

                {/* Step content */}
                <div className="rounded-2xl p-5 mb-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="font-bold text-white text-sm mb-3">{step.title}</div>
                  <div className="text-slate-300 text-xs leading-relaxed">{step.body}</div>
                </div>

                {/* Tip */}
                {step.tip && (
                  <div className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2"
                    style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <span className="text-amber-400 text-sm shrink-0">💡</span>
                    <div className="text-xs text-amber-200/80 leading-relaxed">{step.tip}</div>
                  </div>
                )}

                {/* Read More expandable */}
                {readMore && (
                  <div className="mb-4 rounded-2xl overflow-hidden"
                    style={{ border: "1px solid rgba(34,211,238,0.15)" }}>
                    <button
                      onClick={() => setExpandedReadMore(x => !x)}
                      className="w-full flex items-center justify-between px-4 py-3 transition-all"
                      style={{ background: expandedReadMore ? "rgba(34,211,238,0.08)" : "rgba(34,211,238,0.04)" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📖</span>
                        <span className="text-xs font-bold text-cyan-300">Read More: {readMore.label}</span>
                      </div>
                      {expandedReadMore
                        ? <ChevronUp size={14} className="text-cyan-500" />
                        : <ChevronDown size={14} className="text-cyan-500" />}
                    </button>

                    <AnimatePresence>
                      {expandedReadMore && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: "hidden" }}>
                          <div className="px-4 pb-4 pt-2" style={{ background: "rgba(0,0,0,0.3)" }}>

                            {/* Screenshot */}
                            {readMore.screenshot && (
                              <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                                <img src={readMore.screenshot} alt={readMore.screenshotAlt}
                                  className="w-full h-36 object-cover"
                                  style={{ filter: "brightness(0.7) saturate(0.75)" }} />
                                {readMore.screenshotAlt && (
                                  <div className="px-3 py-1.5 text-[10px] text-slate-500 ep-mono"
                                    style={{ background: "rgba(0,0,0,0.5)" }}>
                                    📷 {readMore.screenshotAlt}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Content */}
                            <div className="mb-3">
                              <RenderContent content={readMore.content} />
                            </div>

                            {/* Extra tips */}
                            {readMore.tips?.length > 0 && (
                              <div className="space-y-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                {readMore.tips.map((tip, i) => (
                                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl"
                                    style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
                                    <span className="text-amber-400 text-xs shrink-0">💡</span>
                                    <div className="text-[11px] text-amber-200/75 leading-relaxed">{tip}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Step list */}
                <div className="mt-4 space-y-1">
                  {section.steps.map((s, i) => (
                    <button key={i} onClick={() => goToStep(i)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs"
                      style={{
                        background: i === activeStep ? `${section.color}12` : "transparent",
                        color: i === activeStep ? section.color : i < activeStep ? "#64748b" : "#475569",
                        border: `1px solid ${i === activeStep ? section.color + "30" : "transparent"}`
                      }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                        style={{ background: i < activeStep ? section.color + "30" : i === activeStep ? section.color : "rgba(255,255,255,0.06)", color: i <= activeStep ? section.color : "#475569" }}>
                        {i < activeStep ? "✓" : i + 1}
                      </span>
                      {s.title}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {view === "section" && (
          <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
            <button onClick={prevStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5 transition-all min-h-[40px]">
              <ChevronLeft size={12} /> {activeStep === 0 ? "All Topics" : "Back"}
            </button>
            <span className="text-[10px] text-slate-600 ep-mono">{activeStep + 1} / {totalSteps}</span>
            <button onClick={nextStep}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all min-h-[40px]"
              style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}99)` }}>
              {activeStep === totalSteps - 1 ? "✓ Done" : <>Next <ChevronRight size={12} /></>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}