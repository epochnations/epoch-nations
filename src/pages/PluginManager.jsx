import { useState, useEffect } from "react";
import { loadPlugins, getPluginRegistry } from "@/components/plugins/core/PluginLoader";
import { gameAPI } from "@/components/plugins/core/GameAPI";
import { PLUGINS } from "@/components/plugins/PluginRegistry";
import { Package, CheckCircle, XCircle, AlertTriangle, Code, Globe, Box, Zap, BookOpen, ChevronDown, ChevronRight } from "lucide-react";

const TYPE_COLORS = {
  building:  { bg: "rgba(34,211,238,0.08)",   border: "rgba(34,211,238,0.25)",   text: "#22d3ee", icon: Box },
  resource:  { bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.25)",   text: "#fbbf24", icon: Zap },
  language:  { bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.25)",  text: "#a78bfa", icon: Globe },
  economy:   { bg: "rgba(74,222,128,0.08)",   border: "rgba(74,222,128,0.25)",   text: "#4ade80", icon: Zap },
  ui:        { bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.25)",  text: "#f87171", icon: Code },
  research:  { bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.25)",   text: "#60a5fa", icon: BookOpen },
  default:   { bg: "rgba(255,255,255,0.04)",  border: "rgba(255,255,255,0.1)",   text: "#94a3b8", icon: Package },
};

const STATUS_CONFIG = {
  loaded:   { icon: CheckCircle,    color: "#4ade80", label: "Loaded" },
  rejected: { icon: XCircle,        color: "#f87171", label: "Rejected" },
  blocked:  { icon: XCircle,        color: "#f87171", label: "Blocked (Security)" },
  error:    { icon: AlertTriangle,  color: "#fbbf24", label: "Error" },
};

function PluginCard({ plugin }) {
  const [expanded, setExpanded] = useState(false);
  const typeStyle  = TYPE_COLORS[plugin.manifest?.type] || TYPE_COLORS.default;
  const statusConf = STATUS_CONFIG[plugin.status] || STATUS_CONFIG.rejected;
  const StatusIcon = statusConf.icon;
  const TypeIcon   = typeStyle.icon;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}>
      <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}>
          <TypeIcon size={18} style={{ color: typeStyle.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{plugin.manifest?.name || plugin.id}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ep-mono"
              style={{ background: `${typeStyle.text}22`, color: typeStyle.text }}>
              {plugin.manifest?.type}
            </span>
            <span className="text-[10px] text-slate-500 ep-mono">v{plugin.manifest?.version}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">{plugin.manifest?.description}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <StatusIcon size={12} style={{ color: statusConf.color }} />
            <span className="text-[11px] font-bold" style={{ color: statusConf.color }}>{statusConf.label}</span>
            <span className="text-[10px] text-slate-600 ml-2">by {plugin.manifest?.author}</span>
          </div>
        </div>
        <div className="text-slate-500 shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-slate-500">Game Version:</span> <span className="text-white ep-mono">{plugin.manifest?.gameVersion}</span></div>
            <div><span className="text-slate-500">Entry:</span> <span className="text-white ep-mono">{plugin.manifest?.entry}</span></div>
          </div>
          {plugin.manifest?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {plugin.manifest.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full ep-mono"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {plugin.error && (
            <div className="rounded-lg p-2 text-xs text-red-300 ep-mono"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              ⚠️ {plugin.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SDKCard({ title, emoji, description, code }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl p-4 cursor-pointer" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      onClick={() => setOpen(!open)}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <div className="flex-1">
          <div className="font-bold text-white text-sm">{title}</div>
          <div className="text-xs text-slate-400">{description}</div>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </div>
      {open && code && (
        <pre className="mt-3 text-xs text-green-300 ep-mono overflow-x-auto rounded-lg p-3"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {code}
        </pre>
      )}
    </div>
  );
}

export default function PluginManager() {
  const [registry, setRegistry] = useState([]);
  const [tab, setTab] = useState("plugins");

  useEffect(() => {
    // Run loader and get registry
    loadPlugins(PLUGINS);
    setRegistry(getPluginRegistry());
  }, []);

  const loaded    = registry.filter(p => p.status === "loaded");
  const failed    = registry.filter(p => p.status !== "loaded");
  const buildings = gameAPI.getRegisteredBuildings();
  const resources = gameAPI.getRegisteredResources();
  const languages = gameAPI.getRegisteredLanguages();

  const TABS = [
    { id: "plugins",  label: "Plugins",   count: registry.length },
    { id: "sdk",      label: "SDK Docs",  count: null },
    { id: "registry", label: "Registered Content", count: buildings.length + resources.length + languages.length },
  ];

  return (
    <div className="min-h-screen ep-grid-bg" style={{ background: "#040810", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-white/8 px-6 py-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(34,211,238,0.3)" }}>
            <Package size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Plugin Manager</h1>
            <p className="text-xs text-slate-500">Epoch Nations Modding Architecture v1.0</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="ep-live-dot" />
            <span className="text-xs text-green-400 font-bold ep-mono">{loaded.length} active</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Plugins", value: registry.length, color: "#22d3ee" },
            { label: "Loaded",        value: loaded.length,   color: "#4ade80" },
            { label: "Failed",        value: failed.length,   color: failed.length > 0 ? "#f87171" : "#4ade80" },
            { label: "API Version",   value: "1.0",           color: "#a78bfa" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ background: `${color}0d`, border: `1px solid ${color}22` }}>
              <div className="text-2xl font-black ep-mono" style={{ color }}>{value}</div>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all"
              style={tab === t.id
                ? { background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }
                : { color: "#64748b", border: "1px solid transparent" }}>
              {t.label}
              {t.count !== null && <span className="ml-1.5 opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* Plugins Tab */}
        {tab === "plugins" && (
          <div className="space-y-3">
            {registry.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No plugins loaded yet.</p>
                <p className="text-xs mt-1">Add plugins to <code className="ep-mono">PluginRegistry.js</code></p>
              </div>
            ) : (
              registry.map(plugin => <PluginCard key={plugin.id} plugin={plugin} />)
            )}
          </div>
        )}

        {/* SDK Docs Tab */}
        {tab === "sdk" && (
          <div className="space-y-3">
            <SDKCard emoji="🏗️" title="Register a Building" description="Add a new building type to the game"
              code={`api.registerBuilding({
  id: "my_building",
  name: "My Building",
  emoji: "🏰",
  category: "civilian",          // civilian | military | government
  epoch_required: "Stone Age",
  cost: { wood: 100, stone: 50 },
  workers: 2,
  benefit: "Produces 10 food per tick",
  productionPerTick: { food: 10 },
});`} />
            <SDKCard emoji="💎" title="Register a Resource" description="Add a new resource type"
              code={`api.registerResource({
  id: "rare_crystal",
  name: "Rare Crystal",
  emoji: "💎",
  color: "#a78bfa",
  baseValue: 100,
});`} />
            <SDKCard emoji="🌐" title="Register a Language" description="Add a translation pack"
              code={`api.registerLanguage({
  id: "lang_fr",
  locale: "fr",
  displayName: "Français",
  flag: "🇫🇷",
  strings: { "wood": "Bois", "stone": "Pierre" },
});`} />
            <SDKCard emoji="📊" title="Register an Economy Rule" description="Modify nation economics per tick"
              code={`api.registerEconomyRule({
  id: "my_rule",
  description: "Bonus credits each tick",
  apply: (nation) => ({ currency: nation.currency + 5 }),
});`} />
            <SDKCard emoji="⚡" title="Register an Event" description="Add custom triggered events"
              code={`api.registerEvent({
  id: "solar_flare",
  title: "Solar Flare",
  severity: "warning",
  trigger: (nation) => Math.random() < 0.005,
  effect: (nation) => ({ stability: nation.stability - 5 }),
});`} />
            <SDKCard emoji="🔬" title="Register a Research Tree" description="Add new technology branches"
              code={`api.registerResearchTree({
  id: "renewable_branch",
  branch: "Renewable Energy",
  nodes: [
    { id: "solar_1", name: "Solar Basics", cost: 50, effect: "Unlock Solar Plant" },
    { id: "solar_2", name: "Advanced Solar", cost: 150, effect: "2x Solar output" },
  ],
});`} />
            <div className="rounded-2xl p-4 mt-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen size={16} className="text-cyan-400" /> Security Sandbox Rules
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-green-400 font-bold mb-1">✅ Allowed</div>
                  {["api.* methods", "Pure JS logic", "Math calculations", "console.log()"].map(r => (
                    <div key={r} className="text-slate-400 py-0.5">• {r}</div>
                  ))}
                </div>
                <div>
                  <div className="text-red-400 font-bold mb-1">❌ Forbidden</div>
                  {["window / document", "fetch() / XHR", "localStorage", "eval() / Function()"].map(r => (
                    <div key={r} className="text-slate-400 py-0.5">• {r}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registered Content Tab */}
        {tab === "registry" && (
          <div className="space-y-4">
            {[
              { title: "Plugin Buildings", items: buildings, color: "#22d3ee", renderItem: b => `${b.emoji} ${b.name} (${b.epoch_required})` },
              { title: "Plugin Resources", items: resources, color: "#fbbf24", renderItem: r => `${r.emoji} ${r.name} — base value: ${r.baseValue} cr` },
              { title: "Plugin Languages", items: languages, color: "#a78bfa", renderItem: l => `${l.flag} ${l.displayName} (${l.locale}) — ${Object.keys(l.strings || {}).length} strings` },
            ].map(({ title, items, color, renderItem }) => (
              <div key={title}>
                <div className="text-xs font-bold ep-mono text-slate-500 uppercase mb-2">{title} ({items.length})</div>
                {items.length === 0 ? (
                  <div className="text-xs text-slate-600 py-2 text-center">None registered</div>
                ) : (
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <div key={i} className="rounded-xl px-3 py-2 text-sm"
                        style={{ background: `${color}08`, border: `1px solid ${color}20`, color }}>
                        {renderItem(item)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}