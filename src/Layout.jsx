export default function Layout({ children, currentPageName }) {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #080c14; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.1); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; cursor: pointer; }
        select option { background: #0f172a; color: white; }
      `}</style>
      {children}
    </div>
  );
}