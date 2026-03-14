import { useState, useEffect } from "react";
import { X, Swords, Package, Shield, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import WarModal from "./WarModal";
import LendLeaseModal from "./LendLeaseModal";
import AllyRequestModal from "./AllyRequestModal";

const EPOCH_COLORS = {
  "Stone Age": "from-amber-600 to-amber-700",
  "Bronze Age": "from-yellow-500 to-amber-500",
  "Iron Age": "from-slate-500 to-slate-600",
  "Medieval Age": "from-purple-600 to-indigo-600",
  "Industrial Age": "from-amber-500 to-orange-600",
  "Modern Age": "from-cyan-400 to-blue-500",
  "Digital Age": "from-violet-500 to-purple-600",
  "Space Age": "from-indigo-500 to-violet-600",
  "Galactic Age": "from-fuchsia-500 to-purple-700",
};

export default function NationModal({ nation, myNation, onClose, onRefresh }) {
  const [subModal, setSubModal] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [checkingRequest, setCheckingRequest] = useState(true);

  useEffect(() => {
    if (nation && myNation && !isMe && !isAlly) checkPendingAllyRequest();
    else setCheckingRequest(false);
  }, [nation?.id]);

  async function checkPendingAllyRequest() {
    try {
      const [reqA, reqB] = await Promise.all([
        base44.entities.DiplomacyAgreement.filter({
          nation_a_id: myNation.id, nation_b_id: nation.id, agreement_type: "alliance", status: "proposed"
        }),
        base44.entities.DiplomacyAgreement.filter({
          nation_a_id: nation.id, nation_b_id: myNation.id, agreement_type: "alliance", status: "proposed"
        }),
      ]);
      setPendingRequest(reqA[0] || reqB[0] || null);
    } catch (_) {}
    setCheckingRequest(false);
  }

  if (!nation) return null;
  if (subModal === "war") return <WarModal targetNation={nation} myNation={myNation} onClose={() => { setSubModal(null); onClose(); }} onRefresh={onRefresh} />;
  if (subModal === "aid") return <LendLeaseModal targetNation={nation} myNation={myNation} onClose={() => { setSubModal(null); onClose(); }} onRefresh={onRefresh} />;
  if (subModal === "ally_send") return (
    <AllyRequestModal mode="send" nation={nation} myNation={myNation}
      onClose={() => { setSubModal(null); onClose(); }} onRefresh={onRefresh} />
  );
  if (subModal === "ally_respond") return (
    <AllyRequestModal mode="respond" nation={nation} myNation={myNation}
      existingAgreement={pendingRequest}
      onClose={() => { setSubModal(null); onClose(); }} onRefresh={onRefresh} />
  );

  const isMe = myNation?.id === nation.id;
  const isAlly = myNation?.allies?.includes(nation.id);
  const isEnemy = myNation?.at_war_with?.includes(nation.id);
  // Is there an incoming request (they proposed to us)?
  const hasIncomingRequest = pendingRequest && pendingRequest.nation_a_id === nation.id;
  // Did we already send one?
  const hasSentRequest = pendingRequest && pendingRequest.nation_a_id === myNation?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: (nation.flag_color || "#3b82f6") + "33" }}>
            {nation.flag_emoji}
          </div>
          <div className="flex-1 space-y-1">
            <div className="font-black text-lg text-white leading-tight">{nation.name}</div>
            <div className="text-xs text-slate-400 leading-tight">Leader: {nation.leader}</div>
            <span className={`inline-block px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${EPOCH_COLORS[nation.epoch] || "from-slate-500 to-slate-600"} text-white`}>
              {nation.epoch}
            </span>
          </div>
          <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-white" /></button>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-2 gap-3">
          {[
            ["GDP",       Math.round(nation.gdp || 0),              "text-cyan-400"],
            ["Treasury",  Math.round(nation.currency || 0) + " cr", "text-green-400"],
            ["Stability", Math.round(nation.stability || 0) + "%",  "text-blue-400"],
            ["Tech Lvl",  nation.tech_level || 1,                   "text-yellow-400"],
            ["Unit Power",Math.round(nation.unit_power || 0),       "text-red-400"],
            ["Defense",   Math.round(nation.defense_level || 0),    "text-violet-400"],
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
            <div className={`text-xs font-bold px-3 py-2 rounded-xl text-center ${
              isEnemy ? "bg-red-500/20 text-red-400" :
              isAlly  ? "bg-blue-500/20 text-blue-400" :
              hasIncomingRequest ? "bg-cyan-500/20 text-cyan-400" :
              hasSentRequest ? "bg-amber-500/20 text-amber-400" :
              "bg-white/5 text-slate-400"
            }`}>
              {isEnemy ? "⚔ Currently At War" :
               isAlly  ? "🤝 Allied Nation" :
               hasIncomingRequest ? "📨 Alliance Request Pending (Respond!)" :
               hasSentRequest ? "⏳ Request Sent — Awaiting Response" :
               "Neutral Relations"}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isMe && (
          <div className="px-6 pb-6 pt-2 space-y-2">
            {/* Row 1: War + Aid */}
            <div className="flex gap-2">
              <button onClick={() => setSubModal("war")}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all">
                <Swords size={13}/> Attack
              </button>
              <button onClick={() => setSubModal("aid")}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-all">
                <Package size={13}/> Send Aid
              </button>
            </div>

            {/* Row 2: Alliance actions */}
            {!isAlly && !isEnemy && !checkingRequest && (
              <>
                {hasIncomingRequest ? (
                  <button onClick={() => setSubModal("ally_respond")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.35)", color: "#22d3ee" }}>
                    <Shield size={13}/> 📨 Respond to Alliance Request
                  </button>
                ) : hasSentRequest ? (
                  <div className="w-full py-2.5 rounded-xl text-xs text-center text-amber-400 font-bold"
                    style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    ⏳ Alliance Request Awaiting Response
                  </div>
                ) : (
                  <button onClick={() => setSubModal("ally_send")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
                    <Shield size={13}/> 🤝 Send Alliance Request
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {isMe && (
          <div className="px-6 pb-6 text-center text-xs text-slate-500">This is your nation</div>
        )}
      </div>
    </div>
  );
}