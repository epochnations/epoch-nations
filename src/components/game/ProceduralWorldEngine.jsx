/**
 * ProceduralWorldEngine — Infinite world expansion algorithm.
 *
 * When nations grow beyond a threshold or new players join, this engine
 * procedurally generates new hex territories, assigns natural resources,
 * and expands the playable map. Runs as a headless component.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS } from "./GameClock";

// ── Terrain biomes with resource weights ──────────────────────────────────────
const BIOMES = [
  { type: "plains",   weight: 30, resources: [{ key: "res_food", base: 80 }, { key: "res_wood", base: 40 }] },
  { type: "forest",   weight: 20, resources: [{ key: "res_wood", base: 120 }, { key: "res_food", base: 30 }] },
  { type: "mountains",weight: 15, resources: [{ key: "res_stone", base: 100 }, { key: "res_iron", base: 60 }] },
  { type: "coastal",  weight: 15, resources: [{ key: "res_food", base: 60 }, { key: "res_oil", base: 40 }] },
  { type: "desert",   weight: 10, resources: [{ key: "res_gold", base: 70 }, { key: "res_stone", base: 50 }] },
  { type: "tundra",   weight: 8,  resources: [{ key: "res_iron", base: 80 }, { key: "res_stone", base: 60 }] },
  { type: "ocean",    weight: 2,  resources: [{ key: "res_food", base: 20 }] },
];

// Weighted random biome picker
function pickBiome(seed) {
  const total = BIOMES.reduce((s, b) => s + b.weight, 0);
  let r = (seed % total);
  for (const b of BIOMES) {
    r -= b.weight;
    if (r <= 0) return b;
  }
  return BIOMES[0];
}

// ── Spiral coordinate generator for infinite expansion ────────────────────────
// Generates (q, r) hex coords in outward spiral rings
function* spiralCoords(startRing = 1) {
  let ring = startRing;
  while (true) {
    // Each ring has 6*ring tiles
    const directions = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
    let q = ring, r = 0;
    for (const [dq, dr] of directions) {
      for (let step = 0; step < ring; step++) {
        yield { q, r };
        q += dq;
        r += dr;
      }
    }
    ring++;
  }
}

// ── Nation territory seeding ───────────────────────────────────────────────────
// Gives a new nation a 3x3 cluster of starting tiles around their anchor
async function seedNationTerritory(nation, existingHexIds) {
  const seed = nation.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  // Starting ring offset per nation to spread them out
  const ringOffset = (seed % 8) + 2;
  const gen = spiralCoords(ringOffset);
  const baseQ = (seed % 20) - 10;
  const baseR = ((seed * 7) % 20) - 10;

  const newHexes = [];
  let count = 0;
  const target = 7; // 7 starting tiles

  // Generate tiles in a cluster around the nation's "home" coordinates
  for (let i = 0; i < 30 && count < target; i++) {
    const { q: dq, r: dr } = gen.next().value;
    const q = baseQ + dq;
    const r = baseR + dr;
    const hexId = `${q}_${r}`;
    if (existingHexIds.has(hexId)) continue;

    const tileSeed = Math.abs(q * 1000 + r * 13 + seed);
    const biome = pickBiome(tileSeed);
    const resourceKey = biome.resources[tileSeed % biome.resources.length].key;
    const resourceAmt = Math.floor(biome.resources[tileSeed % biome.resources.length].base * (0.7 + (tileSeed % 60) / 100));

    newHexes.push({
      hex_id: hexId, q, r,
      owner_nation_id: nation.id,
      owner_nation_name: nation.name,
      owner_color: nation.flag_color || "#3b82f6",
      owner_flag: nation.flag_emoji || "🏴",
      terrain_type: biome.type,
      resource_type: resourceKey.replace("res_", ""),
      resource_amount: resourceAmt,
      population_capacity: 100 + Math.floor(resourceAmt * 0.5),
      infrastructure_level: 1,
      has_city: count === 0, // first tile is capital
      is_capital: count === 0,
      city_name: count === 0 ? `${nation.name} City` : "",
      cluster_id: nation.id,
    });
    existingHexIds.add(hexId);
    count++;
  }

  return newHexes;
}

// ── Territory expansion for high-performing nations ───────────────────────────
async function expandNationTerritory(nation, allHexes) {
  const ownedHexes = allHexes.filter(h => h.owner_nation_id === nation.id);
  if (!ownedHexes.length) return;

  // Expansion score: high GDP, stability, low inflation = faster expansion
  const gdpScore   = Math.min(1.0, (nation.gdp || 200) / 2000);
  const stabScore  = Math.min(1.0, (nation.stability || 50) / 100);
  const popScore   = Math.min(1.0, (nation.population || 10) / 100);
  const expandScore = (gdpScore + stabScore + popScore) / 3;

  // Only expand nations doing well (score > 0.55) and not at war
  if (expandScore < 0.55 || (nation.at_war_with || []).length > 0) return;
  if (ownedHexes.length >= 25) return; // cap at 25 tiles per nation

  // Random chance proportional to score
  if (Math.random() > expandScore * 0.3) return;

  const existingIds = new Set(allHexes.map(h => h.hex_id));
  const ownedIds    = new Set(ownedHexes.map(h => h.hex_id));

  // Find neutral adjacent tiles
  const neutralAdjacent = [];
  for (const hex of ownedHexes) {
    const neighbors = [
      [hex.q+1,hex.r], [hex.q-1,hex.r],
      [hex.q,hex.r+1], [hex.q,hex.r-1],
      [hex.q+1,hex.r-1], [hex.q-1,hex.r+1],
    ];
    for (const [nq, nr] of neighbors) {
      const nid = `${nq}_${nr}`;
      if (!existingIds.has(nid)) {
        neutralAdjacent.push({ q: nq, r: nr, hex_id: nid });
      } else {
        // Check if owned by another nation (don't expand into claimed)
        const existing = allHexes.find(h => h.hex_id === nid);
        if (existing && !existing.owner_nation_id) {
          neutralAdjacent.push({ q: nq, r: nr, hex_id: nid });
        }
      }
    }
  }

  if (!neutralAdjacent.length) return;

  const pick = neutralAdjacent[Math.floor(Math.random() * neutralAdjacent.length)];
  const tileSeed = Math.abs(pick.q * 997 + pick.r * 13);
  const biome = pickBiome(tileSeed);
  const resourceKey = biome.resources[tileSeed % biome.resources.length].key;
  const resourceAmt = Math.floor(biome.resources[tileSeed % biome.resources.length].base * 0.8);

  try {
    await base44.entities.HexTile.create({
      hex_id: pick.hex_id, q: pick.q, r: pick.r,
      owner_nation_id: nation.id,
      owner_nation_name: nation.name,
      owner_color: nation.flag_color || "#3b82f6",
      owner_flag: nation.flag_emoji || "🏴",
      terrain_type: biome.type,
      resource_type: resourceKey.replace("res_", ""),
      resource_amount: resourceAmt,
      population_capacity: 80,
      infrastructure_level: 0,
      has_city: false, is_capital: false, city_name: "",
      cluster_id: nation.id,
    });
  } catch (_) {}
}

// ── Main tick ─────────────────────────────────────────────────────────────────
async function runProceduralTick() {
  try {
    const [nations, allHexes] = await Promise.all([
      base44.entities.Nation.list("-gdp", 60),
      base44.entities.HexTile.list("-created_date", 500),
    ]);

    const existingIds = new Set(allHexes.map(h => h.hex_id));

    // Seed territories for nations that have none
    const nationHexCounts = {};
    allHexes.forEach(h => {
      if (h.owner_nation_id) {
        nationHexCounts[h.owner_nation_id] = (nationHexCounts[h.owner_nation_id] || 0) + 1;
      }
    });

    for (const nation of nations) {
      if (!nationHexCounts[nation.id]) {
        const newHexes = await seedNationTerritory(nation, existingIds);
        await Promise.allSettled(newHexes.map(h => base44.entities.HexTile.create(h)));
        newHexes.forEach(h => existingIds.add(h.hex_id));
      }
    }

    // Expand top-performing nations
    const topNations = nations.filter(n => (n.gdp || 0) > 400 && (n.stability || 0) > 50);
    for (const nation of topNations.slice(0, 5)) {
      await expandNationTerritory(nation, allHexes);
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (_) {}
}

export default function ProceduralWorldEngine({ myNation }) {
  const timerRef = useRef(null);
  const initRef  = useRef(false);

  useEffect(() => {
    if (!myNation?.id || initRef.current) return;
    initRef.current = true;

    // Run once on mount, then every 10 minutes
    runProceduralTick();
    timerRef.current = setInterval(runProceduralTick, 10 * TICK_MS);

    return () => {
      clearInterval(timerRef.current);
      initRef.current = false;
    };
  }, [myNation?.id]);

  return null;
}