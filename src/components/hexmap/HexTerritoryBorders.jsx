/**
 * HexTerritoryBorders — draws thick glowing borders ONLY along edges
 * that are shared between two hexes of the SAME nation (inner territory lines)
 * and outer hull edges (border with unclaimed/enemy land).
 *
 * This gives the "connected territory" look where patches of owned hexes
 * form a visible nation outline.
 */
import { memo, useMemo } from "react";
import { hexToPixel, hexCorners, hexNeighbors, HEX_SIZE } from "./HexEngine";

const NEIGHBOR_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

const HexTerritoryBorders = memo(function HexTerritoryBorders({ tiles, zoom }) {
  // Build a map: hex_id → tile
  const tileMap = useMemo(() => {
    const m = {};
    for (const t of tiles) if (t.owner_nation_id) m[t.hex_id] = t;
    return m;
  }, [tiles]);

  // For each owned tile, check each of its 6 edges.
  // If the neighbor is ALSO owned by the SAME nation → inner shared edge (skip border, or draw subtle line)
  // If the neighbor is NOT owned by same nation → outer border edge
  const borders = useMemo(() => {
    const result = []; // { x1,y1,x2,y2, color, isOuter }
    const seen = new Set();

    for (const tile of Object.values(tileMap)) {
      const { q, r, owner_nation_id, owner_color } = tile;
      const pos = hexToPixel(q, r, HEX_SIZE);
      const corners = hexCorners(pos.x, pos.y, HEX_SIZE);

      NEIGHBOR_DIRS.forEach(([dq, dr], i) => {
        const nId = `${q + dq}_${r + dr}`;
        const edgeKey = [
          `${q}_${r}`,
          nId,
        ].sort().join("|");

        if (seen.has(edgeKey)) return;
        seen.add(edgeKey);

        const neighborTile = tileMap[nId];
        const neighborSameNation = neighborTile?.owner_nation_id === owner_nation_id;

        if (!neighborSameNation) {
          // Outer border — draw glowing edge
          const a = corners[i];
          const b = corners[(i + 1) % 6];
          result.push({
            x1: a.x, y1: a.y, x2: b.x, y2: b.y,
            color: owner_color || "#22d3ee",
            isOuter: true,
          });
        }
        // Inner shared edges: don't draw a border (territories connect seamlessly)
      });
    }
    return result;
  }, [tileMap]);

  if (!borders.length) return null;

  return (
    <g>
      {borders.map((b, i) => (
        <g key={i}>
          {/* Glow halo */}
          <line
            x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
            stroke={b.color}
            strokeWidth={5 / zoom}
            opacity={0.18}
            strokeLinecap="round"
          />
          {/* Crisp border */}
          <line
            x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
            stroke={b.color}
            strokeWidth={2.2 / zoom}
            opacity={0.85}
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
});

export default HexTerritoryBorders;