import { isValidDateString } from "@/lib/game/date";

/**
 * "Now" for the app, client and server. In development only,
 * NEXT_PUBLIC_DEV_TODAY=YYYY-MM-DD pins the local date (keeping the real time
 * of day, so countdowns tick) to play pre-launch puzzles. Ignored in production.
 */
export function appNow(): Date {
  const real = new Date();
  const override = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEV_TODAY : undefined;
  if (!override || !isValidDateString(override)) return real;
  const [year, month, day] = override.split("-").map(Number) as [number, number, number];
  return new Date(year, month - 1, day, real.getHours(), real.getMinutes(), real.getSeconds(), real.getMilliseconds());
}
