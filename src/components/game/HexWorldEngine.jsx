/**
 * HexWorldEngine — Seeds home islands for nations that don't have one.
 * Runs on mount and periodically. Also expands AI nations.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS } from "./GameClock";
import { generateTerrain, TERRAIN_CONFIG, islandPrice } from "../map/HexOceanMap";

// Spiral placement: distribute nations around center
function nationStartPos(index) {
  if (index === 0) return { q: 0, r: 0 };
  const ring = Math.ceil(Math.sqrt(index / 6));
  const posInRing = index - 3 * ring * (ring - 1);
  const angleStep = (Math.PI * 2) / (ring * 6);
  const angle = angleStep * posInRing;
  const dist = ring * 6;
  return {
    q: Math.round(Math.cos(angle) * ring * 2),
    r: Math.round(Math.sin(angle) * ring * 1.5),
  };
}

async function seedNationIslands() {
  try {
    const [nations, existingTiles, users] = await Promise.all([
      base44.entities.Nation.list("-created_date", 100),
      base44.entities.HexTile.list("-created_date", 800),
      base44.entities.User.list(),
    ]);

    const userEmails = new Set(users.map(u => u.email));
    const tiledNationIds = new Set(existingTiles.map(t => t.owner_nation_id).filter(Boolean));
    const usedPositions = new Set(existingTiles.map(t => `${t.q}_${t.r}`));

    const unseeded = nations.filter(n => !tiledNationIds.has(n.id));
    if (!unseeded.length) return;

    let placementIndex = existingTiles.length;

    for (const nation of unseeded.slice(0, 10)) {
      let { q, r } = nationStartPos(placementIndex);
      // Find a free position
      let tries = 0;
      while (usedPositions.has(`${q}_${r}`) && tries < 20) {
        placementIndex++;
        const pos = nationStartPos(placementIndex);
        q = pos.q; r = pos.r;
        tries++;
      }
      if (usedPositions.has(`${q}_${r}`)) continue;

      const terrain = generateTerrain(q, r);
      const cfg = TERRAIN_CONFIG[terrain];

      await base44.entities.HexTile.create({
        hex_id: `${q}_${r}`, q, r,
        terrain_type: terrain,
        owner_nation_id: nation.id,
        owner_nation_name: nation.name,
        owner_color: nation.flag_color || "#3b82f6",
        owner_flag: nation.flag_emoji || "🏴",
        resource_type: "none", resource_amount: 0,
        has_city: true, is_capital: true,
        infrastructure_level: 1,
        city_name: `${nation.name} Capital`,
        buildings: ["housing", "market"],
        population_capacity: 200,
        protection_until: "",
      });

      usedPositions.add(`${q}_${r}`);
      placementIndex++;

      await new Promise(r => setTimeout(r, 500));
    }
  } catch (_) {}
}

async function expandAINations() {
  try {
    const [nations, tiles, users] = await Promise.all([
      base44.entities.Nation.list("-gdp", 40),
      base44.entities.HexTile.list("-created_date", 800),
      base44.entities.User.list(),
    ]);
    const userEmails = new Set(users.map(u => u.email));
    const usedPositions = new Set(tiles.map(t => `${t.q}_${t.r}`));
    const tileByNation = {};
    for (const t of tiles) {
      if (!tileByNation[t.owner_nation_id]) tileByNation[t.owner_nation_id] = [];
      tileByNation[t.owner_nation_id].push(t);
    }

    const aiNations = nations.filter(n =>
      n.owner_email && !userEmails.has(n.owner_email) &&
      (n.currency || 0) > 1500 && (n.stability || 0) > 40
    );
    if (!aiNations.length) return;

    const nation = aiNations[Math.floor(Math.random() * Math.min(aiNations.length, 5))];
    const myTiles = tileByNation[nation.id] || [];
    if (!myTiles.length) return;

    // Pick a random owned tile and find a neighbor
    const baseTile = myTiles[Math.floor(Math.random() * myTiles.length)];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nq = baseTile.q + dir[0];
    const nr = baseTile.r + dir[1];
    const key = `${nq}_${nr}`;
    if (usedPositions.has(key)) return;

    const terrain = generateTerrain(nq, nr);
    const price = islandPrice(nq, nr, myTiles.length);
    if ((nation.currency || 0) < price) return;

    await base44.entities.HexTile.create({
      hex_id: key, q: nq, r: nr,
      terrain_type: terrain,
      owner_nation_id: nation.id,
      owner_nation_name: nation.name,
      owner_color: nation.flag_color || "#888",
      owner_flag: nation.flag_emoji || "🏴",
      resource_type: "none", resource_amount: 0,
      has_city: false, buildings: [],
      infrastructure_level: 0, population_capacity: 100,
    });

    await base44.entities.Nation.update(nation.id, {
      currency: Math.max(0, (nation.currency || 0) - price),
    });
  } catch (_) {}
}

export default function HexWorldEngine({ myNation }) {
  const seededRef = useRef(false);
  const expandRef = useRef(null);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    // Seed islands on mount
    seedNationIslands();

    // Expand AI every 4 minutes
    expandRef.current = setInterval(() => {
      expandAINations();
    }, 4 * TICK_MS);

    return () => clearInterval(expandRef.current);
  }, []);

  return null;
}