import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Edit3, X } from "lucide-react";

export default function PropagandaModal({ myNation, myPolicy, onClose, onPublished }) {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const cost = 25;
  const ipBalance = myPolicy?.influence_points ?? 100;
  const canPublish = !myPolicy?.propaganda_used_today && ipBalance >= cost;

  async function publish() {
    if (!canPublish || !headline.trim()) return;
    setLoading(true);

    await base44.entities.NewsArticle.create({
      headline: headline.trim(),
      body: body.trim(),
      category: "propaganda",
      tier: "standard",
      nation_name: myNation.name,
      nation_flag: myNation.flag_emoji,
      nation_color: myNation.flag_color,
      is_propaganda: true,
      author_email: myNation.owner_email
    });

    // Deduct influence points and mark used today
    if (myPolicy) {
      await base44.entities.Policy.update(myPolicy.id, {
        influence_points: ipBalance - cost,
        propaganda_used_today: true
      });
    }

    setLoading(false);
    onPublished?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0f172a] border border-violet-500/30 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-violet-500/10">
          <div className="flex items-center gap-2">
            <Edit3 size={16} className="text-violet-400" />
            <span className="font-bold text-white">Propaganda Bureau</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-violet-400 font-mono">{ipBalance} IP</span>
            <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {myPolicy?.propaganda_used_today ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📢</div>
              <div className="font-bold text-white">Daily Quota Used</div>
              <div className="text-sm text-slate-400 mt-1">One propaganda piece allowed per day. Check back tomorrow.</div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">Headline *</label>
                <input
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  maxLength={120}
                  placeholder="Your nation's bold claim to the world..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-400/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">Body (optional)</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="Supporting statements, context, spin..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-400/50 text-sm resize-none"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">Cost: <span className="text-violet-400 font-bold">{cost} IP</span> · Balance: <span className="text-white font-mono">{ipBalance}</span></div>
                <div className="flex gap-2">
                  <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
                  <button
                    onClick={publish}
                    disabled={!headline.trim() || loading || !canPublish}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 transition-all"
                  >
                    {loading ? "Publishing..." : "PUBLISH NOW"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}