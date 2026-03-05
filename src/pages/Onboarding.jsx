import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Zap } from "lucide-react";
import TourTooltip from "../components/onboarding/TourTooltip";

const FLAG_EMOJIS = ["🏴", "⚔️", "🦅", "🐉", "🌟", "🔱", "🛡️", "🌙", "☀️", "🦁", "🐯", "🌊"];
const FLAG_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
  "#64748b", "#84cc16", "#e11d48", "#0ea5e9"
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [nationName, setNationName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🏴");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    checkExistingNation();
  }, []);

  async function checkExistingNation() {
    try {
      const user = await base44.auth.me();
      const nations = await base44.entities.Nation.filter({ owner_email: user.email });
      if (nations.length > 0) {
        window.location.href = createPageUrl("Dashboard");
      } else {
        setCheckingExisting(false);
      }
    } catch (e) {
      if (e?.message?.includes("Rate limit")) {
        // Retry after 2 seconds
        setTimeout(checkExistingNation, 2000);
      } else {
        setCheckingExisting(false);
      }
    }
  }

  async function createNation() {
    setLoading(true);
    const user = await base44.auth.me();
    const nation = await base44.entities.Nation.create({
      name: nationName,
      leader: leaderName || user.full_name,
      owner_email: user.email,
      epoch: "Stone Age",
      tech_points: 0,
      tech_level: 1,
      gdp: 200,
      stability: 75,
      public_trust: 1.0,
      currency: 500,
      manufacturing: 20,
      education_spending: 20,
      military_spending: 20,
      unit_power: 10,
      defense_level: 10,
      population: 10,
      housing_capacity: 20,
      flag_color: selectedColor,
      flag_emoji: selectedEmoji,
      allies: [],
      at_war_with: [],
      is_in_market_crash: false,
      crash_turns_remaining: 0,
      unlocked_techs: [],
      res_wood: 100,
      res_stone: 100,
      res_gold: 50,
      res_oil: 0,
      res_food: 200,
      workers_farmers: 3,
      workers_hunters: 2,
      workers_fishermen: 0,
      workers_lumberjacks: 2,
      workers_quarry: 1,
      workers_miners: 1,
      workers_oil_engineers: 0,
      workers_builders: 1,
      workers_soldiers: 0,
      workers_researchers: 0,
      workers_industrial: 0
    });

    await base44.entities.Stock.create({
      company_name: `${nationName} Trading Company`,
      ticker: nationName.substring(0, 3).toUpperCase() + "T",
      nation_id: nation.id,
      nation_name: nationName,
      sector: "Agriculture",
      total_shares: 500,
      available_shares: 500,
      base_price: 5,
      current_price: 5,
      price_history: [5],
      market_cap: 2500,
      is_crashed: false,
      epoch_required: "Stone Age"
    });

    // Show tour before redirect
    setLoading(false);
    setShowTour(true);
  }

  function handleTourNext() {
    if (tourStep < 4) {
      setTourStep(t => t + 1);
    } else {
      window.location.href = createPageUrl("Dashboard");
    }
  }

  function handleTourPrev() {
    setTourStep(t => Math.max(0, t - 1));
  }

  function skipTour() {
    window.location.href = createPageUrl("Dashboard");
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 bg-clip-text text-transparent mb-2">
            EPOCH NATIONS
          </div>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Grand Strategy Simulator</p>
        </div>

        {/* Skip tutorial button */}
        {step === 1 && (
          <div className="flex justify-end mb-3">
            <a
              href={createPageUrl("Dashboard")}
              className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all"
            >
              <Zap size={12} /> Skip Tutorial & Command Now
            </a>
          </div>
        )}

        {/* Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs text-cyan-400 uppercase tracking-widest mb-1">Step 1 of 2</div>
                <h2 className="text-2xl font-bold text-white">Found Your Nation</h2>
                <p className="text-slate-400 text-sm mt-1">Choose a name that will echo through history.</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Nation Name</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                  placeholder="e.g. The Republic of Valdoria"
                  value={nationName}
                  onChange={e => setNationName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && nationName.trim() && setStep(2)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Your Leader Name</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                  placeholder="Chancellor, President, Emperor..."
                  value={leaderName}
                  onChange={e => setLeaderName(e.target.value)}
                />
              </div>
              <button
                onClick={() => nationName.trim() && setStep(2)}
                disabled={!nationName.trim()}
                className="w-full min-h-[44px] py-3 rounded-xl font-bold tracking-wider text-sm transition-all bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                CONTINUE →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs text-cyan-400 uppercase tracking-widest mb-1">Step 2 of 2</div>
                <h2 className="text-2xl font-bold text-white">Design Your Flag</h2>
                <p className="text-slate-400 text-sm mt-1">Choose your nation's symbol and color.</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-3">National Symbol</label>
                <div className="grid grid-cols-6 gap-2">
                  {FLAG_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`h-12 rounded-xl text-2xl transition-all ${selectedEmoji === emoji ? "bg-cyan-500/20 border-2 border-cyan-400" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-3">Nation Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {FLAG_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-8 rounded-lg transition-all ${selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl p-4 flex items-center gap-4" style={{ backgroundColor: selectedColor + "22", borderColor: selectedColor + "44", border: "1px solid" }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl" style={{ backgroundColor: selectedColor + "33" }}>
                  {selectedEmoji}
                </div>
                <div>
                  <div className="font-bold text-white">{nationName || "Your Nation"}</div>
                  <div className="text-xs text-slate-400">Stone Age · Leader: {leaderName || "TBD"}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 min-h-[44px] py-3 rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:bg-white/5 transition-all">
                  ← BACK
                </button>
                <button
                  onClick={createNation}
                  disabled={loading}
                  className="flex-2 flex-grow min-h-[44px] py-3 rounded-xl font-bold tracking-wider text-sm transition-all bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  {loading ? "FOUNDING..." : "FOUND NATION 🚀"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Starting era: Stone Age · Build your civilization from the ground up
        </p>
      </div>

      {/* Tour tooltip overlay */}
      {showTour && (
        <div className="fixed inset-0 z-[199] bg-black/40 backdrop-blur-sm pointer-events-none" />
      )}
      {showTour && (
        <TourTooltip
          step={tourStep}
          onNext={handleTourNext}
          onPrev={handleTourPrev}
          onSkip={skipTour}
        />
      )}
    </div>
  );
}