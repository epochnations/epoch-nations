import { useState } from "react";
import { X, Swords, Package, TrendingUp } from "lucide-react";
import WarModal from "./WarModal";
import LendLeaseModal from "./LendLeaseModal";

const EPOCH_COLORS = {
  Industrial: "from-amber-500 to-orange-600",
  Information: "from-cyan-500 to-blue-600",
  Nano: "from-violet-500 to-purple-600"
};

export default function NationModal({ nation, myNation, onClose, onRefresh }) {
  const [subModal, setSubModal] = useState(null);

  if (!nation) return null;
  if (subModal === "war") return <WarModal targetNation={nation} myNation={myNation} onClose={() => { setSubModal(null); onClose(); }} onRefresh={onRefresh} />;
  if (subModal === "aid") return <LendLeaseModal targetNation={nation} myNation={myNation} onClose={() => { setSubModal(null); onClose(); }} onRefresh={onRefresh} />;

  const isMe = myNation?.id === nation.id;
  const isAlly = myNation?.allies?.includes(nation.id);
  const isEnemy = myNation?.at_war_with?.includes(nation.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: (nation.flag_color || "#3b82f6") + "33" }}>
            {nation.flag_emoji}
          </div>
          <div className="flex-1">
            <div className="font-black text-xl text-white">{nation.name}</div>
            <div className="text-sm text-slate-400">{nation.leader}</div>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${EPOCH_COLORS[nation.epoch]} text-white`}>
              {nation.epoch} Epoch
            </span>
          </div>
          <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-white" /></button>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-2 gap-3">
          {[
            ["GDP", Math.round(nation.gdp || 0), "text-cyan-400"],
            ["Treasury", Math.round(nation.currency || 0) + " cr", "text-green-400"],
            ["Stability", Math.round(nation.stability || 0) + "%", "text-blue-400"],
            ["Tech Lvl", nation.tech_level || 1, "text-yellow-400"],
            ["Unit Power", Math.round(nation.unit_power || 0), "text-red-400"],
            ["Defense", Math.round(nation.defense_level || 0), "text-violet-400"],
          ].map(([label, val, color]) => (
            <div key={label} className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-slate-500">{label}</div>
              <div className={`font-bold font-mono text-sm mt-1 ${color}`}>{val}</div>
            </div>
          ))}
        </div>

        {/* Relations badge */}
        {!isMe && (
          <div className="px-6 pb-2">
            <div className={`text-xs font-bold px-3 py-2 rounded-xl text-center ${isEnemy ? "bg-red-500/20 text-red-400" : isAlly ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-400"}`}>
              {isEnemy ? "⚔ Currently At War" : isAlly ? "🤝 Allied Nation" : "Neutral Relations"}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isMe && (
          <div className="px-6 pb-6 pt-2 flex gap-3">
            <button
              onClick={() => setSubModal("war")}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all"
            >
              <Swords size={14} /> Attack
            </button>
            <button
              onClick={() => setSubModal("aid")}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-all"
            >
              <Package size={14} /> Send Aid
            </button>
          </div>
        )}
        {isMe && (
          <div className="px-6 pb-6 text-center text-xs text-slate-500">This is your nation</div>
        )}
      </div>
    </div>
  );
}