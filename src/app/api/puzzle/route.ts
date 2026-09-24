import { ApiError, assertDateInWindow, handle, jsonResponse, parseQuery } from "@/lib/api";
import { SLOT_KEYS, puzzleQuerySchema, type PublicPuzzle } from "@/lib/game/types";
import { getPublicPuzzle, publicImageUrl } from "@/lib/puzzle-repo";

// GET /api/puzzle?date=YYYY-MM-DD -> public puzzle data. Never includes answers.
export const GET = handle("puzzle", async (request, ctx) => {
  const { date } = parseQuery(request, puzzleQuerySchema);
  assertDateInWindow(date);

  const row = await getPublicPuzzle(date);
  if (!row) throw new ApiError(404, "not_found", "No puzzle for this date");
  ctx.puzzleId = row.id;

  const body: PublicPuzzle = {
    id: row.id,
    date: row.publish_date,
    imageUrl: publicImageUrl(row.image_path),
    difficulty: row.difficulty,
    slots: [...SLOT_KEYS],
  };
  return jsonResponse(body, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } });
});
