import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const GRID_SIZE = 16;
const TILE_SIZE = 32;

const ZONE_COLORS = {
  empty: "#1a1f3a",
  residential: "#4ade80",
  commercial: "#fbbf24",
  industrial: "#ef4444",
  park: "#10b981",
  road: "#64748b",
};

export default function CityGrid({ city, zoningMode, onRefresh }) {
  const [grid, setGrid] = useState([]);
  const [hoveredTile, setHoveredTile] = useState(null);

  useEffect(() => {
    initializeGrid();
  }, [city?.id]);

  function initializeGrid() {
    if (!city?.city_grid || city.city_grid.length === 0) {
      const newGrid = Array(GRID_SIZE)
        .fill(null)
        .map(() =>
          Array(GRID_SIZE)
            .fill(null)
            .map(() => ({ zone: "empty", building: null, infrastructure: 0 }))
        );
      setGrid(newGrid);
    } else {
      setGrid(city.city_grid);
    }
  }

  async function handleTileClick(x, y) {
    if (!zoningMode) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[y][x].zone = zoningMode;

    setGrid(newGrid);

    // Update city grid in database
    await base44.entities.City.update(city.id, {
      city_grid: newGrid
    });

    onRefresh?.();
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
        {zoningMode ? `Zoning: ${zoningMode}` : "City Grid"}
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="inline-block" style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`, gap: "1px" }}>
          {grid.map((row, y) =>
            row.map((tile, x) => (
              <div
                key={`${x}-${y}`}
                onMouseEnter={() => setHoveredTile({ x, y })}
                onMouseLeave={() => setHoveredTile(null)}
                onClick={() => handleTileClick(x, y)}
                className={`cursor-pointer transition-all ${zoningMode ? "hover:brightness-125" : ""}`}
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  backgroundColor: ZONE_COLORS[tile.zone] || ZONE_COLORS.empty,
                  border: hoveredTile?.x === x && hoveredTile?.y === y ? "2px solid #06b6d4" : "1px solid rgba(255,255,255,0.1)",
                }}
                title={`(${x},${y}) - ${tile.zone}`}
              />
            ))
          )}
        </div>
      </div>

      <div className="text-xs text-slate-500 mt-3">
        Residential: {city.residential_zones} | Commercial: {city.commercial_zones} | Industrial: {city.industrial_zones} | Parks: {city.park_tiles}
      </div>
    </div>
  );
}