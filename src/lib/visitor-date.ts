import { pinnedDate } from "@/lib/clock";
import { utcDateString } from "@/lib/game/date";

/**
 * The visitor's local date, worked out on the server so the page can render today's
 * image in the HTML. Vercel sends the visitor's IANA timezone in `x-vercel-ip-timezone`.
 * Without it (local runs, unknown IP) this falls back to the UTC date; the browser
 * re-checks with its own clock and refetches if they differ.
 */
export function visitorLocalDate(timeZone: string | null, now: Date = new Date()): string {
  const pinned = pinnedDate();
  if (pinned) return pinned;
  if (timeZone) {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    } catch {
      // Unknown timezone name: fall through to UTC.
    }
  }
  return utcDateString(now);
}
