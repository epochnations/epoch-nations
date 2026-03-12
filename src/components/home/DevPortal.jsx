import { useState } from "react";
import {
  Code2, Package, Cpu, Globe, FlaskConical, Zap, TrendingUp,
  Layers, Shield, CheckCircle, XCircle, Copy, ChevronDown,
  ChevronRight, BookOpen, GitBranch, Terminal, Puzzle, Palette,
  AlertTriangle
} from "lucide-react";

// ── Code Block ────────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = "js" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="relative rounded-xl overflow-hidden text-xs"
      style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[10px] font-bold text-slate-500 ep-mono uppercase">{lang}</span>
        <button onClick={copy}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-400 transition-colors">
          {copied ? <><CheckCircle size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto ep-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre">{code.trim()}</pre>
    </div>
  );
}

// ── Accordion Item ─────────────────────────────────────────────────────────────
function Accordion({ title, icon: Icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}22` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:opacity-90"
        style={{ background: open ? `${color}10` : "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-3">
          <Icon size={16} style={{ color }} />
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronDown size={15} className="text-slate-500" /> : <ChevronRight size={15} className="text-slate-600" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4" style={{ background: "rgba(0,0,0,0.2)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const PLUGIN_TYPES = [
  { type: "building",  color: "#fbbf24", icon: "🏗️",  label: "Building",      desc: "Add new constructible structures with costs, workers, and production output." },
  { type: "resource",  color: "#22d3ee", icon: "💎",  label: "Resource",       desc: "Define new tradeable commodities with custom colors and base values." },
  { type: "language",  color: "#4ade80", icon: "🌐",  label: "Language Pack",  desc: "Translate the entire game UI into any language." },
  { type: "economy",   color: "#f97316", icon: "📊",  label: "Economy Rule",   desc: "Hook into the per-tick economy engine to apply custom financial logic." },
  { type: "research",  color: "#a78bfa", icon: "🔬",  label: "Research Tree",  desc: "Add custom tech branches with unlockable nodes and effects." },
  { type: "event",     color: "#f87171", icon: "⚡",  label: "Game Event",     desc: "Define world events with probabilistic triggers and nation-level effects." },
  { type: "ui",        color: "#818cf8", icon: "🎨",  label: "UI Component",   desc: "Inject React components into named dashboard slots." },
  { type: "ai",        color: "#06b6d4", icon: "🤖",  label: "AI Strategy",    desc: "Define custom AI civilization behavior and decision-making profiles." },
];

const MANIFEST_FIELDS = [
  { field: "name",        req: true,  desc: "Human-readable plugin name" },
  { field: "version",     req: true,  desc: "Semver string — e.g. 1.0.0" },
  { field: "author",      req: true,  desc: "Your name or GitHub handle" },
  { field: "description", req: true,  desc: "What the plugin does" },
  { field: "gameVersion", req: true,  desc: "Min Epoch Nations version required (e.g. 0.1)" },
  { field: "type",        req: true,  desc: "building | resource | ui | language | economy | research | event | ai | diplomacy" },
  { field: "entry",       req: true,  desc: "Entry file — always index.js" },
  { field: "tags",        req: false, desc: "Optional array of keyword strings" },
];

const SECURITY_RULES = [
  { allowed: true,  item: "api.* methods (all GameAPI methods)" },
  { allowed: true,  item: "Pure JavaScript logic & Math" },
  { allowed: true,  item: "console.log() for debugging" },
  { allowed: true,  item: "Return patch objects from apply/effect functions" },
  { allowed: false, item: "window.* / document.*" },
  { allowed: false, item: "fetch() / XMLHttpRequest / WebSocket" },
  { allowed: false, item: "localStorage / sessionStorage / indexedDB" },
  { allowed: false, item: "eval() / new Function() / importScripts" },
  { allowed: false, item: "navigator / location / history / crypto" },
  { allowed: false, item: "Direct imports of game entity files" },
];

const API_METHODS = [
  // Registration
  { method: "api.registerBuilding(config)",          returns: "boolean",       desc: "Register a new building type with costs, workers & production" },
  { method: "api.registerResource(config)",          returns: "boolean",       desc: "Register a new tradeable resource/commodity" },
  { method: "api.registerLanguage(config)",          returns: "boolean",       desc: "Register a full UI translation pack" },
  { method: "api.registerEconomyRule(config)",       returns: "boolean",       desc: "Register a per-tick economy hook applied to every nation" },
  { method: "api.registerResearchTree(config)",      returns: "boolean",       desc: "Register a custom tech branch with prerequisite chains" },
  { method: "api.registerEvent(config)",             returns: "boolean",       desc: "Register a probabilistic world event with trigger + effect" },
  { method: "api.registerUIComponent(config)",       returns: "boolean",       desc: "Inject a React component into a named dashboard slot" },
  { method: "api.registerDiplomacyAction(config)",   returns: "boolean",       desc: "Add a custom diplomacy option to the diplomatic actions menu" },
  { method: "api.registerAIStrategy(config)",        returns: "boolean",       desc: "Define custom AI civilization behaviour and decision weights" },
  { method: "api.registerMapOverlay(config)",        returns: "boolean",       desc: "Add a custom overlay layer to the world map" },
  { method: "api.registerNewsTemplate(config)",      returns: "boolean",       desc: "Add custom article templates to the news engine" },
  { method: "api.registerPolicy(config)",            returns: "boolean",       desc: "Add a toggleable national policy with per-tick effects" },
  { method: "api.registerMilestone(config)",         returns: "boolean",       desc: "Define a civilization achievement milestone and reward" },
  { method: "api.registerTradeGood(config)",         returns: "boolean",       desc: "Register a tradeable good for the global commodity market" },
  // Data Access
  { method: "api.getNationData()",                   returns: "Object (frozen)", desc: "Read-only snapshot of the current player's nation" },
  { method: "api.getAllNations()",                   returns: "Array (frozen)", desc: "Read-only array of all active nations in the world" },
  { method: "api.getRegisteredBuildings()",          returns: "Array",         desc: "List all buildings — core engine + all loaded plugins" },
  { method: "api.getRegisteredResources()",          returns: "Array",         desc: "List all resources — core + plugin-defined" },
  { method: "api.getRegisteredEvents()",             returns: "Array",         desc: "List all registered game events" },
  { method: "api.getRegisteredResearchTrees()",      returns: "Array",         desc: "List all research branches including plugin ones" },
  { method: "api.getRegisteredPolicies()",           returns: "Array",         desc: "List all toggleable national policies" },
  { method: "api.getGlobalMarketPrices()",           returns: "Object",        desc: "Current commodity prices from the global market" },
  { method: "api.getWorldChronicle(limit?)",         returns: "Array",         desc: "Recent world chronicle entries — pass limit (default 20)" },
  { method: "api.getNationBuildings(nationId?)",     returns: "Array",         desc: "Buildings owned by a nation (defaults to current player)" },
  { method: "api.getResearchProgress(nationId?)",    returns: "Object",        desc: "Research progress map keyed by tech_id" },
  { method: "api.getStockHoldings(nationId?)",       returns: "Array",         desc: "Stock holdings for a nation" },
  { method: "api.getActiveLoans(nationId?)",         returns: "Array",         desc: "Active loans for a nation" },
  { method: "api.getTradeRoutes(nationId?)",         returns: "Array",         desc: "Active trade routes for a nation" },
  { method: "api.getDiplomacyStatus(a, b)",          returns: "string",        desc: "Diplomacy state between two nation IDs: allied | war | neutral" },
  // Utilities
  { method: "api.translate(key, locale?)",           returns: "string",        desc: "Translate a key via registered language packs" },
  { method: "api.formatCurrency(amount, nationId?)", returns: "string",        desc: "Format a number using a nation's currency name" },
  { method: "api.formatResource(key, amount)",       returns: "string",        desc: "Format a resource amount with its emoji and label" },
  { method: "api.getEpochIndex(epochName)",          returns: "number",        desc: "Return the 0-based epoch index (0=Stone Age … 11=Galactic)" },
  { method: "api.isEpochUnlocked(required, nation)", returns: "boolean",       desc: "Check if a nation meets the required epoch threshold" },
  { method: "api.calcResourceProduction(nation)",    returns: "Object",        desc: "Calculate per-tick resource output for a given nation snapshot" },
  { method: "api.emitNotification(nationId, msg)",   returns: "void",          desc: "Queue a notification for a nation (info / warning / danger)" },
  { method: "api.log(level, message)",               returns: "void",          desc: "Write a labelled entry to the plugin debug log (info/warn/error)" },
  // Events
  { method: "api.on(event, fn)",                     returns: "void",          desc: "Subscribe to a game engine lifecycle event" },
  { method: "api.off(event, fn)",                    returns: "void",          desc: "Unsubscribe from a previously registered event listener" },
  { method: "api.once(event, fn)",                   returns: "void",          desc: "Subscribe to an event — auto-unsubscribes after first fire" },
];

const UI_SLOTS = [
  { slot: "dashboard.sidebar",  desc: "Side panel on the main dashboard" },
  { slot: "dashboard.header",   desc: "Top header bar area" },
  { slot: "exchange.panel",     desc: "Global stock exchange page" },
  { slot: "construction.tab",   desc: "Construction Hub tab" },
  { slot: "profile.panel",      desc: "National Profile page" },
];

// ── Code Examples ─────────────────────────────────────────────────────────────
const CODE_MANIFEST = `{
  "name": "Crystal Mines",
  "version": "1.0.0",
  "author": "YourName",
  "description": "Adds rare crystal mining to the game.",
  "gameVersion": "0.1",
  "type": "building",
  "entry": "index.js",
  "tags": ["mining", "economy", "resource"]
}`;

const CODE_INDEX_BOILERPLATE = `/**
 * Crystal Mines Plugin — index.js
 * @param {Object} api — Sandboxed GameAPI proxy
 */
export function initCrystalMinesPlugin(api) {

  // 1. Register a new resource
  api.registerResource({
    id: "rare_crystal",
    name: "Rare Crystal",
    emoji: "💎",
    color: "#a78bfa",
    baseValue: 100,
    description: "A mystical resource used in advanced tech.",
  });

  // 2. Register the building that produces it
  api.registerBuilding({
    id: "crystal_mine",
    name: "Crystal Mine",
    emoji: "⛏️",
    category: "civilian",
    epoch_required: "Medieval Age",
    cost: { stone: 300, gold: 100, iron: 50 },
    workers: 4,
    benefit: "Produces 5 Rare Crystals per tick.",
    productionPerTick: { rare_crystal: 5 },
  });

  // 3. Apply an economy bonus for crystal-rich nations
  api.registerEconomyRule({
    id: "crystal_export_bonus",
    description: "Nations with crystals earn a trade premium.",
    apply: (nation) => {
      const crystals = nation.rare_crystal || 0;
      if (crystals < 50) return {};
      return { currency: (nation.currency || 0) + Math.floor(crystals * 0.05) };
    },
  });
}`;

const CODE_REGISTER_IN_REGISTRY = `// In: components/plugins/PluginRegistry.js
import { initCrystalMinesPlugin } from "./community/crystal-mines/index";

export const PLUGINS = [
  // ... existing plugins ...
  {
    manifest: {
      name: "Crystal Mines",
      version: "1.0.0",
      author: "YourName",
      description: "Adds rare crystal mining.",
      gameVersion: "0.1",
      type: "building",
      entry: "index.js",
      tags: ["mining"],
    },
    initFn: initCrystalMinesPlugin,
  },
];`;

const CODE_EVENT = `api.registerEvent({
  id: "crystal_resonance",
  title: "Crystal Resonance",
  description: "Your crystals emit a strange energy, boosting research.",
  severity: "info",
  trigger: (nation) =>
    (nation.rare_crystal || 0) > 200 && Math.random() < 0.01,
  effect: (nation) => ({
    tech_points: (nation.tech_points || 0) + 50,
  }),
});`;

const CODE_RESEARCH = `api.registerResearchTree({
  id: "crystal_tech_branch",
  branch: "Crystal Technology",
  nodes: [
    {
      id: "crystal_basics",
      name: "Crystal Basics",
      cost: 80,
      effect: "Unlock Crystal Mine building",
      description: "Learn to harvest and refine rare crystals.",
    },
    {
      id: "crystal_amplification",
      name: "Crystal Amplification",
      cost: 200,
      requires: ["crystal_basics"],
      effect: "Double Crystal Mine output",
      description: "Advanced resonance techniques double crystal yield.",
    },
  ],
});`;

const CODE_UI = `import MyPanel from "./MyPanel.jsx";

api.registerUIComponent({
  id: "crystal_dashboard_panel",
  slot: "dashboard.sidebar",   // One of the valid slot names
  component: MyPanel,          // A standard React component
});`;

const CODE_LANGUAGE = `api.registerLanguage({
  id: "lang_es",
  locale: "es",
  displayName: "Español",
  flag: "🇪🇸",
  strings: {
    "wood": "Madera",
    "stone": "Piedra",
    "gold": "Oro",
    "food": "Comida",
    "iron": "Hierro",
    "oil": "Petróleo",
    "stability": "Estabilidad",
  },
});`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function DevPortal({ onClose }) {
  const [activeTab, setActiveTab] = useState("quickstart");

  const TABS = [
    { id: "quickstart", label: "Quick Start",   icon: Rocket2 },
    { id: "types",      label: "Plugin Types",  icon: Puzzle },
    { id: "api",        label: "API Reference", icon: Terminal },
    { id: "examples",   label: "Examples",      icon: Code2 },
    { id: "security",   label: "Security",      icon: Shield },
    { id: "submit",     label: "Submit",         icon: GitBranch },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-4xl h-[90vh] rounded-3xl flex flex-col ep-slide-in"
        style={{ background: "linear-gradient(160deg, rgba(10,15,30,0.99), rgba(4,8,16,0.99))", border: "1px solid rgba(139,92,246,0.3)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))", border: "1px solid rgba(139,92,246,0.4)" }}>
              <Puzzle size={18} className="text-violet-400" />
            </div>
            <div>
              <div className="text-white font-black text-base">Forge SDK</div>
              <div className="text-[10px] text-slate-500 ep-mono">Epoch Nations Plugin Developer Portal · v1.0</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors text-xl font-light">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl whitespace-nowrap transition-all"
              style={activeTab === id
                ? { background: "rgba(139,92,246,0.15)", color: "#a78bfa", borderBottom: "2px solid #a78bfa" }
                : { color: "#64748b", borderBottom: "2px solid transparent" }}>
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── QUICK START ── */}
          {activeTab === "quickstart" && (<>
            <div className="rounded-2xl p-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <div className="text-[10px] text-violet-400 font-black ep-mono uppercase tracking-widest mb-1">WELCOME TO FORGE SDK</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                The Epoch Nations Plugin SDK (codenamed <strong className="text-white">Forge</strong>) lets you extend the game with new buildings, resources, economy rules, research trees, events, UI panels, and language packs — all without touching the core engine. Plugins are sandboxed, version-checked, and securely isolated.
              </p>
            </div>

            <div>
              <div className="text-xs font-black text-white mb-3">📁 Folder Structure</div>
              <CodeBlock lang="text" code={`components/plugins/
├── core/
│   ├── GameAPI.js          ← The plugin API (singleton)
│   └── PluginLoader.js     ← Sandbox + validation
├── buildings/
│   └── solar-energy/       ← Example: building plugin
├── languages/
│   └── spanish/            ← Example: language plugin
├── community/              ← 👈 Your plugins go here
│   └── your-plugin-name/
│       ├── plugin.json     ← Manifest (metadata)
│       └── index.js        ← Plugin logic
├── sdk/
│   ├── template/           ← Copy this to start
│   └── PLUGIN_DEVELOPER_GUIDE.md
└── PluginRegistry.js       ← Register all plugins here`} />
            </div>

            <div>
              <div className="text-xs font-black text-white mb-3">🚀 Step-by-Step</div>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Copy the template", body: "Duplicate components/plugins/sdk/template/ into components/plugins/community/your-plugin-name/" },
                  { step: "2", title: "Edit plugin.json", body: "Fill in your name, version, author, description, gameVersion, and type." },
                  { step: "3", title: "Write your index.js", body: "Export an init function that accepts the sandboxed api parameter and calls api.register*() methods." },
                  { step: "4", title: "Register in PluginRegistry.js", body: "Import your init function and add an entry to the PLUGINS array with your manifest inline." },
                  { step: "5", title: "Test in PluginManager", body: "Navigate to /PluginManager in-game to see your plugin's status, logs, and registered content." },
                  { step: "6", title: "Submit a PR", body: "Open a Pull Request titled [Plugin] Your Plugin Name — only modify files inside /plugins." },
                ].map(({ step, title, body }) => (
                  <div key={step} className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black"
                      style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>{step}</div>
                    <div>
                      <div className="text-sm font-bold text-white">{title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-white mb-3">📄 Manifest: plugin.json</div>
              <CodeBlock lang="json" code={CODE_MANIFEST} />
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="grid grid-cols-3 text-[10px] font-black text-slate-500 ep-mono uppercase px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span>Field</span><span>Required</span><span>Description</span>
                </div>
                {MANIFEST_FIELDS.map(({ field, req, desc }) => (
                  <div key={field} className="grid grid-cols-3 text-xs px-3 py-2 items-center"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="ep-mono text-cyan-400">{field}</span>
                    <span>{req ? <CheckCircle size={12} className="text-green-400" /> : <span className="text-slate-600">optional</span>}</span>
                    <span className="text-slate-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* ── PLUGIN TYPES ── */}
          {activeTab === "types" && (<>
            <p className="text-slate-400 text-sm">Each plugin declares a <span className="ep-mono text-cyan-400">type</span> in its manifest. Here's every type available and what it can do:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {PLUGIN_TYPES.map(({ type, color, icon, label, desc }) => (
                <div key={type} className="rounded-2xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{icon}</span>
                    <span className="font-bold text-white text-sm">{label}</span>
                    <span className="ep-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}20`, color }}>{type}</span>
                  </div>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </>)}

          {/* ── API REFERENCE ── */}
          {activeTab === "api" && (<>
            <div>
              <div className="text-xs font-black text-white mb-3">🔌 GameAPI Methods</div>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="grid text-[10px] font-black text-slate-500 ep-mono uppercase px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.04)", gridTemplateColumns: "2fr 1fr 2fr" }}>
                  <span>Method</span><span>Returns</span><span>Description</span>
                </div>
                {API_METHODS.map(({ method, returns, desc }) => (
                  <div key={method} className="grid px-3 py-2.5 items-start text-xs"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)", gridTemplateColumns: "2fr 1fr 2fr" }}>
                    <span className="ep-mono text-cyan-400 text-[11px] break-all">{method}</span>
                    <span className="ep-mono text-amber-400 text-[10px]">{returns}</span>
                    <span className="text-slate-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-white mb-3">🎨 UI Slot Names</div>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                {UI_SLOTS.map(({ slot, desc }) => (
                  <div key={slot} className="flex items-center gap-4 px-3 py-2.5 text-xs"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="ep-mono text-violet-400 shrink-0">{slot}</span>
                    <span className="text-slate-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-white mb-3">📡 Engine Events (api.on)</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  "building:registered", "resource:registered", "language:registered",
                  "economy:registered", "research:registered", "event:registered", "ui:registered"
                ].map(ev => (
                  <div key={ev} className="rounded-xl px-3 py-2 text-xs ep-mono text-cyan-400"
                    style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.12)" }}>
                    {ev}
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* ── EXAMPLES ── */}
          {activeTab === "examples" && (<>
            <Accordion title="Complete Plugin: Crystal Mines" icon={Code2} color="#22d3ee" defaultOpen>
              <p className="text-xs text-slate-400">A full working example combining a new resource, building, and economy rule.</p>
              <CodeBlock code={CODE_INDEX_BOILERPLATE} />
            </Accordion>
            <Accordion title="Registering in PluginRegistry.js" icon={Package} color="#fbbf24">
              <p className="text-xs text-slate-400">After writing your plugin, add it to the registry so the game loads it at startup.</p>
              <CodeBlock code={CODE_REGISTER_IN_REGISTRY} />
            </Accordion>
            <Accordion title="Game Event Plugin" icon={Zap} color="#f87171">
              <p className="text-xs text-slate-400">Events fire probabilistically each tick when the <code className="ep-mono text-cyan-400">trigger</code> returns true.</p>
              <CodeBlock code={CODE_EVENT} />
            </Accordion>
            <Accordion title="Research Tree Plugin" icon={FlaskConical} color="#a78bfa">
              <p className="text-xs text-slate-400">Add custom branches to the tech tree with prerequisite chains.</p>
              <CodeBlock code={CODE_RESEARCH} />
            </Accordion>
            <Accordion title="Custom UI Component" icon={Palette} color="#818cf8">
              <p className="text-xs text-slate-400">Inject React components into named dashboard slots. Your component receives no special props — use the api to read data.</p>
              <CodeBlock code={CODE_UI} />
            </Accordion>
            <Accordion title="Language Pack" icon={Globe} color="#4ade80">
              <p className="text-xs text-slate-400">Override any game string key for a given locale. Use <code className="ep-mono text-cyan-400">api.translate(key, locale)</code> in your components.</p>
              <CodeBlock code={CODE_LANGUAGE} />
            </Accordion>
          </>)}

          {/* ── SECURITY ── */}
          {activeTab === "security" && (<>
            <div className="rounded-2xl p-4" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-sm font-black text-white">Security Sandbox</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every plugin's <code className="ep-mono text-cyan-400">init</code> function is audited before execution. The loader scans the function's source code for forbidden identifiers. Violations immediately disable the plugin and log the reason. This protects game integrity and player data.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-[10px] font-black text-slate-500 ep-mono uppercase px-3 py-2"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                SECURITY RULES
              </div>
              {SECURITY_RULES.map(({ allowed, item }) => (
                <div key={item} className="flex items-center gap-3 px-3 py-2.5 text-xs"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {allowed
                    ? <CheckCircle size={13} className="text-green-400 shrink-0" />
                    : <XCircle size={13} className="text-red-400 shrink-0" />}
                  <span className={allowed ? "text-slate-300" : "text-slate-500"}>{item}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="text-xs font-black text-white mb-2">🔒 How the Sandbox Works</div>
              <div className="space-y-2 text-xs text-slate-400">
                <p>1. <strong className="text-white">Manifest validation</strong> — version, type, and required fields are checked before any code runs.</p>
                <p>2. <strong className="text-white">Code audit</strong> — the loader uses regex scanning on the function's <code className="ep-mono text-cyan-400">.toString()</code> to detect forbidden identifier usage.</p>
                <p>3. <strong className="text-white">API proxy</strong> — plugins only receive a frozen proxy of <code className="ep-mono text-cyan-400">GameAPI</code>. All private methods (prefixed <code className="ep-mono text-cyan-400">_</code>) are stripped.</p>
                <p>4. <strong className="text-white">Nation data is frozen</strong> — <code className="ep-mono text-cyan-400">api.getNationData()</code> returns an immutable snapshot. Plugins cannot mutate the live nation object.</p>
                <p>5. <strong className="text-white">Economy rules return patches</strong> — your <code className="ep-mono text-cyan-400">apply()</code> function returns a patch object; the engine decides what to apply and when.</p>
              </div>
            </div>
          </>)}

          {/* ── SUBMIT ── */}
          {activeTab === "submit" && (<>
            <div className="rounded-2xl p-4" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <p className="text-xs text-slate-400 leading-relaxed">
                Community plugins are reviewed and merged into the official repository. Once merged, your plugin is available to all players. We check for security compliance, code quality, and gameplay balance before approving.
              </p>
            </div>

            <div>
              <div className="text-xs font-black text-white mb-3">📋 Submission Checklist</div>
              <div className="space-y-2">
                {[
                  "Plugin is in components/plugins/community/your-plugin-name/",
                  "plugin.json has all required fields and valid semver",
                  "index.js exports a named init function",
                  "No forbidden globals used (window, fetch, eval, etc.)",
                  "Plugin is registered in PluginRegistry.js",
                  "Tested via /PluginManager — status shows 'loaded'",
                  "Only files inside /plugins are modified",
                  "Pull Request title: [Plugin] Your Plugin Name",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle size={13} className="text-green-400 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-white mb-3">⚠️ Auto-Rejection Reasons</div>
              <div className="space-y-2">
                {[
                  "Modifying files outside of /components/plugins/",
                  "Using forbidden globals (window, fetch, localStorage, etc.)",
                  "Hardcoding nation IDs or entity primary keys",
                  "Plugin crashes during init (unhandled exceptions)",
                  "gameVersion incompatibility",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <XCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <Puzzle size={28} className="text-violet-400 mx-auto mb-2" />
              <div className="font-black text-white text-sm mb-1">Ready to Build?</div>
              <div className="text-xs text-slate-400 mb-3">Copy the template, build something amazing, and open a pull request.</div>
              <div className="ep-mono text-xs text-cyan-400">
                components/plugins/sdk/template/ → community/your-plugin/
              </div>
            </div>
          </>)}

        </div>
      </div>
    </div>
  );
}

// tiny icon shim
function Rocket2({ size, className }) {
  return <BookOpen size={size} className={className} />;
}