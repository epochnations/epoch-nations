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
import solarEnergyManifest from "./buildings/solar-energy/plugin.json";
import { initSolarEnergyPlugin } from "./buildings/solar-energy/index";

import spanishLanguageManifest from "./languages/spanish/plugin.json";
import { initSpanishPlugin } from "./languages/spanish/index";

// ── Community plugins (add yours here) ───────────────────────────────────────
// import myPluginManifest from "./community/my-plugin/plugin.json";
// import { initMyPlugin } from "./community/my-plugin/index";

/**
 * PLUGINS array — each entry is { manifest, initFn }
 * The PluginLoader processes this list on app startup.
 */
export const PLUGINS = [
  // Built-in examples (can be removed)
  { manifest: solarEnergyManifest, initFn: initSolarEnergyPlugin },
  { manifest: spanishLanguageManifest, initFn: initSpanishPlugin },

  // Community plugins
  // { manifest: myPluginManifest, initFn: initMyPlugin },
];

export default PLUGINS;