import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, BookOpen, Search, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import DeepDivePanel from "./DeepDivePanel.jsx";
import { DEEP_DIVES } from "./deepDiveData.js";

const SECTIONS = [
  { id: "dashboard", icon: "🏛️", color: "#22d3ee", title: "Dashboard Overview", summary: "Your command center — everything starts here.", steps: [
    { title: "The Command Center", body: "The Dashboard is your central hub divided into three main columns: Nation Stats (left), World Map + Chat (center), and Nation Metrics + Stock Feed (right). Every panel updates in real time — 1 real minute = 1 game tick.", tip: "The header bar contains quick-action buttons for all major game systems. On mobile, use the bottom scroll bar.", deepDive: "#clock" },
    { title: "Top Navigation Bar", body: "The top bar houses your most important shortcuts: Issue Stock, Tech Tree, Research, Manage, Workers, Exchange, Government, Global News, Build, Marketplace, and Profile.", tip: "On desktop all buttons are visible. On mobile they scroll horizontally in the bottom bar.", deepDive: "#nav" },
    { title: "Tutorial & Help Button", body: "The '📖 Tutorial' button in the top bar opens this guide at any time. You can jump between sections and re-read any topic whenever you need a refresher.", tip: "There's a lot to learn — you don't need to memorize it all at once. Come back whenever you need a refresher.", deepDive: null },
  ]},
  { id: "nation-stats", icon: "📊", color: "#4ade80", title: "Nation Stats Panel", summary: "Your nation's vital signs — GDP, stability, resources & more.", steps: [
    { title: "Epoch & Tech Progress", body: "The top of the Nation Stats panel shows your current Epoch and a progress bar toward the next epoch. Advancing epochs unlocks new buildings, units, resources, and economic systems.", tip: "Rushing to the next epoch is tempting, but make sure your economy is stable first — each epoch increases costs.", deepDive: "#epochs" },
    { title: "Population & Housing", body: "Population grows automatically when food is abundant and housing has capacity. More population = more workers = more production. Housing Capacity limits your population cap.", tip: "If housing is near capacity, your population growth will stall. Always build ahead of demand.", deepDive: "#population" },
    { title: "Treasury & Currency", body: "Your treasury (Credits) is the money your government holds. It increases from taxes and decreases from spending. Running out causes stability penalties.", tip: "Keep at least 200 Credits in reserve as an emergency buffer. Bankruptcy causes severe stability crashes.", deepDive: "#treasury" },
    { title: "GDP & Economic Growth", body: "GDP represents your nation's total economic output. It grows from manufacturing activity, trade routes, population, and buildings. Your GDP directly affects how much tax revenue you collect each tick.", tip: "GDP growth is compounding — small investments now pay off massively later. Prioritize manufacturing and trade early.", deepDive: "#gdp" },
    { title: "Resources", body: "Resources are the physical goods your nation produces and consumes. Wood and Stone are needed for construction. Gold fuels your economy. Iron and Oil unlock in later epochs. Food is consumed by your population every tick.", tip: "Always maintain at least 3–4 days of food reserves. Run out and your people start starving!", deepDive: "#resources" },
    { title: "Tax Revenue Streams", body: "The stats panel shows your income from Income Tax, Sales Tax, Corporate Tax, and Tariffs. Each can be tuned in the Budget/Manage panel. High taxes generate more revenue but lower Public Trust.", tip: "Corporate tax is often the best balance — it generates revenue without directly hurting citizen happiness.", deepDive: "#taxes" },
  ]},
  { id: "resources-workers", icon: "👷", color: "#f97316", title: "Workers & Resources", summary: "Assign your citizens to produce everything your nation needs.", steps: [
    { title: "The Workforce Panel", body: "Open Workers from the top bar to assign your population to different roles. Each role produces a specific resource every game tick. Unassigned workers are unemployed and produce nothing.", tip: "Total assigned workers cannot exceed your population. Always check your population cap before assigning.", deepDive: "#workers" },
    { title: "Farmers & Food Production", body: "Farmers produce Food each tick. Food is consumed by your entire population automatically. If food production < consumption, your reserves deplete. Assign at least 2–3 farmers per 10 population.", tip: "A Granary building doubles your food storage cap. An Agricultural School adds a production bonus.", deepDive: "#food" },
    { title: "Lumberjacks, Quarry Workers & Miners", body: "Lumberjacks produce Wood. Quarry Workers produce Stone. Miners produce Gold. Later you'll unlock Iron Miners (Iron Age) and Oil Engineers (Industrial Age).", tip: "Don't neglect Gold Miners — gold is your economic lifeline for trading and treasury growth.", deepDive: "#resource-workers" },
    { title: "Researchers", body: "Researchers generate Tech Points every tick, which you spend in the Tech Tree to unlock upgrades and advance epochs. The more researchers you have, and the higher your Education Spending, the faster you generate Tech Points.", tip: "Unlock the Library and University buildings to massively boost tech point generation.", deepDive: "#research-system" },
    { title: "Soldiers", body: "Soldiers contribute to your Military Power and Defense Level. More soldiers = stronger military = better protection against war attacks and stronger offensive capability.", tip: "Soldiers don't produce economic goods. Only assign them if you're in a war or actively preparing for one.", deepDive: "#military" },
  ]},
  { id: "economy", icon: "💰", color: "#fbbf24", title: "Economy & Budget", summary: "Tax, spend, inflate, and grow — master the economic engine.", steps: [
    { title: "Budget & Manage Panel", body: "Open Manage from the top bar to access the Budget Cycle Panel. Here you set your Income Tax, Sales Tax, Corporate Tax, and Tariff rates. You also control Military Spending and Education Spending percentages.", tip: "Changes take effect on the next economic tick (~60 seconds). Plan ahead.", deepDive: "#budget" },
    { title: "Inflation & Money Supply", body: "Inflation rises when your money supply grows faster than your goods production. High inflation (above 10%) increases resource costs, construction costs, and erodes purchasing power. Keep it below 8% for a healthy economy.", tip: "Reduce inflation by cutting spending, raising taxes, or improving manufacturing output.", deepDive: "#inflation" },
    { title: "National Wealth", body: "National Wealth = GDP + Infrastructure Value + Resource Stockpile + Corporation Market Cap. This is the full picture of your nation's economic power, affecting loan eligibility and leaderboard standing.", tip: "Investing in buildings and companies raises your National Wealth even when your treasury is low.", deepDive: "#wealth" },
    { title: "Banking & Loans", body: "Access the Banking panel through Marketplace. You can take Short-Term Loans, Development Loans, or issue Sovereign Bonds. Loans charge interest every tick. Defaulting destroys your credit rating and crashes stability.", tip: "Only take loans if you have a clear plan to repay them.", deepDive: "#banking" },
    { title: "Trade Balance", body: "Trade Balance = Exports - Imports. A positive trade balance (surplus) adds credits to your treasury each tick. A negative balance (deficit) drains it. Set up Trade Routes in the Marketplace to control this.", tip: "Export your surplus resources. Import only what you critically lack. Avoid trade deficits in early game.", deepDive: "#trade" },
    { title: "Government Type & Economics", body: "Your government type shapes your default economic profile. Democracies have balanced tax rates. Communist States have low corporate tax but high income tax. Military Juntas start with high military spending.", tip: "You can adjust your policies over time — government type sets your starting conditions, not your destiny.", deepDive: "#government-types" },
  ]},
  { id: "construction", icon: "🏗️", color: "#a78bfa", title: "Construction Hub", summary: "Build infrastructure that powers your civilization's growth.", steps: [
    { title: "The Construction Hub", body: "Access the Construction Hub via the Build button. Every building requires specific resources and may require a minimum Epoch. Buildings provide permanent passive bonuses — production boosts, population capacity, tech generation, and more.", tip: "Construction costs scale with inflation. Build during low-inflation periods for maximum efficiency.", deepDive: "#buildings" },
    { title: "Priority Buildings — Early Game", body: "In the Stone Age, prioritize: Granary (food storage), Farm (food production), Quarry (stone), Lumberyard (wood), and Housing (population cap). A School should be built as soon as possible.", tip: "Don't over-build military structures before Bronze Age — focus on economic foundations first.", deepDive: "#build-order" },
    { title: "Building Levels", body: "Buildings can be upgraded to higher levels to multiply their bonuses. A Level 2 Farm produces significantly more food than Level 1. Upgrades cost more resources but give better returns than building a second copy.", tip: "It's generally better to upgrade existing buildings than to spread resources across many level-1 structures.", deepDive: "#buildings" },
    { title: "Military Buildings", body: "Barracks, Walls, and Fortresses increase your Defense Level and Military Power. These are essential if you're in a war or if your stability is threatened by neighbors.", tip: "A strong defense discourages attacks. You don't need to be the strongest — just strong enough to make attacking you expensive.", deepDive: "#military-buildings" },
  ]},
  { id: "tech-research", icon: "🔬", color: "#818cf8", title: "Tech Tree & Research", summary: "Advance through 12 epochs and unlock powerful technologies.", steps: [
    { title: "Tech Points & the Tech Tree", body: "Click 'Tech Tree' in the top bar to see all available technologies. Each tech costs Tech Points and may have prerequisites. Unlocking techs provides direct bonuses and may unlock the path to the next epoch.", tip: "Focus on techs in a single branch before branching out — synergies within a branch compound quickly.", deepDive: "#tech-tree" },
    { title: "The Research Panel", body: "The Research Panel is for advanced projects — larger initiatives that take multiple ticks to complete. Assign Researchers in the Workforce Panel and queue up projects. Completed research gives major breakthroughs.", tip: "Global Breakthroughs are announced worldwide — being FIRST to discover one gives you a diplomatic advantage.", deepDive: "#research-queue" },
    { title: "Advancing Epochs", body: "When you've unlocked all required techs and have sufficient Tech Points, you'll see an 'Advance Epoch' button. Each new epoch unlocks a whole new tier of the game: new resources, buildings, mechanics, and map capabilities.", tip: "The 12 epochs are: Stone → Bronze → Iron → Classical → Medieval → Renaissance → Industrial → Modern → Digital → Information → Space → Galactic Age.", deepDive: "#epoch-chart" },
  ]},
  { id: "world-map", icon: "🗺️", color: "#06b6d4", title: "World Map & Territory", summary: "Claim land, see your rivals, and project power across the globe.", steps: [
    { title: "The Interactive World Map", body: "The center panel shows a live world map with all nations' territories marked by their flag colors. Your hexagonal tiles are highlighted. Click any nation's territory or icon to view their stats.", tip: "Zoom in to see individual hex tiles. Each hex has terrain, resource deposits, and infrastructure info.", deepDive: "#map" },
    { title: "Hex Tiles & Territory", body: "The world is divided into hexagonal tiles. Each hex has a terrain type (plains, forest, mountains, coastal, desert, ocean, tundra) that affects its resource deposits and strategic value.", tip: "Coastal hexes are valuable for trade routes. Mountain hexes are defensible. Forest hexes have abundant wood.", deepDive: "#terrain" },
    { title: "Claiming Territory", body: "You can expand your territory by claiming adjacent hex tiles. Unclaimed tiles are available for free expansion. Claimed tiles belonging to other nations require military conquest.", tip: "Expansion increases your resource access but also your border length to defend. Don't expand faster than you can protect.", deepDive: "#expansion" },
    { title: "Cities on the Map", body: "You can found Cities on your hex tiles via the City Management page. Cities appear on the map and grow into population centers with their own budgets, happiness scores, and service infrastructure.", tip: "Founding a capital city gives a permanent GDP bonus. Choose a tile with good terrain and resource access.", deepDive: "#cities" },
  ]},
  { id: "diplomacy-war", icon: "⚔️", color: "#f87171", title: "Diplomacy & War", summary: "Form alliances, trade, negotiate — or conquer.", steps: [
    { title: "Nation Interaction Menu", body: "Click any nation on the map (or in the World Chat) to open their profile. From there you can: view their stats, offer/accept alliances, propose trade agreements, declare war, send aid, or negotiate peace.", tip: "Check a nation's military power before declaring war. Attacking a stronger nation is usually a catastrophic mistake.", deepDive: "#diplomacy" },
    { title: "Alliances", body: "Allied nations defend each other when attacked. Allied nations can also share trade routes and exchange resources more easily. Alliances appear in your Nation Stats panel.", tip: "Don't ally with everyone — alliances mean you share their wars too. Choose strategic partners wisely.", deepDive: "#alliances" },
    { title: "Declaring War", body: "War is declared through the Nation Interaction menu. When at war, both nations suffer stability penalties every tick. You can launch attacks to destroy enemy buildings, steal resources, and reduce their stability.", tip: "War drains stability, treasury, and food. Only declare war if you have economic reserves to sustain the conflict.", deepDive: "#war" },
    { title: "Trade Agreements & Sanctions", body: "Trade Agreements reduce tariffs between nations and can be Free Trade, Tariff Reduction, or Embargo. Use /trade @Nation in World Chat or the diplomacy menu to propose one.", tip: "Free Trade agreements are mutually beneficial early-game. Save Embargoes for nations you're trying to weaken economically.", deepDive: "#trade-agreements" },
  ]},
  { id: "stock-market", icon: "📈", color: "#4ade80", title: "Stock Market & Exchange", summary: "IPO companies, trade shares, trigger crashes — dominate finance.", steps: [
    { title: "Issuing Stock (IPO)", body: "Click 'Issue Stock' in the top bar to list a new company on the Global Exchange. You choose the company name, sector (Energy, Technology, Agriculture, etc.), number of shares, and listing price.", tip: "The listing price is calculated from your GDP, public trust, and sector modifiers. A stronger economy = higher IPO valuation.", deepDive: "#ipo" },
    { title: "Global Exchange", body: "The Global Exchange page shows all listed stocks from all nations. You can buy and sell shares in other nations' companies. Stock prices fluctuate based on the issuing nation's economic health.", tip: "Invest in nations with low inflation, high GDP growth, and stable government. These signals predict stock price increases.", deepDive: "#stocks" },
    { title: "Market Feed (Stock Ticker)", body: "The bottom-right panel on the Dashboard shows the live Stock Ticker — a real-time feed of all price movements. Green = rising, Red = falling. Click any ticker to open that stock's detail page.", tip: "Watch for stocks that have been declining for 3+ ticks — they may be near a bottom and ready to recover.", deepDive: "#ticker" },
    { title: "Market Crashes", body: "If a nation enters severe economic distress (very high inflation, bankrupt treasury, or war devastation), their stocks may crash — dropping 50-90% in value instantly.", tip: "Diversify your stock holdings across multiple nations and sectors to protect against crashes.", deepDive: "#crashes" },
  ]},
  { id: "world-chat", icon: "💬", color: "#22d3ee", title: "World Chat & Communication", summary: "Talk to every civilization — negotiate, threaten, or trade in real time.", steps: [
    { title: "Global, Allies & System Channels", body: "World Chat has three channels: Global (all players), Allies (only your allied nations), and System (official game announcements). The Activity tab shows the live Global Ledger of all in-game actions.", tip: "Check the System channel regularly for important world events and announcements that affect all nations.", deepDive: "#chat-channels" },
    { title: "Chat Commands", body: "Type commands directly in the chat input: /trade @Nation to propose a trade, /ally @Nation to offer an alliance, /war @Nation to declare war, /aid @Nation to send economic aid, /sanction @Nation to impose sanctions, /spy @Nation to gather intelligence.", tip: "Commands use the exact nation name. Type the '@' symbol first to see autocomplete suggestions.", deepDive: "#commands" },
    { title: "Private Messaging", body: "Click the 🔒 lock icon in the chat header to open Private Messages. You can send confidential diplomatic messages to any nation leader that only they can see. This is ideal for secret alliances and negotiating peace.", tip: "Private messages are not visible in the Global or Allies channels. Great for backdoor diplomacy.", deepDive: "#private-messages" },
    { title: "Reactions & Replies", body: "Hover over any chat message to see reaction and reply options. You can react with emoji or click Reply to quote a specific message. This keeps diplomatic conversations organized during busy chat periods.", tip: "Moderators can see all messages and can mute players who violate the rules. Be diplomatic!", deepDive: null },
    { title: "Global Activity Feed", body: "The Activity tab in World Chat shows the Global Ledger — a real-time stream of all significant in-game events: stock trades, wars declared, treaties signed, tech breakthroughs, market crashes, and more.", tip: "The Activity feed reveals which nations are buying stock in others. This is valuable economic intelligence.", deepDive: "#global-ledger" },
  ]},
  { id: "city-management", icon: "🏙️", color: "#f59e0b", title: "City Management", summary: "Zone districts, manage happiness, build services — grow your cities.", steps: [
    { title: "Founding a City", body: "Access City Management from the navigation. You can found cities on your hex tiles. Each city has its own population, budget, happiness score, crime rate, and service infrastructure. Cities contribute to your national GDP.", tip: "Your first city should be on a fertile hex tile near resources. It will become your capital.", deepDive: "#city-founding" },
    { title: "Zoning (Residential, Commercial, Industrial)", body: "Allocate your city's land into three zones: Residential (houses citizens), Commercial (generates tax revenue and happiness), Industrial (boosts manufacturing and pollution). Balance all three for optimal city performance.", tip: "Too much industrial zoning raises pollution and lowers happiness. Keep residential zones dominant.", deepDive: "#zoning" },
    { title: "City Services", body: "Build Schools, Hospitals, Police Stations, and Fire Departments in your cities. More services = higher education level, better health, lower crime, and improved safety scores. These factors affect national stability.", tip: "Police Stations reduce crime. High crime generates negative news events and lowers national public trust.", deepDive: "#services" },
    { title: "City Events", body: "Cities generate random events over time: immigration waves, disease outbreaks, crimes, protests, fires, and achievements. These events require decisions that impact city stats. Left unresolved, negative events cascade into national crises.", tip: "Check the City Events tab regularly. Unresolved critical events cause stability penalties affecting your entire nation.", deepDive: "#city-events" },
  ]},
  { id: "marketplace", icon: "🏪", color: "#34d399", title: "Marketplace & Trade", summary: "Buy resources, set up trade routes, and access global commodity markets.", steps: [
    { title: "The Marketplace", body: "The Marketplace page is where you buy and sell resources on the Global Commodity Market. Prices fluctuate based on worldwide supply and demand. Shortages spike prices. Surpluses crash them.", tip: "Buy resources when prices are low, not when you're desperate. Panic-buying during shortages is expensive.", deepDive: "#commodities" },
    { title: "Trade Routes", body: "Set up recurring Trade Routes with other nations. Define the resource, quantity per cycle, and price. Active trade routes automatically transfer resources and credits every tick without manual intervention.", tip: "Trade Routes with Allied nations get a tariff discount. Routes with enemies are blocked if you're at war.", deepDive: "#trade-routes" },
    { title: "Import & Export Strategy", body: "The Import Panel shows available offers from other nations. The Sell Panel lets you post resources for others to buy. Smart nations specialize in 1–2 export commodities and import everything else.", tip: "Look for nations with complementary economies. If you have surplus Wood and they have surplus Iron, a mutual trade route benefits both.", deepDive: "#specialization" },
  ]},
  { id: "news-government", icon: "🏛️", color: "#c084fc", title: "Government & News", summary: "Policy, propaganda, dilemmas, and the press — govern your nation.", steps: [
    { title: "Government (NationwideNews)", body: "The Government page is your domestic policy hub. Here you manage Policy Toggles (healthcare, martial law, tech subsidies, tax cuts, conscription), publish official government reports, and read your nation's internal news feed.", tip: "Each policy toggle has both a benefit and a cost. Healthcare improves stability but costs credits. Martial Law boosts defense but tanks public trust.", deepDive: "#policies" },
    { title: "Council Dilemmas", body: "Periodically, your advisors present Council Dilemmas — difficult decisions with two options, each with real consequences. For example: 'A workers' strike demands higher wages — Negotiate or Suppress.'", tip: "Dilemmas are time-sensitive. If you ignore them, the negative outcome defaults automatically.", deepDive: "#dilemmas" },
    { title: "Propaganda & News", body: "You can publish news articles (propaganda) that appear in the Global Chronicles. These can influence other nations' perception of you, spread information, or signal your diplomatic intentions.", tip: "Well-written propaganda can deter attacks and attract trade partners.", deepDive: "#propaganda" },
    { title: "Global Chronicles", body: "The Global Chronicles is the world's newspaper. It features Breaking News (wars, crashes, breakthroughs), nation-published articles, and AI-generated world events.", tip: "Use Global Chronicles to identify weak nations ripe for diplomatic influence or economic investment.", deepDive: "#chronicles" },
  ]},
  { id: "metrics-panel", icon: "📉", color: "#fb923c", title: "Nation Metrics Panel", summary: "Core indicators, fuel prices, spending ratios, and tech achievements.", steps: [
    { title: "Core Metrics", body: "The top-right panel shows Core Metrics: Stability, Public Trust, Manufacturing Index, Defense Level, and Unit Power. All are shown as progress bars — aim to keep them all above 50%.", tip: "Stability below 30 risks political collapse. Public Trust below 0.5 triggers protest events.", deepDive: "#core-metrics" },
    { title: "Fuel Prices", body: "The Fuel Prices section shows current energy costs based on your Oil reserves, population demand, and global market price. High fuel prices increase construction costs and reduce manufacturing efficiency.", tip: "Fuel prices spike during wars (increased military energy demand). Build strategic oil reserves before any conflict.", deepDive: "#fuel" },
    { title: "Spending & Education", body: "This section shows your Military Spending % and Education Spending % as visual gauges. Higher education spending accelerates tech point generation. Higher military spending boosts defense and unit power.", tip: "The sweet spot for education is 25–35%. Military spending above 40% causes economic drag.", deepDive: "#spending" },
    { title: "Technology Achievements", body: "The bottom of the Metrics Panel lists your Unlocked Technologies with icons. Technologies persist permanently — you never lose them, even if your economy struggles.", tip: "Technologies compound over time. The earlier you unlock a production bonus, the more value it generates over your nation's lifetime.", deepDive: "#tech-list" },
  ]},
];

export default function AdvancedTutorial({ onClose }) {
  const [activeSection, setActiveSection] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("home");
  const [openDeepDive, setOpenDeepDive] = useState(null);

  const section = SECTIONS[activeSection];
  const step = section?.steps[activeStep];
  const totalSteps = section?.steps.length || 0;

  const filteredSections = searchQuery
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.steps.some(st => st.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : SECTIONS;

  function openSection(idx) {
    setActiveSection(idx);
    setActiveStep(0);
    setView("section");
    setSearchQuery("");
    setOpenDeepDive(null);
  }

  function nextStep() {
    setOpenDeepDive(null);
    if (activeStep < totalSteps - 1) setActiveStep(s => s + 1);
    else setView("home");
  }

  function prevStep() {
    setOpenDeepDive(null);
    if (activeStep > 0) setActiveStep(s => s - 1);
    else setView("home");
  }

  function toggleDeepDive(key) {
    setOpenDeepDive(prev => prev === key ? null : key);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d1424 0%, #040810 100%)", border: "1px solid rgba(34,211,238,0.2)", boxShadow: "0 0 80px rgba(34,211,238,0.08)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-3">
            {view === "section" && (
              <button onClick={() => { setView("home"); setOpenDeepDive(null); }}
                className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <ChevronLeft size={16} />
              </button>
            )}
            <BookOpen size={16} className="text-cyan-400" />
            <div>
              <div className="font-black text-white text-sm">Epoch Nations — Advanced Tutorial</div>
              {view === "section" && <div className="text-[10px] text-slate-500 ep-mono">{section.title} · Step {activeStep + 1} of {totalSteps}</div>}
              {view === "home" && <div className="text-[10px] text-slate-500 ep-mono">{SECTIONS.length} topics · Full game guide</div>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div key="home" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="px-6 pt-5 pb-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Search size={13} className="text-slate-500 shrink-0" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search topics…"
                      className="bg-transparent text-white text-xs outline-none flex-1 placeholder-slate-600" />
                  </div>
                </div>
                <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSections.map((sec) => {
                    const realIdx = SECTIONS.indexOf(sec);
                    return (
                      <button key={sec.id} onClick={() => openSection(realIdx)}
                        className="text-left p-4 rounded-2xl transition-all hover:scale-[1.02] group"
                        style={{ background: `${sec.color}07`, border: `1px solid ${sec.color}20` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{sec.icon}</span>
                          <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">{sec.title}</div>
                        </div>
                        <div className="text-[11px] text-slate-400 leading-relaxed mb-2">{sec.summary}</div>
                        <div className="text-[10px] ep-mono" style={{ color: sec.color }}>{sec.steps.length} lessons →</div>
                      </button>
                    );
                  })}
                  {filteredSections.length === 0 && (
                    <div className="col-span-2 text-center text-slate-600 text-sm py-8">No topics match your search.</div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key={`${activeSection}-${activeStep}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-6">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${section.color}18`, border: `1px solid ${section.color}30` }}>
                    {section.icon}
                  </div>
                  <div>
                    <div className="font-black text-white text-base">{section.title}</div>
                    <div className="text-xs text-slate-500">{section.summary}</div>
                  </div>
                </div>

                {/* Step progress */}
                <div className="flex gap-1 mb-5">
                  {section.steps.map((_, i) => (
                    <button key={i} onClick={() => { setActiveStep(i); setOpenDeepDive(null); }}
                      className="h-1.5 rounded-full transition-all duration-300 flex-1"
                      style={{ background: i === activeStep ? section.color : i < activeStep ? section.color + "50" : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>

                {/* Step content */}
                <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="font-bold text-white text-sm mb-3">{step.title}</div>
                  <div className="text-slate-300 text-xs leading-relaxed">{step.body}</div>
                </div>

                {/* Tip */}
                {step.tip && (
                  <div className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2"
                    style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <span className="text-amber-400 text-sm shrink-0">💡</span>
                    <div className="text-xs text-amber-200/80 leading-relaxed">{step.tip}</div>
                  </div>
                )}

                {/* Deep dive toggle */}
                {step.deepDive && DEEP_DIVES[step.deepDive] && (
                  <button onClick={() => toggleDeepDive(step.deepDive)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all"
                    style={{
                      background: openDeepDive === step.deepDive ? `${section.color}12` : "rgba(34,211,238,0.04)",
                      border: `1px solid ${openDeepDive === step.deepDive ? section.color + "40" : "rgba(34,211,238,0.12)"}`
                    }}>
                    <div className="flex items-center gap-2">
                      <ExternalLink size={12} style={{ color: section.color }} />
                      <span className="text-xs font-bold" style={{ color: section.color }}>
                        📖 Read More: {DEEP_DIVES[step.deepDive].title}
                      </span>
                    </div>
                    {openDeepDive === step.deepDive ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                  </button>
                )}

                {/* Deep dive expanded */}
                <AnimatePresence>
                  {openDeepDive && openDeepDive === step.deepDive && (
                    <DeepDivePanel deepDiveKey={openDeepDive} sectionColor={section.color} onClose={() => setOpenDeepDive(null)} />
                  )}
                </AnimatePresence>

                {/* Step list */}
                <div className="mt-5 space-y-1">
                  {section.steps.map((s, i) => (
                    <button key={i} onClick={() => { setActiveStep(i); setOpenDeepDive(null); }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs"
                      style={{
                        background: i === activeStep ? `${section.color}12` : "transparent",
                        color: i === activeStep ? section.color : i < activeStep ? "#64748b" : "#475569",
                        border: `1px solid ${i === activeStep ? section.color + "30" : "transparent"}`
                      }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                        style={{ background: i < activeStep ? section.color + "30" : i === activeStep ? section.color : "rgba(255,255,255,0.06)", color: i <= activeStep ? section.color : "#475569" }}>
                        {i < activeStep ? "✓" : i + 1}
                      </span>
                      {s.title}
                      {s.deepDive && DEEP_DIVES[s.deepDive] && (
                        <span className="ml-auto text-[9px] ep-mono text-slate-600">📖</span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {view === "section" && (
          <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
            <button onClick={prevStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5 transition-all min-h-[40px]">
              <ChevronLeft size={12} /> {activeStep === 0 ? "All Topics" : "Back"}
            </button>
            <span className="text-[10px] text-slate-600 ep-mono">{activeStep + 1} / {totalSteps}</span>
            <button onClick={nextStep}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all min-h-[40px]"
              style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}99)` }}>
              {activeStep === totalSteps - 1 ? "✓ Done" : <>Next <ChevronRight size={12} /></>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}