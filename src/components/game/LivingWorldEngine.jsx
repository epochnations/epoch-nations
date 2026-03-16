/**
 * LivingWorldEngine — Procedural world events and AI island expansion.
 * Runs silently in background. Fires world events, grows AI territories.
 */
import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS } from "./GameClock";
import { generateTerrain, TERRAIN_CONFIG, islandPrice, seededRand } from "../map/HexOceanMap";

const HEX_DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];

const WORLD_EVENTS = [
  { title:"⚡ Resource Surge", msg: n => `⚡ RESOURCE SURGE — A rare mineral vein was discovered near ${n.name}'s territory! Resource production +30% for 2 cycles.` },
  { title:"🌪️ Storm Season",  msg: n => `🌪️ STORM WARNING — Severe storms are battering the seas near ${n.name}. Naval trade routes temporarily disrupted.` },
  { title:"🏴‍☠️ Pirate Raid",   msg: n => `🏴‍☠️ PIRATE RAID — A pirate fleet has struck near ${n.name}'s islands! 50 credits looted from trade routes.` },
  { title:"📈 Trade Boom",    msg: n => `📈 TRADE BOOM — Global demand for resources spiked. Nations near ${n.name} are reporting record export revenues.` },
  { title:"🌋 Volcanic Event",msg: n => `🌋 VOLCANIC ACTIVITY — Seismic activity detected near ${n.name}'s volcanic islands. Mining operations temporarily increased.` },
  { title:"🐠 Sea Bounty",    msg: n => `🐠 SEA BOUNTY — Rich fishing grounds discovered near ${n.name}. Coastal food production increased.` },
];

async function fireWorldEvent(myNationId) {
  try {
    const nations = await base44.entities.Nation.list("-gdp", 20);
    const users = await base44.entities.User.list().catch(() => []);
    const userEmails = new Set(users.map(u => u.email));
    // Pick a mix of player and AI nations for events
    const pool = nations.filter(n => n.id !== myNationId);
    if (!pool.length) return;
    const nation = pool[Math.floor(Math.random() * Math.min(pool.length, 8))];
    const event = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)];

    await base44.entities.ChatMessage.create({
      channel: "system",
      sender_nation_name: "WORLD EVENTS",
      sender_flag: "🌍",
      sender_color: "#f59e0b",
      sender_role: "system",
      content: event.msg(nation),
    });

    // Apply small mechanical effect
    if (event.title.includes("Pirate") && userEmails.has(nation.owner_email)) {
      await base44.entities.Nation.update(nation.id, {
        currency: Math.max(0, (nation.currency || 0) - 50),
      }).catch(() => {});
    }
    if (event.title.includes("Resource") && (nation.res_wood || 0) > 0) {
      await base44.entities.Nation.update(nation.id, {
        res_wood: (nation.res_wood || 0) + 60,
        res_stone: (nation.res_stone || 0) + 40,
      }).catch(() => {});
    }
  } catch (_) {}
}

async function expandAINations() {
  try {
    const [nations, tiles, users] = await Promise.all([
      base44.entities.Nation.list("-gdp", 60),
      base44.entities.HexTile.list("-created_date", 800),
      base44.entities.User.list().catch(() => []),
    ]);
    const userEmails = new Set(users.map(u => u.email));
    const usedPos = new Set(tiles.map(t => `${t.q}_${t.r}`));
    const tilesByNation = {};
    for (const t of tiles) {
      if (!tilesByNation[t.owner_nation_id]) tilesByNation[t.owner_nation_id] = [];
      tilesByNation[t.owner_nation_id].push(t);
    }

    const aiNations = nations.filter(n =>
      !userEmails.has(n.owner_email) && (n.currency || 0) > 1200 && (n.stability || 0) > 35
    );
    if (!aiNations.length) return;

    // Pick up to 3 AI nations to expand
    const candidates = aiNations.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const nation of candidates) {
      const myTiles = tilesByNation[nation.id] || [];
      if (!myTiles.length) continue;
      const baseTile = myTiles[Math.floor(Math.random() * myTiles.length)];
      const dir = HEX_DIRS[Math.floor(Math.random() * HEX_DIRS.length)];
      const nq = baseTile.q + dir[0];
      const nr = baseTile.r + dir[1];
      const key = `${nq}_${nr}`;
      if (usedPos.has(key)) continue;

      const terrain = generateTerrain(nq, nr);
      const price = islandPrice(nq, nr, myTiles.length);
      if ((nation.currency || 0) < price) continue;

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
      usedPos.add(key);
      await new Promise(r => setTimeout(r, 400));
    }
  } catch (_) {}
}

async function seedMissingNations() {
  try {
    const [nations, tiles, users] = await Promise.all([
      base44.entities.Nation.list("-created_date", 100),
      base44.entities.HexTile.list("-created_date", 800),
      base44.entities.User.list().catch(() => []),
    ]);
    const tiledIds = new Set(tiles.map(t => t.owner_nation_id).filter(Boolean));
    const usedPos = new Set(tiles.map(t => `${t.q}_${t.r}`));

    // Deterministic spiral placement
    function nationStartPos(idx) {
      if (idx === 0) return { q: 0, r: 0 };
      const ring = Math.ceil(Math.sqrt(idx / 6));
      const angle = ((idx - 3 * ring * (ring - 1)) / (ring * 6)) * Math.PI * 2;
      return {
        q: Math.round(Math.cos(angle) * ring * 2),
        r: Math.round(Math.sin(angle) * ring * 1.5),
      };
    }

    const unseeded = nations.filter(n => !tiledIds.has(n.id));
    if (!unseeded.length) return;

    let idx = tiles.length;
    for (const nation of unseeded.slice(0, 8)) {
      let { q, r } = nationStartPos(idx);
      let tries = 0;
      while (usedPos.has(`${q}_${r}`) && tries < 30) {
        idx++;
        const p = nationStartPos(idx);
        q = p.q; r = p.r;
        tries++;
      }
      if (usedPos.has(`${q}_${r}`)) continue;

      const terrain = generateTerrain(q, r);
      await base44.entities.HexTile.create({
        hex_id: `${q}_${r}`, q, r, terrain_type: terrain,
        owner_nation_id: nation.id, owner_nation_name: nation.name,
        owner_color: nation.flag_color || "#3b82f6",
        owner_flag: nation.flag_emoji || "🏴",
        resource_type: "none", resource_amount: 0,
        has_city: true, is_capital: true,
        infrastructure_level: 1,
        city_name: `${nation.name} Capital`,
        buildings: ["housing", "market"],
        population_capacity: 200,
      });
      usedPos.add(`${q}_${r}`);
      idx++;
      await new Promise(r2 => setTimeout(r2, 500));
    }
  } catch (_) {}
}

export default function LivingWorldEngine({ myNation }) {
  const initRef = useRef(false);
  const eventRef = useRef(null);
  const expandRef = useRef(null);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Seed missing nations immediately
    seedMissingNations();

    // World events every ~8 minutes (staggered)
    const eventDelay = 30000 + Math.random() * 30000;
    setTimeout(() => {
      if (myNation?.id) fireWorldEvent(myNation.id);
      eventRef.current = setInterval(() => {
        if (myNation?.id) fireWorldEvent(myNation.id);
      }, 8 * TICK_MS);
    }, eventDelay);

    // AI expansion every 5 minutes
    expandRef.current = setInterval(() => {
      expandAINations();
    }, 5 * TICK_MS);

    // Re-seed every 10 minutes
    const reseedRef = setInterval(() => seedMissingNations(), 10 * TICK_MS);

    return () => {
      clearInterval(eventRef.current);
      clearInterval(expandRef.current);
      clearInterval(reseedRef);
      initRef.current = false;
    };
  }, [myNation?.id]);

  return null;
}