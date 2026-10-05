import { z } from "zod";
import {
  DATE_PATTERN,
  GUESS_PATTERN,
  SLOT_KEYS,
  TIERS,
  type GuessRequest,
  type HintRequest,
  type Puzzle,
  type RevealRequest,
  type Slot,
  type Slots,
} from "./types";

// Runtime validation for route handlers and content scripts (full zod; server side only).
// Each schema is typed against the interface in types.ts, so the two cannot drift apart.

export const slotKeySchema = z.enum(SLOT_KEYS);
export const tierSchema = z.enum(TIERS);

const tierWordSchema = z.string().min(1).max(40);

export const slotSchema: z.ZodType<Slot> = z.strictObject({
  answer: tierWordSchema,
  accepted: z.array(tierWordSchema).min(2).max(6),
  hot: z.array(tierWordSchema).min(3).max(8),
  warm: z.array(tierWordSchema).min(5).max(12),
});

export const slotsSchema: z.ZodType<Slots> = z.strictObject({
  who: slotSchema,
  doing: slotSchema,
  where: slotSchema,
  style: slotSchema,
});

export const puzzleSchema: z.ZodType<Puzzle> = z.strictObject({
  id: z.number().int().min(1),
  publishDate: z.string().regex(DATE_PATTERN),
  difficulty: z.number().int().min(1).max(5),
  locale: z.enum(["en", "he"]),
  prompt: z.string().min(10),
  slots: slotsSchema,
});

const dateStringSchema = z.string().regex(DATE_PATTERN);
const puzzleIdSchema = z.number().int().min(1);

export const puzzleQuerySchema = z.object({ date: dateStringSchema });

export const guessRequestSchema: z.ZodType<GuessRequest> = z.object({
  puzzleId: puzzleIdSchema,
  date: dateStringSchema,
  slot: slotKeySchema,
  guess: z.string().min(1).max(40).regex(GUESS_PATTERN),
  deviceId: z.uuid(),
  guessIndex: z.number().int().min(1).max(12),
});

export const hintRequestSchema: z.ZodType<HintRequest> = z.object({
  puzzleId: puzzleIdSchema,
  date: dateStringSchema,
  slot: slotKeySchema,
  deviceId: z.uuid(),
});

export const revealRequestSchema: z.ZodType<RevealRequest> = z.object({
  puzzleId: puzzleIdSchema,
  date: dateStringSchema,
  deviceId: z.uuid(),
});
