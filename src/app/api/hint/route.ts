import { assertDateInWindow, handle, jsonResponse, parseJsonBody, requirePuzzleAnswers } from "@/lib/api";
import { hintRequestSchema } from "@/lib/game/schemas";
import type { HintResponse } from "@/lib/game/types";

// POST /api/hint -> first letter of one slot's answer.
export const POST = handle("hint", async (request, ctx) => {
  const body = await parseJsonBody(request, hintRequestSchema);
  ctx.puzzleId = body.puzzleId;
  assertDateInWindow(body.date);

  const puzzle = await requirePuzzleAnswers(body.date, body.puzzleId);
  const [firstLetter = ""] = puzzle.slots[body.slot].answer;
  const response: HintResponse = { firstLetter };
  return jsonResponse(response);
});
