import { useState, useEffect } from "react";
import { getGameTime, TICK_MS } from "../game/GameClock";

/**
 * GameClockDisplay — live game calendar indicator
 * Updates every real minute (1 tick). Shows: Day X • Week X • Month X • Year X
 */
export default function GameClockDisplay() {
  const [gt, setGt] = useState(getGameTime);

  useEffect(() => {
    // Update on tick boundaries
    const msUntilNextTick = TICK_MS - (Date.now() % TICK_MS);
    let interval;
    const timeout = setTimeout(() => {
      setGt(getGameTime());
      interval = setInterval(() => setGt(getGameTime()), TICK_MS);
    }, msUntilNextTick);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl ep-mono text-[10px] font-bold tracking-wide select-none"
      style={{
        background: "rgba(6,182,212,0.06)",
        border: "1px solid rgba(6,182,212,0.15)",
        color: "rgba(6,182,212,0.85)",
      }}
      title="Game Calendar (persistent world clock)"
    >
      <span style={{ color: "rgba(6,182,212,0.5)" }}>🌐</span>
      <span>Day {gt.day}</span>
      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
      <span>Week {gt.week}</span>
      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
      <span>Month {gt.month}</span>
      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
      <span style={{ color: "#a78bfa" }}>Year {gt.year}</span>
    </div>
  );
}