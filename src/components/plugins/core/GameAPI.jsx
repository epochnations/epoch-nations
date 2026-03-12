/**
 * Epoch Nations — GameAPI v1.0
 * ════════════════════════════════════════════════════════════════════
 * The ONLY interface plugins may use to interact with the game.
 * Plugins must NEVER access window, document, fetch, localStorage,
 * or any game internals directly. Violations disable the plugin.
 * ════════════════════════════════════════════════════════════════════
 */

class GameAPI {
  constructor() {
    this._buildings     = new Map();
    this._resources     = new Map();
    this._uiComponents  = new Map();
    this._languages     = new Map();
    this._researchTrees = new Map();
    this._economyRules  = new Map();
    this._events        = new Map();
    this._nationDataFn  = null;
    this._listeners     = {};
    this._version       = "1.0.0";
    this._gameVersion   = "0.1";
  }

  // ── Host Injection (game engine only, not plugins) ────────────────────────
  _setNationDataProvider(fn) { this._nationDataFn = fn; }
  _getGameVersion()          { return this._gameVersion; }
  _emit(event, payload)      { (this._listeners[event] || []).forEach(fn => fn(payload)); }

  // ═════════════════════════════════════════════════════════════════════════
  // PLUGIN REGISTRATION API
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Register a new building type.
   * @param {Object} config
   *   Required: id, name, category
   *   Optional: epoch_required, cost {wood,stone,gold,iron,oil}, workers,
   *             benefit (description), emoji, productionPerTick {resource: amount}
   */
  registerBuilding(config) {
    _assertRequired(config, ["id", "name", "category"]);
    if (this._buildings.has(config.id)) {
      console.warn(`[GameAPI] Building "${config.id}" already registered — skipping.`);
      return false;
    }
    const building = {
      emoji: "🏗️",
      category: "civilian",
      epoch_required: "Stone Age",
      cost: {},
      workers: 0,
      benefit: "",
      productionPerTick: {},
      ...config,
      _plugin: true,
    };
    this._buildings.set(config.id, building);
    this._emit("building:registered", building);
    console.info(`[GameAPI] ✅ Building registered: ${config.name}`);
    return true;
  }

  /**
   * Register a new resource type.
   * @param {Object} config
   *   Required: id, name, emoji
   *   Optional: color (#hex), baseValue (credits), description
   */
  registerResource(config) {
    _assertRequired(config, ["id", "name", "emoji"]);
    if (this._resources.has(config.id)) {
      console.warn(`[GameAPI] Resource "${config.id}" already registered — skipping.`);
      return false;
    }
    const resource = {
      color: "#94a3b8",
      baseValue: 10,
      description: "",
      ...config,
      _plugin: true,
    };
    this._resources.set(config.id, resource);
    this._emit("resource:registered", resource);
    console.info(`[GameAPI] ✅ Resource registered: ${config.name}`);
    return true;
  }

  /**
   * Register a custom React UI component into a named slot.
   * @param {Object} config
   *   Required: id, slot, component (React component)
   *   Slots: "dashboard.sidebar" | "dashboard.header" | "exchange.panel" | "construction.tab"
   */
  registerUIComponent(config) {
    _assertRequired(config, ["id", "slot", "component"]);
    const VALID_SLOTS = ["dashboard.sidebar", "dashboard.header", "exchange.panel", "construction.tab", "profile.panel"];
    if (!VALID_SLOTS.includes(config.slot)) {
      console.warn(`[GameAPI] Unknown UI slot "${config.slot}". Valid: ${VALID_SLOTS.join(", ")}`);
      return false;
    }
    if (!this._uiComponents.has(config.slot)) this._uiComponents.set(config.slot, []);
    this._uiComponents.get(config.slot).push({ ...config, _plugin: true });
    this._emit("ui:registered", config);
    return true;
  }

  /**
   * Register a language / translation pack.
   * @param {Object} config
   *   Required: id, locale (e.g. "es"), strings { key: "translation" }
   *   Optional: displayName, flag emoji
   */
  registerLanguage(config) {
    _assertRequired(config, ["id", "locale", "strings"]);
    this._languages.set(config.locale, {
      displayName: config.locale,
      flag: "🌐",
      ...config,
      _plugin: true,
    });
    this._emit("language:registered", config);
    console.info(`[GameAPI] ✅ Language registered: ${config.locale}`);
    return true;
  }

  /**
   * Register a custom research tree branch.
   * @param {Object} config
   *   Required: id, branch (name), nodes: [{ id, name, cost, effect, description }]
   */
  registerResearchTree(config) {
    _assertRequired(config, ["id", "branch", "nodes"]);
    if (!Array.isArray(config.nodes) || config.nodes.length === 0)
      throw new Error("[GameAPI] ResearchTree.nodes must be a non-empty array.");
    this._researchTrees.set(config.id, { ...config, _plugin: true });
    this._emit("research:registered", config);
    console.info(`[GameAPI] ✅ Research tree registered: ${config.branch}`);
    return true;
  }

  /**
   * Register a custom economy rule applied each tick.
   * @param {Object} config
   *   Required: id, description, apply: (nationSnapshot) => patchObject
   *   The apply function receives a frozen nation snapshot and returns
   *   a partial patch object (e.g. { currency: +5 }).
   */
  registerEconomyRule(config) {
    _assertRequired(config, ["id", "description", "apply"]);
    if (typeof config.apply !== "function")
      throw new Error("[GameAPI] EconomyRule.apply must be a function.");
    this._economyRules.set(config.id, { ...config, _plugin: true });
    this._emit("economy:registered", config);
    console.info(`[GameAPI] ✅ Economy rule registered: ${config.id}`);
    return true;
  }

  /**
   * Register a custom game event.
   * @param {Object} config
   *   Required: id, title, trigger: (nation) => boolean, effect: (nation) => patchObject
   *   Optional: description, severity ("info"|"warning"|"critical")
   */
  registerEvent(config) {
    _assertRequired(config, ["id", "title", "trigger", "effect"]);
    if (typeof config.trigger !== "function") throw new Error("[GameAPI] Event.trigger must be a function.");
    if (typeof config.effect  !== "function") throw new Error("[GameAPI] Event.effect must be a function.");
    this._events.set(config.id, { severity: "info", description: "", ...config, _plugin: true });
    this._emit("event:registered", config);
    console.info(`[GameAPI] ✅ Event registered: ${config.title}`);
    return true;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // DATA ACCESS (read-only)
  // ═════════════════════════════════════════════════════════════════════════

  /** Returns a frozen (read-only) snapshot of the current player's nation. */
  getNationData() {
    if (!this._nationDataFn) return null;
    const data = this._nationDataFn();
    return data ? Object.freeze({ ...data }) : null;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // QUERY HELPERS
  // ═════════════════════════════════════════════════════════════════════════

  getRegisteredBuildings()  { return [...this._buildings.values()]; }
  getRegisteredResources()  { return [...this._resources.values()]; }
  getRegisteredLanguages()  { return [...this._languages.values()]; }
  getUIComponents(slot)     { return this._uiComponents.get(slot) || []; }
  getEconomyRules()         { return [...this._economyRules.values()]; }
  getEvents()               { return [...this._events.values()]; }
  getResearchTrees()        { return [...this._researchTrees.values()]; }

  /** Translate a key using the given locale, falls back to key itself. */
  translate(key, locale = "en") {
    const pack = this._languages.get(locale);
    return pack?.strings?.[key] ?? key;
  }

  // ── Event Bus ──────────────────────────────────────────────────────────────
  on(event, fn)  {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  off(event, fn) {
    if (this._listeners[event])
      this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function _assertRequired(obj, keys) {
  for (const k of keys) {
    if (obj[k] === undefined || obj[k] === null)
      throw new Error(`[GameAPI] Missing required field: "${k}"`);
  }
}

// Singleton — import this everywhere
export const gameAPI = new GameAPI();
export default gameAPI;