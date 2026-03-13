# 🌍 Epoch Nations

![Version](https://img.shields.io/badge/version-alpha-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-open--source-brightgreen)
![Contributions](https://img.shields.io/badge/contributions-welcome-orange)

Epoch Nations is a **persistent civilization simulation game** where players build nations from the earliest stages of human development to advanced global civilizations.

Players manage:

- Resources  
- Population  
- Cities  
- Global Trade  
- Diplomacy  
- Research  
- Economic Systems  
- Military Strategy  

Unlike traditional strategy games, **Epoch Nations runs as a living world simulation** where nations evolve continuously and the global economy changes over time.

---

# 📖 Table of Contents

- About Epoch Nations
- Why Play Epoch Nations
- Features
- System Requirements
- Running the Game Locally
- Hosting a Server
- Forge SDK (Plugin System)
- Plugin Development
- Architecture Overview
- Economic Simulation Engine
- Plugin Marketplace Roadmap
- Contributing
- License

---

# 🧭 About Epoch Nations

Epoch Nations simulates the **rise and evolution of civilizations** inside a persistent world.

Players start with:

- small populations  
- limited infrastructure  
- basic resources  

Over time they develop:

- cities  
- industrial economies  
- global trade networks  
- research institutions  
- military forces  
- diplomatic alliances  

The game world evolves through **multiple historical epochs**, from primitive settlements to advanced technological societies.
Unlike traditional strategy games that reset after each match, Epoch Nations runs as a **continuous evolving simulation**.

---

# 🎮 Why Play Epoch Nations

## Persistent World

The world continues evolving even when players are offline.

Markets fluctuate, nations grow, and diplomacy shifts.

---

## Deep Economic Simulation

The game models real macroeconomic systems:

- GDP
- Inflation
- Unemployment
- Global commodity markets
- Banking systems
- Stock markets

---

## Global Diplomacy

Players can:

- negotiate alliances
- form trade agreements
- compete for global influence
- engage in strategic conflict

---

## Technological Progression

Civilizations progress through multiple **epochs of development** through research.

---

## Extensible Modding System

Epoch Nations includes a **Forge SDK plugin system** allowing developers to add new game features.

---

# ⚙️ System Requirements

## Minimum


- CPU: 2 cores
- RAM: 4 GB
- Storage: 5 GB
- Node.js: v18+




## Recommended

- CPU: 4+ cores
- RAM: 8–16 GB
- Storage: SSD
- Node.js: v18+


# 💻 Running the Game Locally

## Clone the Repository

```
git clone https://github.com/YOUR_REPO/epoch-nations.git
cd epoch-nations
```

## Install Dependencies

```
npm install
```

## Configure Environment Variables

### Create a file named:

```
.env.local
```
### Add:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

### Example:

```
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://example.base44.app
```

## Start Development Server

```
npm run dev
```

### Open:

```
http://localhost:5173
```

# 🌐 Hosting Epoch Nations on a VPS
### Epoch Nations can run on any Node.js compatible server.

#### Examples:

- AWS

- DigitalOcean

- Linode

- Hetzner

- Vultr

## Install Node.js

```
sudo apt update
sudo apt install nodejs npm
```

### Verify installation:

```
node -v
npm -v
```

## Install and Build

```
git clone https://github.com/YOUR_REPO/epoch-nations.git
cd epoch-nations
npm install
npm run build
```
## Run Server

```
npm run preview
```

## Run Server in Background

### Install PM2:

```
npm install pm2 -g
```

### Start server:

```
pm2 start npm --name "epoch-nations" -- run preview
```

# 🧩 Forge SDK (Plugin System)
### Epoch Nations includes a Forge Plugin SDK allowing developers to extend the game without modifying the core engine.

### Plugins can add:

- buildings

- resources

- UI improvements

- research systems

- economic mechanics

- AI behaviors

- language packs

# 📦 Plugin Structure

### Example plugin:

```
plugins/solar-energy
   plugin.json
   index.js
   assets/
   ```

## 🧾 Example plugin.json

```
{
  "name": "Solar Energy",
  "version": "1.0.0",
  "author": "Community",
  "description": "Adds solar power plant building",
  "gameVersion": "0.1",
  "type": "building",
  "entry": "index.js"
}
```

## 🔌 Plugin API Example

```
import { GameAPI } from "../../core/api/GameAPI"

GameAPI.registerBuilding({
  name: "Solar Plant",
  production: {
    energy: 50
  }
})
```

## 🔐 Plugin Permissions
### Plugins must declare permissions.

```
{
 "permissions": [
   "buildings.add",
   "resources.read",
   "ui.modify"
 ]
}
```
### The engine validates permissions before loading plugins.

# 🏗 Architecture Overview

```
Client UI
   │
Game Engine
   │
Economic System
Diplomacy System
Research System
Population Simulation
   │
Forge Plugin API
   │
Community Plugins
```

# 📈 Economic Simulation Engine
### The economy operates across three layers.

## Citizen Economy

### Citizens earn wages and spend money.

```
Income → Spending → Business Revenue → Taxes
```

## City Economy

### Cities manage:

- industries

- infrastructure

- employment

- housing

# National Economy

```
GDP =
Citizen Spending
+ Industrial Production
+ Government Spending
+ (Exports − Imports)
```

# 🔮 Plugin Marketplace Roadmap
### Future plans include an in-game plugin marketplace.

## Phase 1

GitHub plugin submissions.

## Phase 2

GitHub plugin submissions.

## Phase 3

Public plugin registry.

### Example UI:

```
Settings → Plugins → Browse
```

# 🤝 Contributing

### We welcome contributions including:

- bug fixes

- gameplay improvements

- plugins

- translations

- documentation

### Submit contributions through GitHub Pull Requests.

# 📜 License

### See the LICENSE file for details.


---

Ronald Carmenate
Epoch Nations 
















































































