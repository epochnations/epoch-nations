/**
 * GameClock — Persistent real-time simulation clock for Epoch Nations
 *
 * TIME SCALE:
 *   1 real minute  = 1 game tick     (60 seconds)
 *   1 game day     = 30 ticks        (30 real minutes)
 *   1 game week    = 210 ticks       (3.5 real hours)
 *   1 game month   = 840 ticks       (14 real hours)
 *   1 game year    = 10,080 ticks    (7 real days)
 *
 * The clock is derived purely from real wall-clock time with a fixed
 * game epoch start, so it is fully persistent across sessions and works
 * correctly even while players are offline.
 */

export const TICK_MS         = 60_000;    // 1 real minute per tick
export const TICKS_PER_DAY   = 30;        // 1 game day  = 30 real minutes
export const TICKS_PER_WEEK  = 210;       // 1 game week = 3.5 real hours
export const TICKS_PER_MONTH = 840;       // 1 game month = 14 real hours
export const TICKS_PER_YEAR  = 10_080;    // 1 game year  = 7 real days

// War auto-expires after 1 game week (3.5 real hours)
export const WAR_DURATION_MS = TICKS_PER_WEEK * TICK_MS;

// Fixed world start — persistent regardless of when player logs in
const GAME_EPOCH_START = new Date("2025-01-01T00:00:00Z").getTime();

/**
 * Returns the current game calendar derived from real wall-clock time.
 * Fully persistent — continues even while players are offline.
 *
 * @returns {{ totalTicks, year, month, week, day }}
 */
export function getGameTime() {
  const elapsed    = Date.now() - GAME_EPOCH_START;
  const totalTicks = Math.floor(elapsed / TICK_MS);

  const year  = Math.floor(totalTicks / TICKS_PER_YEAR)  + 1;
  const rem1  = totalTicks % TICKS_PER_YEAR;
  const month = Math.floor(rem1 / TICKS_PER_MONTH) + 1;
  const rem2  = rem1 % TICKS_PER_MONTH;
  const week  = Math.floor(rem2 / TICKS_PER_WEEK)  + 1;
  const rem3  = rem2 % TICKS_PER_WEEK;
  const day   = Math.floor(rem3 / TICKS_PER_DAY)   + 1;

  return { totalTicks, year, month, week, day };
}

/**
 * Formats game time as: "Day 12 • Week 2 • Month 3 • Year 4"
 */
export function formatGameTime(gt = getGameTime()) {
  return `Day ${gt.day} • Week ${gt.week} • Month ${gt.month} • Year ${gt.year}`;
}

/**
 * Convert game days → real-time milliseconds.
 */
export function gameDaysToMs(days) {
  return days * TICKS_PER_DAY * TICK_MS;
}