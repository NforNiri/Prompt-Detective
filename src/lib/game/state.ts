import * as z from "zod/mini";
import { variants } from "./normalize";
import { guessesUsed } from "./stats";
import {
  GUESS_PATTERN,
  SLOT_KEYS,
  TIERS,
  type GameState,
  type GameStatus,
  type GuessResponse,
  type PublicPuzzle,
  type RevealResponse,
  type SlotKey,
  type Tier,
} from "./types";

// The game as a reducer state machine: loading -> playing -> (won | lost).
// Pure: the useGame hook does the fetching and storage around it.

export const DEFAULT_BUDGET = 10;

/**
 * Stored at localStorage `pd:game:{puzzleId}`: the spec's GameState plus what the
 * screen needs after a reload (solved answers, the hint letter, the reveal).
 */
export interface SavedGame extends GameState {
  solved: Partial<Record<SlotKey, string>>;
  hintLetter: string | null;
  reveal: RevealResponse | null;
  /** Epoch ms when this puzzle was first opened. For duration_sec; null for games saved before Day 4. */
  startedAt: number | null;
}

// zod/mini keeps this off the critical path: it runs in the browser on every load.
const slotKey = z.enum(SLOT_KEYS);
const optionalText = z.optional(z.string());

const savedGameShape = z.object({
  guesses: z.array(z.object({ slot: slotKey, guess: z.string(), tier: z.enum(TIERS) })),
  hintUsed: z.nullable(slotKey),
  hintAt: z.nullable(z.number().check(z.int(), z.minimum(0))),
  status: z.enum(["playing", "won", "lost"]),
  budget: z.number().check(z.int(), z.minimum(1), z.maximum(12)),
  solved: z.object({ who: optionalText, doing: optionalText, where: optionalText, style: optionalText }),
  hintLetter: z.nullable(z.string()),
  reveal: z.nullable(
    z.object({
      prompt: z.string(),
      answers: z.object({ who: z.string(), doing: z.string(), where: z.string(), style: z.string() }),
    }),
  ),
  startedAt: z.optional(z.nullable(z.number())),
});

/** Validates a saved game read from storage. Games saved before Day 4 have no startedAt. */
export const savedGameSchema = {
  safeParse(input: unknown): { success: true; data: SavedGame } | { success: false } {
    const result = savedGameShape.safeParse(input);
    return result.success ? { success: true, data: { ...result.data, startedAt: result.data.startedAt ?? null } } : { success: false };
  },
};

export type Pending = { kind: "guess"; slot: SlotKey; guess: string } | { kind: "hint"; slot: SlotKey } | null;

/** One-off messages for the live region and the input. The UI turns them into strings. */
export type Notice =
  | { kind: "result"; slot: SlotKey; guess: string; tier: Tier; typo: boolean }
  | { kind: "hint"; slot: SlotKey; letter: string }
  | { kind: "duplicate"; slot: SlotKey; guess: string }
  | { kind: "invalid" }
  | { kind: "error" };

export type LoadError = "not_found" | "network";

export interface GameModel {
  phase: "loading" | "ready" | "error";
  loadError: LoadError | null;
  puzzle: PublicPuzzle | null;
  game: SavedGame;
  selectedSlot: SlotKey;
  pending: Pending;
  notice: Notice | null;
  /** First visit on this device: show how-to-play. */
  firstVisit: boolean;
  /** False when localStorage is blocked and progress lives in memory only. */
  storageOk: boolean;
}

export type GameAction =
  /** The puzzle arrived; show its image while the budget flag resolves. */
  | { type: "PUZZLE_FETCHED"; puzzle: PublicPuzzle }
  | {
      type: "LOADED";
      puzzle: PublicPuzzle;
      saved: SavedGame | null;
      budget: number;
      firstVisit: boolean;
      storageOk: boolean;
      /** Epoch ms, injected so the reducer stays pure. */
      now: number;
    }
  | { type: "LOAD_FAILED"; reason: LoadError }
  | { type: "SELECT_SLOT"; slot: SlotKey }
  | { type: "SUBMIT_GUESS"; guess: string }
  | { type: "GUESS_RESULT"; slot: SlotKey; guess: string; result: GuessResponse }
  | { type: "GUESS_FAILED" }
  | { type: "USE_HINT" }
  | { type: "HINT_RESULT"; slot: SlotKey; letter: string }
  | { type: "HINT_FAILED" }
  | { type: "REVEAL"; reveal: RevealResponse }
  | { type: "DISMISS_NOTICE" };

export function newGame(budget: number = DEFAULT_BUDGET, startedAt: number | null = null): SavedGame {
  return {
    guesses: [],
    hintUsed: null,
    hintAt: null,
    status: "playing",
    budget,
    solved: {},
    hintLetter: null,
    reveal: null,
    startedAt,
  };
}

export function initialModel(): GameModel {
  return {
    phase: "loading",
    loadError: null,
    puzzle: null,
    game: newGame(),
    selectedSlot: "who",
    pending: null,
    notice: null,
    firstVisit: false,
    storageOk: true,
  };
}

export function guessesLeft(game: SavedGame): number {
  return Math.max(0, game.budget - guessesUsed(game));
}

/** The next unsolved slot after `from`, wrapping around. Returns `from` when everything is solved. */
export function nextUnsolvedSlot(solved: SavedGame["solved"], from: SlotKey): SlotKey {
  const start = SLOT_KEYS.indexOf(from);
  for (let i = 1; i <= SLOT_KEYS.length; i++) {
    const slot = SLOT_KEYS[(start + i) % SLOT_KEYS.length]!;
    if (!solved[slot]) return slot;
  }
  return from;
}

function statusFor(game: SavedGame): GameStatus {
  if (SLOT_KEYS.every((k) => game.solved[k])) return "won";
  if (guessesLeft(game) <= 0) return "lost";
  return "playing";
}

export type GuessCheck = "ok" | "blocked" | "empty" | "invalid" | "duplicate";

/** Whether a guess may be sent. Duplicates on the same slot are rejected without costing a guess. */
export function checkGuess(model: GameModel, rawGuess: string): GuessCheck {
  const { game, selectedSlot } = model;
  if (model.phase !== "ready" || game.status !== "playing" || model.pending || game.solved[selectedSlot]) return "blocked";
  const guess = rawGuess.trim();
  if (!guess) return "empty";
  if (guess.length > 40 || !GUESS_PATTERN.test(guess)) return "invalid";
  // Same comparison as the matcher: "labradors" repeats "Labrador".
  const forms = variants(guess);
  const repeats = game.guesses.some((g) => g.slot === selectedSlot && [...variants(g.guess)].some((v) => forms.has(v)));
  if (repeats) return "duplicate";
  return "ok";
}

/** The hint needs a guess to spend and must not spend the last one. */
export function canUseHint(model: GameModel): boolean {
  const { game } = model;
  return (
    model.phase === "ready" &&
    game.status === "playing" &&
    !model.pending &&
    game.hintUsed === null &&
    !game.solved[model.selectedSlot] &&
    guessesLeft(game) > 1
  );
}

export function gameReducer(model: GameModel, action: GameAction): GameModel {
  switch (action.type) {
    case "PUZZLE_FETCHED":
      return model.phase === "loading" ? { ...model, puzzle: action.puzzle } : model;

    case "LOADED": {
      const game = action.saved ?? newGame(action.budget, action.now);
      const selectedSlot = game.solved.who ? nextUnsolvedSlot(game.solved, "who") : "who";
      return {
        ...model,
        phase: "ready",
        loadError: null,
        puzzle: action.puzzle,
        game,
        selectedSlot,
        firstVisit: action.firstVisit,
        storageOk: action.storageOk,
      };
    }

    case "LOAD_FAILED":
      return { ...model, phase: "error", loadError: action.reason };

    case "SELECT_SLOT":
      if (model.pending || model.selectedSlot === action.slot) return model;
      return { ...model, selectedSlot: action.slot, notice: null };

    case "SUBMIT_GUESS": {
      const check = checkGuess(model, action.guess);
      if (check === "blocked" || check === "empty") return model;
      if (check === "invalid") return { ...model, notice: { kind: "invalid" } };
      if (check === "duplicate") {
        return { ...model, notice: { kind: "duplicate", slot: model.selectedSlot, guess: action.guess.trim() } };
      }
      return { ...model, pending: { kind: "guess", slot: model.selectedSlot, guess: action.guess.trim() }, notice: null };
    }

    case "GUESS_RESULT": {
      if (model.pending?.kind !== "guess") return model;
      const { slot, guess, result } = action;
      const solved = result.tier === "solved" ? { ...model.game.solved, [slot]: result.answer ?? guess } : model.game.solved;
      const next: SavedGame = { ...model.game, guesses: [...model.game.guesses, { slot, guess, tier: result.tier }], solved };
      const game = { ...next, status: statusFor(next) };
      return {
        ...model,
        game,
        pending: null,
        selectedSlot: result.tier === "solved" ? nextUnsolvedSlot(solved, slot) : model.selectedSlot,
        notice: { kind: "result", slot, guess, tier: result.tier, typo: result.typo },
      };
    }

    case "GUESS_FAILED":
    case "HINT_FAILED":
      return { ...model, pending: null, notice: { kind: "error" } };

    case "USE_HINT":
      if (!canUseHint(model)) return model;
      return { ...model, pending: { kind: "hint", slot: model.selectedSlot }, notice: null };

    case "HINT_RESULT": {
      if (model.pending?.kind !== "hint") return model;
      const next: SavedGame = {
        ...model.game,
        hintUsed: action.slot,
        hintAt: model.game.guesses.length,
        hintLetter: action.letter,
      };
      return {
        ...model,
        game: { ...next, status: statusFor(next) },
        pending: null,
        notice: { kind: "hint", slot: action.slot, letter: action.letter },
      };
    }

    case "REVEAL":
      if (model.game.status === "playing") return model;
      return { ...model, game: { ...model.game, reveal: action.reveal } };

    case "DISMISS_NOTICE":
      return model.notice ? { ...model, notice: null } : model;
  }
}
