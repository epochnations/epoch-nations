import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Cpu, Plus, SlidersHorizontal, Users, Hammer, BookOpen } from "lucide-react";
import AdvancedTutorial from "../components/tutorial/AdvancedTutorial";


import NationStatsPanel from "../components/dashboard/NationStatsPanel";
import StockTicker from "../components/dashboard/StockTicker";
import WorldMap from "../components/dashboard/WorldMap";

import NotificationsPanel from "../components/dashboard/NotificationsPanel";
import StockModal from "../components/modals/StockModal";
import NationModal from "../components/modals/NationModal";
import TechTreePanel from "../components/panels/TechTreePanel";
import BudgetCyclePanel from "../components/panels/BudgetCyclePanel";
import IssueStockPanel from "../components/panels/IssueStockPanel";
import DilemmaEngine from "../components/dashboard/DilemmaEngine";
import CouncilDilemmaModal from "../components/dashboard/CouncilDilemmaModal";
import EconomyEngine from "../components/dashboard/EconomyEngine";
import ResourceEngine from "../components/dashboard/ResourceEngine";
import WorkforcePanel from "../components/panels/WorkforcePanel";
import WorldChat from "../components/dashboard/WorldChat.jsx";
import NationalAdvisorModal from "../components/modals/NationalAdvisorModal";
import WorldEventBroadcaster from "../components/dashboard/WorldEventBroadcaster";
import WorldSimulationEngine from "../components/dashboard/WorldSimulationEngine";
import CivilizationEconomyEngine from "../components/dashboard/CivilizationEconomyEngine";
import LoanRepaymentEngine from "../components/banking/LoanRepaymentEngine";
import GlobalCommodityEngine from "../components/dashboard/GlobalCommodityEngine";
import ResearchEngine from "../components/research/ResearchEngine";
import ResearchPanel from "../components/research/ResearchPanel";
import NationMetricsPanel from "../components/dashboard/NationMetricsPanel";

export default function Dashboard() {
  const [myNation, setMyNation] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedNation, setSelectedNation] = useState(null);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showIssueStock, setShowIssueStock] = useState(false);
  const [showWorkforce, setShowWorkforce] = useState(false);
  const [activeDilemma, setActiveDilemma] = useState(null);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const refreshDebounceRef = useRef(null);
  const userEmailRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
    userEmailRef.current = u.email;
    await loadMyNation(u.email);
    setLoading(false);
  }

  async function loadMyNation(email) {
    const nations = await base44.entities.Nation.filter({ owner_email: email });
    if (nations.length === 0) {
      window.location.href = createPageUrl("Onboarding");
      return;
    }
    setMyNation(nations[0]);
  }

  const refresh = useCallback(() => {
    clearTimeout(refreshDebounceRef.current);
    refreshDebounceRef.current = setTimeout(async () => {
      const email = userEmailRef.current;
      if (email) await loadMyNation(email);
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-slate-400 text-sm tracking-widest uppercase">Loading Command Center...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white relative">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none ep-grid-bg" />
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
      <div className="fixed top-1/2 left-0 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)" }} />

      {/* TOP NAV */}
      <header className="relative z-20 border-b px-6 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(4,8,16,0.72) 100%)", backdropFilter: "blur(24px)", borderColor: "rgba(6,182,212,0.12)" }}>
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter ep-glow-cyan"
            style={{ background: "linear-gradient(90deg, #22d3ee, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            EPOCH NATIONS
          </div>
          <div className="hidden md:flex items-center gap-1 ep-mono text-[10px] text-slate-600">
            <span className="ep-live-dot" />
            <span className="text-green-400 font-bold ml-1">LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick actions */}
          <button
            onClick={() => setShowIssueStock(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all duration-150"
          >
            <Plus size={12} /> Issue Stock
          </button>
          <button
            onClick={() => setShowTechTree(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-all duration-150"
          >
            <Cpu size={12} /> Tech Tree
          </button>
          <button
            onClick={() => setShowResearch(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold hover:bg-fuchsia-500/20 transition-all duration-150"
          >
            🔬 Research
          </button>
          <button
            onClick={() => setShowManagement(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all duration-150"
          >
            <SlidersHorizontal size={12} /> <span className="hidden sm:inline">Manage</span>
          </button>
          <button
            onClick={() => setShowWorkforce(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all duration-150"
          >
            <Users size={12} /> Workers
          </button>
          <a
            href={createPageUrl("GlobalExchange")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold hover:bg-teal-500/20 transition-all duration-150"
          >
            📊 Exchange
          </a>
          <a
            href={createPageUrl("NationwideNews")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all duration-150"
          >
            🏛️ Government
          </a>
          <a
            href={createPageUrl("GlobalChronicles")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-slate-300 transition-all duration-150"
          >
            🌐 Global News
          </a>
          <a
            href={createPageUrl("ConstructionHub")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all duration-150"
          >
            <Hammer size={12} /> Build
          </a>
          <a
            href={createPageUrl("Marketplace")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all duration-150"
          >
            🏪 Marketplace
          </a>
          <a
            href={createPageUrl("NationalProfile")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-all duration-150"
          >
            👤 Profile
          </a>

          {user && myNation && (
            <NotificationsPanel nationId={myNation?.id} ownerEmail={user?.email} />
          )}

          <button
            onClick={() => base44.auth.logout(createPageUrl("Onboarding"))}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 text-xs"
          >
            Exit
          </button>
        </div>
      </header>

      {/* DESKTOP BENTO GRID — 3 cols: [Nation Stats] [World Map + Chat] [Metrics top / Market Feed bottom] */}
      <main className="relative z-10 p-4 hidden lg:grid gap-4" style={{ height: "calc(100vh - 57px)", gridTemplateColumns: "320px 1fr 380px", gridTemplateRows: "1fr 50%", overflow: "hidden" }}>
        {/* Col 1: Nation Stats — full height */}
        <div style={{ gridRow: "1 / 3", overflowY: "auto" }}><NationStatsPanel nation={myNation} /></div>
        {/* Col 2 row 1: World Map */}
        <div style={{ gridRow: "1 / 2", overflow: "hidden" }}>
          <WorldMap myNation={myNation} onSelectNation={n => setSelectedNation(n)} onOpenAdvisor={() => setShowAdvisor(true)} />
        </div>
        {/* Col 2 row 2: World Chat (includes Global Activity tab) */}
        <div style={{ gridColumn: "2 / 3", gridRow: "2 / 3", minWidth: 0, overflow: "hidden" }}>
          <WorldChat myNation={myNation} user={user} />
        </div>
        {/* Col 3 row 1: Nation Metrics (Core Metrics, Fuel, Spending, Technology) */}
        <div style={{ gridRow: "1 / 2", overflowY: "auto" }}>
          <NationMetricsPanel nation={myNation} />
        </div>
        {/* Col 3 row 2: Market Feed (Stock Ticker) */}
        <div style={{ gridRow: "2 / 3", minHeight: 0, overflow: "hidden" }}>
          <StockTicker onSelectStock={s => setSelectedStock(s)} />
        </div>
      </main>

      {/* MOBILE LAYOUT */}
      <main className="relative z-10 lg:hidden flex flex-col pb-28 overflow-y-auto" style={{ minHeight: "calc(100vh - 57px)" }}>
        {/* World Map */}
        <div className="h-52 m-3 rounded-2xl overflow-hidden shrink-0">
          <WorldMap myNation={myNation} onSelectNation={n => setSelectedNation(n)} />
        </div>
        {/* Nation Stats */}
        <div className="mx-3 mb-3">
          <NationStatsPanel nation={myNation} />
        </div>
        {/* World Chat — mobile */}
        <div className="mx-3 mb-3 h-72 shrink-0">
          <WorldChat myNation={myNation} user={user} />
        </div>
        {/* Nation Metrics */}
        <div className="mx-3 mb-3">
          <NationMetricsPanel nation={myNation} />
        </div>
        {/* Stock Ticker */}
        <div className="mx-3 mb-3 h-64 shrink-0">
          <StockTicker onSelectStock={s => setSelectedStock(s)} />
        </div>
      </main>

      {/* Mobile bottom bar — horizontally scrollable */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 backdrop-blur-xl bg-black/90 border-t border-white/10 py-2">
        <div className="flex gap-2 px-3 overflow-x-auto snap-x snap-mandatory pb-1" style={{ scrollbarWidth: "none" }}>
          <a href={createPageUrl("ConstructionHub")} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 min-h-[44px] flex items-center gap-1.5">
            🏗 Build
          </a>
          <button onClick={() => setShowIssueStock(true)} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 min-h-[44px]">
            + Stock
          </button>
          <button onClick={() => setShowTechTree(true)} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/20 text-violet-400 min-h-[44px]">
            🧬 Tech
          </button>
          <button onClick={() => setShowResearch(true)} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 min-h-[44px]">
            🔬 Research
          </button>
          <button onClick={() => setShowManagement(true)} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 min-h-[44px]">
            📊 Manage
          </button>
          <button onClick={() => setShowWorkforce(true)} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 min-h-[44px]">
            👷 Workers
          </button>
          <a href={createPageUrl("GlobalExchange")} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 min-h-[44px] flex items-center gap-1.5">
            📊 Exchange
          </a>
          <a href={createPageUrl("NationwideNews")} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 min-h-[44px] flex items-center gap-1.5">
            🏛️ Government
          </a>
          <a href={createPageUrl("GlobalChronicles")} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-400 min-h-[44px] flex items-center gap-1.5">
            🌐 World
          </a>
          <a href={createPageUrl("Marketplace")} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 min-h-[44px] flex items-center gap-1.5">
            🏪 Market
          </a>

        </div>
      </div>

      {/* Modals */}
      {selectedStock && (
        <StockModal
          stock={selectedStock}
          myNation={myNation}
          onClose={() => setSelectedStock(null)}
          onRefresh={refresh}
        />
      )}
      {selectedNation && (
        <NationModal
          nation={selectedNation}
          myNation={myNation}
          onClose={() => setSelectedNation(null)}
          onRefresh={refresh}
        />
      )}
      {showTechTree && (
        <TechTreePanel
          nation={myNation}
          onRefresh={refresh}
          onClose={() => setShowTechTree(false)}
        />
      )}
      {showManagement && (
        <BudgetCyclePanel
          nation={myNation}
          onRefresh={refresh}
          onClose={() => setShowManagement(false)}
        />
      )}
      {showIssueStock && (
        <IssueStockPanel
          nation={myNation}
          onRefresh={refresh}
          onClose={() => setShowIssueStock(false)}
        />
      )}

      {/* Economy Engine — 60s market pulse + level degradation */}
      {myNation && <EconomyEngine nation={myNation} onRefresh={refresh} />}

      {/* Resource Engine — 60s resource production + population simulation */}
      {myNation && <ResourceEngine nation={myNation} onRefresh={refresh} />}

      {showWorkforce && myNation && (
        <WorkforcePanel
          nation={myNation}
          onClose={() => setShowWorkforce(false)}
          onRefresh={refresh}
        />
      )}

      {/* Dilemma Engine — headless tick scheduler */}
      {myNation && (
        <DilemmaEngine
          nation={myNation}
          onDilemmaReady={(d) => setActiveDilemma(d)}
        />
      )}
      {activeDilemma && myNation && (
        <CouncilDilemmaModal
          dilemma={activeDilemma}
          nation={myNation}
          onClose={() => setActiveDilemma(null)}
          onRefresh={refresh}
        />
      )}

      {/* World Event Broadcaster — pipes NewsEvents, Transactions & debates into chat */}
      {myNation && <WorldEventBroadcaster myNation={myNation} />}

      {/* World Simulation Engine — AI strategic ticks, global events, faction pressure, chronicle */}
      {myNation && <WorldSimulationEngine myNation={myNation} />}

      {/* Civilization Economy Engine — citizen spending, GDP formula, unemployment, national wealth */}
      {myNation && <CivilizationEconomyEngine nation={myNation} onRefresh={refresh} />}

      {/* Loan Repayment Engine — auto-deducts loan payments, handles defaults, pays creditors */}
      {myNation && <LoanRepaymentEngine nation={myNation} onRefresh={refresh} />}

      {/* Global Commodity Engine — admin-only price aggregation tick (runs every 90s) */}
      <GlobalCommodityEngine user={user} />

      {/* Research Engine — advances in-progress research every 90s */}
      {myNation && <ResearchEngine nation={myNation} onRefresh={refresh} />}

      {/* Research Panel */}
      {showResearch && myNation && (
        <ResearchPanel nation={myNation} onClose={() => setShowResearch(false)} />
      )}

      {/* National Advisor Modal */}
      {showAdvisor && myNation && (
        <NationalAdvisorModal nation={myNation} onClose={() => setShowAdvisor(false)} />
      )}

      {/* Tutorial overlay */}
      {showTour && (
        <div className="fixed inset-0 z-[199] bg-black/40 backdrop-blur-sm pointer-events-none" />
      )}
      {showTour && (
        <TourTooltip
          step={tourStep}
          onNext={() => { if (tourStep < 7) setTourStep(t => t + 1); else setShowTour(false); }}
          onPrev={() => setTourStep(t => Math.max(0, t - 1))}
          onSkip={() => setShowTour(false)}
        />
      )}
    </div>
  );
}