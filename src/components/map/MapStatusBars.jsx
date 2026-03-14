/**
 * MapStatusBars — War countdown + New player protection bar
 * shown at the top of the World Map.
 */
import { useState, useEffect } from "react";
import { WAR_DURATION_MS } from "../game/GameClock";

// 48 real hours in ms for new player protection
const PROTECTION_MS = 48 * 60 * 60 * 1000;

function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    if (targetMs <= 0) return;
    const iv = setInterval(() => {
      setRemaining(Math.max(0, targetMs - Date.now()));
    }, 1000);
    return () => clearInterval(iv);
  }, [targetMs]);
  return remaining;
}

function formatTime(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// War bar countdown
export function WarCountdownBar({ nation }) {
  const isAtWar = (nation?.at_war_with || []).length > 0;
  const warStartedAt = nation?.war_started_at;

  const endTime = warStartedAt ? new Date(warStartedAt).getTime() + WAR_DURATION_MS : 0;
  const remaining = useCountdown(endTime);

  if (!isAtWar || !warStartedAt || remaining <= 0) return null;

  const pct = Math.min(100, (remaining / WAR_DURATION_MS) * 100);

  return (
    <div className="relative w-full overflow-hidden" style={{
      background: "linear-gradient(90deg, rgba(180,20,20,0.9), rgba(120,0,0,0.85))",
      borderBottom: "1px solid rgba(255,80,80,0.4)"
    }}>
      {/* Progress fill (drains to zero) */}
      <div className="absolute inset-0 origin-left transition-none"
        style={{
          width: `${pct}%`,
          background: "rgba(255,60,60,0.2)",
          transition: "width 1s linear"
        }}/>
      <div className="relative flex items-center justify-between px-3 py-1 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs animate-pulse">⚔️</span>
          <span className="text-xs font-black text-red-200 tracking-wider uppercase">AT WAR</span>
          <span className="text-xs text-red-300 font-bold ep-mono">— War ends in:</span>
        </div>
        <span className="text-sm font-black text-white ep-mono tracking-widest"
          style={{ textShadow: "0 0 10px rgba(255,80,80,0.8)" }}>
          {formatTime(remaining)}
        </span>
      </div>
    </div>
  );
}

// New player protection bar
export function ProtectionBar({ nation }) {
  const createdDate = nation?.created_date;
  if (!createdDate) return null;

  const createdAt = new Date(createdDate).getTime();
  const endTime = createdAt + PROTECTION_MS;
  const remaining = useCountdown(endTime);
  const isAtWar = (nation?.at_war_with || []).length > 0;

  // Don't show if protection expired or nation is somehow already at war
  if (remaining <= 0 || isAtWar) return null;

  const pct = Math.min(100, (remaining / PROTECTION_MS) * 100);

  // Color transitions: green → yellow → orange → red as time runs out
  const getColor = () => {
    if (pct > 60) return { bg: "rgba(20,120,40,0.9)", bar: "#22c55e", border: "rgba(34,197,94,0.4)", text: "text-green-200", countdown: "text-green-100" };
    if (pct > 35) return { bg: "rgba(120,100,10,0.9)", bar: "#eab308", border: "rgba(234,179,8,0.4)", text: "text-yellow-200", countdown: "text-yellow-100" };
    if (pct > 15) return { bg: "rgba(160,80,10,0.9)", bar: "#f97316", border: "rgba(249,115,22,0.4)", text: "text-orange-200", countdown: "text-orange-100" };
    return { bg: "rgba(160,20,20,0.9)", bar: "#ef4444", border: "rgba(239,68,68,0.4)", text: "text-red-200", countdown: "text-red-100" };
  };

  const c = getColor();

  return (
    <div className="relative w-full overflow-hidden" style={{
      background: `linear-gradient(90deg, ${c.bg}, rgba(0,0,0,0.7))`,
      borderBottom: `1px solid ${c.border}`
    }}>
      {/* Protection drain bar */}
      <div className="absolute bottom-0 left-0 h-0.5 transition-none"
        style={{ width: `${pct}%`, background: c.bar, transition: "width 1s linear" }}/>
      <div className="relative flex items-center justify-between px-3 py-1 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs">🛡️</span>
          <span className={`text-xs font-black tracking-wider uppercase ${c.text}`}>PROTECTED</span>
          <span className={`text-xs font-bold ep-mono hidden sm:inline ${c.text} opacity-70`}>
            — War protection expires in:
          </span>
        </div>
        <span className={`text-sm font-black ep-mono tracking-widest ${c.countdown}`}
          style={{ textShadow: `0 0 10px ${c.bar}80` }}>
          {formatTime(remaining)}
        </span>
      </div>
    </div>
  );
}