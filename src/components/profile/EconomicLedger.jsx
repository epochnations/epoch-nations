import { TrendingUp, TrendingDown, DollarSign, Building2 } from "lucide-react";

export default function EconomicLedger({ nation, holdings, domesticStocks, allNations }) {
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
            {/* Header row */}
            <div className="px-5 py-2 grid grid-cols-[80px_1fr_90px_90px] gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <span>Ticker</span>
              <span>Company</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Est. Value</span>
            </div>
            {holdings.map(h => (
              <div key={h.id} className="px-5 py-3 grid grid-cols-[80px_1fr_90px_90px] gap-2 items-center hover:bg-white/5 transition-colors">
                <div className="font-bold text-white text-sm font-mono">{h.stock_ticker}</div>
                <div className="text-xs text-slate-400 truncate">{h.company_name}</div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-white">{h.shares_owned}</div>
                  <div className="text-xs text-slate-500">@ {h.avg_buy_price?.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-green-400">
                    {((h.shares_owned || 0) * (h.avg_buy_price || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-slate-500">cr</div>
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
            {/* Header row */}
            <div className="px-5 py-2 grid grid-cols-[70px_1fr_70px_70px_50px] gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <span>Ticker</span>
              <span>Company</span>
              <span className="text-right">Price</span>
              <span className="text-right">Mkt Cap</span>
              <span className="text-right">Chg</span>
            </div>
            {domesticStocks.map(s => {
              const history = s.price_history || [];
              const prev = history.length > 1 ? history[history.length - 2] : s.base_price;
              const change = s.current_price - prev;
              const changePct = prev > 0 ? (change / prev) * 100 : 0;
              const isUp = change >= 0;
              return (
                <div key={s.id} className="px-5 py-3 grid grid-cols-[70px_1fr_70px_70px_50px] gap-2 items-center hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm font-mono">{s.ticker}</span>
                    {s.is_crashed && (
                      <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 leading-none">CRASH</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-slate-300 truncate">{s.company_name}</div>
                    <div className="text-xs text-slate-500">{s.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-white">{s.current_price?.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">cr</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-cyan-400 font-bold">
                      {(s.market_cap || 0) >= 1000
                        ? `${((s.market_cap || 0) / 1000).toFixed(1)}k`
                        : (s.market_cap || 0).toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-500">cr</div>
                  </div>
                  <div className={`text-right flex items-center justify-end gap-0.5 text-xs font-mono font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                    {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {isUp ? "+" : ""}{changePct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}