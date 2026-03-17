/**
 * UtilityConfig — Power & water system constants for island management.
 */

export const POWER_OUTPUT = {
  wind_turbine_gen: 25,
  solar_array_gen:  40,
  coal_plant_gen:  100,
  water_wheel_gen:  15,
  nuclear_gen:     500,
};

export const POWER_CONSUMPTION = {
  mine: 10, lumber_mill: 8, oil_rig: 12, refinery: 15,
  farm: 5, housing: 2, hospital: 10, school: 6,
  fort: 5, naval_base: 15, barracks: 8, radar: 12,
  market: 3, trade_port: 5, bank: 4, warehouse: 4, dock: 3,
};

export const WATER_OUTPUT = {
  freshwater_well: 20,
  water_pump_inf:  50,
  reservoir_inf:  100,
};

export const WATER_CONSUMPTION = {
  farm: 5, hospital: 15, school: 5,
  housing: 3, oil_rig: 8, refinery: 20,
};

export const UTILITY_BUILDINGS = [
  { id:"wind_turbine_gen", label:"Wind Turbine",      emoji:"💨", cat:"utility", cost:600,  desc:"+25 power",  power:25,  water:0,  terrain:null },
  { id:"solar_array_gen",  label:"Solar Array",        emoji:"☀️", cat:"utility", cost:1200, desc:"+40 power",  power:40,  water:0,  terrain:null },
  { id:"coal_plant_gen",   label:"Coal Power Plant",   emoji:"🏭", cat:"utility", cost:2000, desc:"+100 power", power:100, water:0,  terrain:null },
  { id:"freshwater_well",  label:"Freshwater Well",    emoji:"💧", cat:"utility", cost:400,  desc:"+20 water",  power:0,   water:20, terrain:null },
  { id:"water_pump_inf",   label:"Water Pump Station", emoji:"🚰", cat:"utility", cost:800,  desc:"+50 water",  power:0,   water:50, terrain:null },
  { id:"reservoir_inf",    label:"Reservoir",          emoji:"🏞️", cat:"utility", cost:1500, desc:"+100 water", power:0,   water:100,terrain:null },
];

export function computePower(buildings = []) {
  let gen = 0, use = 0;
  for (const b of buildings) {
    gen += POWER_OUTPUT[b] || 0;
    use += POWER_CONSUMPTION[b] || 0;
  }
  const surplus = gen - use;
  const status = gen === 0 && use === 0 ? "idle"
    : gen >= use ? (surplus < 15 ? "warning" : "ok")
    : "shortage";
  return { gen, use, surplus, status };
}

export function computeWater(buildings = []) {
  let gen = 0, use = 0;
  for (const b of buildings) {
    gen += WATER_OUTPUT[b] || 0;
    use += WATER_CONSUMPTION[b] || 0;
  }
  const surplus = gen - use;
  const status = gen === 0 && use === 0 ? "idle"
    : gen >= use ? (surplus < 5 ? "warning" : "ok")
    : "shortage";
  return { gen, use, surplus, status };
}

export const UTILITY_COLORS = {
  ok: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/25" },
  warning: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25" },
  shortage: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
  idle: { text: "text-slate-400", bg: "bg-white/5", border: "border-white/10" },
};