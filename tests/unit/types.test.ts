import { describe, expect, it } from "vitest";
import { GUESS_PATTERN, puzzleSchema } from "@/lib/game/types";
import { rawPuzzles } from "./fixtures";

describe("puzzleSchema", () => {
  it.each(rawPuzzles.map((p) => [p.id, p]))("accepts content puzzle %i", (_id, raw) => {
    expect(puzzleSchema.safeParse(raw).success).toBe(true);
  });

  it("rejects unknown keys", () => {
    expect(puzzleSchema.safeParse({ ...rawPuzzles[0], extra: true }).success).toBe(false);
  });

  it("rejects tier lists outside the size limits", () => {
    const raw = structuredClone(rawPuzzles[0]!);
    raw.slots.who.hot = ["wolf"];
    expect(puzzleSchema.safeParse(raw).success).toBe(false);
  });
});

describe("GUESS_PATTERN", () => {
  it.each(["fox", "3d render", "8-bit", "ukiyo-e", "o'neil", "שועל"])("allows %s", (guess) => {
    expect(GUESS_PATTERN.test(guess)).toBe(true);
  });

  it.each(["fox!", "<script>", "a,b", ""])("rejects %s", (guess) => {
    expect(GUESS_PATTERN.test(guess)).toBe(false);
  });
});
