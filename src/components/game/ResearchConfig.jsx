/**
 * Research Tree Configuration
 * 5 branches × 4-5 layers each
 * Layer 1-2: School unlocks | Layer 3-5: University unlocks
 */

export const RESEARCH_BRANCHES = {
  agriculture: { name: "Agriculture", emoji: "🌾", color: "#22c55e" },
  industry:    { name: "Industry",    emoji: "⚙️", color: "#f59e0b" },
  military:    { name: "Military",    emoji: "⚔️", color: "#ef4444" },
  governance:  { name: "Governance",  emoji: "🏛️",  color: "#8b5cf6" },
  frontier:    { name: "Frontier",    emoji: "🚀",  color: "#06b6d4" },
};

// building_req: "school" | "university"
// epoch_req: minimum epoch needed
// requires: array of tech_ids that must be completed first
// is_global_breakthrough: first nation to finish gets global bonus
export const RESEARCH_TREE = {
  agriculture: [
    // Layer 1 — School
    {
      id: "pottery_crafting",    layer: 1, name: "Pottery & Kiln Craft",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 60,           requires: [],
      desc: "Unlocks kiln-based crafting: bricks, ceramic tiles, roof tiles, mortar. Manufacturing +5",
      effects: { manufacturing: 5 },
      emoji: "🧱"
    },
    {
      id: "crop_rotation",       layer: 1, name: "Crop Rotation",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 80,           requires: [],
      desc: "Food production +15% per tick",
      effects: { food_prod_bonus: 0.15 },
      emoji: "🌱"
    },
    {
      id: "animal_husbandry",    layer: 1, name: "Animal Husbandry",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 80,           requires: [],
      desc: "Stability +4, Food +10% per tick",
      effects: { stability: 4, food_prod_bonus: 0.10 },
      emoji: "🐄"
    },
    // Layer 2 — School
    {
      id: "irrigation_systems",  layer: 2, name: "Irrigation Systems",
      building_req: "school",    epoch_req: "Bronze Age",
      base_points: 160,          requires: ["crop_rotation"],
      desc: "Food prod +25%, GDP +100",
      effects: { food_prod_bonus: 0.25, gdp: 100 },
      emoji: "💧"
    },
    {
      id: "selective_breeding",  layer: 2, name: "Selective Breeding",
      building_req: "school",    epoch_req: "Bronze Age",
      base_points: 150,          requires: ["animal_husbandry"],
      desc: "Population growth +10%, Stability +5",
      effects: { stability: 5, pop_growth_bonus: 0.10 },
      emoji: "🧬"
    },
    // Layer 3 — University
    {
      id: "food_preservation",   layer: 3, name: "Food Preservation & Canning",
      building_req: "university", epoch_req: "Industrial Age",
      base_points: 350,           requires: ["selective_breeding"],
      desc: "Unlocks canned food, rations, and tin-can production. Food stability +10%, GDP +150",
      effects: { food_prod_bonus: 0.10, gdp: 150, stability: 5 },
      emoji: "🥫"
    },
    {
      id: "mechanized_agriculture", layer: 3, name: "Mechanized Agriculture",
      building_req: "university", epoch_req: "Industrial Age",
      base_points: 400,           requires: ["irrigation_systems"],
      desc: "Food prod +50%, Manufacturing +20. Unlocks tractor & harvester.",
      effects: { food_prod_bonus: 0.50, manufacturing: 20 },
      emoji: "🚜"
    },
    // Layer 4 — University
    {
      id: "advanced_brewing",    layer: 4, name: "Advanced Brewing & Distilling",
      building_req: "university", epoch_req: "Modern Age",
      base_points: 600,           requires: ["food_preservation"],
      desc: "Unlocks wine, spirits, and premium beverages. GDP +300, Stability +5",
      effects: { gdp: 300, stability: 5 },
      emoji: "🍷"
    },
    {
      id: "precision_farming",   layer: 4, name: "Precision Farming",
      building_req: "university", epoch_req: "Digital Age",
      base_points: 800,           requires: ["mechanized_agriculture"],
      desc: "Food prod +80%, GDP +500. Unlocks soil sensors and crop monitoring drones.",
      effects: { food_prod_bonus: 0.80, gdp: 500 },
      emoji: "🛰️"
    },
    // Layer 5 — University (Breakthrough)
    {
      id: "vertical_farms",      layer: 5, name: "Vertical Mega-Farms",
      building_req: "university", epoch_req: "Space Age",
      base_points: 1800,          requires: ["precision_farming"],
      desc: "Eliminates food scarcity. GDP +2000, Stability +20",
      effects: { gdp: 2000, stability: 20, food_prod_bonus: 2.0 },
      emoji: "🌆",
      is_global_breakthrough: true
    },
  ],

  industry: [
    // Layer 1 — School
    {
      id: "basic_metallurgy",    layer: 1, name: "Basic Metallurgy",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 80,           requires: [],
      desc: "Unlocks forge smelting of iron & copper ingots. Manufacturing +8, Unit Power +5",
      effects: { manufacturing: 8, unit_power: 5 },
      emoji: "⚒️"
    },
    {
      id: "woodworking",         layer: 1, name: "Advanced Woodworking",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 70,           requires: [],
      desc: "Unlocks planks, beams, and wooden furniture at workbench. Wood production +20%, GDP +50",
      effects: { wood_prod_bonus: 0.20, gdp: 50 },
      emoji: "🪵"
    },
    {
      id: "rope_textiles",       layer: 1, name: "Rope & Basic Textiles",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 65,           requires: [],
      desc: "Unlocks cloth, rope, and leather at the loom/workbench. Stability +2, GDP +40",
      effects: { stability: 2, gdp: 40 },
      emoji: "🧶"
    },
    // Layer 2 — School
    {
      id: "metal_tools",         layer: 2, name: "Metal Tools",
      building_req: "school",    epoch_req: "Iron Age",
      base_points: 180,          requires: ["basic_metallurgy"],
      desc: "Unlocks workshop tools: wrench, drill, soldering iron. Manufacturing +20, GDP +150",
      effects: { manufacturing: 20, gdp: 150 },
      emoji: "🔧"
    },
    {
      id: "masonry",             layer: 2, name: "Advanced Masonry",
      building_req: "school",    epoch_req: "Bronze Age",
      base_points: 150,          requires: ["woodworking"],
      desc: "Unlocks stone blocks, columns, and reinforced concrete. Stone prod +25%, Stability +6",
      effects: { stone_prod_bonus: 0.25, stability: 6 },
      emoji: "🧱"
    },
    {
      id: "glass_making",        layer: 2, name: "Glass Making",
      building_req: "school",    epoch_req: "Bronze Age",
      base_points: 140,          requires: ["pottery_crafting"],
      desc: "Unlocks glass, tempered glass, and glass panels at the kiln. GDP +100, Manufacturing +10",
      effects: { gdp: 100, manufacturing: 10 },
      emoji: "🪟"
    },
    {
      id: "bronze_alloys",       layer: 2, name: "Bronze & Brass Alloys",
      building_req: "school",    epoch_req: "Bronze Age",
      base_points: 130,          requires: ["basic_metallurgy"],
      desc: "Unlocks bronze and brass smelting at the forge. GDP +80, Manufacturing +12",
      effects: { gdp: 80, manufacturing: 12 },
      emoji: "🟠"
    },
    // Layer 3 — University
    {
      id: "industrial_foundations", layer: 3, name: "Industrial Foundations",
      building_req: "university",   epoch_req: "Industrial Age",
      base_points: 450,             requires: ["metal_tools"],
      desc: "Unlocks factory construction. Manufacturing +40, GDP +400",
      effects: { manufacturing: 40, gdp: 400 },
      emoji: "🏗️"
    },
    {
      id: "chemical_synthesis",  layer: 3, name: "Chemical Synthesis",
      building_req: "university", epoch_req: "Industrial Age",
      base_points: 420,           requires: ["glass_making"],
      desc: "Unlocks chemical plant: acids, plastics, rubber, explosives, and synthetic materials. Manufacturing +25",
      effects: { manufacturing: 25, gdp: 200 },
      emoji: "🧪"
    },
    {
      id: "steel_production",    layer: 3, name: "Steel Production",
      building_req: "university", epoch_req: "Industrial Age",
      base_points: 380,           requires: ["bronze_alloys"],
      desc: "Unlocks steel, steel beams, and rebar at the forge/factory. Manufacturing +30, Unit Power +15",
      effects: { manufacturing: 30, unit_power: 15 },
      emoji: "🔩"
    },
    // Layer 4 — University
    {
      id: "electronics_manufacturing", layer: 4, name: "Electronics Manufacturing",
      building_req: "university", epoch_req: "Modern Age",
      base_points: 750,           requires: ["chemical_synthesis"],
      desc: "Unlocks electronics lab: circuit boards, processors, batteries, sensors. Manufacturing +40, TP +20",
      effects: { manufacturing: 40, tpBonus: 20, gdp: 400 },
      emoji: "💻"
    },
    {
      id: "automation",          layer: 4, name: "Automation Systems",
      building_req: "university", epoch_req: "Modern Age",
      base_points: 900,           requires: ["industrial_foundations"],
      desc: "Unlocks advanced factory components: motors, conveyors, CNC machines. Manufacturing +80, GDP +800",
      effects: { manufacturing: 80, gdp: 800 },
      emoji: "🤖"
    },
    {
      id: "vehicle_engineering", layer: 4, name: "Vehicle Engineering",
      building_req: "university", epoch_req: "Modern Age",
      base_points: 700,           requires: ["steel_production"],
      desc: "Unlocks vehicle plant: cars, trucks, buses, tanks. Manufacturing +50, GDP +500",
      effects: { manufacturing: 50, gdp: 500 },
      emoji: "🚗"
    },
    // Layer 5 — University (Breakthrough)
    {
      id: "advanced_materials",  layer: 5, name: "Advanced Materials Science",
      building_req: "university", epoch_req: "Digital Age",
      base_points: 1400,          requires: ["electronics_manufacturing"],
      desc: "Unlocks titanium alloys, carbon fiber, graphene. Enables advanced factory. Manufacturing +60, GDP +1500",
      effects: { manufacturing: 60, gdp: 1500 },
      emoji: "⚗️",
      is_global_breakthrough: true
    },
    {
      id: "global_logistics",    layer: 5, name: "Global Logistics Network",
      building_req: "university", epoch_req: "Digital Age",
      base_points: 1600,          requires: ["automation"],
      desc: "GDP +3000, Trade balance +500/tick, Manufacturing +100",
      effects: { gdp: 3000, manufacturing: 100 },
      emoji: "🌐",
      is_global_breakthrough: true
    },
  ],

  military: [
    // Layer 1 — School
    {
      id: "tactics_training",    layer: 1, name: "Tactics & Training",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 90,           requires: [],
      desc: "Unit Power +10, Defense +5. Unlocks spears and bows at workbench.",
      effects: { unit_power: 10, defense_level: 5 },
      emoji: "🪖"
    },
    {
      id: "fortification_basics",layer: 1, name: "Fortification Basics",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 85,           requires: [],
      desc: "Defense +12, Stability +3. Unlocks stone walls and watchtowers.",
      effects: { defense_level: 12, stability: 3 },
      emoji: "🧱"
    },
    // Layer 2 — School
    {
      id: "iron_weapons",        layer: 2, name: "Iron Weapons Smithing",
      building_req: "school",    epoch_req: "Iron Age",
      base_points: 170,          requires: ["tactics_training"],
      desc: "Unlocks swords, shields, iron armor at the forge. Unit Power +15, Defense +10",
      effects: { unit_power: 15, defense_level: 10 },
      emoji: "⚔️"
    },
    {
      id: "siege_tactics",       layer: 2, name: "Siege Tactics",
      building_req: "school",    epoch_req: "Classical Age",
      base_points: 200,          requires: ["iron_weapons"],
      desc: "Unlocks crossbows, siege engines, and catapults. Unit Power +20, Defense +15",
      effects: { unit_power: 20, defense_level: 15 },
      emoji: "🏹"
    },
    {
      id: "naval_warfare",       layer: 2, name: "Naval Warfare",
      building_req: "school",    epoch_req: "Medieval Age",
      base_points: 220,          requires: ["fortification_basics"],
      desc: "Unlocks shipyard, warships, fishing boats. Unit Power +18, GDP +200",
      effects: { unit_power: 18, gdp: 200 },
      emoji: "⚓"
    },
    // Layer 3 — University
    {
      id: "gunpowder_weapons",   layer: 3, name: "Gunpowder & Firearms",
      building_req: "university", epoch_req: "Renaissance Age",
      base_points: 380,           requires: ["siege_tactics"],
      desc: "Unlocks muskets, flintlock pistols, and cannons at the workshop. Unit Power +25, Defense +20",
      effects: { unit_power: 25, defense_level: 20 },
      emoji: "💥"
    },
    {
      id: "ballistics",          layer: 3, name: "Advanced Ballistics",
      building_req: "university", epoch_req: "Industrial Age",
      base_points: 500,           requires: ["gunpowder_weapons"],
      desc: "Unlocks weapons factory: rifles, machine guns, artillery shells. Unit Power +40, Defense +30",
      effects: { unit_power: 40, defense_level: 30 },
      emoji: "💣"
    },
    {
      id: "armor_plating",       layer: 3, name: "Armor & Body Protection",
      building_req: "university", epoch_req: "Industrial Age",
      base_points: 420,           requires: ["iron_weapons"],
      desc: "Unlocks helmets, body armor, and ballistic vests. Defense +25, Unit Power +15",
      effects: { defense_level: 25, unit_power: 15 },
      emoji: "🛡️"
    },
    // Layer 4 — University
    {
      id: "rocketry",            layer: 4, name: "Rocketry & Missiles",
      building_req: "university", epoch_req: "Modern Age",
      base_points: 900,           requires: ["ballistics"],
      desc: "Unlocks rocket launchers, missiles, and guided systems. Unit Power +50, Defense +35",
      effects: { unit_power: 50, defense_level: 35 },
      emoji: "🚀"
    },
    {
      id: "nuclear_energy",      layer: 4, name: "Nuclear Energy",
      building_req: "university", epoch_req: "Modern Age",
      base_points: 1200,          requires: ["rocketry"],
      desc: "Unlocks nuclear reactor, uranium enrichment, and nuclear missiles. GDP +2000, Unit Power +80, Defense +60",
      effects: { gdp: 2000, unit_power: 80, defense_level: 60 },
      emoji: "☢️",
      is_global_breakthrough: true
    },
    {
      id: "drone_warfare",       layer: 4, name: "Drone & Electronic Warfare",
      building_req: "university", epoch_req: "Digital Age",
      base_points: 1000,          requires: ["rocketry"],
      desc: "Unlocks combat drones, drone swarms, radar jammers, and EMP devices. Unit Power +60, Defense +40",
      effects: { unit_power: 60, defense_level: 40 },
      emoji: "🤖"
    },
    // Layer 5 — University (Breakthrough)
    {
      id: "orbital_defense",     layer: 5, name: "Orbital Defense Grid",
      building_req: "university", epoch_req: "Space Age",
      base_points: 2000,          requires: ["nuclear_energy"],
      desc: "Unlocks satellites, space foundry military use, and orbital weapons. Defense +200, Unit Power +150.",
      effects: { defense_level: 200, unit_power: 150 },
      emoji: "🛡️",
      is_global_breakthrough: true
    },
  ],

  governance: [
    // Layer 1 — School
    {
      id: "civic_education",     layer: 1, name: "Civic Education",
      building_req: "school",    epoch_req: "Stone Age",
      base_points: 75,           requires: [],
      desc: "Public Trust +0.1, Stability +5",
      effects: { public_trust: 0.1, stability: 5 },
      emoji: "📚"
    },
    {
      id: "written_law",         layer: 1, name: "Written Law",
      building_req: "school",    epoch_req: "Bronze Age",
      base_points: 90,           requires: [],
      desc: "Stability +8, Public Trust +0.08",
      effects: { stability: 8, public_trust: 0.08 },
      emoji: "⚖️"
    },
    // Layer 2 — School
    {
      id: "representative_govt", layer: 2, name: "Representative Gov't",
      building_req: "school",    epoch_req: "Classical Age",
      base_points: 200,          requires: ["civic_education", "written_law"],
      desc: "Stability +12, GDP +200, Trust +0.15",
      effects: { stability: 12, gdp: 200, public_trust: 0.15 },
      emoji: "🗳️"
    },
    // Layer 3 — University
    {
      id: "global_banking_sys",  layer: 3, name: "Global Banking System",
      building_req: "university", epoch_req: "Modern Age",
      base_points: 800,           requires: ["representative_govt"],
      desc: "GDP +1500, Currency +5000, Trade Balance +300",
      effects: { gdp: 1500, currency: 5000 },
      emoji: "🏦",
      is_global_breakthrough: true
    },
    // Layer 4 — University
    {
      id: "digital_democracy",   layer: 4, name: "Digital Democracy",
      building_req: "university", epoch_req: "Digital Age",
      base_points: 1100,          requires: ["global_banking_sys"],
      desc: "Stability +20, GDP +1000, Trust +0.3",
      effects: { stability: 20, gdp: 1000, public_trust: 0.3 },
      emoji: "💻"
    },
    // Layer 5 — University (Breakthrough)
    {
      id: "ai_governance",       layer: 5, name: "AI Governance",
      building_req: "university", epoch_req: "Information Age",
      base_points: 2200,          requires: ["digital_democracy"],
      desc: "Stability +35, Trust +0.5, GDP +3000. AI manages bureaucracy.",
      effects: { stability: 35, public_trust: 0.5, gdp: 3000 },
      emoji: "🧠",
      is_global_breakthrough: true
    },
  ],

  frontier: [
    // Layer 1 — School
    {
      id: "cartography",         layer: 1, name: "Cartography",
      building_req: "school",    epoch_req: "Bronze Age",
      base_points: 100,          requires: [],
      desc: "Unlocks maps, compass, and navigation tools. GDP +80, Stability +3, Tech Level +1",
      effects: { gdp: 80, stability: 3, tech_level: 1 },
      emoji: "🗺️"
    },
    {
      id: "optics",              layer: 1, name: "Optics & Lens Craft",
      building_req: "school",    epoch_req: "Renaissance Age",
      base_points: 120,          requires: ["cartography"],
      desc: "Unlocks optical glass, lenses, telescopes, and microscopes. GDP +100, TP +8",
      effects: { gdp: 100, tpBonus: 8 },
      emoji: "🔍"
    },
    // Layer 2 — School
    {
      id: "astronomy",           layer: 2, name: "Astronomy",
      building_req: "school",    epoch_req: "Renaissance Age",
      base_points: 200,          requires: ["optics"],
      desc: "Unlocks telescopes and navigation systems. Tech Level +1, GDP +150, Public Trust +0.1",
      effects: { tech_level: 1, gdp: 150, public_trust: 0.1 },
      emoji: "🔭"
    },
    {
      id: "medicine_science",    layer: 2, name: "Medical Science",
      building_req: "school",    epoch_req: "Classical Age",
      base_points: 180,          requires: [],
      desc: "Unlocks laboratory construction. Produces medicines, vaccines, surgical kits. Stability +6, Trust +0.08",
      effects: { stability: 6, public_trust: 0.08 },
      emoji: "💊"
    },
    // Layer 3 — University
    {
      id: "advanced_medicine",   layer: 3, name: "Advanced Medicine",
      building_req: "university", epoch_req: "Industrial Age",
      base_points: 500,           requires: ["medicine_science"],
      desc: "Unlocks X-ray machines, defibrillators, blood bags, and prosthetics. Stability +8, Trust +0.1",
      effects: { stability: 8, public_trust: 0.1 },
      emoji: "🏥"
    },
    {
      id: "semiconductor_tech",  layer: 3, name: "Semiconductor Technology",
      building_req: "university", epoch_req: "Modern Age",
      base_points: 700,           requires: ["astronomy"],
      desc: "Unlocks silicon processing, circuit boards, and memory chips. Manufacturing +35, TP +20",
      effects: { manufacturing: 35, tpBonus: 20, gdp: 400 },
      emoji: "💾"
    },
    {
      id: "quantum_computing",   layer: 3, name: "Quantum Computing",
      building_req: "university", epoch_req: "Information Age",
      base_points: 1000,          requires: ["semiconductor_tech"],
      desc: "Unlocks quantum computers, AI chips, and quantum bits. Manufacturing +60, GDP +2000, Tech Level +2",
      effects: { manufacturing: 60, gdp: 2000, tech_level: 2 },
      emoji: "⚛️",
      is_global_breakthrough: true
    },
    // Layer 4 — University
    {
      id: "biotech",             layer: 4, name: "Biotechnology",
      building_req: "university", epoch_req: "Digital Age",
      base_points: 1200,          requires: ["advanced_medicine"],
      desc: "Unlocks gene therapy, biosuit, and advanced medical implants. GDP +800, Trust +0.2, Stability +10",
      effects: { gdp: 800, public_trust: 0.2, stability: 10 },
      emoji: "🧬",
      is_global_breakthrough: true
    },
    // Layer 4 — University
    {
      id: "asteroid_mining",     layer: 4, name: "Asteroid Mining",
      building_req: "university", epoch_req: "Space Age",
      base_points: 1800,          requires: ["quantum_computing"],
      desc: "GDP +4000, Manufacturing +120, Currency +10000",
      effects: { gdp: 4000, manufacturing: 120, currency: 10000 },
      emoji: "⛏️",
      is_global_breakthrough: true
    },
    // Layer 5 — University (Breakthrough)
    {
      id: "space_infrastructure", layer: 5, name: "Space Infrastructure",
      building_req: "university", epoch_req: "Space Age",
      base_points: 2500,           requires: ["asteroid_mining"],
      desc: "GDP +6000, Defense +100, Manufacturing +200. The final frontier.",
      effects: { gdp: 6000, defense_level: 100, manufacturing: 200 },
      emoji: "🌌",
      is_global_breakthrough: true
    },
  ],
};

// Flat lookup by id
export const RESEARCH_MAP = {};
Object.values(RESEARCH_TREE).forEach(branch => {
  branch.forEach(tech => { RESEARCH_MAP[tech.id] = tech; });
});

// All global breakthroughs for easy access
export const GLOBAL_BREAKTHROUGHS = Object.values(RESEARCH_MAP).filter(t => t.is_global_breakthrough);

// Research speed (points per tick) based on buildings and funding
export function calcResearchSpeed(nation, buildings) {
  const schoolCount = buildings.filter(b => b.building_type === "school" && !b.is_destroyed).length;
  const uniCount = buildings.filter(b => b.building_type === "university" && !b.is_destroyed).length;

  let speed = 5; // base
  speed += schoolCount * 8;
  speed += uniCount * 25;

  // Government funding (education_spending 0-100)
  const eduFunding = (nation.education_spending || 20) / 100;
  speed *= (0.5 + eduFunding * 1.5); // 0.5x to 2.0x

  // GDP corporate investment bonus
  const gdpBonus = Math.min(2.0, 1 + (nation.gdp || 0) / 10000);
  speed *= gdpBonus;

  // Stability bonus
  const stabBonus = Math.min(1.3, 1 + ((nation.stability || 75) - 75) / 200);
  speed *= stabBonus;

  return Math.max(1, Math.round(speed));
}