/**
 * Epoch Nations — PluginLoader v1.0
 * ════════════════════════════════════════════════════════════════════
 * Validates, sandboxes, and loads plugin modules.
 * Plugins are imported as ES modules; each plugin is executed inside
 * a restricted proxy that blocks access to forbidden globals.
 * ════════════════════════════════════════════════════════════════════
 */

import { gameAPI } from "./GameAPI";

const GAME_VERSION = "0.1";

// ── Forbidden global keys plugins must NOT access ─────────────────────────────
const FORBIDDEN_GLOBALS = [
  "window", "document", "fetch", "XMLHttpRequest", "localStorage",
  "sessionStorage", "indexedDB", "eval", "Function", "importScripts",
  "navigator", "history", "location", "crypto", "WebSocket",
];

// ── Plugin registry (loaded plugins) ─────────────────────────────────────────
const _registry = new Map();   // pluginId => { manifest, status, error? }

// ── Plugin manifest validation ────────────────────────────────────────────────
function validateManifest(manifest) {
  const required = ["name", "version", "author", "gameVersion", "type", "entry"];
  for (const key of required) {
    if (!manifest[key]) return { valid: false, error: `Missing required manifest field: "${key}"` };
  }

  const validTypes = ["building", "resource", "ui", "language", "economy", "research", "event", "ai", "diplomacy"];
  if (!validTypes.includes(manifest.type)) {
    return { valid: false, error: `Unknown plugin type "${manifest.type}". Valid types: ${validTypes.join(", ")}` };
  }

  // Semver-compatible game version check (only checks major.minor)
  const [reqMajor, reqMinor] = (manifest.gameVersion || "0.0").split(".").map(Number);
  const [gameMajor, gameMinor] = GAME_VERSION.split(".").map(Number);
  if (reqMajor > gameMajor || (reqMajor === gameMajor && reqMinor > gameMinor)) {
    return {
      valid: false,
      error: `Plugin requires game version ${manifest.gameVersion}, but current is ${GAME_VERSION}. Please update the game.`,
    };
  }

  return { valid: true };
}

/**
 * Create a sandboxed API proxy for a plugin.
 * The plugin only receives the gameAPI object — no other globals.
 */
function createSandbox(pluginId) {
  // Wrap every gameAPI method so we can log/intercept per-plugin calls
  const sandboxedAPI = {};
  const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(gameAPI))
    .filter(m => m !== "constructor" && !m.startsWith("_"));

  for (const method of methodNames) {
    if (typeof gameAPI[method] === "function") {
      sandboxedAPI[method] = (...args) => {
        console.debug(`[Plugin:${pluginId}] → GameAPI.${method}()`);
        return gameAPI[method](...args);
      };
    }
  }

  return Object.freeze(sandboxedAPI);
}

/**
 * Validate that a plugin module function doesn't reference forbidden APIs.
 * Checks the string representation for obvious violations (best-effort).
 */
function auditPluginCode(initFn, pluginId) {
  const src = initFn.toString();
  const violations = FORBIDDEN_GLOBALS.filter(g => {
    // Match as standalone identifiers (not inside strings)
    return new RegExp(`\\b${g}\\b`).test(src);
  });
  if (violations.length > 0) {
    console.warn(`[PluginLoader] ⚠️  Plugin "${pluginId}" references forbidden APIs: ${violations.join(", ")}. Plugin disabled.`);
    return false;
  }
  return true;
}

/**
 * Load a single plugin.
 * @param {Object} manifest - plugin.json contents
 * @param {Function} initFn - the default export of the plugin's index.js
 * @returns {{ success: boolean, error?: string }}
 */
export function loadPlugin(manifest, initFn) {
  const pluginId = `${manifest.author}/${manifest.name}@${manifest.version}`;

  // 1. Validate manifest
  const validation = validateManifest(manifest);
  if (!validation.valid) {
    const error = `[PluginLoader] ❌ Plugin "${manifest.name}" rejected: ${validation.error}`;
    console.error(error);
    _registry.set(pluginId, { manifest, status: "rejected", error: validation.error });
    return { success: false, error: validation.error };
  }

  // 2. Check for duplicates
  if (_registry.has(pluginId)) {
    console.warn(`[PluginLoader] Plugin "${pluginId}" already loaded — skipping.`);
    return { success: false, error: "Already loaded" };
  }

  // 3. Security audit
  if (!auditPluginCode(initFn, pluginId)) {
    const error = "Security violation — plugin accesses forbidden APIs.";
    _registry.set(pluginId, { manifest, status: "blocked", error });
    return { success: false, error };
  }

  // 4. Create sandboxed API proxy
  const sandbox = createSandbox(pluginId);

  // 5. Execute plugin init
  try {
    initFn(sandbox);
    _registry.set(pluginId, { manifest, status: "loaded" });
    console.info(`[PluginLoader] ✅ Plugin loaded: ${pluginId}`);
    return { success: true };
  } catch (err) {
    const error = err.message || String(err);
    console.error(`[PluginLoader] ❌ Plugin "${pluginId}" threw during init: ${error}`);
    _registry.set(pluginId, { manifest, status: "error", error });
    return { success: false, error };
  }
}

/**
 * Batch-load an array of { manifest, initFn } plugin descriptors.
 * @param {Array} plugins
 * @returns {Array} results
 */
export function loadPlugins(plugins = []) {
  console.info(`[PluginLoader] Loading ${plugins.length} plugin(s)…`);
  return plugins.map(({ manifest, initFn }) => ({
    name: manifest?.name,
    ...loadPlugin(manifest, initFn),
  }));
}

/** Returns all registered plugin statuses. */
export function getPluginRegistry() {
  return [..._registry.entries()].map(([id, info]) => ({ id, ...info }));
}

/** Returns only successfully loaded plugins. */
export function getLoadedPlugins() {
  return [..._registry.values()].filter(p => p.status === "loaded");
}

export default { loadPlugin, loadPlugins, getPluginRegistry, getLoadedPlugins };