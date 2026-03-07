import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

// ─── Time of Day Phases ────────────────────────────────────────────────────────
export const TIME_PHASES = [
  { name: "night",     start: 0,  end: 5,   label: "Night",     emoji: "🌙" },
  { name: "sunrise",   start: 5,  end: 7,   label: "Sunrise",   emoji: "🌅" },
  { name: "morning",   start: 7,  end: 12,  label: "Morning",   emoji: "🌤" },
  { name: "afternoon", start: 12, end: 17,  label: "Afternoon", emoji: "☀️" },
  { name: "sunset",    start: 17, end: 20,  label: "Sunset",    emoji: "🌇" },
  { name: "night2",    start: 20, end: 24,  label: "Night",     emoji: "🌙" },
];

// ─── Color Palettes per Phase ──────────────────────────────────────────────────
const PALETTES = {
  night: {
    bg:      "#04080f",
    panel:   "#0a1120",
    border:  "rgba(255,255,255,0.07)",
    text:    "#e2e8f0",
    muted:   "#64748b",
    glow:    "rgba(30,60,180,0.25)",
    overlay: "rgba(10,20,60,0.55)",
    accent:  "#22d3ee",
    gridLine:"rgba(0,200,255,0.02)",
  },
  sunrise: {
    bg:      "#1a0e07",
    panel:   "#261508",
    border:  "rgba(250,150,30,0.15)",
    text:    "#fef3c7",
    muted:   "#92400e",
    glow:    "rgba(251,146,60,0.30)",
    overlay: "rgba(120,40,0,0.35)",
    accent:  "#fb923c",
    gridLine:"rgba(251,146,60,0.03)",
  },
  morning: {
    bg:      "#f8fafc",
    panel:   "#ffffff",
    border:  "rgba(0,0,0,0.08)",
    text:    "#111827",
    muted:   "#6b7280",
    glow:    "rgba(6,182,212,0.10)",
    overlay: "rgba(240,249,255,0.2)",
    accent:  "#0891b2",
    gridLine:"rgba(0,0,0,0.03)",
  },
  afternoon: {
    bg:      "#fefce8",
    panel:   "#ffffff",
    border:  "rgba(0,0,0,0.07)",
    text:    "#111827",
    muted:   "#6b7280",
    glow:    "rgba(250,204,21,0.12)",
    overlay: "rgba(255,253,235,0.2)",
    accent:  "#b45309",
    gridLine:"rgba(0,0,0,0.025)",
  },
  sunset: {
    bg:      "#150a1e",
    panel:   "#1e0f2c",
    border:  "rgba(200,80,200,0.12)",
    text:    "#f3e8ff",
    muted:   "#7c3aed",
    glow:    "rgba(180,60,220,0.30)",
    overlay: "rgba(100,0,120,0.40)",
    accent:  "#e879f9",
    gridLine:"rgba(200,80,200,0.025)",
  },
  night2: {
    bg:      "#04080f",
    panel:   "#0a1120",
    border:  "rgba(255,255,255,0.07)",
    text:    "#e2e8f0",
    muted:   "#64748b",
    glow:    "rgba(30,60,180,0.25)",
    overlay: "rgba(10,20,60,0.55)",
    accent:  "#22d3ee",
    gridLine:"rgba(0,200,255,0.02)",
  },
};

// Static theme palettes
const STATIC_PALETTES = {
  dark: PALETTES.night,
  light: {
    bg:      "#ffffff",
    panel:   "#f5f5f5",
    border:  "rgba(0,0,0,0.09)",
    text:    "#111111",
    muted:   "#555555",
    glow:    "rgba(6,182,212,0.08)",
    overlay: "rgba(255,255,255,0.1)",
    accent:  "#0891b2",
    gridLine:"rgba(0,0,0,0.03)",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getGameHour() {
  // Use real UTC time as the global shared game clock
  const now = new Date();
  return now.getUTCHours() + now.getUTCMinutes() / 60;
}

function getCurrentPhase(hour) {
  for (const p of TIME_PHASES) {
    if (hour >= p.start && hour < p.end) return p;
  }
  return TIME_PHASES[0];
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

function blendHex(colorA, colorB, t) {
  if (!colorA.startsWith("#") || !colorB.startsWith("#")) return colorA;
  const [r1, g1, b1] = hexToRgb(colorA);
  const [r2, g2, b2] = hexToRgb(colorB);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

function blendPalettes(palA, palB, t) {
  const result = {};
  for (const key of Object.keys(palA)) {
    const a = palA[key], b = palB[key];
    if (a.startsWith("#") && b.startsWith("#")) {
      result[key] = blendHex(a, b, t);
    } else {
      result[key] = t < 0.5 ? a : b;
    }
  }
  return result;
}

function getPaletteForHour(hour) {
  // Find current and next phase
  const phases = ["night", "sunrise", "morning", "afternoon", "sunset", "night2"];
  const phaseOrder = TIME_PHASES;

  let currentPhase = TIME_PHASES[0];
  let nextPhase = TIME_PHASES[1];
  let blendFactor = 0;

  for (let i = 0; i < phaseOrder.length; i++) {
    const p = phaseOrder[i];
    if (hour >= p.start && hour < p.end) {
      currentPhase = p;
      nextPhase = phaseOrder[(i + 1) % phaseOrder.length];
      const phaseDuration = p.end - p.start;
      blendFactor = (hour - p.start) / phaseDuration;
      break;
    }
  }

  const palA = PALETTES[currentPhase.name];
  const palB = PALETTES[nextPhase.name] || PALETTES.night;
  return blendPalettes(palA, palB, blendFactor);
}

function applyPalette(palette) {
  const root = document.documentElement;
  root.style.setProperty("--theme-bg", palette.bg);
  root.style.setProperty("--theme-panel", palette.panel);
  root.style.setProperty("--theme-border", palette.border);
  root.style.setProperty("--theme-text", palette.text);
  root.style.setProperty("--theme-muted", palette.muted);
  root.style.setProperty("--theme-glow", palette.glow);
  root.style.setProperty("--theme-overlay", palette.overlay);
  root.style.setProperty("--theme-accent", palette.accent);
  root.style.setProperty("--theme-grid", palette.gridLine);
  document.body.style.background = palette.bg;
  document.body.style.color = palette.text;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({
  theme: "dark",
  setTheme: () => {},
  gameHour: 0,
  gameMinute: 0,
  phase: TIME_PHASES[0],
  palette: PALETTES.night,
  gameTimeLabel: "00:00",
});

export function useTheme() {
  return useContext(ThemeCtx);
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("epoch_theme") || "dark";
  });
  const [gameHour, setGameHour] = useState(getGameHour);
  const intervalRef = useRef(null);
  const rafRef = useRef(null);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem("epoch_theme", t);
  }, []);

  // Update game clock every 10 seconds (lightweight)
  useEffect(() => {
    function tick() {
      setGameHour(getGameHour());
    }
    tick();
    intervalRef.current = setInterval(tick, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Apply CSS variables with smooth transition
  useEffect(() => {
    let palette;
    if (theme === "realistic") {
      palette = getPaletteForHour(gameHour);
    } else if (theme === "light") {
      palette = STATIC_PALETTES.light;
    } else {
      palette = STATIC_PALETTES.dark;
    }
    applyPalette(palette);
  }, [theme, gameHour]);

  const rawHour = Math.floor(gameHour);
  const rawMinute = Math.floor((gameHour - rawHour) * 60);
  const phase = getCurrentPhase(gameHour);
  const palette = theme === "realistic"
    ? getPaletteForHour(gameHour)
    : theme === "light" ? STATIC_PALETTES.light : STATIC_PALETTES.dark;
  const gameTimeLabel = `${String(rawHour).padStart(2, "0")}:${String(rawMinute).padStart(2, "0")}`;

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, gameHour, gameMinute: rawMinute, phase, palette, gameTimeLabel }}>
      <div
        style={{
          transition: "background 3s ease-in-out, color 3s ease-in-out",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}