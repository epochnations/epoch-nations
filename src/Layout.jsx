export default function Layout({ children, currentPageName }) {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #040810; }

        /* ── Scrollbars ── */
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.2); border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.4); }

        /* ── Range inputs ── */
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.08); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #22d3ee; cursor: pointer; box-shadow: 0 0 8px rgba(34,211,238,0.5); }

        /* ── Selects ── */
        select option { background: #0a0f1e; color: white; }

        /* ── Animations ── */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease both; }

        @keyframes ep-glow-border {
          0%,100% { border-color: rgba(6,182,212,0.2); box-shadow: 0 0 0 0 rgba(6,182,212,0); }
          50% { border-color: rgba(6,182,212,0.5); box-shadow: 0 0 16px 2px rgba(6,182,212,0.1); }
        }
        .ep-glow-anim { animation: ep-glow-border 4s ease-in-out infinite; }

        @keyframes ep-live-pulse {
          0%,100% { opacity: 1; box-shadow: 0 0 6px 2px rgba(74,222,128,0.5); }
          50% { opacity: 0.5; box-shadow: 0 0 2px 1px rgba(74,222,128,0.2); }
        }
        .ep-live-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: #4ade80; animation: ep-live-pulse 1.8s ease-in-out infinite;
        }

        /* ── Mono font ── */
        .ep-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }

        /* ── Grid backgrounds ── */
        .ep-grid-bg {
          background-image: linear-gradient(rgba(6,182,212,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* ── Card styles ── */
        .ep-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border-radius: 16px;
        }

        /* ── Glowing text ── */
        .ep-glow-cyan { text-shadow: 0 0 20px rgba(6,182,212,0.55), 0 0 40px rgba(6,182,212,0.2); }
        .ep-glow-violet { text-shadow: 0 0 20px rgba(139,92,246,0.55), 0 0 40px rgba(139,92,246,0.2); }

        /* ── Stat number flashing ── */
        @keyframes ep-flash-up {
          0%,100% { color: inherit; text-shadow: none; }
          25% { color: #4ade80; text-shadow: 0 0 14px rgba(74,222,128,0.8); }
        }
        @keyframes ep-flash-down {
          0%,100% { color: inherit; text-shadow: none; }
          25% { color: #f87171; text-shadow: 0 0 14px rgba(248,113,113,0.8); }
        }
        .ep-stat-up   { animation: ep-flash-up   1.4s ease both; }
        .ep-stat-down { animation: ep-flash-down 1.4s ease both; }

        /* ── Button hover lift ── */
        .ep-btn-lift { transition: transform 0.15s ease, filter 0.15s ease; }
        .ep-btn-lift:hover { transform: translateY(-1px); filter: brightness(1.12); }
        .ep-btn-lift:active { transform: translateY(0); }
      `}</style>
      {children}
    </div>
  );
}