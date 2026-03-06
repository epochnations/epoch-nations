import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Cpu, Plus, Sliders, Users, Hammer } from "lucide-react";


import NationStatsPanel from "../components/dashboard/NationStatsPanel";
import StockTicker from "../components/dashboard/StockTicker";
import WorldMap from "../components/dashboard/WorldMap";
import GlobalLedger from "../components/dashboard/GlobalLedger";
import NotificationsPanel from "../components/dashboard/NotificationsPanel";
import StockModal from "../components/modals/StockModal";
import NationModal from "../components/modals/NationModal";
import TechTreePanel from "../components/panels/TechTreePanel";
import NationManagement from "../components/panels/NationManagement";
import IssueStockPanel from "../components/panels/IssueStockPanel";
import DilemmaEngine from "../components/dashboard/DilemmaEngine";
import CouncilDilemmaModal from "../components/dashboard/CouncilDilemmaModal";
import EconomyEngine from "../components/dashboard/EconomyEngine";
import NationalAdvisorPanel from "../components/dashboard/NationalAdvisorPanel";
import ResourceEngine from "../components/dashboard/ResourceEngine";
import WorkforcePanel from "../components/panels/WorkforcePanel";

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
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />
      {/* Glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP NAV */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-black/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            EPOCH NATIONS
          </div>
          {myNation && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <span>{myNation.flag_emoji}</span>
              <span className="text-sm font-bold text-white">{myNation.name}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{myNation.epoch} Era</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick actions */}
          <button
            onClick={() => setShowIssueStock(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
          >
            <Plus size={12} /> Issue Stock
          </button>
          <button
            onClick={() => setShowTechTree(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-all"
          >
            <Cpu size={12} /> Tech Tree
          </button>
          <button
            onClick={() => setShowManagement(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all"
          >
            <Sliders size={12} /> <span className="hidden sm:inline">Manage</span>
          </button>
          <button
            onClick={() => setShowWorkforce(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
          >
            <Users size={12} /> Workers
          </button>

          <a
            href={createPageUrl("GlobalChronicles")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all"
          >
            📰 News
          </a>
          <a
            href={createPageUrl("ConstructionHub")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
          >
            <Hammer size={12} /> Build
          </a>
          <a
            href={createPageUrl("NationalProfile")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-all"
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

      {/* DESKTOP BENTO GRID */}
      <main className="relative z-10 p-4 hidden lg:grid gap-4" style={{ height: "calc(100vh - 57px)", gridTemplateColumns: "300px 1fr 300px", gridTemplateRows: "1fr 240px", overflow: "hidden" }}>
        <div style={{ gridRow: "1 / 3", overflowY: "auto" }}><NationStatsPanel nation={myNation} /></div>
        <div style={{ gridRow: "1 / 2", overflow: "hidden" }}><WorldMap myNation={myNation} onSelectNation={n => setSelectedNation(n)} /></div>
        <div style={{ gridRow: "1 / 2", overflowY: "auto" }}><StockTicker onSelectStock={s => setSelectedStock(s)} /></div>
        <div style={{ gridColumn: "2 / 3", gridRow: "2 / 3", minWidth: 0, overflowY: "auto" }}><GlobalLedger /></div>
        <div style={{ gridColumn: "3 / 4", gridRow: "2 / 3", minHeight: 0, overflow: "hidden" }}>
          {myNation && <NationalAdvisorPanel nation={myNation} />}
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
        {/* Stock Ticker */}
        <div className="mx-3 mb-3 h-64 shrink-0">
          <StockTicker onSelectStock={s => setSelectedStock(s)} />
        </div>
        {/* Global Ledger */}
        <div className="mx-3 mb-3">
          <GlobalLedger />
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
            🔬 Tech
          </button>
          <button onClick={() => setShowManagement(true)} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 min-h-[44px]">
            📊 Manage
          </button>
          <button onClick={() => setShowWorkforce(true)} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 min-h-[44px]">
            👷 Workers
          </button>
          <a href={createPageUrl("GlobalChronicles")} className="snap-start shrink-0 px-4 py-3 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-400 min-h-[44px] flex items-center gap-1.5">
            📰 News
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
        <NationManagement
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

      {/* National AV Advisor — desktop sidebar slot */}
      
    </div>
  );
}