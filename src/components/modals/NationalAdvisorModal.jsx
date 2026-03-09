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
        {/* Content */}
        <div className="flex-1 overflow-hidden p-0">
          <NationalAdvisorPanel nation={nation} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}