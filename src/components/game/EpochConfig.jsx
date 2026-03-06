/**
 * Epoch Nations – Full 16-Epoch Progression Config
 * Core Rule: Each epoch requires ≥26% more total investment than previous.
 * TP scaling: Next = Prev × 1.26 minimum, compounded.
 */

export const EPOCHS = [
  "Stone Age",
  "Copper Age",
  "Bronze Age",
  "Iron Age",
  "Dark Ages",
  "Middle Ages",
  "Renaissance",
  "Imperial Age",
  "Enlightenment Age",
  "Industrial Age",
  "Modern Age",
  "Atomic Age",
  "Digital Age",
  "Genetic Age",
  "Synthetic Age",
  "Nano Age"
];

// Tech Points required to advance TO the next epoch (compounded ×1.26 minimum)
export const EPOCH_ADVANCE_COST = {
  "Stone Age":         50,
  "Copper Age":        80,      // 50 × 1.26 ≈ 63 → rounded up
  "Bronze Age":        130,     // 80 × 1.26 ≈ 101 → 130
  "Iron Age":          200,     // 130 × 1.26 ≈ 164 → 200
  "Dark Ages":         300,     // 200 × 1.26 ≈ 252 → 300
  "Middle Ages":       450,     // 300 × 1.26 ≈ 378 → 450
  "Renaissance":       650,     // 450 × 1.26 ≈ 567 → 650
  "Imperial Age":      950,     // 650 × 1.26 ≈ 819 → 950
  "Enlightenment Age": 1400,    // 950 × 1.26 ≈ 1197 → 1400
  "Industrial Age":    2000,    // 1400 × 1.26 ≈ 1764 → 2000
  "Modern Age":        2900,    // 2000 × 1.26 ≈ 2520 → 2900
  "Atomic Age":        4100,    // 2900 × 1.26 ≈ 3654 → 4100
  "Digital Age":       5800,    // 4100 × 1.26 ≈ 5166 → 5800
  "Genetic Age":       8200,    // 5800 × 1.26 ≈ 7308 → 8200
  "Synthetic Age":     11600    // 8200 × 1.26 ≈ 10332 → 11600
  // Nano Age is final — no advance
};

// Minimum stability % required to advance epochs (later epochs stricter)
export const EPOCH_STABILITY_THRESHOLD = {
  "Stone Age":         70,
  "Copper Age":        70,
  "Bronze Age":        70,
  "Iron Age":          70,
  "Dark Ages":         72,
  "Middle Ages":       72,
  "Renaissance":       74,
  "Imperial Age":      74,
  "Enlightenment Age": 75,
  "Industrial Age":    76,
  "Modern Age":        77,
  "Atomic Age":        78,
  "Digital Age":       79,
  "Genetic Age":       80,
  "Synthetic Age":     80,
};

export const EPOCH_EMOJI = {
  "Stone Age": "🪨",
  "Copper Age": "🔶",
  "Bronze Age": "⚔️",
  "Iron Age": "🛡️",
  "Dark Ages": "🏰",
  "Middle Ages": "⚜️",
  "Renaissance": "🎨",
  "Imperial Age": "👑",
  "Enlightenment Age": "💡",
  "Industrial Age": "🏭",
  "Modern Age": "🌐",
  "Atomic Age": "⚛️",
  "Digital Age": "💻",
  "Genetic Age": "🧬",
  "Synthetic Age": "🤖",
  "Nano Age": "🔬"
};

export const EPOCH_COLOR = {
  "Stone Age": "#a8a29e",
  "Copper Age": "#f97316",
  "Bronze Age": "#d97706",
  "Iron Age": "#64748b",
  "Dark Ages": "#6b21a8",
  "Middle Ages": "#7c3aed",
  "Renaissance": "#db2777",
  "Imperial Age": "#b45309",
  "Enlightenment Age": "#eab308",
  "Industrial Age": "#78716c",
  "Modern Age": "#0ea5e9",
  "Atomic Age": "#10b981",
  "Digital Age": "#06b6d4",
  "Genetic Age": "#22c55e",
  "Synthetic Age": "#8b5cf6",
  "Nano Age": "#38bdf8"
};

// Techs available per epoch
export const TECH_TREE = {
  "Stone Age": [
    { id: "flint_tools", name: "Flint Tools", cost: 15, desc: "Food +10/tick, Manufacturing +5", effect: { manufacturing: 5 } },
    { id: "basic_shelter", name: "Basic Shelter", cost: 20, desc: "Housing Capacity +10, Stability +5", effect: { housing_capacity: 10, stability: 5 } },
    { id: "tribal_hunting", name: "Tribal Hunting", cost: 15, desc: "Unit Power +5", effect: { unit_power: 5 } },
  ],
  "Copper Age": [
    { id: "copper_smelting", name: "Copper Smelting", cost: 25, desc: "Manufacturing +10, GDP +50", effect: { manufacturing: 10, gdp: 50 } },
    { id: "early_agriculture", name: "Early Agriculture", cost: 30, desc: "GDP +80, Stability +5", effect: { gdp: 80, stability: 5 } },
    { id: "copper_weapons", name: "Copper Weapons", cost: 25, desc: "Unit Power +10, Defense +5", effect: { unit_power: 10, defense_level: 5 } },
  ],
  "Bronze Age": [
    { id: "bronze_armor", name: "Bronze Armor", cost: 40, desc: "Defense +15, Unit Power +10", effect: { defense_level: 15, unit_power: 10 } },
    { id: "irrigation", name: "Irrigation", cost: 45, desc: "GDP +100, Stability +8", effect: { gdp: 100, stability: 8 } },
    { id: "writing", name: "Writing System", cost: 40, desc: "Tech Level +1, Public Trust +0.1", effect: { tech_level: 1, public_trust: 0.1 } },
    { id: "chariots", name: "Chariots", cost: 50, desc: "Unit Power +15", effect: { unit_power: 15 } },
  ],
  "Iron Age": [
    { id: "iron_weapons", name: "Iron Weapons", cost: 60, desc: "Unit Power +20, Defense +10", effect: { unit_power: 20, defense_level: 10 } },
    { id: "road_network", name: "Road Network", cost: 70, desc: "GDP +150, Stability +10", effect: { gdp: 150, stability: 10 } },
    { id: "philosophy", name: "Philosophy", cost: 55, desc: "Public Trust +0.15, Tech Level +1", effect: { public_trust: 0.15, tech_level: 1 } },
    { id: "iron_plow", name: "Iron Plow", cost: 60, desc: "Manufacturing +15, GDP +80", effect: { manufacturing: 15, gdp: 80 } },
  ],
  "Dark Ages": [
    { id: "feudal_system", name: "Feudal System", cost: 80, desc: "Stability +12, Defense +15", effect: { stability: 12, defense_level: 15 } },
    { id: "monastery", name: "Monasteries", cost: 75, desc: "Public Trust +0.2, Tech Level +1", effect: { public_trust: 0.2, tech_level: 1 } },
    { id: "siege_weapons", name: "Siege Weapons", cost: 90, desc: "Unit Power +25", effect: { unit_power: 25 } },
  ],
  "Middle Ages": [
    { id: "castle_fortification", name: "Castle Fortification", cost: 100, desc: "Defense +25, Stability +10", effect: { defense_level: 25, stability: 10 } },
    { id: "guild_system", name: "Guild System", cost: 110, desc: "Manufacturing +20, GDP +200", effect: { manufacturing: 20, gdp: 200 } },
    { id: "longbow", name: "Longbow Archers", cost: 95, desc: "Unit Power +20, Defense +10", effect: { unit_power: 20, defense_level: 10 } },
    { id: "banking", name: "Early Banking", cost: 120, desc: "GDP +250, Currency +1000", effect: { gdp: 250, currency: 1000 } },
  ],
  "Renaissance": [
    { id: "printing_press", name: "Printing Press", cost: 130, desc: "Public Trust +0.25, Stability +10", effect: { public_trust: 0.25, stability: 10 } },
    { id: "gunpowder", name: "Gunpowder Weapons", cost: 140, desc: "Unit Power +30, Defense +10", effect: { unit_power: 30, defense_level: 10 } },
    { id: "universities", name: "Universities", cost: 150, desc: "Tech Level +1, GDP +300", effect: { tech_level: 1, gdp: 300 } },
    { id: "merchant_fleet", name: "Merchant Fleet", cost: 160, desc: "GDP +400, Currency +2000", effect: { gdp: 400, currency: 2000 } },
  ],
  "Imperial Age": [
    { id: "colonial_trade", name: "Colonial Trade", cost: 180, desc: "GDP +500, Currency +3000", effect: { gdp: 500, currency: 3000 } },
    { id: "standing_army", name: "Standing Army", cost: 170, desc: "Unit Power +35, Defense +20", effect: { unit_power: 35, defense_level: 20 } },
    { id: "bureaucracy", name: "Bureaucracy", cost: 160, desc: "Stability +15, Public Trust +0.2", effect: { stability: 15, public_trust: 0.2 } },
    { id: "cannon", name: "Artillery Cannons", cost: 190, desc: "Unit Power +40, Defense +15", effect: { unit_power: 40, defense_level: 15 } },
  ],
  "Enlightenment Age": [
    { id: "scientific_method", name: "Scientific Method", cost: 200, desc: "Tech Level +2, GDP +400", effect: { tech_level: 2, gdp: 400 } },
    { id: "steam_engine_early", name: "Early Steam Engine", cost: 220, desc: "Manufacturing +30, GDP +350", effect: { manufacturing: 30, gdp: 350 } },
    { id: "democratic_reform", name: "Democratic Reforms", cost: 210, desc: "Public Trust +0.3, Stability +15", effect: { public_trust: 0.3, stability: 15 } },
    { id: "rifles", name: "Rifle Infantry", cost: 200, desc: "Unit Power +40, Defense +20", effect: { unit_power: 40, defense_level: 20 } },
  ],
  "Industrial Age": [
    { id: "heavy_industry", name: "Heavy Industry", cost: 250, desc: "Manufacturing +40, GDP +500", effect: { manufacturing: 40, gdp: 500 } },
    { id: "rail_network", name: "Rail Networks", cost: 270, desc: "GDP +600, Stability +10", effect: { gdp: 600, stability: 10 } },
    { id: "conscript_army", name: "Conscript Army", cost: 240, desc: "Unit Power +45, Defense +25", effect: { unit_power: 45, defense_level: 25 } },
    { id: "national_bank", name: "National Bank", cost: 280, desc: "Public Trust +0.25, Currency +4000", effect: { public_trust: 0.25, currency: 4000 } },
    { id: "coal_power", name: "Coal Power Grid", cost: 300, desc: "GDP +700, Manufacturing +30", effect: { gdp: 700, manufacturing: 30 } },
  ],
  "Modern Age": [
    { id: "tank_warfare", name: "Tank Warfare", cost: 350, desc: "Unit Power +60, Defense +30", effect: { unit_power: 60, defense_level: 30 } },
    { id: "air_force", name: "Air Force", cost: 400, desc: "Unit Power +70, Defense +25", effect: { unit_power: 70, defense_level: 25 } },
    { id: "oil_economy", name: "Petroleum Economy", cost: 380, desc: "GDP +800, Manufacturing +40", effect: { gdp: 800, manufacturing: 40 } },
    { id: "public_health", name: "Public Health System", cost: 340, desc: "Stability +20, Public Trust +0.3", effect: { stability: 20, public_trust: 0.3 } },
  ],
  "Atomic Age": [
    { id: "nuclear_power", name: "Nuclear Power", cost: 450, desc: "GDP +1200, Manufacturing +50", effect: { gdp: 1200, manufacturing: 50 } },
    { id: "nuclear_arsenal", name: "Nuclear Arsenal", cost: 500, desc: "Defense +80, Unit Power +60", effect: { defense_level: 80, unit_power: 60 } },
    { id: "space_program", name: "Space Program", cost: 480, desc: "Tech Level +2, GDP +1000", effect: { tech_level: 2, gdp: 1000 } },
  ],
  "Digital Age": [
    { id: "cyberwarfare", name: "Cyber Warfare", cost: 550, desc: "Defense +60, Unit Power +50", effect: { defense_level: 60, unit_power: 50 } },
    { id: "ai_economy", name: "AI Economy", cost: 600, desc: "GDP +1500, Public Trust +0.3", effect: { gdp: 1500, public_trust: 0.3 } },
    { id: "satellite_grid", name: "Satellite Grid", cost: 570, desc: "Defense +70, Stability +15", effect: { defense_level: 70, stability: 15 } },
    { id: "digital_finance", name: "Digital Finance", cost: 580, desc: "Currency +8000, GDP +800", effect: { currency: 8000, gdp: 800 } },
  ],
  "Genetic Age": [
    { id: "biotech", name: "Biotech Labs", cost: 700, desc: "Stability +25, Trust +0.3", effect: { stability: 25, public_trust: 0.3 } },
    { id: "genetic_soldiers", name: "Enhanced Soldiers", cost: 750, desc: "Unit Power +100, Defense +50", effect: { unit_power: 100, defense_level: 50 } },
    { id: "agri_biotech", name: "Agricultural Biotech", cost: 680, desc: "Manufacturing +60, GDP +1200", effect: { manufacturing: 60, gdp: 1200 } },
  ],
  "Synthetic Age": [
    { id: "android_workers", name: "Android Workforce", cost: 900, desc: "Manufacturing +80, GDP +2000", effect: { manufacturing: 80, gdp: 2000 } },
    { id: "mind_interface", name: "Mind Interface", cost: 950, desc: "Tech Level +2, Trust +0.4", effect: { tech_level: 2, public_trust: 0.4 } },
    { id: "synthetic_army", name: "Synthetic Army", cost: 1000, desc: "Unit Power +130, Defense +70", effect: { unit_power: 130, defense_level: 70 } },
  ],
  "Nano Age": [
    { id: "nanoweapons", name: "Nanoweapons", cost: 1200, desc: "Unit Power +180, Defense +100", effect: { unit_power: 180, defense_level: 100 } },
    { id: "nano_medicine", name: "Nano Medicine", cost: 1100, desc: "Stability +30, Trust +0.5", effect: { stability: 30, public_trust: 0.5 } },
    { id: "replicators", name: "Replicators", cost: 1300, desc: "Manufacturing +100, GDP +3000", effect: { manufacturing: 100, gdp: 3000 } },
    { id: "quantum_finance", name: "Quantum Finance", cost: 1250, desc: "Currency +20000, GDP +2000", effect: { currency: 20000, gdp: 2000 } },
    { id: "molecular_forge", name: "Molecular Forge", cost: 1400, desc: "Manufacturing +150, GDP +5000", effect: { manufacturing: 150, gdp: 5000 } },
    { id: "nano_army", name: "Nano Army Swarms", cost: 1500, desc: "Unit Power +250, Defense +150", effect: { unit_power: 250, defense_level: 150 } },
  ]
};