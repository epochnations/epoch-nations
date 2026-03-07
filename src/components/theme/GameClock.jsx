import { Clock } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function GameClock() {
  const { gameTimeLabel, phase, theme } = useTheme();

  const glowColor = theme === "realistic"
    ? { night: "#22d3ee", night2: "#22d3ee", sunrise: "#fb923c", morning: "#0891b2", afternoon: "#b45309", sunset: "#e879f9" }[phase.name] || "#22d3ee"
    : "#22d3ee";

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 bg-white/5"
      style={{ textShadow: `0 0 8px ${glowColor}40` }}
      title={`Game Time — ${phase.emoji} ${phase.label}`}
    >
      <Clock size={11} className="opacity-70" />
      <span className="font-mono tracking-wider" style={{ color: glowColor }}>{gameTimeLabel}</span>
      <span className="text-slate-500">{phase.emoji}</span>
    </div>
  );
}