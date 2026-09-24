import "server-only";
import { countRecentGuesses } from "@/lib/puzzle-repo";

export const GUESS_RATE_LIMIT = 30;
export const GUESS_RATE_WINDOW_MS = 60_000;

/** 30 guesses per minute per ip_hash, counted from guess_log. */
export async function isGuessRateLimited(ipHash: string, now: Date = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - GUESS_RATE_WINDOW_MS);
  return (await countRecentGuesses(ipHash, since)) >= GUESS_RATE_LIMIT;
}
