import type {
  ApiErrorBody,
  GuessRequest,
  GuessResponse,
  HintRequest,
  HintResponse,
  PublicPuzzle,
  RevealRequest,
  RevealResponse,
} from "@/lib/game/types";
import { createLogger } from "@/lib/logger";

// Typed browser client for the four route handlers. Logs every call with its timing.

const log = createLogger("api");

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    log.warn(`${method} ${path} network error`, { ms: Math.round(performance.now() - started) });
    throw new ApiClientError(0, "network", error instanceof Error ? error.message : "Network error");
  }
  const ms = Math.round(performance.now() - started);
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    log.warn(`${method} ${path} -> ${response.status}`, { ms, code: error?.code });
    throw new ApiClientError(response.status, error?.code ?? "unknown", error?.message ?? response.statusText);
  }
  log.debug(`${method} ${path} -> ${response.status}`, { ms });
  return data as T;
}

export const apiClient = {
  puzzle: (date: string) => request<PublicPuzzle>("GET", `/api/puzzle?date=${encodeURIComponent(date)}`),
  guess: (body: GuessRequest) => request<GuessResponse>("POST", "/api/guess", body),
  hint: (body: HintRequest) => request<HintResponse>("POST", "/api/hint", body),
  reveal: (body: RevealRequest) => request<RevealResponse>("POST", "/api/reveal", body),
};
