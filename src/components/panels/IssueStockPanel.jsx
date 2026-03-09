import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus } from "lucide-react";
import { EPOCHS } from "../game/EpochConfig";

const SECTORS_BY_EPOCH = {
  "Stone Age": ["Agriculture"],
  "Copper Age": ["Agriculture", "Energy"],
  "Bronze Age": ["Agriculture", "Energy", "Defense"],
  "Iron Age": ["Agriculture", "Energy", "Defense"],
  "Dark Ages": ["Agriculture", "Energy", "Defense", "Finance"],
  "Middle Ages": ["Agriculture", "Energy", "Defense", "Finance"],
  "Renaissance": ["Agriculture", "Energy", "Defense", "Finance"],
  "Imperial Age": ["Agriculture", "Energy", "Defense", "Finance", "Technology"],
  "Enlightenment Age": ["Agriculture", "Energy", "Defense", "Finance", "Technology"],
  "Industrial Age": ["Energy", "Defense", "Technology", "Finance", "Agriculture"],
  "Modern Age": ["Energy", "Defense", "Technology", "Finance", "Agriculture"],
  "Atomic Age": ["Energy", "Defense", "Technology", "Finance", "Agriculture"],
  "Digital Age": ["Energy", "Defense", "Technology", "Finance", "Agriculture"],
  "Genetic Age": ["Energy", "Defense", "Technology", "Finance", "Agriculture", "Nano"],
  "Synthetic Age": ["Energy", "Defense", "Technology", "Finance", "Agriculture", "Nano"],
  "Nano Age": ["Energy", "Defense", "Technology", "Finance", "Agriculture", "Nano"],
};

// Stock cap by epoch index
function getStockCap(epochIndex) {
  if (epochIndex <= 0) return 2;          // Stone Age
  if (epochIndex <= 3) return 4;          // Copper–Iron
  if (epochIndex <= 6) return 6;          // Dark–Renaissance
  if (epochIndex <= 9) return 8;          // Imperial–Industrial
  if (epochIndex <= 12) return 12;        // Modern–Digital
  return 16;                              // Genetic Age+
}

// Stock shares: 15 per epoch index (baseline 500 + 15 * epochIndex)
function getBaseShares(epochIndex) {
  return 500 + (15 * epochIndex);
}

export default function IssueStockPanel({ nation, onClose, onRefresh }) {
  const [companyName, setCompanyName] = useState("");
  const [ticker, setTicker] = useState("");
  const [sector, setSector] = useState("Agriculture");
  const [shares, setShares] = useState(() => getBaseShares(EPOCHS.indexOf(nation?.epoch) || 0));
  const [price, setPrice] = useState(10);
  const [loading, setLoading] = useState(false);
  const [existingCount, setExistingCount] = useState(0);

  const epochIndex = EPOCHS.indexOf(nation?.epoch) || 0;
  const stockCap = getStockCap(epochIndex);
  const baseShares = getBaseShares(epochIndex);
  const maxShares = Math.floor((nation?.gdp || 500) * (2 + epochIndex * 0.5) + baseShares);
  const atCap = existingCount >= stockCap;

  useEffect(() => {
    if (!nation?.id) return;
    base44.entities.Stock.filter({ nation_id: nation.id }).then(s => setExistingCount(s.length));
  }, [nation?.id]);

  if (!nation) return null;
  const sectors = SECTORS_BY_EPOCH[nation.epoch] || ["Agriculture", "Energy"];

  async function issue() {
    if (!companyName || !ticker || atCap) return;
    setLoading(true);

    const cappedShares = Math.min(shares, maxShares);
    // Resource modifier: add 2% of sector-relevant resources to base price
    let resourceMod = 0;
    if (sector === "Agriculture") resourceMod = (nation.res_food || 0) * 0.02;
    else if (sector === "Energy") resourceMod = (nation.res_oil || 0) * 0.03;
    else if (sector === "Defense") resourceMod = (nation.res_iron || 0) * 0.025;
    else if (sector === "Technology") resourceMod = (nation.res_gold || 0) * 0.04;
    else if (sector === "Finance") resourceMod = (nation.currency || 0) * 0.005;
    else if (sector === "Nano") resourceMod = (nation.res_uranium || 0) * 0.05;

    const stockValue = (nation.gdp + nation.stability) * nation.public_trust;
    const finalPrice = parseFloat(((price + stockValue * 0.01 + resourceMod)).toFixed(2));

    // Treasury cost: 5% of total IPO value
    const issueCost = Math.round(finalPrice * cappedShares * 0.05);
    if ((nation.currency || 0) < issueCost) {
      alert(`Insufficient treasury. IPO listing costs ${issueCost} cr (5% of IPO value).`);
      setLoading(false);
      return;
    }

    await base44.entities.Stock.create({
      company_name: companyName,
      ticker: ticker.toUpperCase().substring(0, 4),
      nation_id: nation.id,
      nation_name: nation.name,
      sector,
      total_shares: cappedShares,
      available_shares: cappedShares,
      base_price: finalPrice,
      current_price: finalPrice,
      price_history: [finalPrice],
      market_cap: parseFloat((finalPrice * cappedShares).toFixed(2)),
      is_crashed: false,
      epoch_required: nation.epoch
    });

    // Deduct IPO cost from treasury
    await base44.entities.Nation.update(nation.id, {
      currency: Math.max(0, (nation.currency || 0) - issueCost)
    });

    await base44.entities.Transaction.create({
      type: "stock_buy",
      from_nation_id: nation.id,
      from_nation_name: nation.name,
      stock_ticker: ticker.toUpperCase(),
      total_value: finalPrice * cappedShares,
      description: `${nation.name} listed ${companyName} (${ticker.toUpperCase()}) — ${cappedShares} shares @ ${finalPrice} (IPO cost: ${issueCost} cr)`
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

          <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-400 space-y-1">
            <div>Final IPO price adjusted by Nation Stock Index: ({nation.gdp} + {nation.stability}) × {(nation.public_trust||1).toFixed(2)}</div>
            <div className="text-amber-400">📋 Stock cap for {nation.epoch}: <b>{existingCount}/{stockCap}</b> issued</div>
            <div>Max shares at current GDP: <b>{maxShares.toLocaleString()}</b></div>
            <div className="text-cyan-400">💰 IPO listing cost (5%): ~<b>{Math.round((price + (nation.gdp + nation.stability) * (nation.public_trust||1) * 0.01) * Math.min(shares, baseShares) * 0.05)} cr</b></div>
          </div>

          {atCap && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 font-bold">
              ⛔ Stock cap reached ({stockCap}/{stockCap}) for {nation.epoch}. Advance your epoch to issue more.
            </div>
          )}

          <button
            onClick={issue}
            disabled={loading || !companyName || !ticker || atCap}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 disabled:opacity-30 transition-all"
          >
            {loading ? "Listing..." : atCap ? "STOCK CAP REACHED" : "LIST ON EXCHANGE 📈"}
          </button>
        </div>
      </div>
    </div>
  );
}