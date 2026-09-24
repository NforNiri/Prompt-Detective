import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  expectedDifficulty,
  isDateInWindow,
  isValidDateString,
  localDateString,
  msUntilLocalMidnight,
  utcDateString,
  weekday,
} from "@/lib/game/date";
import { rawPuzzles } from "./fixtures";

describe("localDateString", () => {
  it("uses the local calendar date, zero padded", () => {
    expect(localDateString(new Date(2026, 9, 4, 0, 0, 1))).toBe("2026-10-04");
    expect(localDateString(new Date(2026, 9, 4, 23, 59, 59))).toBe("2026-10-04");
    expect(localDateString(new Date(2027, 0, 9, 12))).toBe("2027-01-09");
  });
});

describe("isDateInWindow", () => {
  const justBeforeMidnightUtc = new Date("2026-10-04T23:59:59Z");
  const atMidnightUtc = new Date("2026-10-05T00:00:00Z");

  it("allows UTC yesterday, today and tomorrow", () => {
    expect(isDateInWindow("2026-10-03", justBeforeMidnightUtc)).toBe(true);
    expect(isDateInWindow("2026-10-04", justBeforeMidnightUtc)).toBe(true);
    expect(isDateInWindow("2026-10-05", justBeforeMidnightUtc)).toBe(true);
  });

  it("blocks dates further out", () => {
    expect(isDateInWindow("2026-10-06", justBeforeMidnightUtc)).toBe(false);
    expect(isDateInWindow("2026-10-02", justBeforeMidnightUtc)).toBe(false);
  });

  it("shifts the window exactly at midnight UTC", () => {
    expect(isDateInWindow("2026-10-03", atMidnightUtc)).toBe(false);
    expect(isDateInWindow("2026-10-06", atMidnightUtc)).toBe(true);
  });

  it("rejects malformed dates", () => {
    expect(isDateInWindow("2026-10-4", atMidnightUtc)).toBe(false);
    expect(isDateInWindow("tomorrow", atMidnightUtc)).toBe(false);
  });
});

describe("date string helpers", () => {
  it("validates real calendar dates", () => {
    expect(isValidDateString("2028-02-29")).toBe(true);
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("26-10-04")).toBe(false);
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-10-04", -1)).toBe("2026-10-03");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-10-04", "2026-12-03")).toBe(60);
    expect(daysBetween("2026-10-05", "2026-10-04")).toBe(-1);
  });

  it("formats a UTC date", () => {
    expect(utcDateString(new Date("2026-10-04T23:30:00-05:00"))).toBe("2026-10-05");
  });
});

describe("msUntilLocalMidnight", () => {
  it("counts down to the next local midnight", () => {
    expect(msUntilLocalMidnight(new Date(2026, 9, 4, 23, 59, 0))).toBe(60_000);
    expect(msUntilLocalMidnight(new Date(2026, 9, 4, 12, 0, 0))).toBe(12 * 3_600_000);
  });
});

describe("weekday difficulty", () => {
  it("launch day, Sunday Oct 4 2026, is difficulty 1", () => {
    expect(weekday("2026-10-04")).toBe(0);
    expect(expectedDifficulty("2026-10-04")).toBe(1);
  });

  it("follows the Sun..Sat curve", () => {
    const week = Array.from({ length: 7 }, (_, i) => expectedDifficulty(addDays("2026-10-04", i)));
    expect(week).toEqual([1, 2, 2, 3, 3, 4, 5]);
  });

  it("matches the difficulty of every content puzzle", () => {
    for (const p of rawPuzzles) expect(expectedDifficulty(p.publishDate)).toBe(p.difficulty);
  });
});
