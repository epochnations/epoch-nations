/**
 * advancedTutorialData.js
 * Comprehensive in-game tutorial sections with deep-dive lessons.
 */
import { DEEP_DIVES } from "./deepDiveData";

export const TUTORIAL_SECTIONS = [
  {
    id: "dashboard", icon: "🏛️", color: "#22d3ee",
    title: "Dashboard Overview", summary: "Your command center — everything starts here.",
    steps: [
      {
        title: "The Command Center",
        body: "The Dashboard is your central hub. It is divided into three main columns: Nation Stats (left), World Map + Chat (center), and Nation Metrics + Stock Feed (right). Every panel updates in real time — 1 real minute = 1 game tick. The game never stops running, even when you log off.",
        tip: "Click the World Map once to unlock panning and zooming. The map locks by default so you don't accidentally scroll while reading other panels.",
        deepDive: "#clock"
      },
      {
        title: "Understanding the Game Clock",
        body: "One real-world minute equals one game tick. Every tick: workers produce resources, food is consumed by your population, the economy recalculates (GDP, taxes, inflation), tech points are generated, and war damage is applied. The clock runs 24/7 — your nation continues ticking while you sleep. Game days = 30 ticks (30 real minutes). 1 game year = 10,080 ticks (7 real days).",
        tip: "Always ensure food production exceeds consumption BEFORE logging off. A food deficit offline can collapse your population while you're away.",
        deepDive: "#clock"
      },
      {
        title: "Top Navigation Bar",
        body: "The top bar contains every major game system: Issue Stock, Tech Tree, Research, Manage (taxes/budget), Workers, Exchange, Government, Global News, Build, Marketplace, Profile, and Tutorial. These are ordered by frequency of use. On mobile, all buttons are accessible in the scrollable bottom bar.",
        tip: "The most important buttons for daily play are: Manage (economy), Workers (production), and Build (infrastructure). Visit all three every session.",
        deepDive: "#nav"
      },
      {
        title: "Nation Stats Panel (Left Column)",
        body: "This panel is your vital signs dashboard. From top to bottom: Epoch Progress, Quick Stats (allies/cities/population), Treasury, GDP, Resource Grid, Economy/Min breakdown, Food/Min breakdown, Housing Capacity. Every number updates live each tick with a color flash when it changes.",
        tip: "The green flash means a stat went up; red flash means it went down. Train yourself to notice these — they tell you what's happening without reading every number.",
        deepDive: "#dashboard-layout"
      },
      {
        title: "World Map Panel (Center)",
        body: "The interactive world map shows all nations as colored territory markers with flag emojis. Click to unlock panning, then scroll to zoom. Top overlays: war countdown bar (red, top) and new-player protection bar (blue). The Global / National mode toggle (top right) switches between world view and your local area view.",
        tip: "Toggle to National mode to zoom in on your territory and nearby allies/enemies. Great during wars or when you need detailed local intel.",
        deepDive: "#map"
      },
      {
        title: "World Chat Panel (Center Bottom)",
        body: "World Chat sits below the map. It has three channels: Global (all players), Allies (only allied nations), and System (game announcements). The Activity tab shows the Global Ledger — a chronological feed of every major in-game action by any nation.",
        tip: "Keep System channel checked at session start. It's the fastest way to learn what happened in the world while you were offline.",
        deepDive: "#chat-channels"
      },
      {
        title: "Right Column: Metrics & Stock Ticker",
        body: "The right column has Nation Metrics Panel (top — stability, trust, defense, unit power, fuel prices) and the Live Stock Ticker (bottom — real-time price feed of all listed stocks). The ticker is your market intelligence at a glance: green = rising, red = falling.",
        tip: "The Stock Ticker is not just for investors. It tells you which nations are thriving (rising stocks) and which are struggling (falling stocks) — invaluable diplomatic intelligence.",
        deepDive: "#ticker"
      },
      {
        title: "Notifications Bell",
        body: "The bell icon in the top-right header shows unread alerts: wars declared on you, ally attacks, stock crashes affecting your holdings, tech unlocks, and trade proposals. Red = urgent. Green = positive milestones. Always check notifications at session start — offline events can completely change your strategic situation.",
        tip: "A war notification while you were offline is the most urgent — your stability has been draining every tick. Open it immediately and assess your military situation.",
        deepDive: "#notifications"
      },
    ]
  },
  {
    id: "nation-stats", icon: "📊", color: "#4ade80",
    title: "Nation Stats Panel", summary: "Your nation's vital signs — GDP, stability, resources & more.",
    steps: [
      {
        title: "Epoch & Tech Progress Bar",
        body: "The colored progress bar at the top shows your advancement toward the next epoch. It fills as you accumulate Tech Points and unlock prerequisite technologies. When full AND prerequisites met, the 'Advance Epoch' button appears in your Tech Tree. There are 12 epochs: Stone → Bronze → Iron → Classical → Medieval → Renaissance → Industrial → Modern → Digital → Information → Space → Galactic.",
        tip: "Never rush an epoch advance unless your economy is ready. Each new epoch permanently increases building costs, food consumption, and operational complexity.",
        deepDive: "#epochs"
      },
      {
        title: "Population & Housing Capacity",
        body: "Population grows by +1 per tick when: net food > 0 AND housing has room AND stability ≥ 30 AND a 30% random check passes. Population declines when: food reserves hit 0 (famine, -1/tick), stability < 20 (unrest, -1/tick), or you're at war. More population = more workers = more production = more taxes = faster growth.",
        tip: "Build the next Housing unit when your population reaches 70% of current capacity. Don't wait until it's full — growth stalls the moment the cap is hit.",
        deepDive: "#population"
      },
      {
        title: "Treasury & Currency",
        body: "Your treasury is government-held credits. It increases each tick from tax revenue (income, sales, corporate, tariffs) and trade route income. It decreases from military spending, education spending, construction costs, and loan repayments. Below 0 triggers Bankruptcy: -5 stability/tick, construction halted, diplomatic credibility destroyed.",
        tip: "Keep at least 300 credits as a buffer. During war, double your reserve target — attacks drain your treasury directly as part of the damage formula.",
        deepDive: "#treasury"
      },
      {
        title: "GDP — What It Is and How It Grows",
        body: "GDP = Citizen Spending + Industrial Output + Government Expenditure + Trade Balance. More population raises citizen spending. Higher public trust multiplies spending. More factories and industrial workers raise industrial output. A trade surplus adds directly. GDP determines your tax revenue ceiling — every percent of tax rate applies to your GDP, so growing GDP is always the right long-term play.",
        tip: "The fastest GDP lever early-game is Public Trust. High trust means citizens spend more, which compounds into higher tax revenue. Protect trust above all else.",
        deepDive: "#gdp"
      },
      {
        title: "Resource Grid — The Six Fundamentals",
        body: "Your nation has 6 core resources: 🌲 Wood (construction), 🪨 Stone (construction/military), 💛 Gold (economy/trade), 🍖 Food (population survival), ⚙️ Iron (military/advanced buildings, Iron Age+), 🛢️ Oil (industry/fuel, Industrial Age+). Resources are produced by workers each tick, capped at 6,000 base storage (expandable with warehouses).",
        tip: "The resource grid shows current stockpile. The Economy/Min section shows NET production rate. Negative net = stockpile is shrinking. Fix it before it hits zero.",
        deepDive: "#resources"
      },
      {
        title: "Economy Per Minute Breakdown",
        body: "The Economy/Min panel shows: Income (tax revenue per tick), Expense (military + education spending per tick), and Net (the difference). Net positive = treasury growing. Net negative = treasury shrinking. The Food/Min panel is separate: shows farm production, population consumption, and net food per tick.",
        tip: "If Net economy is negative, check your military + education spending percentages first. Cutting spending by 5% can turn a deficit into a surplus instantly.",
        deepDive: "#budget"
      },
      {
        title: "Stability — Your Most Important Stat",
        body: "Stability (0–100) is the foundation of your civilization. Everything depends on it: GDP bonus (high stability → economy runs efficiently), population growth (requires ≥30), epoch advance (requires ≥50), loan eligibility, and your ability to run policies. It drains during war (-1/tick), famine (-3/tick), and from negative events. It recovers from good food, healthcare policy, and high trust.",
        tip: "Below 40 stability, your GDP and production both suffer multiplied penalties. At 15, national collapse events can fire. Never let it drop below 50 if you can help it.",
        deepDive: "#core-metrics"
      },
      {
        title: "Public Trust — The GDP Multiplier",
        body: "Public Trust (0.1–2.0) is a multiplier on everything economic. At 1.0 = baseline. At 1.5 = 50% economic bonus. At 0.5 = 50% penalty. Trust is raised by: fulfilled dilemmas, healthcare policy, tax cuts, stable government, and low inflation. Trust is destroyed by: Martial Law, high taxes, war, ignored council dilemmas, and famine.",
        tip: "When public trust drops below 0.7, protest events fire periodically. Ignore them and trust continues falling in a cascade. Address them immediately.",
        deepDive: "#core-metrics"
      },
      {
        title: "Housing Capacity Bar",
        body: "The housing capacity bar shows population vs. max housing. When the bar turns red (>90% full), population growth stops at the cap. Build Housing units before you hit the limit. Each housing building adds +20 pop capacity. Apartment Blocks (Classical Age+) add +50. City Center buildings add +100. More population also means more taxable citizens contributing to GDP.",
        tip: "A simple rule: always have housing capacity at least 30% above current population. This buffer lets you absorb natural growth spikes without stalling.",
        deepDive: "#population"
      },
      {
        title: "Stock Index (Nation Stats Panel)",
        body: "Below the treasury display is your Nation Stock Index — a composite measure of your economic health as it affects stock valuations. It's calculated from GDP × stability × public trust. This number directly impacts your IPO listing prices and how your existing stocks are valued on the exchange. A rising stock index means your stocks are becoming more attractive to investors.",
        tip: "Before doing a major IPO, ensure your stock index is strong. Advance your epoch or stabilize before listing — you'll get a significantly higher initial price.",
        deepDive: "#ipo"
      },
    ]
  },
  {
    id: "resources-workers", icon: "👷", color: "#f97316",
    title: "Workers & Resources", summary: "Assign your citizens to produce everything your nation needs.",
    steps: [
      {
        title: "The Workforce Panel — Basics",
        body: "Open the Workers panel from the top bar. Your entire population is available for assignment. Total assigned workers cannot exceed your population. Unassigned workers are unemployed — they produce nothing and create unemployment rate drag on GDP and public trust. Each role produces a specific output every tick based on your epoch multiplier.",
        tip: "Keep unemployment below 10%. Above 15%, you trigger inflation pressure and public trust decline that compounds quickly.",
        deepDive: "#workers"
      },
      {
        title: "Food Workers — Survival Priority",
        body: "Farmers produce 8 food/tick each. Hunters produce 3–7 food/tick (random). Fishermen produce 6 food/tick. Your population consumes 1.2 food/tick per person. With 10 pop: consumption = 12/tick. Two farmers produce 16/tick — a +4 surplus. NEVER let net food go negative while you're offline. Famine depletes population and stability rapidly.",
        tip: "For early game (Stone Age): 2 farmers per 10 population is minimum. 3 farmers per 10 is comfortable. 4+ per 10 lets you safely grow population without food anxiety.",
        deepDive: "#food"
      },
      {
        title: "Construction Resources — Wood & Stone",
        body: "Lumberjacks produce 5 wood/tick each. Stone workers produce 4 stone/tick each. Every building costs both wood and stone. In the Stone Age you need a constant supply for growth. A Lumberyard building adds +25% to all wood production. A Quarry building adds +20% to stone production. These modifiers stack with epoch multipliers.",
        tip: "Don't stockpile too much wood/stone beyond what you need for your next 3 buildings. Redirect workers to food or gold instead. Resources sitting in storage are idle potential.",
        deepDive: "#resource-workers"
      },
      {
        title: "Gold Miners — Economic Lifeline",
        body: "Gold Miners produce 2 gold/tick each. Gold serves as your physical trade currency — you can sell it on the global market or use it in trade routes with allied nations. It also counts toward National Wealth. Gold Mine buildings add +30% production. Gold never expires and has always-present demand on the global market.",
        tip: "Keep at least 2 Gold Miners running at all times, even in advanced epochs. Gold remains universally valuable as a trade commodity through all ages.",
        deepDive: "#resource-workers"
      },
      {
        title: "Iron Miners (Iron Age+) & Oil Engineers (Industrial Age+)",
        body: "Iron Miners produce 3 iron/tick each, unlocking at Iron Age. Iron is required for military buildings, fortresses, and advanced construction. Oil Engineers produce 6 oil/tick, unlocking at Industrial Age. Oil fuels your industrial economy — without it, construction costs spike and manufacturing suffers. Iron Works building: +25%. Oil Rig building: +40%.",
        tip: "Immediately assign 2–3 Iron Miners the moment you reach Iron Age. Iron is needed for most Bronze Age+ military upgrades and quickly becomes your bottleneck resource.",
        deepDive: "#resource-workers"
      },
      {
        title: "Researchers — Tech Engine",
        body: "Researchers generate Tech Points each tick. Base output scales with your Education Spending percentage and epoch. A single researcher at 20% education spending generates roughly 0.5 TP/tick early-game. Universities, Colleges, and Schools multiply output significantly. More researchers = faster epoch advance = earlier access to powerful mechanics. Tech Points also increase your storage capacity when you build education structures.",
        tip: "Assign at least 2 researchers from day one. Delaying research means delaying epoch advance which means every other stat is weaker for longer. Time compounds.",
        deepDive: "#research-system"
      },
      {
        title: "Soldiers — Military Assignment",
        body: "Soldiers contribute +10 Unit Power each. They don't produce resources, so assigning them is a pure military investment. Your Defense Level comes primarily from buildings (Barracks +15, Walls +25, Fortress +50), not soldiers. Soldiers raise your OFFENSIVE power — critical for dealing war damage. The formula: War Damage = (YourTechLevel / EnemyDefenseLevel) × YourUnitPower × FundMultiplier.",
        tip: "In peacetime, keep soldiers at 0–2. In war preparation, raise them to 4–6. Don't over-assign soldiers at the expense of food or researchers — you'll win the war but lose the peace.",
        deepDive: "#military"
      },
      {
        title: "Epoch Multipliers on Production",
        body: "Every epoch you advance multiplies all worker output by 8% cumulatively. By Industrial Age (epoch 7), workers produce ~56% more than in the Stone Age. This means the same 2 farmers who produced 16 food/tick in the Stone Age now produce 25/tick in Industrial. The multiplier applies to ALL worker types — food, wood, stone, gold, iron, oil, and tech points.",
        tip: "This is why epoch advancement compounds so powerfully. Every worker you have gets a permanent production bonus with each advance. Early investment in tech pays exponentially.",
        deepDive: "#epochs"
      },
    ]
  },
  {
    id: "economy", icon: "💰", color: "#fbbf24",
    title: "Economy & Budget", summary: "Tax, spend, inflate, and grow — master the economic engine.",
    steps: [
      {
        title: "Opening the Budget Panel",
        body: "Click 'Manage' in the top bar. The Budget Cycle Panel has four tax sliders: Income Tax (0–50%), Sales Tax (0–25%), Corporate Tax (0–40%), Import Tariffs (0–30%). Below that: Military Spending % and Education Spending % of GDP. Changes apply on the next economic tick (~60 seconds). The panel shows your projected net income change before you save.",
        tip: "Always wait 2–3 ticks after a budget change before evaluating its impact. One tick can be noisy due to one-time events.",
        deepDive: "#budget"
      },
      {
        title: "The Four Tax Streams",
        body: "Income Tax: Reduces consumer spending proportionally — direct hit to GDP via citizen spending. Best at 12–20%. Sales Tax: Slows commercial activity, broader base. Best at 5–12%. Corporate Tax: Affects stock prices and IPO valuations. Best at 10–18%. Tariffs: Protects domestic industry but raises import costs. Best at 5–10%. Each 1% increase in income tax reduces public trust by approximately 0.01 over time.",
        tip: "Corporate tax is often the highest-ROI tax. It generates substantial revenue while mainly affecting stock valuations rather than citizen happiness. Raise it before raising income tax.",
        deepDive: "#budget"
      },
      {
        title: "Inflation — The Hidden Enemy",
        body: "Inflation rises when your money supply grows faster than goods production. Above 8%: resource prices increase. Above 15%: construction costs +25%. Above 25%: Hyperinflation crisis events. Inflation is caused by: treasury deficits, wars, rapid population growth, and high consumer spending with low manufacturing output. It's reduced by: raising taxes, cutting spending, increasing manufacturing, and trade surpluses.",
        tip: "The fastest anti-inflation action is raising corporate tax 3–5%. It removes money from circulation (less profit-taking) without directly reducing citizen happiness.",
        deepDive: "#inflation"
      },
      {
        title: "National Wealth vs. Treasury",
        body: "Treasury is your liquid cash. National Wealth is your total economic power: GDP + Infrastructure Value (all buildings ever built) + Resource Stockpile Value (at current market prices) + Stock Market Cap. National Wealth determines loan capacity, leaderboard standing, and diplomatic credibility. You can have low treasury but high National Wealth — your nation is asset-rich, cash-poor.",
        tip: "Never sell your entire resource stockpile to fix a treasury crisis. Your stockpile is wealth — sell 30% max and find other solutions for the remaining gap.",
        deepDive: "#wealth"
      },
      {
        title: "Military & Education Spending",
        body: "These are percentage-of-GDP expenditures, not flat amounts. At 20% military with GDP 500 = 100 credits/tick of spending. If GDP grows to 1000, the same 20% = 200 credits/tick. So as your economy grows, spending in absolute terms automatically grows too. Military below 10% causes gradual troop attrition. Education above 35% hits diminishing returns. The sweet spot: 20% military + 25% education in peacetime.",
        tip: "The most underrated optimization: drop military to 15% in peaceful periods and redirect that 5% GDP gap to education. You'll advance epochs noticeably faster.",
        deepDive: "#spending"
      },
      {
        title: "Banking & Loans",
        body: "Access the Banking panel from Marketplace. Three loan types: Short-Term (100–500 cr, 15% flat, 10 ticks), Development Loan (500–2000 cr, 10%, 24 ticks), Sovereign Bond (1k–10k cr, market rate, 48+ ticks, other players can invest). Loans are auto-repaid from treasury each tick. Missing payments (treasury < 0) causes default: -10 stability, credit rating crash, creditor notified.",
        tip: "Development loans are the best value for mid-game construction. A 1,000 credit loan that funds 3 factories can generate 3× its cost in GDP over the repayment period.",
        deepDive: "#banking"
      },
      {
        title: "Trade Balance — Export to Prosper",
        body: "Trade Balance = Exports - Imports per tick. A surplus adds credits to your treasury automatically every tick. A deficit drains it. Set up Trade Routes from Marketplace to create recurring flows. The more export routes you run, the better your trade balance. Always aim for 2+ active export routes from the Bronze Age onward.",
        tip: "Export your most abundant resource. Import your scarcest resource. If wood is plentiful but iron is scarce, set up an export route for wood and an import route for iron. Specialization wins.",
        deepDive: "#trade"
      },
      {
        title: "Currency Stability",
        body: "Currency Stability (0.1–2.0) multiplies the effective value of all credits in your economy. Above 1.5: citizens feel wealthy, boosting consumer spending by 50%. Below 0.5: economic depression, all transactions lose value. Currency stability is eroded by high inflation and bankruptcy. It's strengthened by: trade surpluses, low inflation, and government policies like tax cuts and tech subsidies.",
        tip: "A nation with 1.5 currency stability running 15% income tax effectively taxes like it's at 22.5% — citizens spend more freely. Currency stability is a force multiplier.",
        deepDive: "#inflation"
      },
      {
        title: "Policies — Strategic Toggles",
        body: "From the Government page, toggle policies that persist until disabled: Healthcare (+10 stability, costs credits/tick), Martial Law (+20 Defense/Unit Power, -20 trust, -10 stability), Tech Subsidies (+15% TP generation, -5% construction costs), Tax Cuts (+10% consumer spending, -8% tax revenue), Conscription (+20 soldiers instantly, -5 trust). Each has clear tradeoffs.",
        tip: "Run Healthcare and Tech Subsidies simultaneously during a tech push for epoch advancement. It's expensive but cuts weeks off your advancement timeline.",
        deepDive: "#policies"
      },
      {
        title: "Reading the Economy Engine",
        body: "The Economy/Min section in Nation Stats shows live projections per tick. Income = tax revenue collected. Expense = military + education spending. Net = the difference. If Net is green (+), your treasury is growing each tick. If red (-), it's shrinking. The Food/Min section works identically for food. These two rows tell you everything you need to know about your nation's health at a glance.",
        tip: "A useful weekly habit: start every session by checking Net economy and Net food. If both are positive and above your comfort threshold, you can focus on expansion. If either is negative, address it first.",
        deepDive: "#budget"
      },
    ]
  },
  {
    id: "construction", icon: "🏗️", color: "#a78bfa",
    title: "Construction Hub", summary: "Build the infrastructure that powers your civilization.",
    steps: [
      {
        title: "The Construction Hub — How It Works",
        body: "Click Build in the top bar. Buildings are organized into categories: Food & Agriculture, Resource Production, Housing, Education & Research, Military, Economic, and Government. Each building shows: resource cost, required epoch, effect description, and any prerequisites. Construction is instant — resources are deducted immediately and the building effect begins the next tick.",
        tip: "Construction costs include an inflation modifier. High inflation (above 10%) can make buildings 25%+ more expensive. Build during low-inflation periods for maximum efficiency.",
        deepDive: "#buildings"
      },
      {
        title: "Stone Age Priority Build Order",
        body: "Optimal first 5 buildings: 1) Farm (food security), 2) Housing (open population cap), 3) School (start TP generation), 4) Lumberyard (boost wood income), 5) Gold Mine (improve treasury income). Next 5: Granary (food storage), Barracks (defense), Housing #2 (pace population), Quarry (stone production), School #2 (accelerate tech). Don't build a College or University yet — cost is too high without stable economy.",
        tip: "If you see another nation expanding militarily near you in the early game, swap step 5 (Gold Mine) for Barracks. Defense first if threatened.",
        deepDive: "#build-order"
      },
      {
        title: "Building Upgrades — Better Than New Construction",
        body: "Every building can be upgraded to Level 2, 3, and beyond. Upgrade Cost = Base Cost × Level × 1.5 × Inflation. A Level 2 Farm produces more food than two Level 1 Farms while using one building slot. Level 3 School: +4.5 TP/tick vs. Level 1's +1 TP/tick — for 3× the cost, you get 4.5× the output. Generally: upgrading is more efficient than building duplicates once you have more than 2 of the same type.",
        tip: "Upgrade Farms to Level 3 before building a third Farm. Upgrade Schools to Level 2 before building a third School. The output per resource spent is significantly better.",
        deepDive: "#buildings"
      },
      {
        title: "Food & Agriculture Buildings",
        body: "Farm: +food production per tick (scales with level). Granary: +5,000 food storage cap (base is 6,000). Agricultural School: +% to farmer output. Irrigation System (Classical Age+): major food production boost, requires Plains or Coastal terrain. Greenhouse (Renaissance Age+): produces food independent of workers. The Granary is the most underrated early building — without it, surplus food is wasted.",
        tip: "Build your first Granary before you have a food surplus. Once your reserves fill the base 6,000 cap, all surplus is wasted. The Granary prevents this.",
        deepDive: "#buildings"
      },
      {
        title: "Education & Research Buildings",
        body: "School: +1,000 TP storage, +1 TP/tick base. College: +3,000 TP storage, +2.5 TP/tick (Bronze/Iron Age+). University: +6,000 TP storage, +4 TP/tick (Renaissance Age+ — the most powerful). The TP storage cap matters: if your total TP equals your storage capacity, generation stops. Always expand storage before hitting the ceiling or you waste production every tick.",
        tip: "Build your first University the moment you hit Renaissance Age. It's the highest-output education building and single-handedly accelerates all future epoch progression.",
        deepDive: "#research-system"
      },
      {
        title: "Military Buildings — Defense Architecture",
        body: "Barracks (Stone Age): +15 Defense, +5 Unit Power, costs 60 wood + 40 stone. Walls (Bronze Age): +25 Defense, -15% incoming war damage, costs 120 stone + 30 gold. Watchtower (Bronze Age): +8 Defense, spy detection. Fortress (Medieval Age): +50 Defense, +20 Unit Power — the single best defensive structure. Military Academy (Renaissance Age): +30% Unit Power efficiency. Siege Workshop: unlocks siege units.",
        tip: "Walls are the best defense-per-stone investment in the game. Build them the moment Bronze Age unlocks regardless of whether you're actively threatened. They prevent conflicts before they start.",
        deepDive: "#military-buildings"
      },
      {
        title: "Economic Buildings",
        body: "Factory (Industrial Age+): +GDP%, +Manufacturing Index — largest GDP booster available. Bank: unlocks better loan terms, +credit interest. Port (Coastal hex only): +2 trade route capacity, +trade throughput bonus — excellent on coastal nations. Warehouse (Small +5K, Industrial +25K, Strategic +100K resource storage). Treasury Building: +tax efficiency. Marketplace Building: +commodity trade volume.",
        tip: "If you have a coastal tile, building a Port is one of the best economic investments in the game. The trade throughput bonus alone pays for itself within 10 ticks of active trade routes.",
        deepDive: "#buildings"
      },
      {
        title: "Unique Buildings & Special Restrictions",
        body: "Some buildings can only be built once per nation (marked UNIQUE): City Center, National Library, Palace, Observatory, Royal Mint. These provide powerful one-time bonuses. City Center: +100 pop capacity + GDP bonus. National Library: +Influence Point regen. Palace: +Public Trust. Observatory (Renaissance+): +20% TP generation globally. Royal Mint: +10% tax efficiency, +treasury interest.",
        tip: "The Observatory is one of the best investments in Renaissance Age. Build it immediately when unlocked — a permanent 20% TP bonus from that point forward means faster every future epoch advance.",
        deepDive: "#buildings"
      },
    ]
  },
  {
    id: "tech-research", icon: "🔬", color: "#818cf8",
    title: "Tech Tree & Research", summary: "Advance through 12 epochs by mastering technology.",
    steps: [
      {
        title: "Tech Points — How They're Generated",
        body: "Tech Points (TP) are generated each tick by: Researchers (workers assigned in Workforce panel), School/College/University buildings, and Education Spending bonus. The formula is roughly: TP/tick = (Researcher count × edu_multiplier) + (building bonuses). TP are stored up to your storage capacity. Storage = base (500) + buildings. If storage is full, generation stops. Always expand storage before hitting the cap.",
        tip: "Don't wait until you have thousands of TP to spend them. Unlock techs as you earn them — each tech provides ongoing bonuses that compound over time.",
        deepDive: "#research-system"
      },
      {
        title: "The Tech Tree — Branches & Priorities",
        body: "The Tech Tree has 7 branches: Agriculture, Industry, Science, Military, Diplomacy, Economics, and Engineering. Each branch has 5–8 techs with prerequisites. Science Branch is highest priority for all playstyles — it accelerates TP generation and unlocks the path to higher education buildings. Agriculture Branch is critical for stability. Military Branch is the cheapest in TP but only helps during conflicts.",
        tip: "Focus on one branch at a time. Unlocking half of Science and half of Industry provides far weaker compounding than completing the Science Branch first and then Industry.",
        deepDive: "#tech-tree"
      },
      {
        title: "Must-Have Early Techs",
        body: "Priority tier list for all playstyles: 1) Metal Working (unlocks Bronze Age advance), 2) Crop Rotation (+15% food — frees farmers for other roles), 3) Writing (+5% TP/tick — permanent compounding bonus), 4) Architecture (-10% all construction costs — applies to every building you ever build), 5) Currency (+8% tax efficiency + enables banking). These five techs transform your economy within the first real hour of play.",
        tip: "Architecture + Metal Working together: cheaper buildings AND access to Bronze Age. Unlock them as your first two TP expenditures if possible.",
        deepDive: "#tech-tree"
      },
      {
        title: "The Research Panel — Major Projects",
        body: "Separate from the Tech Tree, the Research Panel handles large multi-tick projects. Each project has a total research requirement reduced by your assigned Researchers per tick. With 5 researchers on a 100-tick project: finishes in 20 ticks. Projects come in categories: Scientific (TP bonuses), Military (unit boosts), Economic (GDP multipliers), Social (stability/trust), and Infrastructure (construction bonuses).",
        tip: "Always have a research project active. An empty queue is wasted researcher output. Queue your next project the moment the current one completes.",
        deepDive: "#research-queue"
      },
      {
        title: "Global Research Breakthroughs — First Mover Advantage",
        body: "Certain major research projects are 'global firsts' — the first nation to complete them receives: a world announcement in Global Chronicles and World Chat, an exclusive 24–48 tick bonus, and long-term competitive advantage in that domain. First nation to complete Gunpowder Research gets a military power bonus. First to complete Steam Power gets an industrial efficiency bonus. These breakthroughs signal power to other nations.",
        tip: "Announce you're close to a breakthrough in the Allies channel. Your allies can provide diplomatic cover while you finish — a declaration of war during your final research ticks is a classic counter-strategy.",
        deepDive: "#research-queue"
      },
      {
        title: "Epoch Advancement Requirements",
        body: "To advance an epoch, you need: (1) All mandatory ⭐ techs unlocked for that epoch, (2) The Tech Point threshold reached, (3) Stability ≥ 50, (4) Population minimum. TP thresholds: Bronze 500, Iron 1,200, Classical 2,500, Medieval 5,000, Renaissance 10,000, Industrial 20,000, Modern 40,000, Digital 80,000, Information 150,000, Space 300,000, Galactic 600,000. When all conditions met, the Advance button appears in the Tech Tree.",
        tip: "Check the epoch requirements list in the Tech Tree BEFORE spending TP. Some players waste TP on non-mandatory techs while the required ones sit unresearched, blocking their advance.",
        deepDive: "#epoch-chart"
      },
      {
        title: "Tech Research vs. Epoch Advancement",
        body: "Strategic tension: spend TP on individual techs (immediate ongoing bonuses) vs. stockpile TP to hit epoch threshold faster (one-time unlock). The answer depends on stability. If stable: unlock techs along the way — each one compounds. If threatened: stockpile TP and advance epoch ASAP to unlock military/economic upgrades that change your power level. Both approaches are valid depending on context.",
        tip: "Never stockpile TP above your storage cap. If your storage is 3,000 TP and you have 2,800, immediately unlock techs or you waste everything generated above 3,000.",
        deepDive: "#tech-tree"
      },
    ]
  },
  {
    id: "world-map", icon: "🗺️", color: "#06b6d4",
    title: "World Map & Territory", summary: "Claim land, see your rivals, project power across the globe.",
    steps: [
      {
        title: "Map Navigation",
        body: "Click the map once to unlock panning (cursor changes to grab). Scroll to zoom in and out. Zoom range: 35%–600%. The top bar has a Global/National toggle: Global shows the whole world, National zooms to your territory and immediate neighbors. Map Controls panel (bottom right) has zoom +/-, reset view, and the Layer Panel toggle (grid icon) for overlay switching.",
        tip: "Use the Search Bar (magnifying glass, top right) to instantly center on any nation by name. Much faster than panning when the world gets large.",
        deepDive: "#map"
      },
      {
        title: "Map Overlays — What You Can See",
        body: "Toggle overlays in the Layer Panel: Wars (red fire zones), Battles (combat animations), Trade Routes (flowing ship lines), Danger Zones (threat indicators), Resources (resource deposits on hexes), Territories (colored territory claims), Cities (city markers), Armies (military unit positions), Infrastructure (building density heat map). Overlays are off by default — enable them as needed.",
        tip: "Trade Routes overlay is invaluable for economic intelligence — you can see who trades with whom, identifying strategic relationships before any diplomacy.",
        deepDive: "#map"
      },
      {
        title: "Hex Tiles — The Building Blocks of Territory",
        body: "The world is a hex grid. Each tile has: Terrain Type (plains, forest, mountains, coastal, desert, tundra, ocean), Resource Type and Amount, Owner Nation, Infrastructure Level (0–5), and Population Capacity. Terrain determines what buildings can be placed on the tile, what resources it generates, and its defensive bonus. Mountains give +25% defense. Forests give +10%. Coastal tiles allow Ports.",
        tip: "Your capital tile gets a permanent +30% defense bonus. Choose your capital tile carefully — plains near the center of your territory for maximum connectivity.",
        deepDive: "#terrain"
      },
      {
        title: "Territory Expansion",
        body: "Your ProceduralWorldEngine automatically expands your territory as you grow — high GDP + high stability + not at war = auto-expansion into adjacent unclaimed hexes. You can also manually claim tiles from the Hex Map page. Unclaimed tiles cost 50 wood + 50 stone. Enemy tiles require military conquest. Maximum territory: 25 tiles per nation (additional expansion requires war).",
        tip: "Expand in compact clusters, not thin tendrils. A connected 5-hex cluster is far easier to defend than 5 scattered individual hexes.",
        deepDive: "#expansion"
      },
      {
        title: "City Markers on the Map",
        body: "Cities you found appear as glowing markers on the World Map. City markers show the city name and flag. Other nations can see your cities and plan around them diplomatically or militarily. Cities provide defense bonuses to their hex tile — urban infrastructure is harder to capture than open terrain.",
        tip: "When founding a city, name it thoughtfully — it appears in news events, global chat announcements, and on every nation's map forever.",
        deepDive: "#cities"
      },
      {
        title: "Reading Nation Icons on the Map",
        body: "Each nation appears as a colored flag icon with border indicators: Red border = currently at war. Green border = your ally. Amber border = danger zone. Cyan = your own nation. Icon size scales slightly with GDP. Clicking any icon opens their Nation Profile: epoch, GDP, stability, allies, wars, and interaction buttons.",
        tip: "The Nation Profile interaction buttons (Offer Alliance, Declare War, Send Aid) trigger instant diplomatic actions. Check a nation's stats carefully before clicking Declare War — no undo.",
        deepDive: "#diplomacy"
      },
      {
        title: "Weather Radar & Live Animations",
        body: "The World Map has a live weather radar overlay (green sweep). It shows animated weather cells (blue storm blobs) that move across the map. These are cosmetic but correspond to real NewsEvents about weather in nearby nations. War zones show animated fire effects over affected territory. Active trade routes show small ship animations along trade lane paths.",
        tip: "When you see fire animations over a territory, check the System chat channel — there will be news about the active war there, including which nations are fighting and current status.",
        deepDive: "#map"
      },
    ]
  },
  {
    id: "diplomacy-war", icon: "⚔️", color: "#f87171",
    title: "Diplomacy & War", summary: "Forge alliances, broker peace, or conquer your rivals.",
    steps: [
      {
        title: "The Nation Interaction System",
        body: "Click any nation on the World Map (or their name in World Chat) to open their Nation Profile modal. This shows: flag, name, epoch, government type, GDP, stability, population, current wars, current allies, and military stats. Action buttons: Offer Alliance, Propose Trade, Send Aid, Lend-Lease, Declare War, and Negotiate Peace (when at war). All diplomatic actions cost Influence Points.",
        tip: "Always read the full profile before any diplomatic action. Check 'At War With' before offering alliance — you'd be inheriting their ongoing conflicts.",
        deepDive: "#diplomacy"
      },
      {
        title: "Influence Points — Diplomatic Currency",
        body: "Influence Points (IP) are spent on all major diplomatic actions. IP regenerates passively each tick based on your stability and population. The Policy Center in the Government page shows your current IP and regen rate. Build National Library for +IP regen. Key costs: Declare War = 50 IP, Alliance Proposal = 25 IP, Sanctions = 40 IP, /spy = 15 IP, /trade = 10 IP.",
        tip: "Keep at least 25 IP in reserve at all times. You never know when you need to propose a defensive alliance with an ally who's just been attacked.",
        deepDive: "#influence-points"
      },
      {
        title: "Forming Alliances",
        body: "Propose an alliance from the Nation Profile (costs 25 IP). The other player receives a notification. They accept through their Notifications panel. Both nations are then allied: mutual defense alerts, -5% tariff on all trades, access to Allies chat channel, and shared intelligence about each other's military. Breaking an alliance costs IP and destroys diplomatic trust.",
        tip: "Form your first alliance with a nation that has a complementary economy — if you produce wood, ally with an iron producer. Economic ties make the alliance immediately and measurably valuable.",
        deepDive: "#alliances"
      },
      {
        title: "Trade Agreements — Economic Diplomacy",
        body: "Three types: Free Trade Agreement (tariff to 0%, 10-cycle duration, best for long-term allies), Tariff Reduction (tariff cut 50%, 8 cycles, for friendly neutrals), Embargo (tariff +200%, effectively blocking all trade, indefinite, use for economic warfare). Propose via /trade @NationName in chat or the Trade Agreements tab in Marketplace. Requires IP and recipient acceptance.",
        tip: "A Free Trade Agreement is the best first diplomatic step with any potential ally. Propose it before the alliance — if they accept trade, you've built mutual economic interest that makes the alliance more likely.",
        deepDive: "#trade-agreements"
      },
      {
        title: "Foreign Aid — Building Relationships",
        body: "You can send Credits, Resources, or Items to any nation via their profile (Lend-Lease or Aid button). Aid costs no IP but does cost actual resources/credits from your reserves. Aid is logged publicly in the Global Activity Ledger — all other nations see you as generous. Repeated small aid builds diplomatic goodwill faster than a single large transfer.",
        tip: "Sending aid to a nation under attack (even if you're not allied) is one of the most powerful diplomatic moves in the game. It builds loyalty that pays off for many sessions.",
        deepDive: "#lend-lease"
      },
      {
        title: "Declaring War — Mechanics",
        body: "Declare War via the Nation Profile (costs 50 IP + requires no active wars). You select a War Fund % (5–30% of treasury) — higher fund = more damage per strike. Each attack simultaneously reduces all 4 conquest stats: Stability → 0, GDP → 100, Manufacturing → 10, Treasury → 0. Conquest requires ALL FOUR floors simultaneously. The Conquest Progress panel shows strikes remaining for each stat.",
        tip: "War is most effective with combined strikes. Launch attacks every tick during wars — stopping attacks lets the enemy partially recover their stats between your strikes.",
        deepDive: "#war"
      },
      {
        title: "War Damage & Defense Formula",
        body: "Your damage per strike = (YourTechLevel ÷ EnemyDefenseLevel) × YourUnitPower × FundMultiplier. A nation with Defense Level 100 reduces incoming damage by 50% vs. Defense Level 50. This is why building Walls and Fortresses before conflicts is critical. Wars auto-expire after 1 game week (~3.5 real hours). While at war: both nations suffer -1 stability/tick and population decline risk.",
        tip: "If you're being attacked and can't win militarily, survive it. Wars auto-expire in 3.5 hours. Hoard food, maintain stability above 30, and hold out. The attacker often loses more than they gain.",
        deepDive: "#war"
      },
      {
        title: "Peace Negotiations",
        body: "Either party can propose peace terms via the Nation Profile at any time during an active war. Peace terms can include: resource transfers, credit payments, territorial adjustments, and formal agreements. The system logs peace proposals publicly. Ignoring a peace proposal for 5 ticks = auto-rejection. If neither side proposes peace, war auto-expires at the 1-game-week mark.",
        tip: "The ideal moment to propose peace is after dealing significant damage but before the enemy has time to fully rebuild their military. Lock in your advantage while you have leverage.",
        deepDive: "#peace-deals"
      },
      {
        title: "Spy Intelligence",
        body: "Use /spy @NationName in World Chat (costs 15 IP) to reveal that nation's military stats, current war status, and approximate resource levels. Spy reports are private — only you see the results. Intelligence is critical before any military action. Attacking a nation blind is one of the most common beginner mistakes. Always spy before declaring war.",
        tip: "Spy on nations regularly, not just before conflict. Understanding their growth trajectory tells you when they're becoming a threat before they're actually capable of attacking you.",
        deepDive: "#commands"
      },
    ]
  },
  {
    id: "stock-market", icon: "📈", color: "#34d399",
    title: "Stock Market & Exchange", summary: "IPO, invest, and dominate the financial world.",
    steps: [
      {
        title: "Your First IPO",
        body: "Click 'Issue Stock' in the top bar. Fill in: Company Name, Ticker (2–4 letters), Sector, Total Shares, and Base Price. The actual IPO price is calculated from your GDP, stability, public trust, epoch, and the sector modifier. It can only go UP from your base price (resource bonuses), never down. IPO listing costs 5% of total IPO value from your treasury.",
        tip: "IPO when your GDP and stability are high — you'll get a higher auto-calculated price. The Technology sector gets the highest sector modifier (×1.5). Nano sector (×2.0) is available in Digital Age+.",
        deepDive: "#ipo"
      },
      {
        title: "Stock Price Mechanics",
        body: "After listing, your stock price fluctuates ±8% per tick based on: your GDP growth (positive = up), stability (drops = down), public trust, inflation rate (high = down), and war status (-25% penalty while at war). Price history is shown as a sparkline on the ticker and full chart in the Exchange. Hard cap: $150 per share. Crashed stocks drop 50–90% instantly.",
        tip: "Your stock price is a live indicator of your national health. Watching your own stock price is a quick health check — if it's been falling 3+ ticks, something in your economy needs attention.",
        deepDive: "#stocks"
      },
      {
        title: "The Global Exchange Page",
        body: "The Global Exchange shows all listed stocks from all nations. Filter by: Sector, Epoch Required, Nation. Sort by: Price, Change %, Market Cap, Volume. Click any stock for its full detail panel: price history chart, issuing nation's current stats, your current holding, and Buy/Sell interface. Buy shares with your treasury credits. Sell at current market price.",
        tip: "Sort the Exchange by 'Change %' in descending order to find the fastest-growing stocks. Sort ascending to find potential recovery plays (recently crashed stocks of stable nations).",
        deepDive: "#stocks"
      },
      {
        title: "Investment Strategy — What to Buy",
        body: "Positive signals to buy: Growing GDP, high stability (70+), high public trust (0.8+), low inflation, trade surplus, no active wars, recent tech unlocks or epoch advance. Negative signals to sell: Active wars, inflation above 12%, stability declining, treasury deficit, GDP shrinking. The single best signal: a nation about to advance an epoch typically sees a 20–40% stock surge in the 5 ticks following advancement.",
        tip: "Buy stock in allied nations with growing economies early. As they advance epochs and your shared trade routes generate revenue, their stocks compound while you profit.",
        deepDive: "#stocks"
      },
      {
        title: "AI Nations & The Exchange",
        body: "AI nations automatically IPO their stocks as they develop. Their prices follow the same formula. AI-issued stocks often start cheaper but can be excellent investments if the AI nation is growing (you'll see growth in the Activity feed: epoch advances, alliance formations). The WorldSimulationEngine runs AI nations through strategic growth cycles — track the high-performing AIs for investment opportunities.",
        tip: "AI stocks from high-epoch nations (Digital Age+) are often undervalued because human players overlook them. These can be the best return-on-investment in the Exchange.",
        deepDive: "#ipo"
      },
      {
        title: "Market Crashes — Crash & Opportunity",
        body: "Crash triggers: treasury bankruptcy, inflation above 20% for 3+ ticks, stability below 15, losing a devastating war, GDP drop >30% in one tick. When a crash occurs: all that nation's stocks drop 50–90% instantly, a BREAKING NEWS event fires in Global Chronicles, Global Activity feed announces it, shareholders are notified. After the crash period, stocks gradually recover IF the underlying economy improves.",
        tip: "The best time to buy stock is right after a crash in a fundamentally strong nation. Wait 2–3 ticks after the crash announcement for the panic selling to settle, then buy at the bottom.",
        deepDive: "#crashes"
      },
      {
        title: "Your Stock Portfolio & Diversification",
        body: "Your Stock Holdings are tracked in your Nation Profile (Profile → Economic Ledger or Exchange page). Each holding shows: shares owned, average buy price, current price, profit/loss. Diversify across at least 3 nations and 2 sectors. Never put more than 30% of your investment credits into a single nation's stock — a crash would be catastrophic. Holdings also contribute to your National Wealth.",
        tip: "Review your portfolio at the start of each session. If any holding is down more than 25% from your buy price and the nation shows warning signs, consider cutting your losses before further decline.",
        deepDive: "#stocks"
      },
    ]
  },
  {
    id: "world-chat", icon: "💬", color: "#22d3ee",
    title: "World Chat & Communication", summary: "Negotiate, threaten, trade, and forge history in real time.",
    steps: [
      {
        title: "Three Channels — When to Use Each",
        body: "Global: All active players see every message. Use for public diplomacy, announcements, trade offers, and general discussion. Allies: Only you and your allied nations see messages. Use for coordinating strategy, sharing intelligence, and sensitive discussions. System: Automated game announcements only — epoch advances, crashes, wars, breakthroughs. Activity Tab: Global Ledger — every significant game action by any nation, chronologically.",
        tip: "Read the System channel EVERY session. It's the unfiltered world state — epoch advances tell you who's pulling ahead, crashes tell you who's struggling.",
        deepDive: "#chat-channels"
      },
      {
        title: "Full Command Reference",
        body: "Diplomatic: /ally @Nation (25 IP), /war @Nation (50 IP), /peace @Nation (30 IP), /trade @Nation (10 IP). Economic: /aid @Nation [resource] [amount], /sanction @Nation (40 IP), /embargo @Nation, /loan @Nation [amount]. Intelligence: /spy @Nation (15 IP), /intel (view reports). Info: /top (leaderboard), /prices (commodities), /wars (active conflicts), /news (recent events). Type '@' for nation name autocomplete.",
        tip: "Use /top every session to track power rankings. A nation that wasn't in the top 10 last week and suddenly appears has made major economic moves worth understanding.",
        deepDive: "#commands"
      },
      {
        title: "AI Nation Leaders in Chat",
        body: "AI nations have named leaders (e.g., 'Chancellor Arman Petrov – Valdoria') who respond to messages addressed to them or about them. They use adaptive personalities that evolve based on your interactions. Accuse them repeatedly and they become hostile. Trade with them consistently and they become cooperative. They respond in character — treat them like real diplomatic counterparts.",
        tip: "Private message an AI nation leader to negotiate deals. They can agree to trade routes, aid transfers, and even alliances through private chat — and will actually execute the transfers.",
        deepDive: "#private-messages"
      },
      {
        title: "Private Messaging",
        body: "Click the 🔒 lock icon in the chat header. Search or select a nation to open a confidential PM channel. Messages are visible ONLY to you and the recipient. Ideal for: secret alliances ('I'm attacking X tomorrow, want to co-attack?'), intelligence sharing, sensitive peace terms before making them official, and negotiating custom trade deals.",
        tip: "The most powerful diplomatic moves happen in private first. Never announce a major alliance publicly without privately confirming the terms first.",
        deepDive: "#private-messages"
      },
      {
        title: "Reactions & Reply Threading",
        body: "Hover over any message to see action icons: react with emoji (🔥, ❤️, 👍, 😮, 🤝 are the key diplomatic ones), or click Reply to quote the message in your response. Moderators see all reactions. High-tension emoji reactions (💀, ⚔️, 😡) from many players increase the Global Tension meter — at high tension, AI nations become more aggressive and may start wars.",
        tip: "💀 and ⚔️ reactions on messages cause diplomatic tension that can escalate world events. Use them intentionally or avoid them if you want the world to stay peaceful.",
        deepDive: "#chat-channels"
      },
      {
        title: "The Global Activity Ledger",
        body: "The Activity tab is your intelligence feed. It shows: 📈 Stock purchases (who's investing in whom), ⚔️ Wars declared/ended (real-time conflict map), 🤝 Alliances formed/broken (diplomatic landscape), 🔬 Tech breakthroughs (who's advancing epochs), 💰 Economic events (bankruptcies, market crashes), 💱 Resource transfers (who's sending aid to whom). Filter by event type for focused intelligence.",
        tip: "Two minutes reading the Activity feed tells you more about the current world state than 20 minutes of map observation. Make it your session-opening habit.",
        deepDive: "#global-ledger"
      },
      {
        title: "Moderator Rules & Community Standards",
        body: "Moderators can mute players, delete messages, and log all actions in the moderation system. Rules: No real-world personal attacks. Game-context threats are fine ('I'll declare war on you'). No spam. No sharing another player's private information without consent. Muted players cannot chat but can still play. Reports are logged in ModerationLog.",
        tip: "Stay diplomatic even with rivals. A player you threaten today might be your most valuable ally next week when the geopolitical landscape shifts.",
        deepDive: "#chat-channels"
      },
    ]
  },
  {
    id: "city-management", icon: "🏙️", color: "#f59e0b",
    title: "City Management", summary: "Build living cities with budgets, happiness, and their own events.",
    steps: [
      {
        title: "Founding Your First City",
        body: "Access City Management from the navigation. Click 'Found New City' and select one of your hex tiles. Requirements: own the tile, tile is not ocean/tundra, nation population ≥ 15, treasury ≥ 200 Credits. After founding: city starts with 1,000 population, 75 happiness, 10,000 budget credits. The city's GDP contribution activates immediately.",
        tip: "Place your capital city on a Plains tile near the center of your territory. This maximizes building options and trade connectivity while minimizing border exposure.",
        deepDive: "#city-founding"
      },
      {
        title: "Zoning — Land Allocation",
        body: "Allocate city land into three zones: Residential (houses citizens, required for population growth), Commercial (generates tax revenue and happiness), Industrial (boosts manufacturing, creates pollution). The balance determines your city's character. For a growing city: 40% Residential, 30% Commercial, 30% Industrial. For income: 30/45/25. For manufacturing: 35/25/40. Changes take 5 ticks to fully apply.",
        tip: "Never exceed 40% Industrial unless you're a manufacturing-specialized nation. Pollution above 30 causes a cascade of unhappiness events that spiral into national crises.",
        deepDive: "#zoning"
      },
      {
        title: "Essential City Services",
        body: "Schools: +5 Education per school, improves tech research, reduces youth crime. Hospitals: +8 Health per hospital, reduces disease risk, increases natural population growth. Police Stations: +10 Safety per station, reduces crime rate. Fire Departments: -90% fire event probability. A city without Police quickly develops crime that spreads into national public trust penalties.",
        tip: "The Police Station is your highest-ROI first city service. Two Police Stations covers a city up to 3,000 population without crime issues. Don't delay building them.",
        deepDive: "#services"
      },
      {
        title: "City Budget & Finance",
        body: "Each city runs its own independent budget. Revenue: city tax rate × commercial zones × population × happiness modifier. Expenses: service costs (schools, hospitals, police) + infrastructure maintenance. If city budget goes positive, the surplus flows into your national treasury each tick. If negative, it drains your treasury. Set city tax rates between 12–18% for positive cash flow without happiness penalty.",
        tip: "Never over-tax new cities. A city with 2,000 population at 10% tax generates far more long-term revenue than the same city at 20% tax with lower happiness and slower growth.",
        deepDive: "#city-budget"
      },
      {
        title: "City Happiness — The Master Lever",
        body: "City Happiness (0–100) is the multiplier that drives everything else. High happiness → more population growth → higher tax base → more commercial revenue → bigger city. Happiness is raised by: balanced zoning, good services, low crime, low pollution, low unemployment, cultural buildings. Happiness is reduced by: too much industrial, crime, disease, unresolved events, over-taxation.",
        tip: "If your city happiness is below 60, stop building industrial and commercial zones. Add a Police Station and Hospital first. Happiness above 75 is the inflection point where growth accelerates.",
        deepDive: "#city-growth"
      },
      {
        title: "City Specializations",
        body: "After your city reaches population 2,000, you can specialize it: Balanced (default, no penalties), Industrial (+ manufacturing, + pollution, - happiness), Agricultural (+ food production, + national stability), Tourist (+ GDP, + trade income, requires happiness > 80 first), Tech Hub (+ TP bonus, requires Education Level > 60 first). Specialization unlocks a unique bonus chain but commits you to maintaining the requirements.",
        tip: "Don't specialize until you've stabilized the city at happiness 75+. Specializing too early often forces you into resource allocation that undermines the very stat you need for the specialization to work.",
        deepDive: "#city-founding"
      },
      {
        title: "City Events — Decision Points",
        body: "Cities generate random events that require player decisions: Positive (immigration waves, trade festivals, industrial booms) and Negative (crime waves, disease outbreaks, workers' strikes, fires, riots). Each event has 2–3 options with visible stat previews before you choose. Ignored events escalate after 5 ticks — a minor crime wave becomes a Crime Syndicate event. Unresolved critical events cause national stability penalties.",
        tip: "The 'Negotiate' option in labor/citizen events costs more credits but prevents long-term stat damage and maintains trust. The 'Suppress' option saves money short-term but compounds into worse events. 8 times out of 10, negotiate.",
        deepDive: "#city-events"
      },
      {
        title: "Second & Third Cities",
        body: "Found your second city when your first reaches 500 population AND is running a positive budget (revenue > expenses). Each additional city multiplies your national GDP, production, and TP generation potential — but also multiplies your management complexity. Each city generates its own events. General rule: one well-managed thriving city beats two neglected struggling ones.",
        tip: "Place your second city on a resource-rich tile different from your first — if your first is on plains (food), place your second on mountains (stone/iron) or coastal (trade). Diversify your resource base geographically.",
        deepDive: "#city-founding"
      },
    ]
  },
  {
    id: "marketplace", icon: "🏪", color: "#34d399",
    title: "Marketplace & Trade", summary: "Master the global commodity markets and trade routes.",
    steps: [
      {
        title: "The Global Commodity Market",
        body: "The Marketplace Commodity tab shows all 6 resources with current price, supply/demand ratio, and price sparkline. Prices update each tick based on world supply (sum of all nations' stockpiles) vs. world demand (sum of all nations' consumption). Shortages spike prices dramatically. Surpluses crash them. Base prices: Wood 40, Stone 50, Gold 150, Iron 100, Oil 200, Food 30 (credits per 100 units).",
        tip: "Buy commodities in bulk (1,000+ units) when prices are more than 20% below base price. The difference between panic-buying at peak and strategic buying at trough is often 3× the cost.",
        deepDive: "#commodities"
      },
      {
        title: "Creating Trade Routes",
        body: "Marketplace → Trade Routes tab → New Route. Set: Partner Nation, Resource, Quantity per cycle (how many units transfer per tick), Price per 100 units, Direction (Export = you send, they pay; Import = they send, you pay). Submit — partner receives notification and must accept. Active routes run every tick automatically. Maximum routes: 3 base + 2 per Port building + 2 from Advanced Diplomacy tech.",
        tip: "Set export route prices slightly below market rate. Partners are more likely to accept quickly, and fast approval means more revenue ticks sooner.",
        deepDive: "#trade-routes"
      },
      {
        title: "Export Strategy — What to Specialize In",
        body: "Best export plays by resource: Wood (always needed, Medieval construction boom drives huge demand), Gold (universal value, always buyers), Oil (highest price ceiling, Industrial Age+ nations depend on it), Iron (military demand spikes during world wars — price doubles or triples). Avoid exporting Food unless you have massive surplus — food is your survival resource.",
        tip: "Don't try to export everything. Choose your top 1–2 resources and maximize production of those. Specialization provides more export volume and stronger diplomatic leverage.",
        deepDive: "#specialization"
      },
      {
        title: "Trade Route Diplomacy",
        body: "Trade routes create economic interdependence. A nation that imports 50 iron/tick from you for 100 ticks has now deeply embedded you in their economy. Breaking that route hurts them, giving you diplomatic leverage. Free Trade Agreements reduce tariffs on routes between signatories. Routes with Allied nations get an automatic -5% tariff discount. Routes with enemies are automatically suspended during war.",
        tip: "Start trade routes with nations you want to ally before proposing the alliance. Economic ties precede political ties — the alliance is the formalization of a relationship that already exists.",
        deepDive: "#trade-routes"
      },
      {
        title: "Crafting Marketplace",
        body: "The Crafting Market tab lets players list crafted items (from the crafting system) for other nations to purchase with Credits. 1,400+ craftable items across 18 categories and tiers 1–5. Rare and high-tier items command premium prices. List your surplus crafted items, browse other nations' offerings, and build a crafting-based trading empire in parallel with resource trading.",
        tip: "Tier 4 and 5 items (Epic and Legendary rarity) have no ceiling on what the market will pay. If you can craft them, list them high and wait — someone will always pay.",
        deepDive: "#commodities"
      },
      {
        title: "Import Strategy",
        body: "The Import Panel shows current sell offers from all nations. Buy resources you lack at listed prices. Strategic imports: buy oil before wars (fuel price control), buy iron before a building push (construction speed), buy food during population booms (safety buffer). The key rule: import what you can't efficiently produce yourself, export what you over-produce. A specialized trading nation often outperforms a self-sufficient isolationist.",
        tip: "When oil prices are below 150 per 100 units, stockpile aggressively. This is below the long-term average. You'll use it during industrial construction or sell it back when prices spike.",
        deepDive: "#commodities"
      },
      {
        title: "Trade Agreements — The Formal Layer",
        body: "Beyond trade routes, formal Trade Agreements modify all trades between two nations: Free Trade Agreement (tariff → 0%, 10 cycles), Tariff Reduction (-50% tariff, 8 cycles), Embargo (+200% tariff, indefinite). Propose via /trade @Nation in chat or the Trade Agreements panel in Marketplace. The other nation must accept within 12 ticks. Embargoes can trigger war declarations from the embargoed nation.",
        tip: "Never issue an embargo without being prepared for war. The embargoed nation will almost certainly retaliate diplomatically, and many will retaliate militarily.",
        deepDive: "#trade-routes"
      },
    ]
  },
  {
    id: "news-government", icon: "🏛️", color: "#c084fc",
    title: "Government & News", summary: "Govern with policy, propaganda, and decisive council choices.",
    steps: [
      {
        title: "The Government Page",
        body: "The Government page (🏛️ Government button) is your domestic policy hub. Tabs: Policy Center (toggles + IP), News Feed (domestic events), Council Dilemmas (pending decisions), Propaganda Publisher (Global Chronicles). This page affects your national identity — the policies you run here shape your stability, trust, and diplomatic positioning to the world.",
        tip: "Visit the Government page every session. Council Dilemmas have a 10-tick timer before they auto-resolve (usually with the worse outcome). Don't let them expire.",
        deepDive: "#policies"
      },
      {
        title: "Policy Toggles — Benefits & Costs",
        body: "Healthcare: +10 Stability, +5% Trust, costs ~30 cr/tick — always worth running if you can afford it. Martial Law: +20 Defense/Unit Power but -20 Trust, -10 Stability — short-term emergencies only, max 5–6 game days. Tech Subsidies: +15% TP generation, -5% construction costs — excellent during epoch push campaigns. Tax Cuts: +10% consumer spending, -8% tax revenue — for recession recovery. Conscription: +20 soldiers, -5 Trust — war preparation only.",
        tip: "The combination of Healthcare + Tech Subsidies is expensive but transforms your nation. It raises stability while accelerating research — run it for 10 game days during a stable growth period.",
        deepDive: "#policies"
      },
      {
        title: "Influence Points (IP) Management",
        body: "IP is your diplomatic currency. Regen rate: ~1 IP/tick base, modified by stability (above 70 = +25% regen) and population (each 10 pop = +1 regen). Cap: 100 IP base. Buildings that increase IP cap and regen: National Library (+50 cap, +2 regen), Palace (+25 cap, +1 regen). Strategic reserve: keep 25+ IP at all times. A sudden war declaration (50 IP), spy report (15 IP), and trade negotiation (10 IP) in one session can cost 75 IP.",
        tip: "Build a National Library as soon as it's available (Renaissance Age+). The IP regen boost is extraordinary — it frees you to be far more diplomatically active.",
        deepDive: "#influence-points"
      },
      {
        title: "Council Dilemmas — Decision Framework",
        body: "Dilemmas fire every ~5–10 game days from four sources: Advisors, Corporations, Citizens, and Allies. Each presents Option A and Option B with immediate stat consequences. Framework for decisions: if stability < 50, always choose the stability-preserving option. If treasury < 300, always choose the money-preserving option. If both stability and treasury are healthy, prioritize public trust. When in doubt: choose the option with lower immediate cost but accept the slower recovery.",
        tip: "Citizen-source dilemmas are the most dangerous to ignore. They directly affect public trust, which is already your most sensitive multiplier. Handle them within 3 ticks.",
        deepDive: "#dilemmas"
      },
      {
        title: "Publishing Propaganda",
        body: "From Global Chronicles, click 'Publish Propaganda' (costs IP, once per game day). Write a headline and body. AI generates an article image. Your article appears as your nation's official statement, visible to all players. Articles are rated Standard, Gold, or Breaking News based on content. Good propaganda topics: your epoch achievements, alliance announcements, economic strength, and warnings to aggressors.",
        tip: "The best propaganda articles have real game facts in them. 'Our GDP has grown 300% since last week' is more impactful than vague claims. Readers check the leaderboard — credibility is everything.",
        deepDive: "#propaganda"
      },
      {
        title: "Reading Global Chronicles",
        body: "The Global Chronicles (🌐 Global News) is the world newspaper. Breaking News (red banner): most critical events — wars, crashes, epoch advances. Gold tier (gold border): major developments worth reading. Standard tier: mix of player propaganda and AI-generated content. Skim standard, read gold, study breaking. Intelligence patterns: military build-up articles signal imminent war, economic recovery articles signal upcoming stock opportunities.",
        tip: "Publish an article announcing your epoch advance the moment it happens. It doubles the diplomatic impact — allies see you as powerful, enemies see a warning. Plus it's good for public morale.",
        deepDive: "#chronicles"
      },
      {
        title: "The World Chronicle & Historical Record",
        body: "The World Chronicle page (separate from Global Chronicles) is the permanent historical record of all world events: wars, alliances formed/broken, economic crises, tech breakthroughs, and diplomatic milestones. Events are categorized by type and importance (low/medium/high/critical). This is your long-term intelligence resource — use it to understand why the current world situation is the way it is.",
        tip: "Before any major diplomatic move, check the World Chronicle for the history between the nations involved. A 5-game-week old war between two nations explains why they're now bitter rivals with difficult alliance dynamics.",
        deepDive: "#chronicles"
      },
    ]
  },
  {
    id: "metrics-panel", icon: "📉", color: "#fb923c",
    title: "Nation Metrics Panel", summary: "Track all the indicators that determine your nation's health.",
    steps: [
      {
        title: "Core Metrics — The Five Pillars",
        body: "The Nation Metrics Panel (top-right) shows 5 key stats as progress bars: Stability (0–100), Public Trust (0–200 scaled), Manufacturing Index (0–200), Defense Level (0–200), Unit Power (0–200). These bars change color: green = healthy, yellow = watch, red = critical. All five bars above 50 means you're in good standing. Any red bar demands immediate action.",
        tip: "Stability and Public Trust are interconnected — low trust causes events that reduce stability, and low stability triggers events that reduce trust. Breaking the downward spiral requires addressing the root cause, not just the symptoms.",
        deepDive: "#core-metrics"
      },
      {
        title: "Manufacturing Index — Industrial Power",
        body: "Manufacturing Index (0–200) represents your industrial output efficiency. It's raised by: Factory buildings, industrial workers, Industrial zoning in cities, and tech unlocks in the Industry Branch. At 100: standard output. At 200: production is 2× more efficient. Manufacturing Index directly multiplies your GDP from industrial sector output and reduces the effective cost of construction.",
        tip: "The biggest Manufacturing Index jump comes from building your first Factory (Industrial Age+). If you're approaching Industrial Age, start stockpiling Iron and Oil for it — it transforms your economy.",
        deepDive: "#core-metrics"
      },
      {
        title: "Fuel Price Panel",
        body: "The Fuel Prices section shows current Gasoline ($) and Diesel ($) prices. Formula: Base $2.80 × demand multiplier × war multiplier × stability factor. High fuel prices increase construction costs (+10–25%) and reduce manufacturing efficiency. Fuel prices rise when: oil supply is low, population is high (more demand), you're at war (+25% surcharge), or stability is low (instability tax). Drop oil prices by: building Oil Rigs, maintaining peace, keeping stability high.",
        tip: "Strategic oil stockpiling before a war is one of the highest ROI plays. 1,000+ oil in reserve locks in lower fuel costs during the conflict period when prices would otherwise spike 25%.",
        deepDive: "#fuel"
      },
      {
        title: "Military Readiness Indicators",
        body: "Defense Level prevents incoming war damage (Defense 100 = 50% damage reduction). Unit Power determines outgoing war damage. Defense Level is raised by buildings (Barracks, Walls, Fortresses). Unit Power is raised by soldiers (workers) and Military Academy tech. The critical threshold: Defense Level 50+ makes you expensive enough to attack that most nations will choose diplomatic resolution over war.",
        tip: "A Defense Level above 80 with an obvious military presence (active Barracks, Walls visible on your map tiles) deters the majority of attack scenarios. The best wars are the ones that never happen.",
        deepDive: "#core-metrics"
      },
      {
        title: "Technology Achievements List",
        body: "The bottom section of the Metrics Panel lists all your unlocked technologies with icons and descriptions. This is your permanent tech record — technologies never expire or reset. Each tech provides its ongoing bonus every tick from the moment you unlock it forever. The longer you've had a production bonus tech (like Crop Rotation), the more cumulative value it has generated. Early tech investment literally never stops paying.",
        tip: "Count the number of production techs you have. Every production bonus tech is adding to your output every single tick. A nation with 10 production techs isn't just better — it's exponentially better over the long game.",
        deepDive: "#tech-list"
      },
      {
        title: "National Advisor Button",
        body: "The ⚡ National Advisor button opens an AI assistant who knows your nation's current stats, epoch, wars, resources, and economic situation. Ask it anything: 'Why is my GDP dropping?', 'Should I go to war with X?', 'What should I build next?', 'My inflation is 18% — what do I do?'. The advisor gives context-aware strategic guidance based on your actual nation data.",
        tip: "Ask your advisor at the START of every session: 'Give me a quick briefing on my nation's current status and top 3 priorities.' This 60-second habit prevents you from wasting a session on the wrong activities.",
        deepDive: "#national-advisor"
      },
      {
        title: "Trend Reading — Patterns Over Time",
        body: "Individual tick values can be noisy. For strategic decision-making, watch trends over 5–10 ticks: GDP trending up despite wars = strong foundation. Stability trending down despite no active wars = a systemic trust or food issue. Public trust falling steadily = check tax rates and council dilemmas. Manufacturing flat for 10 ticks = need factory or industrial workers. The Metrics Panel shows current state; you need to track trends yourself.",
        tip: "The Stock Ticker is actually an indirect trend indicator for your own nation. If your stocks have been red for 3+ ticks, your economic indicators are deteriorating. Investigate.",
        deepDive: "#core-metrics"
      },
    ]
  },
];