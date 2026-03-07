/**
 * MapSearchBar – autocomplete search for nations and cities.
 */
import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { CITIES } from "./MapTerrain";

export default function MapSearchBar({ nations, onSelectNation, onSelectCity }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setOpen(false); return; }
    const q = query.toLowerCase();
    const nationMatches = nations
      .filter(n => n.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(n => ({ type: "nation", label: n.name, sub: n.epoch, emoji: n.flag_emoji || "🏴", data: n }));
    const cityMatches = CITIES
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map(c => ({ type: "city", label: c.name, sub: "City", emoji: "🏙️", data: c }));
    setSuggestions([...nationMatches, ...cityMatches]);
    setOpen(true);
  }, [query, nations]);

  function handleSelect(item) {
    setQuery("");
    setOpen(false);
    if (item.type === "nation") onSelectNation?.(item.data);
    else onSelectCity?.(item.data);
  }

  return (
    <div className="relative w-full max-w-xs">
      <div className="flex items-center bg-black/60 border border-white/20 rounded-xl px-3 py-2 gap-2 backdrop-blur-sm">
        <Search size={13} className="text-slate-400 shrink-0"/>
        <input
          ref={inputRef}
          className="bg-transparent text-white text-xs placeholder-slate-500 outline-none flex-1 min-w-0"
          placeholder="Search nations, cities..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }}>
            <X size={11} className="text-slate-500 hover:text-white"/>
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-black/90 border border-white/20 rounded-xl overflow-hidden backdrop-blur-xl">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors text-left">
              <span className="text-base">{s.emoji}</span>
              <div className="min-w-0">
                <div className="text-xs text-white font-medium truncate">{s.label}</div>
                <div className="text-[10px] text-slate-500">{s.type === "nation" ? `Nation · ${s.sub}` : s.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}