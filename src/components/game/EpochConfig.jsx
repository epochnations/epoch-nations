/**
 * Epoch Nations – 12-Epoch Civilization Progression
 */

export const EPOCHS = [
  "Stone Age",
  "Bronze Age",
  "Iron Age",
  "Classical Age",
  "Medieval Age",
  "Renaissance Age",
  "Industrial Age",
  "Modern Age",
  "Digital Age",
  "Information Age",
  "Space Age",
  "Galactic Age",
];

// Tech Points required to advance TO the next epoch
export const EPOCH_ADVANCE_COST = {
  "Stone Age":       50,
  "Bronze Age":      130,
  "Iron Age":        200,
  "Classical Age":   320,
  "Medieval Age":    500,
  "Renaissance Age": 750,
  "Industrial Age":  1100,
  "Modern Age":      1600,
  "Digital Age":     2300,
  "Information Age": 3300,
  "Space Age":       5000,
  // Galactic Age is final
};

// Minimum stability required to advance
export const EPOCH_STABILITY_THRESHOLD = {
  "Stone Age":       70,
  "Bronze Age":      70,
  "Iron Age":        70,
  "Classical Age":   72,
  "Medieval Age":    72,
  "Renaissance Age": 74,
  "Industrial Age":  75,
  "Modern Age":      76,
  "Digital Age":     78,
  "Information Age": 79,
  "Space Age":       80,
};

export const EPOCH_EMOJI = {
  "Stone Age":       "🪨",
  "Bronze Age":      "⚔️",
  "Iron Age":        "🛡",
  "Classical Age":   "🏛️",
  "Medieval Age":    "🏰",
  "Renaissance Age": "🎨",
  "Industrial Age":  "🏭",
  "Modern Age":      "🌐",
  "Digital Age":     "💻",
  "Information Age": "📡",
  "Space Age":       "🚀",
  "Galactic Age":    "🌌",
};

export const EPOCH_COLOR = {
  "Stone Age":       "#a8a29e",
  "Bronze Age":      "#d97706",
  "Iron Age":        "#64748b",
  "Classical Age":   "#eab308",
  "Medieval Age":    "#7c3aed",
  "Renaissance Age": "#db2777",
  "Industrial Age":  "#78716c",
  "Modern Age":      "#0ea5e9",
  "Digital Age":     "#06b6d4",
  "Information Age": "#22d3ee",
  "Space Age":       "#818cf8",
  "Galactic Age":    "#a78bfa",
};

// What each epoch unlocks (flavor text shown in advancement)
export const EPOCH_UNLOCKS = {
  "Stone Age":       ["Basic Shelter & Farms", "Tribal Hunting", "Flint Tools", "Stone Age buildings"],
  "Bronze Age":      ["Bronze Weapons", "Early Trade", "Irrigation Systems", "Markets"],
  "Iron Age":        ["Iron Tools & Weapons", "Road Networks", "Philosophy", "Iron Plow"],
  "Classical Age":   ["Aqueducts", "Senate Governance", "Naval Trade", "Classical Architecture"],
  "Medieval Age":    ["Feudal Castles", "Guild Economy", "Early Banking", "Longbow Warfare"],
  "Renaissance Age": ["Printing Press", "Gunpowder", "Universities", "Merchant Fleets"],
  "Industrial Age":  ["Steam Engines", "Rail Networks", "National Banks", "Coal Power"],
  "Modern Age":      ["Tank Warfare", "Air Forces", "Petroleum Economy", "Public Health"],
  "Digital Age":     ["Cyber Warfare", "AI Economy", "Satellite Grids", "Digital Finance"],
  "Information Age": ["Neural Networks", "Global Communications", "Advanced Biotech", "Quantum Computing"],
  "Space Age":       ["Space Stations", "Orbital Weapons", "Terraforming", "Interplanetary Trade"],
  "Galactic Age":    ["Warp Drives", "Dyson Spheres", "Galactic Diplomacy", "Universal Replicators"],
};

// Techs available per epoch
export const TECH_TREE = {
  "Stone Age": [
    { id: "flint_tools",    name: "Flint Tools",    cost: 15, desc: "Manufacturing +5, Food +10/tick",             effect: { manufacturing: 5 } },
    { id: "basic_shelter",  name: "Basic Shelter",  cost: 20, desc: "Housing Capacity +10, Stability +5",           effect: { housing_capacity: 10, stability: 5 } },
    { id: "tribal_hunting", name: "Tribal Hunting", cost: 15, desc: "Unit Power +5",                                effect: { unit_power: 5 } },
  ],
  "Bronze Age": [
    { id: "bronze_smelting", name: "Bronze Smelting",  cost: 35, desc: "Manufacturing +10, GDP +50",               effect: { manufacturing: 10, gdp: 50 } },
    { id: "irrigation",      name: "Irrigation",        cost: 40, desc: "GDP +80, Stability +5",                   effect: { gdp: 80, stability: 5 } },
    { id: "bronze_armor",    name: "Bronze Armor",      cost: 35, desc: "Defense +15, Unit Power +10",             effect: { defense_level: 15, unit_power: 10 } },
    { id: "writing",         name: "Writing System",    cost: 30, desc: "Tech Level +1, Public Trust +0.1",        effect: { tech_level: 1, public_trust: 0.1 } },
  ],
  "Iron Age": [
    { id: "iron_weapons",  name: "Iron Weapons",    cost: 60, desc: "Unit Power +20, Defense +10",                effect: { unit_power: 20, defense_level: 10 } },
    { id: "road_network",  name: "Road Network",    cost: 70, desc: "GDP +150, Stability +10",                    effect: { gdp: 150, stability: 10 } },
    { id: "philosophy",    name: "Philosophy",      cost: 55, desc: "Public Trust +0.15, Tech Level +1",          effect: { public_trust: 0.15, tech_level: 1 } },
    { id: "iron_plow",     name: "Iron Plow",       cost: 60, desc: "Manufacturing +15, GDP +80",                 effect: { manufacturing: 15, gdp: 80 } },
  ],
  "Classical Age": [
    { id: "aqueducts",     name: "Aqueducts",       cost: 80, desc: "Stability +12, GDP +120",                    effect: { stability: 12, gdp: 120 } },
    { id: "philosophy_ii", name: "Stoic Philosophy",cost: 75, desc: "Public Trust +0.2, Tech Level +1",           effect: { public_trust: 0.2, tech_level: 1 } },
    { id: "catapults",     name: "Catapults",        cost: 90, desc: "Unit Power +25, Defense +10",               effect: { unit_power: 25, defense_level: 10 } },
    { id: "trade_routes",  name: "Trade Routes",     cost: 85, desc: "GDP +200, Currency +500",                   effect: { gdp: 200, currency: 500 } },
  ],
  "Medieval Age": [
    { id: "castle_fortification", name: "Castle Fortification", cost: 100, desc: "Defense +25, Stability +10",    effect: { defense_level: 25, stability: 10 } },
    { id: "guild_system",         name: "Guild System",         cost: 110, desc: "Manufacturing +20, GDP +200",   effect: { manufacturing: 20, gdp: 200 } },
    { id: "longbow",              name: "Longbow Archers",      cost: 95,  desc: "Unit Power +20, Defense +10",   effect: { unit_power: 20, defense_level: 10 } },
    { id: "banking",              name: "Early Banking",        cost: 120, desc: "GDP +250, Currency +1000",      effect: { gdp: 250, currency: 1000 } },
  ],
  "Renaissance Age": [
    { id: "printing_press",  name: "Printing Press",    cost: 130, desc: "Public Trust +0.25, Stability +10",    effect: { public_trust: 0.25, stability: 10 } },
    { id: "gunpowder",       name: "Gunpowder Weapons", cost: 140, desc: "Unit Power +30, Defense +10",          effect: { unit_power: 30, defense_level: 10 } },
    { id: "universities",    name: "Universities",      cost: 150, desc: "Tech Level +1, GDP +300",              effect: { tech_level: 1, gdp: 300 } },
    { id: "merchant_fleet",  name: "Merchant Fleet",    cost: 160, desc: "GDP +400, Currency +2000",             effect: { gdp: 400, currency: 2000 } },
  ],
  "Industrial Age": [
    { id: "heavy_industry", name: "Heavy Industry",     cost: 250, desc: "Manufacturing +40, GDP +500",          effect: { manufacturing: 40, gdp: 500 } },
    { id: "rail_network",   name: "Rail Networks",      cost: 270, desc: "GDP +600, Stability +10",              effect: { gdp: 600, stability: 10 } },
    { id: "conscript_army", name: "Conscript Army",     cost: 240, desc: "Unit Power +45, Defense +25",          effect: { unit_power: 45, defense_level: 25 } },
    { id: "national_bank",  name: "National Bank",      cost: 280, desc: "Public Trust +0.25, Currency +4000",   effect: { public_trust: 0.25, currency: 4000 } },
    { id: "coal_power",     name: "Coal Power Grid",    cost: 300, desc: "GDP +700, Manufacturing +30",          effect: { gdp: 700, manufacturing: 30 } },
  ],
  "Modern Age": [
    { id: "tank_warfare",  name: "Tank Warfare",        cost: 350, desc: "Unit Power +60, Defense +30",          effect: { unit_power: 60, defense_level: 30 } },
    { id: "air_force",     name: "Air Force",           cost: 400, desc: "Unit Power +70, Defense +25",          effect: { unit_power: 70, defense_level: 25 } },
    { id: "oil_economy",   name: "Petroleum Economy",   cost: 380, desc: "GDP +800, Manufacturing +40",          effect: { gdp: 800, manufacturing: 40 } },
    { id: "public_health", name: "Public Health System",cost: 340, desc: "Stability +20, Public Trust +0.3",     effect: { stability: 20, public_trust: 0.3 } },
  ],
  "Digital Age": [
    { id: "cyberwarfare",    name: "Cyber Warfare",     cost: 550, desc: "Defense +60, Unit Power +50",          effect: { defense_level: 60, unit_power: 50 } },
    { id: "ai_economy",      name: "AI Economy",        cost: 600, desc: "GDP +1500, Public Trust +0.3",         effect: { gdp: 1500, public_trust: 0.3 } },
    { id: "satellite_grid",  name: "Satellite Grid",    cost: 570, desc: "Defense +70, Stability +15",           effect: { defense_level: 70, stability: 15 } },
    { id: "digital_finance", name: "Digital Finance",   cost: 580, desc: "Currency +8000, GDP +800",             effect: { currency: 8000, gdp: 800 } },
  ],
  "Information Age": [
    { id: "neural_networks", name: "Neural Networks",   cost: 700, desc: "Tech Level +2, GDP +2000",             effect: { tech_level: 2, gdp: 2000 } },
    { id: "quantum_compute", name: "Quantum Computing", cost: 750, desc: "Manufacturing +60, Public Trust +0.3", effect: { manufacturing: 60, public_trust: 0.3 } },
    { id: "advanced_biotech",name: "Advanced Biotech",  cost: 720, desc: "Stability +25, Unit Power +50",        effect: { stability: 25, unit_power: 50 } },
    { id: "global_comms",    name: "Global Communications",cost:680,desc: "Currency +10000, GDP +1500",          effect: { currency: 10000, gdp: 1500 } },
  ],
  "Space Age": [
    { id: "space_stations",  name: "Space Stations",    cost: 900, desc: "GDP +3000, Tech Level +2",             effect: { gdp: 3000, tech_level: 2 } },
    { id: "orbital_weapons", name: "Orbital Weapons",   cost: 950, desc: "Defense +120, Unit Power +100",        effect: { defense_level: 120, unit_power: 100 } },
    { id: "terraforming",    name: "Terraforming",      cost: 980, desc: "Stability +30, Manufacturing +80",     effect: { stability: 30, manufacturing: 80 } },
    { id: "interplanetary",  name: "Interplanetary Trade",cost:1000,desc: "Currency +20000, GDP +2500",          effect: { currency: 20000, gdp: 2500 } },
  ],
  "Galactic Age": [
    { id: "warp_drives",     name: "Warp Drives",       cost: 1200, desc: "Unit Power +180, Defense +100",       effect: { unit_power: 180, defense_level: 100 } },
    { id: "dyson_sphere",    name: "Dyson Sphere",      cost: 1400, desc: "GDP +6000, Manufacturing +150",       effect: { gdp: 6000, manufacturing: 150 } },
    { id: "galactic_diplo",  name: "Galactic Diplomacy",cost: 1100, desc: "Stability +35, Trust +0.5",           effect: { stability: 35, public_trust: 0.5 } },
    { id: "replicators",     name: "Universal Replicators",cost:1300,desc:"Manufacturing +200, Currency +30000", effect: { manufacturing: 200, currency: 30000 } },
    { id: "nano_army",       name: "Nano Army Swarms",  cost: 1500, desc: "Unit Power +250, Defense +150",       effect: { unit_power: 250, defense_level: 150 } },
  ],
};