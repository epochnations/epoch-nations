import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

export default function NewsApprovalWidget({ nation, events }) {
  const trust = Math.round((nation?.public_trust || 1) * 100);
  const stability = Math.round(nation?.stability || 75);

  // Build sparkline data from stability concept
  const sparkData = [75, 73, 77, 72, stability - 4, stability - 2, stability].map((v, i) => ({ v: Math.max(0,Math.min(100,v)), i }));

  const trustColor = trust > 80 ? "#22c55e" : trust > 50 ? "#eab308" : "#ef4444";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">📊 Approval Ratings</div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Public Trust</span>
            <span className="font-mono font-bold" style={{ color: trustColor }}>{trust}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${trust}%`, backgroundColor: trustColor }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">National Stability</span>
            <span className={`font-mono font-bold ${stability > 70 ? "text-emerald-400" : stability > 40 ? "text-yellow-400" : "text-red-400"}`}>{stability}%</span>
          </div>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="stabGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={1.5} fill="url(#stabGrad)" dot={false} />
                <Tooltip contentStyle={{ background:"#0f172a", border:"1px solid #1e293b", fontSize:10 }} formatter={v => [`${v}%`, "Stability"]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <div className="text-xs text-slate-500">Decisions resolved: <span className="text-cyan-400 font-mono">{events?.filter(e => e.is_resolved).length || 0}</span></div>
          <div className="text-xs text-slate-500">Pending headlines: <span className="text-yellow-400 font-mono">{events?.filter(e => !e.is_resolved).length || 0}</span></div>
        </div>
      </div>
    </div>
  );
}