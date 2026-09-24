import { assertDateInWindow, handle, jsonResponse, parseJsonBody, requirePuzzleAnswers } from "@/lib/api";
import { displayPrompt } from "@/lib/game/prompt";
import { revealRequestSchema, type RevealResponse } from "@/lib/game/types";

// POST /api/reveal -> the full prompt and answers, called when the game ends.
export const POST = handle("reveal", async (request, ctx) => {
  const body = await parseJsonBody(request, revealRequestSchema);
  ctx.puzzleId = body.puzzleId;
  assertDateInWindow(body.date);

  const { slots, prompt } = await requirePuzzleAnswers(body.date, body.puzzleId);
  const response: RevealResponse = {
    prompt: displayPrompt(prompt),
    answers: {
      who: slots.who.answer,
      doing: slots.doing.answer,
      where: slots.where.answer,
      style: slots.style.answer,
    },
  };
  return jsonResponse(response);
});
