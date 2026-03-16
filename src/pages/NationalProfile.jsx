import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Shield, TrendingUp, Swords, BookOpen, Globe, Share2, Landmark } from "lucide-react";
import BankingPanel from "../components/banking/BankingPanel.jsx";
import IdentityHeader from "../components/profile/IdentityHeader.jsx";
import EconomicLedger from "../components/profile/EconomicLedger.jsx";
import WarRoom from "../components/profile/WarRoom.jsx";
import PolicyCenter from "../components/profile/PolicyCenter.jsx";
import NationWikiPanel from "../components/profile/NationWikiPanel.jsx";
import NationSharePanel from "../components/profile/NationSharePanel.jsx";

const TABS = [
  { id: "economy", label: "Economic Ledger", icon: TrendingUp },
  { id: "warroom", label: "War Room", icon: Swords },
  { id: "policy", label: "Policy Center", icon: BookOpen },
  { id: "wiki", label: "Nation Wiki", icon: Globe },
  { id: "share", label: "Share Nation", icon: Share2 },
];

export default function NationalProfile() {
  const [myNation, setMyNation] = useState(null);
  const [myPolicy, setMyPolicy] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [domesticStocks, setDomesticStocks] = useState([]);
  const [allNations, setAllNations] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("economy");
  const [showEpochTransition, setShowEpochTransition] = useState(false);
  const [newEpoch, setNewEpoch] = useState(null);
  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    await loadAll(u.email);
    setLoading(false);
  }

  async function loadAll(email) {
    const nations = await base44.entities.Nation.filter({ owner_email: email });
    if (nations.length === 0) {
      window.location.href = createPageUrl("Onboarding");
      return;
    }
    const nation = nations[0];
    setMyNation(nation);

    const [holdingsData, stocksData, allNationsData, policiesData] = await Promise.all([
      base44.entities.StockHolding.filter({ nation_id: nation.id }),
      base44.entities.Stock.filter({ nation_id: nation.id }),
      base44.entities.Nation.list("-gdp", 30),
      base44.entities.Policy.filter({ nation_id: nation.id })
    ]);
    setHoldings(holdingsData);
    setDomesticStocks(stocksData);
    setAllNations(allNationsData);
    setMyPolicy(policiesData[0] || null);
  }

  function triggerEpochTransition(epoch) {
    setNewEpoch(epoch);
    setShowEpochTransition(true);
    setTimeout(() => {
      setShowEpochTransition(false);
      loadAll(user?.email);
    }, 4000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!myNation) return null;

  const EPOCH_THEME = {
    Industrial: { bg: "bg-amber-900/20", border: "border-amber-500/30", accent: "text-amber-400", label: "⚙️ Industrial" },
    Information: { bg: "bg-blue-900/20", border: "border-blue-500/30", accent: "text-blue-400", label: "💻 Information" },
    Nano: { bg: "bg-violet-900/20", border: "border-violet-500/30", accent: "text-violet-400", label: "🔬 Nano" },
  };
  const theme = EPOCH_THEME[myNation.epoch] || EPOCH_THEME.Industrial;

  return (
    <div className="min-h-screen text-white relative" style={{ background: "#080c14" }}>
      {/* Epoch Transition Overlay */}
      {showEpochTransition && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl bg-black/80">
          <div className="text-center space-y-6 px-8">
            <div className="text-6xl animate-bounce">{newEpoch === "Information" ? "💻" : "🔬"}</div>
            <div className="text-sm tracking-[0.4em] text-slate-400 uppercase animate-pulse">Recalibrating National Infrastructure...</div>
            <div className="w-64 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full animate-[grow_4s_ease-in-out_forwards]"
                style={{ animation: "width 4s ease-in-out forwards", width: "100%" }} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 bg-clip-text text-transparent">
              WELCOME TO THE<br />{newEpoch?.toUpperCase()} AGE
            </h1>
            <div className="text-slate-300 text-sm space-y-1">
              <div>✅ +15% Growth Bonus applied to domestic stocks</div>
              <div>✅ Manufacturing Efficiency +10%</div>
              <div>✅ New tech tree unlocked</div>
            </div>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.015) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      {/* Nav */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/30 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          EPOCH NATIONS
        </div>
        <div className="flex gap-2 items-center">
          <a href={createPageUrl("Dashboard")} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all">
            → Dashboard
          </a>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Identity Header */}
        <IdentityHeader nation={myNation} theme={theme} onRefresh={() => loadAll(user?.email)} />

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "economy" && (
          <EconomicLedger
            nation={myNation}
            holdings={holdings}
            domesticStocks={domesticStocks}
            allNations={allNations}
          />
        )}
        {activeTab === "warroom" && (
          <WarRoom
            nation={myNation}
            allNations={allNations}
            onRefresh={() => loadAll(user?.email)}
          />
        )}
        {activeTab === "policy" && (
          <PolicyCenter
            nation={myNation}
            policy={myPolicy}
            domesticStocks={domesticStocks}
            onRefresh={() => loadAll(user?.email)}
            onEpochAdvance={triggerEpochTransition}
          />
        )}
        {activeTab === "wiki" && (
          <NationWikiPanel
            nation={myNation}
            onRefresh={() => loadAll(user?.email)}
          />
        )}
        {activeTab === "share" && (
          <NationSharePanel
            nation={myNation}
            allNations={allNations}
          />
        )}
      </main>
    </div>
  );
}