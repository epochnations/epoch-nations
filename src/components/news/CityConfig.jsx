// ─── City Definitions ─────────────────────────────────────────────────────────
// Cities are deterministically generated per nation (seeded by nation name)

export const CITY_TEMPLATES = [
  { name: "Aurora",     emoji: "🌅", tag: "AUR", color: "#f59e0b", region: "Northern Plains" },
  { name: "Ironhold",   emoji: "⚙️",  tag: "IRN", color: "#6b7280", region: "Industrial Core" },
  { name: "Seabridge",  emoji: "⚓",  tag: "SEA", color: "#06b6d4", region: "Coastal Province" },
  { name: "New Solis",  emoji: "🌇", tag: "SOL", color: "#8b5cf6", region: "Capital District" },
  { name: "Valcrest",   emoji: "🏔️",  tag: "VAL", color: "#10b981", region: "Mountain Territory" },
  { name: "Dunmore",    emoji: "🏚️",  tag: "DUN", color: "#dc2626", region: "Eastern Borderlands" },
];

export const POLITICAL_LEANINGS = [
  "Progressive", "Conservative", "Centrist", "Libertarian", "Socialist", "Nationalist"
];

export const MAYOR_NAMES = [
  "Mayor Elara Voss", "Mayor Juno Hartfield", "Mayor Cade Morrow", "Mayor Priya Osei",
  "Mayor Finn Larkin", "Mayor Desta Nakamura", "Mayor Bram Solano", "Mayor Yeva Kowalski",
  "Mayor Selin Özkan", "Mayor Tobias Ferrara", "Mayor Amara Diallo", "Mayor Noor Al-Rashid",
];

// Returns 5–6 cities for a given nation, seeded by name
export function getCitiesForNation(nation) {
  const seed = (nation?.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = 5 + (seed % 2); // 5 or 6 cities
  const picked = [];
  const indices = new Set();
  let i = seed;
  while (picked.length < count) {
    const idx = i % CITY_TEMPLATES.length;
    if (!indices.has(idx)) {
      indices.add(idx);
      const tpl = CITY_TEMPLATES[idx];
      const mayorIdx = (seed + idx * 7) % MAYOR_NAMES.length;
      const leanIdx = (seed + idx * 3) % POLITICAL_LEANINGS.length;
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
        mayorApproval: 50 + ((seed + idx * 13) % 40),
        policeApproval: 45 + ((seed + idx * 11) % 45),
        businessConf: 40 + ((seed + idx * 17) % 50),
        happiness: 50 + ((seed + idx * 9) % 40),
      });
    }
    i = (i * 31 + 17) % 10007;
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

  // CIVIL RIGHTS DEBATES
  { category:"crime", severity:"warning", weight:5,
    headline:"Citizens of {CITY} Demand Greater Police Accountability",
    body:"A growing coalition of {CITY} residents is calling for an independent police oversight board following a series of use-of-force incidents. Protests have drawn thousands.",
    options:[
      { label:"🏛 Establish Oversight Board", preview:{ public_trust:+0.08, stability:+4 }, effects:{ public_trust:0.08, stability:4 } },
      { label:"📢 Support Current Force",     preview:{ stability:+2, public_trust:-0.05 }, effects:{ stability:2, public_trust:-0.05 } },
      { label:"🔍 Commission Review",         preview:{ currency:-30, stability:+2 },       effects:{ currency:-30, stability:2 } },
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

  // FLAVOR LOCAL NEWS
  { category:"classifieds", severity:"info", weight:10,
    headline:"{CITY} Residents Report Sightings of Rare Bird in City Park",
    body:"Dozens of bird-watchers have descended on {CITY}'s Riverside Park following confirmed sightings of a rare migratory species not seen in this region for over 40 years. The city's wildlife bureau is monitoring the situation.",
    options:[
      { label:"🐦 Designate Protected Zone",  preview:{ public_trust:+0.04, stability:+2 }, effects:{ public_trust:0.04, stability:2 } },
      { label:"📋 Let Nature Handle It",      preview:{},                                   effects:{} },
    ]
  },
  { category:"classifieds", severity:"info", weight:10,
    headline:"{CITY} Annual Chili Cook-Off Draws 500 Contestants",
    body:"The beloved {CITY} Annual Chili Cook-Off returned this weekend with a record 500 entries. The winner, a retired firefighter, won with a secret family recipe passed down four generations.",
    options:[
      { label:"🏆 Sponsor the Event",        preview:{ stability:+3, public_trust:+0.03 }, effects:{ stability:3, public_trust:0.03 } },
      { label:"📋 No Action Needed",         preview:{},                                   effects:{} },
    ]
  },
  { category:"classifieds", severity:"info", weight:9,
    headline:"{CITY} High School Football Team Wins Regional Championship",
    body:"The {CITY} Eagles have won their first regional football championship in 22 years, defeating rivals 34–17 in a rain-soaked final. The city is planning a victory parade for Saturday.",
    options:[
      { label:"🎉 Fund the Victory Parade",  preview:{ stability:+4, public_trust:+0.05, currency:-20 }, effects:{ stability:4, public_trust:0.05, currency:-20 } },
      { label:"📋 Send Congratulations",     preview:{ stability:+1 },                    effects:{ stability:1 } },
    ]
  },
  { category:"classifieds", severity:"info", weight:9,
    headline:"Lost Cat Returns Home After 6-Month Disappearance in {CITY}",
    body:"Whiskers, a tabby cat belonging to a {CITY} family, has returned home after vanishing six months ago. The reunion has gone viral on local social networks. Neighbors say the cat appeared healthier than ever.",
    options:[
      { label:"📣 Feature on National Broadcast", preview:{ public_trust:+0.04 },         effects:{ public_trust:0.04 } },
      { label:"📋 Wholesome News, No Action",preview:{},                                  effects:{} },
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
  { category:"education", severity:"info", weight:8,
    headline:"{CITY} 10-Year-Old Publishes Novel, Stuns Literary World",
    body:"A 10-year-old student from {CITY} has self-published a 200-page fantasy novel that has gone viral nationally. Publishers are reportedly in a bidding war. The student credits the school library with sparking the journey.",
    options:[
      { label:"📚 Fund Youth Writing Program", preview:{ tech_points:+8, public_trust:+0.05 }, effects:{ tech_points:8, public_trust:0.05 } },
      { label:"📋 Celebrate the Achievement", preview:{ stability:+2 },                      effects:{ stability:2 } },
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
  { category:"science", severity:"opportunity", weight:6,
    headline:"{CITY} University Team Develops Cheaper Solar Panel Prototype",
    body:"Researchers at {CITY} University of Technology have developed a solar panel prototype that produces the same output at 40% of the cost of existing models. Commercialization talks are underway.",
    options:[
      { label:"⚡ Fund National Rollout",     preview:{ currency:-100, gdp:+12, tech_points:+20 }, effects:{ currency:-100, gdp:12, tech_points:20 } },
      { label:"🔬 Support Further Research",  preview:{ currency:-50, tech_points:+15 },   effects:{ currency:-50, tech_points:15 } },
    ]
  },
  { category:"military", severity:"info", weight:7,
    headline:"{CITY} Veterans Memorial Park Fully Restored After Renovation",
    body:"After 18 months of restoration work, {CITY}'s Veterans Memorial Park reopened to the public with a moving ceremony attended by hundreds of veterans and families. The renovated park features a new eternal flame.",
    options:[
      { label:"🏅 Host National Remembrance Ceremony", preview:{ public_trust:+0.07, stability:+3 }, effects:{ public_trust:0.07, stability:3 } },
      { label:"📋 Attend Locally",           preview:{ public_trust:+0.03 },             effects:{ public_trust:0.03 } },
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