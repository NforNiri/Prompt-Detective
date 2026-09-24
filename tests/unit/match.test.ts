import { describe, expect, it } from "vitest";
import { compileSlot, compileSlots, levenshtein, matchGuess } from "@/lib/game/match";
import type { Slot } from "@/lib/game/types";
import { puzzle1, puzzle2 } from "./fixtures";

const { who, doing, where, style } = puzzle1.slots;

describe("matchGuess on puzzle 0001", () => {
  it("solves plural and article variants of accepted answers", () => {
    expect(matchGuess("Dogs", who)).toEqual({ tier: "solved", typo: false });
    expect(matchGuess("the Golden Retriever!", who)).toEqual({ tier: "solved", typo: false });
    expect(matchGuess("Bikes", doing)).toEqual({ tier: "solved", typo: false });
    expect(matchGuess("watercolour", style)).toEqual({ tier: "solved", typo: false });
  });

  it("returns each tier", () => {
    expect(matchGuess("labradors", who).tier).toBe("hot");
    expect(matchGuess("wolf", who).tier).toBe("warm");
    expect(matchGuess("cat", who).tier).toBe("cold");
    expect(matchGuess("sand", where).tier).toBe("hot");
    expect(matchGuess("waves", where).tier).toBe("warm");
  });

  it("tolerates one typo on accepted words of 5+ letters", () => {
    expect(matchGuess("retriver", who)).toEqual({ tier: "solved", typo: true });
    expect(matchGuess("pupy", who)).toEqual({ tier: "solved", typo: true });
    expect(matchGuess("water colour", style)).toEqual({ tier: "solved", typo: true });
  });

  it("has no typo tolerance on short accepted words or at distance 2", () => {
    expect(matchGuess("dig", who)).toEqual({ tier: "cold", typo: false });
    expect(matchGuess("retreiver", who).tier).toBe("cold");
  });

  it("does not let typo tolerance swallow a short warm word", () => {
    expect(matchGuess("pup", who)).toEqual({ tier: "warm", typo: false });
  });

  it("treats empty or punctuation-only guesses as cold", () => {
    expect(matchGuess("!!!", who)).toEqual({ tier: "cold", typo: false });
    expect(matchGuess("", who)).toEqual({ tier: "cold", typo: false });
  });
});

describe("answers with digits", () => {
  it("solves puzzle 0002 STYLE with 3d", () => {
    expect(matchGuess("3D render", puzzle2.slots.style)).toEqual({ tier: "solved", typo: false });
    expect(matchGuess("3d", puzzle2.slots.style).tier).toBe("solved");
    expect(matchGuess("3d animation", puzzle2.slots.style).tier).toBe("solved");
  });
});

describe("tier precedence", () => {
  const slot: Slot = {
    answer: "lantern",
    accepted: ["lantern", "lamp"],
    hot: ["lamp", "torch", "lanterns", "candle"],
    warm: ["torch", "light", "fire", "glow", "night"],
  };

  it("accepted beats hot", () => {
    expect(matchGuess("lamp", slot).tier).toBe("solved");
  });

  it("hot beats warm", () => {
    expect(matchGuess("torch", slot).tier).toBe("hot");
  });

  it("a typo of an accepted word beats hot", () => {
    const typoInHot: Slot = { ...slot, hot: ["lanterm", "torch", "candle"] };
    expect(matchGuess("lanterm", typoInHot)).toEqual({ tier: "solved", typo: true });
  });

  it("counts the answer as accepted even if the list omits it", () => {
    expect(matchGuess("lantern", { ...slot, accepted: ["lamp", "light source"] }).tier).toBe("solved");
  });
});

describe("compiled slots", () => {
  it("gives the same result as the raw slot", () => {
    const compiled = compileSlots(puzzle1.slots);
    for (const guess of ["dogs", "wolf", "labrador", "retriver", "cat"]) {
      expect(matchGuess(guess, compiled.who)).toEqual(matchGuess(guess, who));
    }
  });

  it("precomputes variants and typo targets", () => {
    const compiled = compileSlot(who);
    expect(compiled.accepted.has("dog")).toBe(true);
    expect(compiled.typoTargets).toContain("retriever");
    expect(compiled.typoTargets).not.toContain("dog");
  });
});

describe("levenshtein", () => {
  it.each([
    ["kitten", "sitting", 3],
    ["", "abc", 3],
    ["abc", "", 3],
    ["abc", "abc", 0],
    ["retriever", "retreiver", 2],
    ["שועל", "שועלה", 1],
  ])("%s / %s = %i", (a, b, d) => {
    expect(levenshtein(a, b)).toBe(d);
  });
});
