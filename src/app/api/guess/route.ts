import { ApiError, assertDateInWindow, clientIp, handle, hashIp, jsonResponse, parseJsonBody, requirePuzzleAnswers } from "@/lib/api";
import { matchGuess } from "@/lib/game/match";
import { normalize } from "@/lib/game/normalize";
import { guessRequestSchema } from "@/lib/game/schemas";
import type { GuessResponse } from "@/lib/game/types";
import { createLogger } from "@/lib/logger";
import { insertGuessLog } from "@/lib/puzzle-repo";
import { isGuessRateLimited } from "@/lib/rate-limit";

const log = createLogger("api:guess");

// POST /api/guess -> the tier for one guess. The answer is returned only once the slot is solved.
export const POST = handle("guess", async (request, ctx) => {
  const body = await parseJsonBody(request, guessRequestSchema);
  ctx.puzzleId = body.puzzleId;
  assertDateInWindow(body.date);

  const ipHash = hashIp(clientIp(request));
  if (await isGuessRateLimited(ipHash)) {
    throw new ApiError(429, "rate_limited", "Too many guesses. Try again in a minute.");
  }

  const puzzle = await requirePuzzleAnswers(body.date, body.puzzleId);
  const slot = puzzle.slots[body.slot];
  const result = matchGuess(body.guess, slot);

  try {
    await insertGuessLog({
      puzzle_id: puzzle.id,
      device_id: body.deviceId,
      slot: body.slot,
      guess_norm: normalize(body.guess).slice(0, 40),
      tier: result.tier,
      guess_index: body.guessIndex,
      ip_hash: ipHash,
    });
  } catch (error) {
    // Telemetry must not cost the player their guess.
    log.warn("guess_log insert failed", { message: error instanceof Error ? error.message : String(error) });
  }

  const response: GuessResponse = result.tier === "solved" ? { ...result, answer: slot.answer } : result;
  return jsonResponse(response);
});
