import "server-only";
import { BLOB_BASE_URL } from "@/lib/config";
import { sql } from "@/lib/db";
import { slotsSchema } from "@/lib/game/schemas";
import { SLOT_KEYS, type PublicPuzzle, type SlotKey, type Slots, type Tier } from "@/lib/game/types";

// Data access for the route handlers. Answers (slots, prompt) are only selected
// by the functions that need them, never by the public puzzle query.

const LOCALE = "en";

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
  return `${BLOB_BASE_URL}/${imagePath}`;
}

/** The public shape served by /api/puzzle and rendered into the page. Never carries answers. */
export function toPublicPuzzle(row: PublicPuzzleRow): PublicPuzzle {
  return {
    id: row.id,
    date: row.publish_date,
    imageUrl: publicImageUrl(row.image_path),
    difficulty: row.difficulty,
    slots: [...SLOT_KEYS],
  };
}

export async function getPublicPuzzle(date: string): Promise<PublicPuzzleRow | null> {
  try {
    const rows = await sql`
      SELECT id, publish_date, image_path, difficulty 
      FROM puzzles 
      WHERE publish_date = ${date} AND locale = ${LOCALE}
      LIMIT 1
    ` as unknown as PublicPuzzleRow[];
    return rows[0] ?? null;
  } catch (error) {
    throw new DbError("getPublicPuzzle", error instanceof Error ? error.message : String(error));
  }
}

export async function getPuzzleAnswers(date: string): Promise<PuzzleAnswers | null> {
  try {
    const rows = await sql`
      SELECT id, slots, prompt 
      FROM puzzles 
      WHERE publish_date = ${date} AND locale = ${LOCALE}
      LIMIT 1
    ` as unknown as { id: number; slots: unknown; prompt: string }[];
    if (rows.length === 0) return null;
    const data = rows[0];
    if (!data) return null;
    const slots = slotsSchema.safeParse(data.slots);
    if (!slots.success) throw new DbError("getPuzzleAnswers", `puzzle ${data.id} has malformed slots`);
    return { id: data.id, slots: slots.data, prompt: data.prompt };
  } catch (error) {
    if (error instanceof DbError) throw error;
    throw new DbError("getPuzzleAnswers", error instanceof Error ? error.message : String(error));
  }
}

export async function countRecentGuesses(ipHash: string, since: Date): Promise<number> {
  try {
    const rows = await sql`
      SELECT COUNT(*) as count 
      FROM guess_log 
      WHERE ip_hash = ${ipHash} AND created_at >= ${since.toISOString()}
    ` as unknown as { count: number }[];
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    throw new DbError("countRecentGuesses", error instanceof Error ? error.message : String(error));
  }
}

export async function insertGuessLog(row: GuessLogInsert): Promise<void> {
  try {
    await sql`
      INSERT INTO guess_log (puzzle_id, device_id, slot, guess_norm, tier, guess_index, ip_hash) 
      VALUES (${row.puzzle_id}, ${row.device_id}, ${row.slot}, ${row.guess_norm}, ${row.tier}, ${row.guess_index}, ${row.ip_hash})
    `;
  } catch (error) {
    throw new DbError("insertGuessLog", error instanceof Error ? error.message : String(error));
  }
}
