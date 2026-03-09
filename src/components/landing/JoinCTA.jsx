import { createPageUrl } from "@/utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function JoinCTA() {
  const [nationCount, setNationCount] = useState(0);
  const [recentNation, setRecentNation] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.Nation.list("-created_date", 5);
        setNationCount(data.length);
        if (data[0]) setRecentNation(data[0]);
      } catch {}
    }
    load();
  }, []);

  const FEATURES = [
    { icon: "🌍", title: "Lead a Nation", desc: "Found your civilization and guide it from the Stone Age to the Nano Age." },
    { icon: "⚔️", title: "Wage War", desc: "Declare war, launch military campaigns, and conquer rival nations." },
    { icon: "🤝", title: "Form Alliances", desc: "Build coalitions, sign treaties, and forge diplomatic agreements." },
    { icon: "📈", title: "Control Markets", desc: "Trade resources, issue stock, and dominate global commodity markets." },
    { icon: "🔬", title: "Advance Technology", desc: "Research new eras and unlock capabilities that transform your nation." },
    { icon: "🗞️", title: "Shape the Narrative", desc: "Publish propaganda, respond to crises, and build your global reputation." },
  ];

  return (
    <div className="relative py-20 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Recent activity nudge */}
        {recentNation && (
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/20 bg-green-500/8">
              <span>{recentNation.flag_emoji || "🏴"}</span>
              <span className="text-[11px] text-green-400 font-bold">
                {recentNation.name} just joined the world
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
            style={{ background: "linear-gradient(135deg, #22d3ee, #818cf8, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Join the World
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Over <span className="text-white font-bold">{nationCount} nations</span> are already active in the simulation.
            The world is waiting for your leadership.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl p-5 border border-white/08 hover:border-cyan-500/20 transition-all group"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-bold text-white text-sm mb-1 group-hover:text-cyan-300 transition-colors">{f.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <a href={createPageUrl("Onboarding")}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-base tracking-widest transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)", boxShadow: "0 0 60px rgba(6,182,212,0.3), 0 0 120px rgba(139,92,246,0.15)" }}>
            🌍 FOUND YOUR NATION — FREE
          </a>
          <div className="text-[10px] text-slate-600 ep-mono">No credit card required · Start in the Stone Age</div>
        </div>
      </div>
    </div>
  );
}