/**
 * Epoch Nations Plugin SDK — Template
 * ════════════════════════════════════════════════════════════════════
 * Replace this file with your plugin logic.
 *
 * Rules:
 *   ✅ Use only the `api` parameter to interact with the game
 *   ✅ Register your content via api.registerBuilding(), etc.
 *   ❌ Never access window, document, fetch, localStorage
 *   ❌ Never import from game internals
 *
 * Plugin Types and their primary registration method:
 *   building   → api.registerBuilding(config)
 *   resource   → api.registerResource(config)
 *   ui         → api.registerUIComponent(config)
 *   language   → api.registerLanguage(config)
 *   economy    → api.registerEconomyRule(config)
 *   research   → api.registerResearchTree(config)
 *   event      → api.registerEvent(config)
 *
 * @param {Object} api - Sandboxed GameAPI (provided by PluginLoader, do NOT import directly)
 */
export function init(api) {
  // ── EXAMPLE: Register a building ──────────────────────────────────────────
  api.registerBuilding({
    id: "my_unique_building_id",   // must be globally unique
    name: "My Building",
    emoji: "🏗️",
    category: "civilian",          // civilian | military | government
    epoch_required: "Stone Age",
    cost: {
      wood: 100,
      stone: 50,
    },
    workers: 2,
    benefit: "Describe what this building does for the nation.",
    productionPerTick: {
      // resource_key: amount_per_tick
    },
  });

  // ── EXAMPLE: Register a resource ──────────────────────────────────────────
  // api.registerResource({
  //   id: "my_resource",
  //   name: "My Resource",
  //   emoji: "💎",
  //   color: "#a78bfa",
  //   baseValue: 20,
  //   description: "A rare material found only in the highlands.",
  // });

  // ── EXAMPLE: Register a custom event ──────────────────────────────────────
  // api.registerEvent({
  //   id: "my_custom_event",
  //   title: "Ancient Discovery",
  //   description: "Archaeologists uncover ancient ruins!",
  //   severity: "opportunity",
  //   trigger: (nation) => nation.tech_level >= 3 && Math.random() < 0.01,
  //   effect: (nation) => ({ tech_points: (nation.tech_points || 0) + 50 }),
  // });
}