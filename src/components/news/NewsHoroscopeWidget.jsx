import { useState } from "react";

const SIGNS = [
  { sign:"Aries",       emoji:"♈", dates:"Mar 21–Apr 19" },
  { sign:"Taurus",      emoji:"♉", dates:"Apr 20–May 20" },
  { sign:"Gemini",      emoji:"♊", dates:"May 21–Jun 20" },
  { sign:"Cancer",      emoji:"♋", dates:"Jun 21–Jul 22" },
  { sign:"Leo",         emoji:"♌", dates:"Jul 23–Aug 22" },
  { sign:"Virgo",       emoji:"♍", dates:"Aug 23–Sep 22" },
  { sign:"Libra",       emoji:"♎", dates:"Sep 23–Oct 22" },
  { sign:"Scorpio",     emoji:"♏", dates:"Oct 23–Nov 21" },
  { sign:"Sagittarius", emoji:"♐", dates:"Nov 22–Dec 21" },
  { sign:"Capricorn",   emoji:"♑", dates:"Dec 22–Jan 19" },
  { sign:"Aquarius",    emoji:"♒", dates:"Jan 20–Feb 18" },
  { sign:"Pisces",      emoji:"♓", dates:"Feb 19–Mar 20" },
];

const READINGS = [
  "The stars align in your favor today. Bold decisions made now carry great momentum. Expect unexpected allies to appear when you least expect them. Trust your instincts.",
  "A period of reflection serves you well. Patience is your greatest weapon this cycle. Resources flow toward those who plan carefully. Avoid impulsive choices near midday.",
  "Opportunity knocks loudly — answer the door. Your leadership qualities shine brightest today. Others look to you for guidance. A financial windfall may be closer than it appears.",
  "Tensions around you are high but you remain the calm center. Focus your energy on long-term projects. Partnerships formed today carry lasting benefits. Breathe and proceed.",
  "Creative solutions emerge from unexpected places. An old problem dissolves with a fresh perspective. Collaboration with unlikely partners leads to surprising success. Be open.",
  "The foundation you've built begins to pay dividends. Strategic patience has been rewarded. A challenge on the horizon is smaller than it appears. You have what it takes.",
  "Mercury's alignment brings clarity of thought. Communication breakthroughs are imminent. A misunderstanding resolves itself naturally. Focus on the vision, not the noise.",
  "Energy is high today — channel it wisely. Avoid confrontation in the morning hours. The afternoon brings diplomatic breakthroughs. A loyal friend delivers crucial news.",
  "Abundance surrounds you if you look carefully. Today is favorable for resource management. A quiet approach yields more than bold action. Trust the process.",
  "New beginnings are written in today's stars. A cycle ends and a better one begins. Let go of what no longer serves you. The path forward is lit brighter than you know.",
  "Details matter enormously today. Overlooked information becomes critical later. Slow down and review. A small correction now saves significant effort later.",
  "Your instincts about people are sharp today. Trust them completely. A figure from the past re-enters with useful knowledge. Renewal arrives on the winds of change.",
];

export default function NewsHoroscopeWidget() {
  const today = new Date();
  // Deterministic daily seed based on day
  const dayIdx = today.getDate() % SIGNS.length;
  const [selected, setSelected] = useState(SIGNS[dayIdx].sign);

  const signObj = SIGNS.find(s => s.sign === selected) || SIGNS[0];
  const readingIdx = (SIGNS.indexOf(signObj) + today.getDate() + today.getMonth()) % READINGS.length;
  const reading = READINGS[readingIdx];

  // Lucky numbers & color generated from sign+day
  const luckyNum1 = ((SIGNS.indexOf(signObj) + 1) * (today.getDate() + 3)) % 99 + 1;
  const luckyNum2 = ((SIGNS.indexOf(signObj) + 7) * (today.getDate() + 11)) % 99 + 1;
  const LUCKY_COLORS = ["Gold","Indigo","Crimson","Teal","Violet","Amber","Sapphire","Emerald","Silver","Rose","Azure","Jade"];
  const luckyColor = LUCKY_COLORS[(SIGNS.indexOf(signObj) + today.getDate()) % LUCKY_COLORS.length];

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">🔮 Daily Horoscope</div>

      {/* Sign picker */}
      <div className="grid grid-cols-6 gap-1 mb-3">
        {SIGNS.map(s => (
          <button
            key={s.sign}
            onClick={() => setSelected(s.sign)}
            title={`${s.sign} ${s.dates}`}
            className={`rounded-lg py-1 text-sm text-center transition-all ${
              selected === s.sign
                ? "bg-violet-500/30 border border-violet-400/40 text-violet-200"
                : "bg-white/5 border border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10"
            }`}
          >
            {s.emoji}
          </button>
        ))}
      </div>

      {/* Selected sign */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{signObj.emoji}</span>
        <div>
          <div className="font-black text-white text-sm">{signObj.sign}</div>
          <div className="text-[10px] text-slate-500">{signObj.dates}</div>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-3">{reading}</p>

      <div className="flex gap-2 text-[10px]">
        <div className="flex-1 bg-black/20 rounded-lg px-2 py-1.5">
          <div className="text-slate-500">Lucky Numbers</div>
          <div className="text-violet-300 font-mono font-bold">{luckyNum1} · {luckyNum2}</div>
        </div>
        <div className="flex-1 bg-black/20 rounded-lg px-2 py-1.5">
          <div className="text-slate-500">Lucky Color</div>
          <div className="text-violet-300 font-bold">{luckyColor}</div>
        </div>
      </div>
    </div>
  );
}