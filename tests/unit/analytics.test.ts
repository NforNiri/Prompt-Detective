import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FLAG_TIMEOUT_MS,
  getTrackedEvents,
  initAnalytics,
  resetAnalyticsForTests,
  resolveBudget,
  subscribeEvents,
  track,
} from "@/lib/analytics";
import { guessSubmitted, howtoCompleted, puzzleCompleted, puzzleViewed, slotEvent } from "@/lib/game/events";
import { newGame, type SavedGame } from "@/lib/game/state";
import { emptyStats, recordGame, statsSchema } from "@/lib/game/stats";
import type { PublicPuzzle } from "@/lib/game/types";

const puzzle: PublicPuzzle = { id: 5, date: "2026-10-08", imageUrl: "x", difficulty: 3, slots: ["who", "doing", "where", "style"] };

function finished(overrides: Partial<SavedGame>): SavedGame {
  return { ...newGame(10, 1_000_000), status: "won", ...overrides };
}

describe("event payload builders", () => {
  it("puzzle_viewed: first visit", () => {
    expect(puzzleViewed(puzzle, emptyStats(), false)).toEqual({
      puzzle_id: 5,
      difficulty: 3,
      is_returning: false,
      streak: 0,
    });
  });

  it("puzzle_viewed: returning player with a live streak", () => {
    const stats = recordGame(recordGame(emptyStats(), { puzzleId: 3, won: true, guessesUsed: 6 }), {
      puzzleId: 4,
      won: true,
      guessesUsed: 7,
    });
    expect(puzzleViewed(puzzle, stats, false)).toMatchObject({ is_returning: true, streak: 2 });
  });

  it("puzzle_viewed: a saved game in progress counts as returning", () => {
    expect(puzzleViewed(puzzle, emptyStats(), true).is_returning).toBe(true);
  });

  it("guess_submitted, slot_solved and hint_used", () => {
    expect(guessSubmitted(5, "style", { tier: "solved", typo: true }, 7)).toEqual({
      puzzle_id: 5,
      slot: "style",
      tier: "solved",
      guess_index: 7,
      typo: true,
    });
    expect(slotEvent(5, "who", 2)).toEqual({ puzzle_id: 5, slot: "who", guess_index: 2 });
  });

  it("puzzle_completed: a win with a hint", () => {
    const game = finished({
      guesses: [
        { slot: "who", guess: "dog", tier: "solved" },
        { slot: "doing", guess: "bike", tier: "solved" },
      ],
      hintUsed: "style",
      hintAt: 2,
    });
    expect(puzzleCompleted(5, game, 1_000_000 + 95_400)).toEqual({
      puzzle_id: 5,
      result: "won",
      guesses_used: 3,
      hint_used: true,
      budget: 10,
      duration_sec: 95,
    });
  });

  it("puzzle_completed: a loss with the short budget and no start time", () => {
    const game = finished({ status: "lost", budget: 8, startedAt: null });
    expect(puzzleCompleted(5, game, 5)).toMatchObject({ result: "lost", budget: 8, hint_used: false, duration_sec: null });
  });

  it("puzzle_completed refuses an unfinished game", () => {
    expect(() => puzzleCompleted(5, newGame(), 0)).toThrow();
  });

  it("howto_completed", () => {
    expect(howtoCompleted(true, 1)).toEqual({ skipped: true, panel_reached: 1 });
  });
});

describe("statsSchema", () => {
  it("accepts stored stats, including JSON's string keys", () => {
    const stored = JSON.parse(JSON.stringify(recordGame(emptyStats(), { puzzleId: 1, won: true, guessesUsed: 6 })));
    const parsed = statsSchema.safeParse(stored);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.distribution[6]).toBe(1);
  });

  it("rejects garbage", () => {
    expect(statsSchema.safeParse({ played: -1 }).success).toBe(false);
  });
});

describe("track", () => {
  beforeEach(() => {
    resetAnalyticsForTests();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("records every event for the debug panel and notifies listeners", () => {
    const listener = vi.fn();
    subscribeEvents(listener);
    track("stats_opened", { puzzle_id: 5 });
    track("hint_used", slotEvent(5, "where", 4));
    expect(getTrackedEvents().map((e) => e.name)).toEqual(["stats_opened", "hint_used"]);
    expect(getTrackedEvents()[1]?.props).toEqual({ puzzle_id: 5, slot: "where", guess_index: 4 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("keeps only the last 50 events", () => {
    for (let i = 0; i < 60; i++) track("stats_opened", { puzzle_id: i });
    expect(getTrackedEvents()).toHaveLength(50);
    expect(getTrackedEvents()[0]?.props.puzzle_id).toBe(10);
  });

  it("runs without a PostHog key", async () => {
    await expect(initAnalytics("7d444840-9dc0-41d2-9a5e-4c5a2f1b6a01")).resolves.toBeNull();
    expect(() => track("stats_opened", { puzzle_id: 1 })).not.toThrow();
  });

  it("falls back to a budget of 10 when there is no client", async () => {
    await initAnalytics("7d444840-9dc0-41d2-9a5e-4c5a2f1b6a01");
    await expect(resolveBudget()).resolves.toBe(10);
  });

  it(`falls back to 10 if flags do not arrive within ${FLAG_TIMEOUT_MS}ms`, async () => {
    vi.useFakeTimers();
    const pending = resolveBudget();
    await vi.advanceTimersByTimeAsync(FLAG_TIMEOUT_MS + 10);
    await expect(pending).resolves.toBe(10);
  });
});
