import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Package, Heart } from "lucide-react";

const RESOURCES = [
  { id: "currency", label: "Credits", icon: "💎", field: "currency" },
  { id: "res_wood", label: "Wood", icon: "🌳", field: "res_wood" },
  { id: "res_stone", label: "Stone", icon: "🪨", field: "res_stone" },
  { id: "res_gold", label: "Gold", icon: "✨", field: "res_gold" },
  { id: "res_iron", label: "Iron", icon: "⚙", field: "res_iron" },
  { id: "res_oil", label: "Oil", icon: "🛢", field: "res_oil" },
  { id: "res_food", label: "Food", icon: "🌾", field: "res_food" },
  { id: "tech_points", label: "Tech Points", icon: "⚡", field: "tech_points" },
];

export default function LendLeaseModal({ targetNation, myNation, onClose, onRefresh }) {
  const [resource, setResource] = useState("currency");
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!targetNation || !myNation) return null;

  const res = RESOURCES.find(r => r.id === resource);
  const myBalance = myNation[res?.field] || 0;

  async function sendAid() {
    if (amount <= 0 || amount > myBalance) return;
    setLoading(true);

    // Deduct from sender
    await base44.entities.Nation.update(myNation.id, {
      [res.field]: myNation[res.field] - amount
    });

    // Add to receiver
    await base44.entities.Nation.update(targetNation.id, {
      [res.field]: (targetNation[res.field] || 0) + amount
    });

    // Make allies
    const myAllies = [...(myNation.allies || [])];
    if (!myAllies.includes(targetNation.id)) myAllies.push(targetNation.id);
    const theirAllies = [...(targetNation.allies || [])];
    if (!theirAllies.includes(myNation.id)) theirAllies.push(myNation.id);

    await base44.entities.Nation.update(myNation.id, { allies: myAllies });
    await base44.entities.Nation.update(targetNation.id, { allies: theirAllies });

    // Notify
    await base44.entities.Notification.create({
      target_owner_email: targetNation.owner_email,
      target_nation_id: targetNation.id,
      type: "lend_lease",
      title: `📦 Lend-Lease Received!`,
      message: `${myNation.name} sent you ${amount} ${res.label}. Alliance established!`,
      severity: "success",
      is_read: false
    });

    // Transaction
    await base44.entities.Transaction.create({
      type: "lend_lease",
      from_nation_id: myNation.id,
      from_nation_name: myNation.name,
      to_nation_id: targetNation.id,
      to_nation_name: targetNation.name,
      resource_type: resource,
      resource_amount: amount,
      total_value: amount,
      description: `${myNation.name} → ${targetNation.name}: ${amount} ${res.label} (Lend-Lease)`
    });

    setSent(true);
    setLoading(false);
    onRefresh?.();
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl p-8 text-center space-y-4">
          <div className="text-5xl">✓</div>
          <div className="text-2xl font-black text-white">Aid Sent!</div>
          <div className="text-slate-300 text-sm">Alliance formed with <strong>{targetNation.name}</strong></div>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-blue-400" />
            <span className="font-bold text-white">Send Lend-Lease Aid</span>
          </div>
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <span className="text-2xl">{targetNation.flag_emoji}</span>
            <div>
              <div className="font-bold text-white">{targetNation.name}</div>
              <div className="text-xs text-slate-400">{targetNation.epoch} · GDP: {targetNation.gdp}</div>
            </div>
            {targetNation.is_in_market_crash && (
              <div className="ml-auto px-2 py-1 rounded-lg bg-red-500/20 text-xs text-red-400 font-bold">IN CRASH</div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Resource Type</label>
            <div className="grid grid-cols-4 gap-2">
              {RESOURCES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setResource(r.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${resource === r.id ? "border-blue-400/50 bg-blue-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <div className="text-2xl">{r.icon}</div>
                  <div className="text-xs text-slate-300 mt-1">{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Amount</label>
            <input
              type="number"
              min={1}
              max={myBalance}
              value={amount}
              onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-blue-400/50"
            />
            <div className="text-xs text-slate-500 mt-1">Your {res?.label}: {myBalance.toLocaleString()}</div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button
              onClick={sendAid}
              disabled={loading || amount > myBalance || amount <= 0}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-400 hover:to-cyan-500 disabled:opacity-30 transition-all"
            >
              {loading ? "Sending..." : "SEND AID"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}