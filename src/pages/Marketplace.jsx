import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import MarketSellPanel from "../components/panels/MarketSellPanel";
import TradeRoutePanel from "../components/marketplace/TradeRoutePanel";
import TradeAgreementPanel from "../components/marketplace/TradeAgreementPanel";
import ImportPanel from "../components/marketplace/ImportPanel";
import GlobalCommodityPanel from "../components/marketplace/GlobalCommodityPanel";

const TABS = [
  { id: "sell",       label: "🏪 Sell",         desc: "Sell resources for treasury" },
  { id: "commodities",label: "🌐 Commodities",  desc: "Live global commodity market" },
  { id: "routes",     label: "🗺️ Trade Routes",  desc: "Establish ongoing trade channels" },
  { id: "agreements", label: "📜 Agreements",    desc: "Tariffs & trade pacts" },
  { id: "import",     label: "📥 Import",        desc: "Buy from global market" },
];

export default function Marketplace() {
  const [nation, setNation] = useState(null);
  const [allNations, setAllNations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("sell");

  useEffect(() => { init(); }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    const [nations, allN] = await Promise.all([
      base44.entities.Nation.filter({ owner_email: u.email }),
      base44.entities.Nation.list("-gdp", 50),
    ]);
    if (!nations[0]) { window.location.href = createPageUrl("Onboarding"); return; }
    const nation = nations[0];
    setNation(nation);
    setAllNations(allN);
    const [bldgs, ags1, ags2] = await Promise.all([
      base44.entities.Building.filter({ nation_id: nation.id }),
      base44.entities.TradeAgreement.filter({ nation_a_id: nation.id }),
      base44.entities.TradeAgreement.filter({ nation_b_id: nation.id }),
    ]);
    setBuildings(bldgs);
    setAgreements([...ags1, ...ags2.filter(a => a.nation_a_id !== nation.id)].filter(a => a.status === "active"));
    setLoading(false);
  }

  async function refresh() {
    if (!user || !nation) return;
    const [nations, allN, bldgs, ags1, ags2] = await Promise.all([
      base44.entities.Nation.filter({ owner_email: user.email }),
      base44.entities.Nation.list("-gdp", 50),
      base44.entities.Building.filter({ nation_id: nation.id }),
      base44.entities.TradeAgreement.filter({ nation_a_id: nation.id }),
      base44.entities.TradeAgreement.filter({ nation_b_id: nation.id }),
    ]);
    setNation(nations[0]);
    setAllNations(allN);
    setBuildings(bldgs);
    setAgreements([...ags1, ...ags2.filter(a => a.nation_a_id !== nation.id)].filter(a => a.status === "active"));
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

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Nation quick stats */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-3 sm:grid-cols-6 gap-3 text-center text-xs">
          {[
            { label: "🌲 Wood",  val: nation?.res_wood  || 0, low: (nation?.res_wood  || 0) < 100 },
            { label: "⛏ Stone", val: nation?.res_stone || 0, low: (nation?.res_stone || 0) < 100 },
            { label: "🥇 Gold",  val: nation?.res_gold  || 0, low: (nation?.res_gold  || 0) < 50  },
            { label: "⚙️ Iron",  val: nation?.res_iron  || 0, low: (nation?.res_iron  || 0) < 50  },
            { label: "🛢️ Oil",   val: nation?.res_oil   || 0, low: (nation?.res_oil   || 0) < 50  },
            { label: "💰 Treasury", val: Math.floor(nation?.currency || 0), low: false },
          ].map(({ label, val, low }) => (
            <div key={label}>
              <div className="text-slate-400">{label}</div>
              <div className={`font-mono font-bold ${low ? "text-orange-400" : "text-white"}`}>{val.toLocaleString()}{low ? " ⚠" : ""}</div>
            </div>
          ))}
        </div>

        {/* Agreements active badge */}
        {agreements.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {agreements.map(ag => (
              <div key={ag.id} className="text-xs px-2.5 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/5 text-yellow-300">
                {ag.agreement_type === "free_trade" ? "🤝" : ag.agreement_type === "embargo" ? "🚫" : "📉"}{" "}
                {ag.agreement_type.replace("_", " ")} w/ {ag.nation_a_id === nation.id ? ag.nation_b_name : ag.nation_a_name} · {ag.cycles_remaining} cycles left
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${tab === t.id
                ? "bg-white/15 border-white/25 text-white"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          {tab === "sell" && (
            marketCount === 0 ? (
              <div className="text-center py-6">
                <div className="text-2xl mb-2">🏪</div>
                <div className="font-bold text-red-400 mb-1">No Active Market</div>
                <p className="text-sm text-slate-400">
                  Build a Market in the{" "}
                  <a href={createPageUrl("ConstructionHub")} className="text-amber-400 underline">Construction Hub</a> to unlock selling.
                </p>
              </div>
            ) : (
              <MarketSellPanel nation={nation} marketCount={marketCount} onRefresh={refresh} />
            )
          )}
          {tab === "routes" && (
            <TradeRoutePanel nation={nation} allNations={allNations} agreements={agreements} onRefresh={refresh} />
          )}
          {tab === "agreements" && (
            <TradeAgreementPanel nation={nation} allNations={allNations} onRefresh={refresh} />
          )}
          {tab === "commodities" && (
            <GlobalCommodityPanel nation={nation} onRefresh={refresh} />
          )}
          {tab === "import" && (
            <ImportPanel nation={nation} agreements={agreements} onRefresh={refresh} />
          )}
        </div>
      </main>
    </div>
  );
}