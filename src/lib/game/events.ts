import { displayStreak, guessesUsed } from "./stats";
import type { SavedGame } from "./state";
import type { MatchResult, PublicPuzzle, SlotKey, Stats } from "./types";

// Analytics events from docs/02-TECH-SPEC.md "Analytics events". Names and properties
// must match the spec table. The builders are pure so the payloads are unit tested.

export type ShareMethod = "native" | "clipboard";
export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export interface AnalyticsEvents {
  puzzle_viewed: { puzzle_id: number; difficulty: number; is_returning: boolean; streak: number };
  guess_submitted: { puzzle_id: number; slot: SlotKey; tier: MatchResult["tier"]; guess_index: number; typo: boolean };
  hint_used: { puzzle_id: number; slot: SlotKey; guess_index: number };
  slot_solved: { puzzle_id: number; slot: SlotKey; guess_index: number };
  puzzle_completed: {
    puzzle_id: number;
    result: "won" | "lost";
    guesses_used: number;
    hint_used: boolean;
    budget: number;
    duration_sec: number | null;
  };
  share_clicked: { puzzle_id: number; method: ShareMethod; result: ShareResult };
  stats_opened: { puzzle_id: number };
  howto_completed: { skipped: boolean; panel_reached: number };
}

export type EventName = keyof AnalyticsEvents;

export function puzzleViewed(puzzle: PublicPuzzle, stats: Stats, hadSavedGame: boolean): AnalyticsEvents["puzzle_viewed"] {
  return {
    puzzle_id: puzzle.id,
    difficulty: puzzle.difficulty,
    is_returning: stats.played > 0 || hadSavedGame,
    streak: displayStreak(stats, puzzle.id),
  };
}

/** `guessIndex` is the 1-based position of this guess, counting the hint. */
export function guessSubmitted(
  puzzleId: number,
  slot: SlotKey,
  result: MatchResult,
  guessIndex: number,
): AnalyticsEvents["guess_submitted"] {
  return { puzzle_id: puzzleId, slot, tier: result.tier, guess_index: guessIndex, typo: result.typo };
}

export function slotEvent(puzzleId: number, slot: SlotKey, guessIndex: number): AnalyticsEvents["slot_solved"] {
  return { puzzle_id: puzzleId, slot, guess_index: guessIndex };
}

export function puzzleCompleted(puzzleId: number, game: SavedGame, nowMs: number): AnalyticsEvents["puzzle_completed"] {
  if (game.status === "playing") throw new Error("puzzleCompleted: game is not finished");
  return {
    puzzle_id: puzzleId,
    result: game.status,
    guesses_used: guessesUsed(game),
    hint_used: game.hintUsed !== null,
    budget: game.budget,
    duration_sec: game.startedAt === null ? null : Math.max(0, Math.round((nowMs - game.startedAt) / 1000)),
  };
}

export function howtoCompleted(skipped: boolean, panelReached: number): AnalyticsEvents["howto_completed"] {
  return { skipped, panel_reached: panelReached };
}
