/**
 * DiplomacyPanel — Advanced Diplomatic Interaction System
 * Full diplomatic hub: propose deals, accept/reject proposals, manage active agreements,
 * sanctions, tribute demands, alliance networks, and diplomatic standing.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Shield, Handshake, AlertTriangle, TrendingUp, Swords, ScrollText, Check, Ban, Clock, Globe, ChevronDown, ChevronUp, Star } from "lucide-react";

const PROPOSAL_TYPES = [
  { id: "alliance",           label: "Alliance",             icon: "🤝", color: "#22d3ee",  desc: "Mutual defense & cooperation pact",   cost: 50  },
  { id: "trade_agreement",    label: "Trade Agreement",       icon: "📦", color: "#34d399",  desc: "Reduced tariffs, shared market access", cost: 30  },
  { id: "non_aggression_pact",label: "Non-Aggression Pact",  icon: "🕊️", color: "#60a5fa",  desc: "Pledge not to attack each other",     cost: 20  },
  { id: "defense_treaty",     label: "Defense Treaty",        icon: "🛡️", color: "#a78bfa",  desc: "Mutual defense if either is attacked", cost: 75  },
  { id: "peace_treaty",       label: "Peace Treaty",          icon: "📜", color: "#fbbf24",  desc: "End active hostilities",              cost: 100 },
  { id: "sanctions",          label: "Economic Sanctions",    icon: "🚫", color: "#f87171",  desc: "Block trade & freeze assets",         cost: 40  },
];

const TYPE_COLORS = {
  alliance:            { bg: "rgba(34,211,238,0.1)",   border: "rgba(34,211,238,0.3)",   text: "#22d3ee" },
  trade_agreement:     { bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.3)",   text: "#34d399" },
  non_aggression_pact: { bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.3)",   text: "#60a5fa" },
  defense_treaty:      { bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.3)",  text: "#a78bfa" },
  peace_treaty:        { bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)",   text: "#fbbf24" },
  sanctions:           { bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.3)",  text: "#f87171" },
};

const STATUS_STYLE = {
  proposed: { label: "Pending",  color: "#fbbf24" },
  active:   { label: "Active",   color: "#22d3ee" },
  rejected: { label: "Rejected", color: "#f87171" },
  expired:  { label: "Expired",  color: "#64748b" },
  broken:   { label: "Broken",   color: "#f97316" },
};

export default function DiplomacyPanel({ myNation, onClose, onRefresh }) {
  const [allNations, setAllNations] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming"); // incoming | active | propose | network
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [terms, setTerms] = useState("");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState(null);
  const [searchNation, setSearchNation] = useState("");
  const [expandedAgreement, setExpandedAgreement] = useState(null);

  useEffect(() => {
    load();
  }, [myNation?.id]);

  async function load() {
    setLoading(true);
    const [nations, agrs] = await Promise.all([
      base44.entities.Nation.list("-gdp", 80),
      base44.entities.DiplomacyAgreement.list("-created_date", 200),
    ]);
    setAllNations(nations.filter(n => n.id !== myNation.id));
    setAgreements(agrs);
    setLoading(false);
  }

  const myAgreements = agreements.filter(a => a.nation_a_id === myNation.id || a.nation_b_id === myNation.id);
  const incoming = myAgreements.filter(a => a.status === "proposed" && a.nation_a_id !== myNation.id);
  const outgoing = myAgreements.filter(a => a.status === "proposed" && a.nation_a_id === myNation.id);
  const active = myAgreements.filter(a => a.status === "active");
  const historical = myAgreements.filter(a => ["rejected","expired","broken"].includes(a.status));

  // Diplomatic standing score
  const dipScore = active.length * 15 + (myNation.allies || []).length * 20 - (myNation.at_war_with || []).length * 30;
  const dipRank = dipScore >= 100 ? "Diplomatic Superpower" : dipScore >= 60 ? "Respected Nation" : dipScore >= 30 ? "Regional Player" : dipScore >= 0 ? "New Entrant" : "Pariah State";

  const filteredNations = allNations.filter(n => n.name.toLowerCase().includes(searchNation.toLowerCase()));

  async function proposeAgreement() {
    if (!selectedTarget || !selectedType) return;
    const prop = PROPOSAL_TYPES.find(p => p.id === selectedType);
    if ((myNation.currency || 0) < prop.cost) {
      setMsg({ type: "error", text: `Not enough credits. Need ${prop.cost} cr for diplomatic fees.` });
      return;
    }
    setProcessing(true);
    setMsg(null);

    // Check for existing active agreement of same type
    const existing = agreements.find(a =>
      a.agreement_type === selectedType && a.status === "active" &&
      ((a.nation_a_id === myNation.id && a.nation_b_id === selectedTarget.id) ||
       (a.nation_b_id === myNation.id && a.nation_a_id === selectedTarget.id))
    );
    if (existing) {
      setMsg({ type: "error", text: "An active agreement of this type already exists with this nation." });
      setProcessing(false);
      return;
    }

    await base44.entities.DiplomacyAgreement.create({
      nation_a_id:   myNation.id,
      nation_a_name: myNation.name,
      nation_b_id:   selectedTarget.id,
      nation_b_name: selectedTarget.name,
      agreement_type: selectedType,
      status:        "proposed",
      proposed_by:   myNation.name,
      terms: terms || `Formal ${prop.label} proposed by ${myNation.name} to ${selectedTarget.name}.`,
    });

    await base44.entities.Nation.update(myNation.id, { currency: (myNation.currency || 0) - prop.cost });

    await base44.entities.Notification.create({
      target_nation_id: selectedTarget.id,
      target_owner_email: selectedTarget.owner_email,
      type: "lend_lease",
      title: `Diplomatic Proposal from ${myNation.name}`,
      message: `${myNation.name} has proposed a ${prop.label} with your nation. Check the Diplomacy panel to respond.`,
      severity: "info",
    }).catch(() => {});

    await base44.entities.ChatMessage.create({
      channel: "global",
      sender_nation_name: "DIPLOMATIC BUREAU",
      sender_flag: "🤝",
      sender_color: "#22d3ee",
      sender_role: "system",
      content: `📜 DIPLOMATIC PROPOSAL — ${myNation.flag_emoji || "🏴"} ${myNation.name} has proposed a ${prop.icon} ${prop.label} with ${selectedTarget.flag_emoji || "🏴"} ${selectedTarget.name}.`,
    }).catch(() => {});

    setMsg({ type: "success", text: `${prop.label} proposal sent to ${selectedTarget.name}!` });
    setSelectedTarget(null); setSelectedType(null); setTerms("");
    setProcessing(false);
    onRefresh?.();
    load();
  }

  async function respondToProposal(agreement, accept) {
    setProcessing(true);
    const prop = PROPOSAL_TYPES.find(p => p.id === agreement.agreement_type);

    if (accept) {
      await base44.entities.DiplomacyAgreement.update(agreement.id, { status: "active" });

      // Apply alliance effects
      if (agreement.agreement_type === "alliance" || agreement.agreement_type === "defense_treaty") {
        const nationA = allNations.find(n => n.id === agreement.nation_a_id) || myNation;
        const nationB = myNation;
        const aAllies = [...new Set([...(nationA.allies || []), nationB.id])];
        const bAllies = [...new Set([...(nationB.allies || []), nationA.id])];
        await Promise.all([
          base44.entities.Nation.update(nationA.id, { allies: aAllies }),
          base44.entities.Nation.update(nationB.id, { allies: bAllies }),
        ]);
      }

      await base44.entities.ChatMessage.create({
        channel: "global",
        sender_nation_name: "DIPLOMATIC BUREAU",
        sender_flag: "🤝",
        sender_color: "#22d3ee",
        sender_role: "system",
        content: `✅ AGREEMENT RATIFIED — ${agreement.nation_a_name} & ${myNation.name} have formalized a ${prop?.icon || ""} ${prop?.label || agreement.agreement_type}!`,
      }).catch(() => {});

      await base44.entities.WorldChronicle.create({
        event_type: agreement.agreement_type === "sanctions" ? "crisis" : "alliance",
        title: `${agreement.agreement_type.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())} Ratified`,
        summary: `${agreement.nation_a_name} and ${myNation.name} have entered a ${prop?.label} agreement.`,
        actors: [agreement.nation_a_name, myNation.name],
        importance: "medium",
      }).catch(() => {});
    } else {
      await base44.entities.DiplomacyAgreement.update(agreement.id, { status: "rejected" });
      await base44.entities.Notification.create({
        target_nation_id: agreement.nation_a_id,
        target_owner_email: allNations.find(n => n.id === agreement.nation_a_id)?.owner_email,
        type: "lend_lease",
        title: `Proposal Rejected by ${myNation.name}`,
        message: `${myNation.name} has rejected your ${prop?.label} proposal.`,
        severity: "warning",
      }).catch(() => {});
    }

    setProcessing(false);
    onRefresh?.();
    load();
  }

  async function cancelAgreement(agreement) {
    setProcessing(true);
    await base44.entities.DiplomacyAgreement.update(agreement.id, { status: "broken" });

    if (agreement.agreement_type === "alliance" || agreement.agreement_type === "defense_treaty") {
      const otherId = agreement.nation_a_id === myNation.id ? agreement.nation_b_id : agreement.nation_a_id;
      const other = allNations.find(n => n.id === otherId);
      if (other) {
        await base44.entities.Nation.update(myNation.id, { allies: (myNation.allies || []).filter(id => id !== otherId) });
        await base44.entities.Nation.update(otherId, { allies: (other.allies || []).filter(id => id !== myNation.id) });
      }
    }

    await base44.entities.ChatMessage.create({
      channel: "global",
      sender_nation_name: "DIPLOMATIC BUREAU",
      sender_flag: "⚠️",
      sender_color: "#f97316",
      sender_role: "system",
      content: `💔 AGREEMENT BROKEN — ${myNation.name} has dissolved their ${agreement.agreement_type.replace(/_/g," ")} with ${agreement.nation_a_id === myNation.id ? agreement.nation_b_name : agreement.nation_a_name}.`,
    }).catch(() => {});

    setProcessing(false);
    onRefresh?.();
    load();
  }

  const tabs = [
    { id: "incoming", label: "Incoming", count: incoming.length, color: "#fbbf24" },
    { id: "active",   label: "Active",   count: active.length,   color: "#22d3ee" },
    { id: "propose",  label: "Propose",  count: null,            color: "#34d399" },
    { id: "network",  label: "Network",  count: null,            color: "#a78bfa" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)" }} onClick={onClose}>
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(160deg, #080f1e 0%, #050a14 100%)", border: "1px solid rgba(34,211,238,0.15)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="shrink-0 px-6 pt-5 pb-0" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(139,92,246,0.06) 100%)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0891b2, #7c3aed)", boxShadow: "0 4px 20px rgba(8,145,178,0.35)" }}>
                <Globe size={22} className="text-white"/>
              </div>
              <div>
                <div className="text-[10px] ep-mono tracking-widest text-cyan-400/70 uppercase">Diplomatic Affairs Office</div>
                <div className="text-xl font-black text-white tracking-tight">{myNation.name}</div>
                <div className="text-xs text-slate-400">{myNation.flag_emoji} {myNation.leader || "National Government"}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X size={16}/>
            </button>
          </div>

          {/* Diplomatic standing */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Standing",    value: dipRank, sub: `Score: ${dipScore}`, color: dipScore >= 60 ? "#22d3ee" : dipScore >= 0 ? "#fbbf24" : "#f87171" },
              { label: "Active Pacts",value: active.length,   sub: "agreements",   color: "#34d399" },
              { label: "Allies",      value: (myNation.allies||[]).length, sub: "nations", color: "#a78bfa" },
              { label: "Pending",     value: incoming.length, sub: "proposals",    color: "#fbbf24" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
                <div className="text-[9px] text-slate-500 ep-mono uppercase">{stat.label}</div>
                <div className="text-sm font-black ep-mono" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[9px] text-slate-600">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 py-2.5 text-xs font-bold rounded-t-xl transition-all relative"
                style={{
                  background: activeTab === t.id ? "rgba(255,255,255,0.06)" : "transparent",
                  borderTop: activeTab === t.id ? `1px solid ${t.color}40` : "1px solid transparent",
                  borderLeft: activeTab === t.id ? `1px solid ${t.color}20` : "1px solid transparent",
                  borderRight: activeTab === t.id ? `1px solid ${t.color}20` : "1px solid transparent",
                  color: activeTab === t.id ? t.color : "#64748b",
                  marginBottom: activeTab === t.id ? "-1px" : "0",
                }}>
                {t.label}
                {t.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                    style={{ background: t.color, color: "#000" }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <>
              {/* INCOMING TAB */}
              {activeTab === "incoming" && (
                <div className="space-y-4">
                  {incoming.length === 0 && outgoing.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">No pending diplomatic proposals.</div>
                  ) : (
                    <>
                      {incoming.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">Incoming Proposals</div>
                          <div className="space-y-3">
                            {incoming.map(a => {
                              const prop = PROPOSAL_TYPES.find(p => p.id === a.agreement_type);
                              const c = TYPE_COLORS[a.agreement_type] || TYPE_COLORS.trade_agreement;
                              const proposer = allNations.find(n => n.id === a.nation_a_id);
                              return (
                                <div key={a.id} className="rounded-2xl p-4" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{prop?.icon || "📜"}</span>
                                      <div>
                                        <div className="font-bold text-white text-sm">{prop?.label || a.agreement_type}</div>
                                        <div className="text-[11px] text-slate-400">From: <span style={{ color: c.text }}>{a.nation_a_name}</span> {proposer?.flag_emoji}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-amber-400 ep-mono">
                                      <Clock size={10}/> Pending
                                    </div>
                                  </div>
                                  {a.terms && <div className="text-xs text-slate-400 italic mb-3 bg-white/5 rounded-lg px-3 py-2">"{a.terms}"</div>}
                                  <div className="flex gap-2">
                                    <button onClick={() => respondToProposal(a, true)} disabled={processing}
                                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                                      style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                                      <Check size={12}/> Accept
                                    </button>
                                    <button onClick={() => respondToProposal(a, false)} disabled={processing}
                                      className="flex-1 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition-all">
                                      <X size={12}/> Reject
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {outgoing.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Outgoing Proposals</div>
                          <div className="space-y-2">
                            {outgoing.map(a => {
                              const prop = PROPOSAL_TYPES.find(p => p.id === a.agreement_type);
                              const c = TYPE_COLORS[a.agreement_type] || TYPE_COLORS.trade_agreement;
                              return (
                                <div key={a.id} className="rounded-xl px-4 py-3 flex items-center gap-3"
                                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c.border}` }}>
                                  <span>{prop?.icon}</span>
                                  <div className="flex-1">
                                    <div className="text-xs font-bold text-white">{prop?.label}</div>
                                    <div className="text-[10px] text-slate-500">To: {a.nation_b_name}</div>
                                  </div>
                                  <span className="text-[10px] text-amber-400 ep-mono">Awaiting response</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {/* Historical */}
                  {historical.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">History</div>
                      <div className="space-y-1.5">
                        {historical.slice(0, 10).map(a => {
                          const prop = PROPOSAL_TYPES.find(p => p.id === a.agreement_type);
                          const st = STATUS_STYLE[a.status] || STATUS_STYLE.expired;
                          const other = a.nation_a_id === myNation.id ? a.nation_b_name : a.nation_a_name;
                          return (
                            <div key={a.id} className="rounded-lg px-3 py-2 flex items-center gap-3"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <span className="text-sm">{prop?.icon || "📜"}</span>
                              <div className="flex-1 text-[11px]">
                                <span className="text-slate-400">{prop?.label}</span>
                                <span className="text-slate-600 mx-1">with</span>
                                <span className="text-slate-300">{other}</span>
                              </div>
                              <span className="text-[10px] font-bold ep-mono" style={{ color: st.color }}>{st.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVE TAB */}
              {activeTab === "active" && (
                <div className="space-y-3">
                  {active.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">No active diplomatic agreements. Propose one to get started.</div>
                  ) : (
                    active.map(a => {
                      const prop = PROPOSAL_TYPES.find(p => p.id === a.agreement_type);
                      const c = TYPE_COLORS[a.agreement_type] || TYPE_COLORS.trade_agreement;
                      const other = a.nation_a_id === myNation.id ? a.nation_b_name : a.nation_a_name;
                      const otherId = a.nation_a_id === myNation.id ? a.nation_b_id : a.nation_a_id;
                      const otherNation = allNations.find(n => n.id === otherId);
                      const expanded = expandedAgreement === a.id;
                      return (
                        <div key={a.id} className="rounded-2xl overflow-hidden" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                          <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedAgreement(expanded ? null : a.id)}>
                            <span className="text-xl">{prop?.icon}</span>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white">{prop?.label}</div>
                              <div className="text-[11px]" style={{ color: c.text }}>
                                {otherNation?.flag_emoji} {other}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${c.text}20`, color: c.text }}>Active</span>
                              {expanded ? <ChevronUp size={13} className="text-slate-500"/> : <ChevronDown size={13} className="text-slate-500"/>}
                            </div>
                          </div>
                          {expanded && (
                            <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: `${c.text}20` }}>
                              {a.terms && <div className="text-xs text-slate-400 italic mt-3">"{a.terms}"</div>}
                              {otherNation && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  {[
                                    { label: "GDP", value: (otherNation.gdp||0).toLocaleString() },
                                    { label: "Stability", value: `${otherNation.stability||0}%` },
                                    { label: "Epoch", value: otherNation.epoch },
                                  ].map(s => (
                                    <div key={s.label} className="text-center rounded-lg py-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                                      <div className="text-[9px] text-slate-500">{s.label}</div>
                                      <div className="text-xs font-bold text-white">{s.value}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button onClick={() => cancelAgreement(a)} disabled={processing}
                                className="w-full py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-all">
                                Dissolve Agreement
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* PROPOSE TAB */}
              {activeTab === "propose" && (
                <div className="space-y-5">
                  {/* Nation search */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Nation</div>
                    <input value={searchNation} onChange={e => setSearchNation(e.target.value)}
                      placeholder="Search nations..." className="w-full ep-input px-3 py-2.5 text-sm rounded-xl text-white placeholder-slate-600 mb-2"/>
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-white/08" style={{ background: "rgba(255,255,255,0.02)" }}>
                      {filteredNations.slice(0, 20).map(n => (
                        <button key={n.id} onClick={() => setSelectedTarget(n)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                          style={{ background: selectedTarget?.id === n.id ? "rgba(34,211,238,0.1)" : "transparent" }}>
                          <span>{n.flag_emoji || "🏴"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{n.name}</div>
                            <div className="text-[10px] text-slate-500">{n.epoch} · {n.government_type}</div>
                          </div>
                          {(myNation.allies || []).includes(n.id) && <span className="text-[9px] text-green-400 font-bold">ALLY</span>}
                          {(myNation.at_war_with || []).includes(n.id) && <span className="text-[9px] text-red-400 font-bold">ENEMY</span>}
                          {selectedTarget?.id === n.id && <Check size={12} className="text-cyan-400 shrink-0"/>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Agreement type */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Agreement Type</div>
                    <div className="grid grid-cols-2 gap-2">
                      {PROPOSAL_TYPES.map(p => (
                        <button key={p.id} onClick={() => setSelectedType(p.id)}
                          className="p-3 rounded-xl text-left transition-all"
                          style={{
                            background: selectedType === p.id ? `${p.color}18` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${selectedType === p.id ? p.color + "55" : "rgba(255,255,255,0.07)"}`,
                          }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{p.icon}</span>
                            <span className="text-[9px] ep-mono font-bold" style={{ color: p.color }}>{p.cost} cr</span>
                          </div>
                          <div className="text-xs font-bold text-white">{p.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Terms (optional)</div>
                    <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={3}
                      placeholder="Describe the specific terms of this agreement..."
                      className="w-full ep-input px-3 py-2.5 text-sm rounded-xl text-white placeholder-slate-600 resize-none"/>
                  </div>

                  {msg && <div className={`text-xs px-3 py-2 rounded-lg ${msg.type === "error" ? "text-red-400 bg-red-500/10 border border-red-500/20" : "text-green-400 bg-green-500/10 border border-green-500/20"}`}>{msg.text}</div>}

                  {selectedTarget && selectedType && (
                    <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)" }}>
                      <div className="text-slate-400">Proposing <strong className="text-cyan-400">{PROPOSAL_TYPES.find(p => p.id === selectedType)?.label}</strong> to <strong className="text-white">{selectedTarget.name}</strong></div>
                      <div className="text-slate-500 mt-0.5">Cost: <span className="text-amber-400 font-bold">{PROPOSAL_TYPES.find(p => p.id === selectedType)?.cost} credits</span> · Treasury: {(myNation.currency || 0).toLocaleString()} cr</div>
                    </div>
                  )}

                  <button onClick={proposeAgreement} disabled={!selectedTarget || !selectedType || processing}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-30 transition-all"
                    style={{ background: "linear-gradient(135deg, #0891b2, #7c3aed)" }}>
                    {processing ? "Sending Proposal..." : "📜 Send Diplomatic Proposal"}
                  </button>
                </div>
              )}

              {/* NETWORK TAB */}
              {activeTab === "network" && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Diplomatic Network Overview</div>
                  {/* Ally network */}
                  <div>
                    <div className="text-xs text-green-400 font-bold mb-2">🤝 Allies ({(myNation.allies||[]).length})</div>
                    {(myNation.allies || []).length === 0 ? (
                      <div className="text-xs text-slate-600 italic">No allies yet. Propose alliances to build your coalition.</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {(myNation.allies || []).map(allyId => {
                          const ally = allNations.find(n => n.id === allyId);
                          if (!ally) return null;
                          return (
                            <div key={allyId} className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                              style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                              <span>{ally.flag_emoji || "🏴"}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">{ally.name}</div>
                                <div className="text-[10px] text-green-400">GDP: {(ally.gdp||0).toLocaleString()}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Enemies */}
                  {(myNation.at_war_with || []).length > 0 && (
                    <div>
                      <div className="text-xs text-red-400 font-bold mb-2">⚔️ At War ({(myNation.at_war_with||[]).length})</div>
                      <div className="grid grid-cols-2 gap-2">
                        {(myNation.at_war_with || []).map(enemyId => {
                          const enemy = allNations.find(n => n.id === enemyId);
                          if (!enemy) return null;
                          return (
                            <div key={enemyId} className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                              <span>{enemy.flag_emoji || "🏴"}</span>
                              <div>
                                <div className="text-xs font-bold text-white">{enemy.name}</div>
                                <div className="text-[10px] text-red-400">Military: {enemy.unit_power}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* World diplomatic standing comparison */}
                  <div>
                    <div className="text-xs text-slate-400 font-bold mb-2">🌍 Global Diplomatic Rankings</div>
                    <div className="space-y-1.5">
                      {allNations
                        .map(n => ({ ...n, score: (n.allies||[]).length * 20 - (n.at_war_with||[]).length * 30 }))
                        .sort((a,b) => b.score - a.score)
                        .slice(0, 10)
                        .map((n, i) => (
                          <div key={n.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                            style={{ background: n.id === myNation.id ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${n.id === myNation.id ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                            <span className="text-[11px] text-slate-500 ep-mono w-4">#{i+1}</span>
                            <span>{n.flag_emoji || "🏴"}</span>
                            <div className="flex-1 text-xs text-white">{n.name}</div>
                            <span className="text-[10px] ep-mono font-bold" style={{ color: n.score >= 0 ? "#34d399" : "#f87171" }}>{n.score}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}