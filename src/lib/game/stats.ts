import * as z from "zod/mini";
import type { GameState, Stats } from "./types";

export const DISTRIBUTION_MIN = 4;
export const DISTRIBUTION_MAX = 10;

const count = z.number().check(z.int(), z.minimum(0));
const statsShape = z.object({
  played: count,
  won: count,
  currentStreak: count,
  maxStreak: count,
  lastPlayedPuzzleId: z.nullable(z.number().check(z.int())),
  // JSON object keys come back as strings.
  distribution: z.record(z.string().check(z.regex(/^\d+$/)), count),
});

/** Validates `pd:stats` read from storage. */
export const statsSchema = {
  safeParse(input: unknown): { success: true; data: Stats } | { success: false } {
    const result = statsShape.safeParse(input);
    if (!result.success) return { success: false };
    const distribution: Record<number, number> = {};
    for (const [key, value] of Object.entries(result.data.distribution)) distribution[Number(key)] = value;
    return { success: true, data: { ...result.data, distribution } };
  },
};

export function emptyStats(): Stats {
  const distribution: Record<number, number> = {};
  for (let n = DISTRIBUTION_MIN; n <= DISTRIBUTION_MAX; n++) distribution[n] = 0;
  return { played: 0, won: 0, currentStreak: 0, maxStreak: 0, lastPlayedPuzzleId: null, distribution };
}

/** Guesses spent so far. The hint costs one. */
export function guessesUsed(state: Pick<GameState, "guesses" | "hintUsed">): number {
  return state.guesses.length + (state.hintUsed ? 1 : 0);
}

export interface GameResult {
  puzzleId: number;
  won: boolean;
  guessesUsed: number;
}

/**
 * Fold one finished game into the stats. Puzzle ids are consecutive days, so a
 * streak continues only when the previous puzzle was won. Recording the same
 * (or an older) puzzle twice is a no-op.
 */
export function recordGame(stats: Stats, result: GameResult): Stats {
  const last = stats.lastPlayedPuzzleId;
  if (last !== null && result.puzzleId <= last) return stats;

  const played = stats.played + 1;
  if (!result.won) {
    return { ...stats, played, currentStreak: 0, lastPlayedPuzzleId: result.puzzleId };
  }

  const continues = last === result.puzzleId - 1;
  const currentStreak = (continues ? stats.currentStreak : 0) + 1;
  return {
    played,
    won: stats.won + 1,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastPlayedPuzzleId: result.puzzleId,
    distribution: {
      ...stats.distribution,
      [result.guessesUsed]: (stats.distribution[result.guessesUsed] ?? 0) + 1,
    },
  };
}

/** The streak to display today. It is already broken if yesterday's puzzle was skipped. */
export function displayStreak(stats: Stats, todayPuzzleId: number): number {
  const last = stats.lastPlayedPuzzleId;
  if (last === null || last < todayPuzzleId - 1) return 0;
  return stats.currentStreak;
}

export function winPercentage(stats: Stats): number {
  return stats.played === 0 ? 0 : Math.round((stats.won / stats.played) * 100);
}
