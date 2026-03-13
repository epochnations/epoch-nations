import { EPOCHS, EPOCH_COLOR, EPOCH_EMOJI } from "../game/EpochConfig";

const ACHIEVEMENTS = [
  {
    id: "first_nation",
    icon: "🌱",
    label: "First Nation Founded",
    color: "#4ade80",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      return sorted[0] ? { nation: sorted[0], detail: new Date(sorted[0].created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : null;
    }
  },
  {
    id: "highest_epoch",
    icon: "🚀",
    label: "Most Advanced Epoch",
    color: "#818cf8",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => EPOCHS.indexOf(b.epoch) - EPOCHS.indexOf(a.epoch));
      const top = sorted[0];
      return top ? { nation: top, detail: `${EPOCH_EMOJI[top.epoch]} ${top.epoch}` } : null;
    }
  },
  {
    id: "largest_pop",
    icon: "👥",
    label: "Largest Population Ever",
    color: "#22d3ee",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => (b.population || 0) - (a.population || 0));
      const top = sorted[0];
      return top ? { nation: top, detail: `${(top.population || 0).toLocaleString()} citizens` } : null;
    }
  },
  {
    id: "richest",
    icon: "💰",
    label: "Wealthiest Nation",
    color: "#fbbf24",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => (b.national_wealth || 0) - (a.national_wealth || 0));
      const top = sorted[0];
      return top ? { nation: top, detail: `${(top.national_wealth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} cr` } : null;
    }
  },
  {
    id: "most_techs",
    icon: "🔬",
    label: "Most Technologies Unlocked",
    color: "#a78bfa",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => b.techCount - a.techCount);
      const top = sorted[0];
      return top ? { nation: top, detail: `${top.techCount} technologies` } : null;
    }
  },
  {
    id: "most_allies",
    icon: "🤝",
    label: "Most Allied Nation",
    color: "#4ade80",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => b.allyCount - a.allyCount);
      const top = sorted[0];
      return top ? { nation: top, detail: `${top.allyCount} allies` } : null;
    }
  },
  {
    id: "most_kills",
    icon: "⚔️",
    label: "Most War Victories",
    color: "#f87171",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => b.kills - a.kills);
      const top = sorted[0];
      return top ? { nation: top, detail: `${top.kills} attacks landed` } : null;
    }
  },
  {
    id: "most_buildings",
    icon: "🏗️",
    label: "Most Infrastructure Built",
    color: "#fb923c",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => b.buildingCount - a.buildingCount);
      const top = sorted[0];
      return top ? { nation: top, detail: `${top.buildingCount} buildings` } : null;
    }
  },
  {
    id: "most_trades",
    icon: "🚢",
    label: "Most Active Trader",
    color: "#34d399",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => b.tradeCount - a.tradeCount);
      const top = sorted[0];
      return top ? { nation: top, detail: `${top.tradeCount} trade routes` } : null;
    }
  },
  {
    id: "highest_gdp",
    icon: "💹",
    label: "Highest GDP Ever",
    color: "#22d3ee",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => (b.gdp || 0) - (a.gdp || 0));
      const top = sorted[0];
      return top ? { nation: top, detail: `${(top.gdp || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} cr` } : null;
    }
  },
  {
    id: "longest_lived",
    icon: "⏳",
    label: "Oldest Living Nation",
    color: "#94a3b8",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => b.gameDaysAlive - a.gameDaysAlive);
      const top = sorted[0];
      return top ? { nation: top, detail: `${top.gameDaysAlive} game days` } : null;
    }
  },
  {
    id: "most_stable",
    icon: "⚖️",
    label: "Most Stable Government",
    color: "#4ade80",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => (b.stability || 0) - (a.stability || 0));
      const top = sorted[0];
      return top ? { nation: top, detail: `${top.stability || 0} stability` } : null;
    }
  },
  {
    id: "strongest_military",
    icon: "🛡️",
    label: "Strongest Military",
    color: "#f87171",
    resolver: (nations) => {
      const sorted = [...nations].sort((a, b) => ((b.unit_power || 0) + (b.defense_level || 0)) - ((a.unit_power || 0) + (a.defense_level || 0)));
      const top = sorted[0];
      return top ? { nation: top, detail: `${(top.unit_power || 0) + (top.defense_level || 0)} combined power` } : null;
    }
  },
];

export default function FirstAchievements({ nations }) {
  if (!nations.length) return (
    <div className="text-center py-16 text-slate-600 text-sm ep-mono">No nation data available yet.</div>
  );

  const results = ACHIEVEMENTS.map(a => ({ ...a, result: a.resolver(nations) })).filter(a => a.result);

  return (
    <div className="space-y-4">
      <div className="text-[10px] text-slate-600 ep-mono">
        WORLD FIRSTS & ALL-TIME RECORDS — {results.length} ACHIEVEMENTS
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map(a => {
          const { nation, detail } = a.result;
          return (
            <div key={a.id} className="rounded-2xl border p-4 space-y-3"
              style={{ background: `${a.color}07`, borderColor: `${a.color}20` }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold ep-mono tracking-wider" style={{ color: a.color }}>
                    {a.label.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{nation.flag_emoji || "🏴"}</span>
                <div>
                  <div className="font-black text-white text-sm">{nation.name}</div>
                  <div className="text-[10px] text-slate-500 ep-mono">{nation.leader}</div>
                </div>
              </div>
              <div className="text-xs font-bold ep-mono px-2 py-1 rounded-lg inline-block"
                style={{ background: `${a.color}15`, color: a.color }}>
                {detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}