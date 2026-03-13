/**
 * nationBanner — Dynamic SVG/PNG nation banner generator
 * GET /nationBanner?nation_id=xxx&type=nation
 *
 * Extensible for future:
 *   ?type=alliance&id=xxx
 *   ?type=leaderboard
 *   ?type=player&id=xxx
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const EPOCHS = [
  "Stone Age","Bronze Age","Iron Age","Classical Age","Medieval Age",
  "Renaissance Age","Industrial Age","Modern Age","Digital Age",
  "Information Age","Space Age","Galactic Age"
];

// Simple cache: key → { svg, timestamp }
const cache = new Map();
const CACHE_TTL = 60_000; // 60 seconds

function epochColor(epoch) {
  const map = {
    "Stone Age": "#a78bfa",
    "Bronze Age": "#f59e0b",
    "Iron Age": "#94a3b8",
    "Classical Age": "#fb923c",
    "Medieval Age": "#60a5fa",
    "Renaissance Age": "#34d399",
    "Industrial Age": "#f97316",
    "Modern Age": "#22d3ee",
    "Digital Age": "#818cf8",
    "Information Age": "#38bdf8",
    "Space Age": "#c084fc",
    "Galactic Age": "#f0abfc",
  };
  return map[epoch] || "#22d3ee";
}

function resourceScore(nation) {
  return (nation.res_wood || 0) + (nation.res_stone || 0) +
         (nation.res_gold || 0) + (nation.res_iron || 0) +
         (nation.res_oil  || 0) + (nation.res_food || 0);
}

function getRank(nation, allNations) {
  const sorted = [...allNations].sort((a, b) => (b.gdp || 0) - (a.gdp || 0));
  const idx = sorted.findIndex(n => n.id === nation.id);
  return idx >= 0 ? idx + 1 : "?";
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSVG(nation, rank, accent) {
  const name         = esc(nation.name || "Unknown Nation");
  const epoch        = esc(nation.epoch || "Stone Age");
  const leader       = esc(nation.leader || "Unknown Leader");
  const power        = Number(nation.unit_power || 0).toLocaleString();
  const pop          = Number(nation.population || 0).toLocaleString();
  const resources    = Number(resourceScore(nation)).toLocaleString();
  const fund         = Number(Math.floor(nation.currency || nation.gdp || 0)).toLocaleString();
  const currName     = esc(nation.currency_name || "Credits");
  const flag         = esc(nation.flag_emoji || "🏴");
  const flagColor    = nation.flag_color || "#3b82f6";
  const allies       = Array.isArray(nation.allies) && nation.allies.length > 0
    ? esc(nation.allies.slice(0, 3).join(", "))
    : "None";

  const W = 760, H = 200;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060b18"/>
      <stop offset="100%" stop-color="#0d1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.3"/>
    </linearGradient>
    <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${flagColor}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${flagColor}" stop-opacity="0.05"/>
    </linearGradient>
    <clipPath id="clip"><rect width="${W}" height="${H}" rx="16"/></clipPath>
  </defs>

  <!-- Background -->
  <g clip-path="url(#clip)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- Flag color splash -->
    <rect x="0" y="0" width="180" height="${H}" fill="url(#flagGrad)"/>

    <!-- Top accent line -->
    <rect x="0" y="0" width="${W}" height="3" fill="url(#accent)"/>

    <!-- Bottom border -->
    <rect x="0" y="${H - 1}" width="${W}" height="1" fill="${accent}" opacity="0.25"/>

    <!-- Grid lines -->
    <line x1="0" y1="64" x2="${W}" y2="64" stroke="${accent}" stroke-opacity="0.07" stroke-width="1"/>
    <line x1="180" y1="0" x2="180" y2="${H}" stroke="${accent}" stroke-opacity="0.1" stroke-width="1"/>

    <!-- Flag emoji block -->
    <rect x="10" y="10" width="160" height="180" rx="12" fill="${flagColor}" fill-opacity="0.08" stroke="${flagColor}" stroke-opacity="0.18" stroke-width="1"/>
    <text x="90" y="96" font-size="52" text-anchor="middle" dominant-baseline="middle">${flag}</text>
    <text x="90" y="145" font-family="Arial,sans-serif" font-size="9" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="2">${esc(nation.epoch?.toUpperCase().split(" ")[0] || "STONE")}</text>
    <text x="90" y="162" font-family="Arial,sans-serif" font-size="9" fill="#64748b" text-anchor="middle">RANK #${rank}</text>

    <!-- Nation Name -->
    <text x="198" y="38" font-family="Arial Black,Arial,sans-serif" font-size="22" font-weight="900" fill="white">${name}</text>
    <text x="198" y="56" font-family="Arial,sans-serif" font-size="11" fill="${accent}">${epoch}  ·  Led by ${leader}</text>

    <!-- Stat grid: row 1 -->
    ${statBox(198,  72, "⚔ POWER",   power,    accent)}
    ${statBox(340,  72, "👥 POPULATION", pop,  "#4ade80")}
    ${statBox(500,  72, "📦 RESOURCES",  resources, "#fb923c")}
    ${statBox(640,  72, "🏆 RANK",    "#" + rank, "#f59e0b")}

    <!-- Stat grid: row 2 -->
    ${statBox(198, 130, "💰 NATION FUND",  `${fund} ${currName}`, "#22d3ee")}
    ${statBox(430, 130, "🤝 ALLIANCES",     allies,               "#a78bfa")}

    <!-- Game brand -->
    <text x="${W - 12}" y="${H - 10}" font-family="Arial,sans-serif" font-size="9" font-weight="700" fill="${accent}" text-anchor="end" opacity="0.55" letter-spacing="2">EPOCH NATIONS</text>
  </g>
</svg>`;
}

function statBox(x, y, label, value, color) {
  return `
    <text x="${x}" y="${y + 11}" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="#64748b" letter-spacing="1">${esc(label)}</text>
    <text x="${x}" y="${y + 27}" font-family="Arial Black,Arial,sans-serif" font-size="13" font-weight="800" fill="${color}">${esc(String(value))}</text>`;
}

Deno.serve(async (req) => {
  try {
    // CORS for embeds
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    };
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url    = new URL(req.url);
    const type   = url.searchParams.get("type") || "nation";
    const id     = url.searchParams.get("nation_id") || url.searchParams.get("id") || "";

    if (!id) {
      return new Response("Missing id parameter", { status: 400 });
    }

    const cacheKey = `${type}:${id}`;
    const cached   = cache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
      return new Response(cached.svg, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=60", "X-Cache": "HIT" }
      });
    }

    const base44     = createClientFromRequest(req);
    const allNations = await base44.asServiceRole.entities.Nation.list("-gdp", 100);
    const nation     = allNations.find(n => n.id === id);

    if (!nation) {
      return new Response("Nation not found", { status: 404, headers: corsHeaders });
    }

    // Strip private fields before rendering
    const safe = {
      id: nation.id,
      name: nation.name,
      epoch: nation.epoch,
      leader: nation.leader,
      flag_emoji: nation.flag_emoji,
      flag_color: nation.flag_color,
      currency: nation.currency,
      currency_name: nation.currency_name,
      gdp: nation.gdp,
      unit_power: nation.unit_power,
      defense_level: nation.defense_level,
      population: nation.population,
      stability: nation.stability,
      allies: nation.allies,
      res_wood: nation.res_wood,
      res_stone: nation.res_stone,
      res_gold: nation.res_gold,
      res_iron: nation.res_iron,
      res_oil: nation.res_oil,
      res_food: nation.res_food,
    };

    const rank   = getRank(nation, allNations);
    const accent = epochColor(nation.epoch);
    const svg    = buildSVG(safe, rank, accent);

    cache.set(cacheKey, { svg, ts: Date.now() });
    // Evict old cache entries
    if (cache.size > 500) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
      if (oldest) cache.delete(oldest[0]);
    }

    return new Response(svg, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=60", "X-Cache": "MISS" }
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});