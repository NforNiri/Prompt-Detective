import "server-only";
import { slotsSchema, type SlotKey, type Slots, type Tier } from "@/lib/game/types";
import { getSupabaseAdmin } from "@/lib/supabase-server";

// Data access for the route handlers. Answers (slots, prompt) are only selected
// by the functions that need them, never by the public puzzle query.

const LOCALE = "en";
export const PUZZLE_BUCKET = "puzzles";

export interface PublicPuzzleRow {
  id: number;
  publish_date: string;
  image_path: string;
  difficulty: number;
}

export interface PuzzleAnswers {
  id: number;
  slots: Slots;
  prompt: string;
}

export interface GuessLogInsert {
  puzzle_id: number;
  device_id: string;
  slot: SlotKey;
  guess_norm: string;
  tier: Tier;
  guess_index: number;
  ip_hash: string;
}

export class DbError extends Error {
  constructor(operation: string, detail: string) {
    super(`${operation} failed: ${detail}`);
    this.name = "DbError";
  }
}

export function publicImageUrl(imagePath: string): string {
  const base = process.env.SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${PUZZLE_BUCKET}/${imagePath}`;
}

export async function getPublicPuzzle(date: string): Promise<PublicPuzzleRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("puzzles")
    .select("id, publish_date, image_path, difficulty")
    .eq("publish_date", date)
    .eq("locale", LOCALE)
    .maybeSingle<PublicPuzzleRow>();
  if (error) throw new DbError("getPublicPuzzle", error.message);
  return data;
}

export async function getPuzzleAnswers(date: string): Promise<PuzzleAnswers | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("puzzles")
    .select("id, slots, prompt")
    .eq("publish_date", date)
    .eq("locale", LOCALE)
    .maybeSingle<{ id: number; slots: unknown; prompt: string }>();
  if (error) throw new DbError("getPuzzleAnswers", error.message);
  if (!data) return null;
  const slots = slotsSchema.safeParse(data.slots);
  if (!slots.success) throw new DbError("getPuzzleAnswers", `puzzle ${data.id} has malformed slots`);
  return { id: data.id, slots: slots.data, prompt: data.prompt };
}

export async function countRecentGuesses(ipHash: string, since: Date): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from("guess_log")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since.toISOString());
  if (error) throw new DbError("countRecentGuesses", error.message);
  return count ?? 0;
}

export async function insertGuessLog(row: GuessLogInsert): Promise<void> {
  const { error } = await getSupabaseAdmin().from("guess_log").insert(row);
  if (error) throw new DbError("insertGuessLog", error.message);
}
