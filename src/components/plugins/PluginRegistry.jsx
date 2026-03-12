/**
 * Epoch Nations — Plugin Registry
 * ════════════════════════════════════════════════════════════════════
 * All plugins are registered here. Community developers submit PRs
 * that ONLY add entries to this file and add their plugin folder
 * under components/plugins/community/.
 *
 * DO NOT modify core engine files in plugin submissions.
 * ════════════════════════════════════════════════════════════════════
 *
 * HOW TO ADD YOUR PLUGIN:
 *   1. Create your plugin folder: components/plugins/community/your-plugin/
 *   2. Add plugin.json and index.js to that folder
 *   3. Import your plugin below and add it to the PLUGINS array
 *   4. Submit a Pull Request — only /plugins changes are accepted
 */

// ── Built-in example plugins ──────────────────────────────────────────────────
import { initSolarEnergyPlugin } from "./buildings/solar-energy/index";
import { initSpanishPlugin } from "./languages/spanish/index";

// ── Community plugins (add yours here) ───────────────────────────────────────
// import { initMyPlugin } from "./community/my-plugin/index";

/**
 * PLUGINS array — each entry is { manifest, initFn }
 * Manifests are inlined here to avoid JSON import issues with Vite.
 * The PluginLoader processes this list on app startup.
 */
export const PLUGINS = [
  {
    manifest: {
      name: "Solar Energy Plant",
      version: "1.0.0",
      author: "EpochNations-Community",
      description: "Adds a Solar Energy Plant building that produces 50 energy per tick.",
      gameVersion: "0.1",
      type: "building",
      entry: "index.js",
      tags: ["energy", "green", "industrial"],
    },
    initFn: initSolarEnergyPlugin,
  },
  {
    manifest: {
      name: "Spanish Language Pack",
      version: "1.0.0",
      author: "EpochNations-Community",
      description: "Adds Spanish (Español) translations for all core game strings.",
      gameVersion: "0.1",
      type: "language",
      entry: "index.js",
      tags: ["language", "i18n", "español"],
    },
    initFn: initSpanishPlugin,
  },

  // Community plugins — add yours here:
  // { manifest: { name: "...", version: "1.0.0", author: "...", gameVersion: "0.1", type: "building", entry: "index.js" }, initFn: initMyPlugin },
];

export default PLUGINS;