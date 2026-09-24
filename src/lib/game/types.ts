import { z } from "zod";

// Shared types for the whole app. Runtime schemas live next to the types they
// produce so the app, the route handlers and the content scripts all agree.

export const SLOT_KEYS = ["who", "doing", "where", "style"] as const;
export const slotKeySchema = z.enum(SLOT_KEYS);
export type SlotKey = z.infer<typeof slotKeySchema>;

export const TIERS = ["solved", "hot", "warm", "cold"] as const;
export const tierSchema = z.enum(TIERS);
export type Tier = z.infer<typeof tierSchema>;

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Allowed characters in a guess. Keep in sync with the character class in normalize.ts. */
export const GUESS_PATTERN = /^[\p{L}\p{N}\s'-]+$/u;

const tierWordSchema = z.string().min(1).max(40);

export const slotSchema = z.strictObject({
  answer: tierWordSchema,
  accepted: z.array(tierWordSchema).min(2).max(6),
  hot: z.array(tierWordSchema).min(3).max(8),
  warm: z.array(tierWordSchema).min(5).max(12),
});
export type Slot = z.infer<typeof slotSchema>;

export const slotsSchema = z.strictObject({
  who: slotSchema,
  doing: slotSchema,
  where: slotSchema,
  style: slotSchema,
});
export type Slots = z.infer<typeof slotsSchema>;

/** One puzzle as stored in content/puzzles/NNNN.json. Mirrors content/schema/puzzle.schema.json. */
export const puzzleSchema = z.strictObject({
  id: z.number().int().min(1),
  publishDate: z.string().regex(DATE_PATTERN),
  difficulty: z.number().int().min(1).max(5),
  locale: z.enum(["en", "he"]),
  prompt: z.string().min(10),
  slots: slotsSchema,
});
export type Puzzle = z.infer<typeof puzzleSchema>;

/** GET /api/puzzle response. Never carries answers. */
export interface PublicPuzzle {
  id: number;
  date: string;
  imageUrl: string;
  difficulty: number;
  slots: SlotKey[];
}

export interface MatchResult {
  tier: Tier;
  typo: boolean;
}

export type GameStatus = "playing" | "won" | "lost";

export interface GuessRecord {
  slot: SlotKey;
  guess: string;
  tier: Tier;
}

/** Stored at localStorage `pd:game:{puzzleId}`. */
export interface GameState {
  guesses: GuessRecord[];
  hintUsed: SlotKey | null;
  /** How many guesses had been made when the hint was used. Places the hint square in the share grid. */
  hintAt: number | null;
  status: GameStatus;
  budget: number;
}

/** Stored at localStorage `pd:stats`. */
export interface Stats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedPuzzleId: number | null;
  /** Guesses used (including the hint) in won games -> count. */
  distribution: Record<number, number>;
}
