import { useEffect } from "react";

export default function CitySimulationEngine({ city, nation, onEventTriggered, onRefresh }) {
  useEffect(() => {
    const interval = setInterval(async () => {
      simulateCityTick();
    }, 30000); // 30 second ticks (game hours)

    return () => clearInterval(interval);
  }, [city?.id, nation?.id]);

  async function simulateCityTick() {
    if (!city?.id) return;

    // Simulate happiness decay based on crime, pollution, services
    const crimeImpact = (city.crime_rate || 20) * 0.3;
    const pollutionImpact = (city.pollution || 10) * 0.2;
    const serviceImpact = (city.police_stations + city.fire_stations) * 2;

    const happinessChange = -crimeImpact - pollutionImpact + serviceImpact - (city.traffic || 25) * 0.1;
    const newHappiness = Math.max(0, Math.min(100, (city.happiness || 75) + happinessChange * 0.1));

    // Population growth based on happiness
    const popGrowth = (newHappiness / 100) * (city.population || 5000) * 0.001;
    const newPopulation = Math.round((city.population || 5000) + popGrowth);

    // Crime increase based on police coverage
    const crimeChange = (city.police_stations || 1) > 0 ? -2 : 1;
    const newCrime = Math.max(0, Math.min(100, (city.crime_rate || 20) + crimeChange));

    // Random events
    const eventChance = Math.random();
    let event = null;

    if (eventChance < 0.05) {
      const eventTypes = ["fire", "crime_wave", "disease_outbreak", "riot"];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      event = {
        city_id: city.id,
        nation_id: city.nation_id,
        owner_email: city.owner_email,
        city_name: city.city_name,
        event_type: randomEvent,
        title: `${randomEvent.replace(/_/g, " ")} in ${city.city_name}`,
        description: `A ${randomEvent.replace(/_/g, " ")} has occurred in your city.`,
        severity: Math.random() > 0.7 ? "critical" : "medium",
        impact: {
          happiness: -15 - Math.random() * 20,
          population: -200 - Math.random() * 500,
          crime_rate: Math.random() * 15,
        },
      };

      onEventTriggered?.(event);
    }

    // Update city
    const updates = {
      happiness: newHappiness,
      population: newPopulation,
      crime_rate: newCrime,
      pollution: Math.max(0, Math.min(100, (city.pollution || 10) + (city.industrial_zones || 0) * 0.05 - (city.park_tiles || 0) * 0.1)),
    };

    const { base44 } = await import("@/api/base44Client");
    await base44.entities.City.update(city.id, updates);

    onRefresh?.();
  }

  return null;
}