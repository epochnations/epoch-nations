/**
 * HexEngine — Pure utility functions for axial hex coordinate system.
 * "Pointy-top" orientation.
 */

export const HEX_SIZE = 36;

export function hexToPixel(q, r, size = HEX_SIZE) {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * (1.5 * r);
  return { x, y };
}

export function pixelToHex(px, py, size = HEX_SIZE) {
  const q = ((Math.sqrt(3) / 3) * px - (1 / 3) * py) / size;
  const r = ((2 / 3) * py) / size;
  return hexRound(q, r);
}

export function hexRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

export function hexCorners(cx, cy, size = HEX_SIZE) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
  }
  return pts;
}

export function hexCornersStr(cx, cy, size = HEX_SIZE) {
  return hexCorners(cx, cy, size)
    .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
}

export function hexCornersStrInner(cx, cy, size = HEX_SIZE, inset = 1.5) {
  return hexCorners(cx, cy, size - inset)
    .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
}

const NEIGHBOR_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

export function hexNeighbors(q, r) {
  return NEIGHBOR_DIRS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

export function hexId(q, r) { return `${q}_${r}`; }

export function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

// Shared edge between two adjacent hexes (returns 2 corner points)
export function sharedEdge(q1, r1, q2, r2, size = HEX_SIZE) {
  const c1 = hexToPixel(q1, r1, size);
  const c2 = hexToPixel(q2, r2, size);
  const corners1 = hexCorners(c1.x, c1.y, size);
  const corners2 = hexCorners(c2.x, c2.y, size);
  const EPS = 0.5;
  const shared = [];
  for (const p of corners1) {
    for (const q of corners2) {
      if (Math.abs(p.x - q.x) < EPS && Math.abs(p.y - q.y) < EPS) {
        shared.push(p);
        break;
      }
    }
  }
  return shared.length === 2 ? shared : null;
}

// ─── Procedural terrain ───────────────────────────────────────────────────────
function pseudoNoise(q, r, seed = 42) {
  const n = Math.sin(q * 127.1 + r * 311.7 + seed) * 43758.5453;
  return n - Math.floor(n);
}

const TERRAIN_THRESHOLDS = [
  { max: 0.12, type: "ocean" },
  { max: 0.25, type: "coastal" },
  { max: 0.45, type: "plains" },
  { max: 0.60, type: "forest" },
  { max: 0.75, type: "desert" },
  { max: 0.88, type: "mountains" },
  { max: 1.00, type: "tundra" },
];

const RESOURCE_CHANCES = {
  plains:    [["food", 0.30], ["none", 0.70]],
  forest:    [["stone", 0.20], ["gold", 0.10], ["none", 0.70]],
  mountains: [["iron", 0.35], ["gold", 0.15], ["none", 0.50]],
  desert:    [["oil", 0.30], ["none", 0.70]],
  coastal:   [["food", 0.25], ["oil", 0.20], ["none", 0.55]],
  tundra:    [["uranium", 0.15], ["iron", 0.15], ["none", 0.70]],
  ocean:     [["none", 1.0]],
};

export function generateHexTile(q, r) {
  const noise = pseudoNoise(q, r);
  const terrain = TERRAIN_THRESHOLDS.find(t => noise < t.max)?.type || "plains";

  const rng = pseudoNoise(q, r, 99);
  let resourceType = "none", resourceAmount = 0;
  const rChances = RESOURCE_CHANCES[terrain] || [["none", 1.0]];
  let acc = 0;
  for (const [type, prob] of rChances) {
    acc += prob;
    if (rng < acc) { resourceType = type; break; }
  }
  if (resourceType !== "none") {
    resourceAmount = Math.floor(50 + pseudoNoise(q, r, 13) * 200);
  }

  const popCap = terrain === "ocean" ? 0
    : terrain === "mountains" ? 30
    : terrain === "desert" ? 40
    : terrain === "tundra" ? 25
    : terrain === "coastal" ? 120
    : terrain === "plains" ? 150
    : 80;

  return {
    hex_id: hexId(q, r),
    q, r, terrain_type: terrain,
    resource_type: resourceType,
    resource_amount: resourceAmount,
    population_capacity: popCap,
    infrastructure_level: 0,
    owner_nation_id: "",
    owner_nation_name: "",
    owner_color: "",
    owner_flag: "",
    has_city: false,
    has_military_base: false,
    has_trade_port: false,
    buildings: [],
    is_capital: false,
    city_name: "",
    cluster_id: "",
    protection_until: "",
  };
}

export function generateStartingCluster(centerQ, centerR) {
  const neighbors = hexNeighbors(centerQ, centerR);
  return [{ q: centerQ, r: centerR }, ...neighbors.slice(0, 4)];
}

export function findFreeClusterOrigin(existingHexIds) {
  const SPREAD = 80;
  let attempts = 0;
  while (attempts < 100) {
    const q = Math.floor((Math.random() - 0.5) * SPREAD * 2);
    const r = Math.floor((Math.random() - 0.5) * SPREAD * 2);
    const cluster = [{ q, r }, ...hexNeighbors(q, r)];
    if (cluster.every(h => !existingHexIds.has(hexId(h.q, h.r)))) return { q, r };
    attempts++;
  }
  const offset = 100 + Math.floor(Math.random() * 50);
  return { q: offset, r: offset };
}

// ─── Terrain visual config (rich gradients) ───────────────────────────────────
export const TERRAIN_CONFIG = {
  ocean:     { fill: "#0b2d52", fillB: "#0d3d6e", label: "Ocean",     icon: "ocean" },
  coastal:   { fill: "#1a5276", fillB: "#2471a3", label: "Coastal",   icon: "coastal" },
  plains:    { fill: "#1e6b35", fillB: "#27ae60", label: "Plains",    icon: "plains" },
  forest:    { fill: "#0d4f1c", fillB: "#1a7a2e", label: "Forest",    icon: "forest" },
  desert:    { fill: "#7d6608", fillB: "#c8a415", label: "Desert",    icon: "desert" },
  mountains: { fill: "#404050", fillB: "#5d6d7e", label: "Mountains", icon: "mountains" },
  tundra:    { fill: "#4a5e72", fillB: "#7f8c8d", label: "Tundra",    icon: "tundra" },
};

export const RESOURCE_CONFIG = {
  none:    { label: "",         color: "transparent", svgIcon: null },
  oil:     { label: "Oil",      color: "#f59e0b",     svgIcon: "oil" },
  iron:    { label: "Iron",     color: "#9ca3af",     svgIcon: "iron" },
  food:    { label: "Food",     color: "#84cc16",     svgIcon: "food" },
  gold:    { label: "Gold",     color: "#fbbf24",     svgIcon: "gold" },
  stone:   { label: "Stone",    color: "#6b7280",     svgIcon: "stone" },
  uranium: { label: "Uranium",  color: "#a3e635",     svgIcon: "uranium" },
};