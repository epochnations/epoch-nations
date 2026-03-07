import { useState, useMemo } from "react";
import { WEATHER_EMOJIS, WEATHER_EFFECTS } from "./NewsEventConfig";

// ─── Deterministic hourly forecast generator ────────────────────────────────
const WEATHER_TYPES_W = ["Clear","Rain","Storm","Heatwave","Cold Front","Heavy Wind","Drought"];

function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function generateHourly(weather, nation) {
  const now = new Date();
  const seed = now.getDate() * 100 + now.getMonth() + (nation?.tech_level || 1);
  const rand = seedRand(seed);

  const BASE_TEMP = {
    Clear:50, Rain:42, Storm:38, Heatwave:88, "Cold Front":18, "Heavy Wind":40, Drought:92
  }[weather] || 55;

  return Array.from({ length: 24 }, (_, h) => {
    const hour = (now.getHours() + h) % 24;
    const tempVariance = (rand() - 0.5) * 12;
    const temp = Math.round(BASE_TEMP + tempVariance + (hour > 12 ? -4 : 3));
    const humidity = Math.round(30 + rand() * 60);
    const wind = Math.round(5 + rand() * 30);
    const rain = weather === "Rain" ? Math.round(30 + rand() * 60)
               : weather === "Storm" ? Math.round(60 + rand() * 35)
               : weather === "Drought" ? 0
               : Math.round(rand() * 20);
    const storm = weather === "Storm" ? Math.round(40 + rand() * 50) : Math.round(rand() * 10);
    const label = hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;
    const isNow = h === 0;
    return { hour, label, temp, humidity, wind, rain, storm, isNow };
  });
}

function generateWeekly(weather, nation) {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const now = new Date();
  const seed = now.getDate() * 1000 + now.getMonth() * 31 + (nation?.stability || 75);
  const rand = seedRand(seed);

  const BASE_TEMP = {
    Clear:58, Rain:44, Storm:40, Heatwave:90, "Cold Front":22, "Heavy Wind":42, Drought:88
  }[weather] || 55;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const wTypes = WEATHER_TYPES_W;
    const wIdx = Math.round(rand() * (wTypes.length - 1));
    const dayWeather = i === 0 ? weather : (rand() > 0.6 ? wTypes[wIdx] : weather);
    const high = Math.round(BASE_TEMP + (rand() - 0.4) * 15);
    const low = Math.round(high - 10 - rand() * 10);
    const precip = dayWeather === "Drought" ? 0 : Math.round(rand() * 80);
    const windSummary = rand() > 0.5 ? "Gusty" : rand() > 0.5 ? "Calm" : "Breezy";
    return {
      day: days[d.getDay()],
      date: d.getDate(),
      weather: dayWeather,
      emoji: WEATHER_EMOJIS[dayWeather] || "🌡️",
      high, low, precip, windSummary,
      isToday: i === 0,
      alert: dayWeather === "Storm" || dayWeather === "Heatwave" || dayWeather === "Drought",
    };
  });
}

export default function WeatherForecastWidget({ weather, nation }) {
  const [view, setView] = useState("hourly");
  const hourly = useMemo(() => generateHourly(weather, nation), [weather, nation?.id]);
  const weekly = useMemo(() => generateWeekly(weather, nation), [weather, nation?.id]);
  const fx = WEATHER_EFFECTS[weather] || {};

  const currentHour = hourly[0];
  const severeAlert = weather === "Storm" || weather === "Heatwave" || weather === "Drought";

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest whitespace-nowrap">🌦 Weather Forecast</div>
          <div className="flex rounded-xl overflow-hidden border border-white/10 text-[10px] font-bold shrink-0">
            <button onClick={() => setView("hourly")}
              className={`px-3 py-1.5 transition-all ${view==="hourly" ? "bg-cyan-500/30 text-cyan-200" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
              Hourly
            </button>
            <button onClick={() => setView("weekly")}
              className={`px-3 py-1.5 transition-all ${view==="weekly" ? "bg-cyan-500/30 text-cyan-200" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
              Weekly
            </button>
          </div>
        </div>

        {/* Current conditions */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{WEATHER_EMOJIS[weather] || "🌡️"}</span>
          <div>
            <div className="font-black text-white text-lg leading-none">{currentHour.temp}°F</div>
            <div className="text-slate-400 text-xs">{weather} · Feels like {currentHour.temp - 3}°F</div>
          </div>
          <div className="ml-auto text-right text-xs text-slate-500 space-y-0.5">
            <div>💧 {currentHour.humidity}% humidity</div>
            <div>💨 {currentHour.wind} mph winds</div>
            <div>🌧 {currentHour.rain}% rain</div>
          </div>
        </div>

        {/* Severe alert */}
        {severeAlert && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 mb-2">
            <span className="text-red-400 animate-pulse text-sm">⚠️</span>
            <span className="text-xs text-red-300 font-bold">
              {weather === "Storm" ? "Severe Storm Warning in Effect"
               : weather === "Heatwave" ? "Extreme Heat Advisory Active"
               : "Drought Emergency Declared"}
            </span>
          </div>
        )}

        {/* Weather impacts */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(fx).filter(([,v]) => v !== 0).map(([k, v]) => (
            <div key={k} className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${v > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {k}: {v > 0 ? "+" : ""}{v}
            </div>
          ))}
        </div>
      </div>

      {/* Hourly View */}
      {view === "hourly" && (
        <div className="px-2 pb-3">
          <div className="flex gap-1.5 overflow-x-auto py-2 pb-1" style={{ scrollbarWidth:"none" }}>
            {hourly.slice(0, 18).map((h, i) => (
              <div key={i} className={`shrink-0 flex flex-col items-center rounded-xl px-2 py-2 gap-1 min-w-[48px] ${h.isNow ? "bg-cyan-500/20 border border-cyan-500/30" : "bg-white/5"}`}>
                <div className="text-[9px] text-slate-500 font-bold">{h.isNow ? "Now" : h.label}</div>
                <div className="text-base">
                  {h.storm > 50 ? "⛈️" : h.rain > 50 ? "🌧️" : h.rain > 20 ? "🌦️" : WEATHER_EMOJIS[weather] || "☀️"}
                </div>
                <div className="text-xs font-black text-white">{h.temp}°</div>
                {h.rain > 0 && <div className="text-[9px] text-blue-400">{h.rain}%</div>}
              </div>
            ))}
          </div>
          <div className="px-2 pt-1 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Storm probability</span>
              <span className={`font-mono ${currentHour.storm > 40 ? "text-red-400" : "text-slate-400"}`}>{currentHour.storm}%</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Agriculture impact</span>
              <span className={`font-mono ${(fx.food||0) < 0 ? "text-red-400" : "text-emerald-400"}`}>{(fx.food||0) > 0 ? "+" : ""}{fx.food||0} food</span>
            </div>
          </div>
        </div>
      )}

      {/* Weekly View */}
      {view === "weekly" && (
        <div className="px-3 pb-4">
          <div className="space-y-1">
            {weekly.map((d, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-xl px-2 py-2 ${d.isToday ? "bg-cyan-500/15 border border-cyan-500/20" : "bg-white/3 hover:bg-white/5"}`}>
                <div className="w-8 text-xs font-bold text-slate-400">{d.isToday ? "Today" : d.day}</div>
                <div className="text-base w-6 text-center">{d.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-500 truncate">{d.weather}</div>
                  {d.alert && <div className="text-[9px] text-red-400 font-bold animate-pulse">⚠ Alert</div>}
                </div>
                <div className="text-[10px] text-slate-500">{d.windSummary}</div>
                <div className="text-[10px] text-blue-400">{d.precip}%🌧</div>
                <div className="text-xs font-mono">
                  <span className="text-orange-300">{d.high}°</span>
                  <span className="text-slate-600"> / </span>
                  <span className="text-blue-300">{d.low}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}