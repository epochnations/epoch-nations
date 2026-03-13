import { useState } from "react";
import { Copy, Check, Facebook, Twitter, Link, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const BASE_URL = "https://epochnations.com";

function getBannerUrl(nationId) {
  // Use the base44 function endpoint for the live banner
  return `${BASE_URL}/banner/nation/${nationId}.png`;
}

function getProfileUrl(nationId) {
  return `${BASE_URL}/nation/${nationId}`;
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg px-3 py-2 font-mono text-xs text-slate-300 overflow-x-auto whitespace-nowrap"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {value}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-w-[72px] justify-center"
          style={{
            background: copied ? "rgba(74,222,128,0.15)" : "rgba(6,182,212,0.12)",
            border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(6,182,212,0.25)"}`,
            color: copied ? "#4ade80" : "#22d3ee"
          }}
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
    </div>
  );
}

function SocialButton({ icon: SocialIcon, label, color, href, onClick }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
      style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
    >
      <SocialIcon size={15} />
      {label}
    </a>
  );
}

export default function NationSharePanel({ nation, allNations }) {
  const nationId   = nation?.id;
  const bannerUrl  = getBannerUrl(nationId);
  const profileUrl = getProfileUrl(nationId);

  // Compute rank
  const sorted = [...(allNations || [])].sort((a, b) => (b.gdp || 0) - (a.gdp || 0));
  const rank   = sorted.findIndex(n => n.id === nationId) + 1 || "?";

  const ogTitle = `${nation.name} - Epoch Nations`;
  const ogDesc  = `Epoch: ${nation.epoch} | Rank #${rank} | Power ${nation.unit_power || 0} | Nation Fund ${Math.floor(nation.currency || 0).toLocaleString()} ${nation.currency_name || "Credits"}`;

  const htmlEmbed   = `<img src="${bannerUrl}" alt="${nation.name} - Epoch Nations" style="max-width:760px;width:100%;border-radius:12px;" />`;
  const bbcodeEmbed = `[img]${bannerUrl}[/img]`;

  const twitterShare  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${ogTitle}\n${ogDesc}\n`)}&url=${encodeURIComponent(profileUrl)}`;
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(ogDesc)}`;
  const discordNote   = `${ogTitle}\n${ogDesc}\n${profileUrl}`;

  const [discordCopied, setDiscordCopied] = useState(false);
  const copyDiscord = () => {
    navigator.clipboard.writeText(discordNote);
    setDiscordCopied(true);
    setTimeout(() => setDiscordCopied(false), 2000);
  };

  // Live banner preview via actual function
  const liveBannerSrc = `${window.location.origin.replace(/:\d+/, "")}/api/functions/nationBanner?nation_id=${nationId}`;

  return (
    <div className="space-y-6">

      {/* Banner Preview */}
      <div className="rounded-2xl overflow-hidden p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Share2 size={15} className="text-cyan-400" />
          Live Banner Preview
          <span className="text-xs text-slate-500 font-normal ml-1">— auto-updates when your nation changes</span>
        </div>
        {/* Rendered SVG banner inline */}
        <NationBannerCard nation={nation} rank={rank} />
      </div>

      {/* Embed Codes */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="text-sm font-bold text-white">📋 Embed Codes</div>
        <CopyField label="HTML Embed" value={htmlEmbed} />
        <CopyField label="Forum / BBCode Embed" value={bbcodeEmbed} />
        <CopyField label="Direct Profile Link" value={profileUrl} />
        <CopyField label="Banner Image URL" value={bannerUrl} />
      </div>

      {/* Open Graph / Social Meta Info */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="text-sm font-bold text-white">🔗 Social Media Preview</div>
        <div className="rounded-xl p-4 space-y-2 text-xs"
          style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div><span className="text-slate-500">og:title</span> <span className="text-slate-200 ml-2">{ogTitle}</span></div>
          <div><span className="text-slate-500">og:description</span> <span className="text-slate-200 ml-2">{ogDesc}</span></div>
          <div><span className="text-slate-500">og:image</span> <span className="text-cyan-400 ml-2 font-mono break-all">{bannerUrl}</span></div>
          <div><span className="text-slate-500">og:url</span> <span className="text-cyan-400 ml-2 font-mono break-all">{profileUrl}</span></div>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <SocialButton icon={Twitter} label="Share on X" color="#1d9bf0" href={twitterShare} />
          <SocialButton icon={Facebook} label="Facebook" color="#1877f2" href={facebookShare} />
          <SocialButton icon={Link} label="Copy Profile Link" color="#a78bfa" href="#"
            onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(profileUrl); }} />
          <button
            onClick={copyDiscord}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: "#5865f218", border: "1px solid #5865f235", color: "#7289da" }}
          >
            {discordCopied ? <><Check size={15} /> Copied!</> : <>🎮 Copy for Discord</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline rendered banner (no external image request needed for preview) ──
function NationBannerCard({ nation, rank }) {
  const accent = epochColor(nation.epoch);
  const flag   = nation.flag_emoji || "🏴";
  const fc     = nation.flag_color || "#3b82f6";
  const allies = Array.isArray(nation.allies) && nation.allies.length > 0
    ? nation.allies.slice(0, 3).join(", ")
    : "None";
  const resources = (nation.res_wood || 0) + (nation.res_stone || 0) + (nation.res_gold || 0) +
                    (nation.res_iron || 0) + (nation.res_oil || 0) + (nation.res_food || 0);

  const stats = [
    { label: "⚔ POWER",       value: (nation.unit_power || 0).toLocaleString(), color: accent },
    { label: "👥 POPULATION",  value: (nation.population || 0).toLocaleString(),  color: "#4ade80" },
    { label: "📦 RESOURCES",   value: resources.toLocaleString(),                  color: "#fb923c" },
    { label: "🏆 RANK",        value: `#${rank}`,                                  color: "#f59e0b" },
  ];
  const stats2 = [
    { label: "💰 NATION FUND", value: `${Math.floor(nation.currency || 0).toLocaleString()} ${nation.currency_name || "Credits"}`, color: "#22d3ee" },
    { label: "🤝 ALLIANCES",    value: allies,                                      color: "#a78bfa" },
  ];

  return (
    <div className="w-full rounded-2xl overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #060b18 0%, #0d1a2e 100%)", border: `1px solid ${accent}22`, boxShadow: `0 0 30px ${accent}15`, minHeight: 160 }}>
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      <div className="flex gap-0">
        {/* Flag column */}
        <div className="flex flex-col items-center justify-center px-5 py-4 min-w-[110px]"
          style={{ background: `linear-gradient(180deg, ${fc}18 0%, transparent 100%)`, borderRight: `1px solid ${fc}18` }}>
          <div className="text-5xl">{flag}</div>
          <div className="text-[9px] font-bold mt-2 tracking-widest" style={{ color: accent }}>
            {nation.epoch?.toUpperCase().split(" ")[0] || "STONE"}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">RANK #{rank}</div>
        </div>

        {/* Right content */}
        <div className="flex-1 px-4 py-3 space-y-2">
          <div>
            <div className="font-black text-lg text-white leading-tight">{nation.name}</div>
            <div className="text-xs mt-0.5" style={{ color: accent }}>{nation.epoch} · Led by {nation.leader || "Unknown"}</div>
          </div>
          {/* Row 1 stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {stats.map(s => (
              <div key={s.label} className="rounded-lg p-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[9px] text-slate-500 font-bold">{s.label}</div>
                <div className="text-xs font-black mt-0.5" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* Row 2 stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stats2.map(s => (
              <div key={s.label} className="rounded-lg p-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[9px] text-slate-500 font-bold">{s.label}</div>
                <div className="text-xs font-black mt-0.5" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game brand */}
      <div className="absolute bottom-2 right-3 text-[8px] font-bold tracking-widest opacity-40" style={{ color: accent }}>
        EPOCH NATIONS
      </div>
    </div>
  );
}

function epochColor(epoch) {
  const map = {
    "Stone Age": "#a78bfa", "Bronze Age": "#f59e0b", "Iron Age": "#94a3b8",
    "Classical Age": "#fb923c", "Medieval Age": "#60a5fa", "Renaissance Age": "#34d399",
    "Industrial Age": "#f97316", "Modern Age": "#22d3ee", "Digital Age": "#818cf8",
    "Information Age": "#38bdf8", "Space Age": "#c084fc", "Galactic Age": "#f0abfc",
  };
  return map[epoch] || "#22d3ee";
}