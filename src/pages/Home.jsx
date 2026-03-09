import IntelTicker from "../components/landing/IntelTicker";
import HeroSection from "../components/landing/HeroSection";
import LiveWorldMap from "../components/landing/LiveWorldMap";
import GlobalNewsFeed from "../components/landing/GlobalNewsFeed";
import ActivityFeed from "../components/landing/ActivityFeed";
import GlobalMarkets from "../components/landing/GlobalMarkets";
import ActiveConflicts from "../components/landing/ActiveConflicts";
import TopNations from "../components/landing/TopNations";
import JoinCTA from "../components/landing/JoinCTA";
import { createPageUrl } from "@/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#040810] text-white ep-grid-bg-subtle">
      {/* ── Intelligence Ticker ── */}
      <div className="sticky top-0 z-50">
        <IntelTicker />
      </div>

      {/* ── Top Nav ── */}
      <nav className="sticky top-9 z-40 border-b border-white/07"
        style={{ background: "rgba(4,8,16,0.88)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="font-black tracking-tighter text-lg"
            style={{ background: "linear-gradient(90deg, #22d3ee, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            EPOCH NATIONS
          </div>
          <div className="flex items-center gap-2">
            <a href={createPageUrl("GlobalChronicles")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/08 transition-all">
              🌐 World News
            </a>
            <a href={createPageUrl("GlobalExchange")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/08 transition-all">
              📊 Markets
            </a>
            <a href={createPageUrl("WorldChronicle")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/08 transition-all">
              📜 Chronicle
            </a>
            <a href={createPageUrl("Onboarding")}
              className="px-4 py-1.5 rounded-xl text-[11px] font-black border transition-all"
              style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)", border: "none", boxShadow: "0 0 20px rgba(6,182,212,0.2)" }}>
              🌍 Join World
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Live World Map ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <SectionLabel icon="🗺️" label="LIVE WORLD MAP" sub="Real-time nation positions, alliances & conflicts" />
        <LiveWorldMap />
      </section>

      {/* ── News + Activity (2-col) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <SectionLabel icon="📡" label="GLOBAL INTELLIGENCE" sub="Breaking news and live world activity" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlobalNewsFeed />
          <ActivityFeed />
        </div>
      </section>

      {/* ── Markets + Conflicts + Nations (3-col on large) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <SectionLabel icon="⚡" label="GLOBAL STATUS" sub="Markets, conflicts, and power rankings" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <GlobalMarkets />
          <ActiveConflicts />
          <TopNations />
        </div>
      </section>

      {/* ── Join CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="rounded-2xl overflow-hidden border border-cyan-500/15"
          style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(139,92,246,0.04) 100%)" }}>
          <JoinCTA />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/06 py-6 px-6 text-center"
        style={{ background: "rgba(0,0,0,0.4)" }}>
        <div className="font-black tracking-tighter text-sm mb-2"
          style={{ background: "linear-gradient(90deg, #22d3ee, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          EPOCH NATIONS
        </div>
        <div className="text-[10px] text-slate-700 ep-mono">Grand Strategy Simulation · Live Geopolitical World</div>
        <div className="flex items-center justify-center gap-4 mt-3">
          {[
            { href: createPageUrl("Dashboard"), label: "Dashboard" },
            { href: createPageUrl("GlobalExchange"), label: "Exchange" },
            { href: createPageUrl("GlobalChronicles"), label: "World News" },
            { href: createPageUrl("WorldChronicle"), label: "Chronicle" },
            { href: createPageUrl("Marketplace"), label: "Marketplace" },
          ].map(l => (
            <a key={l.label} href={l.href}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors ep-mono">
              {l.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ icon, label, sub }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="text-xl">{icon}</div>
      <div>
        <div className="text-[11px] font-black tracking-widest text-white ep-mono">{label}</div>
        {sub && <div className="text-[9px] text-slate-600 ep-mono">{sub}</div>}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-2" />
    </div>
  );
}