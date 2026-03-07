import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { JOURNALISTS, EDITION_ADJECTIVES } from "./NewsEventConfig";
import { getCitiesForNation, generateCityEvents } from "./CityConfig";

const CITY_TICK_MS = 45_000; // 45s per city tick (faster)
const MAX_CITY_ACTIVE = 4;   // max unresolved per city

export default function CityNewsEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);
  const editionRef = useRef(Math.floor(Math.random() * 500) + 200);

  useEffect(() => {
    if (!nation?.id) return;
    const first = setTimeout(() => runCityTick(), 5000);
    intervalRef.current = setInterval(() => runCityTick(), CITY_TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(intervalRef.current);
    };
  }, [nation?.id]);

  async function runCityTick() {
    const fresh = (await base44.entities.Nation.filter({ owner_email: nation.owner_email }))[0];
    if (!fresh) return;

    const cities = getCitiesForNation(fresh);
    // Pick 2-3 random cities to generate events for this tick
    const shuffled = [...cities].sort(() => Math.random() - 0.5);
    const activeCities = shuffled.slice(0, 3);

    for (const city of activeCities) {
      const existing = await base44.entities.NewsEvent.filter({
        nation_id: fresh.id,
        owner_email: fresh.owner_email,
      });
      // Count unresolved events for this city
      const cityPending = existing.filter(e => !e.is_resolved && e.city_tag === city.tag);
      if (cityPending.length >= MAX_CITY_ACTIVE) continue;

      const toGenerate = Math.max(1, MAX_CITY_ACTIVE - cityPending.length);
      const templates = generateCityEvents(fresh, city, Math.min(toGenerate, 2));

      editionRef.current += 1;
      const editionAdj = EDITION_ADJECTIVES[Math.floor(Math.random() * EDITION_ADJECTIVES.length)];

      for (const tpl of templates) {
        const author = JOURNALISTS[Math.floor(Math.random() * JOURNALISTS.length)];
        await base44.entities.NewsEvent.create({
          nation_id: fresh.id,
          owner_email: fresh.owner_email,
          category: tpl.category,
          severity: tpl.severity || "info",
          headline: tpl.headline,
          body: tpl.body,
          author,
          edition: `${editionAdj} Edition #${editionRef.current}`,
          weather_type: "",
          options: tpl.options || [],
          is_resolved: false,
          is_disaster: tpl.is_disaster || false,
          chosen_option: "",
          stat_preview: {},
          city_tag: city.tag,
          city_name: city.name,
          city_color: city.color,
          city_emoji: city.emoji,
        });
      }
    }
    onRefresh?.();
  }

  return null;
}