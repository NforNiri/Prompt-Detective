import { describe, expect, it } from "vitest";
import { buildShareRows, buildShareText, type ShareStrings } from "@/lib/game/share";
import type { GameState, GuessRecord } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";

const strings: ShareStrings = { title: en.appName, slotLabels: en.slots };
const url = "prompt-detective.vercel.app";

function game(guesses: GuessRecord[], overrides: Partial<GameState> = {}): GameState {
  return { guesses, hintUsed: null, hintAt: null, status: "won", budget: 10, ...overrides };
}

describe("buildShareText", () => {
  it("formats a won game", () => {
    const state = game([
      { slot: "who", guess: "dog", tier: "solved" },
      { slot: "doing", guess: "running", tier: "cold" },
      { slot: "doing", guess: "biking", tier: "solved" },
      { slot: "where", guess: "sand", tier: "hot" },
      { slot: "where", guess: "beach", tier: "solved" },
      { slot: "style", guess: "painting", tier: "hot" },
      { slot: "style", guess: "watercolor", tier: "solved" },
    ]);
    expect(buildShareText({ puzzleId: 1, state, url, strings })).toBe(
      [
        "Prompt Detective #1  7/10",
        "WHO    🟩",
        "DOING  ⬛🟩",
        "WHERE  🟧🟩",
        "STYLE  🟧🟩",
        "prompt-detective.vercel.app",
      ].join("\n"),
    );
  });

  it("formats a lost game, with an empty row for an untouched slot", () => {
    const state = game(
      [
        { slot: "who", guess: "dog", tier: "solved" },
        { slot: "doing", guess: "walking", tier: "cold" },
        { slot: "doing", guess: "riding", tier: "hot" },
        { slot: "doing", guess: "pedaling", tier: "hot" },
        { slot: "doing", guess: "racing", tier: "warm" },
        { slot: "style", guess: "photo", tier: "cold" },
        { slot: "style", guess: "art", tier: "warm" },
        { slot: "style", guess: "gouache", tier: "hot" },
      ],
      { status: "lost", budget: 8 },
    );
    expect(buildShareText({ puzzleId: 3, state, url, strings })).toBe(
      [
        "Prompt Detective #3  X/8",
        "WHO    🟩",
        "DOING  ⬛🟧🟧🟨",
        "WHERE",
        "STYLE  ⬛🟨🟧",
        "prompt-detective.vercel.app",
      ].join("\n"),
    );
  });

  it("places the hint square where the hint was used and counts it as a guess", () => {
    const state = game(
      [
        { slot: "who", guess: "dog", tier: "solved" },
        { slot: "doing", guess: "biking", tier: "solved" },
        { slot: "where", guess: "beach", tier: "solved" },
        { slot: "style", guess: "photo", tier: "cold" },
        { slot: "style", guess: "watercolor", tier: "solved" },
      ],
      { hintUsed: "style", hintAt: 4 },
    );
    expect(buildShareText({ puzzleId: 12, state, url, strings })).toBe(
      [
        "Prompt Detective #12  6/10",
        "WHO    🟩",
        "DOING  🟩",
        "WHERE  🟩",
        "STYLE  ⬛💡🟩",
        "prompt-detective.vercel.app",
      ].join("\n"),
    );
  });

  it("refuses to share an unfinished game", () => {
    expect(() => buildShareText({ puzzleId: 1, state: game([], { status: "playing" }), url, strings })).toThrow();
  });
});

describe("buildShareRows", () => {
  it("puts a hint used before any guess first in its row", () => {
    const state = game([{ slot: "who", guess: "dog", tier: "solved" }], { hintUsed: "who", hintAt: 0 });
    expect(buildShareRows(state).who).toBe("💡🟩");
  });

  it("puts a hint used after the last guess (or with no position) at the end", () => {
    const guesses: GuessRecord[] = [{ slot: "who", guess: "cat", tier: "cold" }];
    expect(buildShareRows(game(guesses, { hintUsed: "who", hintAt: 1 })).who).toBe("⬛💡");
    expect(buildShareRows(game(guesses, { hintUsed: "who", hintAt: null })).who).toBe("⬛💡");
  });
});
