import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SLOT_KEYS } from "@/lib/game/types";
import { createFakeSupabase, type FakeSupabase } from "./helpers/fake-supabase";
import { puzzle1 } from "./fixtures";

const state = vi.hoisted(() => ({ fake: null as unknown as { client: unknown } }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: () => state.fake.client }));

const { GET: getPuzzle } = await import("@/app/api/puzzle/route");
const { POST: postGuess } = await import("@/app/api/guess/route");
const { POST: postHint } = await import("@/app/api/hint/route");
const { POST: postReveal } = await import("@/app/api/reveal/route");
const { hashIp } = await import("@/lib/api");
const { GUESS_RATE_LIMIT } = await import("@/lib/rate-limit");

const SUPABASE_URL = "https://test-project.supabase.co";
const DEVICE_ID = "7d444840-9dc0-41d2-9a5e-4c5a2f1b6a01";
const IP = "203.0.113.7";

let fake: FakeSupabase;

function puzzleRow() {
  return {
    id: puzzle1.id,
    publish_date: puzzle1.publishDate,
    image_path: "3f0c9a1e-5b7d-4c2a-9e8f-1a2b3c4d5e6f.webp",
    difficulty: puzzle1.difficulty,
    slots: puzzle1.slots,
    prompt: puzzle1.prompt,
    locale: "en",
  };
}

function get(query: string) {
  return getPuzzle(new Request(`http://localhost/api/puzzle${query}`));
}

function post(handler: (r: Request) => Promise<Response>, body: unknown, raw?: string) {
  return handler(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `${IP}, 10.0.0.1` },
      body: raw ?? JSON.stringify(body),
    }),
  );
}

function guess(overrides: Record<string, unknown> = {}) {
  return post(postGuess, {
    puzzleId: 1,
    date: "2026-10-11",
    slot: "who",
    guess: "dog",
    deviceId: DEVICE_ID,
    guessIndex: 1,
    ...overrides,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-11T10:00:00Z"));
  vi.stubEnv("SUPABASE_URL", SUPABASE_URL);
  vi.stubEnv("IP_HASH_SALT", "test-salt");
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  fake = createFakeSupabase({ puzzles: [puzzleRow()], guess_log: [] });
  state.fake = fake;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/puzzle", () => {
  it("returns public puzzle data", async () => {
    const res = await get("?date=2026-10-11");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: 1,
      date: "2026-10-11",
      imageUrl: `${SUPABASE_URL}/storage/v1/object/public/puzzles/3f0c9a1e-5b7d-4c2a-9e8f-1a2b3c4d5e6f.webp`,
      difficulty: 1,
      slots: ["who", "doing", "where", "style"],
    });
    expect(res.headers.get("cache-control")).toContain("s-maxage");
  });

  it("never contains answers, and never reads them", async () => {
    const text = await (await get("?date=2026-10-11")).text();
    const tierWords = SLOT_KEYS.flatMap((k) => {
      const s = puzzle1.slots[k];
      return [s.answer, ...s.accepted, ...s.hot, ...s.warm];
    }).filter((w) => w.length >= 3);
    for (const word of tierWords) expect(text.toLowerCase()).not.toContain(word.toLowerCase());
    expect(text).not.toContain("watercolor");

    const puzzleSelects = fake.selects.filter((s) => s.table === "puzzles");
    expect(puzzleSelects).toHaveLength(1);
    expect(puzzleSelects[0]?.columns).not.toContain("slots");
    expect(puzzleSelects[0]?.columns).not.toContain("prompt");
  });

  it("rejects a missing or malformed date", async () => {
    for (const query of ["", "?date=tomorrow", "?date=2026-10-4"]) {
      const res = await get(query);
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("bad_request");
    }
  });

  it("blocks future dates outside the window", async () => {
    const res = await get("?date=2026-10-13");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: { code: "date_out_of_window", message: expect.any(String) },
    });
  });

  it("returns 404 when no puzzle exists for the date", async () => {
    const res = await get("?date=2026-10-12");
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("not_found");
  });

  it("returns a generic 500 when the database fails", async () => {
    fake.failWith = "connection refused";
    const res = await get("?date=2026-10-11");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("internal");
    expect(JSON.stringify(body)).not.toContain("connection refused");
  });
});

describe("POST /api/guess", () => {
  it("solves 'dog' on WHO and returns the answer", async () => {
    const res = await guess();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tier: "solved", typo: false, answer: "golden retriever" });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("returns warm for 'wolf' without an answer", async () => {
    const res = await guess({ guess: "wolf" });
    expect(await res.json()).toEqual({ tier: "warm", typo: false });
  });

  it("logs the normalized guess with a hashed IP", async () => {
    await guess({ guess: "  The Labradors ", guessIndex: 3 });
    expect(fake.tables.guess_log).toHaveLength(1);
    const row = fake.tables.guess_log![0]!;
    expect(row).toMatchObject({
      puzzle_id: 1,
      device_id: DEVICE_ID,
      slot: "who",
      guess_norm: "labradors",
      tier: "hot",
      guess_index: 3,
    });
    expect(row.ip_hash).toBe(hashIp(IP));
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain(IP);
  });

  it("still answers when the guess_log insert fails", async () => {
    fake.failInsertsWith = "insert failed";
    const res = await guess();
    expect(res.status).toBe(200);
    expect((await res.json()).tier).toBe("solved");
  });

  it.each([
    ["punctuation", { guess: "dog!" }],
    ["too long", { guess: "a".repeat(41) }],
    ["unknown slot", { slot: "when" }],
    ["bad device id", { deviceId: "not-a-uuid" }],
    ["guess index out of range", { guessIndex: 13 }],
  ])("rejects bad input: %s", async (_label, overrides) => {
    const res = await guess(overrides);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("bad_request");
    expect(fake.tables.guess_log).toHaveLength(0);
  });

  it("rejects a body that is not JSON", async () => {
    const res = await post(postGuess, null, "{not json");
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toMatch(/JSON/);
  });

  it("blocks a future date", async () => {
    const res = await guess({ date: "2026-10-14" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("date_out_of_window");
  });

  it("rejects a puzzle id that does not match the date", async () => {
    const res = await guess({ puzzleId: 2 });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("puzzle_mismatch");
  });

  it(`rate limits after ${GUESS_RATE_LIMIT} guesses per minute per IP`, async () => {
    const ipHash = hashIp(IP);
    const recent = new Date("2026-10-11T09:59:30Z").toISOString();
    fake.tables.guess_log = Array.from({ length: GUESS_RATE_LIMIT }, () => ({ ip_hash: ipHash, created_at: recent }));

    const res = await guess();
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
    expect((await res.json()).error.code).toBe("rate_limited");
    expect(fake.tables.guess_log).toHaveLength(GUESS_RATE_LIMIT);
  });

  it("ignores guesses older than a minute and other IPs for the rate limit", async () => {
    const old = new Date("2026-10-11T09:58:00Z").toISOString();
    const recent = new Date("2026-10-11T09:59:30Z").toISOString();
    fake.tables.guess_log = [
      ...Array.from({ length: GUESS_RATE_LIMIT }, () => ({ ip_hash: hashIp(IP), created_at: old })),
      ...Array.from({ length: GUESS_RATE_LIMIT }, () => ({ ip_hash: hashIp("198.51.100.1"), created_at: recent })),
    ];
    expect((await guess()).status).toBe(200);
  });
});

describe("POST /api/hint", () => {
  it("returns the first letter of the slot answer", async () => {
    const res = await post(postHint, { puzzleId: 1, date: "2026-10-11", slot: "style", deviceId: DEVICE_ID });
    expect(await res.json()).toEqual({ firstLetter: "w" });
  });

  it("returns 404 for a date without a puzzle", async () => {
    const res = await post(postHint, { puzzleId: 1, date: "2026-10-10", slot: "who", deviceId: DEVICE_ID });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/reveal", () => {
  it("returns the display prompt and all answers", async () => {
    const res = await post(postReveal, { puzzleId: 1, date: "2026-10-11", deviceId: DEVICE_ID });
    expect(await res.json()).toEqual({
      prompt: "a golden retriever riding a bicycle on a beach at sunset, watercolor painting",
      answers: { who: "golden retriever", doing: "riding a bicycle", where: "beach", style: "watercolor" },
    });
  });

  it("rejects a missing device id", async () => {
    const res = await post(postReveal, { puzzleId: 1, date: "2026-10-11" });
    expect(res.status).toBe(400);
  });
});

describe("request logging", () => {
  it("writes one JSON line per request with no guess or IP", async () => {
    await guess({ guess: "labrador" });
    const lines = vi.mocked(console.info).mock.calls.map((c) => String(c[0]));
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]!);
    expect(entry).toMatchObject({ route: "guess", status: 200, puzzleId: 1 });
    expect(typeof entry.ms).toBe("number");
    expect(lines[0]).not.toContain("labrador");
    expect(lines[0]).not.toContain(IP);
  });

  it("includes the error code on failures", async () => {
    await get("?date=2026-10-13");
    const entry = JSON.parse(String(vi.mocked(console.info).mock.calls[0]?.[0]));
    expect(entry).toMatchObject({ route: "puzzle", status: 400, code: "date_out_of_window", puzzleId: null });
  });
});
