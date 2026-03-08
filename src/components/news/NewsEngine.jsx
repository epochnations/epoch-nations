import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  generateEventsForNation, pickWeather, WEATHER_EFFECTS, JOURNALISTS, EDITION_ADJECTIVES,
  DISASTER_TEMPLATES, pickWeightedEvent
} from "./NewsEventConfig";

const TICK_MS = 90_000;  // generate new events every 90 seconds
const MAX_ACTIVE = 30;   // max pending (unresolved) events at once

export default function NewsEngine({ nation, onRefresh }) {
  const intervalRef = useRef(null);
  const editionRef = useRef(Math.floor(Math.random() * 900) + 100);

  useEffect(() => {
    if (!nation?.id) return;

    // Initial run after 2s
    const first = setTimeout(() => runTick(), 2000);
    intervalRef.current = setInterval(() => runTick(), TICK_MS);

    return () => {
      clearTimeout(first);
      clearInterval(intervalRef.current);
    };
  }, [nation?.id]);

  async function runTick() {
    const fresh = (await base44.entities.Nation.filter({ owner_email: nation.owner_email }))[0];
    if (!fresh) return;

    // Check how many unresolved events exist
    const existing = await base44.entities.NewsEvent.filter({ nation_id: fresh.id });
    const pending = existing.filter(e => !e.is_resolved);
    if (pending.length >= MAX_ACTIVE) return; // don't spam

    // How many to generate?
    const toGenerate = MAX_ACTIVE - pending.length;

    // Determine weather for this tick
    const weather = pickWeather(fresh);
    const weatherFx = WEATHER_EFFECTS[weather] || {};

    // Apply weather effects passively to nation
    const weatherUpdates = {};
    if (weatherFx.food)      weatherUpdates.res_food = Math.max(0, (fresh.res_food || 0) + weatherFx.food);
    if (weatherFx.stability) weatherUpdates.stability = Math.max(0, Math.min(100, (fresh.stability || 75) + weatherFx.stability));
    if (weatherFx.gdp)       weatherUpdates.gdp = Math.max(0, (fresh.gdp || 500) + weatherFx.gdp);
    if (Object.keys(weatherUpdates).length > 0) {
      await base44.entities.Nation.update(fresh.id, weatherUpdates);
    }

    // Rare disaster (12% chance per tick — more frequent breaking news)
    const isDisasterTick = Math.random() < 0.12;

    editionRef.current += 1;
    const editionAdj = EDITION_ADJECTIVES[Math.floor(Math.random() * EDITION_ADJECTIVES.length)];
    const editionStr = `${editionAdj} Edition #${editionRef.current}`;

    const templates = isDisasterTick
      ? [pickWeightedEvent(DISASTER_TEMPLATES)]
      : generateEventsForNation(fresh, toGenerate);

    for (const tpl of templates) {
      const author = JOURNALISTS[Math.floor(Math.random() * JOURNALISTS.length)];
      // Generate image for disaster events or high-severity events
      let image_url = "";
      if (tpl.is_disaster || tpl.severity === "critical") {
        try {
          const imgRes = await base44.integrations.Core.GenerateImage({
            prompt: `News illustration for: "${tpl.headline}". ${tpl.body || ""}. Editorial, cinematic, dramatic photo-realistic style. No text overlay.`
          });
          image_url = imgRes.url || "";
        } catch (_) {}
      }
      await base44.entities.NewsEvent.create({
        nation_id: fresh.id,
        owner_email: fresh.owner_email,
        category: tpl.category,
        severity: tpl.severity || "info",
        headline: tpl.headline,
        body: tpl.body,
        author,
        edition: editionStr,
        weather_type: weather,
        options: tpl.options || [],
        is_resolved: false,
        is_disaster: tpl.is_disaster || false,
        chosen_option: "",
        stat_preview: tpl.effects || {},
        image_url,
      });
    }

    onRefresh?.();
  }

  return null;
}