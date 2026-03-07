import { Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const OPTIONS = [
  { value: "dark",      label: "Dark",      icon: Moon,  desc: "Deep navy UI" },
  { value: "light",     label: "Light",     icon: Sun,   desc: "True white" },
  { value: "realistic", label: "Realistic", icon: Globe, desc: "Day/night cycle" },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            theme === value
              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
              : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon size={12} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}