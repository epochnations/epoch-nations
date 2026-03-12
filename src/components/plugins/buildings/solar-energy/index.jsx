/**
 * Solar Energy Plant — Example Building Plugin
 * ════════════════════════════════════════════════════════════════════
 * Demonstrates how to register a new building using the GameAPI.
 * This plugin only interacts with the game through the API proxy.
 * ════════════════════════════════════════════════════════════════════
 *
 * @param {Object} api - Sandboxed GameAPI proxy (provided by PluginLoader)
 */
export function initSolarEnergyPlugin(api) {
  // Register the Solar Energy Plant building
  api.registerBuilding({
    id: "solar_energy_plant",
    name: "Solar Energy Plant",
    emoji: "☀️",
    category: "civilian",
    epoch_required: "Industrial Age",
    cost: {
      stone: 200,
      iron: 150,
      gold: 50,
    },
    workers: 3,
    benefit: "Produces 50 energy per tick. Reduces pollution by 10. Boosts GDP by 0.5%.",
    productionPerTick: {
      energy: 50,
    },
    effects: {
      pollution_reduction: 10,
      gdp_bonus_pct: 0.5,
    },
    description:
      "A large array of photovoltaic panels that harness solar energy for your nation. " +
      "Environmentally friendly and cost-effective in the long run.",
  });

  // Also register a companion economy rule: solar reduces oil consumption
  api.registerEconomyRule({
    id: "solar_energy_oil_reduction",
    description: "Each Solar Energy Plant reduces oil consumption by 5 units per tick.",
    apply: (nation) => {
      // nation is frozen — return a patch object with delta values
      // In a real integration, count the buildings; here we apply a flat bonus
      const solarCount = 1; // simplified for example
      return {
        res_oil_consumption_reduction: solarCount * 5,
      };
    },
  });
}