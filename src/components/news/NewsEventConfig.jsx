// ─── Journalist pool ──────────────────────────────────────────────────────────
export const JOURNALISTS = [
  "M. Hartwell","S. Okafor","D. Petrov","L. Chen","R. Vasquez",
  "A. Mbeki","T. Nakamura","F. Osei","Y. Kowalski","B. Ferrara",
  "C. Nwosu","P. Larsson","G. Dimitriou","N. Alvarez","K. Johansson"
];

export const CITIZEN_QUOTES = [
  "We deserve better than this.",
  "Things are finally looking up for our people.",
  "The government must act now.",
  "I've never seen anything like this in my lifetime.",
  "Our leaders are doing their best.",
  "The people will not stay silent.",
  "Progress does not come without sacrifice.",
  "We stand together.",
];

export const WEATHER_TYPES = [
  "Clear","Rain","Storm","Heatwave","Cold Front","Drought","Heavy Wind"
];

export const WEATHER_EMOJIS = {
  "Clear":"☀️","Rain":"🌧️","Storm":"⛈️","Heatwave":"🔥","Cold Front":"❄️","Drought":"🏜️","Heavy Wind":"💨"
};

export const WEATHER_EFFECTS = {
  Clear:       { food: +5,  stability: +1,  gdp: +2  },
  Rain:        { food: +8,  stability:  0,  gdp:  0  },
  Storm:       { food: -5,  stability: -3,  gdp: -5  },
  Heatwave:    { food: -8,  stability: -4,  gdp: -3  },
  "Cold Front":{ food: -4,  stability: -2,  gdp: -2  },
  Drought:     { food:-12,  stability: -6,  gdp: -4  },
  "Heavy Wind":{ food: -2,  stability: -1,  gdp: -1  },
};

// ─── Category meta ─────────────────────────────────────────────────────────────
export const CATEGORY_META = {
  government:    { label:"Government",        emoji:"🏛" },
  economy:       { label:"Economy",           emoji:"💰" },
  weather:       { label:"Weather",           emoji:"🌦" },
  crime:         { label:"Crime & Security",  emoji:"🚓" },
  education:     { label:"Education",         emoji:"🎓" },
  business:      { label:"Business",          emoji:"🏢" },
  international: { label:"International",     emoji:"🌍" },
  classifieds:   { label:"Classifieds",       emoji:"📦" },
  science:       { label:"Science",           emoji:"🧬" },
  military:      { label:"Military",          emoji:"🎖" },
};

export const SEVERITY_META = {
  info:        { label:"Info",        color:"text-emerald-400", bg:"bg-emerald-500/10", border:"border-emerald-500/20", dot:"bg-emerald-400" },
  warning:     { label:"Warning",     color:"text-yellow-400",  bg:"bg-yellow-500/10",  border:"border-yellow-500/20",  dot:"bg-yellow-400" },
  critical:    { label:"Critical",    color:"text-red-400",     bg:"bg-red-500/10",     border:"border-red-500/20",     dot:"bg-red-400" },
  opportunity: { label:"Opportunity", color:"text-blue-400",    bg:"bg-blue-500/10",    border:"border-blue-500/20",    dot:"bg-blue-400" },
};

// ─── Event Templates ──────────────────────────────────────────────────────────
// Each template: { category, severity, headline, body, options[], conditions?, weight }
// options[]: { label, preview:{stability,gdp,currency,population}, effects:{...} }

export const EVENT_TEMPLATES = [

  // ─── GOVERNMENT ─────────────────────────────────────────────────────────────
  {
    category:"government", severity:"warning", weight:6,
    headline:"Council Deadlock Stalls Budget Reform",
    body:"The legislative council has entered its third day of deadlock over proposed budget reforms. Citizens are growing impatient as vital infrastructure projects hang in the balance. Senior advisors warn that continued inaction could erode public trust.",
    quote:true,
    options:[
      { label:"🏛 Call Emergency Session",   preview:{ stability:-2, currency:-50, gdp:+10 }, effects:{ stability:-2, currency:-50, gdp:10 } },
      { label:"📜 Issue Executive Decree",   preview:{ public_trust:-0.05, stability:+3 },     effects:{ public_trust:-0.05, stability:3 } },
      { label:"🤝 Broker Compromise",        preview:{ stability:+5, gdp:+5 },                  effects:{ stability:5, gdp:5 } },
    ]
  },
  {
    category:"government", severity:"opportunity", weight:4,
    headline:"Constitutional Reform Receives Popular Support",
    body:"A new constitutional amendment proposal has garnered widespread popular support. Analysts say the reform could modernize governance and increase civic participation. The window to act is narrow.",
    options:[
      { label:"✅ Ratify the Amendment",    preview:{ public_trust:+0.1, stability:+5 },       effects:{ public_trust:0.1, stability:5 } },
      { label:"📋 Hold Public Referendum",  preview:{ stability:+8, currency:-30 },             effects:{ stability:8, currency:-30 } },
      { label:"⏸ Delay for Review",        preview:{ stability:-2 },                           effects:{ stability:-2 } },
    ]
  },
  {
    category:"government", severity:"critical", weight:3,
    headline:"Corruption Scandal Rocks Administration",
    body:"Leaked documents reveal widespread embezzlement within three senior ministries. Opposition leaders are calling for immediate resignations. Public protests are expected by evening.",
    options:[
      { label:"🔍 Launch Investigation",    preview:{ public_trust:+0.05, stability:-3, currency:-40 }, effects:{ public_trust:0.05, stability:-3, currency:-40 } },
      { label:"🤐 Issue Denial Statement",  preview:{ public_trust:-0.1, stability:-2 },                effects:{ public_trust:-0.1, stability:-2 } },
      { label:"🪓 Fire the Officials",      preview:{ stability:+4, public_trust:+0.08 },               effects:{ stability:4, public_trust:0.08 } },
    ]
  },

  // ─── ECONOMY ────────────────────────────────────────────────────────────────
  {
    category:"economy", severity:"warning", weight:7,
    headline:"Inflation Threatens Household Budgets Across Nation",
    body:"The national economic bureau reports a 4.2% spike in consumer prices this quarter. Basic goods including bread, fuel, and medicine have seen the sharpest increases. Economists warn of potential social instability if wages do not keep pace.",
    options:[
      { label:"💵 Subsidize Basic Goods",   preview:{ currency:-80, stability:+5, gdp:-3 },  effects:{ currency:-80, stability:5, gdp:-3 } },
      { label:"📈 Raise Interest Rates",    preview:{ gdp:-5, stability:+2 },                effects:{ gdp:-5, stability:2 } },
      { label:"🔄 Deregulate Markets",      preview:{ gdp:+8, stability:-4 },                effects:{ gdp:8, stability:-4 } },
    ]
  },
  {
    category:"economy", severity:"opportunity", weight:5,
    headline:"Foreign Investor Eyes National Infrastructure",
    body:"A major foreign investment consortium has signaled interest in funding key infrastructure projects. The deal could inject significant capital but comes with conditions on trade policy.",
    options:[
      { label:"✅ Accept Investment",       preview:{ currency:+200, gdp:+15, public_trust:-0.05 }, effects:{ currency:200, gdp:15, public_trust:-0.05 } },
      { label:"📋 Negotiate Terms",         preview:{ currency:+100, gdp:+8 },                      effects:{ currency:100, gdp:8 } },
      { label:"🚫 Decline Offer",           preview:{ stability:+2 },                               effects:{ stability:2 } },
    ]
  },
  {
    category:"economy", severity:"critical", weight:4,
    headline:"National Treasury Faces Deficit Crisis",
    body:"Expenditures have outpaced revenue for the third consecutive quarter. The treasury now holds a critical reserve level. Immediate fiscal action is required to prevent a credit downgrade.",
    options:[
      { label:"✂️ Implement Austerity",    preview:{ currency:+100, gdp:-10, stability:-6 },  effects:{ currency:100, gdp:-10, stability:-6 } },
      { label:"🏦 Issue Emergency Bonds",  preview:{ currency:+150, gdp:-3 },                  effects:{ currency:150, gdp:-3 } },
      { label:"💰 Emergency Tax Levy",     preview:{ currency:+80, public_trust:-0.1 },        effects:{ currency:80, public_trust:-0.1 } },
    ]
  },

  // ─── WEATHER ─────────────────────────────────────────────────────────────────
  {
    category:"weather", severity:"warning", weight:8,
    headline:"Severe Storm System Approaches National Borders",
    body:"Meteorological services have issued a Severe Weather Watch. The approaching storm system is expected to bring heavy rainfall, strong winds, and potential flooding to lowland regions. Agriculture is at high risk.",
    options:[
      { label:"🛡 Mobilize Emergency Teams", preview:{ currency:-60, stability:+3, res_food:-10 },    effects:{ currency:-60, stability:3 } },
      { label:"📢 Issue Public Warning",     preview:{ stability:+2 },                                effects:{ stability:2 } },
      { label:"🌾 Pre-harvest Crops",        preview:{ res_food:+30, currency:-20 },                  effects:{ res_food:30, currency:-20 } },
    ]
  },
  {
    category:"weather", severity:"critical", weight:3,
    headline:"Drought Conditions Declared in Agricultural Belt",
    body:"Rainfall levels have reached historic lows across the nation's primary agricultural zones. Crop failures are expected to impact the food supply within weeks. Emergency intervention is required.",
    is_disaster:true,
    options:[
      { label:"💧 Import Emergency Water",   preview:{ currency:-120, res_food:+50 },             effects:{ currency:-120, res_food:50 } },
      { label:"🏗 Fund Irrigation Project",  preview:{ currency:-200, gdp:+5 },                   effects:{ currency:-200, gdp:5 } },
      { label:"🌾 Ration Food Supply",       preview:{ stability:-5, population:-1 },             effects:{ stability:-5 } },
    ]
  },

  // ─── CRIME & SECURITY ────────────────────────────────────────────────────────
  {
    category:"crime", severity:"warning", weight:6,
    headline:"Organized Crime Ring Dismantled by Security Forces",
    body:"National security forces have arrested 14 members of a major organized crime syndicate following a six-month undercover operation. The ring was involved in smuggling, extortion, and bribery of local officials.",
    options:[
      { label:"⚖️ Prosecute Fully",          preview:{ stability:+6, public_trust:+0.05 },           effects:{ stability:6, public_trust:0.05 } },
      { label:"🤫 Quiet Settlement",          preview:{ currency:+50, public_trust:-0.1 },            effects:{ currency:50, public_trust:-0.1 } },
      { label:"🔓 Release With Conditions",   preview:{ stability:-2 },                              effects:{ stability:-2 } },
    ]
  },
  {
    category:"crime", severity:"critical", weight:4,
    headline:"Cyberattack Targets National Infrastructure Grid",
    body:"State-sponsored hackers have breached the national energy grid's control systems. Power outages are spreading across urban centers. Defense analysts warn this may be a precursor to broader aggression.",
    options:[
      { label:"🛡 Activate Cyber Defense",    preview:{ currency:-80, gdp:-5, stability:+3 },      effects:{ currency:-80, gdp:-5, stability:3 } },
      { label:"🔍 Trace and Counter-Strike",  preview:{ currency:-120, stability:+5 },             effects:{ currency:-120, stability:5 } },
      { label:"📡 Shut Down Grid Sections",   preview:{ gdp:-10, stability:-2 },                   effects:{ gdp:-10, stability:-2 } },
    ]
  },
  {
    category:"crime", severity:"warning", weight:5,
    headline:"Protest Movement Grows Across Capital Districts",
    body:"Tens of thousands of citizens have taken to the streets demanding economic reforms and governmental accountability. While largely peaceful, isolated incidents of property damage have been reported. Police presence has doubled.",
    options:[
      { label:"🎙 Address the Nation",         preview:{ stability:+4, public_trust:+0.08 },       effects:{ stability:4, public_trust:0.08 } },
      { label:"⚖️ Grant Reform Concessions",  preview:{ stability:+8, currency:-60, gdp:-3 },     effects:{ stability:8, currency:-60, gdp:-3 } },
      { label:"🚔 Enforce Curfew",            preview:{ stability:-5, public_trust:-0.1 },         effects:{ stability:-5, public_trust:-0.1 } },
    ]
  },

  // ─── EDUCATION ───────────────────────────────────────────────────────────────
  {
    category:"education", severity:"opportunity", weight:5,
    headline:"National University Rankings Soar to Historic High",
    body:"Three national universities have entered the Global Top 100 for the first time in history. Academics attribute the rise to increased research funding and faculty recruitment drives. The development is expected to attract international talent.",
    options:[
      { label:"🎓 Increase Education Budget", preview:{ currency:-80, gdp:+12, tech_points:+20 }, effects:{ currency:-80, gdp:12, tech_points:20 } },
      { label:"🌍 Launch Scholar Exchange",   preview:{ public_trust:+0.05, tech_points:+10 },    effects:{ public_trust:0.05, tech_points:10 } },
      { label:"📋 Acknowledge Achievement",   preview:{ stability:+2 },                           effects:{ stability:2 } },
    ]
  },
  {
    category:"education", severity:"warning", weight:4,
    headline:"Teacher Shortage Threatens School System",
    body:"A critical shortage of qualified educators is impacting learning outcomes in rural regions. Class sizes have ballooned to dangerous levels. The Ministry of Education has issued an emergency appeal.",
    options:[
      { label:"💰 Emergency Recruitment Drive", preview:{ currency:-100, gdp:+5, stability:+3 }, effects:{ currency:-100, gdp:5, stability:3 } },
      { label:"🏫 Digitize Classrooms",         preview:{ currency:-60, tech_points:+15 },       effects:{ currency:-60, tech_points:15 } },
      { label:"🤷 Defer to Next Budget Cycle",  preview:{ stability:-3, gdp:-2 },                effects:{ stability:-3, gdp:-2 } },
    ]
  },

  // ─── BUSINESS ────────────────────────────────────────────────────────────────
  {
    category:"business", severity:"opportunity", weight:7,
    headline:"Tech Startup Boom Signals Innovation Wave",
    body:"Over 200 tech startups have registered in the capital this quarter alone. Venture capital inflows have reached record levels. The surge is being called the nation's first true Silicon Valley moment.",
    options:[
      { label:"🏛 Create Tech Free Zone",     preview:{ currency:-80, gdp:+20, tech_points:+15 }, effects:{ currency:-80, gdp:20, tech_points:15 } },
      { label:"📉 Regulate Investment",       preview:{ stability:+3, gdp:+5 },                   effects:{ stability:3, gdp:5 } },
      { label:"🤝 Partner with Companies",    preview:{ gdp:+12, currency:+50 },                  effects:{ gdp:12, currency:50 } },
    ]
  },
  {
    category:"business", severity:"critical", weight:4,
    headline:"Major Factory Closure Threatens Thousands of Jobs",
    body:"NatroTech Industries has announced the closure of its flagship manufacturing plant, citing rising energy costs and global competition. An estimated 8,000 workers face unemployment. Labor unions are calling for government intervention.",
    options:[
      { label:"🏗 Nationalize the Plant",     preview:{ currency:-150, gdp:+5, stability:+4 },   effects:{ currency:-150, gdp:5, stability:4 } },
      { label:"💰 Subsidize Operations",      preview:{ currency:-100, gdp:+8 },                  effects:{ currency:-100, gdp:8 } },
      { label:"📦 Allow Closure",             preview:{ gdp:-10, stability:-6, currency:+20 },    effects:{ gdp:-10, stability:-6, currency:20 } },
    ]
  },
  {
    category:"business", severity:"opportunity", weight:5,
    headline:"Energy Sector Boom: Oil Production Surges 40%",
    body:"National energy reports confirm a 40% surge in domestic oil production following new extraction technologies. Export capacity is at an all-time high. Economists forecast a substantial treasury windfall.",
    options:[
      { label:"🛢 Maximize Export Output",    preview:{ currency:+200, res_oil:+50 },             effects:{ currency:200, res_oil:50 } },
      { label:"🌿 Invest in Clean Energy",    preview:{ currency:+80, gdp:+10, stability:+3 },    effects:{ currency:80, gdp:10, stability:3 } },
      { label:"📊 Stabilize Production",     preview:{ currency:+100, gdp:+6 },                   effects:{ currency:100, gdp:6 } },
    ]
  },

  // ─── INTERNATIONAL ───────────────────────────────────────────────────────────
  {
    category:"international", severity:"warning", weight:5,
    headline:"Neighboring Nation Imposes Surprise Trade Sanctions",
    body:"A neighboring state has announced sweeping trade sanctions citing diplomatic grievances. Key exports including iron and agricultural goods face new 40% tariffs. The move threatens bilateral trade worth hundreds of credits annually.",
    options:[
      { label:"🤝 Open Diplomatic Talks",    preview:{ stability:+3, gdp:-2 },                   effects:{ stability:3, gdp:-2 } },
      { label:"⚔️ Retaliate with Countersanctions", preview:{ gdp:-5, stability:-3 },            effects:{ gdp:-5, stability:-3 } },
      { label:"🌐 Seek New Trade Partners",  preview:{ gdp:+5, currency:+30 },                   effects:{ gdp:5, currency:30 } },
    ]
  },
  {
    category:"international", severity:"critical", weight:3,
    headline:"Global Supply Chain Disruption Sends Markets Reeling",
    body:"A major breakdown in international shipping routes has disrupted global supply chains. Import prices have surged across all sectors. Nations with strong domestic production are weathering the crisis best.",
    options:[
      { label:"🏭 Boost Domestic Production", preview:{ currency:-80, gdp:+10, stability:+2 },   effects:{ currency:-80, gdp:10, stability:2 } },
      { label:"🤝 Form Emergency Coalition",  preview:{ stability:+5, gdp:+5 },                  effects:{ stability:5, gdp:5 } },
      { label:"🧘 Weather the Storm",         preview:{ gdp:-5, stability:-2 },                  effects:{ gdp:-5, stability:-2 } },
    ]
  },
  {
    category:"international", severity:"opportunity", weight:4,
    headline:"International Aid Offer Arrives from Distant Ally",
    body:"A distant allied nation has offered an unconditional aid package including resources, capital, and technical assistance. Advisors are divided on whether to accept or maintain strategic independence.",
    options:[
      { label:"✅ Accept Full Aid Package",   preview:{ currency:+150, res_food:+50, stability:+3 }, effects:{ currency:150, res_food:50, stability:3 } },
      { label:"📋 Accept Partial Aid",        preview:{ currency:+80, stability:+2 },               effects:{ currency:80, stability:2 } },
      { label:"🚫 Decline — Stay Sovereign",  preview:{ public_trust:+0.05, stability:+2 },         effects:{ public_trust:0.05, stability:2 } },
    ]
  },

  // ─── SCIENCE ─────────────────────────────────────────────────────────────────
  {
    category:"science", severity:"opportunity", weight:5,
    headline:"Research Team Announces Major Agricultural Breakthrough",
    body:"The National Agricultural Research Institute has developed a crop strain capable of yielding 60% more food with 30% less water. Commercialization could transform food security within a single generation.",
    options:[
      { label:"🌾 Fund Mass Rollout",        preview:{ currency:-100, res_food:+80, stability:+4 }, effects:{ currency:-100, res_food:80, stability:4 } },
      { label:"🔬 Continue Research",        preview:{ currency:-50, tech_points:+25 },             effects:{ currency:-50, tech_points:25 } },
      { label:"🌍 Share Internationally",    preview:{ public_trust:+0.1, gdp:+5 },                 effects:{ public_trust:0.1, gdp:5 } },
    ]
  },
  {
    category:"science", severity:"opportunity", weight:4,
    headline:"Nuclear Energy Proposal Divides Scientific Community",
    body:"A national task force has submitted a proposal to develop civilian nuclear power infrastructure. Proponents cite energy independence; opponents warn of safety and long-term risk. The decision rests with national leadership.",
    options:[
      { label:"⚛️ Approve Development",      preview:{ currency:-200, gdp:+25, tech_points:+30 }, effects:{ currency:-200, gdp:25, tech_points:30 } },
      { label:"🌿 Invest in Renewables Instead", preview:{ currency:-120, gdp:+15, stability:+3 }, effects:{ currency:-120, gdp:15, stability:3 } },
      { label:"📋 Commission Safety Review", preview:{ stability:+2 },                             effects:{ stability:2 } },
    ]
  },

  // ─── MILITARY ────────────────────────────────────────────────────────────────
  {
    category:"military", severity:"warning", weight:5,
    headline:"Border Tensions Spike as Patrol Incidents Increase",
    body:"A series of patrol confrontations along the eastern border has raised fears of escalation. Defense command reports three incidents in the past week. Diplomatic channels are being strained.",
    options:[
      { label:"⚔️ Reinforce the Border",    preview:{ currency:-100, stability:-2, unit_power:+5 }, effects:{ currency:-100, stability:-2, unit_power:5 } },
      { label:"🤝 Request Diplomatic Talks", preview:{ stability:+3 },                              effects:{ stability:3 } },
      { label:"📡 Deploy Surveillance Drones", preview:{ currency:-60, stability:+2 },              effects:{ currency:-60, stability:2 } },
    ]
  },
  {
    category:"military", severity:"opportunity", weight:3,
    headline:"Elite Military Training Program Yields Results",
    body:"A rigorous six-month military training program has graduated its first cohort of 500 elite soldiers. Field tests show combat effectiveness 40% above standard units. Military leadership is recommending immediate expansion.",
    options:[
      { label:"🎖 Expand the Program",       preview:{ currency:-80, unit_power:+10, stability:+2 }, effects:{ currency:-80, unit_power:10, stability:2 } },
      { label:"📋 Maintain Current Scale",   preview:{ unit_power:+5 },                              effects:{ unit_power:5 } },
      { label:"💰 Redirect Funding",        preview:{ currency:+60, gdp:+5 },                        effects:{ currency:60, gdp:5 } },
    ]
  },
  {
    category:"military", severity:"critical", weight:2, conditions:{ at_war: true },
    headline:"Active Wartime: Front Lines Report Heavy Casualties",
    body:"Battlefield reports confirm significant casualties as front-line units engage. Morale is wavering as supply lines face disruption. The military high command is requesting emergency authorization for a tactical redeployment.",
    options:[
      { label:"⚔️ Authorize Full Offensive",  preview:{ currency:-150, stability:-5, unit_power:+8 }, effects:{ currency:-150, stability:-5, unit_power:8 } },
      { label:"🛡 Hold Defensive Lines",      preview:{ stability:+2, currency:-80 },                  effects:{ stability:2, currency:-80 } },
      { label:"🕊 Seek Ceasefire",           preview:{ stability:+8, unit_power:-3 },                  effects:{ stability:8, unit_power:-3 } },
    ]
  },

  // ─── CLASSIFIEDS ─────────────────────────────────────────────────────────────
  {
    category:"classifieds", severity:"opportunity", weight:8,
    headline:"LISTING: Iron Surplus Available — Immediate Export Ready",
    body:"A neighboring nation announces excess iron stockpiles available for immediate trade. Pricing is set below global market rates. First-come, first-served allocation applies.",
    options:[
      { label:"🛒 Purchase 100 Iron",        preview:{ currency:-80, res_iron:+100 },   effects:{ currency:-80, res_iron:100 } },
      { label:"📋 Inquire for Bulk Deal",    preview:{ currency:-150, res_iron:+200 },  effects:{ currency:-150, res_iron:200 } },
    ]
  },
  {
    category:"classifieds", severity:"info", weight:6,
    headline:"LISTING: Private Contractors Available for Infrastructure Work",
    body:"A reputable private construction consortium is offering accelerated infrastructure services at competitive rates. Projects include roads, bridges, housing, and civic buildings.",
    options:[
      { label:"🏗 Hire for Priority Build",  preview:{ currency:-120, gdp:+10, stability:+3 }, effects:{ currency:-120, gdp:10, stability:3 } },
      { label:"📋 Request Portfolio",        preview:{ stability:+1 },                         effects:{ stability:1 } },
    ]
  },
  {
    category:"classifieds", severity:"opportunity", weight:7,
    headline:"LISTING: Food Surplus — Wheat & Grain at Below-Market Rates",
    body:"A rural cooperative is offering excess wheat and grain stocks at 20% below standard market pricing. Quantity limited. Contact the Ministry of Agriculture for allocation.",
    options:[
      { label:"🌾 Purchase Bulk Supply",     preview:{ currency:-90, res_food:+120 },   effects:{ currency:-90, res_food:120 } },
      { label:"📦 Small Order Only",         preview:{ currency:-40, res_food:+50 },    effects:{ currency:-40, res_food:50 } },
    ]
  },
  {
    category:"classifieds", severity:"info", weight:5,
    headline:"LISTING: Skilled Engineers Seeking National Employment",
    body:"A consortium of 200 certified civil and mechanical engineers is seeking national-level employment contracts. Specialties include infrastructure, energy, and manufacturing.",
    options:[
      { label:"👷 Hire Full Cohort",         preview:{ currency:-80, gdp:+12 },         effects:{ currency:-80, gdp:12 } },
      { label:"🤝 Selective Hiring Only",    preview:{ currency:-40, gdp:+5 },           effects:{ currency:-40, gdp:5 } },
    ]
  },

  // ─── LOCAL NEWS (info/slice-of-life) ─────────────────────────────────────────
  {
    category:"government", severity:"info", weight:10,
    headline:"Local Mayor Inaugurates New Community Garden in Capital District",
    body:"The capital's mayor cut the ribbon today on a new 2-acre community garden, welcoming hundreds of citizens to the event. Volunteers will maintain seasonal crops available to all residents free of charge. The garden is expected to become a neighborhood landmark.",
    options:[
      { label:"🌻 Fund Expansion",           preview:{ stability:+3, currency:-30 },     effects:{ stability:3, currency:-30 } },
      { label:"📋 Acknowledge the Event",    preview:{ public_trust:+0.03 },             effects:{ public_trust:0.03 } },
    ]
  },
  {
    category:"economy", severity:"info", weight:9,
    headline:"Capital Bakery Celebrates 50 Years in Business",
    body:"Hartwell's Bakery, a beloved institution in the capital district, celebrated its golden anniversary today. The founder's grandchildren now run the shop, serving the same original recipes. Citizens lined up before dawn for a free commemorative loaf.",
    options:[
      { label:"🥖 Issue Commendation",       preview:{ public_trust:+0.04, stability:+1 }, effects:{ public_trust:0.04, stability:1 } },
      { label:"📋 Note for the Record",      preview:{ stability:+1 },                     effects:{ stability:1 } },
    ]
  },
  {
    category:"crime", severity:"info", weight:9,
    headline:"Lost Dog Found After Three-Day City-Wide Search",
    body:"Biscuit, a golden retriever belonging to a local family, was found safe and unharmed after a three-day search involving over 300 citizen volunteers. The reunion was captured on video and is trending across national social channels.",
    options:[
      { label:"🐶 Issue Feel-Good Broadcast", preview:{ public_trust:+0.05, stability:+2 }, effects:{ public_trust:0.05, stability:2 } },
      { label:"📋 No Comment Needed",        preview:{},                                    effects:{} },
    ]
  },
  {
    category:"education", severity:"info", weight:8,
    headline:"Elementary School Students Win National Science Fair",
    body:"A team of fifth-graders from Northgate Elementary has won first place at the National Junior Science Fair with their water purification project. The students will represent the nation at the International Young Scientists Expo.",
    options:[
      { label:"🏆 Host Celebration Parade",  preview:{ public_trust:+0.05, stability:+2 }, effects:{ public_trust:0.05, stability:2 } },
      { label:"🔬 Fund Research Mentorship", preview:{ currency:-30, tech_points:+10 },    effects:{ currency:-30, tech_points:10 } },
    ]
  },
  {
    category:"business", severity:"info", weight:9,
    headline:"Street Food Festival Draws Record Crowds to Capital Square",
    body:"Over 80,000 citizens attended this year's National Street Food Festival, a record turnout. Vendors from all regions of the country showcased traditional recipes. Tourism revenue from the three-day event exceeded projections by 30%.",
    options:[
      { label:"📅 Make It Annual Tradition", preview:{ stability:+3, gdp:+5 },            effects:{ stability:3, gdp:5 } },
      { label:"📋 Acknowledge Success",      preview:{ stability:+1 },                     effects:{ stability:1 } },
    ]
  },
  {
    category:"science", severity:"info", weight:8,
    headline:"Hobbyist Astronomer Discovers New Comet from Backyard Telescope",
    body:"A retired schoolteacher with a backyard telescope has officially discovered a new comet, which now bears their name. The national observatory has confirmed the finding. The discovery is being celebrated as a triumph of citizen science.",
    options:[
      { label:"🌠 Fund Amateur Science Program", preview:{ public_trust:+0.05, tech_points:+8 }, effects:{ public_trust:0.05, tech_points:8 } },
      { label:"📋 Issue Congratulations",    preview:{ stability:+2 },                     effects:{ stability:2 } },
    ]
  },
  {
    category:"military", severity:"info", weight:7,
    headline:"Veterans March in Annual Remembrance Parade",
    body:"Thousands of veterans marched through the capital in the annual Day of Remembrance parade. Citizens lined the streets to pay tribute. The ceremony concluded with a 21-gun salute at the National Monument.",
    options:[
      { label:"🎖 Increase Veterans Benefits", preview:{ currency:-50, stability:+5, public_trust:+0.05 }, effects:{ currency:-50, stability:5, public_trust:0.05 } },
      { label:"📋 Attend the Ceremony",       preview:{ public_trust:+0.03 },             effects:{ public_trust:0.03 } },
    ]
  },
  {
    category:"international", severity:"info", weight:7,
    headline:"Cultural Exchange Delegation Arrives from Abroad",
    body:"A delegation of 40 artists, chefs, musicians, and academics has arrived for a two-week cultural exchange program. Events are scheduled across the capital, including open-air concerts and culinary demonstrations.",
    options:[
      { label:"🎭 Fully Sponsor the Exchange", preview:{ currency:-60, public_trust:+0.08, stability:+3 }, effects:{ currency:-60, public_trust:0.08, stability:3 } },
      { label:"🌍 Participate Minimally",      preview:{ stability:+1 },                   effects:{ stability:1 } },
    ]
  },
  {
    category:"weather", severity:"info", weight:10,
    headline:"Glorious Sunshine Weekend Boosts National Morale",
    body:"Citizens across the nation are enjoying an unexpected four-day stretch of perfect weather. Parks are full, markets are busy, and officials report a measurable uptick in public sentiment. Outdoor events are being hastily scheduled nationwide.",
    options:[
      { label:"🎉 Host National Outdoor Day", preview:{ stability:+5, public_trust:+0.06 }, effects:{ stability:5, public_trust:0.06 } },
      { label:"📋 Enjoy Naturally",          preview:{ stability:+2 },                      effects:{ stability:2 } },
    ]
  },
  {
    category:"economy", severity:"info", weight:8,
    headline:"Farmers Market Season Opens With Record Vendor Count",
    body:"The capital's spring farmers market opened with 340 registered vendors — the highest count in its 15-year history. Early attendance figures suggest a blockbuster season. Local produce prices are expected to remain low through summer.",
    options:[
      { label:"🌽 Subsidize Farmer Stalls",  preview:{ currency:-30, res_food:+20, stability:+2 }, effects:{ currency:-30, res_food:20, stability:2 } },
      { label:"📋 Let the Market Thrive",    preview:{ gdp:+3 },                          effects:{ gdp:3 } },
    ]
  },
  {
    category:"crime", severity:"info", weight:8,
    headline:"Police Department Launches Community Outreach Coffee Program",
    body:"The National Police Service has launched 'Brew & Belong,' a community outreach initiative pairing officers with neighborhood residents over free coffee. Early feedback suggests it is improving trust between citizens and law enforcement.",
    options:[
      { label:"☕ Fund and Expand Program",  preview:{ currency:-40, public_trust:+0.08, stability:+3 }, effects:{ currency:-40, public_trust:0.08, stability:3 } },
      { label:"📋 Monitor Results",          preview:{ stability:+1 },                    effects:{ stability:1 } },
    ]
  },
  {
    category:"education", severity:"info", weight:7,
    headline:"National Library Reports Record Borrowing Numbers This Quarter",
    body:"The national public library system reports a 43% increase in book borrowings this quarter. Officials credit a new digital lending platform and a revamped summer reading program. Literacy metrics are at an all-time national high.",
    options:[
      { label:"📚 Double Library Budget",    preview:{ currency:-50, tech_points:+10, stability:+2 }, effects:{ currency:-50, tech_points:10, stability:2 } },
      { label:"📋 Celebrate the Milestone",  preview:{ public_trust:+0.03 },             effects:{ public_trust:0.03 } },
    ]
  },
  {
    category:"business", severity:"info", weight:8,
    headline:"Local Inventor Patents Revolutionary Water Filtration Device",
    body:"A self-taught inventor from a rural district has patented a low-cost water filtration unit capable of serving 500 people per day. The device uses locally sourced materials and requires no electricity. International humanitarian organizations are already expressing interest.",
    options:[
      { label:"💡 Purchase National License", preview:{ currency:-70, gdp:+8, public_trust:+0.05 }, effects:{ currency:-70, gdp:8, public_trust:0.05 } },
      { label:"🌍 Help Export Globally",     preview:{ gdp:+5, public_trust:+0.07 },     effects:{ gdp:5, public_trust:0.07 } },
    ]
  },
  {
    category:"government", severity:"info", weight:8,
    headline:"Annual Census Results Reveal Growing Urban Populations",
    body:"This year's national census shows a 7.2% increase in urban population, with rural regions experiencing modest growth. The capital remains the most densely populated area. Housing and transport planning agencies are reviewing infrastructure needs.",
    options:[
      { label:"🏙 Invest in Urban Housing",  preview:{ currency:-100, stability:+4, population:+1 }, effects:{ currency:-100, stability:4, population:1 } },
      { label:"📋 Commission Urban Plan",    preview:{ currency:-20, stability:+2 },      effects:{ currency:-20, stability:2 } },
    ]
  },
  {
    category:"science", severity:"opportunity", weight:6,
    headline:"Local University Lab Creates Biodegradable Plastic Alternative",
    body:"Researchers at the National Technical University have produced a plant-based plastic alternative that degrades naturally in under 90 days. Early industrial trials are promising. Investors are already circling.",
    options:[
      { label:"🌿 Fund Full Scale-Up",       preview:{ currency:-80, gdp:+10, tech_points:+20 }, effects:{ currency:-80, gdp:10, tech_points:20 } },
      { label:"🔬 Patent and License",       preview:{ currency:+50, tech_points:+10 },  effects:{ currency:50, tech_points:10 } },
    ]
  },
  {
    category:"international", severity:"info", weight:6,
    headline:"Friendly Nation Sends Goodwill Agricultural Seeds Package",
    body:"A neighboring nation has gifted a large package of premium heirloom seeds as a gesture of goodwill. The seeds include rare grain varieties and high-yield vegetable strains not currently grown domestically.",
    options:[
      { label:"🌱 Plant Nationally",        preview:{ res_food:+40, stability:+2 },       effects:{ res_food:40, stability:2 } },
      { label:"🔬 Study in Lab First",       preview:{ tech_points:+8 },                  effects:{ tech_points:8 } },
    ]
  },
  {
    category:"crime", severity:"warning", weight:6,
    headline:"Counterfeit Currency Ring Uncovered in Eastern Markets",
    body:"National security agents have seized printing equipment and over 50,000 in counterfeit credits from an organized counterfeiting operation in the eastern market district. Three suspects are in custody.",
    options:[
      { label:"⚖️ Prosecute Vigorously",    preview:{ public_trust:+0.06, stability:+3 }, effects:{ public_trust:0.06, stability:3 } },
      { label:"🏦 Audit All Currency",       preview:{ currency:-30, stability:+5 },      effects:{ currency:-30, stability:5 } },
    ]
  },
  {
    category:"economy", severity:"opportunity", weight:7,
    headline:"Tourism Numbers Hit All-Time High This Season",
    body:"The national tourism board reports a record-breaking season with 2.4 million visitors — a 34% increase year-over-year. Hospitality, retail, and transport sectors are all reporting strong earnings. The trend is expected to continue.",
    options:[
      { label:"🏨 Invest in Tourism Infrastructure", preview:{ currency:-100, gdp:+18 },  effects:{ currency:-100, gdp:18 } },
      { label:"📢 Launch Marketing Campaign",preview:{ currency:-40, gdp:+8 },            effects:{ currency:-40, gdp:8 } },
    ]
  },
  {
    category:"military", severity:"info", weight:6,
    headline:"Coast Guard Rescues 47 Sailors in Dramatic Storm Operation",
    body:"The National Coast Guard executed a flawless multi-vessel rescue operation after a commercial fleet was caught in an unexpected storm. All 47 crew members were recovered safely. The operation drew praise from maritime authorities internationally.",
    options:[
      { label:"🏅 Award the Coast Guard",    preview:{ public_trust:+0.07, stability:+3 }, effects:{ public_trust:0.07, stability:3 } },
      { label:"🚢 Expand Fleet Budget",      preview:{ currency:-60, unit_power:+3 },     effects:{ currency:-60, unit_power:3 } },
    ]
  },
  {
    category:"government", severity:"warning", weight:5,
    headline:"Infrastructure Report Flags 14 Ageing Bridges for Urgent Review",
    body:"The National Infrastructure Audit has identified 14 bridges rated structurally deficient and in need of immediate attention. Three have been closed pending assessment. Officials warn that delayed action poses public safety risks.",
    options:[
      { label:"🏗 Emergency Repair Program", preview:{ currency:-150, stability:+4, gdp:+5 }, effects:{ currency:-150, stability:4, gdp:5 } },
      { label:"📋 Commission Detailed Study",preview:{ currency:-30, stability:+1 },      effects:{ currency:-30, stability:1 } },
    ]
  },
];

// ─── Disaster templates ───────────────────────────────────────────────────────
export const DISASTER_TEMPLATES = [
  {
    category:"weather", severity:"critical", headline:"Tornado Tears Through Industrial District",
    body:"A category-4 tornado has struck the industrial heartland, causing catastrophic damage to factories and warehouses. Emergency services are responding but access roads are blocked by debris.",
    is_disaster:true,
    effects:{ gdp:-20, stability:-8, currency:-100 },
    options:[
      { label:"🚑 Full Emergency Response",   preview:{ currency:-150, stability:+5 },          effects:{ currency:-150, stability:5 } },
      { label:"🏚 Evacuate and Rebuild",      preview:{ currency:-200, gdp:+5, stability:+3 },  effects:{ currency:-200, gdp:5, stability:3 } },
    ]
  },
  {
    category:"weather", severity:"critical", headline:"Devastating Earthquake Rocks Capital Region",
    body:"A 6.8-magnitude earthquake has struck the capital and surrounding provinces. Buildings have collapsed, roads are fractured, and communications are partially disrupted. The death toll is rising.",
    is_disaster:true,
    effects:{ gdp:-25, stability:-12, population:-2, currency:-50 },
    options:[
      { label:"🚨 Declare State of Emergency", preview:{ currency:-200, stability:+8 },         effects:{ currency:-200, stability:8 } },
      { label:"🏗 Prioritize Reconstruction",  preview:{ currency:-300, gdp:+10, stability:+5 }, effects:{ currency:-300, gdp:10, stability:5 } },
    ]
  },
  {
    category:"weather", severity:"critical", headline:"Flash Floods Inundate Agricultural Plains",
    body:"Unprecedented rainfall has caused catastrophic flooding across the agricultural plains. Thousands of acres of crops have been destroyed. The food supply chain faces significant disruption.",
    is_disaster:true,
    effects:{ res_food:-80, stability:-6, gdp:-10 },
    options:[
      { label:"🌾 Emergency Food Rationing",  preview:{ stability:-3 },                          effects:{ stability:-3 } },
      { label:"💧 Build Flood Barriers",      preview:{ currency:-180, stability:+4, gdp:+5 },   effects:{ currency:-180, stability:4, gdp:5 } },
    ]
  },
  {
    category:"business", severity:"critical", headline:"Industrial Explosion Levels Processing Plant",
    body:"A catastrophic explosion has leveled the National Petrochemical Processing Plant. Flames are visible from miles away. Multiple fatalities reported. Hazmat teams are on scene.",
    is_disaster:true,
    effects:{ gdp:-15, stability:-8, currency:-80, res_oil:-50 },
    options:[
      { label:"🚒 Full Emergency Response",   preview:{ currency:-120, stability:+3 },           effects:{ currency:-120, stability:3 } },
      { label:"🔍 Safety Investigation",      preview:{ currency:-60, public_trust:+0.05 },       effects:{ currency:-60, public_trust:0.05 } },
    ]
  },
];

// ─── Weighted random pick ─────────────────────────────────────────────────────
export function pickWeightedEvent(templates) {
  const total = templates.reduce((s, t) => s + (t.weight || 1), 0);
  let r = Math.random() * total;
  for (const t of templates) {
    r -= (t.weight || 1);
    if (r <= 0) return t;
  }
  return templates[templates.length - 1];
}

// ─── Pick weather ─────────────────────────────────────────────────────────────
export function pickWeather(nation) {
  const stability = nation?.stability || 75;
  // Higher epoch → slightly more chance of extreme weather
  const epochIndex = nation?.tech_level || 1;
  const weights = [
    { w: "Clear",       p: 30 },
    { w: "Rain",        p: 20 },
    { w: "Storm",       p: stability < 50 ? 15 : 8 },
    { w: "Heatwave",    p: epochIndex > 8 ? 10 : 5 },
    { w: "Cold Front",  p: 8 },
    { w: "Drought",     p: stability < 40 ? 10 : 4 },
    { w: "Heavy Wind",  p: 10 },
  ];
  const total = weights.reduce((s, x) => s + x.p, 0);
  let r = Math.random() * total;
  for (const x of weights) {
    r -= x.p;
    if (r <= 0) return x.w;
  }
  return "Clear";
}

// ─── Generate events for a nation ────────────────────────────────────────────
export function generateEventsForNation(nation, count = 3) {
  const atWar = (nation?.at_war_with || []).length > 0;
  const eligible = EVENT_TEMPLATES.filter(t => {
    if (t.conditions?.at_war && !atWar) return false;
    return true;
  });
  const events = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let tpl = pickWeightedEvent(eligible);
    // Try to avoid duplicates
    let tries = 0;
    while (used.has(tpl.headline) && tries < 10) { tpl = pickWeightedEvent(eligible); tries++; }
    used.add(tpl.headline);
    events.push({ ...tpl });
  }
  return events;
}

export const EDITION_ADJECTIVES = ["National","Morning","Evening","Digital","Special","Live","Breaking","Daily","Weekend","Late Night"];