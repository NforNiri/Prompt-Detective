import { isValidDateString } from "@/lib/game/date";

/**
 * "Now" for the route handlers. In development only, DEV_TODAY=YYYY-MM-DD pins
 * the server date so pre-launch puzzles can be played locally. Ignored in
 * production.
 */
export function serverNow(): Date {
  const override = process.env.NODE_ENV === "development" ? process.env.DEV_TODAY : undefined;
  if (override && isValidDateString(override)) return new Date(`${override}T12:00:00Z`);
  return new Date();
}
