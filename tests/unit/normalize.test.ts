import { describe, expect, it } from "vitest";
import { normalize, singularize, variants } from "@/lib/game/normalize";

describe("normalize", () => {
  it("lowercases and trims", () => {
    expect(normalize("  FoX  ")).toBe("fox");
  });

  it("drops one leading article, only as a whole word", () => {
    expect(normalize("The Fox")).toBe("fox");
    expect(normalize("an apple")).toBe("apple");
    expect(normalize("a golden retriever")).toBe("golden retriever");
    expect(normalize("theater")).toBe("theater");
    expect(normalize("riding a bicycle")).toBe("riding a bicycle");
    expect(normalize("the")).toBe("the");
  });

  it("strips punctuation but keeps apostrophes and hyphens", () => {
    expect(normalize("fox!!!")).toBe("fox");
    expect(normalize("ukiyo-e.")).toBe("ukiyo-e");
    expect(normalize("o'neil")).toBe("o'neil");
    expect(normalize("dog’s")).toBe("dog's");
  });

  it("collapses whitespace left behind by stripped characters", () => {
    expect(normalize("golden   ,  retriever")).toBe("golden retriever");
    expect(normalize("! the dog")).toBe("dog");
  });

  it("applies NFKC", () => {
    expect(normalize("ｆｏｘ")).toBe("fox");
    expect(normalize("ﬁsh")).toBe("fish");
    expect(normalize("cafe\u0301")).toBe("café");
  });

  it("passes Hebrew letters through", () => {
    expect(normalize("שועל")).toBe("שועל");
    expect(normalize("  שועל   ים ")).toBe("שועל ים");
  });
});

describe("singularize", () => {
  it.each([
    ["foxes", "fox"],
    ["cities", "city"],
    ["dogs", "dog"],
    ["horses", "horse"],
    ["churches", "church"],
    ["bushes", "bush"],
    ["classes", "class"],
    ["pies", "pie"],
    ["playing cards", "playing card"],
  ])("%s -> %s", (input, expected) => {
    expect(singularize(input)).toBe(expected);
  });

  it.each(["glasses", "chess", "bus", "tennis", "gas", "news", "fox", ""])("leaves %s unchanged", (word) => {
    expect(singularize(word)).toBe(word);
  });
});

describe("variants", () => {
  it("returns the normalized form and its singular", () => {
    expect(variants("The Foxes")).toEqual(new Set(["foxes", "fox"]));
    expect(variants("fox")).toEqual(new Set(["fox"]));
  });
});
