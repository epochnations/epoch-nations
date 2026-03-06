import { useState } from "react";
import { Shield, Pencil, Trash2, Check, X, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const EPOCH_COLORS = {
  Industrial: { from: "from-amber-500", to: "to-orange-600", glow: "shadow-amber-500/20" },
  Information: { from: "from-cyan-500", to: "to-blue-600", glow: "shadow-cyan-500/20" },
  Nano: { from: "from-violet-500", to: "to-purple-600", glow: "shadow-violet-500/20" },
};

export default function IdentityHeader({ nation, theme, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(nation?.name || "");
  const [saving, setSaving] = useState(false);
  const [uploadingFlag, setUploadingFlag] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!nation) return null;
  const stockValue = ((nation.gdp + nation.stability) * nation.public_trust).toFixed(2);
  const epochColor = EPOCH_COLORS[nation.epoch] || EPOCH_COLORS.Industrial;

  async function saveName() {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === nation.name) { setEditing(false); return; }
    setSaving(true);

    // Update the nation itself
    await base44.entities.Nation.update(nation.id, { name: trimmed });

    // Propagate nation_name to all related entities in parallel
    const [stocks, buildings, tradeRoutes, tradeAgreementsA, tradeAgreementsB, holdings, dilemmas, policies] = await Promise.all([
      base44.entities.Stock.filter({ nation_id: nation.id }),
      base44.entities.Building.filter({ nation_id: nation.id }),
      base44.entities.TradeRoute.filter({ from_nation_id: nation.id }),
      base44.entities.TradeAgreement.filter({ nation_a_id: nation.id }),
      base44.entities.TradeAgreement.filter({ nation_b_id: nation.id }),
      base44.entities.StockHolding.filter({ nation_id: nation.id }),
      base44.entities.CouncilDilemma.filter({ nation_id: nation.id }),
      base44.entities.Policy.filter({ nation_id: nation.id }),
    ]);

    const updates = [];
    for (const s of stocks)           updates.push(base44.entities.Stock.update(s.id, { nation_name: trimmed }));
    for (const b of buildings)        updates.push(base44.entities.Building.update(b.id, { nation_name: trimmed }));
    for (const r of tradeRoutes)      updates.push(base44.entities.TradeRoute.update(r.id, { from_nation_name: trimmed }));
    for (const a of tradeAgreementsA) updates.push(base44.entities.TradeAgreement.update(a.id, { nation_a_name: trimmed }));
    for (const a of tradeAgreementsB) updates.push(base44.entities.TradeAgreement.update(a.id, { nation_b_name: trimmed }));
    for (const h of holdings)         updates.push(base44.entities.StockHolding.update(h.id, { nation_name: trimmed }));
    for (const d of dilemmas)         updates.push(base44.entities.CouncilDilemma.update(d.id, { nation_name: trimmed }));
    for (const p of policies)         updates.push(base44.entities.Policy.update(p.id, { nation_name: trimmed }));

    await Promise.all(updates);

    setSaving(false);
    setEditing(false);
    onRefresh?.();
  }

  async function uploadFlag(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFlag(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Nation.update(nation.id, { flag_image_url: file_url });
    setUploadingFlag(false);
    onRefresh?.();
  }

  async function deleteNation() {
    if (deleteConfirmText !== nation.name) return;
    setDeleting(true);
    await base44.entities.Nation.delete(nation.id);
    window.location.href = createPageUrl("Onboarding");
  }

  return (
    <div className={`rounded-2xl border ${theme?.border || "border-white/10"} ${theme?.bg || "bg-white/5"} p-6`}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
        {/* Flag */}
        <div className="relative group shrink-0">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl ${epochColor.glow} overflow-hidden`}
            style={{ backgroundColor: (nation.flag_color || "#3b82f6") + "33", border: `2px solid ${nation.flag_color || "#3b82f6"}55` }}
          >
            {nation.flag_image_url ? (
              <img src={nation.flag_image_url} alt="flag" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{nation.flag_emoji || "🏴"}</span>
            )}
          </div>
          {/* Upload overlay */}
          <label className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            {uploadingFlag ? <Loader2 size={18} className="text-white animate-spin" /> : <Upload size={18} className="text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={uploadFlag} />
          </label>
        </div>

        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
                  className="bg-white/10 border border-cyan-400/40 rounded-xl px-3 py-1.5 text-white text-xl font-black focus:outline-none"
                />
                <button onClick={saveName} disabled={saving} className="p-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => { setEditing(false); setNewName(nation.name); }} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-black text-white">{nation.name}</h1>
                <button onClick={() => { setEditing(true); setNewName(nation.name); }}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                  <Pencil size={12} />
                </button>
              </>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${epochColor.from} ${epochColor.to} text-white`}>
              {nation.epoch} Era
            </div>
          </div>

          <div className="text-slate-400 text-sm mb-3">Led by <span className="text-white font-semibold">{nation.leader}</span> · Tech Level {nation.tech_level}</div>

          {/* Stability Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Shield size={10} />
                <span>National Stability</span>
              </div>
              <span className="text-xs font-mono font-bold text-white">{nation.stability}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${nation.stability}%`,
                  background: nation.stability > 70 ? "linear-gradient(to right, #22c55e, #16a34a)" : nation.stability > 40 ? "linear-gradient(to right, #f59e0b, #d97706)" : "linear-gradient(to right, #ef4444, #dc2626)"
                }} />
            </div>
          </div>
        </div>

        {/* Stats grid + delete */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Treasury", value: `${(nation.currency || 0).toLocaleString()} cr`, color: "text-green-400" },
              { label: "GDP", value: nation.gdp?.toLocaleString(), color: "text-cyan-400" },
              { label: "Public Trust", value: `${((nation.public_trust || 1) * 100).toFixed(0)}%`, color: "text-violet-400" },
              { label: "Stock Index", value: stockValue, color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="bg-black/30 rounded-xl p-3 text-center min-w-[90px]">
                <div className={`text-lg font-mono font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-1.5 rounded-xl text-xs font-bold border border-red-500/20 text-red-500/60 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all">
            🗑 Delete Nation
          </button>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-black text-red-400 mb-2">⚠ Delete Nation</div>
            <p className="text-sm text-slate-400 mb-4">
              This is <span className="text-white font-bold">permanent and irreversible</span>. All data, stocks, and buildings will be lost.
            </p>
            <p className="text-xs text-slate-500 mb-2">Type <span className="text-white font-mono">{nation.name}</span> to confirm:</p>
            <input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder={nation.name}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:border-red-400/40"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5">
                Cancel
              </button>
              <button onClick={deleteNation} disabled={deleteConfirmText !== nation.name || deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-30 flex items-center justify-center gap-2">
                {deleting ? <><Loader2 size={12} className="animate-spin" /> Deleting...</> : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}