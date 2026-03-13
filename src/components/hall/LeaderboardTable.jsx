import { useState } from "react";
import { EPOCHS, EPOCH_COLOR, EPOCH_EMOJI } from "../game/EpochConfig";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const MEDAL = ["🥇", "🥈", "🥉"];

function MetricValue({ nation, metric }) {
  if (metric === "epoch") {
    const color = EPOCH_COLOR[nation.epoch] || "#94a3b8";
    return (
      <span className="text-xs font-bold ep-mono" style={{ color }}>
        {EPOCH_EMOJI[nation.epoch]} {nation.epoch}
      </span>
    );
  }
  if (metric === "unlocked_techs") return <span className="text-xs text-violet-400 ep-mono font-bold">{nation.techCount}</span>;
  if (metric === "allies") return <span className="text-xs text-green-400 ep-mono font-bold">{nation.allyCount}</span>;
  const val = nation[metric] || 0;
  return <span className="text-xs text-white ep-mono font-bold">{typeof val === "number" ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : val}</span>;
}

export default function LeaderboardTable({ nations, metrics, activeMetric, onMetricChange, onSelectNation, transactions }) {
  const [showChart, setShowChart] = useState(false);

  // Build chart data: top 5 nations by their metric progression (using GDP as proxy for time series)
  const top5 = nations.slice(0, 5);

  // Build sparkline data from epoch index as a rough historical progression
  const chartData = EPOCHS.map((ep, idx) => {
    const row = { epoch: ep.replace(" Age", "").replace(" Age", "") };
    top5.forEach(n => {
      const reached = (EPOCHS.indexOf(n.epoch)) >= idx;
      row[n.name] = reached ? (n.gdp * (idx + 1) / (EPOCHS.indexOf(n.epoch) + 1)) : null;
    });
    return row;
  });

  const CHART_COLORS = ["#22d3ee", "#a78bfa", "#4ade80", "#fb923c", "#f87171"];

  return (
    <div className="space-y-4">
      {/* Metric selector */}
      <div className="flex gap-1.5 flex-wrap">
        {metrics.map(m => (
          <button key={m.key} onClick={() => onMetricChange(m.key)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold ep-mono transition-all border"
            style={{
              background: activeMetric === m.key ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
              borderColor: activeMetric === m.key ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.07)",
              color: activeMetric === m.key ? "#fbbf24" : "#475569",
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Chart toggle */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-slate-600 ep-mono">
          RANKED BY: <span className="text-amber-400">{metrics.find(m => m.key === activeMetric)?.label}</span>
          {" — "}{nations.length} nations
        </div>
        <button onClick={() => setShowChart(c => !c)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${showChart ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : "bg-white/5 border-white/10 text-slate-500"}`}>
          <TrendingUp size={11} /> {showChart ? "Hide" : "Show"} Chart
        </button>
      </div>

      {/* Line chart */}
      {showChart && top5.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="text-[10px] text-slate-500 ep-mono mb-3">TOP 5 NATIONS — GDP PROGRESSION BY EPOCH REACHED</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <XAxis dataKey="epoch" tick={{ fontSize: 9, fill: "#475569" }} />
              <YAxis tick={{ fontSize: 9, fill: "#475569" }} />
              <Tooltip
                contentStyle={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              {top5.map((n, i) => (
                <Area key={n.id} type="monotone" dataKey={n.name} stroke={CHART_COLORS[i]} fill={CHART_COLORS[i] + "15"} strokeWidth={2} dot={false} connectNulls />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {top5.map((n, i) => (
              <div key={n.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                <span className="text-[10px] text-slate-400">{n.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings */}
      <div className="space-y-2">
        {nations.map((n, i) => {
          const epochColor = EPOCH_COLOR[n.epoch] || "#94a3b8";
          return (
            <button key={n.id} onClick={() => onSelectNation(n)}
              className="w-full text-left rounded-xl border p-3 transition-all hover:scale-[1.005] group"
              style={{
                background: i < 3 ? `${["rgba(251,191,36,0.06)","rgba(148,163,184,0.05)","rgba(217,119,6,0.05)"][i]}` : "rgba(255,255,255,0.02)",
                borderColor: i < 3 ? `${["rgba(251,191,36,0.25)","rgba(148,163,184,0.2)","rgba(217,119,6,0.2)"][i]}` : "rgba(255,255,255,0.06)",
              }}>
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {i < 3
                    ? <span className="text-lg">{MEDAL[i]}</span>
                    : <span className="text-xs font-black text-slate-600 ep-mono">#{i + 1}</span>
                  }
                </div>
                {/* Flag + name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl shrink-0">{n.flag_emoji || "🏴"}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate group-hover:text-amber-300 transition-colors">{n.name}</div>
                    <div className="text-[10px] text-slate-500 truncate ep-mono">{n.leader} · {n.government_type}</div>
                  </div>
                </div>
                {/* Epoch badge */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
                  style={{ background: `${epochColor}15`, border: `1px solid ${epochColor}30` }}>
                  <span className="text-xs">{EPOCH_EMOJI[n.epoch]}</span>
                  <span className="text-[10px] font-bold ep-mono" style={{ color: epochColor }}>
                    {n.epoch?.replace(" Age", "")}
                  </span>
                </div>
                {/* Active metric value */}
                <div className="text-right shrink-0 min-w-[80px]">
                  <MetricValue nation={n} metric={activeMetric} />
                  <div className="text-[9px] text-slate-600 ep-mono mt-0.5">
                    {metrics.find(m => m.key === activeMetric)?.icon} {metrics.find(m => m.key === activeMetric)?.label}
                  </div>
                </div>
                {/* Quick stats */}
                <div className="hidden lg:grid grid-cols-3 gap-x-4 text-center shrink-0">
                  <div>
                    <div className="text-xs font-bold text-green-400 ep-mono">{n.kills}</div>
                    <div className="text-[9px] text-slate-600">Kills</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-400 ep-mono">{n.deaths}</div>
                    <div className="text-[9px] text-slate-600">Deaths</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-cyan-400 ep-mono">{n.gameDaysAlive}d</div>
                    <div className="text-[9px] text-slate-600">Age</div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {nations.length === 0 && (
          <div className="text-center py-16 text-slate-600 text-sm ep-mono">No nations match your filters.</div>
        )}
      </div>
    </div>
  );
}