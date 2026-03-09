/**
 * HexMapOverlays — Animated overlays for the global diplomacy layer:
 * trade routes, alliance lines, war borders, protection shields.
 */
import { useMemo } from "react";
import { hexToPixel } from "./HexEngine";

// Animated dashed trade route line between two points
function TradeRouteLine({ x1, y1, x2, y2, color = "#fbbf24" }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={1.5} opacity={0.6}
      strokeDasharray="8,6"
      style={{ animation: "tradeAnim 2s linear infinite" }}
    />
  );
}

function AllianceLine({ x1, y1, x2, y2 }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="#4ade80" strokeWidth={1.2} opacity={0.4}
      strokeDasharray="12,8"
      style={{ animation: "allianceAnim 3s linear infinite" }}
    />
  );
}

function WarLine({ x1, y1, x2, y2 }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="#f87171" strokeWidth={1.8} opacity={0.55}
      strokeDasharray="5,4"
      style={{ animation: "warAnim 1s linear infinite" }}
    />
  );
}

// Find capital tile for a nation
function getCapitalPos(tiles, nationId) {
  const capital = tiles.find(t => t.owner_nation_id === nationId && t.is_capital);
  if (!capital) {
    // fallback to first owned hex
    const any = tiles.find(t => t.owner_nation_id === nationId);
    if (any) return hexToPixel(any.q, any.r);
    return null;
  }
  return hexToPixel(capital.q, capital.r);
}

export default function HexMapOverlays({ tiles, nations, myNation, tradeRoutes, showAlliances, showTrade, showWars }) {
  const lines = useMemo(() => {
    const result = { alliances: [], wars: [], trade: [] };
    if (!nations.length || !tiles.length) return result;

    const posMap = {};
    for (const n of nations) {
      const pos = getCapitalPos(tiles, n.id);
      if (pos) posMap[n.id] = pos;
    }

    // Alliance lines
    if (showAlliances) {
      for (const n of nations) {
        for (const allyId of (n.allies || [])) {
          if (allyId > n.id) continue; // avoid duplicates
          const a = posMap[n.id], b = posMap[allyId];
          if (a && b) result.alliances.push({ key: `al_${n.id}_${allyId}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        }
      }
    }

    // War lines
    if (showWars) {
      for (const n of nations) {
        for (const enemyId of (n.at_war_with || [])) {
          if (enemyId > n.id) continue;
          const a = posMap[n.id], b = posMap[enemyId];
          if (a && b) result.wars.push({ key: `war_${n.id}_${enemyId}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        }
      }
    }

    // Trade routes
    if (showTrade && tradeRoutes) {
      for (const tr of tradeRoutes) {
        const a = posMap[tr.from_nation_id], b = posMap[tr.to_nation_id];
        if (a && b) result.trade.push({ key: tr.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    }

    return result;
  }, [tiles, nations, tradeRoutes, showAlliances, showTrade, showWars]);

  return (
    <g>
      <style>{`
        @keyframes tradeAnim   { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -28; } }
        @keyframes allianceAnim{ from { stroke-dashoffset: 0; } to { stroke-dashoffset: -40; } }
        @keyframes warAnim     { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -18; } }
      `}</style>
      {lines.alliances.map(l => <AllianceLine key={l.key} {...l} />)}
      {lines.wars.map(l => <WarLine key={l.key} {...l} />)}
      {lines.trade.map(l => <TradeRouteLine key={l.key} {...l} />)}
    </g>
  );
}