import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus } from "lucide-react";

const SECTORS_BY_EPOCH = {
  Industrial: ["Energy", "Defense", "Agriculture", "Finance"],
  Information: ["Energy", "Defense", "Technology", "Finance", "Agriculture"],
  Nano: ["Energy", "Defense", "Technology", "Finance", "Agriculture", "Nano"],
};

export default function IssueStockPanel({ nation, onClose, onRefresh }) {
  const [companyName, setCompanyName] = useState("");
  const [ticker, setTicker] = useState("");
  const [sector, setSector] = useState("Energy");
  const [shares, setShares] = useState(1000);
  const [price, setPrice] = useState(10);
  const [loading, setLoading] = useState(false);

  if (!nation) return null;
  const sectors = SECTORS_BY_EPOCH[nation.epoch] || SECTORS_BY_EPOCH.Industrial;

  async function issue() {
    if (!companyName || !ticker) return;
    setLoading(true);

    const stockValue = (nation.gdp + nation.stability) * nation.public_trust;
    const finalPrice = parseFloat(((price + stockValue * 0.01)).toFixed(2));

    await base44.entities.Stock.create({
      company_name: companyName,
      ticker: ticker.toUpperCase().substring(0, 4),
      nation_id: nation.id,
      nation_name: nation.name,
      sector,
      total_shares: shares,
      available_shares: shares,
      base_price: finalPrice,
      current_price: finalPrice,
      price_history: [finalPrice],
      market_cap: parseFloat((finalPrice * shares).toFixed(2)),
      is_crashed: false,
      epoch_required: nation.epoch
    });

    await base44.entities.Transaction.create({
      type: "stock_buy",
      from_nation_id: nation.id,
      from_nation_name: nation.name,
      stock_ticker: ticker.toUpperCase(),
      total_value: finalPrice * shares,
      description: `${nation.name} listed ${companyName} (${ticker.toUpperCase()}) — ${shares} shares @ ${finalPrice}`
    });

    setLoading(false);
    onRefresh?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md backdrop-blur-xl bg-[#0f172a]/95 border border-white/20 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-green-400" />
            <span className="font-bold text-white">Issue New Stock</span>
          </div>
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Company Name</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-green-400/50"
              placeholder="National Steel Corp"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Ticker (max 4)</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase placeholder-slate-600 focus:outline-none focus:border-green-400/50"
                placeholder="NSTL"
                maxLength={4}
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Sector</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-400/50"
                value={sector}
                onChange={e => setSector(e.target.value)}
              >
                {sectors.map(s => <option key={s} value={s} className="bg-[#0f172a]">{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Total Shares</label>
              <input type="number" min={100} value={shares} onChange={e => setShares(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-green-400/50" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Base Price (cr)</label>
              <input type="number" min={1} value={price} onChange={e => setPrice(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-green-400/50" />
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-400">
            Final IPO price will be adjusted by your Nation Stock Index: ({nation.gdp} + {nation.stability}) × {nation.public_trust.toFixed(2)}
          </div>

          <button
            onClick={issue}
            disabled={loading || !companyName || !ticker}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 disabled:opacity-30 transition-all"
          >
            {loading ? "Listing..." : "LIST ON EXCHANGE 📈"}
          </button>
        </div>
      </div>
    </div>
  );
}