import ThemeProvider from "./components/theme/ThemeProvider";

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: var(--theme-bg, #080c14);
          color: var(--theme-text, #e2e8f0);
          transition: background 3s ease-in-out, color 3s ease-in-out;
        }
        :root {
          --theme-bg: #080c14;
          --theme-panel: #0a1120;
          --theme-border: rgba(255,255,255,0.07);
          --theme-text: #e2e8f0;
          --theme-muted: #64748b;
          --theme-glow: rgba(30,60,180,0.25);
          --theme-overlay: rgba(10,20,60,0.55);
          --theme-accent: #22d3ee;
          --theme-grid: rgba(0,200,255,0.02);
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.1); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; cursor: pointer; }
        select option { background: #0f172a; color: white; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.25s ease both; }

        /* Global theme-aware utility classes */
        .theme-bg      { background: var(--theme-bg) !important; }
        .theme-panel   { background: var(--theme-panel) !important; }
        .theme-border  { border-color: var(--theme-border) !important; }
        .theme-text    { color: var(--theme-text) !important; }
        .theme-muted   { color: var(--theme-muted) !important; }

        /* Realistic mode: smooth CSS transitions on all theme variables */
        .epoch-realistic *,
        .epoch-realistic *::before,
        .epoch-realistic *::after {
          transition:
            background-color 3s ease-in-out,
            border-color 3s ease-in-out,
            color 3s ease-in-out,
            box-shadow 3s ease-in-out !important;
        }
      `}</style>
      {children}
    </ThemeProvider>
  );
}