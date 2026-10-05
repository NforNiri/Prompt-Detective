import { ApiError, assertDateInWindow, handle, jsonResponse, parseQuery } from "@/lib/api";
import { puzzleQuerySchema } from "@/lib/game/schemas";
import { getPublicPuzzle, toPublicPuzzle } from "@/lib/puzzle-repo";

// GET /api/puzzle?date=YYYY-MM-DD -> public puzzle data. Never includes answers.
export const GET = handle("puzzle", async (request, ctx) => {
  const { date } = parseQuery(request, puzzleQuerySchema);
  assertDateInWindow(date);

  const row = await getPublicPuzzle(date);
  if (!row) throw new ApiError(404, "not_found", "No puzzle for this date");
  ctx.puzzleId = row.id;

  return jsonResponse(toPublicPuzzle(row), { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } });
});
