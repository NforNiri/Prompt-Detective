// Shared types for the whole app. Plain TypeScript with no runtime dependency, so the
// browser bundle stays small. The zod schemas for route input and content files live
// in schemas.ts and are checked against these types at compile time.

export const SLOT_KEYS = ["who", "doing", "where", "style"] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

export const TIERS = ["solved", "hot", "warm", "cold"] as const;
export type Tier = (typeof TIERS)[number];

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Allowed characters in a guess. Keep in sync with the character class in normalize.ts. */
export const GUESS_PATTERN = /^[\p{L}\p{N}\s'-]+$/u;

export interface Slot {
  answer: string;
  accepted: string[];
  hot: string[];
  warm: string[];
}

export type Slots = Record<SlotKey, Slot>;

/** One puzzle as stored in content/puzzles/NNNN.json. Mirrors content/schema/puzzle.schema.json. */
export interface Puzzle {
  id: number;
  publishDate: string;
  difficulty: number;
  locale: "en" | "he";
  prompt: string;
  slots: Slots;
}

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

// ---- API contracts (docs/02-TECH-SPEC.md "API contracts") ----

export interface GuessRequest {
  puzzleId: number;
  date: string;
  slot: SlotKey;
  guess: string;
  deviceId: string;
  guessIndex: number;
}

export interface HintRequest {
  puzzleId: number;
  date: string;
  slot: SlotKey;
  deviceId: string;
}

export interface RevealRequest {
  puzzleId: number;
  date: string;
  deviceId: string;
}

export interface GuessResponse extends MatchResult {
  /** Present only when tier is "solved". */
  answer?: string;
}

export interface HintResponse {
  firstLetter: string;
}

export interface RevealResponse {
  prompt: string;
  answers: Record<SlotKey, string>;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
