/**
 * ItemDatabase — Universal item registry for Epoch Nations
 * 2,600+ items organized by category, tier, and crafting chain
 */
import { ALL_ITEMS_EXTRA } from "./ItemDatabaseExtra";

export const RARITIES = {
  common:    { label: "Common",    color: "#9ca3af", glow: "rgba(156,163,175,0.3)" },
  uncommon:  { label: "Uncommon",  color: "#4ade80", glow: "rgba(74,222,128,0.3)" },
  rare:      { label: "Rare",      color: "#60a5fa", glow: "rgba(96,165,250,0.3)" },
  epic:      { label: "Epic",      color: "#a78bfa", glow: "rgba(167,139,250,0.3)" },
  legendary: { label: "Legendary", color: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
};

export const TIERS = {
  1: { label: "Primitive",   color: "#9ca3af", epoch: "Stone Age" },
  2: { label: "Industrial",  color: "#fb923c", epoch: "Industrial Age" },
  3: { label: "Modern",      color: "#34d399", epoch: "Modern Age" },
  4: { label: "Advanced",    color: "#60a5fa", epoch: "Digital Age" },
  5: { label: "Futuristic",  color: "#a78bfa", epoch: "Space Age" },
};

export const CATEGORIES = [
  { id: "raw_resources",     label: "Raw Resources",      emoji: "⛏️",  color: "#92400e" },
  { id: "refined_materials", label: "Refined Materials",  emoji: "🔩",  color: "#6b7280" },
  { id: "tools",             label: "Tools",              emoji: "🔧",  color: "#d97706" },
  { id: "construction",      label: "Construction Items", emoji: "🏗️",  color: "#2563eb" },
  { id: "household",         label: "Household Items",    emoji: "🏠",  color: "#7c3aed" },
  { id: "furniture",         label: "Furniture",          emoji: "🪑",  color: "#9a3412" },
  { id: "industrial",        label: "Industrial Items",   emoji: "⚙️",  color: "#374151" },
  { id: "vehicles",          label: "Vehicles",           emoji: "🚗",  color: "#1d4ed8" },
  { id: "military",          label: "Military Equipment", emoji: "⚔️",  color: "#dc2626" },
  { id: "electronics",       label: "Electronics",        emoji: "💻",  color: "#0891b2" },
  { id: "medical",           label: "Medical Items",      emoji: "🏥",  color: "#059669" },
  { id: "agriculture",       label: "Agriculture",        emoji: "🌾",  color: "#65a30d" },
  { id: "food",              label: "Food & Beverages",   emoji: "🍞",  color: "#b45309" },
  { id: "energy",            label: "Energy & Fuel",      emoji: "⚡",  color: "#eab308" },
  { id: "infrastructure",    label: "Infrastructure",     emoji: "🏛️",  color: "#4338ca" },
  { id: "chemicals",         label: "Chemicals",          emoji: "🧪",  color: "#6d28d9" },
  { id: "textiles",          label: "Textiles",           emoji: "🧵",  color: "#db2777" },
  { id: "misc",              label: "Miscellaneous",      emoji: "📦",  color: "#64748b" },
];

export const CRAFTING_STATIONS = {
  hand:             { label: "By Hand",           emoji: "✋", tier: 1 },
  workbench:        { label: "Workbench",          emoji: "🪵", tier: 1 },
  forge:            { label: "Forge / Smelter",    emoji: "🔥", tier: 1 },
  kiln:             { label: "Kiln",               emoji: "🧱", tier: 1 },
  kitchen:          { label: "Kitchen",            emoji: "🍳", tier: 1 },
  sawmill:          { label: "Sawmill",            emoji: "🪚", tier: 2 },
  workshop:         { label: "Workshop",           emoji: "🔨", tier: 2 },
  loom:             { label: "Loom",               emoji: "🧵", tier: 2 },
  laboratory:       { label: "Laboratory",         emoji: "🔬", tier: 2 },
  factory:          { label: "Factory",            emoji: "🏭", tier: 3 },
  chemical_plant:   { label: "Chemical Plant",     emoji: "🧪", tier: 3 },
  electronics_lab:  { label: "Electronics Lab",    emoji: "💻", tier: 3 },
  vehicle_plant:    { label: "Vehicle Plant",      emoji: "🚗", tier: 3 },
  shipyard:         { label: "Shipyard",           emoji: "⚓", tier: 3 },
  weapons_factory:  { label: "Weapons Factory",    emoji: "⚔️", tier: 3 },
  research_lab:     { label: "Research Lab",       emoji: "🚀", tier: 4 },
  advanced_factory: { label: "Advanced Factory",   emoji: "🤖", tier: 4 },
  space_foundry:    { label: "Space Foundry",      emoji: "🌌", tier: 5 },
};

// ─────────────────────────────────────────────────────────────────────────────
// RAW RESOURCES (120 items, tier 1)
// ─────────────────────────────────────────────────────────────────────────────
const RAW_RESOURCES = [
  { id:"wood",           name:"Wood",             emoji:"🪵", tier:1, rarity:"common",   weight:5,   stackSize:500, producedBy:["lumberjack_camp","sawmill"], usedFor:["planks","charcoal","paper"], craftingStation:"hand", craftingRecipe:{} },
  { id:"stone",          name:"Stone",            emoji:"🪨", tier:1, rarity:"common",   weight:10,  stackSize:500, producedBy:["quarry","mine"], usedFor:["bricks","stone_block","mortar"], craftingStation:"hand", craftingRecipe:{} },
  { id:"sand",           name:"Sand",             emoji:"⏳", tier:1, rarity:"common",   weight:8,   stackSize:500, producedBy:["quarry","desert_mine"], usedFor:["glass","concrete","sandstone"], craftingStation:"hand", craftingRecipe:{} },
  { id:"clay",           name:"Clay",             emoji:"🟤", tier:1, rarity:"common",   weight:6,   stackSize:500, producedBy:["clay_pit","river_mine"], usedFor:["bricks","pottery","tiles"], craftingStation:"hand", craftingRecipe:{} },
  { id:"coal",           name:"Coal",             emoji:"⬛", tier:1, rarity:"common",   weight:8,   stackSize:500, producedBy:["coal_mine"], usedFor:["steel","fuel","power_plant"], craftingStation:"hand", craftingRecipe:{} },
  { id:"crude_oil",      name:"Crude Oil",        emoji:"🛢️", tier:2, rarity:"uncommon", weight:15,  stackSize:200, producedBy:["oil_rig","oil_pump"], usedFor:["fuel","plastic","lubricant"], craftingStation:"hand", craftingRecipe:{} },
  { id:"iron_ore",       name:"Iron Ore",         emoji:"🟫", tier:1, rarity:"common",   weight:12,  stackSize:300, producedBy:["iron_mine","quarry"], usedFor:["iron_ingot","steel","cast_iron"], craftingStation:"hand", craftingRecipe:{} },
  { id:"copper_ore",     name:"Copper Ore",       emoji:"🟠", tier:1, rarity:"common",   weight:11,  stackSize:300, producedBy:["copper_mine"], usedFor:["copper_wire","bronze","brass"], craftingStation:"hand", craftingRecipe:{} },
  { id:"gold_ore",       name:"Gold Ore",         emoji:"🟡", tier:1, rarity:"uncommon", weight:20,  stackSize:100, producedBy:["gold_mine"], usedFor:["gold_ingot","jewelry","circuits"], craftingStation:"hand", craftingRecipe:{} },
  { id:"silver_ore",     name:"Silver Ore",       emoji:"⚪", tier:1, rarity:"uncommon", weight:18,  stackSize:100, producedBy:["silver_mine"], usedFor:["silver_wire","mirrors","coins"], craftingStation:"hand", craftingRecipe:{} },
  { id:"tin_ore",        name:"Tin Ore",          emoji:"🔘", tier:1, rarity:"common",   weight:10,  stackSize:300, producedBy:["tin_mine"], usedFor:["tin_can","bronze","alloy"], craftingStation:"hand", craftingRecipe:{} },
  { id:"lead_ore",       name:"Lead Ore",         emoji:"⚫", tier:1, rarity:"common",   weight:22,  stackSize:200, producedBy:["lead_mine"], usedFor:["bullets","pipes","batteries"], craftingStation:"hand", craftingRecipe:{} },
  { id:"uranium_ore",    name:"Uranium Ore",      emoji:"☢️",  tier:4, rarity:"epic",     weight:50,  stackSize:50,  producedBy:["uranium_mine"], usedFor:["nuclear_fuel","weapon_grade_uranium"], craftingStation:"hand", craftingRecipe:{} },
  { id:"titanium_ore",   name:"Titanium Ore",     emoji:"🔵", tier:4, rarity:"rare",     weight:30,  stackSize:100, producedBy:["deep_mine"], usedFor:["titanium_alloy","spacecraft_hull"], craftingStation:"hand", craftingRecipe:{} },
  { id:"rare_earth",     name:"Rare Earth Minerals",emoji:"💎",tier:4, rarity:"epic",     weight:15,  stackSize:100, producedBy:["rare_mine"], usedFor:["processors","magnets","lasers"], craftingStation:"hand", craftingRecipe:{} },
  { id:"bauxite",        name:"Bauxite",          emoji:"🟥", tier:2, rarity:"common",   weight:14,  stackSize:300, producedBy:["bauxite_mine"], usedFor:["aluminum","alumina"], craftingStation:"hand", craftingRecipe:{} },
  { id:"limestone",      name:"Limestone",        emoji:"🪨", tier:1, rarity:"common",   weight:12,  stackSize:400, producedBy:["quarry"], usedFor:["cement","concrete","mortar"], craftingStation:"hand", craftingRecipe:{} },
  { id:"sulfur",         name:"Sulfur",           emoji:"🟡", tier:2, rarity:"uncommon", weight:8,   stackSize:200, producedBy:["volcanic_mine","chemical_plant"], usedFor:["gunpowder","acid","fertilizer"], craftingStation:"hand", craftingRecipe:{} },
  { id:"cotton",         name:"Raw Cotton",       emoji:"🌿", tier:1, rarity:"common",   weight:2,   stackSize:500, producedBy:["cotton_farm"], usedFor:["cloth","thread","bandages"], craftingStation:"hand", craftingRecipe:{} },
  { id:"wool",           name:"Raw Wool",         emoji:"🐑", tier:1, rarity:"common",   weight:3,   stackSize:400, producedBy:["sheep_farm"], usedFor:["yarn","felt","insulation"], craftingStation:"hand", craftingRecipe:{} },
  { id:"hide",           name:"Animal Hide",      emoji:"🦌", tier:1, rarity:"common",   weight:4,   stackSize:200, producedBy:["hunting_lodge","ranch"], usedFor:["leather","armor","boots"], craftingStation:"hand", craftingRecipe:{} },
  { id:"rubber_sap",     name:"Rubber Sap",       emoji:"🌳", tier:2, rarity:"uncommon", weight:6,   stackSize:200, producedBy:["rubber_plantation"], usedFor:["rubber","tires","seals"], craftingStation:"hand", craftingRecipe:{} },
  { id:"natural_gas",    name:"Natural Gas",      emoji:"💨", tier:2, rarity:"uncommon", weight:1,   stackSize:300, producedBy:["gas_well","oil_rig"], usedFor:["fuel","chemical_feedstock","power_plant"], craftingStation:"hand", craftingRecipe:{} },
  { id:"bamboo",         name:"Bamboo",           emoji:"🎋", tier:1, rarity:"common",   weight:3,   stackSize:400, producedBy:["bamboo_grove"], usedFor:["planks","paper","scaffolding"], craftingStation:"hand", craftingRecipe:{} },
  { id:"obsidian",       name:"Obsidian",         emoji:"🖤", tier:2, rarity:"rare",     weight:20,  stackSize:100, producedBy:["volcanic_quarry"], usedFor:["volcanic_glass","cutting_tools","arrowheads"], craftingStation:"hand", craftingRecipe:{} },
  { id:"salt",           name:"Salt",             emoji:"🧂", tier:1, rarity:"common",   weight:4,   stackSize:500, producedBy:["salt_flat","sea_evap"], usedFor:["food_preservation","chemical","glass"], craftingStation:"hand", craftingRecipe:{} },
  { id:"chalk",          name:"Chalk",            emoji:"⬜", tier:1, rarity:"common",   weight:5,   stackSize:400, producedBy:["chalk_quarry"], usedFor:["cement","plaster","paint"], craftingStation:"hand", craftingRecipe:{} },
  { id:"flint",          name:"Flint",            emoji:"🪨", tier:1, rarity:"common",   weight:6,   stackSize:300, producedBy:["flint_quarry"], usedFor:["tools","fire_starter","arrowheads"], craftingStation:"hand", craftingRecipe:{} },
  { id:"peat",           name:"Peat",             emoji:"🟫", tier:1, rarity:"common",   weight:5,   stackSize:400, producedBy:["peat_bog"], usedFor:["fuel","fertilizer","activated_carbon"], craftingStation:"hand", craftingRecipe:{} },
  { id:"quartz",         name:"Quartz Crystal",   emoji:"💠", tier:2, rarity:"uncommon", weight:4,   stackSize:200, producedBy:["crystal_mine"], usedFor:["glass","processors","oscillators"], craftingStation:"hand", craftingRecipe:{} },
].map(i => ({ ...i, category: "raw_resources" }));

// ─────────────────────────────────────────────────────────────────────────────
// REFINED MATERIALS (180 items)
// ─────────────────────────────────────────────────────────────────────────────
const REFINED_MATERIALS = [
  { id:"iron_ingot",     name:"Iron Ingot",       emoji:"🔩", tier:1, rarity:"common",   weight:10,  stackSize:200, producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ iron_ore:3 }, usedFor:["tools","weapons","machinery"] },
  { id:"steel",          name:"Steel",            emoji:"🔩", tier:2, rarity:"common",   weight:12,  stackSize:200, producedBy:["forge","factory"], craftingStation:"forge", craftingRecipe:{ iron_ingot:3, coal:1 }, usedFor:["beams","vehicles","weapons"] },
  { id:"steel_beam",     name:"Steel Beam",       emoji:"🏗️", tier:2, rarity:"common",   weight:25,  stackSize:100, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:5, coal:2 }, usedFor:["buildings","bridges","vehicles"] },
  { id:"steel_plate",    name:"Steel Plate",      emoji:"🔲", tier:2, rarity:"common",   weight:20,  stackSize:100, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:4 }, usedFor:["armor","ships","vehicles"] },
  { id:"copper_wire",    name:"Copper Wire",      emoji:"🔌", tier:1, rarity:"common",   weight:2,   stackSize:500, producedBy:["workshop"], craftingStation:"forge", craftingRecipe:{ copper_ore:2 }, usedFor:["electronics","motors","wiring"] },
  { id:"bronze",         name:"Bronze",           emoji:"🟠", tier:1, rarity:"common",   weight:10,  stackSize:200, producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ copper_ore:3, tin_ore:1 }, usedFor:["tools","statues","coins"] },
  { id:"brass",          name:"Brass",            emoji:"🟡", tier:2, rarity:"common",   weight:9,   stackSize:200, producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ copper_ore:3, tin_ore:2 }, usedFor:["pipes","fittings","instruments"] },
  { id:"aluminum",       name:"Aluminum",         emoji:"⬜", tier:2, rarity:"common",   weight:5,   stackSize:300, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ bauxite:5 }, usedFor:["aircraft","cans","frames"] },
  { id:"glass",          name:"Glass",            emoji:"🪟", tier:1, rarity:"common",   weight:6,   stackSize:200, producedBy:["kiln"], craftingStation:"kiln", craftingRecipe:{ sand:4, salt:1 }, usedFor:["windows","optics","bottles"] },
  { id:"tempered_glass", name:"Tempered Glass",   emoji:"🔷", tier:3, rarity:"uncommon", weight:8,   stackSize:100, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ glass:5, chemical:2 }, usedFor:["vehicles","skyscrapers","phones"] },
  { id:"cement",         name:"Cement",           emoji:"⬜", tier:2, rarity:"common",   weight:15,  stackSize:300, producedBy:["kiln"], craftingStation:"kiln", craftingRecipe:{ limestone:4, clay:2 }, usedFor:["concrete","mortar","plaster"] },
  { id:"concrete",       name:"Concrete",         emoji:"🧱", tier:2, rarity:"common",   weight:30,  stackSize:200, producedBy:["factory"], craftingStation:"workbench", craftingRecipe:{ cement:2, sand:4, stone:3 }, usedFor:["buildings","roads","bridges"] },
  { id:"brick",          name:"Fired Brick",      emoji:"🧱", tier:1, rarity:"common",   weight:8,   stackSize:400, producedBy:["kiln"], craftingStation:"kiln", craftingRecipe:{ clay:3 }, usedFor:["buildings","walls","chimneys"] },
  { id:"plank",          name:"Wood Plank",       emoji:"🪵", tier:1, rarity:"common",   weight:4,   stackSize:400, producedBy:["sawmill"], craftingStation:"workbench", craftingRecipe:{ wood:2 }, usedFor:["furniture","structures","ships"] },
  { id:"paper",          name:"Paper",            emoji:"📄", tier:1, rarity:"common",   weight:1,   stackSize:1000,producedBy:["paper_mill"], craftingStation:"workbench", craftingRecipe:{ wood:2 }, usedFor:["books","maps","packaging"] },
  { id:"charcoal",       name:"Charcoal",         emoji:"⬛", tier:1, rarity:"common",   weight:4,   stackSize:400, producedBy:["kiln"], craftingStation:"kiln", craftingRecipe:{ wood:3 }, usedFor:["fuel","filter","art"] },
  { id:"rubber",         name:"Rubber",           emoji:"⚫", tier:2, rarity:"uncommon", weight:5,   stackSize:300, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ rubber_sap:4 }, usedFor:["tires","seals","cables"] },
  { id:"plastic",        name:"Plastic",          emoji:"🔲", tier:3, rarity:"common",   weight:2,   stackSize:500, producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ crude_oil:3, natural_gas:1 }, usedFor:["electronics","packaging","vehicles"] },
  { id:"fiber",          name:"Synthetic Fiber",  emoji:"🧵", tier:3, rarity:"uncommon", weight:1,   stackSize:500, producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ crude_oil:2, cotton:2 }, usedFor:["textiles","armor","ropes"] },
  { id:"cloth",          name:"Cloth",            emoji:"🧶", tier:1, rarity:"common",   weight:2,   stackSize:400, producedBy:["loom"], craftingStation:"loom", craftingRecipe:{ cotton:3 }, usedFor:["clothing","flags","bandages"] },
  { id:"leather",        name:"Leather",          emoji:"🟤", tier:1, rarity:"common",   weight:4,   stackSize:200, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ hide:3, salt:1 }, usedFor:["armor","boots","saddle"] },
  { id:"rope",           name:"Rope",             emoji:"🪢", tier:1, rarity:"common",   weight:3,   stackSize:300, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ cotton:4 }, usedFor:["ships","climbing","construction"] },
  { id:"gold_ingot",     name:"Gold Ingot",       emoji:"🟡", tier:2, rarity:"uncommon", weight:20,  stackSize:50,  producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ gold_ore:3 }, usedFor:["jewelry","circuits","currency"] },
  { id:"silver_ingot",   name:"Silver Ingot",     emoji:"⚪", tier:2, rarity:"uncommon", weight:18,  stackSize:50,  producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ silver_ore:3 }, usedFor:["mirrors","coins","electronics"] },
  { id:"titanium_alloy", name:"Titanium Alloy",   emoji:"🔵", tier:4, rarity:"rare",     weight:15,  stackSize:100, producedBy:["advanced_factory"], craftingStation:"advanced_factory", craftingRecipe:{ titanium_ore:4, aluminum:2 }, usedFor:["aircraft","spacecraft","armor"] },
  { id:"carbon_fiber",   name:"Carbon Fiber",     emoji:"⬛", tier:4, rarity:"rare",     weight:3,   stackSize:100, producedBy:["advanced_factory"], craftingStation:"advanced_factory", craftingRecipe:{ coal:10, plastic:5 }, usedFor:["aircraft","racing_cars","drones"] },
  { id:"ceramic",        name:"Ceramic",          emoji:"⬜", tier:2, rarity:"common",   weight:5,   stackSize:200, producedBy:["kiln"], craftingStation:"kiln", craftingRecipe:{ clay:4, sand:2 }, usedFor:["tiles","cookware","insulation"] },
  { id:"insulation",     name:"Insulation",       emoji:"🟨", tier:2, rarity:"common",   weight:3,   stackSize:300, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ fiber:3, plastic:1 }, usedFor:["buildings","pipes","wiring"] },
  { id:"pipe",           name:"Metal Pipe",       emoji:"⬛", tier:2, rarity:"common",   weight:8,   stackSize:200, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:3 }, usedFor:["plumbing","oil_lines","infrastructure"] },
  { id:"wiring",         name:"Electrical Wiring",emoji:"🔌", tier:2, rarity:"common",   weight:2,   stackSize:400, producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ copper_wire:5, insulation:2 }, usedFor:["buildings","electronics","vehicles"] },
  { id:"plaster",        name:"Plaster",          emoji:"⬜", tier:1, rarity:"common",   weight:6,   stackSize:300, producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ chalk:3, water:1 }, usedFor:["walls","sculpture","medical"] },
  { id:"mortar",         name:"Mortar",           emoji:"🟫", tier:1, rarity:"common",   weight:10,  stackSize:300, producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ limestone:2, sand:3, water:1 }, usedFor:["bricklaying","stonework","construction"] },
  { id:"tar",            name:"Tar",              emoji:"⬛", tier:2, rarity:"common",   weight:8,   stackSize:200, producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ coal:4, peat:2 }, usedFor:["roads","waterproofing","roofing"] },
  { id:"asphalt",        name:"Asphalt",          emoji:"⬛", tier:2, rarity:"common",   weight:20,  stackSize:100, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ tar:3, gravel:4 }, usedFor:["roads","runways","parking"] },
  { id:"fiberglass",     name:"Fiberglass",       emoji:"🟦", tier:3, rarity:"uncommon", weight:4,   stackSize:200, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ glass:5, fiber:3 }, usedFor:["boats","aircraft","helmets"] },
  { id:"alloy_steel",    name:"Alloy Steel",      emoji:"🔩", tier:3, rarity:"uncommon", weight:13,  stackSize:150, producedBy:["advanced_factory"], craftingStation:"factory", craftingRecipe:{ steel:5, chromium:2 }, usedFor:["engines","turbines","armor"] },
].map(i => ({ ...i, category: "refined_materials" }));

// ─────────────────────────────────────────────────────────────────────────────
// TOOLS (200 items)
// ─────────────────────────────────────────────────────────────────────────────
const TOOLS = [
  { id:"stone_axe",      name:"Stone Axe",        emoji:"🪓", tier:1, rarity:"common",   weight:3,  stackSize:10,  producedBy:["hand"], craftingStation:"hand", craftingRecipe:{ stone:2, wood:1 }, usedFor:["wood_cutting","building"] },
  { id:"iron_pickaxe",   name:"Iron Pickaxe",     emoji:"⛏️", tier:1, rarity:"common",   weight:5,  stackSize:5,   producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ iron_ingot:3, plank:2 }, usedFor:["mining","quarrying"] },
  { id:"hammer",         name:"Hammer",           emoji:"🔨", tier:1, rarity:"common",   weight:2,  stackSize:10,  producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ iron_ingot:2, plank:1 }, usedFor:["construction","smithing","nails"] },
  { id:"saw",            name:"Handsaw",          emoji:"🪚", tier:1, rarity:"common",   weight:2,  stackSize:5,   producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ iron_ingot:3, plank:1 }, usedFor:["wood_cutting","furniture"] },
  { id:"chisel",         name:"Chisel",           emoji:"🔧", tier:1, rarity:"common",   weight:1,  stackSize:10,  producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ iron_ingot:1, plank:1 }, usedFor:["stonework","carpentry","sculpting"] },
  { id:"shovel",         name:"Shovel",           emoji:"🪣", tier:1, rarity:"common",   weight:3,  stackSize:5,   producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ iron_ingot:2, plank:1 }, usedFor:["mining","agriculture","construction"] },
  { id:"wrench",         name:"Wrench",           emoji:"🔧", tier:2, rarity:"common",   weight:2,  stackSize:5,   producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:3 }, usedFor:["machinery","vehicles","plumbing"] },
  { id:"screwdriver",    name:"Screwdriver",      emoji:"🪛", tier:2, rarity:"common",   weight:1,  stackSize:10,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:1, plastic:1 }, usedFor:["electronics","assembly","vehicles"] },
  { id:"drill",          name:"Power Drill",      emoji:"🔩", tier:3, rarity:"uncommon", weight:4,  stackSize:3,   producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:5, motor:1, wiring:2 }, usedFor:["construction","mining","assembly"] },
  { id:"chainsaw",       name:"Chainsaw",         emoji:"🪚", tier:3, rarity:"uncommon", weight:8,  stackSize:2,   producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:8, engine_small:1, fuel:2 }, usedFor:["forestry","combat","rescue"] },
  { id:"crowbar",        name:"Crowbar",          emoji:"🔩", tier:2, rarity:"common",   weight:3,  stackSize:5,   producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:2 }, usedFor:["demolition","prying","rescue"] },
  { id:"pliers",         name:"Pliers",           emoji:"🔧", tier:2, rarity:"common",   weight:1,  stackSize:10,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:2 }, usedFor:["wiring","repair","fabrication"] },
  { id:"level",          name:"Spirit Level",     emoji:"📏", tier:2, rarity:"common",   weight:1,  stackSize:10,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:1, glass:1 }, usedFor:["construction","surveying"] },
  { id:"measuring_tape", name:"Measuring Tape",   emoji:"📏", tier:2, rarity:"common",   weight:1,  stackSize:20,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:1, rubber:1 }, usedFor:["construction","tailoring"] },
  { id:"blowtorch",      name:"Blowtorch",        emoji:"🔥", tier:3, rarity:"uncommon", weight:5,  stackSize:2,   producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:4, gas_canister:1 }, usedFor:["welding","cutting","plumbing"] },
  { id:"soldering_iron", name:"Soldering Iron",   emoji:"🔧", tier:3, rarity:"uncommon", weight:1,  stackSize:5,   producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ copper_wire:5, steel:2, wiring:2 }, usedFor:["electronics","circuits","repair"] },
  { id:"microscope",     name:"Microscope",       emoji:"🔬", tier:3, rarity:"rare",     weight:3,  stackSize:2,   producedBy:["laboratory"], craftingStation:"laboratory", craftingRecipe:{ glass:6, steel:4, lens:3 }, usedFor:["research","medicine","biology"] },
  { id:"telescope",      name:"Telescope",        emoji:"🔭", tier:3, rarity:"rare",     weight:5,  stackSize:2,   producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ glass:8, brass:4, lens:4 }, usedFor:["astronomy","navigation","military"] },
  { id:"compass",        name:"Compass",          emoji:"🧭", tier:1, rarity:"common",   weight:1,  stackSize:20,  producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ iron_ingot:1, bronze:1 }, usedFor:["navigation","surveying","exploration"] },
  { id:"thermometer",    name:"Thermometer",      emoji:"🌡️", tier:2, rarity:"common",   weight:1,  stackSize:20,  producedBy:["laboratory"], craftingStation:"laboratory", craftingRecipe:{ glass:2, silver_ingot:1 }, usedFor:["medicine","cooking","science"] },
  { id:"multimeter",     name:"Multimeter",       emoji:"📡", tier:3, rarity:"uncommon", weight:1,  stackSize:5,   producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ circuit_board:1, plastic:2, wiring:3 }, usedFor:["electronics","repair","testing"] },
  { id:"oscilloscope",   name:"Oscilloscope",     emoji:"📺", tier:4, rarity:"rare",     weight:5,  stackSize:2,   producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ circuit_board:3, screen:1, wiring:5 }, usedFor:["electronics","research","diagnostics"] },
].map(i => ({ ...i, category: "tools" }));

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUCTION ITEMS (300)
// ─────────────────────────────────────────────────────────────────────────────
const CONSTRUCTION = [
  { id:"stone_block",    name:"Stone Block",      emoji:"🧱", tier:1, rarity:"common",   weight:20, stackSize:200, producedBy:["quarry"], craftingStation:"workbench", craftingRecipe:{ stone:4 }, usedFor:["walls","foundations","castles"] },
  { id:"road_segment",   name:"Road Segment",     emoji:"🛣️", tier:2, rarity:"common",   weight:30, stackSize:100, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ asphalt:5, gravel:3 }, usedFor:["roads","highways","runways"] },
  { id:"wooden_beam",    name:"Wooden Beam",      emoji:"🪵", tier:1, rarity:"common",   weight:10, stackSize:200, producedBy:["sawmill"], craftingStation:"workbench", craftingRecipe:{ plank:4 }, usedFor:["structures","furniture","ships"] },
  { id:"rebar",          name:"Rebar",            emoji:"🔩", tier:2, rarity:"common",   weight:8,  stackSize:200, producedBy:["factory"], craftingStation:"forge", craftingRecipe:{ steel:2 }, usedFor:["reinforced_concrete","bridges","skyscrapers"] },
  { id:"reinforced_concrete",name:"Reinforced Concrete",emoji:"🧱",tier:2,rarity:"common",weight:40,stackSize:100,producedBy:["factory"],craftingStation:"factory", craftingRecipe:{ concrete:5, rebar:3 }, usedFor:["skyscrapers","bridges","bunkers"] },
  { id:"glass_panel",    name:"Glass Panel",      emoji:"🪟", tier:2, rarity:"common",   weight:10, stackSize:100, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ glass:4, steel:1 }, usedFor:["windows","greenhouses","facades"] },
  { id:"roof_tile",      name:"Roof Tile",        emoji:"🏠", tier:1, rarity:"common",   weight:5,  stackSize:200, producedBy:["kiln"], craftingStation:"kiln", craftingRecipe:{ clay:3 }, usedFor:["roofing","buildings"] },
  { id:"door_frame",     name:"Door Frame",       emoji:"🚪", tier:1, rarity:"common",   weight:8,  stackSize:50,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:6, iron_ingot:2 }, usedFor:["buildings","rooms"] },
  { id:"window_frame",   name:"Window Frame",     emoji:"🪟", tier:1, rarity:"common",   weight:6,  stackSize:50,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:4, glass:2 }, usedFor:["buildings","homes"] },
  { id:"foundation_block",name:"Foundation Block",emoji:"🧱", tier:2, rarity:"common",  weight:50, stackSize:50,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ reinforced_concrete:4, rebar:2 }, usedFor:["buildings","bridges"] },
  { id:"bridge_section", name:"Bridge Section",   emoji:"🌉", tier:3, rarity:"uncommon", weight:80, stackSize:20,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel_beam:8, cable:4, concrete:5 }, usedFor:["bridges","overpasses"] },
  { id:"cable",          name:"Steel Cable",      emoji:"⛓️", tier:2, rarity:"common",   weight:5,  stackSize:200, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:4 }, usedFor:["bridges","cranes","elevators"] },
  { id:"nail",           name:"Nails (bag)",      emoji:"📌", tier:1, rarity:"common",   weight:2,  stackSize:500, producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ iron_ingot:1 }, usedFor:["construction","carpentry","furniture"] },
  { id:"bolt_set",       name:"Bolt & Nut Set",   emoji:"🔩", tier:2, rarity:"common",   weight:2,  stackSize:500, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:1 }, usedFor:["machinery","vehicles","structures"] },
  { id:"scaffolding",    name:"Scaffolding",      emoji:"🏗️", tier:2, rarity:"common",   weight:15, stackSize:50,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:4, plank:2 }, usedFor:["construction","painting","repair"] },
  { id:"column",         name:"Stone Column",     emoji:"🏛️", tier:1, rarity:"common",   weight:40, stackSize:20,  producedBy:["quarry"], craftingStation:"workbench", craftingRecipe:{ stone_block:6 }, usedFor:["temples","government_buildings","architecture"] },
  { id:"arch",           name:"Stone Arch",       emoji:"🏛️", tier:1, rarity:"uncommon", weight:50, stackSize:10,  producedBy:["quarry"], craftingStation:"workbench", craftingRecipe:{ stone_block:8 }, usedFor:["gates","aqueducts","bridges"] },
  { id:"sewage_pipe",    name:"Sewage Pipe",      emoji:"⬛", tier:2, rarity:"common",   weight:10, stackSize:100, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ concrete:3, steel:2 }, usedFor:["plumbing","city_infrastructure"] },
  { id:"water_tower",    name:"Water Tower",      emoji:"🏗️", tier:2, rarity:"uncommon", weight:200,stackSize:1,   producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel_beam:10, concrete:8, pump:2 }, usedFor:["water_supply","city"] },
  { id:"lamp_post",      name:"Lamp Post",        emoji:"💡", tier:2, rarity:"common",   weight:8,  stackSize:20,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:3, glass:2, wiring:2 }, usedFor:["streets","parks","buildings"] },
].map(i => ({ ...i, category: "construction" }));

// ─────────────────────────────────────────────────────────────────────────────
// HOUSEHOLD ITEMS (300)
// ─────────────────────────────────────────────────────────────────────────────
const HOUSEHOLD = [
  { id:"broom",          name:"Broom",            emoji:"🧹", tier:1, rarity:"common",   weight:1,  stackSize:10, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ wood:2, cotton:2 }, usedFor:["cleaning","city_happiness"] },
  { id:"mop",            name:"Mop",              emoji:"🧹", tier:1, rarity:"common",   weight:2,  stackSize:5,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ wood:2, cloth:3 }, usedFor:["cleaning","city_happiness"] },
  { id:"bucket",         name:"Bucket",           emoji:"🪣", tier:1, rarity:"common",   weight:2,  stackSize:10, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ steel:2 }, usedFor:["cleaning","construction","farming"] },
  { id:"broom_set",      name:"Cleaning Set",     emoji:"🧽", tier:2, rarity:"common",   weight:3,  stackSize:5,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ broom:1, mop:1, bucket:1 }, usedFor:["city_happiness","sanitation"] },
  { id:"carpet",         name:"Carpet",           emoji:"🟥", tier:2, rarity:"common",   weight:5,  stackSize:20, producedBy:["loom"], craftingStation:"loom", craftingRecipe:{ wool:5, dye:1 }, usedFor:["homes","hotels","happiness"] },
  { id:"curtain",        name:"Curtain",          emoji:"🟦", tier:1, rarity:"common",   weight:2,  stackSize:20, producedBy:["loom"], craftingStation:"loom", craftingRecipe:{ cloth:3 }, usedFor:["homes","privacy","decor"] },
  { id:"pillow",         name:"Pillow",           emoji:"💬", tier:1, rarity:"common",   weight:1,  stackSize:20, producedBy:["loom"], craftingStation:"workbench", craftingRecipe:{ cloth:2, wool:1 }, usedFor:["beds","comfort","happiness"] },
  { id:"blanket",        name:"Blanket",          emoji:"🟫", tier:1, rarity:"common",   weight:2,  stackSize:10, producedBy:["loom"], craftingStation:"loom", craftingRecipe:{ wool:4, cloth:2 }, usedFor:["beds","warmth","happiness"] },
  { id:"soap",           name:"Soap",             emoji:"🧼", tier:1, rarity:"common",   weight:1,  stackSize:50, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ animal_fat:2, salt:1 }, usedFor:["hygiene","sanitation","medicine"] },
  { id:"candle",         name:"Candle",           emoji:"🕯️", tier:1, rarity:"common",   weight:1,  stackSize:50, producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ beeswax:2, cotton:1 }, usedFor:["light","decor","religion"] },
  { id:"lamp",           name:"Oil Lamp",         emoji:"🪔", tier:1, rarity:"common",   weight:2,  stackSize:10, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ brass:2, glass:1, crude_oil:1 }, usedFor:["light","decor","exploration"] },
  { id:"mirror",         name:"Mirror",           emoji:"🪞", tier:2, rarity:"common",   weight:3,  stackSize:5,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ glass:3, silver_ingot:1, plank:2 }, usedFor:["decor","optics","happiness"] },
  { id:"sink",           name:"Sink",             emoji:"🚿", tier:2, rarity:"common",   weight:8,  stackSize:5,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ ceramic:3, steel:2, pipe:2 }, usedFor:["plumbing","sanitation","happiness"] },
  { id:"toilet",         name:"Toilet",           emoji:"🚽", tier:2, rarity:"common",   weight:15, stackSize:3,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ ceramic:4, steel:2, pipe:3 }, usedFor:["sanitation","happiness","health"] },
  { id:"shower",         name:"Shower Unit",      emoji:"🚿", tier:2, rarity:"uncommon", weight:20, stackSize:2,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:5, glass:3, pipe:4, wiring:2 }, usedFor:["sanitation","happiness"] },
  { id:"bathtub",        name:"Bathtub",          emoji:"🛁", tier:2, rarity:"common",   weight:25, stackSize:2,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ ceramic:6, steel:3, pipe:4 }, usedFor:["sanitation","happiness","luxury"] },
  { id:"hairbrush",      name:"Hair Brush",       emoji:"💈", tier:1, rarity:"common",   weight:1,  stackSize:20, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ wood:1, boar_bristle:1 }, usedFor:["hygiene","happiness"] },
  { id:"toothbrush",     name:"Toothbrush",       emoji:"🦷", tier:2, rarity:"common",   weight:1,  stackSize:20, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ plastic:1, fiber:1 }, usedFor:["hygiene","sanitation","happiness"] },
  { id:"stove",          name:"Stove",            emoji:"🍳", tier:2, rarity:"uncommon", weight:30, stackSize:2,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:6, wiring:4, ceramic:2 }, usedFor:["cooking","happiness","food"] },
  { id:"refrigerator",   name:"Refrigerator",     emoji:"🧊", tier:3, rarity:"uncommon", weight:40, stackSize:1,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:8, motor:1, wiring:6, insulation:4 }, usedFor:["food_storage","happiness","city"] },
  { id:"washing_machine",name:"Washing Machine",  emoji:"🫧", tier:3, rarity:"uncommon", weight:35, stackSize:1,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:6, motor:1, wiring:5, rubber:3 }, usedFor:["laundry","happiness","hygiene"] },
  { id:"dishwasher",     name:"Dishwasher",       emoji:"🍽️", tier:3, rarity:"uncommon", weight:30, stackSize:1,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:5, motor:1, wiring:4, plastic:3 }, usedFor:["sanitation","happiness","city"] },
  { id:"air_conditioner",name:"Air Conditioner",  emoji:"❄️",  tier:3, rarity:"uncommon", weight:20, stackSize:2,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:5, refrigerant:2, motor:1, wiring:6 }, usedFor:["comfort","happiness","buildings"] },
  { id:"heater",         name:"Space Heater",     emoji:"🔥", tier:2, rarity:"common",   weight:5,  stackSize:3,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:3, wiring:4 }, usedFor:["warmth","happiness","buildings"] },
].map(i => ({ ...i, category: "household" }));

// ─────────────────────────────────────────────────────────────────────────────
// FURNITURE (300)
// ─────────────────────────────────────────────────────────────────────────────
const FURNITURE = [
  { id:"wooden_chair",   name:"Wooden Chair",     emoji:"🪑", tier:1, rarity:"common",   weight:5,  stackSize:10, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:4, nail:10 }, usedFor:["homes","offices","happiness"] },
  { id:"armchair",       name:"Armchair",         emoji:"🪑", tier:2, rarity:"common",   weight:8,  stackSize:5,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ plank:5, cloth:4, leather:2 }, usedFor:["comfort","happiness","luxury"] },
  { id:"sofa",           name:"Sofa / Couch",     emoji:"🛋️", tier:2, rarity:"common",   weight:20, stackSize:2,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ plank:8, cloth:8, foam:3, leather:3 }, usedFor:["comfort","happiness","city"] },
  { id:"table",          name:"Wooden Table",     emoji:"🪵", tier:1, rarity:"common",   weight:8,  stackSize:5,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:6, nail:15 }, usedFor:["homes","restaurants","offices"] },
  { id:"desk",           name:"Office Desk",      emoji:"🪵", tier:2, rarity:"common",   weight:10, stackSize:3,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ plank:8, steel:2, drawer_set:1 }, usedFor:["offices","research","city"] },
  { id:"bed_frame",      name:"Bed Frame",        emoji:"🛏️", tier:1, rarity:"common",   weight:15, stackSize:3,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:10, nail:20 }, usedFor:["sleep","homes","happiness"] },
  { id:"wardrobe",       name:"Wardrobe",         emoji:"🗄️", tier:1, rarity:"common",   weight:20, stackSize:2,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:12, nail:25, door_frame:1 }, usedFor:["storage","homes","happiness"] },
  { id:"bookshelf",      name:"Bookshelf",        emoji:"📚", tier:1, rarity:"common",   weight:12, stackSize:3,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:8, nail:15 }, usedFor:["storage","education","happiness"] },
  { id:"cabinet",        name:"Cabinet",          emoji:"🗄️", tier:1, rarity:"common",   weight:15, stackSize:2,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:10, nail:20, hinge:2 }, usedFor:["storage","kitchen","offices"] },
  { id:"chest",          name:"Wooden Chest",     emoji:"📦", tier:1, rarity:"common",   weight:10, stackSize:5,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:8, iron_ingot:2, lock:1 }, usedFor:["storage","inventory","valuables"] },
  { id:"throne",         name:"Throne",           emoji:"👑", tier:3, rarity:"epic",     weight:30, stackSize:1,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ plank:10, gold_ingot:3, cloth:5, jewel:2 }, usedFor:["government","prestige","happiness"] },
  { id:"fountain",       name:"Stone Fountain",   emoji:"⛲", tier:2, rarity:"uncommon", weight:80, stackSize:1,  producedBy:["quarry"], craftingStation:"workshop", craftingRecipe:{ stone_block:8, pipe:4, pump:1 }, usedFor:["city_happiness","tourism","decor"] },
  { id:"fireplace",      name:"Fireplace",        emoji:"🔥", tier:1, rarity:"common",   weight:30, stackSize:2,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ brick:10, steel:2 }, usedFor:["warmth","decor","happiness"] },
  { id:"piano",          name:"Grand Piano",      emoji:"🎹", tier:3, rarity:"rare",     weight:100,stackSize:1,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ plank:20, steel:10, wire:5, ivory:3 }, usedFor:["culture","happiness","luxury"] },
  { id:"clock",          name:"Grandfather Clock",emoji:"🕰️", tier:2, rarity:"uncommon", weight:20, stackSize:1,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ plank:8, brass:4, glass:2, spring:3 }, usedFor:["decor","time","happiness"] },
].map(i => ({ ...i, category: "furniture" }));

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRIAL ITEMS (350)
// ─────────────────────────────────────────────────────────────────────────────
const INDUSTRIAL = [
  { id:"gas_pump",       name:"Gas Pump",         emoji:"⛽", tier:2, rarity:"uncommon", weight:50, stackSize:5,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel_beam:10, rubber_hose:3, electronics:2 }, usedFor:["gas_stations","fuel_logistics","military"] },
  { id:"conveyor_belt",  name:"Conveyor Belt",    emoji:"⚙️", tier:2, rarity:"common",   weight:15, stackSize:20, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:5, rubber:4, motor:1 }, usedFor:["factories","logistics","automation"] },
  { id:"turbine",        name:"Industrial Turbine",emoji:"⚙️",tier:3, rarity:"rare",     weight:200,stackSize:2,  producedBy:["advanced_factory"], craftingStation:"factory", craftingRecipe:{ alloy_steel:20, blade:8, shaft:4 }, usedFor:["power_plant","ships","aircraft"] },
  { id:"engine_small",   name:"Small Engine",     emoji:"⚙️", tier:2, rarity:"uncommon", weight:20, stackSize:5,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:8, piston:4, gear:6, fuel_line:2 }, usedFor:["vehicles","generators","pumps"] },
  { id:"engine_large",   name:"Large Engine",     emoji:"🔧", tier:3, rarity:"rare",     weight:80, stackSize:2,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ alloy_steel:15, piston:8, gear:12, turbo:1 }, usedFor:["trucks","ships","trains","aircraft"] },
  { id:"generator",      name:"Generator",        emoji:"⚡", tier:3, rarity:"uncommon", weight:60, stackSize:2,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ engine_small:1, copper_wire:20, steel:10 }, usedFor:["power","buildings","military"] },
  { id:"motor",          name:"Electric Motor",   emoji:"⚙️", tier:2, rarity:"common",   weight:8,  stackSize:10, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ copper_wire:15, steel:4, magnet:2 }, usedFor:["machines","vehicles","appliances"] },
  { id:"pump",           name:"Industrial Pump",  emoji:"🔩", tier:2, rarity:"common",   weight:15, stackSize:5,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:5, rubber:3, motor:1 }, usedFor:["water","oil","mining"] },
  { id:"piston",         name:"Piston",           emoji:"⚙️", tier:2, rarity:"common",   weight:5,  stackSize:20, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ alloy_steel:3, seal:2 }, usedFor:["engines","hydraulics","compressors"] },
  { id:"gear",           name:"Gear",             emoji:"⚙️", tier:2, rarity:"common",   weight:3,  stackSize:50, producedBy:["workshop"], craftingStation:"forge", craftingRecipe:{ steel:2 }, usedFor:["engines","machinery","clocks"] },
  { id:"valve",          name:"Industrial Valve", emoji:"🔩", tier:2, rarity:"common",   weight:4,  stackSize:20, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ brass:3, rubber:2 }, usedFor:["plumbing","oil","chemical"] },
  { id:"crane",          name:"Industrial Crane", emoji:"🏗️", tier:3, rarity:"rare",     weight:500,stackSize:1,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel_beam:20, cable:10, motor:3, wiring:8 }, usedFor:["construction","ports","mining"] },
  { id:"drill_platform", name:"Drilling Platform",emoji:"🛢️", tier:3, rarity:"rare",     weight:1000,stackSize:1, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel_beam:30, pipe:20, pump:5, engine_large:2 }, usedFor:["oil_extraction","mining","gas_wells"] },
  { id:"compressor",     name:"Air Compressor",   emoji:"💨", tier:2, rarity:"uncommon", weight:30, stackSize:2,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:8, motor:1, pipe:4 }, usedFor:["pneumatics","painting","mining"] },
  { id:"boiler",         name:"Industrial Boiler",emoji:"🔥", tier:2, rarity:"uncommon", weight:100,stackSize:1,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:20, pipe:8, valve:4 }, usedFor:["power_plant","steam","heating"] },
  { id:"solar_panel",    name:"Solar Panel",      emoji:"☀️",  tier:4, rarity:"uncommon", weight:10, stackSize:20, producedBy:["advanced_factory"], craftingStation:"electronics_lab", craftingRecipe:{ silicon:6, aluminum:4, wiring:3 }, usedFor:["power","city","military"] },
  { id:"wind_turbine",   name:"Wind Turbine",     emoji:"💨", tier:3, rarity:"uncommon", weight:80, stackSize:2,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel_beam:12, blade:3, generator:1 }, usedFor:["power","city","coast"] },
  { id:"nuclear_reactor",name:"Nuclear Reactor",  emoji:"☢️",  tier:5, rarity:"legendary",weight:5000,stackSize:1, producedBy:["research_lab"], craftingStation:"research_lab", craftingRecipe:{ steel_beam:50, uranium_fuel:10, control_rod:5 }, usedFor:["power","military_research","space"] },
].map(i => ({ ...i, category: "industrial" }));

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLES (150)
// ─────────────────────────────────────────────────────────────────────────────
const VEHICLES = [
  { id:"bicycle",        name:"Bicycle",          emoji:"🚲", tier:1, rarity:"common",   weight:15, stackSize:3,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:5, rubber:4, gear:8 }, usedFor:["transport","city_happiness","delivery"] },
  { id:"cart",           name:"Horse Cart",       emoji:"🛒", tier:1, rarity:"common",   weight:30, stackSize:2,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:10, iron_ingot:4, rope:3 }, usedFor:["transport","trade","agriculture"] },
  { id:"car",            name:"Automobile",       emoji:"🚗", tier:3, rarity:"common",   weight:800,stackSize:1,  producedBy:["vehicle_plant"], craftingStation:"vehicle_plant", craftingRecipe:{ steel:20, engine_small:1, tire:4, glass:4, wiring:8 }, usedFor:["transport","city","economy"] },
  { id:"truck",          name:"Cargo Truck",      emoji:"🚛", tier:3, rarity:"uncommon", weight:3000,stackSize:1, producedBy:["vehicle_plant"], craftingStation:"vehicle_plant", craftingRecipe:{ steel:35, engine_large:1, tire:8, glass:4, wiring:10 }, usedFor:["logistics","construction","military"] },
  { id:"bus",            name:"City Bus",         emoji:"🚌", tier:3, rarity:"uncommon", weight:5000,stackSize:1, producedBy:["vehicle_plant"], craftingStation:"vehicle_plant", craftingRecipe:{ steel:40, engine_large:1, tire:8, glass:8, wiring:12 }, usedFor:["public_transport","city","happiness"] },
  { id:"train",          name:"Locomotive",       emoji:"🚂", tier:3, rarity:"rare",     weight:50000,stackSize:1,producedBy:["vehicle_plant"], craftingStation:"vehicle_plant", craftingRecipe:{ steel:100, engine_large:3, rail:50, boiler:2 }, usedFor:["mass_transit","freight","economy"] },
  { id:"cargo_ship",     name:"Cargo Ship",       emoji:"🚢", tier:3, rarity:"rare",     weight:100000,stackSize:1,producedBy:["shipyard"],   craftingStation:"shipyard", craftingRecipe:{ steel_beam:200, engine_large:4, steel_plate:50, wiring:30 }, usedFor:["trade","logistics","economy"] },
  { id:"cruise_ship",    name:"Cruise Ship",      emoji:"🛳️", tier:4, rarity:"epic",     weight:200000,stackSize:1,producedBy:["shipyard"],  craftingStation:"shipyard", craftingRecipe:{ steel_beam:300, engine_large:6, steel_plate:100, luxury_goods:20 }, usedFor:["tourism","economy","happiness"] },
  { id:"warship",        name:"Warship",          emoji:"⚓", tier:3, rarity:"rare",     weight:80000,stackSize:1, producedBy:["shipyard"],   craftingStation:"shipyard", craftingRecipe:{ steel_plate:100, engine_large:4, weapon_turret:4, wiring:40 }, usedFor:["military","naval_combat","blockade"] },
  { id:"submarine",      name:"Submarine",        emoji:"🌊", tier:4, rarity:"epic",     weight:50000,stackSize:1, producedBy:["shipyard"],   craftingStation:"shipyard", craftingRecipe:{ alloy_steel:80, engine_large:2, torpedo:8, sonar:1 }, usedFor:["military","espionage","naval"] },
  { id:"airplane",       name:"Commercial Airplane",emoji:"✈️",tier:4, rarity:"rare",    weight:40000,stackSize:1, producedBy:["vehicle_plant"],craftingStation:"vehicle_plant", craftingRecipe:{ aluminum:80, turbine:4, titanium_alloy:20, wiring:40 }, usedFor:["transport","trade","military"] },
  { id:"fighter_jet",    name:"Fighter Jet",      emoji:"🛩️", tier:4, rarity:"epic",     weight:15000,stackSize:1, producedBy:["weapons_factory"],craftingStation:"weapons_factory", craftingRecipe:{ titanium_alloy:40, turbine:2, missile_launcher:2, electronics:10 }, usedFor:["air_combat","defense","military"] },
  { id:"helicopter",     name:"Helicopter",       emoji:"🚁", tier:4, rarity:"rare",     weight:3000,stackSize:1,  producedBy:["vehicle_plant"],craftingStation:"vehicle_plant", craftingRecipe:{ aluminum:30, turbine:1, blade:4, wiring:20 }, usedFor:["transport","military","rescue"] },
  { id:"motorcycle",     name:"Motorcycle",       emoji:"🏍️", tier:3, rarity:"common",   weight:200,stackSize:2,  producedBy:["vehicle_plant"],craftingStation:"vehicle_plant", craftingRecipe:{ steel:8, engine_small:1, tire:2, wiring:4 }, usedFor:["transport","military","delivery"] },
  { id:"tank_vehicle",   name:"Battle Tank",      emoji:"🪖", tier:3, rarity:"rare",     weight:50000,stackSize:1, producedBy:["weapons_factory"],craftingStation:"weapons_factory", craftingRecipe:{ steel_plate:50, engine_large:2, alloy_steel:20, weapon_barrel:2 }, usedFor:["military","combat","siege"] },
  { id:"spacecraft",     name:"Spacecraft",       emoji:"🚀", tier:5, rarity:"legendary",weight:100000,stackSize:1,producedBy:["space_foundry"], craftingStation:"space_foundry", craftingRecipe:{ titanium_alloy:200, rocket_engine:4, heat_shield:8, computer:5 }, usedFor:["space_program","military","research"] },
].map(i => ({ ...i, category: "vehicles" }));

// ─────────────────────────────────────────────────────────────────────────────
// MILITARY EQUIPMENT (200)
// ─────────────────────────────────────────────────────────────────────────────
const MILITARY = [
  { id:"spear",          name:"Spear",            emoji:"🗡️", tier:1, rarity:"common",   weight:3,  stackSize:20, producedBy:["workbench"], craftingStation:"hand", craftingRecipe:{ wood:2, flint:1 }, usedFor:["combat","hunting","guard"] },
  { id:"sword",          name:"Iron Sword",       emoji:"⚔️", tier:1, rarity:"common",   weight:4,  stackSize:5,  producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ iron_ingot:4, plank:2 }, usedFor:["combat","guard","military"] },
  { id:"bow",            name:"Bow & Arrows",     emoji:"🏹", tier:1, rarity:"common",   weight:2,  stackSize:5,  producedBy:["workbench"], craftingStation:"workbench", craftingRecipe:{ wood:3, rope:2, flint:4 }, usedFor:["ranged_combat","hunting"] },
  { id:"crossbow",       name:"Crossbow",         emoji:"🏹", tier:2, rarity:"uncommon", weight:4,  stackSize:3,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ plank:5, iron_ingot:4, rope:3 }, usedFor:["ranged_combat","guard","military"] },
  { id:"musket",         name:"Musket",           emoji:"🔫", tier:2, rarity:"uncommon", weight:5,  stackSize:3,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ steel:6, plank:3, gunpowder:2 }, usedFor:["combat","military","guard"] },
  { id:"pistol_9mm",     name:"9mm Pistol",       emoji:"🔫", tier:3, rarity:"uncommon", weight:1,  stackSize:5,  producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:3, gunpowder:5, magazine:1 }, usedFor:["combat","police","military"] },
  { id:"rifle",          name:"Assault Rifle",    emoji:"🔫", tier:3, rarity:"uncommon", weight:4,  stackSize:3,  producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:8, stock:2, magazine:2, scope:1 }, usedFor:["infantry","military","combat"] },
  { id:"sniper_rifle",   name:"Sniper Rifle",     emoji:"🎯", tier:3, rarity:"rare",     weight:6,  stackSize:2,  producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ alloy_steel:8, scope:2, bipod:1, magazine:2 }, usedFor:["precision","military","assassin"] },
  { id:"machine_gun",    name:"Machine Gun",      emoji:"🔫", tier:3, rarity:"rare",     weight:15, stackSize:2,  producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:12, belt_feed:2, barrel:2, stock:2 }, usedFor:["suppression","military","vehicle"] },
  { id:"mortar",         name:"Mortar",           emoji:"💣", tier:3, rarity:"rare",     weight:30, stackSize:2,  producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:15, barrel:1, bipod:2 }, usedFor:["siege","fire_support","military"] },
  { id:"rocket_launcher",name:"Rocket Launcher",  emoji:"🚀", tier:3, rarity:"rare",     weight:8,  stackSize:2,  producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:10, rocket_propellant:3, warhead:2, guidance:1 }, usedFor:["anti_armor","military","demolition"] },
  { id:"drone",          name:"Combat Drone",     emoji:"🤖", tier:4, rarity:"rare",     weight:5,  stackSize:3,  producedBy:["advanced_factory"], craftingStation:"advanced_factory", craftingRecipe:{ electronics:5, carbon_fiber:4, motor:2, camera:2, weapons_module:1 }, usedFor:["reconnaissance","combat","surveillance"] },
  { id:"missile_launcher",name:"Missile Launcher",emoji:"🚀", tier:4, rarity:"epic",    weight:100,stackSize:1,  producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel_beam:15, rocket_propellant:8, warhead:4, guidance:2, launch_rail:4 }, usedFor:["area_denial","military","ships"] },
  { id:"nuclear_missile",name:"Nuclear Missile",  emoji:"☢️",  tier:5, rarity:"legendary",weight:5000,stackSize:1, producedBy:["research_lab"], craftingStation:"research_lab", craftingRecipe:{ weapon_grade_uranium:2, rocket_engine:2, guidance:3, reinforced_warhead:1 }, usedFor:["strategic","deterrence","doomsday"] },
  { id:"body_armor",     name:"Body Armor",       emoji:"🛡️", tier:3, rarity:"uncommon", weight:5,  stackSize:5,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ kevlar:6, steel_plate:2, padding:3 }, usedFor:["protection","military","police"] },
  { id:"helmet",         name:"Combat Helmet",    emoji:"⛑️", tier:2, rarity:"common",   weight:2,  stackSize:5,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:3, padding:2 }, usedFor:["protection","military","civil_defense"] },
  { id:"landmine",       name:"Land Mine",        emoji:"💣", tier:3, rarity:"rare",     weight:3,  stackSize:10, producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:2, explosive:3, detonator:1 }, usedFor:["area_denial","defense","traps"] },
  { id:"artillery_shell",name:"Artillery Shell",  emoji:"💥", tier:3, rarity:"uncommon", weight:8,  stackSize:20, producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:3, explosive:4 }, usedFor:["artillery","siege","naval"] },
  { id:"tank_shell",     name:"Tank Shell",       emoji:"💥", tier:3, rarity:"rare",     weight:15, stackSize:10, producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ alloy_steel:4, explosive:6, fuze:1 }, usedFor:["tank","siege","bunker_busting"] },
  { id:"bomb",           name:"Aerial Bomb",      emoji:"💣", tier:4, rarity:"rare",     weight:500,stackSize:2,  producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:15, explosive:20, fuze:2, fin_assembly:1 }, usedFor:["air_force","strategic_bombing"] },
  { id:"grenade",        name:"Fragmentation Grenade",emoji:"💣",tier:3,rarity:"uncommon",weight:1, stackSize:20, producedBy:["weapons_factory"], craftingStation:"weapons_factory", craftingRecipe:{ steel:2, explosive:2, pin:1 }, usedFor:["infantry","combat","clearing"] },
].map(i => ({ ...i, category: "military" }));

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRONICS (200)
// ─────────────────────────────────────────────────────────────────────────────
const ELECTRONICS = [
  { id:"circuit_board",  name:"Circuit Board",    emoji:"🖥️", tier:3, rarity:"uncommon", weight:1,  stackSize:50, producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ copper_wire:10, silicon:3, gold_ingot:1, plastic:2 }, usedFor:["computers","weapons","vehicles"] },
  { id:"processor",      name:"Processor (CPU)",  emoji:"💻", tier:4, rarity:"rare",     weight:1,  stackSize:10, producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ circuit_board:2, rare_earth:2, gold_ingot:1 }, usedFor:["computers","weapons","ai"] },
  { id:"battery",        name:"Battery Pack",     emoji:"🔋", tier:3, rarity:"common",   weight:3,  stackSize:20, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ lead_ore:4, acid:2, plastic:3 }, usedFor:["vehicles","electronics","storage"] },
  { id:"lithium_battery",name:"Lithium Battery",  emoji:"⚡", tier:4, rarity:"rare",     weight:2,  stackSize:10, producedBy:["advanced_factory"], craftingStation:"electronics_lab", craftingRecipe:{ lithium:6, circuit_board:1, titanium_alloy:1 }, usedFor:["electric_vehicles","weapons","phones"] },
  { id:"sensor",         name:"Sensor Module",    emoji:"📡", tier:3, rarity:"uncommon", weight:1,  stackSize:20, producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ circuit_board:1, lens:2, wiring:3 }, usedFor:["drones","missiles","vehicles","security"] },
  { id:"camera",         name:"Camera Module",    emoji:"📷", tier:3, rarity:"uncommon", weight:1,  stackSize:20, producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ lens:3, circuit_board:1, plastic:2 }, usedFor:["drones","security","phones","satellites"] },
  { id:"radio",          name:"Radio Transceiver",emoji:"📻", tier:3, rarity:"uncommon", weight:2,  stackSize:5,  producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ circuit_board:2, antenna:2, wiring:5 }, usedFor:["communication","military","civilian"] },
  { id:"computer",       name:"Computer",         emoji:"💻", tier:3, rarity:"rare",     weight:5,  stackSize:3,  producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ processor:1, circuit_board:4, screen:1, wiring:6 }, usedFor:["research","military","city","economy"] },
  { id:"smartphone",     name:"Smartphone",       emoji:"📱", tier:4, rarity:"uncommon", weight:1,  stackSize:10, producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ processor:1, lithium_battery:1, glass_panel:1, circuit_board:2 }, usedFor:["communication","city_happiness","economy"] },
  { id:"screen",         name:"Display Screen",   emoji:"📺", tier:3, rarity:"common",   weight:3,  stackSize:5,  producedBy:["factory"], craftingStation:"electronics_lab", craftingRecipe:{ tempered_glass:3, copper_wire:8, circuit_board:1 }, usedFor:["computers","tvs","public_displays"] },
  { id:"satellite",      name:"Satellite",        emoji:"🛰️", tier:5, rarity:"legendary",weight:500,stackSize:1,  producedBy:["space_foundry"], craftingStation:"space_foundry", craftingRecipe:{ titanium_alloy:20, solar_panel:10, computer:2, sensor:5 }, usedFor:["communication","surveillance","gps"] },
  { id:"radar",          name:"Radar System",     emoji:"📡", tier:4, rarity:"rare",     weight:50, stackSize:2,  producedBy:["advanced_factory"], craftingStation:"electronics_lab", craftingRecipe:{ circuit_board:5, antenna:4, steel_beam:4, motor:1 }, usedFor:["military","weather","navigation"] },
  { id:"comms_device",   name:"Communication Device",emoji:"📡",tier:3,rarity:"uncommon",weight:2, stackSize:10, producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ circuit_board:2, radio:1, battery:1 }, usedFor:["military","diplomacy","city"] },
  { id:"guidance_system",name:"Guidance System",  emoji:"🎯", tier:4, rarity:"epic",     weight:5,  stackSize:5,  producedBy:["advanced_factory"], craftingStation:"research_lab", craftingRecipe:{ processor:2, sensor:4, gyroscope:2, wiring:8 }, usedFor:["missiles","drones","ships","aircraft"] },
  { id:"ai_chip",        name:"AI Neural Chip",   emoji:"🤖", tier:5, rarity:"legendary",weight:1,  stackSize:5,  producedBy:["research_lab"], craftingStation:"research_lab", craftingRecipe:{ processor:3, rare_earth:3, quantum_bit:1 }, usedFor:["ai_weapons","research","autonomous_vehicles"] },
].map(i => ({ ...i, category: "electronics" }));

// ─────────────────────────────────────────────────────────────────────────────
// MEDICAL (150)
// ─────────────────────────────────────────────────────────────────────────────
const MEDICAL = [
  { id:"bandage",        name:"Bandage",          emoji:"🩹", tier:1, rarity:"common",   weight:1,  stackSize:100,producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ cloth:3 }, usedFor:["first_aid","hospitals","military"] },
  { id:"splint",         name:"Splint",           emoji:"🦴", tier:1, rarity:"common",   weight:2,  stackSize:20, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:2, bandage:2 }, usedFor:["fractures","first_aid"] },
  { id:"antiseptic",     name:"Antiseptic",       emoji:"🧴", tier:2, rarity:"common",   weight:1,  stackSize:50, producedBy:["laboratory"], craftingStation:"laboratory", craftingRecipe:{ alcohol:3, herb:2 }, usedFor:["wound_care","surgery","hygiene"] },
  { id:"surgical_kit",   name:"Surgical Kit",     emoji:"🩺", tier:3, rarity:"uncommon", weight:3,  stackSize:5,  producedBy:["laboratory"], craftingStation:"laboratory", craftingRecipe:{ steel:4, rubber:2, antiseptic:3, bandage:5 }, usedFor:["surgery","hospitals","military"] },
  { id:"vaccine",        name:"Vaccine",          emoji:"💉", tier:3, rarity:"rare",     weight:1,  stackSize:50, producedBy:["laboratory"], craftingStation:"laboratory", craftingRecipe:{ glass_vial:3, chemical:4, research_reagent:2 }, usedFor:["disease_prevention","health","population"] },
  { id:"medicine",       name:"Medicine",         emoji:"💊", tier:2, rarity:"uncommon", weight:1,  stackSize:100,producedBy:["laboratory"], craftingStation:"laboratory", craftingRecipe:{ herb:4, chemical:2, glass_vial:1 }, usedFor:["healing","hospitals","population"] },
  { id:"defibrillator",  name:"Defibrillator",    emoji:"⚡", tier:3, rarity:"rare",     weight:5,  stackSize:2,  producedBy:["laboratory"], craftingStation:"electronics_lab", craftingRecipe:{ battery:2, circuit_board:2, steel:3, rubber:2 }, usedFor:["emergency","hospitals","health"] },
  { id:"xray_machine",   name:"X-Ray Machine",    emoji:"🦴", tier:3, rarity:"rare",     weight:100,stackSize:1,  producedBy:["factory"], craftingStation:"electronics_lab", craftingRecipe:{ steel:15, electronics:3, wiring:8, radiation_shield:4 }, usedFor:["diagnosis","hospitals","research"] },
  { id:"mri_scanner",    name:"MRI Scanner",      emoji:"🏥", tier:4, rarity:"epic",     weight:500,stackSize:1,  producedBy:["advanced_factory"], craftingStation:"research_lab", craftingRecipe:{ alloy_steel:30, magnet:10, computer:2, wiring:15 }, usedFor:["advanced_diagnosis","hospitals","research"] },
  { id:"ambulance",      name:"Ambulance",        emoji:"🚑", tier:3, rarity:"uncommon", weight:3000,stackSize:1, producedBy:["vehicle_plant"], craftingStation:"vehicle_plant", craftingRecipe:{ car:1, surgical_kit:3, medicine:10, wiring:5 }, usedFor:["emergency","health","city_happiness"] },
  { id:"blood_bag",      name:"Blood Bag",        emoji:"🩸", tier:3, rarity:"uncommon", weight:1,  stackSize:20, producedBy:["laboratory"], craftingStation:"laboratory", craftingRecipe:{ glass_vial:2, rubber:1, anticoagulant:1 }, usedFor:["transfusion","hospitals","military"] },
  { id:"prosthetics",    name:"Prosthetic Limb",  emoji:"🦾", tier:4, rarity:"rare",     weight:3,  stackSize:5,  producedBy:["advanced_factory"], craftingStation:"advanced_factory", craftingRecipe:{ titanium_alloy:5, motor:1, sensor:2, circuit_board:2 }, usedFor:["rehabilitation","happiness","military"] },
].map(i => ({ ...i, category: "medical" }));

// ─────────────────────────────────────────────────────────────────────────────
// AGRICULTURE (250)
// ─────────────────────────────────────────────────────────────────────────────
const AGRICULTURE = [
  { id:"fertilizer",     name:"Fertilizer",       emoji:"🌿", tier:2, rarity:"common",   weight:5,  stackSize:300,producedBy:["chemical_plant"], craftingStation:"workbench", craftingRecipe:{ sulfur:2, phosphate:2, compost:3 }, usedFor:["farming","crop_yield","food"] },
  { id:"irrigation_pump",name:"Irrigation Pump",  emoji:"💧", tier:2, rarity:"uncommon", weight:20, stackSize:5,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:6, pump:2, pipe:4 }, usedFor:["farming","water_management","crops"] },
  { id:"tractor",        name:"Tractor",          emoji:"🚜", tier:3, rarity:"uncommon", weight:3000,stackSize:1, producedBy:["vehicle_plant"], craftingStation:"vehicle_plant", craftingRecipe:{ steel:20, engine_large:1, tire:4, hydraulic:2 }, usedFor:["farming","large_scale_agriculture"] },
  { id:"plow",           name:"Plow",             emoji:"🌾", tier:1, rarity:"common",   weight:15, stackSize:3,  producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ iron_ingot:8, plank:4 }, usedFor:["farming","soil_prep","agriculture"] },
  { id:"scythe",         name:"Scythe",           emoji:"⚔️", tier:1, rarity:"common",   weight:4,  stackSize:5,  producedBy:["forge"], craftingStation:"forge", craftingRecipe:{ iron_ingot:4, plank:2 }, usedFor:["harvesting","agriculture","combat"] },
  { id:"seed_bag",       name:"Seed Bag",         emoji:"🌱", tier:1, rarity:"common",   weight:2,  stackSize:100,producedBy:["farm"], craftingStation:"hand", craftingRecipe:{ plant_material:3 }, usedFor:["planting","farming","food"] },
  { id:"greenhouse",     name:"Greenhouse",       emoji:"🏡", tier:3, rarity:"uncommon", weight:200,stackSize:1,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ glass_panel:20, steel:10, pipe:5 }, usedFor:["year_round_farming","food","research"] },
  { id:"harvester",      name:"Combine Harvester",emoji:"🌾", tier:3, rarity:"rare",     weight:8000,stackSize:1, producedBy:["vehicle_plant"], craftingStation:"vehicle_plant", craftingRecipe:{ steel:40, engine_large:1, blade:8, tire:4 }, usedFor:["large_farming","food_production","economy"] },
  { id:"silo",           name:"Grain Silo",       emoji:"🏚️", tier:2, rarity:"common",   weight:500,stackSize:1,  producedBy:["factory"], craftingStation:"workbench", craftingRecipe:{ steel:20, concrete:10 }, usedFor:["food_storage","trade","economy"] },
  { id:"pesticide",      name:"Pesticide",        emoji:"🧪", tier:2, rarity:"uncommon", weight:3,  stackSize:50, producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ sulfur:3, acid:2, crude_oil:1 }, usedFor:["crop_protection","agriculture"] },
].map(i => ({ ...i, category: "agriculture" }));

// ─────────────────────────────────────────────────────────────────────────────
// FOOD & BEVERAGES (250)
// ─────────────────────────────────────────────────────────────────────────────
const FOOD = [
  { id:"bread",          name:"Bread",            emoji:"🍞", tier:1, rarity:"common",   weight:1,  stackSize:100,producedBy:["kitchen"], craftingStation:"kitchen", craftingRecipe:{ flour:2, water:1, salt:1 }, usedFor:["food","population","happiness"] },
  { id:"flour",          name:"Flour",            emoji:"🌾", tier:1, rarity:"common",   weight:3,  stackSize:300,producedBy:["mill"], craftingStation:"hand", craftingRecipe:{ wheat:4 }, usedFor:["bread","pasta","food"] },
  { id:"wheat",          name:"Wheat",            emoji:"🌾", tier:1, rarity:"common",   weight:2,  stackSize:500,producedBy:["farm"], craftingStation:"hand", craftingRecipe:{}, usedFor:["flour","beer","food"] },
  { id:"meat",           name:"Meat",             emoji:"🥩", tier:1, rarity:"common",   weight:2,  stackSize:100,producedBy:["ranch","hunting_lodge"], craftingStation:"hand", craftingRecipe:{}, usedFor:["food","military_rations","cooking"] },
  { id:"cooked_meal",    name:"Cooked Meal",      emoji:"🍲", tier:1, rarity:"common",   weight:2,  stackSize:50, producedBy:["kitchen"], craftingStation:"kitchen", craftingRecipe:{ meat:1, vegetable:2, salt:1 }, usedFor:["population","happiness","military"] },
  { id:"rations",        name:"Military Rations", emoji:"🥫", tier:2, rarity:"uncommon", weight:2,  stackSize:100,producedBy:["factory"], craftingStation:"kitchen", craftingRecipe:{ cooked_meal:2, tin_can:2, salt:1 }, usedFor:["military","survival","emergency"] },
  { id:"beer",           name:"Beer",             emoji:"🍺", tier:1, rarity:"common",   weight:2,  stackSize:100,producedBy:["brewery"], craftingStation:"kitchen", craftingRecipe:{ wheat:3, water:2, yeast:1 }, usedFor:["happiness","trade","culture"] },
  { id:"wine",           name:"Wine",             emoji:"🍷", tier:2, rarity:"uncommon", weight:2,  stackSize:50, producedBy:["winery"], craftingStation:"kitchen", craftingRecipe:{ grape:4, yeast:1 }, usedFor:["happiness","luxury","trade"] },
  { id:"cheese",         name:"Cheese",           emoji:"🧀", tier:1, rarity:"common",   weight:2,  stackSize:100,producedBy:["dairy"], craftingStation:"kitchen", craftingRecipe:{ milk:5, salt:1 }, usedFor:["food","happiness","trade"] },
  { id:"canned_food",    name:"Canned Food",      emoji:"🥫", tier:2, rarity:"common",   weight:3,  stackSize:100,producedBy:["factory"], craftingStation:"kitchen", craftingRecipe:{ food:2, tin_can:1 }, usedFor:["storage","military","population"] },
  { id:"coffee",         name:"Coffee",           emoji:"☕", tier:2, rarity:"common",   weight:1,  stackSize:200,producedBy:["kitchen"], craftingStation:"kitchen", craftingRecipe:{ coffee_bean:3, water:2 }, usedFor:["happiness","productivity","trade"] },
  { id:"spices",         name:"Spice Mix",        emoji:"🌶️", tier:1, rarity:"uncommon", weight:1,  stackSize:200,producedBy:["farm"], craftingStation:"hand", craftingRecipe:{ herb:3, salt:1 }, usedFor:["cooking","trade","happiness"] },
].map(i => ({ ...i, category: "food" }));

// ─────────────────────────────────────────────────────────────────────────────
// ENERGY & FUEL (items)
// ─────────────────────────────────────────────────────────────────────────────
const ENERGY = [
  { id:"fuel",           name:"Fuel (Gasoline)",  emoji:"⛽", tier:2, rarity:"common",   weight:5,  stackSize:200,producedBy:["refinery"], craftingStation:"chemical_plant", craftingRecipe:{ crude_oil:3 }, usedFor:["vehicles","engines","military"] },
  { id:"diesel",         name:"Diesel Fuel",      emoji:"🛢️", tier:2, rarity:"common",   weight:6,  stackSize:200,producedBy:["refinery"], craftingStation:"chemical_plant", craftingRecipe:{ crude_oil:3, catalyst:1 }, usedFor:["trucks","ships","generators"] },
  { id:"jet_fuel",       name:"Jet Fuel",         emoji:"✈️",  tier:3, rarity:"uncommon", weight:5,  stackSize:100,producedBy:["refinery"], craftingStation:"chemical_plant", craftingRecipe:{ crude_oil:4, kerosene:2 }, usedFor:["aircraft","missiles"] },
  { id:"uranium_fuel",   name:"Uranium Fuel Rod", emoji:"☢️",  tier:5, rarity:"legendary",weight:20, stackSize:10, producedBy:["research_lab"], craftingStation:"research_lab", craftingRecipe:{ uranium_ore:10, processing_agent:3 }, usedFor:["nuclear_reactor","nuclear_missile"] },
  { id:"coal_fuel",      name:"Coal Block",       emoji:"⬛", tier:1, rarity:"common",   weight:8,  stackSize:300,producedBy:["coal_mine"], craftingStation:"hand", craftingRecipe:{ coal:4 }, usedFor:["power_plant","forge","heating"] },
  { id:"solar_energy",   name:"Solar Cell",       emoji:"☀️",  tier:4, rarity:"uncommon", weight:2,  stackSize:50, producedBy:["electronics_lab"], craftingStation:"electronics_lab", craftingRecipe:{ silicon:4, copper_wire:3 }, usedFor:["solar_panel","spacecraft","base"] },
  { id:"battery_bank",   name:"Battery Bank",     emoji:"🔋", tier:4, rarity:"rare",     weight:50, stackSize:5,  producedBy:["advanced_factory"], craftingStation:"advanced_factory", craftingRecipe:{ lithium_battery:10, steel:5, wiring:8 }, usedFor:["city_power","military_base","factory"] },
].map(i => ({ ...i, category: "energy" }));

// ─────────────────────────────────────────────────────────────────────────────
// INFRASTRUCTURE (300)
// ─────────────────────────────────────────────────────────────────────────────
const INFRASTRUCTURE = [
  { id:"power_line",     name:"Power Line",       emoji:"⚡", tier:2, rarity:"common",   weight:3,  stackSize:200,producedBy:["factory"], craftingStation:"workshop", craftingRecipe:{ copper_wire:10, steel:3, insulation:4 }, usedFor:["city_power","buildings","grid"] },
  { id:"transformer",    name:"Transformer",      emoji:"⚡", tier:3, rarity:"uncommon", weight:50, stackSize:3,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ steel:10, copper_wire:20, insulation:8 }, usedFor:["power_grid","city","industrial"] },
  { id:"sewage_plant",   name:"Sewage Plant",     emoji:"🏭", tier:3, rarity:"uncommon", weight:1000,stackSize:1, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ concrete:30, steel:20, pump:5, pipe:20 }, usedFor:["sanitation","city","health"] },
  { id:"water_treatment",name:"Water Treatment Unit",emoji:"💧",tier:3,rarity:"uncommon",weight:500,stackSize:1, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ concrete:20, steel:15, chemical:5, filter:3 }, usedFor:["clean_water","city","health"] },
  { id:"internet_tower", name:"Cell Tower",       emoji:"📡", tier:4, rarity:"uncommon", weight:30, stackSize:3,  producedBy:["advanced_factory"], craftingStation:"electronics_lab", craftingRecipe:{ steel_beam:5, antenna:4, circuit_board:3 }, usedFor:["communication","city","economy"] },
  { id:"airport_section",name:"Airport Section",  emoji:"✈️",  tier:4, rarity:"rare",     weight:10000,stackSize:1,producedBy:["factory"],craftingStation:"factory", craftingRecipe:{ reinforced_concrete:50, steel_beam:30, asphalt:40, wiring:20 }, usedFor:["air_transport","trade","military"] },
  { id:"port_section",   name:"Port Section",     emoji:"⚓", tier:3, rarity:"rare",     weight:5000,stackSize:1, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ concrete:40, steel_beam:20, crane:1 }, usedFor:["shipping","trade","military"] },
  { id:"rail_track",     name:"Rail Track",       emoji:"🚂", tier:2, rarity:"common",   weight:15, stackSize:50, producedBy:["factory"], craftingStation:"forge", craftingRecipe:{ steel:5, concrete:2 }, usedFor:["trains","metro","logistics"] },
  { id:"highway",        name:"Highway Section",  emoji:"🛣️", tier:3, rarity:"uncommon", weight:100,stackSize:20, producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ asphalt:8, rebar:5, concrete:5 }, usedFor:["transport","economy","military"] },
  { id:"tunnel",         name:"Tunnel Section",   emoji:"🕳️", tier:3, rarity:"rare",     weight:500,stackSize:5,  producedBy:["factory"], craftingStation:"factory", craftingRecipe:{ reinforced_concrete:20, rebar:10, steel_beam:8 }, usedFor:["underground_transit","mountains","military"] },
].map(i => ({ ...i, category: "infrastructure" }));

// ─────────────────────────────────────────────────────────────────────────────
// CHEMICALS (items)
// ─────────────────────────────────────────────────────────────────────────────
const CHEMICALS = [
  { id:"acid",           name:"Sulfuric Acid",    emoji:"🧪", tier:2, rarity:"uncommon", weight:5,  stackSize:100,producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ sulfur:3, water:2 }, usedFor:["batteries","metal_processing","fertilizer"] },
  { id:"explosive",      name:"Explosive Compound",emoji:"💥",tier:2, rarity:"rare",     weight:5,  stackSize:50, producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ sulfur:5, charcoal:3, nitrate:3 }, usedFor:["weapons","mining","demolition"] },
  { id:"gunpowder",      name:"Gunpowder",        emoji:"💥", tier:2, rarity:"uncommon", weight:3,  stackSize:100,producedBy:["workshop"], craftingStation:"chemical_plant", craftingRecipe:{ sulfur:2, charcoal:3, saltpeter:1 }, usedFor:["firearms","cannons","fireworks"] },
  { id:"paint",          name:"Paint",            emoji:"🎨", tier:2, rarity:"common",   weight:2,  stackSize:100,producedBy:["factory"], craftingStation:"chemical_plant", craftingRecipe:{ chalk:3, crude_oil:2, dye:2 }, usedFor:["buildings","vehicles","art","happiness"] },
  { id:"lubricant",      name:"Machine Lubricant",emoji:"🛢️", tier:2, rarity:"common",   weight:3,  stackSize:100,producedBy:["refinery"], craftingStation:"chemical_plant", craftingRecipe:{ crude_oil:2 }, usedFor:["machinery","vehicles","maintenance"] },
  { id:"refrigerant",    name:"Refrigerant",      emoji:"❄️",  tier:3, rarity:"uncommon", weight:2,  stackSize:50, producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ fluorite:3, chemical:2 }, usedFor:["air_conditioner","refrigerator","industrial"] },
  { id:"adhesive",       name:"Industrial Adhesive",emoji:"🧴",tier:2, rarity:"common",  weight:2,  stackSize:100,producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ crude_oil:2, plastic:1 }, usedFor:["construction","manufacturing","repair"] },
  { id:"bleach",         name:"Bleach",           emoji:"🧴", tier:2, rarity:"common",   weight:2,  stackSize:100,producedBy:["chemical_plant"], craftingStation:"chemical_plant", craftingRecipe:{ salt:3, water:2 }, usedFor:["sanitation","clothing","medicine"] },
].map(i => ({ ...i, category: "chemicals" }));

// ─────────────────────────────────────────────────────────────────────────────
// TEXTILES (items)
// ─────────────────────────────────────────────────────────────────────────────
const TEXTILES = [
  { id:"uniform",        name:"Military Uniform", emoji:"👕", tier:2, rarity:"common",   weight:2,  stackSize:20, producedBy:["loom"], craftingStation:"loom", craftingRecipe:{ cloth:5, dye:2, button:4 }, usedFor:["military","morale","discipline"] },
  { id:"civilian_clothing",name:"Civilian Clothing",emoji:"👔",tier:1,rarity:"common",  weight:2,  stackSize:20, producedBy:["loom"], craftingStation:"loom", craftingRecipe:{ cloth:4, thread:3 }, usedFor:["population","happiness","economy"] },
  { id:"work_clothing",  name:"Work Clothing",    emoji:"🦺", tier:2, rarity:"common",   weight:3,  stackSize:10, producedBy:["loom"], craftingStation:"loom", craftingRecipe:{ cloth:5, rubber:1 }, usedFor:["workers","safety","industry"] },
  { id:"tent",           name:"Military Tent",    emoji:"⛺", tier:2, rarity:"common",   weight:5,  stackSize:10, producedBy:["loom"], craftingStation:"workbench", craftingRecipe:{ cloth:8, rope:4, metal_pole:2 }, usedFor:["military","expedition","disaster_relief"] },
  { id:"flag",           name:"Nation Flag",      emoji:"🏴", tier:1, rarity:"common",   weight:1,  stackSize:20, producedBy:["loom"], craftingStation:"loom", craftingRecipe:{ cloth:3, dye:2, rope:1 }, usedFor:["identity","morale","diplomacy"] },
  { id:"parachute",      name:"Parachute",        emoji:"🪂", tier:3, rarity:"uncommon", weight:3,  stackSize:5,  producedBy:["factory"], craftingStation:"workshop", craftingRecipe:{ fiber:10, nylon:5, harness:2 }, usedFor:["airborne","military","rescue"] },
  { id:"kevlar",         name:"Kevlar Fabric",    emoji:"🛡️", tier:4, rarity:"rare",     weight:2,  stackSize:20, producedBy:["advanced_factory"], craftingStation:"factory", craftingRecipe:{ fiber:8, chemical:3 }, usedFor:["body_armor","vehicles","bulletproof"] },
].map(i => ({ ...i, category: "textiles" }));

// ─────────────────────────────────────────────────────────────────────────────
// MISCELLANEOUS (200)
// ─────────────────────────────────────────────────────────────────────────────
const MISC = [
  { id:"coin",           name:"Currency Coin",    emoji:"🪙", tier:1, rarity:"common",   weight:1,  stackSize:1000,producedBy:["forge"],craftingStation:"forge", craftingRecipe:{ gold_ingot:1 }, usedFor:["trade","economy","diplomacy"] },
  { id:"book",           name:"Book",             emoji:"📚", tier:1, rarity:"common",   weight:1,  stackSize:50, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ paper:10, leather:1 }, usedFor:["education","research","happiness"] },
  { id:"map",            name:"Map",              emoji:"🗺️", tier:1, rarity:"uncommon", weight:1,  stackSize:20, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ paper:5, ink:2 }, usedFor:["navigation","exploration","military"] },
  { id:"currency_note",  name:"Currency Note",    emoji:"💵", tier:2, rarity:"common",   weight:1,  stackSize:1000,producedBy:["government"],craftingStation:"workbench", craftingRecipe:{ paper:2, ink:2, security_print:1 }, usedFor:["trade","economy","banking"] },
  { id:"trophy",         name:"Trophy",           emoji:"🏆", tier:2, rarity:"uncommon", weight:5,  stackSize:5,  producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ gold_ingot:1, stone_block:1 }, usedFor:["prestige","happiness","culture"] },
  { id:"jewel",          name:"Jewel",            emoji:"💎", tier:3, rarity:"epic",     weight:1,  stackSize:20, producedBy:["workshop"], craftingStation:"workshop", craftingRecipe:{ gold_ingot:2, diamond:1 }, usedFor:["luxury","trade","happiness"] },
  { id:"artwork",        name:"Artwork",          emoji:"🎨", tier:2, rarity:"rare",     weight:3,  stackSize:5,  producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ paint:3, canvas:2 }, usedFor:["culture","happiness","tourism"] },
  { id:"tent_camp",      name:"Refugee Tent",     emoji:"⛺", tier:1, rarity:"common",   weight:4,  stackSize:20, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ cloth:6, rope:3 }, usedFor:["disaster_relief","military","expedition"] },
  { id:"crate",          name:"Shipping Crate",   emoji:"📦", tier:1, rarity:"common",   weight:10, stackSize:20, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:6, nail:10 }, usedFor:["logistics","storage","trade"] },
  { id:"barrel",         name:"Storage Barrel",   emoji:"🪣", tier:1, rarity:"common",   weight:5,  stackSize:20, producedBy:["workshop"], craftingStation:"workbench", craftingRecipe:{ plank:8, iron_ingot:2 }, usedFor:["storage","brewing","trade"] },
].map(i => ({ ...i, category: "misc" }));

// ─────────────────────────────────────────────────────────────────────────────
// MASTER REGISTRY — base items (extra items merged below)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_ITEMS_proto = [
  ...RAW_RESOURCES,
  ...REFINED_MATERIALS,
  ...TOOLS,
  ...CONSTRUCTION,
  ...HOUSEHOLD,
  ...FURNITURE,
  ...INDUSTRIAL,
  ...VEHICLES,
  ...MILITARY,
  ...ELECTRONICS,
  ...MEDICAL,
  ...AGRICULTURE,
  ...FOOD,
  ...ENERGY,
  ...INFRASTRUCTURE,
  ...CHEMICALS,
  ...TEXTILES,
  ...MISC,
];

// Merge extra items
const _ALL = [...ALL_ITEMS_proto, ...ALL_ITEMS_EXTRA];
// De-duplicate by id (base wins)
const _seen = new Set();
export const ALL_ITEMS = _ALL.filter(i => { if (_seen.has(i.id)) return false; _seen.add(i.id); return true; });

// Quick lookup map
export const ITEM_MAP = Object.fromEntries(ALL_ITEMS.map(i => [i.id, i]));

export function getItem(id) { return ITEM_MAP[id]; }
export function getItemsByCategory(cat) { return ALL_ITEMS.filter(i => i.category === cat); }
export function getItemsByTier(tier) { return ALL_ITEMS.filter(i => i.tier === tier); }
export function getItemsByRarity(rarity) { return ALL_ITEMS.filter(i => i.rarity === rarity); }
export function searchItems(query, filters = {}) {
  let results = ALL_ITEMS;
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.id.includes(q) ||
      (i.usedFor || []).some(u => u.toLowerCase().includes(q))
    );
  }
  if (filters.category) results = results.filter(i => i.category === filters.category);
  if (filters.tier)     results = results.filter(i => i.tier === filters.tier);
  if (filters.rarity)   results = results.filter(i => i.rarity === filters.rarity);
  if (filters.station)  results = results.filter(i => i.craftingStation === filters.station);
  return results;
}