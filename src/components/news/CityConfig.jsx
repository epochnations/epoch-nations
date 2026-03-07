// ─── City Definitions ─────────────────────────────────────────────────────────

export const CITY_TEMPLATES = [
  { name: "Aurora",       emoji: "🌅", tag: "AUR", color: "#f59e0b", region: "Northern Plains" },
  { name: "Ironhold",     emoji: "⚙️",  tag: "IRN", color: "#6b7280", region: "Industrial Core" },
  { name: "Seabridge",    emoji: "⚓",  tag: "SEA", color: "#06b6d4", region: "Coastal Province" },
  { name: "New Solis",    emoji: "🌇", tag: "SOL", color: "#8b5cf6", region: "Capital District" },
  { name: "Valcrest",     emoji: "🏔️",  tag: "VAL", color: "#10b981", region: "Mountain Territory" },
  { name: "Dunmore",      emoji: "🏚️",  tag: "DUN", color: "#dc2626", region: "Eastern Borderlands" },
  { name: "Harborgate",   emoji: "🚢", tag: "HAR", color: "#0ea5e9", region: "Western Shore" },
  { name: "Embervale",    emoji: "🔥", tag: "EMB", color: "#f97316", region: "Southern Highlands" },
  { name: "Coldfen",      emoji: "❄️",  tag: "COL", color: "#7dd3fc", region: "Frozen North" },
  { name: "Greenveil",    emoji: "🌿", tag: "GRN", color: "#22c55e", region: "Forest Canton" },
  { name: "Ashford",      emoji: "🏛️",  tag: "ASH", color: "#a78bfa", region: "Central Province" },
  { name: "Rivenmoor",    emoji: "🌊", tag: "RIV", color: "#38bdf8", region: "River Delta" },
  { name: "Stonehaven",   emoji: "🪨", tag: "STN", color: "#78716c", region: "Rocky Highlands" },
  { name: "Veldport",     emoji: "🛳️", tag: "VLD", color: "#0891b2", region: "Trade Harbor" },
  { name: "Blackmere",    emoji: "🌑", tag: "BLK", color: "#374151", region: "Dark Moors" },
  { name: "Goldspire",    emoji: "🥇", tag: "GLD", color: "#eab308", region: "Mining Belt" },
  { name: "Clearwater",   emoji: "💧", tag: "CLR", color: "#67e8f9", region: "Lake District" },
  { name: "Thornwick",    emoji: "🌵", tag: "THN", color: "#84cc16", region: "Dry Savannah" },
  { name: "Frostgate",    emoji: "🏔️", tag: "FRS", color: "#bae6fd", region: "Alpine Pass" },
  { name: "Marshfield",   emoji: "🌾", tag: "MRS", color: "#86efac", region: "Wetland Plains" },
  { name: "Ravenport",    emoji: "🐦", tag: "RVN", color: "#6366f1", region: "Cliff Shores" },
  { name: "Cinderfall",   emoji: "🌋", tag: "CND", color: "#ef4444", region: "Volcanic Belt" },
  { name: "Silversong",   emoji: "🎵", tag: "SLV", color: "#c0c0c0", region: "Cultural Quarter" },
  { name: "Westgate",     emoji: "🌤️", tag: "WST", color: "#fbbf24", region: "Western Corridor" },
  { name: "Eastholm",     emoji: "🌄", tag: "EST", color: "#fb923c", region: "Eastern Reach" },
  { name: "Northbury",    emoji: "🧊", tag: "NTH", color: "#93c5fd", region: "Northern Tundra" },
  { name: "Southwick",    emoji: "🌴", tag: "STH", color: "#4ade80", region: "Tropical South" },
  { name: "Midvale",      emoji: "🏙️", tag: "MDV", color: "#e879f9", region: "Central Plateau" },
  { name: "Pinehurst",    emoji: "🌲", tag: "PIN", color: "#16a34a", region: "Forest North" },
  { name: "Copperton",    emoji: "🔧", tag: "CPR", color: "#b45309", region: "Foundry District" },
  { name: "Duskhollow",   emoji: "🌙", tag: "DSK", color: "#7c3aed", region: "Shadow Vale" },
  { name: "Brightport",   emoji: "⭐", tag: "BRT", color: "#fef08a", region: "Star Coast" },
  { name: "Irongate",     emoji: "🔩", tag: "ING", color: "#9ca3af", region: "Forge Quarter" },
  { name: "Sandhaven",    emoji: "🏖️", tag: "SND", color: "#fde68a", region: "Desert Coast" },
  { name: "Meadowbrook",  emoji: "🌻", tag: "MDW", color: "#facc15", region: "Agricultural Basin" },
  { name: "Coalbridge",   emoji: "⛏️", tag: "CBR", color: "#44403c", region: "Mining Corridor" },
  { name: "Silverstone",  emoji: "🪙", tag: "SLS", color: "#d4d4d8", region: "Commerce Hub" },
  { name: "Redcliff",     emoji: "🏜️", tag: "RDC", color: "#f87171", region: "Canyon Territory" },
  { name: "Hollowfen",    emoji: "🌫️", tag: "HLW", color: "#94a3b8", region: "Misty Marshes" },
  { name: "Dawnwatch",    emoji: "🌞", tag: "DWN", color: "#fcd34d", region: "Sunrise Coast" },
  { name: "Oldwick",      emoji: "🏰", tag: "OLD", color: "#a16207", region: "Historic Heartland" },
  { name: "Tidewater",    emoji: "🌬️", tag: "TDW", color: "#60a5fa", region: "Wind Bay" },
  { name: "Emberton",     emoji: "🪵", tag: "EBT", color: "#92400e", region: "Timber Coast" },
  { name: "Crystalvale",  emoji: "💎", tag: "CRY", color: "#a5f3fc", region: "Gem District" },
  { name: "Wildmere",     emoji: "🦌", tag: "WLD", color: "#65a30d", region: "Wilderness Frontier" },
  { name: "Ashenvale",    emoji: "🌑", tag: "AVL", color: "#57534e", region: "Ashen Wastes" },
  { name: "Porthaven",    emoji: "⛵", tag: "PRT", color: "#0284c7", region: "Sailing Quarter" },
  { name: "Moonridge",    emoji: "🌕", tag: "MNR", color: "#fef9c3", region: "Lunar Peaks" },
  { name: "Sunfield",     emoji: "☀️",  tag: "SNF", color: "#fb923c", region: "Prairie Sun" },
  { name: "Ironveil",     emoji: "🛡️", tag: "IVL", color: "#475569", region: "Fortified Border" },
  { name: "Coastmark",    emoji: "🗺️", tag: "CST", color: "#2dd4bf", region: "Navigator's Point" },
  { name: "Bramblewood",  emoji: "🌳", tag: "BRW", color: "#4d7c0f", region: "Thorned Forest" },
  { name: "Vaultmere",    emoji: "🏦", tag: "VLT", color: "#a3e635", region: "Banking Quarter" },
  { name: "Graystone",    emoji: "🪨", tag: "GRY", color: "#6b7280", region: "Quarry Province" },
  { name: "Flamecrest",   emoji: "🌋", tag: "FLC", color: "#dc2626", region: "Volcanic Heights" },
  { name: "Breezehaven",  emoji: "🌬️", tag: "BRZ", color: "#7dd3fc", region: "Sea Breeze Isle" },
  { name: "Thornfield",   emoji: "🌾", tag: "TRF", color: "#a3e635", region: "Grain Belt" },
  { name: "Shadowport",   emoji: "🌑", tag: "SHP", color: "#1e1b4b", region: "Underground Quarter" },
  { name: "Sunhaven",     emoji: "🌺", tag: "SHV", color: "#f472b6", region: "Blossom Coast" },
  { name: "Deepwater",    emoji: "🐋", tag: "DPW", color: "#1d4ed8", region: "Ocean Depths" },
  { name: "Ridgemont",    emoji: "⛰️", tag: "RDG", color: "#78716c", region: "Mountain Ridge" },
  { name: "Crestfall",    emoji: "🌊", tag: "CRF", color: "#0ea5e9", region: "Cresting Cliffs" },
  { name: "Ironspire",    emoji: "🗼", tag: "IRS", color: "#6b7280", region: "Tower District" },
  { name: "Goldmere",     emoji: "✨", tag: "GLM", color: "#ca8a04", region: "Gilded Quarter" },
  { name: "Lakewood",     emoji: "🦆", tag: "LKW", color: "#22d3ee", region: "Lakeside Province" },
  { name: "Dusthaven",    emoji: "🏜️", tag: "DSH", color: "#d97706", region: "Desert Outpost" },
  { name: "Springvale",   emoji: "🌷", tag: "SPV", color: "#fb7185", region: "Bloom Valley" },
  { name: "Coppergate",   emoji: "🏗️", tag: "CPG", color: "#c2410c", region: "Construction Belt" },
  { name: "Twinspire",    emoji: "🏙️", tag: "TWN", color: "#8b5cf6", region: "Twin Towers" },
  { name: "Fernhollow",   emoji: "🌿", tag: "FNH", color: "#166534", region: "Jungle Hollow" },
  { name: "Boulderpass",  emoji: "🪨", tag: "BLP", color: "#92400e", region: "Boulder Crossing" },
  { name: "Mistwater",    emoji: "🌫️", tag: "MSW", color: "#94a3b8", region: "Fog Lagoon" },
  { name: "Brighthollow", emoji: "💡", tag: "BHW", color: "#fef08a", region: "Innovation Hub" },
  { name: "Steelport",    emoji: "⚒️",  tag: "STP", color: "#475569", region: "Steel Coast" },
  { name: "Crownwick",    emoji: "👑", tag: "CRW", color: "#fbbf24", region: "Royal Quarter" },
  { name: "Ashport",      emoji: "🛳️", tag: "AHP", color: "#78716c", region: "Grey Harbour" },
];

export const POLITICAL_LEANINGS = [
  "Progressive", "Conservative", "Centrist", "Libertarian", "Socialist", "Nationalist",
  "Technocratic", "Populist", "Green", "Federalist"
];

export const MAYOR_NAMES = [
  "Mayor Elara Voss", "Mayor Juno Hartfield", "Mayor Cade Morrow", "Mayor Priya Osei",
  "Mayor Finn Larkin", "Mayor Desta Nakamura", "Mayor Bram Solano", "Mayor Yeva Kowalski",
  "Mayor Selin Özkan", "Mayor Tobias Ferrara", "Mayor Amara Diallo", "Mayor Noor Al-Rashid",
  "Mayor Reuben Castillo", "Mayor Ingrid Solberg", "Mayor Kwame Asante", "Mayor Leila Farouk",
  "Mayor Dmitri Volkov", "Mayor Chioma Eze", "Mayor Marco Delgado", "Mayor Hana Petrov",
  "Mayor Arjun Mehta", "Mayor Fatima Al-Hassan", "Mayor Olaf Brennan", "Mayor Yuki Tanaka",
  "Mayor Celeste Moreau", "Mayor Tariq Okonkwo", "Mayor Sigrid Halvorsen", "Mayor Emeka Nwosu",
];

// Engagement tier labels
export const ENGAGEMENT_TIERS = [
  { min: 80, label: "Thriving",   color: "#22c55e", icon: "🟢" },
  { min: 60, label: "Active",     color: "#84cc16", icon: "🔵" },
  { min: 40, label: "Moderate",   color: "#f59e0b", icon: "🟡" },
  { min: 20, label: "Struggling", color: "#ef4444", icon: "🟠" },
  { min: 0,  label: "Dormant",    color: "#6b7280", icon: "🔴" },
];

export function getEngagementTier(score) {
  return ENGAGEMENT_TIERS.find(t => score >= t.min) || ENGAGEMENT_TIERS[ENGAGEMENT_TIERS.length - 1];
}

// Returns 25–75 cities for a given nation, seeded by name
export function getCitiesForNation(nation) {
  const seed = (nation?.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const techBonus = Math.floor((nation?.tech_level || 1) / 2); // more cities with higher tech
  const baseCount = 25 + (seed % 51); // 25–75
  const count = Math.min(baseCount + techBonus, CITY_TEMPLATES.length);
  const picked = [];
  const indices = new Set();
  let i = seed;
  while (picked.length < count) {
    const idx = Math.abs(i) % CITY_TEMPLATES.length;
    if (!indices.has(idx)) {
      indices.add(idx);
      const tpl = CITY_TEMPLATES[idx];
      const mayorIdx = (seed + idx * 7) % MAYOR_NAMES.length;
      const leanIdx = (seed + idx * 3) % POLITICAL_LEANINGS.length;

      // Citizen engagement: composite of multiple factors, seeded
      const baseEngagement = 35 + ((seed + idx * 11) % 55); // 35–89
      const voterTurnout   = 30 + ((seed + idx * 13) % 60);
      const petitionsMonth = (seed + idx * 17) % 25;
      const communityScore = 40 + ((seed + idx * 19) % 50);
      const volunteerRate  = 10 + ((seed + idx * 23) % 40);
      const engagementScore = Math.round((baseEngagement + communityScore + voterTurnout / 2) / 3);

      picked.push({
        id: `${nation?.id || "x"}_${tpl.tag}`,
        name: tpl.name,
        emoji: tpl.emoji,
        tag: tpl.tag,
        color: tpl.color,
        region: tpl.region,
        fullName: `City of ${tpl.name}`,
        mayor: MAYOR_NAMES[mayorIdx],
        leaning: POLITICAL_LEANINGS[leanIdx],
        mayorApproval:   50 + ((seed + idx * 13) % 40),
        policeApproval:  45 + ((seed + idx * 11) % 45),
        businessConf:    40 + ((seed + idx * 17) % 50),
        happiness:       50 + ((seed + idx * 9)  % 40),
        // Citizen Engagement
        engagementScore,
        voterTurnout,
        petitionsMonth,
        communityScore,
        volunteerRate,
        population: 10000 + ((seed + idx * 29) % 990000),
      });
    }
    i = (i * 31 + 17) % 100003;
  }
  return picked;
}

// ─── City Event Templates ──────────────────────────────────────────────────────
export const CITY_EVENT_TEMPLATES = [
  // LOCAL ELECTIONS
  { category:"government", severity:"warning", weight:5,
    headline:"{CITY} Mayor Faces Budget Crisis Ahead of Re-election",
    body:"{CITY}'s {MAYOR} is under fire as the city budget runs a growing deficit. Citizens are demanding answers at packed town halls. The upcoming election may hinge entirely on fiscal responsibility.",
    options:[
      { label:"💰 Send Emergency Funds", preview:{ currency:-80, stability:+5 }, effects:{ currency:-80, stability:5 } },
      { label:"🗳 Support Opposition",   preview:{ stability:+3 },               effects:{ stability:3 } },
      { label:"🤝 Back Current Mayor",   preview:{ stability:-2, gdp:+5 },       effects:{ stability:-2, gdp:5 } },
      { label:"📋 Remain Neutral",       preview:{},                             effects:{} },
    ]
  },
  { category:"government", severity:"opportunity", weight:4,
    headline:"{CITY} Holds Snap Election After Corruption Scandal",
    body:"A surprise snap election has been called in {CITY} following the resignation of two senior city council members over a contracting scandal. Voter turnout is expected to be record-breaking.",
    options:[
      { label:"🗳 Fund Reform Candidate", preview:{ currency:-60, stability:+6, public_trust:+0.05 }, effects:{ currency:-60, stability:6, public_trust:0.05 } },
      { label:"📢 Issue Public Statement", preview:{ public_trust:+0.03 },                           effects:{ public_trust:0.03 } },
      { label:"🤐 Stay Out of It",        preview:{ stability:-1 },                                  effects:{ stability:-1 } },
    ]
  },
  { category:"government", severity:"info", weight:8,
    headline:"{CITY} Council Approves New Community Center After Years of Debate",
    body:"After three years of debate, {CITY}'s city council has finally approved funding for a new community center in the eastern district. Ground is expected to break next quarter.",
    options:[
      { label:"🏗 Contribute National Grant", preview:{ currency:-50, stability:+4 }, effects:{ currency:-50, stability:4 } },
      { label:"👏 Commend the Decision",      preview:{ public_trust:+0.02 },         effects:{ public_trust:0.02 } },
    ]
  },
  { category:"government", severity:"warning", weight:4,
    headline:"{CITY} Housing Rights Protest Shuts Down City Hall",
    body:"Hundreds of renters gathered outside {CITY} City Hall demanding rent controls and eviction protections. Organizers say the housing crisis is pushing families out of the city.",
    options:[
      { label:"🏘 Implement Rent Controls",   preview:{ stability:+6, gdp:-4 },             effects:{ stability:6, gdp:-4 } },
      { label:"💼 Protect Property Rights",   preview:{ gdp:+5, stability:-4 },             effects:{ gdp:5, stability:-4 } },
      { label:"🤝 Mediated Compromise",       preview:{ stability:+3, gdp:+1 },             effects:{ stability:3, gdp:1 } },
    ]
  },
  { category:"government", severity:"info", weight:8,
    headline:"{CITY} Launches Free Public Wi-Fi Across Downtown Core",
    body:"{CITY}'s municipal technology office has activated free public Wi-Fi across its 12-block downtown core. Citizens are calling it 'the biggest quality-of-life upgrade in years.'",
    options:[
      { label:"📡 Expand to Full City",       preview:{ currency:-60, gdp:+8, public_trust:+0.06 }, effects:{ currency:-60, gdp:8, public_trust:0.06 } },
      { label:"👍 Commend the Initiative",    preview:{ public_trust:+0.03 },             effects:{ public_trust:0.03 } },
    ]
  },

  // LOCAL COURT RULINGS
  { category:"crime", severity:"warning", weight:5,
    headline:"{CITY} Court Rules Against Police Use of Surveillance Cameras",
    body:"The {CITY} District Court has struck down a municipal ordinance allowing CCTV cameras in residential neighborhoods, citing privacy concerns. The ruling has sparked debate on security versus civil liberties.",
    options:[
      { label:"⚖️ Respect the Ruling",       preview:{ public_trust:+0.06, stability:+2 }, effects:{ public_trust:0.06, stability:2 } },
      { label:"🔁 Launch Appeal",             preview:{ currency:-40, stability:-1 },       effects:{ currency:-40, stability:-1 } },
      { label:"🚔 Override Locally",          preview:{ stability:-4, public_trust:-0.08 }, effects:{ stability:-4, public_trust:-0.08 } },
    ]
  },
  { category:"crime", severity:"opportunity", weight:4,
    headline:"{CITY} Court Upholds Corporate Accountability Law",
    body:"A landmark ruling in {CITY} requires all major corporations to submit annual public audits. Business groups are challenging it but citizen groups are celebrating.",
    options:[
      { label:"✅ Endorse the Ruling",        preview:{ public_trust:+0.07, gdp:-3 },      effects:{ public_trust:0.07, gdp:-3 } },
      { label:"🏢 Defend Business Interests", preview:{ gdp:+5, stability:-3 },             effects:{ gdp:5, stability:-3 } },
    ]
  },

  // CIVIL RIGHTS
  { category:"crime", severity:"warning", weight:5,
    headline:"Citizens of {CITY} Demand Greater Police Accountability",
    body:"A growing coalition of {CITY} residents is calling for an independent police oversight board following a series of use-of-force incidents. Protests have drawn thousands.",
    options:[
      { label:"🏛 Establish Oversight Board", preview:{ public_trust:+0.08, stability:+4 }, effects:{ public_trust:0.08, stability:4 } },
      { label:"📢 Support Current Force",     preview:{ stability:+2, public_trust:-0.05 }, effects:{ stability:2, public_trust:-0.05 } },
      { label:"🔍 Commission Review",         preview:{ currency:-30, stability:+2 },       effects:{ currency:-30, stability:2 } },
    ]
  },

  // LOCAL CRIME
  { category:"crime", severity:"warning", weight:7,
    headline:"Burglary Wave Hits {CITY} Residential Districts",
    body:"Residents of {CITY}'s western neighborhoods are on edge after a string of break-ins spanning three weeks. Police have increased patrols but no suspects have been arrested.",
    options:[
      { label:"🚔 Deploy Police Resources",   preview:{ currency:-50, stability:+4 },       effects:{ currency:-50, stability:4 } },
      { label:"💡 Community Watch Program",   preview:{ currency:-20, stability:+3, public_trust:+0.04 }, effects:{ currency:-20, stability:3, public_trust:0.04 } },
    ]
  },
  { category:"crime", severity:"info", weight:8,
    headline:"{CITY} Drug Enforcement Operation Leads to 22 Arrests",
    body:"A coordinated sweep by {CITY} police and national enforcement agents has resulted in 22 arrests and the seizure of significant contraband. Officials say this is one of the largest local operations in a decade.",
    options:[
      { label:"⚖️ Full Prosecution",          preview:{ stability:+5, public_trust:+0.05 }, effects:{ stability:5, public_trust:0.05 } },
      { label:"🔄 Rehabilitation Program",    preview:{ currency:-40, stability:+3 },       effects:{ currency:-40, stability:3 } },
    ]
  },
  { category:"crime", severity:"warning", weight:5,
    headline:"Gang Territory Dispute Sparks Violence in {CITY}",
    body:"A turf conflict between two rival groups has led to three incidents in {CITY}'s southern district over the past week. Police have declared a curfew in affected zones.",
    options:[
      { label:"🚔 Surge Policing",           preview:{ currency:-70, stability:+5, public_trust:-0.03 }, effects:{ currency:-70, stability:5, public_trust:-0.03 } },
      { label:"🏥 Fund Community Outreach",  preview:{ currency:-50, stability:+3, public_trust:+0.05 }, effects:{ currency:-50, stability:3, public_trust:0.05 } },
    ]
  },

  // LOCAL BUSINESS
  { category:"business", severity:"opportunity", weight:7,
    headline:"New Tech Startup Hub Opens in {CITY}, Bringing 500 Jobs",
    body:"A major technology accelerator has opened its doors in {CITY}, attracting 14 startup companies and creating an estimated 500 direct jobs. City officials called it the largest economic development win in a decade.",
    options:[
      { label:"🏛 Issue Tax Incentive",       preview:{ currency:-60, gdp:+15 },            effects:{ currency:-60, gdp:15 } },
      { label:"🤝 Partner With Hub",          preview:{ gdp:+8, tech_points:+10 },          effects:{ gdp:8, tech_points:10 } },
    ]
  },
  { category:"business", severity:"critical", weight:4,
    headline:"{CITY}'s Largest Employer Threatens to Relocate Operations",
    body:"MarcoCorp, {CITY}'s largest employer with 3,200 workers, has issued a formal warning that it may relocate unless the city reduces commercial property taxes. Union leaders are urging the national government to intervene.",
    options:[
      { label:"💸 Offer Tax Relief Package",  preview:{ currency:-100, gdp:+10, stability:+4 }, effects:{ currency:-100, gdp:10, stability:4 } },
      { label:"🤝 Negotiate Directly",        preview:{ currency:-40, gdp:+5 },               effects:{ currency:-40, gdp:5 } },
      { label:"📦 Let Them Leave",            preview:{ gdp:-8, stability:-5 },               effects:{ gdp:-8, stability:-5 } },
    ]
  },
  { category:"business", severity:"info", weight:9,
    headline:"{CITY} Farmers Market Breaks Attendance Record This Weekend",
    body:"Over 12,000 visitors attended {CITY}'s outdoor farmers market this weekend, setting a new all-time attendance record. Local vendors reported a 40% increase in revenue compared to the same weekend last year.",
    options:[
      { label:"🌽 Issue City Grant to Vendors", preview:{ currency:-30, stability:+3, res_food:+15 }, effects:{ currency:-30, stability:3, res_food:15 } },
      { label:"📋 Celebrate Publicly",          preview:{ public_trust:+0.02 },                      effects:{ public_trust:0.02 } },
    ]
  },
  { category:"business", severity:"opportunity", weight:6,
    headline:"Foreign Investment Firm Eyes {CITY} for Regional HQ",
    body:"A major international investment firm has shortlisted {CITY} as a potential site for its regional headquarters, which would bring an estimated 1,200 high-paying jobs and significant tax revenue.",
    options:[
      { label:"🤝 Offer Land & Tax Package",  preview:{ currency:-120, gdp:+20 },           effects:{ currency:-120, gdp:20 } },
      { label:"📋 Submit Standard Proposal",  preview:{ gdp:+8 },                            effects:{ gdp:8 } },
    ]
  },

  // LOCAL EDUCATION
  { category:"education", severity:"opportunity", weight:5,
    headline:"{CITY} School District Launches Free Coding Bootcamp",
    body:"Starting next month, all high school students in {CITY} will have access to a free after-school coding bootcamp funded through a public-private partnership. Over 800 students have already registered.",
    options:[
      { label:"🎓 Fund Full Expansion",       preview:{ currency:-60, tech_points:+15 },    effects:{ currency:-60, tech_points:15 } },
      { label:"👍 Publicly Endorse",          preview:{ public_trust:+0.04 },               effects:{ public_trust:0.04 } },
    ]
  },
  { category:"education", severity:"warning", weight:5,
    headline:"{CITY} Teachers Strike Over Salary Disputes",
    body:"Teachers in {CITY}'s public school system have gone on strike for the second time this year, demanding a 12% pay raise. Parents are scrambling for alternative childcare as classes are suspended.",
    options:[
      { label:"💰 Fund Salary Increase",      preview:{ currency:-80, stability:+5, gdp:+3 }, effects:{ currency:-80, stability:5, gdp:3 } },
      { label:"⚖️ Arbitration Process",       preview:{ currency:-20, stability:+2 },         effects:{ currency:-20, stability:2 } },
      { label:"🚔 Enforce Return to Work",    preview:{ public_trust:-0.1, stability:-3 },    effects:{ public_trust:-0.1, stability:-3 } },
    ]
  },
  { category:"education", severity:"info", weight:8,
    headline:"{CITY} 10-Year-Old Publishes Novel, Stuns Literary World",
    body:"A 10-year-old student from {CITY} has self-published a 200-page fantasy novel that has gone viral nationally. Publishers are reportedly in a bidding war. The student credits the school library with sparking the journey.",
    options:[
      { label:"📚 Fund Youth Writing Program", preview:{ tech_points:+8, public_trust:+0.05 }, effects:{ tech_points:8, public_trust:0.05 } },
      { label:"📋 Celebrate the Achievement", preview:{ stability:+2 },                      effects:{ stability:2 } },
    ]
  },
  { category:"education", severity:"warning", weight:5,
    headline:"{CITY} University Faces Funding Shortfall, May Close Departments",
    body:"{CITY}'s largest university has announced a significant budget deficit, threatening the closure of three academic departments and the loss of over 200 faculty jobs.",
    options:[
      { label:"🏛 Emergency University Grant", preview:{ currency:-100, tech_points:+20, stability:+3 }, effects:{ currency:-100, tech_points:20, stability:3 } },
      { label:"📋 Let Board Decide",           preview:{ tech_points:-5, stability:-2 },               effects:{ tech_points:-5, stability:-2 } },
    ]
  },

  // LOCAL WEATHER
  { category:"weather", severity:"warning", weight:6,
    headline:"Severe Flood Warning Issued for {CITY} Low-Lying Areas",
    body:"Emergency services have issued a flood warning for {CITY}'s riverside districts following 72 hours of continuous rainfall. Residents in low-lying zones are advised to evacuate.",
    is_disaster: true,
    options:[
      { label:"🚑 Deploy Rescue Teams",       preview:{ currency:-80, stability:+4 },       effects:{ currency:-80, stability:4 } },
      { label:"🏗 Reinforce Flood Barriers",  preview:{ currency:-120, gdp:+3 },            effects:{ currency:-120, gdp:3 } },
      { label:"📢 Issue Public Evacuation",   preview:{ stability:+2 },                     effects:{ stability:2 } },
    ]
  },
  { category:"weather", severity:"info", weight:8,
    headline:"Record Sunshine in {CITY} Boosts Outdoor Commerce",
    body:"An unusually warm and sunny week in {CITY} has brought a surge in foot traffic to outdoor markets, cafes, and parks. Local business owners report their best week of the quarter.",
    options:[
      { label:"🎉 Host City Fair",            preview:{ stability:+4, gdp:+5, currency:-20 }, effects:{ stability:4, gdp:5, currency:-20 } },
      { label:"📋 Enjoy Naturally",           preview:{ stability:+2 },                      effects:{ stability:2 } },
    ]
  },
  { category:"weather", severity:"critical", weight:3,
    headline:"Tornado Warning Declared Across {CITY} Metro Area",
    body:"Meteorologists have issued an urgent tornado warning for {CITY} and surrounding districts. Emergency shelters are being activated as residents are urged to take cover immediately.",
    is_disaster: true,
    options:[
      { label:"🏥 Full Emergency Activation", preview:{ currency:-150, stability:+6 },      effects:{ currency:-150, stability:6 } },
      { label:"📢 Public Warning Only",        preview:{ stability:+2, gdp:-3 },             effects:{ stability:2, gdp:-3 } },
    ]
  },

  // PROTESTS
  { category:"crime", severity:"warning", weight:6,
    headline:"Labor Rights March Draws Thousands in {CITY}",
    body:"An estimated 8,000 workers marched through the center of {CITY} demanding improved safety standards and a minimum wage increase. The march remained peaceful but gridlocked major roads for hours.",
    options:[
      { label:"🤝 Meet Union Leadership",     preview:{ stability:+5, public_trust:+0.06 }, effects:{ stability:5, public_trust:0.06 } },
      { label:"💵 Announce Wage Review",      preview:{ stability:+4, currency:-40 },       effects:{ stability:4, currency:-40 } },
      { label:"🚔 Disperse with Police",      preview:{ stability:-5, public_trust:-0.1 },  effects:{ stability:-5, public_trust:-0.1 } },
    ]
  },
  { category:"government", severity:"warning", weight:5,
    headline:"Anti-Government Protesters Block {CITY} Central Bridge",
    body:"Thousands of demonstrators have occupied {CITY}'s main bridge for a third consecutive day, citing dissatisfaction with national policy. Commerce in the city has ground to a halt.",
    options:[
      { label:"🗣 Open National Dialogue",    preview:{ public_trust:+0.06, stability:+3 }, effects:{ public_trust:0.06, stability:3 } },
      { label:"🚔 Clear the Bridge by Force", preview:{ stability:-6, public_trust:-0.12 }, effects:{ stability:-6, public_trust:-0.12 } },
      { label:"⏳ Wait Them Out",             preview:{ gdp:-4, stability:-2 },             effects:{ gdp:-4, stability:-2 } },
    ]
  },

  // CITIZEN ENGAGEMENT EVENTS
  { category:"government", severity:"opportunity", weight:7,
    headline:"{CITY} Residents Launch Record-Breaking Petition for Park Expansion",
    body:"Over 45,000 {CITY} residents have signed a petition in under 48 hours calling for the conversion of an abandoned industrial site into a public park. The unprecedented show of civic engagement has caught the mayor's attention.",
    options:[
      { label:"🌳 Approve the Park Project",  preview:{ currency:-80, stability:+6, public_trust:+0.07 }, effects:{ currency:-80, stability:6, public_trust:0.07 } },
      { label:"📋 Commission a Study",        preview:{ currency:-20, stability:+2 },                    effects:{ currency:-20, stability:2 } },
    ]
  },
  { category:"government", severity:"info", weight:7,
    headline:"{CITY} Volunteers Clean Up 12 Tons of Waste on Community Day",
    body:"Over 3,000 {CITY} volunteers participated in the annual Community Day, removing 12 tons of litter from parks, waterways, and public spaces. Organizers called it a historic demonstration of civic pride.",
    options:[
      { label:"🏆 National Recognition Award", preview:{ public_trust:+0.08, stability:+4 }, effects:{ public_trust:0.08, stability:4 } },
      { label:"📋 Publish Official Thanks",    preview:{ public_trust:+0.03 },               effects:{ public_trust:0.03 } },
    ]
  },
  { category:"government", severity:"opportunity", weight:6,
    headline:"{CITY} Town Hall Draws Largest Civic Attendance in History",
    body:"An estimated 5,000 citizens packed {CITY}'s town hall to participate in budget discussions, with thousands more watching online. Political observers are calling it a turning point in local democracy.",
    options:[
      { label:"🗳 Adopt Citizens' Proposals",  preview:{ public_trust:+0.10, stability:+5 }, effects:{ public_trust:0.10, stability:5 } },
      { label:"📢 Acknowledge the Engagement", preview:{ public_trust:+0.04, stability:+2 }, effects:{ public_trust:0.04, stability:2 } },
    ]
  },
  { category:"education", severity:"opportunity", weight:6,
    headline:"{CITY} Youth Council Proposes Bold New Climate Plan",
    body:"A council of 24 young citizens from {CITY} has presented a 50-page climate action plan to the city government, calling for renewable energy targets and plastic bans. The plan has gone viral on social media.",
    options:[
      { label:"✅ Adopt the Youth Plan",       preview:{ public_trust:+0.09, stability:+4, gdp:-3 }, effects:{ public_trust:0.09, stability:4, gdp:-3 } },
      { label:"📋 Launch a Pilot Program",     preview:{ public_trust:+0.05, currency:-30 },         effects:{ public_trust:0.05, currency:-30 } },
    ]
  },

  // FLAVOR LOCAL NEWS
  { category:"classifieds", severity:"info", weight:10,
    headline:"{CITY} Residents Report Sightings of Rare Bird in City Park",
    body:"Dozens of bird-watchers have descended on {CITY}'s Riverside Park following confirmed sightings of a rare migratory species not seen in this region for over 40 years.",
    options:[
      { label:"🐦 Designate Protected Zone",  preview:{ public_trust:+0.04, stability:+2 }, effects:{ public_trust:0.04, stability:2 } },
      { label:"📋 Let Nature Handle It",      preview:{},                                   effects:{} },
    ]
  },
  { category:"classifieds", severity:"info", weight:10,
    headline:"{CITY} Annual Chili Cook-Off Draws 500 Contestants",
    body:"The beloved {CITY} Annual Chili Cook-Off returned this weekend with a record 500 entries. The winner, a retired firefighter, won with a secret family recipe.",
    options:[
      { label:"🏆 Sponsor the Event",        preview:{ stability:+3, public_trust:+0.03 }, effects:{ stability:3, public_trust:0.03 } },
      { label:"📋 No Action Needed",         preview:{},                                   effects:{} },
    ]
  },
  { category:"classifieds", severity:"info", weight:9,
    headline:"{CITY} High School Football Team Wins Regional Championship",
    body:"The {CITY} Eagles have won their first regional football championship in 22 years, defeating rivals 34–17 in a rain-soaked final. The city is planning a victory parade.",
    options:[
      { label:"🎉 Fund the Victory Parade",  preview:{ stability:+4, public_trust:+0.05, currency:-20 }, effects:{ stability:4, public_trust:0.05, currency:-20 } },
      { label:"📋 Send Congratulations",     preview:{ stability:+1 },                    effects:{ stability:1 } },
    ]
  },
  { category:"classifieds", severity:"info", weight:9,
    headline:"Lost Cat Returns Home After 6-Month Disappearance in {CITY}",
    body:"Whiskers, a tabby cat belonging to a {CITY} family, has returned home after vanishing six months ago. The reunion has gone viral on local social networks.",
    options:[
      { label:"📣 Feature on National Broadcast", preview:{ public_trust:+0.04 },         effects:{ public_trust:0.04 } },
      { label:"📋 Wholesome News, No Action", preview:{},                                  effects:{} },
    ]
  },
  { category:"business", severity:"info", weight:9,
    headline:"{CITY} Bakery Wins National Award for Best Sourdough",
    body:"Hearthstone Bakery in {CITY} has been awarded the National Culinary Excellence Award for its signature sourdough loaf. Owner Marta Holt says she's been perfecting the recipe for 18 years.",
    options:[
      { label:"🥖 Issue Culinary Heritage Grant", preview:{ stability:+2, public_trust:+0.03 }, effects:{ stability:2, public_trust:0.03 } },
      { label:"📋 Acknowledge Publicly",    preview:{ stability:+1 },                    effects:{ stability:1 } },
    ]
  },
  { category:"science", severity:"opportunity", weight:6,
    headline:"{CITY} University Team Develops Cheaper Solar Panel Prototype",
    body:"Researchers at {CITY} University of Technology have developed a solar panel prototype that produces the same output at 40% of the cost of existing models.",
    options:[
      { label:"⚡ Fund National Rollout",     preview:{ currency:-100, gdp:+12, tech_points:+20 }, effects:{ currency:-100, gdp:12, tech_points:20 } },
      { label:"🔬 Support Further Research",  preview:{ currency:-50, tech_points:+15 },   effects:{ currency:-50, tech_points:15 } },
    ]
  },
  { category:"military", severity:"info", weight:7,
    headline:"{CITY} Veterans Memorial Park Fully Restored After Renovation",
    body:"After 18 months of restoration work, {CITY}'s Veterans Memorial Park reopened to the public with a moving ceremony attended by hundreds of veterans and families.",
    options:[
      { label:"🏅 Host National Remembrance Ceremony", preview:{ public_trust:+0.07, stability:+3 }, effects:{ public_trust:0.07, stability:3 } },
      { label:"📋 Attend Locally",           preview:{ public_trust:+0.03 },             effects:{ public_trust:0.03 } },
    ]
  },
  { category:"classifieds", severity:"info", weight:8,
    headline:"{CITY} Street Artist Transforms Abandoned Building into Mural",
    body:"An anonymous street artist has turned a derelict warehouse wall in {CITY} into a stunning 60-metre mural depicting the city's history. The work has drawn tens of thousands of visitors.",
    options:[
      { label:"🎨 Commission Official Murals", preview:{ stability:+4, public_trust:+0.05, currency:-30 }, effects:{ stability:4, public_trust:0.05, currency:-30 } },
      { label:"📋 Preserve As-Is",            preview:{ stability:+2 },                  effects:{ stability:2 } },
    ]
  },
  { category:"classifieds", severity:"info", weight:8,
    headline:"{CITY} Grandmother Sets World Record for Longest Knitting Session",
    body:"Edna Kowalski, 84, of {CITY} has entered the record books after knitting continuously for 72 hours to raise funds for the local children's hospital. She raised over 20,000 credits.",
    options:[
      { label:"🏥 Match Her Fundraising",     preview:{ currency:-20, public_trust:+0.06 }, effects:{ currency:-20, public_trust:0.06 } },
      { label:"📋 Share Her Story Nationally", preview:{ public_trust:+0.03 },             effects:{ public_trust:0.03 } },
    ]
  },
  { category:"science", severity:"info", weight:7,
    headline:"{CITY} Startup Unveils Drone Delivery Service for Rural Areas",
    body:"A tech startup based in {CITY} has launched a drone delivery service connecting remote rural communities to urban supply chains. Early pilots show 40% cost savings for residents.",
    options:[
      { label:"🚁 Fund National Expansion",   preview:{ currency:-80, gdp:+10, tech_points:+12 }, effects:{ currency:-80, gdp:10, tech_points:12 } },
      { label:"🔬 Monitor the Pilot",         preview:{ tech_points:+5 },                  effects:{ tech_points:5 } },
    ]
  },
];

// Substitute city/mayor placeholders
export function resolveCityTemplate(tpl, city) {
  const resolve = (str) => str
    .replace(/{CITY}/g, city.name)
    .replace(/{MAYOR}/g, city.mayor);
  return {
    ...tpl,
    headline: resolve(tpl.headline),
    body: resolve(tpl.body),
  };
}

export function generateCityEvents(nation, city, count = 2) {
  const atWar = (nation?.at_war_with || []).length > 0;
  const eligible = CITY_EVENT_TEMPLATES.filter(t => {
    if (t.conditions?.at_war && !atWar) return false;
    return true;
  });
  const events = [];
  const used = new Set();
  let seed = city.tag.charCodeAt(0) + Date.now() % 10000;
  for (let i = 0; i < count; i++) {
    let idx = seed % eligible.length;
    let tries = 0;
    while (used.has(eligible[idx].headline) && tries < 15) {
      seed = (seed * 31 + 17) % eligible.length;
      idx = Math.abs(seed) % eligible.length;
      tries++;
    }
    const tpl = eligible[idx];
    used.add(tpl.headline);
    events.push(resolveCityTemplate(tpl, city));
    seed = (seed * 73 + 41) % 99991;
  }
  return events;
}