/**
 * AllyRequestModal — Send, accept, or decline alliance requests with optional reasons.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Shield, Check, XCircle, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AllyRequestModal({ mode, nation, myNation, existingAgreement, onClose, onRefresh }) {
  const [message, setMessage] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  // mode: "send" | "respond"

  async function sendRequest() {
    setLoading(true);
    const agreement = await base44.entities.DiplomacyAgreement.create({
      nation_a_id: myNation.id,
      nation_a_name: myNation.name,
      nation_b_id: nation.id,
      nation_b_name: nation.name,
      agreement_type: "alliance",
      status: "proposed",
      proposed_by: myNation.id,
      terms: message.trim() || `${myNation.name} proposes a mutual alliance with ${nation.name}.`,
    });
    // Notify target
    await base44.entities.Notification.create({
      target_owner_email: nation.owner_email,
      target_nation_id: nation.id,
      type: "ally_aid",
      title: `🤝 Alliance Request from ${myNation.name}`,
      message: message.trim() || `${myNation.name} (${myNation.flag_emoji}) is requesting a military alliance with your nation.`,
      severity: "info",
      is_read: false,
    });
    await base44.entities.ChatMessage.create({
      channel: "global",
      sender_nation_name: myNation.name,
      sender_flag: myNation.flag_emoji || "🏴",
      sender_color: myNation.flag_color || "#3b82f6",
      sender_role: "player",
      content: `🤝 ${myNation.name} has sent an alliance request to ${nation.name}.`,
    }).catch(() => {});
    setDone("sent");
    onRefresh?.();
    setLoading(false);
  }

  async function acceptRequest() {
    setLoading(true);
    // Update agreement
    await base44.entities.DiplomacyAgreement.update(existingAgreement.id, { status: "active" });
    // Add each other as allies
    const myAllies = [...(myNation.allies || [])];
    if (!myAllies.includes(nation.id)) myAllies.push(nation.id);
    const theirAllies = [...(nation.allies || [])];
    if (!theirAllies.includes(myNation.id)) theirAllies.push(myNation.id);
    await Promise.all([
      base44.entities.Nation.update(myNation.id, { allies: myAllies }),
      base44.entities.Nation.update(nation.id, { allies: theirAllies }),
    ]);
    // Notify proposer
    await base44.entities.Notification.create({
      target_owner_email: nation.owner_email,
      target_nation_id: nation.id,
      type: "ally_aid",
      title: `✅ Alliance Accepted by ${myNation.name}!`,
      message: `${myNation.name} has accepted your alliance request. You are now allies!`,
      severity: "success",
      is_read: false,
    });
    await base44.entities.ChatMessage.create({
      channel: "global",
      sender_nation_name: "DIPLOMACY",
      sender_flag: "🤝",
      sender_color: "#22d3ee",
      sender_role: "system",
      content: `🤝 ALLIANCE FORMED — ${myNation.name} and ${nation.name} have entered into a mutual alliance!`,
    }).catch(() => {});
    await base44.entities.NewsArticle.create({
      headline: `🤝 ALLIANCE: ${myNation.name} and ${nation.name} Form Strategic Partnership`,
      body: `In a significant diplomatic development, ${myNation.name} and ${nation.name} have formalized a military alliance.`,
      category: "policy", tier: "standard",
      nation_name: myNation.name, nation_flag: myNation.flag_emoji, nation_color: myNation.flag_color,
    }).catch(() => {});
    setDone("accepted");
    onRefresh?.();
    setLoading(false);
  }

  async function declineRequest() {
    setLoading(true);
    await base44.entities.DiplomacyAgreement.update(existingAgreement.id, {
      status: "rejected",
      terms: declineReason.trim() ? `Declined: ${declineReason.trim()}` : "Request declined.",
    });
    await base44.entities.Notification.create({
      target_owner_email: nation.owner_email,
      target_nation_id: nation.id,
      type: "ally_aid",
      title: `❌ Alliance Request Declined by ${myNation.name}`,
      message: declineReason.trim()
        ? `${myNation.name} declined your alliance request: "${declineReason.trim()}"`
        : `${myNation.name} has declined your alliance request.`,
      severity: "warning",
      is_read: false,
    });
    setDone("declined");
    onRefresh?.();
    setLoading(false);
  }

  const isResponding = mode === "respond";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #040810 100%)", border: "1px solid rgba(34,211,238,0.2)", boxShadow: "0 0 60px rgba(34,211,238,0.07)" }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-cyan-400"/>
            <span className="font-bold text-white text-sm">
              {isResponding ? "Alliance Request" : "Send Alliance Request"}
            </span>
          </div>
          <button onClick={onClose}><X size={15} className="text-slate-400 hover:text-white"/></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Nation row */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-3xl">{nation.flag_emoji}</span>
            <div>
              <div className="font-bold text-white text-sm">{nation.name}</div>
              <div className="text-xs text-slate-500">{nation.epoch} · Led by {nation.leader}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-slate-500">Power</div>
              <div className="text-sm font-bold text-red-400">{Math.round(nation.unit_power || 0)}</div>
            </div>
          </div>

          {done === "sent" && (
            <div className="p-4 rounded-xl text-center" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <div className="text-2xl mb-2">🤝</div>
              <div className="font-bold text-cyan-400">Alliance Request Sent!</div>
              <div className="text-xs text-slate-400 mt-1">{nation.name} will be notified.</div>
            </div>
          )}

          {done === "accepted" && (
            <div className="p-4 rounded-xl text-center" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <div className="text-2xl mb-2">✅</div>
              <div className="font-bold text-green-400">Alliance Formed!</div>
              <div className="text-xs text-slate-400 mt-1">You and {nation.name} are now allies.</div>
            </div>
          )}

          {done === "declined" && (
            <div className="p-4 rounded-xl text-center" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <div className="text-2xl mb-2">❌</div>
              <div className="font-bold text-red-400">Request Declined</div>
              <div className="text-xs text-slate-400 mt-1">{nation.name} has been notified.</div>
            </div>
          )}

          {!done && !isResponding && (
            <>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Greetings ${nation.name}, I propose we form an alliance for mutual defense and prosperity...`}
                  rows={3}
                  className="w-full rounded-xl px-3 py-2.5 text-white text-xs resize-none focus:outline-none transition-all placeholder-slate-600"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <button
                onClick={sendRequest}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #0e7a6a, #0a5a50)" }}
              >
                {loading ? "Sending..." : "🤝 Send Alliance Request"}
              </button>
            </>
          )}

          {!done && isResponding && (
            <>
              <div className="p-3 rounded-xl text-xs text-slate-300"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-bold text-slate-400 mb-1">Proposal:</div>
                {existingAgreement?.terms || `${nation.name} has proposed a military alliance.`}
              </div>

              {!showDeclineReason ? (
                <div className="flex gap-3">
                  <button onClick={acceptRequest} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
                    <Check size={14}/> Accept
                  </button>
                  <button onClick={() => setShowDeclineReason(true)} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
                    <XCircle size={14}/> Decline
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={13} className="text-slate-400"/>
                    <span className="text-xs text-slate-400">Reason for declining (optional)</span>
                  </div>
                  <textarea
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    placeholder="Our nations have conflicting interests at this time..."
                    rows={2}
                    className="w-full rounded-xl px-3 py-2.5 text-white text-xs resize-none focus:outline-none transition-all placeholder-slate-600"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(248,113,113,0.2)" }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeclineReason(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-slate-400">
                      Back
                    </button>
                    <button onClick={declineRequest} disabled={loading}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #7f1d1d, #991b1b)" }}>
                      {loading ? "Declining..." : "Confirm Decline"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {done && (
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5 transition-all">
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}