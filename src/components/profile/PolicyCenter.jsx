import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const POLICIES = [
  {
    id: "healthcare",
    label: "Universal Healthcare",
    desc: "Stability +10%, Public Trust +8% per cycle",
    icon: "🏥",
    color: "green",
    effect: { stability: 10, public_trust_pct: 8 }
  },
  {
    id: "martial_law",
    label: "Martial Law",
    desc: "Defense +20%, but Public Trust -15% and domestic stocks drop 10%",
    icon: "⚠️",
    color: "red",
    dangerous: true,
    effect: { defense_level: 20, public_trust_pct: -15 }
  },
  {
    id: "tech_subsidies",
    label: "Tech Subsidies",
    desc: "Costs 500 credits per cycle, generates 50 Tech Points",
    icon: "🔬",
    color: "blue",
    effect: { currency: -500, tech_points: 50 }
  },
  {
    id: "tax_cuts",
    label: "Tax Cuts",
    desc: "GDP -5%, but Public Trust +12%",
    icon: "💰",
    color: "amber",
    effect: { gdp_pct: -5, public_trust_pct: 12 }
  },
  {
    id: "conscription",
    label: "Conscription",
    desc: "Unit Power +25, Defense +15, but Stability -8%",
    icon: "🪖",
    color: "orange",
    effect: { unit_power: 25, defense_level: 15, stability: -8 }
  }
];

const COLOR_MAP = {
  green: { ring: "ring-green-400", bg: "bg-green-400", text: "text-green-400", border: "border-green-500/30", card: "bg-green-500/10" },
  red: { ring: "ring-red-400", bg: "bg-red-400", text: "text-red-400", border: "border-red-500/30", card: "bg-red-500/10" },
  blue: { ring: "ring-blue-400", bg: "bg-blue-400", text: "text-blue-400", border: "border-blue-500/30", card: "bg-blue-500/10" },
  amber: { ring: "ring-amber-400", bg: "bg-amber-400", text: "text-amber-400", border: "border-amber-500/30", card: "bg-amber-500/10" },
  orange: { ring: "ring-orange-400", bg: "bg-orange-400", text: "text-orange-400", border: "border-orange-500/30", card: "bg-orange-500/10" },
};

export default function PolicyCenter({ nation, policy, domesticStocks, onRefresh }) {
  const [localPolicy, setLocalPolicy] = useState(policy);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    setLocalPolicy(policy);
  }, [policy]);

  async function togglePolicy(policyId) {
    setToggling(policyId);
    const current = localPolicy?.[policyId] ?? false;
    const newVal = !current;

    // Apply nation effects
    let nationUpdates = {};
    const p = POLICIES.find(p => p.id === policyId);

    if (policyId === "martial_law" && newVal) {
      nationUpdates.defense_level = Math.min(200, (nation.defense_level || 50) * 1.2);
      nationUpdates.public_trust = Math.max(0.1, (nation.public_trust || 1) * 0.85);
      // Drop domestic stocks by 10%
      for (const s of domesticStocks) {
        const newPrice = parseFloat((s.current_price * 0.9).toFixed(2));
        await base44.entities.Stock.update(s.id, {
          current_price: newPrice,
          price_history: [...(s.price_history || []), newPrice].slice(-20),
          market_cap: parseFloat((newPrice * s.total_shares).toFixed(2))
        });
      }
    } else if (policyId === "martial_law" && !newVal) {
      // Remove martial law effects
      nationUpdates.defense_level = Math.max(10, (nation.defense_level || 50) / 1.2);
      nationUpdates.public_trust = Math.min(2.0, (nation.public_trust || 1) / 0.85);
    }

    if (nationUpdates && Object.keys(nationUpdates).length > 0) {
      await base44.entities.Nation.update(nation.id, nationUpdates);
    }

    // Update or create policy record
    let updatedPolicy;
    if (localPolicy?.id) {
      updatedPolicy = await base44.entities.Policy.update(localPolicy.id, { [policyId]: newVal });
    } else {
      updatedPolicy = await base44.entities.Policy.create({
        nation_id: nation.id,
        nation_name: nation.name,
        owner_email: nation.owner_email,
        [policyId]: newVal
      });
    }
    setLocalPolicy(updatedPolicy);

    // Post news
    const policyDef = POLICIES.find(p => p.id === policyId);
    await base44.entities.NewsArticle.create({
      headline: `BREAKING: ${nation.name} ${newVal ? "Activates" : "Repeals"} ${policyDef.label}`,
      body: `${nation.leader} of ${nation.name} has officially ${newVal ? "enacted" : "repealed"} the ${policyDef.label} policy. Markets are watching closely.`,
      category: "policy",
      tier: "breaking",
      nation_name: nation.name,
      nation_flag: nation.flag_emoji,
      nation_color: nation.flag_color
    });

    setToggling(null);
    onRefresh?.();
  }

  const active = localPolicy || {};

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-400 uppercase tracking-widest mb-4">
        Control Room — National Policy Center
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {POLICIES.map(p => {
          const isOn = active[p.id] ?? false;
          const colors = COLOR_MAP[p.color];
          const isLoading = toggling === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 transition-all ${
                isOn ? `${colors.card} ${colors.border}` : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{p.label}</div>
                    {p.dangerous && (
                      <div className="text-xs text-red-400">⚠ High Risk</div>
                    )}
                  </div>
                </div>
                {/* LED Toggle */}
                <button
                  onClick={() => togglePolicy(p.id)}
                  disabled={isLoading}
                  className={`relative flex items-center w-11 h-6 rounded-full transition-all duration-300 ${
                    isOn ? colors.bg : "bg-slate-700"
                  } ${isLoading ? "opacity-50" : "cursor-pointer"}`}
                >
                  <div className={`absolute w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-300 ${
                    isOn ? "translate-x-6" : "translate-x-1"
                  }`} />
                  {/* LED dot */}
                  <div className={`absolute right-1 w-2 h-2 rounded-full transition-all ${
                    isOn ? "bg-white/30" : "bg-transparent"
                  }`} />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>

              {/* Status indicator */}
              <div className="mt-3 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isOn ? `${colors.bg} shadow-sm` : "bg-slate-600"}`} />
                <span className={`text-xs font-bold ${isOn ? colors.text : "text-slate-500"}`}>
                  {isLoading ? "Updating..." : isOn ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-xs text-slate-400">
        💡 Policy changes take effect immediately and are posted as Breaking News to the Global Chronicles.
        <strong className="text-white"> Martial Law</strong> instantly devalues all domestic stocks by 10%.
      </div>
    </div>
  );
}