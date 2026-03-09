import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const STATIC_ITEMS = [
  { text: "OIL ▲ $84 (+4%)", color: "#4ade80" },
  { text: "STEEL ▼ $220 (-2%)", color: "#f87171" },
  { text: "FOOD ▲ $110 (+1%)", color: "#4ade80" },
  { text: "URANIUM ▲ $310 (+7%)", color: "#4ade80" },
  { text: "GOLD ▼ $1,820 (-0.5%)", color: "#f87171" },
];

export default function IntelTicker() {
  const [items, setItems] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    loadItems();
    const unsub = base44.entities.WorldChronicle.subscribe(() => loadItems());
    return unsub;
  }, []);

  async function loadItems() {
    try {
      const chronicles = await base44.entities.WorldChronicle.list("-created_date", 10);
      const txs = await base44.entities.Transaction.list("-created_date", 8);
      const warTxs = txs.filter(t => t.type === "war_attack");
      const msgs = await base44.entities.ChatMessage.filter({ channel: "system" }, "-created_date", 5);

      const dynamicItems = [
        ...chronicles.slice(0, 5).map(c => ({
          text: `${c.importance === "critical" ? "🔴 BREAKING: " : "📡 "}${c.title}`,
          color: c.importance === "critical" ? "#f87171" : c.importance === "high" ? "#fb923c" : "#94a3b8",
        })),
        ...warTxs.slice(0, 3).map(t => ({
          text: `⚔️ ${t.from_nation_name} declares war on ${t.to_nation_name}`,
          color: "#f87171",
        })),
        ...msgs.slice(0, 3).map(m => ({
          text: `🌐 ${(m.content || "").replace(/\n/g, " ").slice(0, 80)}`,
          color: "#94a3b8",
        })),
        ...STATIC_ITEMS,
      ].filter(i => i.text?.trim());

      setItems(dynamicItems.length ? dynamicItems : STATIC_ITEMS);
    } catch {
      setItems(STATIC_ITEMS);
    }
  }

  if (!items.length) return null;

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-black/80 border-b border-cyan-900/40 relative"
      style={{ backdropFilter: "blur(12px)" }}>
      <div className="flex items-center h-9">
        {/* Label */}
        <div className="shrink-0 px-3 h-full flex items-center gap-1.5 bg-red-600 z-10">
          <span className="text-[9px] font-black tracking-widest text-white">LIVE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
        <div className="shrink-0 px-3 h-full flex items-center bg-[#0a0f1e] border-r border-white/10 z-10">
          <span className="text-[9px] font-black text-cyan-400 tracking-widest ep-mono">INTEL FEED</span>
        </div>
        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden relative">
          <div ref={trackRef} className="flex items-center gap-0 whitespace-nowrap"
            style={{ animation: "ep-ticker 60s linear infinite" }}>
            {doubled.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-3 px-5 text-[11px] font-semibold ep-mono"
                style={{ color: item.color || "#94a3b8" }}>
                {item.text}
                <span className="text-slate-700">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}