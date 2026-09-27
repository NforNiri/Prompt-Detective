import { isValidDateString } from "@/lib/game/date";

/**
 * "Now" for the app, client and server. In development only,
 * NEXT_PUBLIC_DEV_TODAY=YYYY-MM-DD pins the date so pre-launch puzzles can be
 * played locally. Ignored in production builds.
 */
export function appNow(): Date {
  const override = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEV_TODAY : undefined;
  if (override && isValidDateString(override)) return new Date(`${override}T12:00:00Z`);
  return new Date();
}
