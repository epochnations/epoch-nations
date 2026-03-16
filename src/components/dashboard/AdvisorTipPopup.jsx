/**
 * AdvisorTipPopup — Kingdom Quest-style advisor tip popups.
 * Appears randomly while playing, never repeats a tip.
 * Tracks seen tips in localStorage per nation.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

// ── TIP LIBRARY ───────────────────────────────────────────────────────────────
const TIPS = [
  // Economy
  { id: "e01", icon: "💰", category: "Economy",    title: "Treasury Buffer", body: "Keep at least 300 Credits in your treasury at all times. If it drops below that, a single war attack or unexpected cost could push you into bankruptcy — and that crashes your stability by 5 points every tick until you recover." },
  { id: "e02", icon: "📊", category: "Economy",    title: "GDP is King", body: "Your GDP determines how much tax revenue you collect per tick. Doubling your GDP at the same tax rate doubles your income. Invest in manufacturing buildings, trade routes, and population growth — the returns compound every tick, forever." },
  { id: "e03", icon: "📉", category: "Economy",    title: "Inflation Warning", body: "When inflation rises above 8%, your construction costs start climbing. Above 15%, you're paying 25% more for every building. Fight inflation by raising corporate tax slightly, cutting government spending, or boosting manufacturing output." },
  { id: "e04", icon: "🏦", category: "Economy",    title: "Smart Borrowing", body: "Development Loans are your best borrowing option mid-game. A 1,000-credit loan at 10% interest that funds 3 factories will generate many times the cost in GDP — as long as you have a clear repayment plan. Never borrow without one." },
  { id: "e05", icon: "💱", category: "Economy",    title: "Currency Stability", body: "Your currency stability multiplier (0.1–2.0) affects everything economic. Above 1.5, citizens spend more freely. Below 0.5, your economy is in depression. Keep inflation low and maintain trade surpluses to strengthen it over time." },
  { id: "e06", icon: "🏭", category: "Economy",    title: "Manufacturing Index", body: "The Manufacturing Index multiplies your GDP from industrial output. A Factory building adds directly to it. Once you hit Industrial Age, building your first Factory is the single most impactful economic action available to you." },
  { id: "e07", icon: "✂️", category: "Economy",    title: "Tax Cut Timing", body: "The Tax Cuts policy reduces revenue by 8% but boosts consumer spending by 10% — a net GDP gain if your economy is sluggish. Turn it on during recessions or after wars to restart growth. Turn it off when you need to rebuild reserves." },

  // Resources & Workers
  { id: "w01", icon: "🌾", category: "Resources",  title: "Food is Life", body: "Your population consumes 1.2 food per person per tick. With 10 citizens, that's 12 food/tick. Two farmers produce 16 — a +4 surplus. If food goes to zero, population and stability both decline rapidly. Set a personal rule: food net must always be positive." },
  { id: "w02", icon: "💛", category: "Resources",  title: "Gold Never Sleeps", body: "Keep at least 2 Gold Miners active at all times, no matter your epoch. Gold is universally valuable as a trade commodity and can be sold instantly on the Global Market for emergency treasury top-ups. It's your economic safety net." },
  { id: "w03", icon: "⚙️", category: "Resources",  title: "Iron Age Preparation", body: "The moment you unlock Iron Age, immediately assign 2–3 Iron Miners. Iron is required for military buildings, fortresses, and many advanced structures. Nations that delay iron production find themselves perpetually resource-blocked at exactly the wrong moments." },
  { id: "w04", icon: "🔬", category: "Resources",  title: "Research Never Stops", body: "Assign at least 2 Researchers from the very first session. Every tick without researchers generating tech points is a tick of epoch advancement permanently lost. Tech compounds — early investment pays dividends for the entire lifetime of your nation." },
  { id: "w05", icon: "📦", category: "Resources",  title: "Storage Matters", body: "Your resources are capped at 6,000 units by default. Once full, all production above the cap is lost every tick. Build a Small Warehouse (+5,000) the moment any resource approaches 5,000 to prevent waste." },
  { id: "w06", icon: "🪓", category: "Resources",  title: "Epoch Multiplier", body: "Each epoch you advance boosts all worker production by 8% cumulatively. By Industrial Age, your workers produce 56% more than they did in the Stone Age — for the same number of workers. This is why epoch advancement is so powerful." },

  // Construction
  { id: "b01", icon: "🏗️", category: "Building",   title: "Upgrade First", body: "Before building your 3rd copy of any building, upgrade your existing ones to Level 2 or 3. A Level 3 Farm produces more than two Level 1 Farms combined — and uses only one building slot. Efficiency beats quantity in construction." },
  { id: "b02", icon: "🌾", category: "Building",   title: "Granary Priority", body: "Build a Granary early — before you actually need it. Once your food hits 6,000 units, every tick of surplus is wasted forever. The Granary adds 5,000 storage capacity and prevents one of the most common early-game resource waste scenarios." },
  { id: "b03", icon: "🏰", category: "Building",   title: "Walls Deter War", body: "Walls (+25 Defense Level) are the single best construction investment for deterring conflict. Nations calculate your Defense Level before deciding to attack. Walls visible on your map tiles signal you'll be expensive to fight — most rivals choose an easier target." },
  { id: "b04", icon: "🏫", category: "Building",   title: "Schools Pay Forever", body: "A School generates Tech Points every single tick from the moment it's built. Over a week of play, one School generates more total value than almost any other building. Build at least 2 in the Stone Age and upgrade them as early as possible." },
  { id: "b05", icon: "🔭", category: "Building",   title: "Observatory Impact", body: "The Observatory (Renaissance Age+, UNIQUE) adds a permanent 20% bonus to all Tech Point generation. That means every researcher, every school, every college, every university generates 20% more. Build it the day you hit Renaissance Age — it pays back its cost in days." },
  { id: "b06", icon: "⚓", category: "Building",   title: "Port Power", body: "If you have a Coastal hex tile, building a Port is one of the highest-value construction investments. It adds +2 trade route slots AND a throughput bonus to all routes. A nation with 5+ active trade routes using a Port earns dramatically more per tick than one without." },

  // Diplomacy & War
  { id: "d01", icon: "🤝", category: "Diplomacy",  title: "Allied Economics", body: "Allied nations get a -5% tariff discount on all trade routes between you. But more importantly, allied nations have an economic incentive not to attack you — their economy benefits from your stability. Economic alliances are often more durable than purely political ones." },
  { id: "d02", icon: "🕵️", category: "Diplomacy",  title: "Spy Before War", body: "Always run /spy @NationName before considering any military action. For 15 Influence Points you reveal their defense level, unit power, and approximate economic health. Attacking blind is one of the most common and costly mistakes in the game." },
  { id: "d03", icon: "⚔️", category: "Diplomacy",  title: "War Timing", body: "The best time to declare war is when your target is already in conflict with someone else. Two-front wars drain stability twice as fast. But be careful — their other enemy might not be your ally, and you could find yourself in a three-way mess." },
  { id: "d04", icon: "🕊️", category: "Diplomacy",  title: "Survival Strategy", body: "If you're being attacked and can't win militarily, survive. Wars auto-expire after about 3.5 real hours. Keep food positive, maintain stability above 30, and outlast the attacker. They spend resources every strike; you only need to not collapse." },
  { id: "d05", icon: "💬", category: "Diplomacy",  title: "Private Diplomacy", body: "The most powerful alliances start in private messages. Before any major diplomatic move, reach out confidentially first. 'I'm thinking of proposing X — are you interested?' builds trust and avoids public rejection, which damages both parties' credibility." },
  { id: "d06", icon: "🏴", category: "Diplomacy",  title: "Aid Builds Loyalty", body: "Sending even 50–100 credits in aid to a struggling nation creates more diplomatic goodwill than any formal treaty. Do it publicly (via the global aid system) so everyone sees your generosity. Reputation is your most persistent strategic asset." },
  { id: "d07", icon: "📜", category: "Diplomacy",  title: "Embargo Carefully", body: "Embargoes raise tariffs 200% and are extremely provocative. Before issuing one, be prepared for war — embargoed nations frequently retaliate militarily, especially if trade was a significant income source for them. Use economic sanctions (via /sanction) as a softer first step." },

  // Tech & Research
  { id: "t01", icon: "🔬", category: "Tech",       title: "Architecture First", body: "The Architecture tech reduces all construction costs by 10% permanently. Every single building you ever build after unlocking it is 10% cheaper. This is one of the highest lifetime-value techs in the game. Prioritize it early in the Engineering Branch." },
  { id: "t02", icon: "📚", category: "Tech",       title: "Science Branch Priority", body: "The Science Branch accelerates every other branch. Writing (+5% TP/tick), Scientific Method (+10% research speed), Research Institutions (more project slots). Complete the Science Branch before investing heavily in military or industry techs." },
  { id: "t03", icon: "⭐", category: "Tech",       title: "Mandatory Tech First", body: "When advancing toward a new epoch, always check which techs are marked mandatory (⭐) in the Tech Tree. You can't advance without them. Some players waste hundreds of TP on optional techs while the mandatory ones remain unlocked, delaying their advance for no reason." },
  { id: "t04", icon: "📐", category: "Tech",       title: "TP Storage Cap", body: "If your Tech Point storage is full, you're losing all TP generated that tick — wasted forever. Always build another education structure (School/College/University) before you hit your storage cap. The cap = 500 base + 1,000 per School + 3,000 per College + 6,000 per University." },
  { id: "t05", icon: "🚀", category: "Tech",       title: "Research Queue", body: "Always have a research project queued in the Research Panel. An empty queue means your assigned researchers are contributing nothing. The moment a project completes, start the next one. This habit alone can cut epoch advancement time by 15–20%." },

  // Stock Market
  { id: "s01", icon: "📈", category: "Markets",    title: "Epoch = Stock Surge", body: "When a nation advances an epoch, their stocks typically surge 20–40% in the following 5 ticks. If you know an allied nation is close to advancing, buying their stock beforehand is one of the most reliable profit plays available." },
  { id: "s02", icon: "💥", category: "Markets",    title: "Post-Crash Buying", body: "Market crashes create buying opportunities. After a crash, wait 2–3 ticks for panic selling to settle. Then buy the crashed nation's stock IF their fundamentals (stable government, no bankruptcy) suggest recovery. Crashed stock in a recovering nation is the best risk/reward play in the Exchange." },
  { id: "s03", icon: "🔎", category: "Markets",    title: "Activity Feed Intel", body: "The Global Activity tab shows every stock purchase by every nation. This is financial intelligence gold. When multiple players are buying a specific nation's stock simultaneously, they see something you might not. Follow smart investors." },
  { id: "s04", icon: "📊", category: "Markets",    title: "Diversify Holdings", body: "Never put more than 30% of your investment credits into one nation's stock. A market crash would devastate your portfolio. Spread holdings across 3+ nations in at least 2 different sectors. Diversification isn't pessimism — it's how smart investors survive long term." },
  { id: "s05", icon: "🏢", category: "Markets",    title: "IPO Timing", body: "IPO when your GDP is high, stability is above 70, and public trust is above 1.0. These three factors directly calculate your listing price. A strong economy at IPO means more credits from sold shares and a higher starting price for future appreciation." },

  // Cities
  { id: "c01", icon: "🏙️", category: "Cities",    title: "Happiness First", body: "City happiness is the master lever for everything else. High happiness → population growth → bigger tax base → more revenue → can afford better services → even higher happiness. Getting above 75 happiness is the inflection point — growth accelerates sharply." },
  { id: "c02", icon: "👮", category: "Cities",    title: "Police Immediately", body: "Build Police Stations the moment you found a new city. Without them, crime rises quickly. Crime above 30 causes negative news events that reduce national public trust by 0.1 per event. A simple 2-station setup at founding prevents this entire cascade." },
  { id: "c03", icon: "🏭", category: "Cities",    title: "Pollution Limit", body: "Never exceed 35% Industrial zoning unless you're a manufacturing-specialized nation. Pollution above 30 causes happiness penalties, which trigger protest events, which lower national stability. The recovery takes far longer than the short-term manufacturing boost is worth." },
  { id: "c04", icon: "🏥", category: "Cities",    title: "Hospital ROI", body: "Hospitals are low-urgency but high-value. One Hospital per 3,000 city population adds +8 Health, which reduces disease event probability and increases natural population growth by ~15%. Build them after police and schools — they're the third priority, not the first." },

  // World Map & Territory
  { id: "m01", icon: "🗺️", category: "Map",       title: "Compact Territory", body: "When expanding territory, always expand in compact clusters — not isolated individual tiles scattered across the map. A solid cluster of 5 connected hexes is far easier to defend and more economically integrated than 5 scattered tiles that each require independent defense." },
  { id: "m02", icon: "⛰️", category: "Map",       title: "Mountain Borders", body: "Mountain tiles on your borders provide +25% defense bonuses to all attacks coming from that direction. Claim mountain hexes adjacent to your territory even before you plan to use their resources. Their defensive value often outweighs any immediate resource benefit." },
  { id: "m03", icon: "🌊", category: "Map",       title: "Coastal Value", body: "Coastal tiles allow Port construction, which dramatically increases trade route capacity and throughput. If you have any coastal tiles, build your commercial city there. A coastal trading hub can generate more income per tick than any inland city of the same size." },
];

// ── STORAGE HELPERS ───────────────────────────────────────────────────────────
const SEEN_KEY = "ep_advisor_seen_tips";
const LAST_KEY = "ep_advisor_last_tip_time";

function loadSeenTips() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); }
  catch { return new Set(); }
}
function markTipSeen(id) {
  const seen = loadSeenTips();
  seen.add(id);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch {}
}
function getLastTipTime() {
  try { return parseInt(localStorage.getItem(LAST_KEY) || "0", 10); } catch { return 0; }
}
function setLastTipTime() {
  try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch {}
}

// Minimum interval between tips: 4 real minutes
const MIN_INTERVAL_MS = 4 * 60 * 1000;
// Random delay range: 4–9 minutes after mounting
const FIRST_DELAY_MIN = 4 * 60 * 1000;
const FIRST_DELAY_MAX = 9 * 60 * 1000;

function pickNextTip(nation) {
  const seen = loadSeenTips();
  const unseen = TIPS.filter(t => !seen.has(t.id));
  // If all tips have been seen, reset
  const pool = unseen.length > 0 ? unseen : TIPS;

  // Weight tips toward relevance based on nation state
  const scored = pool.map(tip => {
    let score = 1;
    if (!nation) return { tip, score };
    if (tip.category === "Economy" && (nation.currency || 0) < 300) score += 2;
    if (tip.category === "Resources" && (nation.res_food || 0) < 100) score += 2;
    if (tip.category === "Building" && (nation.gdp || 0) < 800) score += 1;
    if (tip.category === "Diplomacy" && (nation.allies || []).length === 0) score += 1;
    if (tip.category === "Markets" && (nation.currency || 0) > 500) score += 1;
    if (tip.category === "Tech" && (nation.tech_points || 0) < 200) score += 2;
    if (tip.category === "Cities" && (nation.gdp || 0) > 400) score += 1;
    return { tip, score };
  });

  // Weighted random pick
  const totalScore = scored.reduce((s, x) => s + x.score, 0);
  let r = Math.random() * totalScore;
  for (const { tip, score } of scored) {
    r -= score;
    if (r <= 0) return tip;
  }
  return scored[0].tip;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function AdvisorTipPopup({ nation }) {
  const [currentTip, setCurrentTip] = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    scheduleTip();
    return () => clearTimeout(timerRef.current);
  }, [nation?.id]);

  function scheduleTip() {
    clearTimeout(timerRef.current);
    const lastTime = getLastTipTime();
    const elapsed = Date.now() - lastTime;
    const delay = elapsed >= MIN_INTERVAL_MS
      ? FIRST_DELAY_MIN + Math.random() * (FIRST_DELAY_MAX - FIRST_DELAY_MIN)
      : MIN_INTERVAL_MS - elapsed + FIRST_DELAY_MIN + Math.random() * (FIRST_DELAY_MAX - FIRST_DELAY_MIN);

    timerRef.current = setTimeout(() => {
      showTip();
    }, delay);
  }

  function showTip() {
    const tip = pickNextTip(nation);
    if (!tip) return;
    setCurrentTip(tip);
    setVisible(true);
    setLastTipTime();
    markTipSeen(tip.id);
    // Auto-dismiss after 18 seconds
    timerRef.current = setTimeout(() => {
      dismiss();
    }, 18000);
  }

  function dismiss() {
    setVisible(false);
    setTimeout(() => {
      setCurrentTip(null);
      scheduleTip();
    }, 400);
  }

  const CATEGORY_COLORS = {
    Economy: "#fbbf24",
    Resources: "#4ade80",
    Building: "#a78bfa",
    Diplomacy: "#f87171",
    Tech: "#818cf8",
    Markets: "#34d399",
    Cities: "#f59e0b",
    Map: "#22d3ee",
  };
  const color = currentTip ? (CATEGORY_COLORS[currentTip.category] || "#22d3ee") : "#22d3ee";

  return (
    <AnimatePresence>
      {visible && currentTip && (
        <motion.div
          key={currentTip.id}
          initial={{ opacity: 0, x: 60, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="fixed bottom-24 right-4 z-[400] w-72 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(10,15,28,0.98), rgba(4,8,16,0.99))",
            border: `1px solid ${color}35`,
            boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 20px ${color}18`,
          }}
        >
          {/* Top colored bar */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  {currentTip.icon}
                </div>
                <div>
                  <div className="text-[9px] font-black ep-mono uppercase tracking-widest"
                    style={{ color: color }}>
                    ⚡ ADVISOR · {currentTip.category}
                  </div>
                  <div className="text-xs font-black text-white leading-tight">{currentTip.title}</div>
                </div>
              </div>
              <button onClick={dismiss}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-white shrink-0">
                <X size={12} />
              </button>
            </div>

            {/* Body */}
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              {currentTip.body}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full"
                    style={{ background: i === 0 ? color : `${color}30` }} />
                ))}
              </div>
              <button onClick={dismiss}
                className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all hover:scale-105"
                style={{ background: `${color}18`, color: color, border: `1px solid ${color}30` }}>
                Got it <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* Progress bar — drains over 18 seconds */}
          <motion.div
            className="h-0.5 origin-left"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 18, ease: "linear" }}
            style={{ background: color, opacity: 0.4 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}