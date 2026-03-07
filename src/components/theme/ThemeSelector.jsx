import { Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "dark",      label: "Dark",      IconComp: Moon  },
    { value: "light",     label: "Light",     IconComp: Sun   },
    { value: "realistic", label: "Realistic", IconComp: Globe },
  ];

  return (
    <div className="flex items-center gap-1">
      {options.map(({ value, label, IconComp }) => (
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
          <IconComp size={12} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}