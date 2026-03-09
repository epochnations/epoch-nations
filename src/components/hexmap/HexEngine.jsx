/**
 * HexEngine — Pure utility functions for axial hex coordinate system.
 * Uses "pointy-top" hex orientation.
 */

export const HEX_SIZE = 32; // pixel radius

// ─── Axial → Pixel ────────────────────────────────────────────────────────────
export function hexToPixel(q, r, size = HEX_SIZE) {
  const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
  const y = size * (3 / 2 * r);
  return { x, y };
}

// ─── Pixel → Axial ───────────────────────────────────────────────────────────
export function pixelToHex(px, py, size = HEX_SIZE) {
  const q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / size;
  const r = (2 / 3 * py) / size;
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

// ─── Hex corners for SVG polygon ─────────────────────────────────────────────
export function hexCorners(cx, cy, size = HEX_SIZE) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
  }
  return pts;
}

export function hexCornersStr(cx, cy, size = HEX_SIZE) {
  return hexCorners(cx, cy, size).map(p => `${p.x},${p.y}`).join(" ");
}

// ─── Neighbors ───────────────────────────────────────────────────────────────
const NEIGHBOR_DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];

export function hexNeighbors(q, r) {
  return NEIGHBOR_DIRS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

export function hexId(q, r) { return `${q}_${r}`; }

// ─── Distance ────────────────────────────────────────────────────────────────
export function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

// ─── Procedural Terrain Generation ───────────────────────────────────────────
// Simple noise function based on coords
function pseudoNoise(q, r, seed = 42) {
  let n = Math.sin(q * 127.1 + r * 311.7 + seed) * 43758.5453;
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

  // Resource generation
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

// ─── Island cluster generation for new players ───────────────────────────────
// Returns an array of {q,r} hexes forming a small island cluster
export function generateStartingCluster(centerQ, centerR) {
  // Central hex + ring of 6 neighbors, only 4 of which are land
  const neighbors = hexNeighbors(centerQ, centerR);
  const landNeighbors = neighbors.slice(0, 4); // take first 4 directions
  return [{ q: centerQ, r: centerR }, ...landNeighbors];
}

// ─── Find a free cluster origin far from existing hexes ───────────────────────
export function findFreeClusterOrigin(existingHexIds) {
  // Spread new players far apart by random placement in a wide grid
  const SPREAD = 80;
  let attempts = 0;
  while (attempts < 100) {
    const q = Math.floor((Math.random() - 0.5) * SPREAD * 2);
    const r = Math.floor((Math.random() - 0.5) * SPREAD * 2);
    // Check none of the cluster hexes exist
    const cluster = [{ q, r }, ...hexNeighbors(q, r)];
    const allFree = cluster.every(h => !existingHexIds.has(hexId(h.q, h.r)));
    if (allFree) return { q, r };
    attempts++;
  }
  // Fallback: place very far away
  const offset = 100 + Math.floor(Math.random() * 50);
  return { q: offset, r: offset };
}

// ─── Terrain visual config ────────────────────────────────────────────────────
export const TERRAIN_CONFIG = {
  ocean:     { fill: "#0d3b6e", stroke: "#0a2d52", label: "Ocean",     emoji: "🌊" },
  coastal:   { fill: "#1a5276", stroke: "#154360", label: "Coastal",   emoji: "🏖" },
  plains:    { fill: "#1a6b2f", stroke: "#145a27", label: "Plains",    emoji: "🌿" },
  forest:    { fill: "#0d4f1c", stroke: "#0a3d16", label: "Forest",    emoji: "🌲" },
  desert:    { fill: "#7d6608", stroke: "#6e5c07", label: "Desert",    emoji: "🏜" },
  mountains: { fill: "#4a4a5a", stroke: "#3a3a48", label: "Mountains", emoji: "⛰" },
  tundra:    { fill: "#5d6d7e", stroke: "#4d5d6e", label: "Tundra",    emoji: "❄" },
};

export const RESOURCE_CONFIG = {
  none:    { emoji: "",   color: "transparent" },
  oil:     { emoji: "🛢", color: "#f59e0b" },
  iron:    { emoji: "⚙",  color: "#9ca3af" },
  food:    { emoji: "🌾", color: "#84cc16" },
  gold:    { emoji: "✨", color: "#fbbf24" },
  stone:   { emoji: "🪨", color: "#6b7280" },
  uranium: { emoji: "☢", color: "#a3e635" },
};