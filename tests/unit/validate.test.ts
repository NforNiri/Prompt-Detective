import { describe, expect, it } from "vitest";
import { addDays, expectedDifficulty } from "@/lib/game/date";
import type { Puzzle } from "@/lib/game/types";
import { validatePuzzles, type PuzzleSource } from "@/lib/game/validate";
import { rawPuzzles } from "./fixtures";

function file(id: number): string {
  return `${String(id).padStart(4, "0")}.json`;
}

function base(): Puzzle[] {
  return structuredClone(rawPuzzles) as Puzzle[];
}

function sources(puzzles: unknown[]): PuzzleSource[] {
  return puzzles.map((data, i) => ({ source: file((data as Puzzle).id ?? i + 1), data }));
}

function run(puzzles: unknown[], options = {}) {
  const { issues, puzzles: valid } = validatePuzzles(sources(puzzles), options);
  const errors = issues.filter((i) => i.level === "error").map((i) => i.message);
  const warnings = issues.filter((i) => i.level === "warning").map((i) => i.message);
  return { errors, warnings, valid, issues };
}

/** A copy of puzzle 0001 moved to a later id/date, keeping the weekday difficulty right. */
function later(id: number): Puzzle {
  const p = base()[0]!;
  p.id = id;
  p.publishDate = addDays("2026-10-04", id - 1);
  p.difficulty = expectedDifficulty(p.publishDate);
  return p;
}

describe("validatePuzzles", () => {
  it("passes the real content fixtures with no errors", () => {
    const { errors, valid } = run(base());
    expect(errors).toEqual([]);
    expect(valid.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("reports schema errors against the file", () => {
    const { issues } = validatePuzzles([{ source: "0009.json", data: { id: "nine" } }]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ puzzleId: null, source: "0009.json", level: "error" });
    expect(issues[0]?.message).toMatch(/^schema:/);
  });

  it("checks the file name matches the id", () => {
    const { issues } = validatePuzzles([{ source: "0002.json", data: base()[0] }]);
    expect(issues.map((i) => i.message)).toContain("file name should be 0001.json");
  });

  it("requires the answer in accepted", () => {
    const puzzles = base();
    puzzles[0]!.slots.who.accepted = ["retriever", "dog", "puppy"];
    expect(run(puzzles).errors).toContain('who: answer "golden retriever" is not in accepted');
  });

  it("finds a word in two tiers, including through plurals", () => {
    const puzzles = base();
    puzzles[0]!.slots.who.hot.push("dogs");
    expect(run(puzzles).errors).toContain('who: "dogs" (hot) is also in accepted (as "dog")');
  });

  it("warns about duplicates inside a tier and long accepted entries", () => {
    const puzzles = base();
    puzzles[0]!.slots.where.warm.push("Water");
    puzzles[0]!.slots.doing.accepted.pop();
    puzzles[0]!.slots.doing.accepted.push("riding a bike on sand");
    const { warnings } = run(puzzles);
    expect(warnings).toContain('where.warm: "Water" is listed twice');
    expect(warnings).toContain('doing: accepted "riding a bike on sand" is longer than 3 words');
  });

  it("warns when typo tolerance would turn a near-miss into SOLVED", () => {
    const puzzles = base();
    puzzles[0]!.slots.who.warm.push("pupy");
    expect(run(puzzles).warnings).toContain('who: "pupy" is one typo from accepted "puppy", so it scores SOLVED');
  });

  it("catches duplicate ids, duplicate dates and date gaps", () => {
    const puzzles = base();
    const dupe = structuredClone(puzzles[1]!);
    puzzles.push(dupe);
    expect(run(puzzles).errors).toEqual(
      expect.arrayContaining(["duplicate id 2", "publishDate 2026-10-05 is also used by #2"]),
    );

    const gap = base();
    gap[2]!.publishDate = "2026-10-08";
    gap[2]!.difficulty = expectedDifficulty("2026-10-08");
    expect(run(gap).errors).toContain("date gap: #2 is 2026-10-05, #3 is 2026-10-08");
  });

  it("checks difficulty against the weekday", () => {
    const puzzles = base();
    puzzles[0]!.difficulty = 4;
    expect(run(puzzles).errors).toContain("difficulty 4 should be 1 for its weekday");
  });

  it("requires the no-text suffix and warns when an answer is not in the prompt", () => {
    const puzzles = base();
    puzzles[0]!.prompt = "a golden retriever riding a bicycle on a beach, watercolor";
    puzzles[1]!.slots.where.answer = "home kitchen";
    const { errors, warnings } = run(puzzles);
    expect(errors).toContain('prompt must end with "no text, no letters, no watermark"');
    expect(warnings).toContain('where: answer "home kitchen" does not appear in the prompt');
  });

  it("treats missing images as warnings, or errors when required", () => {
    const imageIds = new Set([1, 2]);
    expect(run(base(), { imageIds }).warnings).toContain("image 0003.png is missing");
    expect(run(base(), { imageIds, requireImages: true }).errors).toEqual(["image 0003.png is missing"]);
    expect(run(base()).warnings.some((w) => w.includes("image"))).toBe(false);
  });

  it("warns when WHO or STYLE repeats within 14 days, not after", () => {
    const within = run([...base(), later(4)]).warnings;
    expect(within).toContain('who "golden retriever" repeats #1 within 14 days');
    expect(within).toContain('style "watercolor" repeats #1 within 14 days');

    const spaced = [...base(), ...Array.from({ length: 11 }, (_, i) => later(i + 4))].map((p, i) => {
      if (i >= 3) {
        p.slots.who.answer = `who${i}`;
        p.slots.who.accepted = [`who${i}`, `whom${i}`];
        p.slots.style.answer = `style${i}`;
        p.slots.style.accepted = [`style${i}`, `styles${i}`];
        p.prompt = `a who${i} riding a bicycle on a beach, style${i}, no text, no letters, no watermark`;
      }
      return p;
    });
    spaced.push(later(15));
    expect(run(spaced).warnings.filter((w) => w.includes("repeats"))).toEqual([]);
  });
});
