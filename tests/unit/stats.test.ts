import { describe, expect, it } from "vitest";
import { displayStreak, emptyStats, guessesUsed, recordGame, winPercentage } from "@/lib/game/stats";
import type { Stats } from "@/lib/game/types";

type Played = [puzzleId: number, won: boolean, used?: number];

function play(results: Played[]): Stats {
  return results.reduce(
    (stats, [puzzleId, won, used = 6]) => recordGame(stats, { puzzleId, won, guessesUsed: used }),
    emptyStats(),
  );
}

describe("recordGame", () => {
  it("starts from zero with a 4..10 distribution", () => {
    const stats = emptyStats();
    expect(stats.played).toBe(0);
    expect(Object.keys(stats.distribution)).toEqual(["4", "5", "6", "7", "8", "9", "10"]);
  });

  it("continues the streak on consecutive wins", () => {
    const stats = play([
      [1, true],
      [2, true],
      [3, true],
    ]);
    expect(stats).toMatchObject({ played: 3, won: 3, currentStreak: 3, maxStreak: 3, lastPlayedPuzzleId: 3 });
  });

  it("breaks the streak after a skipped day", () => {
    const stats = play([
      [1, true],
      [2, true],
      [4, true],
    ]);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(2);
  });

  it("resets the streak on a loss and restarts it on the next win", () => {
    const afterLoss = play([
      [1, true],
      [2, true],
      [3, false],
    ]);
    expect(afterLoss).toMatchObject({ played: 3, won: 2, currentStreak: 0, maxStreak: 2 });
    expect(recordGame(afterLoss, { puzzleId: 4, won: true, guessesUsed: 5 }).currentStreak).toBe(1);
  });

  it("updates the distribution for wins only", () => {
    const stats = play([
      [1, true, 5],
      [2, true, 5],
      [3, true, 9],
      [4, false, 10],
    ]);
    expect(stats.distribution).toMatchObject({ 4: 0, 5: 2, 9: 1, 10: 0 });
  });

  it("adds a bucket for an out-of-range guess count instead of dropping it", () => {
    expect(play([[1, true, 11]]).distribution[11]).toBe(1);
  });

  it("ignores a puzzle that was already recorded", () => {
    const once = play([[5, true]]);
    expect(recordGame(once, { puzzleId: 5, won: true, guessesUsed: 4 })).toBe(once);
    expect(recordGame(once, { puzzleId: 4, won: true, guessesUsed: 4 })).toBe(once);
  });

  it("does not mutate its input", () => {
    const before = emptyStats();
    recordGame(before, { puzzleId: 1, won: true, guessesUsed: 4 });
    expect(before).toEqual(emptyStats());
  });
});

describe("displayStreak", () => {
  const stats = play([
    [1, true],
    [2, true],
  ]);

  it("shows the streak today and the day after", () => {
    expect(displayStreak(stats, 2)).toBe(2);
    expect(displayStreak(stats, 3)).toBe(2);
  });

  it("shows 0 once a day was skipped", () => {
    expect(displayStreak(stats, 4)).toBe(0);
    expect(displayStreak(emptyStats(), 1)).toBe(0);
  });
});

describe("winPercentage and guessesUsed", () => {
  it("rounds the win rate and handles zero games", () => {
    expect(winPercentage(emptyStats())).toBe(0);
    const stats = play([
      [1, true],
      [2, false],
      [3, true],
    ]);
    expect(winPercentage(stats)).toBe(67);
  });

  it("counts the hint as a guess", () => {
    const guesses = [{ slot: "who" as const, guess: "dog", tier: "solved" as const }];
    expect(guessesUsed({ guesses, hintUsed: null })).toBe(1);
    expect(guessesUsed({ guesses, hintUsed: "style" })).toBe(2);
  });
});
