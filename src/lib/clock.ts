import { isValidDateString } from "@/lib/game/date";

/**
 * The pinned date from NEXT_PUBLIC_DEV_TODAY=YYYY-MM-DD, used to play pre-launch
 * puzzles in dev, local production builds (Lighthouse) and Vercel previews.
 * Never on Vercel production, even if someone sets it there.
 */
export function pinnedDate(): string | null {
  const override = process.env.NEXT_PUBLIC_DEV_TODAY;
  const vercelProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production" || process.env.VERCEL_ENV === "production";
  return override && !vercelProduction && isValidDateString(override) ? override : null;
}

/** "Now" for the app, client and server. A pinned date keeps the real time of day, so countdowns tick. */
export function appNow(): Date {
  const real = new Date();
  const pinned = pinnedDate();
  if (!pinned) return real;
  const [year, month, day] = pinned.split("-").map(Number) as [number, number, number];
  return new Date(year, month - 1, day, real.getHours(), real.getMinutes(), real.getSeconds(), real.getMilliseconds());
}
