import { useMemo } from "react";
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign } from "lucide-react";

const SECTOR_COLOR = {
  Energy: "text-orange-400",
  Defense: "text-red-400",
  Technology: "text-cyan-400",
  Finance: "text-green-400",
  Agriculture: "text-lime-400",
  Nano: "text-violet-400",
};

const STATUS_CONFIG = {
  CRASH:    { cls: "bg-red-500/20 text-red-400 border border-red-500/40", label: "CRASH" },
  VOLATILE: { cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30", label: "VOLATILE" },
  RISING:   { cls: "bg-green-500/20 text-green-400 border border-green-500/30", label: "RISING" },
  STABLE:   { cls: "bg-slate-500/20 text-slate-400 border border-slate-500/30", label: "STABLE" },
};

function PriceCell({ price, changePct, flash }) {
  const isUp = changePct >= 0;
  return (
    <div className="text-right">
      <div
        className="font-mono font-bold text-sm transition-all duration-300"
        style={{
          color: flash === "up" ? "#4ade80" : flash === "down" ? "#f87171" : "#e2e8f0",
          textShadow: flash === "up" ? "0 0 8px rgba(74,222,128,0.6)" : flash === "down" ? "0 0 8px rgba(248,113,113,0.6)" : "none",
        }}
      >
        {price?.toFixed(2)}
      </div>
      <div className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${isUp ? "text-green-400" : "text-red-400"}`}>
        {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
        {isUp ? "+" : ""}{changePct.toFixed(2)}%
      </div>
    </div>
  );
}

function NationalExtras({ stock }) {
  const sold = stock.total_shares - stock.available_shares;
  const floatPct = stock.total_shares > 0 ? (stock.available_shares / stock.total_shares) * 100 : 0;
  const foreignOwn = stock.foreignOwn || 0;
  const vol = stock.vol || 0;
  const demand = stock.demandRatio || 0;

  return (
    <div className="grid grid-cols-3 gap-2 mt-1 text-[10px]">
      <div className="bg-white/5 rounded p-1.5 text-center">
        <div className="text-slate-500">Total Shares</div>
        <div className="text-white font-mono">{stock.total_shares?.toLocaleString()}</div>
      </div>
      <div className="bg-white/5 rounded p-1.5 text-center">
        <div className="text-slate-500">Float %</div>
        <div className="text-cyan-400 font-mono">{floatPct.toFixed(1)}%</div>
      </div>
      <div className="bg-white/5 rounded p-1.5 text-center">
        <div className="text-slate-500">Volatility</div>
        <div className={`font-mono ${vol > 5 ? "text-amber-400" : "text-green-400"}`}>{vol.toFixed(2)}%</div>
      </div>
      <div className="bg-white/5 rounded p-1.5 text-center">
        <div className="text-slate-500">Demand</div>
        <div className="text-violet-400 font-mono">{(demand * 100).toFixed(1)}%</div>
      </div>
      <div className="bg-white/5 rounded p-1.5 text-center">
        <div className="text-slate-500">Foreign Own</div>
        <div className="text-amber-400 font-mono">{foreignOwn.toFixed(1)}%</div>
      </div>
      <div className="bg-white/5 rounded p-1.5 text-center">
        <div className="text-slate-500">Royalty Rate</div>
        <div className="text-green-400 font-mono">1.5%</div>
      </div>
    </div>
  );
}

export default function ExchangeStockTable({ stocks, myNation, nationMap, view, onBuy, onSell }) {
  const isOwn = (s) => myNation && s.nation_id === myNation.id;

  if (stocks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600 text-sm py-20">
        No stocks match your search or filters.
      </div>
    );
  }

  // Mobile card view
  const MobileView = () => (
    <div className="overflow-y-auto flex-1 px-3 py-2 space-y-2">
      {stocks.map(s => {
        const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.STABLE;
        return (
          <div key={s.id} className="backdrop-blur-xl bg-white/4 border border-white/8 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-black text-white text-sm">{s.ticker}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>
                  {s.is_crashed && <span className="text-[9px] text-red-400 font-bold">⚡ MARKET SHOCK</span>}
                </div>
                <div className="text-xs text-slate-400 truncate">{s.company_name}</div>
                <div className="text-[10px] text-slate-600">{s.nation_name} · <span className={SECTOR_COLOR[s.sector] || "text-slate-400"}>{s.sector}</span></div>
              </div>
              <PriceCell price={s.current_price} changePct={s.changePct} flash={s.flash} />
            </div>
            {view === "national" && isOwn(s) && <NationalExtras stock={s} />}
            <div className="flex gap-2 mt-2">
              <div className="text-[10px] text-slate-500 flex-1">
                Avail: <span className="text-slate-300 font-mono">{s.available_shares?.toLocaleString()}</span>
              </div>
              <button
                onClick={() => onBuy(s)}
                disabled={!myNation || s.available_shares <= 0 || s.is_crashed}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[36px]"
              >
                BUY
              </button>
              <button
                onClick={() => onSell(s)}
                disabled={!myNation}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[36px]"
              >
                SELL
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Desktop table view
  const DesktopView = () => (
    <div className="flex-1 overflow-auto">
      <table className="w-full min-w-[1000px] border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-[#080c14] border-b border-white/10">
          <tr>
            <th className="text-left px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap w-6"></th>
            <th className="text-left px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Nation</th>
            <th className="text-left px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Ticker</th>
            <th className="text-left px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap max-w-[160px]">Company</th>
            <th className="text-left px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Sector</th>
            <th className="text-right px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Price</th>
            <th className="text-right px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">1m Chg</th>
            <th className="text-right px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Volume</th>
            <th className="text-right px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Demand</th>
            <th className="text-right px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Volatility</th>
            <th className="text-center px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Status</th>
            <th className="text-center px-3 py-3 text-slate-500 font-bold tracking-wider uppercase whitespace-nowrap">Trade</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((s, idx) => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.STABLE;
            const isUp = s.changePct >= 0;
            const nation = nationMap[s.nation_id];
            const volume = s.total_shares - s.available_shares;
            return (
              <tr
                key={s.id}
                className={`border-b border-white/4 transition-all hover:bg-white/4 ${idx % 2 === 0 ? "" : "bg-white/2"}`}
              >
                <td className="px-3 py-3 text-center">
                  <span className="text-base leading-none">{nation?.flag_emoji || "🏴"}</span>
                </td>
                <td className="px-3 py-3 text-slate-300 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">{s.nation_name}</td>
                <td className="px-3 py-3">
                  <span className="font-mono font-black text-white whitespace-nowrap">{s.ticker}</span>
                </td>
                <td className="px-3 py-3 text-slate-300 max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">{s.company_name}</td>
                <td className="px-3 py-3">
                  <span className={`whitespace-nowrap font-medium ${SECTOR_COLOR[s.sector] || "text-slate-400"}`}>{s.sector}</span>
                </td>
                <td className="px-3 py-3 text-right">
                  <div
                    className="font-mono font-bold text-sm transition-all duration-300 whitespace-nowrap"
                    style={{
                      color: s.flash === "up" ? "#4ade80" : s.flash === "down" ? "#f87171" : "#e2e8f0",
                      textShadow: s.flash === "up" ? "0 0 8px rgba(74,222,128,0.6)" : s.flash === "down" ? "0 0 8px rgba(248,113,113,0.6)" : "none",
                    }}
                  >
                    {s.current_price?.toFixed(2)} cr
                  </div>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <span className={`flex items-center justify-end gap-0.5 font-mono font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                    {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {isUp ? "+" : ""}{s.changePct.toFixed(2)}%
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-slate-300 whitespace-nowrap">{volume.toLocaleString()}</td>
                <td className="px-3 py-3 text-right font-mono text-violet-400 whitespace-nowrap">{(s.demandRatio * 100).toFixed(1)}%</td>
                <td className="px-3 py-3 text-right font-mono whitespace-nowrap">
                  <span className={s.vol > 5 ? "text-amber-400" : "text-green-400"}>{s.vol.toFixed(2)}%</span>
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>
                  {s.changePct < -15 && !s.is_crashed && (
                    <div className="text-[9px] text-red-400 font-bold mt-0.5 whitespace-nowrap">⚡ SHOCK</div>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onBuy(s)}
                      disabled={!myNation || s.available_shares <= 0 || s.is_crashed}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap min-h-[30px]"
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => onSell(s)}
                      disabled={!myNation}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap min-h-[30px]"
                    >
                      SELL
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
        <DesktopView />
      </div>
      <div className="flex md:hidden flex-col flex-1 min-h-0 overflow-hidden">
        <MobileView />
      </div>
    </>
  );
}