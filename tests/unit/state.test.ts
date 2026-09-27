import { describe, expect, it } from "vitest";
import {
  canUseHint,
  checkGuess,
  gameReducer,
  guessesLeft,
  initialModel,
  newGame,
  nextUnsolvedSlot,
  savedGameSchema,
  type GameAction,
  type GameModel,
  type SavedGame,
} from "@/lib/game/state";
import type { GuessResponse, PublicPuzzle, SlotKey } from "@/lib/game/types";

const puzzle: PublicPuzzle = {
  id: 1,
  date: "2026-10-04",
  imageUrl: "https://x.supabase.co/storage/v1/object/public/puzzles/a.webp",
  difficulty: 1,
  slots: ["who", "doing", "where", "style"],
};

function loaded(saved: SavedGame | null = null, budget = 10): GameModel {
  return gameReducer(initialModel(), { type: "LOADED", puzzle, saved, budget, firstVisit: false, storageOk: true });
}

function run(model: GameModel, ...actions: GameAction[]): GameModel {
  return actions.reduce(gameReducer, model);
}

/** Submit and resolve one guess on the currently selected slot. */
function guess(model: GameModel, text: string, result: GuessResponse): GameModel {
  const slot = model.selectedSlot;
  return run(model, { type: "SUBMIT_GUESS", guess: text }, { type: "GUESS_RESULT", slot, guess: text.trim(), result });
}

const solved = (answer: string): GuessResponse => ({ tier: "solved", typo: false, answer });
const cold: GuessResponse = { tier: "cold", typo: false };

function select(model: GameModel, slot: SlotKey) {
  return gameReducer(model, { type: "SELECT_SLOT", slot });
}

describe("loading", () => {
  it("starts loading, then plays a fresh game", () => {
    expect(initialModel().phase).toBe("loading");
    const model = loaded();
    expect(model).toMatchObject({ phase: "ready", puzzle, selectedSlot: "who" });
    expect(model.game).toEqual(newGame(10));
  });

  it("restores a saved game and selects the first unsolved slot", () => {
    const saved: SavedGame = { ...newGame(), solved: { who: "golden retriever" }, guesses: [{ slot: "who", guess: "dog", tier: "solved" }] };
    const model = loaded(saved);
    expect(model.game).toBe(saved);
    expect(model.selectedSlot).toBe("doing");
  });

  it("uses the budget it is given for a new game", () => {
    expect(loaded(null, 8).game.budget).toBe(8);
  });

  it("records load failures", () => {
    expect(gameReducer(initialModel(), { type: "LOAD_FAILED", reason: "not_found" })).toMatchObject({
      phase: "error",
      loadError: "not_found",
    });
  });
});

describe("guessing", () => {
  it("sends a guess, then records the result", () => {
    const pending = gameReducer(loaded(), { type: "SUBMIT_GUESS", guess: "  labrador " });
    expect(pending.pending).toEqual({ kind: "guess", slot: "who", guess: "labrador" });

    const done = gameReducer(pending, {
      type: "GUESS_RESULT",
      slot: "who",
      guess: "labrador",
      result: { tier: "hot", typo: false },
    });
    expect(done.pending).toBeNull();
    expect(done.game.guesses).toEqual([{ slot: "who", guess: "labrador", tier: "hot" }]);
    expect(done.notice).toEqual({ kind: "result", slot: "who", guess: "labrador", tier: "hot", typo: false });
    expect(guessesLeft(done.game)).toBe(9);
    expect(done.selectedSlot).toBe("who");
  });

  it("locks a solved slot with the canonical answer and moves to the next slot", () => {
    const model = guess(loaded(), "dog", solved("golden retriever"));
    expect(model.game.solved.who).toBe("golden retriever");
    expect(model.selectedSlot).toBe("doing");
  });

  it("falls back to the guess text if a solved result has no answer", () => {
    expect(guess(loaded(), "dog", { tier: "solved", typo: true }).game.solved.who).toBe("dog");
  });

  it("rejects a duplicate on the same slot without costing a guess", () => {
    const once = guess(loaded(), "cat", cold);
    const again = gameReducer(once, { type: "SUBMIT_GUESS", guess: "The CAT" });
    expect(again.pending).toBeNull();
    expect(again.notice).toEqual({ kind: "duplicate", slot: "who", guess: "The CAT" });
    expect(guessesLeft(again.game)).toBe(9);
  });

  it("treats a plural of an earlier guess as a duplicate", () => {
    const once = guess(loaded(), "labradors", { tier: "hot", typo: false });
    expect(checkGuess(once, "Labrador")).toBe("duplicate");
  });

  it("allows the same word on a different slot", () => {
    const model = select(guess(loaded(), "beach", cold), "where");
    expect(checkGuess(model, "beach")).toBe("ok");
  });

  it("flags invalid characters and ignores empty input", () => {
    const model = loaded();
    expect(gameReducer(model, { type: "SUBMIT_GUESS", guess: "dog!" }).notice).toEqual({ kind: "invalid" });
    expect(gameReducer(model, { type: "SUBMIT_GUESS", guess: "   " })).toBe(model);
    expect(checkGuess(model, "a".repeat(41))).toBe("invalid");
  });

  it("blocks guesses while a request is pending or on a solved slot", () => {
    const pending = gameReducer(loaded(), { type: "SUBMIT_GUESS", guess: "dog" });
    expect(gameReducer(pending, { type: "SUBMIT_GUESS", guess: "cat" })).toBe(pending);
    expect(gameReducer(pending, { type: "SELECT_SLOT", slot: "style" })).toBe(pending);

    const solvedWho = select(guess(loaded(), "dog", solved("golden retriever")), "who");
    expect(checkGuess(solvedWho, "puppy")).toBe("blocked");
  });

  it("ignores a result that nobody asked for", () => {
    const model = loaded();
    expect(gameReducer(model, { type: "GUESS_RESULT", slot: "who", guess: "x", result: cold })).toBe(model);
  });

  it("clears pending on failure without costing a guess", () => {
    const failed = run(loaded(), { type: "SUBMIT_GUESS", guess: "dog" }, { type: "GUESS_FAILED" });
    expect(failed.pending).toBeNull();
    expect(failed.notice).toEqual({ kind: "error" });
    expect(guessesLeft(failed.game)).toBe(10);
  });
});

describe("win and loss", () => {
  it("wins when all four slots are solved", () => {
    let model = loaded();
    model = guess(model, "dog", solved("golden retriever"));
    model = guess(model, "bike", solved("riding a bicycle"));
    model = guess(model, "beach", solved("beach"));
    expect(model.game.status).toBe("playing");
    model = guess(model, "watercolor", solved("watercolor"));
    expect(model.game.status).toBe("won");
    expect(checkGuess(model, "anything")).toBe("blocked");
  });

  it("loses when the budget runs out", () => {
    let model = loaded(null, 4);
    for (const word of ["cat", "cow", "fox"]) model = guess(model, word, cold);
    expect(model.game.status).toBe("playing");
    model = guess(model, "owl", cold);
    expect(model.game.status).toBe("lost");
    expect(guessesLeft(model.game)).toBe(0);
  });

  it("stores the reveal only once the game is over", () => {
    const reveal = {
      prompt: "p",
      answers: { who: "a", doing: "b", where: "c", style: "d" },
    };
    const playing = loaded();
    expect(gameReducer(playing, { type: "REVEAL", reveal })).toBe(playing);

    let lost = loaded(null, 1);
    lost = guess(lost, "cat", cold);
    expect(gameReducer(lost, { type: "REVEAL", reveal }).game.reveal).toEqual(reveal);
  });
});

describe("hint", () => {
  it("reveals a first letter, costs one guess and records when it was used", () => {
    let model = guess(loaded(), "cat", cold);
    model = select(model, "style");
    expect(canUseHint(model)).toBe(true);
    model = gameReducer(model, { type: "USE_HINT" });
    expect(model.pending).toEqual({ kind: "hint", slot: "style" });
    model = gameReducer(model, { type: "HINT_RESULT", slot: "style", letter: "w" });
    expect(model.game).toMatchObject({ hintUsed: "style", hintAt: 1, hintLetter: "w" });
    expect(guessesLeft(model.game)).toBe(8);
    expect(model.notice).toEqual({ kind: "hint", slot: "style", letter: "w" });
  });

  it("allows only one hint per puzzle", () => {
    const used = run(loaded(), { type: "USE_HINT" }, { type: "HINT_RESULT", slot: "who", letter: "g" });
    expect(canUseHint(used)).toBe(false);
    expect(gameReducer(used, { type: "USE_HINT" })).toBe(used);
  });

  it("will not spend the last guess or hint a solved slot", () => {
    let lastGuess = loaded(null, 2);
    lastGuess = guess(lastGuess, "cat", cold);
    expect(canUseHint(lastGuess)).toBe(false);

    const solvedWho = select(guess(loaded(), "dog", solved("golden retriever")), "who");
    expect(canUseHint(solvedWho)).toBe(false);
  });

  it("ignores a stray hint result and handles a failed hint", () => {
    const model = loaded();
    expect(gameReducer(model, { type: "HINT_RESULT", slot: "who", letter: "g" })).toBe(model);
    const failed = run(model, { type: "USE_HINT" }, { type: "HINT_FAILED" });
    expect(failed.pending).toBeNull();
    expect(failed.game.hintUsed).toBeNull();
  });
});

describe("helpers", () => {
  it("finds the next unsolved slot, wrapping around", () => {
    expect(nextUnsolvedSlot({}, "who")).toBe("doing");
    expect(nextUnsolvedSlot({ doing: "x", where: "y" }, "who")).toBe("style");
    expect(nextUnsolvedSlot({ doing: "x", where: "y", style: "z" }, "style")).toBe("who");
    expect(nextUnsolvedSlot({ who: "a", doing: "b", where: "c", style: "d" }, "where")).toBe("where");
  });

  it("changes slot and dismisses notices", () => {
    const model = gameReducer(loaded(), { type: "SUBMIT_GUESS", guess: "dog!" });
    expect(select(model, "where")).toMatchObject({ selectedSlot: "where", notice: null });
    expect(select(model, "who")).toBe(model);
    expect(gameReducer(model, { type: "DISMISS_NOTICE" }).notice).toBeNull();
    const clean = loaded();
    expect(gameReducer(clean, { type: "DISMISS_NOTICE" })).toBe(clean);
  });

  it("validates saved games from storage", () => {
    expect(savedGameSchema.safeParse(newGame()).success).toBe(true);
    expect(savedGameSchema.safeParse({ ...newGame(), status: "paused" }).success).toBe(false);
    expect(savedGameSchema.safeParse("garbage").success).toBe(false);
  });
});
