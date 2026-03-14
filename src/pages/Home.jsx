import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getGameTime, formatGameTime } from "@/components/game/GameClock";
import {
  Globe, Sword, FlaskConical, Landmark, TrendingUp, Users, Map,
  Shield, Zap, BookOpen, MessageSquare,
  Mail, Clock, Layers, GitBranch, Bug,
  ArrowRight, CheckCircle, Rocket, Heart, Cpu, Scroll, Award, Puzzle, Github,
  ChevronDown, ChevronUp, ChevronRight
} from "lucide-react";
import DevPortal from "@/components/home/DevPortal";

// ── Live Game Clock ──────────────────────────────────────────────────────────
function LiveClock() {
  const [gt, setGt] = useState(getGameTime());
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => { setGt(getGameTime()); setTick(t => t + 1); }, 10_000);
    return () => clearInterval(id);
  }, []);

  const dayPct   = ((gt.day   - 1) / 30)  * 100;
  const monthPct = ((gt.month - 1) / 12)  * 100;
  const yearPct  = (gt.year   % 10) / 10  * 100;

  const segments = [
    { label: "DAY",   value: gt.day,   max: 30,  pct: dayPct,   color: "#22d3ee",  glow: "rgba(34,211,238,0.4)" },
    { label: "MONTH", value: gt.month, max: 12,  pct: monthPct, color: "#818cf8",  glow: "rgba(129,140,248,0.4)" },
    { label: "YEAR",  value: gt.year,  max: null, pct: yearPct,  color: "#f59e0b",  glow: "rgba(245,158,11,0.4)" },
  ];

  return (
    <div className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(139,92,246,0.06) 50%, rgba(245,158,11,0.04) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 40px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.05)"
      }}>
      {/* Subtle animated bg glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4 relative">
        <div className="ep-live-dot" />
        <span className="text-[10px] font-black ep-mono tracking-[0.2em] uppercase"
          style={{ background: "linear-gradient(90deg,#22d3ee,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          WORLD CLOCK — LIVE
        </span>
      </div>

      {/* Big epoch display */}
      <div className="text-center mb-5 relative">
        <div className="text-[10px] text-slate-600 ep-mono uppercase tracking-widest mb-1">CURRENT EPOCH</div>
        <div className="font-black text-2xl ep-mono"
          style={{ background: "linear-gradient(135deg, #22d3ee 0%, #818cf8 50%, #f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          YEAR {gt.year}
        </div>
        <div className="text-slate-400 text-xs ep-mono mt-0.5">
          Month {gt.month} · Week {gt.week} · Day {gt.day}
        </div>
      </div>

      {/* Circular / arc indicators */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {segments.map(({ label, value, max, pct, color, glow }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle cx="28" cy="28" r="23" fill="none"
                  stroke={color} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 23}`}
                  strokeDashoffset={`${2 * Math.PI * 23 * (1 - pct / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 4px ${glow})` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black ep-mono" style={{ color }}>{value}</span>
              </div>
            </div>
            <span className="text-[9px] font-black ep-mono tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Linear tick bar */}
      <div className="relative">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all duration-[2s]"
            style={{
              width: `${dayPct}%`,
              background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #f59e0b)",
              boxShadow: "0 0 8px rgba(34,211,238,0.6)"
            }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] ep-mono text-slate-700">Day 1</span>
          <span className="text-[9px] ep-mono text-slate-700">Day 30</span>
        </div>
      </div>

      <div className="text-center mt-2">
        <span className="text-[10px] text-slate-600 ep-mono">1 min = 1 tick · 7 days = 1 game year</span>
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
  { icon: Map,        color: "#06b6d4", title: "Interactive World Map", desc: "Claim territory, expand your borders, build cities, and project military power across a living world map." },
  { icon: Users,      color: "#f97316", title: "City Management",    desc: "Zone districts, manage happiness, fight crime, and grow population in your cities." },
  { icon: Cpu,        color: "#818cf8", title: "AI Nations",         desc: "Compete against living AI civilizations with unique cultures and strategies." },
];

const ROADMAP = [
  { phase: "v0.1", label: "Foundation", status: "done", items: ["Nation creation", "Resource engine", "Research tree", "Stock market", "Interactive world map", "AI nations"] },
  { phase: "v0.2", label: "Expansion", status: "done", items: ["City management", "Banking & loans", "Global commodity market", "Diplomacy system", "News engine"] },
  { phase: "v0.3", label: "Community", status: "active", items: ["Plugin architecture", "Council dilemmas", "Private messaging", "World Chronicle", "Moderation tools"] },
  { phase: "v0.4", label: "Warfare+", status: "upcoming", items: ["Tactical combat", "Naval units", "Siege mechanics", "War crimes tribunal", "Peace treaties"] },
  { phase: "v0.5", label: "Civilization", status: "upcoming", items: ["Cultural wonders", "Religious systems", "Espionage & spies", "Space race milestone"] },
  { phase: "v1.0", label: "Full Release", status: "upcoming", items: ["Mobile apps", "Seasonal resets", "Tournament mode", "Leaderboards", "Achievement system"] },
];

const STATS = [
  { label: "Epochs",     value: "12",    icon: Layers },
  { label: "Buildings",  value: "40+",   icon: Landmark },
  { label: "Technologies", value: "80+", icon: FlaskConical },
  { label: "Unique Items", value: "1,400+", icon: BookOpen },
];

const STATUS_STYLE = {
  done:     { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.3)",  text: "#4ade80",  label: "Released" },
  active:   { bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.3)", text: "#22d3ee", label: "In Progress" },
  upcoming: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "#64748b", label: "Planned" },
};

// ── Tutorial Data ─────────────────────────────────────────────────────────────
const TUTORIAL_TOPICS = [
  { icon: "🏛️", color: "#22d3ee", title: "Dashboard Overview", summary: "Your command center — everything starts here.", lessons: [
    { title: "The Command Center", body: "The Dashboard is your central hub divided into three main columns: Nation Stats (left), World Map + Chat (center), and Nation Metrics + Stock Feed (right). Every panel updates in real time — 1 real minute = 1 game tick.", tip: "The header bar contains quick-action buttons for all major game systems. On mobile, use the bottom scroll bar." },
    { title: "Top Navigation Bar", body: "The top bar houses your most important shortcuts: Issue Stock, Tech Tree, Research, Manage, Workers, Exchange, Government, Global News, Build, Marketplace, and Profile.", tip: "On desktop all buttons are visible. On mobile they scroll horizontally in the bottom bar." },
    { title: "Dashboard Layout", body: "The dashboard uses a 3-column bento layout on desktop. Left: Nation Stats. Center: World Map + Chat. Right: Metrics + Stock Ticker. On mobile it stacks vertically.", tip: "Spend a few minutes exploring each panel before diving into game actions." },
    { title: "Tutorial & Help Button", body: "The '📖 Tutorial' button in the top bar opens the full guide at any time. You can jump between sections and re-read any topic.", tip: "There's a lot to learn — you don't need to memorize it all at once." },
  ]},
  { icon: "📊", color: "#4ade80", title: "Nation Stats Panel", summary: "Your nation's vital signs — GDP, stability, resources & more.", lessons: [
    { title: "Epoch & Tech Progress", body: "The top of the Nation Stats panel shows your current Epoch and a progress bar toward the next epoch. Advancing epochs unlocks new buildings, units, resources, and economic systems.", tip: "Rushing to the next epoch is tempting, but make sure your economy is stable first — each epoch increases costs." },
    { title: "Population & Housing", body: "Population grows automatically when food is abundant and housing has capacity. More population = more workers = more production.", tip: "If housing is near capacity, your population growth will stall. Always build ahead of demand." },
    { title: "Treasury & Currency", body: "Your treasury (Credits) is the money your government holds. It increases from taxes and decreases from spending. Running out causes stability penalties.", tip: "Keep at least 200 Credits in reserve as an emergency buffer. Bankruptcy causes severe stability crashes." },
    { title: "GDP & Economic Growth", body: "GDP represents your nation's total economic output. It grows from manufacturing, trade routes, population, and buildings.", tip: "GDP growth is compounding — small investments now pay off massively later." },
    { title: "Resources", body: "Wood and Stone are needed for construction. Gold fuels your economy. Iron and Oil unlock in later epochs. Food is consumed by your population every tick.", tip: "Always maintain at least 3–4 days of food reserves. Run out and your people start starving!" },
    { title: "Stability & Public Trust", body: "Stability (0–100) governs your nation's political health. Public Trust (0.1–2.0) multiplies tax effectiveness. Low stability triggers crises.", tip: "Keep stability above 50 at all times. Below 40 and your GDP starts to drag noticeably." },
  ]},
  { icon: "👷", color: "#f97316", title: "Workers & Resources", summary: "Assign your citizens to produce everything your nation needs.", lessons: [
    { title: "The Workforce Panel", body: "Open Workers from the top bar to assign your population to different roles. Each role produces a specific resource every game tick. Unassigned workers are unemployed.", tip: "Total assigned workers cannot exceed your population." },
    { title: "Farmers & Food Production", body: "Farmers produce Food each tick. Food is consumed by your entire population automatically. Assign at least 2–3 farmers per 10 population.", tip: "A Granary building doubles your food storage cap." },
    { title: "Miners & Lumberjacks", body: "Lumberjacks produce Wood. Quarry Workers produce Stone. Miners produce Gold. Later you'll unlock Iron Miners (Iron Age) and Oil Engineers (Industrial Age).", tip: "Don't neglect Gold Miners — gold is your economic lifeline for trading." },
    { title: "Researchers", body: "Researchers generate Tech Points every tick, which you spend in the Tech Tree to unlock upgrades and advance epochs.", tip: "Unlock the Library and University buildings to massively boost tech point generation." },
    { title: "Soldiers", body: "Soldiers contribute to your Military Power and Defense Level. Only assign them if you're in a war or actively preparing for one.", tip: "Soldiers don't produce economic goods." },
  ]},
  { icon: "💰", color: "#fbbf24", title: "Economy & Budget", summary: "Tax, spend, inflate, and grow — master the economic engine.", lessons: [
    { title: "Budget & Manage Panel", body: "Open Manage to set your Income Tax, Sales Tax, Corporate Tax, and Tariff rates. Also control Military and Education Spending.", tip: "Changes take effect on the next economic tick (~60 seconds). Plan ahead." },
    { title: "Inflation & Money Supply", body: "Inflation rises when your money supply grows faster than goods production. High inflation (above 10%) increases all costs. Keep it below 8%.", tip: "Reduce inflation by cutting spending, raising taxes, or improving manufacturing output." },
    { title: "Banking & Loans", body: "Access Banking through Marketplace. You can take Short-Term Loans, Development Loans, or issue Sovereign Bonds. Defaulting destroys your credit rating.", tip: "Only take loans if you have a clear plan to repay them." },
    { title: "Trade Balance", body: "Trade Balance = Exports - Imports. A positive balance adds credits each tick. A negative balance drains it. Set up Trade Routes to control this.", tip: "Export your surplus resources. Import only what you critically lack." },
  ]},
  { icon: "🏗️", color: "#a78bfa", title: "Construction Hub", summary: "Build infrastructure that powers your civilization's growth.", lessons: [
    { title: "The Construction Hub", body: "Every building requires specific resources and may require a minimum Epoch. Buildings provide permanent passive bonuses — production boosts, population capacity, tech generation.", tip: "Construction costs scale with inflation. Build during low-inflation periods." },
    { title: "Priority Buildings — Early Game", body: "In the Stone Age, prioritize: Granary (food storage), Farm (food production), Quarry (stone), Lumberyard (wood), and Housing (population cap). Build a School ASAP.", tip: "Don't over-build military structures before Bronze Age." },
    { title: "Building Levels", body: "Buildings can be upgraded to multiply their bonuses. A Level 2 Farm produces significantly more food than Level 1.", tip: "It's generally better to upgrade existing buildings than to build many level-1 structures." },
  ]},
  { icon: "🔬", color: "#818cf8", title: "Tech Tree & Research", summary: "Advance through 12 epochs and unlock powerful technologies.", lessons: [
    { title: "Tech Points & the Tech Tree", body: "Click 'Tech Tree' to see all available technologies. Each tech costs Tech Points and may have prerequisites. Unlocking techs provides direct bonuses.", tip: "Focus on techs in a single branch before branching out — synergies compound quickly." },
    { title: "The Research Panel", body: "The Research Panel is for advanced projects. Assign Researchers in the Workforce Panel and queue up projects. Completed research gives major breakthroughs.", tip: "Being FIRST to discover a breakthrough gives you a diplomatic advantage." },
    { title: "Advancing Epochs", body: "When you've unlocked all required techs and have sufficient Tech Points, you'll see an 'Advance Epoch' button. 12 epochs: Stone → Bronze → Iron → Classical → Medieval → Renaissance → Industrial → Modern → Digital → Information → Space → Galactic.", tip: "Prepare your economy before advancing — each epoch increases costs and complexity." },
  ]},
  { icon: "🗺️", color: "#06b6d4", title: "World Map & Territory", summary: "Claim land, see your rivals, and project power across the globe.", lessons: [
    { title: "The Interactive World Map", body: "The center panel shows a live world map with all nations' territories marked. Your hexagonal tiles are highlighted. Click any nation to view their stats.", tip: "Zoom in to see individual hex tiles with terrain and resource info." },
    { title: "Hex Tiles & Terrain", body: "Each hex has a terrain type (plains, forest, mountains, coastal, desert, ocean, tundra) that affects its resource deposits and strategic value.", tip: "Coastal hexes are valuable for trade. Mountain hexes are defensible." },
    { title: "Claiming Territory", body: "Expand by claiming adjacent hex tiles. Unclaimed tiles are available for free. Claimed tiles belonging to others require military conquest.", tip: "Don't expand faster than you can protect your borders." },
  ]},
  { icon: "⚔️", color: "#f87171", title: "Diplomacy & War", summary: "Form alliances, trade, negotiate — or conquer.", lessons: [
    { title: "Nation Interaction", body: "Click any nation to view their profile. From there you can offer alliances, propose trade agreements, declare war, send aid, or negotiate peace.", tip: "Check a nation's military power before declaring war." },
    { title: "Alliances", body: "Allied nations defend each other when attacked. They can also share trade routes and exchange resources more easily.", tip: "Don't ally with everyone — alliances mean you share their wars too." },
    { title: "Declaring War", body: "When at war, both nations suffer stability penalties every tick. You can launch attacks to destroy enemy buildings, steal resources, and reduce their stability.", tip: "War drains stability, treasury, and food. Only declare if you have reserves to sustain the conflict." },
    { title: "Peace Negotiations", body: "Either party in a war can propose peace at any time. Peace terms can include resource or credit transfers. Wars auto-expire after ~3.5 hours.", tip: "The ideal time to offer peace is after landing your strongest attacks — lock in your advantage." },
  ]},
  { icon: "📈", color: "#4ade80", title: "Stock Market & Exchange", summary: "IPO companies, trade shares, trigger crashes — dominate finance.", lessons: [
    { title: "Issuing Stock (IPO)", body: "Click 'Issue Stock' to list a new company. You choose the name, sector, number of shares, and listing price. Your price is used directly.", tip: "A stronger economy = more investor confidence in your stocks." },
    { title: "Global Exchange", body: "The Global Exchange shows all listed stocks from all nations. Buy and sell shares. Stock prices fluctuate based on the issuing nation's economic health.", tip: "Invest in nations with low inflation, high GDP growth, and stable government." },
    { title: "Market Crashes", body: "If a nation enters severe economic distress, their stocks may crash — dropping 50-90% in value instantly.", tip: "Diversify your stock holdings across multiple nations and sectors." },
  ]},
  { icon: "💬", color: "#22d3ee", title: "World Chat & Communication", summary: "Talk to every civilization — negotiate, threaten, or trade in real time.", lessons: [
    { title: "Global, Allies & System Channels", body: "World Chat has three channels: Global (all players), Allies (only your allied nations), and System (official announcements). The Activity tab shows the live Global Ledger.", tip: "Check the System channel regularly for important world events." },
    { title: "Chat Commands", body: "Type commands in chat: /trade @Nation to propose a trade, /ally @Nation for alliance, /war @Nation to declare war, /aid @Nation to send economic aid.", tip: "Commands use the exact nation name. Type '@' first to see autocomplete." },
    { title: "Private Messaging", body: "Click the 🔒 lock icon to open Private Messages for confidential diplomatic communications. Great for secret alliances and peace negotiations.", tip: "Private messages are ideal for backdoor diplomacy." },
  ]},
  { icon: "🏙️", color: "#f59e0b", title: "City Management", summary: "Zone districts, manage happiness, build services — grow your cities.", lessons: [
    { title: "Founding a City", body: "Found cities on your hex tiles. Each city has its own population, budget, happiness score, crime rate, and service infrastructure.", tip: "Your first city should be on a fertile hex tile near resources." },
    { title: "Zoning", body: "Allocate land into three zones: Residential (houses citizens), Commercial (tax revenue and happiness), Industrial (manufacturing and pollution).", tip: "Too much industrial zoning raises pollution and lowers happiness." },
    { title: "City Services", body: "Build Schools, Hospitals, Police Stations, and Fire Departments. More services = higher education, better health, lower crime.", tip: "Police Stations reduce crime. High crime lowers national public trust." },
    { title: "City Events", body: "Cities generate random events: immigration waves, disease outbreaks, crimes, protests. Left unresolved, negative events cascade into national crises.", tip: "Check the City Events tab regularly." },
  ]},
  { icon: "🏪", color: "#34d399", title: "Marketplace & Trade", summary: "Buy resources, trade routes, global commodity markets.", lessons: [
    { title: "The Marketplace", body: "Buy and sell resources on the Global Commodity Market. Prices fluctuate based on worldwide supply and demand. Shortages spike prices. Surpluses crash them.", tip: "Buy resources when prices are low, not when you're desperate." },
    { title: "Trade Routes", body: "Set up recurring Trade Routes with other nations. Define the resource, quantity per cycle, and price. Routes automatically transfer resources and credits every tick.", tip: "Trade Routes with Allied nations get a tariff discount." },
    { title: "Crafting Marketplace", body: "The Crafting Market tab lets players buy and sell crafted items with Credits. List your items, browse other nations' offerings, and build your trading empire.", tip: "Rare and high-tier items command premium prices in the crafting marketplace." },
  ]},
];

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [supportOpen, setSupportOpen] = useState(false);
  const [forgeOpen, setForgeOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [openTopic, setOpenTopic] = useState(null);
  const [openLesson, setOpenLesson] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (auth) navigate("/Dashboard");
      else setCheckingAuth(false);
    });
  }, []);

  const goToLogin = () => base44.auth.redirectToLogin("/Dashboard");

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
          {[["Features", "#features"], ["Tutorial", "#tutorial"], ["Roadmap", "#roadmap"], ["Forge SDK", "#forge"], ["About", "#about"], ["Support", "#support"]].map(([label, href]) => (
            <a key={label} href={href} className="hover:text-white transition-colors">{label}</a>
          ))}
          <a href="https://github.com/epochnations" target="_blank" rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1">
            <Github size={13} /> GitHub
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToLogin}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Log In
          </button>
          <button onClick={goToLogin}
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
            Epoch Nations is a real-time geopolitical civilization simulator. Create your nation, guide it through 12 historical epochs, dominate the global economy, and leave your mark on a persistent living world.
          </p>

          {/* Live Clock */}
          <div className="max-w-sm mx-auto mb-6">
            <LiveClock />
          </div>

          {/* Encyclopedia Highlight */}
          <a href="/ItemEncyclopedia"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl mb-8 transition-all hover:scale-[1.02]"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)" }}>
            <BookOpen size={16} className="text-violet-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-black text-violet-400 ep-mono uppercase tracking-widest">Item Encyclopedia</div>
              <div className="text-sm font-bold text-white">Explore <span className="text-violet-300">1,400+ unique craftable items</span> across 18 categories</div>
            </div>
            <ArrowRight size={14} className="text-violet-400 shrink-0" />
          </a>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={goToLogin}
              className="px-8 py-4 rounded-2xl font-black text-base transition-all ep-btn-lift flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", color: "white" }}>
              <Rocket size={18} /> Create Nation — Free
            </button>
            <button onClick={goToLogin}
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

      {/* ── FULL TUTORIAL SECTION ── */}
      <section id="tutorial" className="py-20 px-6" style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-black text-amber-400 ep-mono uppercase tracking-widest mb-2">LEARNING CENTER</div>
            <h2 className="text-3xl font-black text-white mb-3">Master Every System</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">Click any topic to explore the full guide — no account needed.</p>
          </div>
          <div className="space-y-2 mb-8">
            {TUTORIAL_TOPICS.map((topic, ti) => {
              const isOpen = openTopic === ti;
              return (
                <div key={topic.title} className="rounded-2xl overflow-hidden transition-all"
                  style={{ border: `1px solid ${isOpen ? topic.color + "40" : "rgba(255,255,255,0.07)"}`, background: isOpen ? `${topic.color}06` : "rgba(255,255,255,0.02)" }}>
                  {/* Topic Header */}
                  <button
                    onClick={() => { setOpenTopic(isOpen ? null : ti); setOpenLesson(null); }}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all hover:bg-white/5">
                    <span className="text-2xl shrink-0">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">{topic.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{topic.summary}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] ep-mono px-2 py-0.5 rounded-full"
                        style={{ background: `${topic.color}18`, color: topic.color }}>
                        {topic.lessons.length} lessons
                      </span>
                      {isOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                    </div>
                  </button>

                  {/* Expanded lessons */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-2">
                          {topic.lessons.map((lesson, li) => {
                            const lOpen = openLesson === `${ti}-${li}`;
                            return (
                              <div key={lesson.title} className="rounded-xl overflow-hidden"
                                style={{ border: `1px solid ${lOpen ? topic.color + "30" : "rgba(255,255,255,0.06)"}`, background: lOpen ? `${topic.color}08` : "rgba(255,255,255,0.02)" }}>
                                <button
                                  onClick={() => setOpenLesson(lOpen ? null : `${ti}-${li}`)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left">
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                                    style={{ background: `${topic.color}25`, color: topic.color }}>
                                    {li + 1}
                                  </span>
                                  <span className="flex-1 text-xs font-bold text-white">{lesson.title}</span>
                                  {lOpen ? <ChevronUp size={12} className="text-slate-600 shrink-0" /> : <ChevronRight size={12} className="text-slate-600 shrink-0" />}
                                </button>
                                <AnimatePresence>
                                  {lOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden">
                                      <div className="px-4 pb-4 space-y-3">
                                        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                          <div className="text-xs text-slate-300 leading-relaxed">{lesson.body}</div>
                                        </div>
                                        {lesson.tip && (
                                          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                                            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                                            <span className="text-amber-400 shrink-0 text-sm">💡</span>
                                            <div className="text-[11px] text-amber-200/80 leading-relaxed">{lesson.tip}</div>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <button onClick={goToLogin}
              className="px-8 py-4 rounded-2xl font-black text-sm transition-all ep-btn-lift inline-flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "black" }}>
              <BookOpen size={16} /> Play & Access Full In-Game Tutorial
            </button>
            <div className="text-xs text-slate-600 mt-2 ep-mono">Full tutorial with Deep Dives available in-game via the 📖 Tutorial button</div>
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
          <p className="text-slate-500 text-sm mb-8">The world is already in motion. Create your nation today.</p>
          <button onClick={goToLogin}
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
            <a href="https://github.com/epochnations" target="_blank" rel="noopener noreferrer"
              className="hover:text-slate-400 transition-colors flex items-center gap-1">
              <Github size={11} /> GitHub
            </a>
          </div>
          <div className="text-xs text-slate-700 ep-mono">© 2025–2026 Epoch Nations</div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
      {forgeOpen && <DevPortal onClose={() => setForgeOpen(false)} />}
    </div>
  );
}