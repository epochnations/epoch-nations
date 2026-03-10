import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { TICK_MS, TICKS_PER_DAY } from "../game/GameClock";

const DILEMMA_POOL = [
  {
    source: "citizen",
    title: "Workers Demand Better Wages",
    body: "Labor unions have organized a city-wide strike. Factory output is threatened unless you respond.",
    option_a_label: "Grant wage increase",
    option_a_effect: "stability +8, currency -200, public_trust +0.1",
    option_b_label: "Deploy riot control",
    option_b_effect: "stability -10, unit_power +5, public_trust -0.15"
  },
  {
    source: "company",
    title: "MegaCorp Requests Subsidies",
    body: "The nation's largest industrial conglomerate is threatening to relocate unless granted tax breaks.",
    option_a_label: "Grant subsidies",
    option_a_effect: "gdp +200, currency -300, stability +3",
    option_b_label: "Refuse — nationalize",
    option_b_effect: "gdp -100, currency +100, public_trust +0.1"
  },
  {
    source: "advisor",
    title: "Intelligence Reports a Spy Network",
    body: "Your advisor has uncovered evidence of foreign intelligence operatives operating within the capital.",
    option_a_label: "Expand counter-intel",
    option_a_effect: "defense_level +10, currency -150, stability -2",
    option_b_label: "Publicize & expel",
    option_b_effect: "public_trust +0.15, stability +5, gdp -50"
  },
  {
    source: "citizen",
    title: "Pandemic Scare in the North",
    body: "A novel illness is spreading in northern provinces. Citizens demand government action.",
    option_a_label: "Fund emergency healthcare",
    option_a_effect: "stability +10, currency -400, public_trust +0.2",
    option_b_label: "Quarantine the region",
    option_b_effect: "stability -5, gdp -100, public_trust -0.1"
  },
  {
    source: "company",
    title: "Oil Tycoon Offers Infrastructure Deal",
    body: "A private energy baron proposes to fund your rail network in exchange for 20-year mineral rights.",
    option_a_label: "Accept the deal",
    option_a_effect: "gdp +300, currency +500, stability +4",
    option_b_label: "Reject — state-run only",
    option_b_effect: "gdp -50, public_trust +0.1, stability +2"
  },
  {
    source: "ally",
    title: "Ally Requests Military Support",
    body: "Your allied nation is facing internal unrest and requests you station peacekeeping units on their border.",
    option_a_label: "Deploy peacekeeping force",
    option_a_effect: "unit_power -10, stability +5, public_trust +0.1",
    option_b_label: "Decline — internal focus",
    option_b_effect: "stability -3, currency +100, public_trust -0.05"
  },
  {
    source: "advisor",
    title: "Black Market Fuel Trade Uncovered",
    body: "Your intelligence service has uncovered a black market for military-grade fuel within your borders.",
    option_a_label: "Crack down hard",
    option_a_effect: "stability +5, currency +200, public_trust +0.05",
    option_b_label: "Allow it — tax the black market",
    option_b_effect: "currency +400, stability -5, public_trust -0.1"
  },
  {
    source: "citizen",
    title: "Youth Protest: Climate Crisis",
    body: "Thousands of young citizens march demanding aggressive environmental reform and industrial controls.",
    option_a_label: "Pass green legislation",
    option_a_effect: "public_trust +0.2, stability +6, gdp -80",
    option_b_label: "Issue statement only",
    option_b_effect: "stability -4, gdp +50, public_trust -0.1"
  }
];

const NPC_EVENTS = [
  { headline: "Global Commodity Exchange Reports Record Oil Surplus", body: "Neutral territories have struck a massive oil reserve. Energy sector stocks may be affected globally.", category: "economy", tier: "standard" },
  { headline: "Rogue Scientist Claims Quantum Breakthrough in Disputed Zone", body: "A stateless research collective claims to have cracked quantum encryption, threatening digital finance systems.", category: "tech", tier: "standard" },
  { headline: "International Arbitration Bloc Condemns Warmongering", body: "The Global Arbitration Bloc has issued a formal censure warning all nations: further aggression will trigger sanctions.", category: "policy", tier: "breaking" },
  { headline: "Neutral Zone Reports Famine — Aid Requested", body: "Civilian populations in the unaligned northern territories are facing critical food shortages. Nations with surplus urged to respond.", category: "milestone", tier: "standard" },
  { headline: "Rogue AI Trading Bots Detected Manipulating Markets", body: "Investigators believe an unknown actor has deployed algorithmic bots across global stock exchanges. Volatility expected.", category: "economy", tier: "breaking" },
  { headline: "Ancient Pre-Epoch Vault Discovered — New Tech Cache Found", body: "Archaeologists have uncovered a trove of pre-collapse technologies. Several nations are mobilizing to claim the find.", category: "tech", tier: "gold" },
  { headline: "Diplomatic Summit Called: 'World Peace Forum 2.0'", body: "The League of Neutral States has called an emergency peace summit. Nations at war have been invited but none have confirmed.", category: "policy", tier: "standard" },
];

export default function DilemmaEngine({ nation, onDilemmaReady }) {
  const timerRef = useRef(null);
  const npcTimerRef = useRef(null);

  useEffect(() => {
    if (!nation) return;

    // Check for pending dilemma
    checkPendingDilemma();

    // Schedule next dilemma between 0.5–1 game day (15–30 real minutes)
    const delay = (0.5 + Math.random() * 0.5) * TICKS_PER_DAY * TICK_MS;
    timerRef.current = setTimeout(() => generateDilemma(), delay);

    // NPC global event every ~0.67 game day (~20 real minutes) if no recent news
    npcTimerRef.current = setTimeout(() => generateNpcEvent(), 0.67 * TICKS_PER_DAY * TICK_MS);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(npcTimerRef.current);
    };
  }, [nation?.id]);

  async function checkPendingDilemma() {
    const pending = await base44.entities.CouncilDilemma.filter({
      nation_id: nation.id,
      is_resolved: false
    });
    if (pending.length > 0) {
      onDilemmaReady(pending[0]);
    }
  }

  async function generateDilemma() {
    const pool = DILEMMA_POOL;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const dilemma = await base44.entities.CouncilDilemma.create({
      nation_id: nation.id,
      nation_name: nation.name,
      owner_email: nation.owner_email,
      is_resolved: false,
      chosen: "pending",
      ...picked
    });
    onDilemmaReady(dilemma);
  }

  async function generateNpcEvent() {
    const recentNews = await base44.entities.NewsArticle.list("-created_date", 5);
    // Only post NPC event if last article was over 10 minutes ago
    const lastArticle = recentNews[0];
    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    if (!lastArticle || new Date(lastArticle.created_date).getTime() < tenMinsAgo) {
      const event = NPC_EVENTS[Math.floor(Math.random() * NPC_EVENTS.length)];
      // Generate an image for the article
      let image_url = "";
      try {
        const imgResult = await base44.integrations.Core.GenerateImage({
          prompt: `News article illustration for: "${event.headline}". ${event.body}. Cinematic, dramatic, editorial style, no text.`
        });
        image_url = imgResult.url || "";
      } catch (_) {}
      await base44.entities.NewsArticle.create({
        ...event,
        nation_name: "Global Press Agency",
        nation_flag: "🌍",
        nation_color: "#64748b",
        image_url
      });
    }
  }

  return null; // Headless engine
}