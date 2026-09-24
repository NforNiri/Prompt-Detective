import "server-only";
import { createHash } from "node:crypto";
import type { z } from "zod";
import { serverNow } from "@/lib/clock";
import { isDateInWindow } from "@/lib/game/date";
import type { ApiErrorBody } from "@/lib/game/types";
import { createLogger, logRequest } from "@/lib/logger";
import { getPuzzleAnswers, type PuzzleAnswers } from "@/lib/puzzle-repo";

const log = createLogger("api");

export type ApiErrorCode =
  | "bad_request"
  | "date_out_of_window"
  | "not_found"
  | "puzzle_mismatch"
  | "rate_limited"
  | "internal";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const NO_STORE = { "Cache-Control": "no-store" };

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, { ...init, headers: { ...NO_STORE, ...init.headers } });
}

export function errorResponse(error: ApiError): Response {
  const body: ApiErrorBody = { error: { code: error.code, message: error.message } };
  const headers: Record<string, string> = error.status === 429 ? { "Retry-After": "60" } : {};
  return jsonResponse(body, { status: error.status, headers });
}

function describeIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "bad_request", "Body must be valid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ApiError(400, "bad_request", describeIssues(parsed.error));
  return parsed.data;
}

export function parseQuery<T>(request: Request, schema: z.ZodType<T>): T {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw new ApiError(400, "bad_request", describeIssues(parsed.error));
  return parsed.data;
}

export function assertDateInWindow(date: string): void {
  if (!isDateInWindow(date, serverNow())) {
    throw new ApiError(400, "date_out_of_window", "Date must be within one day of today (UTC)");
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Salted SHA-256. Raw IPs are never stored or logged. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT must be set");
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export interface RequestContext {
  puzzleId: number | null;
}

/** Wraps a route handler: maps errors to `{ error: { code, message } }` and logs one JSON line per request. */
export function handle(route: string, handler: (request: Request, ctx: RequestContext) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const started = performance.now();
    const ctx: RequestContext = { puzzleId: null };
    let response: Response;
    let code: string | undefined;
    try {
      response = await handler(request, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        code = error.code;
        response = errorResponse(error);
      } else {
        code = "internal";
        log.error(`${route}: unhandled error`, { message: error instanceof Error ? error.message : String(error) });
        response = errorResponse(new ApiError(500, "internal", "Something went wrong"));
      }
    }
    logRequest({
      route,
      status: response.status,
      ms: Math.round(performance.now() - started),
      puzzleId: ctx.puzzleId,
      ...(code ? { code } : {}),
    });
    return response;
  };
}

/** Loads a puzzle's answers for a date and checks the client's puzzle id matches it. */
export async function requirePuzzleAnswers(date: string, puzzleId: number): Promise<PuzzleAnswers> {
  const puzzle = await getPuzzleAnswers(date);
  if (!puzzle) throw new ApiError(404, "not_found", "No puzzle for this date");
  if (puzzle.id !== puzzleId) throw new ApiError(400, "puzzle_mismatch", "puzzleId does not match the date");
  return puzzle;
}
