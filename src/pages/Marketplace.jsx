import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import MarketSellPanel from "../components/panels/MarketSellPanel";

export default function Marketplace() {
  const [nation, setNation] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const nations = await base44.entities.Nation.filter({ owner_email: u.email });
    if (!nations[0]) { window.location.href = createPageUrl("Onboarding"); return; }
    setNation(nations[0]);
    const bldgs = await base44.entities.Building.filter({ nation_id: nations[0].id });
    setBuildings(bldgs);
    setLoading(false);
  }

  async function refresh() {
    if (!user) return;
    const [nations, bldgs] = await Promise.all([
      base44.entities.Nation.filter({ owner_email: user.email }),
      nation ? base44.entities.Building.filter({ nation_id: nation.id }) : Promise.resolve([])
    ]);
    setNation(nations[0]);
    setBuildings(bldgs);
  }

  const marketCount = buildings.filter(b => b.building_type === "market" && !b.is_destroyed).length;

  if (loading) return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080c14] text-white relative">
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.015) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/30 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            EPOCH NATIONS
          </div>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-sm font-bold text-green-400 hidden sm:inline">🏪 Marketplace</span>
        </div>
        <a href={createPageUrl("Dashboard")} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all">
          ← Dashboard
        </a>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Nation quick stats */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-3 sm:grid-cols-6 gap-3 text-center text-xs">
          {[
            { label: "🪵 Wood",  val: nation?.res_wood  || 0 },
            { label: "🪨 Stone", val: nation?.res_stone || 0 },
            { label: "🥇 Gold",  val: nation?.res_gold  || 0 },
            { label: "⚙️ Iron",  val: nation?.res_iron  || 0 },
            { label: "🛢️ Oil",   val: nation?.res_oil   || 0 },
            { label: "💰 Treasury", val: Math.floor(nation?.currency || 0) },
          ].map(({ label, val }) => (
            <div key={label}>
              <div className="text-slate-400">{label}</div>
              <div className="font-mono font-bold text-white">{val.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Market status banner */}
        {marketCount === 0 ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-6 text-center">
            <div className="text-2xl mb-2">🏪</div>
            <div className="font-bold text-red-400 mb-1">No Active Market</div>
            <p className="text-sm text-slate-400">
              You need at least 1 active Market building to sell resources. Build one in the{" "}
              <a href={createPageUrl("ConstructionHub")} className="text-amber-400 underline hover:text-amber-300">Construction Hub</a>.
            </p>
          </div>
        ) : (
          <MarketSellPanel nation={nation} marketCount={marketCount} onRefresh={refresh} />
        )}
      </main>
    </div>
  );
}