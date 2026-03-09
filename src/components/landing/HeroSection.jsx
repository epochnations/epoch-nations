import { createPageUrl } from "@/utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function HeroSection() {
  const [nationCount, setNationCount] = useState(0);
  const [warCount, setWarCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasNation, setHasNation] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const nations = await base44.entities.Nation.list("-gdp", 100);
      setNationCount(nations.length);
      const atWar = nations.filter(n => (n.at_war_with || []).length > 0).length;
      setWarCount(atWar);
    } catch {}
    try {
      const user = await base44.auth.me();
      if (user) {
        setIsLoggedIn(true);
        const nations = await base44.entities.Nation.filter({ owner_email: user.email });
        setHasNation(nations.length > 0);
      }
    } catch {}
  }

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/6 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)", animation: "ep-float 8s ease-in-out infinite" }} />
        <div className="absolute bottom-1/4 right-1/6 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", animation: "ep-float 10s ease-in-out infinite 2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #1e40af 0%, transparent 70%)" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 ep-grid-bg opacity-60" />
      </div>

      {/* Floating stats */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Live badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10">
          <span className="ep-live-dot" />
          <span className="text-[10px] font-black text-green-400 ep-mono tracking-widest">SIMULATION ACTIVE</span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none"
            style={{
              background: "linear-gradient(135deg, #22d3ee 0%, #818cf8 50%, #a78bfa 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 60px rgba(34,211,238,0.25))"
            }}>
            EPOCH
          </h1>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #f97316 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 60px rgba(245,158,11,0.2))"
            }}>
            NATIONS
          </h1>
        </div>

        <p className="text-slate-400 text-lg sm:text-xl max-w-xl leading-relaxed font-light">
          Lead a nation. Forge alliances.<br />
          Control global resources. Shape the future of the world.
        </p>

        {/* Live world stats */}
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <div className="text-center">
            <div className="text-2xl font-black text-cyan-400 ep-mono">{nationCount}</div>
            <div className="text-[10px] text-slate-600 uppercase tracking-widest">Nations Active</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-black text-red-400 ep-mono">{warCount}</div>
            <div className="text-[10px] text-slate-600 uppercase tracking-widest">Active Conflicts</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-black text-green-400 ep-mono">LIVE</div>
            <div className="text-[10px] text-slate-600 uppercase tracking-widest">Simulation</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          {isLoggedIn && hasNation ? (
            <a href={createPageUrl("Dashboard")}
              className="px-8 py-4 rounded-2xl font-black text-sm tracking-widest transition-all hover:scale-105 min-w-[200px] text-center"
              style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)", boxShadow: "0 0 40px rgba(6,182,212,0.3)" }}>
              ⚡ COMMAND CENTER
            </a>
          ) : (
            <a href={createPageUrl("Onboarding")}
              className="px-8 py-4 rounded-2xl font-black text-sm tracking-widest transition-all hover:scale-105 min-w-[200px] text-center"
              style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)", boxShadow: "0 0 40px rgba(6,182,212,0.3)" }}>
              🌍 CREATE YOUR NATION
            </a>
          )}
          {!isLoggedIn && (
            <a href={createPageUrl("Onboarding")}
              className="px-8 py-4 rounded-2xl font-black text-sm tracking-widest border border-white/20 bg-white/5 hover:bg-white/10 transition-all min-w-[200px] text-center text-slate-300">
              🔐 LOGIN
            </a>
          )}
        </div>

        {/* Scroll hint */}
        <div className="text-slate-700 text-xs ep-mono animate-bounce mt-4">↓ OBSERVE THE LIVING WORLD ↓</div>
      </div>
    </div>
  );
}