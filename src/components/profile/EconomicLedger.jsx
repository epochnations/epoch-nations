import { TrendingUp, TrendingDown, DollarSign, Building2 } from "lucide-react";

export default function EconomicLedger({ nation, holdings, domesticStocks, allNations }) {
  const nationMap = Object.fromEntries(allNations.map(n => [n.id, n]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Portfolio — stocks owned in other nations */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-green-500/5">
          <TrendingUp size={14} className="text-green-400" />
          <span className="text-sm font-bold text-white">My Portfolio</span>
          <span className="ml-auto text-xs text-slate-500">{holdings.length} holdings</span>
        </div>
        {holdings.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No stock holdings yet. Visit the Dashboard to trade stocks.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {holdings.map(h => (
              <div key={h.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                  <div className="font-bold text-white text-sm">{h.stock_ticker}</div>
                  <div className="text-xs text-slate-500">{h.company_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-white">{h.shares_owned} shares</div>
                  <div className="text-xs text-slate-400">avg {h.avg_buy_price?.toFixed(2)}</div>
                </div>
                <div className="ml-4">
                  <div className="text-xs font-mono text-green-400 font-bold">
                    {((h.shares_owned || 0) * (h.avg_buy_price || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} cr
                  </div>
                  <div className="text-xs text-slate-500">est. value</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Domestic Assets */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-cyan-500/5">
          <Building2 size={14} className="text-cyan-400" />
          <span className="text-sm font-bold text-white">Domestic Assets</span>
          <span className="ml-auto text-xs text-slate-500">{domesticStocks.length} companies</span>
        </div>
        {domesticStocks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No domestic stocks. Issue a stock from the Dashboard.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {domesticStocks.map(s => {
              const history = s.price_history || [];
              const prev = history.length > 1 ? history[history.length - 2] : s.base_price;
              const change = s.current_price - prev;
              const changePct = prev > 0 ? (change / prev) * 100 : 0;
              const isUp = change >= 0;
              return (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <div className="font-bold text-white text-sm">{s.ticker}</div>
                    <div className="text-xs text-slate-500">{s.company_name} · {s.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-white">{s.current_price?.toFixed(2)}</div>
                    <div className={`text-xs font-mono flex items-center gap-0.5 justify-end ${isUp ? "text-green-400" : "text-red-400"}`}>
                      {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {isUp ? "+" : ""}{changePct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-xs font-mono text-cyan-400 font-bold">
                      {(s.market_cap || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-slate-500">mkt cap</div>
                  </div>
                  {s.is_crashed && (
                    <div className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">CRASH</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}