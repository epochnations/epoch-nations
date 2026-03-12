# Epoch Nations — Plugin Developer Guide

## Overview

The Epoch Nations plugin system lets community developers extend the game with new buildings, resources, UI panels, language packs, economy rules, research trees, and custom events — **without ever touching the core engine**.

---

## Quick Start

### 1. Copy the Template

```
components/plugins/sdk/template/
├── plugin.json   ← Manifest (metadata)
└── index.js      ← Plugin logic
```

Copy this folder to:
```
components/plugins/community/your-plugin-name/
```

---

## Plugin Manifest (`plugin.json`)

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Human-readable plugin name |
| `version` | ✅ | Semver string (e.g. `1.0.0`) |
| `author` | ✅ | Your name or GitHub handle |
| `description` | ✅ | What the plugin does |
| `gameVersion` | ✅ | Minimum Epoch Nations version required |
| `type` | ✅ | One of: `building`, `resource`, `ui`, `language`, `economy`, `research`, `event`, `ai`, `diplomacy` |
| `entry` | ✅ | Entry file (always `index.js`) |
| `tags` | — | Optional array of keywords |

---

## Plugin Types & Registration Methods

### 🏗️ Building Plugin
```js
api.registerBuilding({
  id: "solar_energy_plant",       // Unique ID — never change after release
  name: "Solar Energy Plant",
  emoji: "☀️",
  category: "civilian",           // civilian | military | government
  epoch_required: "Industrial Age",
  cost: { iron: 150, stone: 200, gold: 50 },
  workers: 3,
  benefit: "Produces 50 energy per tick.",
  productionPerTick: { energy: 50 },
});
```

### 💎 Resource Plugin
```js
api.registerResource({
  id: "rare_crystal",
  name: "Rare Crystal",
  emoji: "💎",
  color: "#a78bfa",
  baseValue: 100,
  description: "A mystical resource with unique properties.",
});
```

### 🌐 Language Plugin
```js
api.registerLanguage({
  id: "lang_fr",
  locale: "fr",
  displayName: "Français",
  flag: "🇫🇷",
  strings: {
    "wood": "Bois",
    "stone": "Pierre",
    "gold": "Or",
    // ... more translations
  },
});
```

### 📊 Economy Rule Plugin
```js
api.registerEconomyRule({
  id: "green_tax_credit",
  description: "Nations with solar plants receive a tax credit.",
  apply: (nation) => {
    // Receives frozen nation snapshot, return a patch object
    return { currency: (nation.currency || 0) + 10 };
  },
});
```

### 🔬 Research Tree Plugin
```js
api.registerResearchTree({
  id: "renewable_energy_branch",
  branch: "Renewable Energy",
  nodes: [
    { id: "solar_basics", name: "Solar Basics", cost: 50, effect: "Unlock Solar Panel" },
    { id: "advanced_solar", name: "Advanced Solar", cost: 150, effect: "2x Solar output" },
  ],
});
```

### ⚡ Event Plugin
```js
api.registerEvent({
  id: "solar_flare",
  title: "Solar Flare",
  description: "A massive solar flare disrupts electronics!",
  severity: "warning",
  trigger: (nation) => nation.epoch === "Digital Age" && Math.random() < 0.005,
  effect: (nation) => ({
    stability: Math.max(0, (nation.stability || 75) - 5),
  }),
});
```

---

## Security Rules

| ✅ Allowed | ❌ Forbidden |
|-----------|-------------|
| `api.*` methods | `window.*` |
| Pure JS logic | `document.*` |
| Math calculations | `fetch()` |
| `console.log()` | `localStorage` |
| | `eval()` / `Function()` |
| | Direct entity imports |

Violations will cause your plugin to be **automatically disabled** at load time.

---

## Submitting Your Plugin

1. Fork the Epoch Nations repository
2. Create your plugin in `components/plugins/community/your-plugin/`
3. Add your import to `components/plugins/PluginRegistry.js`
4. **Only modify files inside `/plugins`** — core changes are auto-rejected
5. Open a Pull Request with the title: `[Plugin] Your Plugin Name`

---

## Folder Structure

```
components/plugins/
├── core/
│   ├── GameAPI.js          ← Plugin API (singleton)
│   └── PluginLoader.js     ← Loader + sandbox
├── buildings/
│   └── solar-energy/       ← Example building plugin
├── languages/
│   └── spanish/            ← Example language plugin
├── community/              ← Community plugins go here
├── sdk/
│   ├── template/           ← Copy this to start
│   └── PLUGIN_DEVELOPER_GUIDE.md
└── PluginRegistry.js       ← Register plugins here
``