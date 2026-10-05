import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { visitorLocalDate } from "@/lib/visitor-date";

// 22:30 UTC on Oct 10: already Oct 11 in Israel, still Oct 10 in New York.
const lateUtc = new Date("2026-10-10T22:30:00Z");

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_DEV_TODAY", ""));
afterEach(() => vi.unstubAllEnvs());

describe("visitorLocalDate", () => {
  it("uses the visitor's timezone from Vercel's header", () => {
    expect(visitorLocalDate("Asia/Jerusalem", lateUtc)).toBe("2026-10-11");
    expect(visitorLocalDate("America/New_York", lateUtc)).toBe("2026-10-10");
    expect(visitorLocalDate("Pacific/Kiritimati", new Date("2026-10-10T09:59:00Z"))).toBe("2026-10-10");
  });

  it("falls back to the UTC date without a timezone or with an unknown one", () => {
    expect(visitorLocalDate(null, lateUtc)).toBe("2026-10-10");
    expect(visitorLocalDate("Mars/Olympus_Mons", lateUtc)).toBe("2026-10-10");
  });

  it("honors the pinned date outside Vercel production", () => {
    vi.stubEnv("NEXT_PUBLIC_DEV_TODAY", "2026-10-11");
    expect(visitorLocalDate("America/New_York", lateUtc)).toBe("2026-10-11");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(visitorLocalDate("America/New_York", lateUtc)).toBe("2026-10-10");
  });
});
