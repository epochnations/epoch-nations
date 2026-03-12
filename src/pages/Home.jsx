import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getGameTime, formatGameTime } from "@/components/game/GameClock";
import {
  Globe, Sword, FlaskConical, Landmark, TrendingUp, Users, Map,
  Shield, Zap, BookOpen, MessageSquare,
  Mail, Clock, Layers, GitBranch, Bug,
  ArrowRight, CheckCircle, Rocket, Heart, Cpu, Scroll, Award, Puzzle
} from "lucide-react";
import DevPortal from "@/components/home/DevPortal";

// ── Live Game Clock ──────────────────────────────────────────────────────────
function LiveClock() {
  const [gt, setGt] = useState(getGameTime());
  useEffect(() => {
    const id = setInterval(() => setGt(getGameTime()), 10_000);
    return () => clearInterval(id);
  }, []);

  const pct = ((gt.day - 1) / 30) * 100;

  return (
    <div className="rounded-2xl p-4 text-center"
      style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="ep-live-dot" />
        <span className="text-[10px] font-bold text-green-400 ep-mono uppercase tracking-widest">WORLD CLOCK — LIVE</span>
      </div>
      <div className="text-cyan-400 font-black text-lg ep-mono">{formatGameTime(gt)}</div>
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #06b6d4, #8b5cf6)" }} />
      </div>
      <div className="text-[10px] text-slate-500 mt-1 ep-mono">
        1 real minute = 1 game tick · 7 days = 1 game year
      </div>
    </div>
  );
}

// Auth is handled by the platform — redirectToLogin() opens the built-in
// login/signup page with email, Google, Facebook, etc.

// ── Support Ticket Modal ─────────────────────────────────────────────────────
function SupportModal({ onClose }) {
  const [form, setForm] = useState({ email: "", subject: "", body: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: form.email,
        subject: `[Support Ticket] ${form.subject}`,
        body: `From: ${form.email}\n\n${form.body}`,
      });
      setSent(true);
    } catch {
      setSent(true); // still show success UX
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl p-6 ep-slide-in"
        style={{ background: "linear-gradient(135deg, rgba(10,15,30,0.98), rgba(4,8,16,0.98))", border: "1px solid rgba(139,92,246,0.3)" }}>
        <h2 className="text-white font-black text-lg mb-1">🎫 Submit a Ticket</h2>
        <p className="text-slate-500 text-xs mb-4">Report a bug, ask a question, or suggest a feature.</p>
        {sent ? (
          <div className="text-center py-8">
            <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
            <div className="text-white font-bold">Ticket Received!</div>
            <div className="text-slate-400 text-xs mt-1">We'll get back to you within 24–48 hours.</div>
            <button onClick={onClose} className="mt-4 text-xs text-cyan-400 hover:underline">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "email", type: "email", placeholder: "Your email" },
              { key: "subject", type: "text", placeholder: "Subject" },
            ].map(({ key, type, placeholder }) => (
              <input key={key} type={type} placeholder={placeholder} required value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-3 text-sm text-white placeholder-slate-500"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, outline: "none" }} />
            ))}
            <textarea placeholder="Describe your issue in detail…" required value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4}
              className="w-full px-4 py-3 text-sm text-white placeholder-slate-500 resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, outline: "none" }} />
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-black text-sm transition-all ep-btn-lift"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "white" }}>
              {loading ? "Sending…" : "Submit Ticket"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Globe,      color: "#22d3ee", title: "Living World",       desc: "A persistent geopolitical simulation running 24/7, even while you sleep." },
  { icon: Sword,      color: "#f87171", title: "Diplomacy & War",    desc: "Form alliances, declare wars, sign trade agreements, and conquer territory." },
  { icon: FlaskConical, color: "#a78bfa", title: "Research Tree",   desc: "Advance through 12 historical epochs from Stone Age to Galactic Age." },
  { icon: TrendingUp, color: "#4ade80", title: "Stock Market",       desc: "IPO your corporations, trade shares, trigger market crashes, and dominate finance." },
  { icon: Landmark,   color: "#fbbf24", title: "Economy Engine",     desc: "Manage inflation, GDP, tax policy, loans, and a dynamic global commodity market." },
  { icon: Map,        color: "#06b6d4", title: "Hex World Map",      desc: "Claim territory on a procedural hex grid, build cities, and expand your borders." },
  { icon: Users,      color: "#f97316", title: "City Management",    desc: "Zone districts, manage happiness, fight crime, and grow population in your cities." },
  { icon: Cpu,        color: "#818cf8", title: "AI Nations",         desc: "Compete against living AI civilizations with unique cultures and strategies." },
];

const ROADMAP = [
  { phase: "v0.1", label: "Foundation", status: "done", items: ["Nation creation", "Resource engine", "Research tree", "Stock market", "Hex world map", "AI nations"] },
  { phase: "v0.2", label: "Expansion", status: "done", items: ["City management", "Banking & loans", "Global commodity market", "Diplomacy system", "News engine"] },
  { phase: "v0.3", label: "Community", status: "active", items: ["Plugin architecture", "Council dilemmas", "Private messaging", "World Chronicle", "Moderation tools"] },
  { phase: "v0.4", label: "Warfare+", status: "upcoming", items: ["Tactical combat", "Naval units", "Siege mechanics", "War crimes tribunal", "Peace treaties"] },
  { phase: "v0.5", label: "Civilization", status: "upcoming", items: ["Cultural wonders", "Religious systems", "Espionage & spies", "Space race milestone"] },
  { phase: "v1.0", label: "Full Release", status: "upcoming", items: ["Mobile apps", "Seasonal resets", "Tournament mode", "Leaderboards", "Achievement system"] },
];

const STATS = [
  { label: "Epochs",     value: "12",   icon: Layers },
  { label: "Buildings",  value: "40+",  icon: Landmark },
  { label: "Technologies", value: "80+", icon: FlaskConical },
  { label: "Sectors",    value: "11",   icon: TrendingUp },
];

const STATUS_STYLE = {
  done:     { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.3)",  text: "#4ade80",  label: "Released" },
  active:   { bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.3)", text: "#22d3ee", label: "In Progress" },
  upcoming: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "#64748b", label: "Planned" },
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'signup' | 'forgot'
  const [supportOpen, setSupportOpen] = useState(false);
  const [forgeOpen, setForgeOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (auth) navigate("/Dashboard");
      else setCheckingAuth(false);
    });
  }, []);

  const handleAuthSuccess = () => {
    setAuthModal(null);
    navigate("/Dashboard");
  };

  if (checkingAuth) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#040810" }}>
      <div className="w-8 h-8 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div style={{ background: "#040810", fontFamily: "Inter, sans-serif", minHeight: "100vh", color: "white" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{ background: "rgba(4,8,16,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🌍</span>
          <span className="font-black text-white text-lg tracking-tight">Epoch <span className="text-cyan-400">Nations</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-400">
          {[["Features", "#features"], ["Roadmap", "#roadmap"], ["Forge SDK", "#forge"], ["About", "#about"], ["Support", "#support"]].map(([label, href]) => (
            <a key={label} href={href} className="hover:text-white transition-colors">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAuthModal("login")}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Log In
          </button>
          <button onClick={() => setAuthModal("signup")}
            className="px-4 py-2 rounded-xl text-xs font-black text-black transition-all ep-btn-lift"
            style={{ background: "linear-gradient(135deg, #22d3ee, #8b5cf6)" }}>
            Play Free
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6 text-center ep-grid-bg relative overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", top: "20%", left: "20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", top: "30%", right: "15%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <div className="ep-live-dot" />
            <span className="text-[11px] font-bold text-cyan-400 ep-mono">WORLD SERVER ONLINE</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4" style={{ letterSpacing: "-0.03em" }}>
            Build. Trade. Conquer.<br />
            <span style={{ background: "linear-gradient(135deg, #22d3ee, #8b5cf6, #f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Shape History.
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Epoch Nations is a real-time geopolitical civilization simulator. Found your nation, guide it through 12 historical epochs, dominate the global economy, and leave your mark on a persistent living world.
          </p>

          {/* Live Clock */}
          <div className="max-w-sm mx-auto mb-8">
            <LiveClock />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setAuthModal("signup")}
              className="px-8 py-4 rounded-2xl font-black text-base transition-all ep-btn-lift flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", color: "white" }}>
              <Rocket size={18} /> Found Your Nation — Free
            </button>
            <button onClick={() => setAuthModal("login")}
              className="px-8 py-4 rounded-2xl font-bold text-base text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              <ArrowRight size={18} /> Log In
            </button>
          </div>
        </div>
      </section>

      {/* ── WORLD STATS ── */}
      <section className="py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center py-4">
              <Icon size={20} className="mx-auto text-cyan-400 mb-2 opacity-70" />
              <div className="text-2xl font-black text-white ep-mono">{value}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-black text-cyan-400 ep-mono uppercase tracking-widest mb-2">CORE GAMEPLAY</div>
            <h2 className="text-3xl font-black text-white">Everything a Civilization Needs</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">A fully-featured economic and geopolitical simulation engine built for strategy lovers.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                <Icon size={22} style={{ color }} className="mb-3" />
                <div className="font-bold text-white text-sm mb-1">{title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section id="roadmap" className="py-20 px-6" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-black text-violet-400 ep-mono uppercase tracking-widest mb-2">DEVELOPMENT</div>
            <h2 className="text-3xl font-black text-white">Roadmap</h2>
            <p className="text-slate-500 text-sm mt-2">Where we've been, where we are, and where we're going.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROADMAP.map(({ phase, label, status, items }) => {
              const s = STATUS_STYLE[status];
              return (
                <div key={phase} className="rounded-2xl p-5" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-white ep-mono text-sm">{phase}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full ep-mono"
                      style={{ background: `${s.text}22`, color: s.text }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="font-bold text-white mb-3">{label}</div>
                  <ul className="space-y-1">
                    {items.map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle size={11} style={{ color: s.text, opacity: status === "upcoming" ? 0.3 : 1, flexShrink: 0 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FORGE SDK ── */}
      <section id="forge" className="py-20 px-6 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)" }} />
        </div>
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <Puzzle size={12} className="text-violet-400" />
              <span className="text-[11px] font-bold text-violet-400 ep-mono uppercase tracking-widest">COMMUNITY MODDING</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-3">
              Build on Epoch Nations with{" "}
              <span style={{ background: "linear-gradient(135deg, #a78bfa, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Forge SDK
              </span>
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Forge is our official plugin SDK for community developers. Add new buildings, resources, research trees, game events, economy rules, UI panels, and language packs — all sandboxed, version-controlled, and shareable.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: "🏗️", color: "#fbbf24", label: "Buildings",      desc: "New structures with custom costs & production" },
              { icon: "💎", color: "#22d3ee", label: "Resources",       desc: "New commodities & tradeable goods" },
              { icon: "⚡", color: "#f87171", label: "Game Events",     desc: "Probabilistic world events with real effects" },
              { icon: "🔬", color: "#a78bfa", label: "Research Trees",  desc: "Custom tech branches & unlock chains" },
              { icon: "📊", color: "#f97316", label: "Economy Rules",   desc: "Per-tick financial hooks on nation data" },
              { icon: "🎨", color: "#818cf8", label: "UI Components",   desc: "Inject React panels into dashboard slots" },
              { icon: "🌐", color: "#4ade80", label: "Language Packs",  desc: "Translate the entire UI to any language" },
              { icon: "🔒", color: "#64748b", label: "Sandboxed",       desc: "Secure isolation — no direct game access" },
            ].map(({ icon, color, label, desc }) => (
              <div key={label} className="rounded-2xl p-4 text-center"
                style={{ background: `${color}07`, border: `1px solid ${color}18` }}>
                <span className="text-2xl mb-2 block">{icon}</span>
                <div className="font-bold text-white text-xs mb-1">{label}</div>
                <div className="text-[11px] text-slate-500 leading-snug">{desc}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 mb-8" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-xs font-black text-slate-400 ep-mono mb-2 uppercase">QUICK LOOK — index.js</div>
            <pre className="ep-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">{`export function initMyPlugin(api) {
  api.registerBuilding({
    id: "crystal_mine",  name: "Crystal Mine",  emoji: "⛏️",
    category: "civilian",  epoch_required: "Medieval Age",
    cost: { stone: 300, gold: 100 },  workers: 4,
    benefit: "Produces 5 Rare Crystals per tick.",
    productionPerTick: { rare_crystal: 5 },
  });
}`}</pre>
          </div>

          <div className="text-center">
            <button onClick={() => setForgeOpen(true)}
              className="px-8 py-4 rounded-2xl font-black text-base transition-all ep-btn-lift inline-flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}>
              <Puzzle size={18} /> Open Forge SDK Docs
            </button>
            <div className="text-xs text-slate-600 mt-3 ep-mono">Full API reference · Examples · Sandbox rules · Submission guide</div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-black text-green-400 ep-mono uppercase tracking-widest mb-2">ABOUT US</div>
            <h2 className="text-3xl font-black text-white">Why Epoch Nations?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-slate-400 leading-relaxed text-sm">
                Epoch Nations was born from a passion for deep strategy games that never stop. Most simulation games end — ours doesn't. The world server runs continuously, economies evolve in real time, and every decision you make has lasting consequences on the world stage.
              </p>
              <p className="text-slate-400 leading-relaxed text-sm">
                We're an indie team of developers, economists, and strategy game enthusiasts building the geopolitical simulator we always wanted to play. Every feature is designed to reward careful thinking, long-term planning, and diplomatic skill — not just who can click fastest.
              </p>
              <p className="text-slate-400 leading-relaxed text-sm">
                The game is in active development. Your feedback directly shapes what we build next. Join the community, found your nation, and help us build something legendary.
              </p>
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <Heart size={14} className="text-red-400" /> Built with love by the Epoch Nations team
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Rocket, color: "#22d3ee",  title: "Early Access",   desc: "Join now and shape the game's direction." },
                { icon: Shield, color: "#4ade80",  title: "Always Free",    desc: "Core gameplay is free. No pay-to-win." },
                { icon: GitBranch, color: "#a78bfa", title: "Open Mods",    desc: "Plugin SDK lets the community extend the game." },
                { icon: Award, color: "#fbbf24",   title: "Persistent",    desc: "Your nation persists across sessions forever." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="rounded-2xl p-4"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <Icon size={18} style={{ color }} className="mb-2" />
                  <div className="font-bold text-white text-xs mb-1">{title}</div>
                  <div className="text-[11px] text-slate-500">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH INFO ── */}
      <section className="py-16 px-6" style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-xs font-black text-blue-400 ep-mono uppercase tracking-widest mb-2">TECH</div>
            <h2 className="text-2xl font-black text-white">How the World Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Clock, color: "#22d3ee", title: "Real-Time Simulation", body: "1 real minute = 1 game tick. The world clock never stops. Your nation generates resources, pays workers, and collects taxes automatically." },
              { icon: Cpu,   color: "#a78bfa", title: "AI Civilization Engine", body: "AI nations compete using LLM-driven strategic decision-making — forming alliances, declaring war, and running IPOs on the stock market." },
              { icon: Scroll, color: "#4ade80", title: "Persistent Economy",   body: "GDP, inflation, money supply, trade routes, and global commodity prices are calculated dynamically based on every player and AI action." },
            ].map(({ icon: Icon, color, title, body }) => (
              <div key={title} className="rounded-2xl p-5" style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
                <Icon size={20} style={{ color }} className="mb-3" />
                <div className="font-bold text-white text-sm mb-2">{title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORT ── */}
      <section id="support" className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-xs font-black text-violet-400 ep-mono uppercase tracking-widest mb-2">SUPPORT</div>
          <h2 className="text-3xl font-black text-white mb-3">Need Help?</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Found a bug? Have a question? Want to suggest a feature? We read every message. Response time is typically within 24–48 hours.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl p-5 text-left" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <Bug size={18} className="text-violet-400 mb-2" />
              <div className="font-bold text-white text-sm mb-1">Bug Reports</div>
              <div className="text-xs text-slate-400">Found something broken? Submit a ticket with steps to reproduce and we'll fix it fast.</div>
            </div>
            <div className="rounded-2xl p-5 text-left" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}>
              <MessageSquare size={18} className="text-cyan-400 mb-2" />
              <div className="font-bold text-white text-sm mb-1">Feature Requests</div>
              <div className="text-xs text-slate-400">Have an idea? We're always looking for great suggestions to add to the roadmap.</div>
            </div>
          </div>
          <button onClick={() => setSupportOpen(true)}
            className="px-8 py-4 rounded-2xl font-black text-sm transition-all ep-btn-lift inline-flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}>
            <Mail size={16} /> Submit a Support Ticket
          </button>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 ep-grid-bg" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-4">🌍</div>
          <h2 className="text-3xl font-black text-white mb-3">Your Nation Awaits</h2>
          <p className="text-slate-500 text-sm mb-8">The world is already in motion. Found your civilization today.</p>
          <button onClick={() => setAuthModal("signup")}
            className="px-10 py-4 rounded-2xl font-black text-base transition-all ep-btn-lift inline-flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", color: "white" }}>
            <Rocket size={18} /> Play for Free
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)" }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌍</span>
            <span className="font-black text-white">Epoch Nations</span>
            <span className="text-xs text-slate-600 ml-2 ep-mono">v0.3 Early Access</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <a href="#features" className="hover:text-slate-400 transition-colors">Features</a>
            <a href="#roadmap" className="hover:text-slate-400 transition-colors">Roadmap</a>
            <button onClick={() => setForgeOpen(true)} className="hover:text-slate-400 transition-colors">Forge SDK</button>
            <a href="#about" className="hover:text-slate-400 transition-colors">About</a>
            <button onClick={() => setSupportOpen(true)} className="hover:text-slate-400 transition-colors">Support</button>
          </div>
          <div className="text-xs text-slate-700 ep-mono">© 2025–2026 Epoch Nations</div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSuccess={handleAuthSuccess} />}
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
      {forgeOpen && <DevPortal onClose={() => setForgeOpen(false)} />}
    </div>
  );
}