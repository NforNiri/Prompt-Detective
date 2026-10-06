import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { variants } from "@/lib/game/normalize";
import { puzzleSchema } from "@/lib/game/schemas";
import { SLOT_KEYS } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";

const PUZZLE_DIR = "content/puzzles";

describe("how-to example", () => {
  it("uses no word from any puzzle's lists, so it spoils nothing", () => {
    const listed = new Map<string, string>();
    for (const file of readdirSync(PUZZLE_DIR).filter((f) => f.endsWith(".json"))) {
      const puzzle = puzzleSchema.parse(JSON.parse(readFileSync(join(PUZZLE_DIR, file), "utf8")));
      for (const slot of SLOT_KEYS) {
        const { accepted, hot, warm } = puzzle.slots[slot];
        for (const word of [...accepted, ...hot, ...warm]) {
          for (const v of variants(word)) listed.set(v, `#${puzzle.id} ${slot}`);
        }
      }
    }
    const clashes = en.howTo.example
      .split(" · ")
      .flatMap((word) => [...variants(word)].filter((v) => listed.has(v)).map((v) => `${word} (${listed.get(v)})`));
    expect(clashes).toEqual([]);
  });
});
