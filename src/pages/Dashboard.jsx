import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Cpu, Plus, Sliders, ChevronRight, Users } from "lucide-react";

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
  const [activeDilemma, setActiveDilemma] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await base44.auth.me();
    setUser(u);
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

  async function refresh() {
    if (user) await loadMyNation(user.email);
  }

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
    <div className="min-h-screen bg-[#080c14] text-white overflow-hidden relative">
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

          <a
            href={createPageUrl("GlobalChronicles")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all"
          >
            📰 News
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

      {/* BENTO GRID */}
      <main className="relative z-10 p-4 h-[calc(100vh-57px)] grid gap-4"
        style={{
          gridTemplateColumns: "280px 1fr 220px",
          gridTemplateRows: "1fr 200px"
        }}
      >
        {/* LEFT: Nation Stats */}
        <div style={{ gridRow: "1 / 3" }}>
          <NationStatsPanel nation={myNation} />
        </div>

        {/* CENTER: World Map */}
        <div style={{ gridRow: "1 / 2" }}>
          <WorldMap
            myNation={myNation}
            onSelectNation={n => setSelectedNation(n)}
          />
        </div>

        {/* RIGHT: Stock Ticker */}
        <div style={{ gridRow: "1 / 2" }}>
          <StockTicker onSelectStock={s => setSelectedStock(s)} />
        </div>

        {/* BOTTOM CENTER: Global Ledger */}
        <div style={{ gridColumn: "2 / 3", gridRow: "2 / 3" }}>
          <GlobalLedger />
        </div>

        {/* BOTTOM RIGHT: Quick Actions */}
        <div style={{ gridColumn: "3 / 4", gridRow: "2 / 3" }}>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 h-full flex flex-col justify-between">
            <div className="text-xs font-bold text-slate-300 tracking-widest uppercase mb-3">Quick Actions</div>
            <div className="space-y-2 flex-1">
              <button onClick={() => setShowIssueStock(true)} className="w-full py-2 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all flex items-center justify-center gap-1.5">
                <Plus size={12} /> Issue Stock
              </button>
              <button onClick={() => setShowTechTree(true)} className="w-full py-2 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all flex items-center justify-center gap-1.5">
                <Cpu size={12} /> Tech Tree
              </button>
              <button onClick={() => setShowManagement(true)} className="w-full py-2 rounded-xl text-xs font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-1.5">
                <Sliders size={12} /> Budget Cycle
              </button>
            </div>

            {myNation && (
              <div className="mt-3 rounded-xl bg-white/5 p-2.5 text-center">
                <div className="text-xs text-slate-500">Allies</div>
                <div className="font-bold font-mono text-blue-400">{myNation.allies?.length || 0}</div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Responsive mobile bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 backdrop-blur-xl bg-black/80 border-t border-white/10 px-4 py-3 flex gap-2">
        <button onClick={() => setShowIssueStock(true)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400">
          + Stock
        </button>
        <button onClick={() => setShowTechTree(true)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/20 text-violet-400">
          Tech
        </button>
        <button onClick={() => setShowManagement(true)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          Manage
        </button>
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
    </div>
  );
}