/**
 * HexMapOverlays — animated diplomacy lines between nation capitals.
 * Trade routes (amber dashes), alliance lines (green), war lines (red pulsing).
 */
import { useMemo } from "react";
import { hexToPixel, HEX_SIZE } from "./HexEngine";

function getCapitalPos(tiles, nationId) {
  const capital = tiles.find(t => t.owner_nation_id === nationId && t.is_capital);
  const any     = capital || tiles.find(t => t.owner_nation_id === nationId);
  return any ? hexToPixel(any.q, any.r, HEX_SIZE) : null;
}

function AnimatedLine({ x1, y1, x2, y2, color, width, dashArray, animName, opacity = 0.7 }) {
  return (
    <g>
      {/* glow */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={width * 3} opacity={opacity * 0.2} strokeLinecap="round" />
      {/* line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={width} opacity={opacity}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        style={{ animation: `${animName} 1.8s linear infinite` }} />
    </g>
  );
}

export default function HexMapOverlays({ tiles, nations, tradeRoutes, showAlliances, showTrade, showWars }) {
  const posMap = useMemo(() => {
    const m = {};
    for (const n of nations) {
      const pos = getCapitalPos(tiles, n.id);
      if (pos) m[n.id] = pos;
    }
    return m;
  }, [tiles, nations]);

  const alliances = useMemo(() => {
    if (!showAlliances) return [];
    const seen = new Set();
    const lines = [];
    for (const n of nations) {
      for (const allyId of (n.allies || [])) {
        const key = [n.id, allyId].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const a = posMap[n.id], b = posMap[allyId];
        if (a && b) lines.push({ key, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    }
    return lines;
  }, [nations, posMap, showAlliances]);

  const wars = useMemo(() => {
    if (!showWars) return [];
    const seen = new Set();
    const lines = [];
    for (const n of nations) {
      for (const enemyId of (n.at_war_with || [])) {
        const key = [n.id, enemyId].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const a = posMap[n.id], b = posMap[enemyId];
        if (a && b) lines.push({ key, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    }
    return lines;
  }, [nations, posMap, showWars]);

  const trade = useMemo(() => {
    if (!showTrade || !tradeRoutes) return [];
    return tradeRoutes
      .map(tr => {
        const a = posMap[tr.from_nation_id], b = posMap[tr.to_nation_id];
        return a && b ? { key: tr.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y } : null;
      })
      .filter(Boolean);
  }, [tradeRoutes, posMap, showTrade]);

  return (
    <g>
      <style>{`
        @keyframes dashMoveAlliance { to { stroke-dashoffset: -40; } }
        @keyframes dashMoveTrade    { to { stroke-dashoffset: -28; } }
        @keyframes dashMoveWar      { to { stroke-dashoffset: -18; } }
      `}</style>

      {alliances.map(l => (
        <AnimatedLine key={l.key} {...l}
          color="#4ade80" width={1.5} dashArray="10,8"
          animName="dashMoveAlliance" opacity={0.65} />
      ))}
      {wars.map(l => (
        <AnimatedLine key={l.key} {...l}
          color="#f87171" width={2} dashArray="5,4"
          animName="dashMoveWar" opacity={0.8} />
      ))}
      {trade.map(l => (
        <AnimatedLine key={l.key} {...l}
          color="#fbbf24" width={1.2} dashArray="8,6"
          animName="dashMoveTrade" opacity={0.55} />
      ))}
    </g>
  );
}