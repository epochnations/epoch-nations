import { X } from "lucide-react";
import NationalAdvisorPanel from "../dashboard/NationalAdvisorPanel";

export default function NationalAdvisorModal({ nation, onClose }) {
  if (!nation) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          height: "80vh",
          background: "linear-gradient(160deg, rgba(139,92,246,0.08) 0%, rgba(4,8,16,0.98) 60%)",
          border: "1px solid rgba(139,92,246,0.25)",
          backdropFilter: "blur(24px)",
        }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: "rgba(139,92,246,0.15)", background: "linear-gradient(90deg, rgba(139,92,246,0.1) 0%, transparent 100%)" }}>
          <span className="text-lg">🧠</span>
          <span className="font-black text-white text-sm tracking-wide">National Advisor</span>
          <span className="text-xs text-slate-500 ep-mono">{nation.name}</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden p-0">
          <NationalAdvisorPanel nation={nation} />
        </div>
      </div>
    </div>
  );
}