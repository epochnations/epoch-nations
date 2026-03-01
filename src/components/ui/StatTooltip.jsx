import { useState } from "react";
import { Info } from "lucide-react";

export default function StatTooltip({ text }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1 align-middle">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onTouchStart={() => setShow(v => !v)}
        className="text-slate-600 hover:text-slate-400 transition-colors focus:outline-none"
        tabIndex={-1}
      >
        <Info size={11} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 bg-[#0d1424] border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-xl pointer-events-none leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0d1424]" />
        </div>
      )}
    </span>
  );
}