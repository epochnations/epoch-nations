/**
 * PerspectiveSwitcher — Floating mode dock for switching between
 * Nation (grand strategy), City (builder), and Civilian (tycoon) views.
 */
import { createPageUrl } from "@/utils";

const MODES = [
  { id: "nation",   label: "Nation",   icon: "🗺️", color: "#22d3ee", page: "Dashboard",      desc: "Grand Strategy" },
  { id: "city",     label: "City",     icon: "🏙️", color: "#4ade80", page: "CityManagement", desc: "City Builder"   },
  { id: "civilian", label: "Civilian", icon: "👤", color: "#f59e0b", page: "CivilianView",   desc: "Tycoon Mode"    },
];

export default function PerspectiveSwitcher({ currentMode = "nation", compact = false }) {
  return (
    <div
      className={`flex items-center ${compact ? "gap-0.5" : "gap-1"} p-1 rounded-2xl`}
      style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
    >
      {MODES.map(mode => {
        const active = currentMode === mode.id;
        return (
          <a
            key={mode.id}
            href={createPageUrl(mode.page)}
            title={mode.desc}
            className={`flex items-center gap-1.5 rounded-xl font-bold transition-all ${compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}
            style={{
              background: active ? `${mode.color}20` : "transparent",
              border: `1px solid ${active ? mode.color + "40" : "transparent"}`,
              color: active ? mode.color : "#4b5563",
              textDecoration: "none",
            }}
          >
            <span>{mode.icon}</span>
            <span className={compact ? "hidden sm:inline" : ""}>{mode.label}</span>
            {active && !compact && (
              <span className="text-[8px] opacity-50 hidden sm:inline">● ACTIVE</span>
            )}
          </a>
        );
      })}
    </div>
  );
}