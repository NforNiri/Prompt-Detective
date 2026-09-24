import { afterEach, describe, expect, it, vi } from "vitest";
import { serverNow } from "@/lib/clock";
import { displayPrompt } from "@/lib/game/prompt";

describe("displayPrompt", () => {
  it("strips the generation-only suffix and trailing comma", () => {
    expect(displayPrompt("a fox playing chess on a frozen lake, ukiyo-e, no text, no letters, no watermark")).toBe(
      "a fox playing chess on a frozen lake, ukiyo-e",
    );
  });

  it("leaves a prompt without the suffix alone, apart from trimming", () => {
    expect(displayPrompt("  a fox playing chess, ukiyo-e ")).toBe("a fox playing chess, ukiyo-e");
  });
});

describe("serverNow", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses DEV_TODAY in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_TODAY", "2026-10-04");
    expect(serverNow().toISOString()).toBe("2026-10-04T12:00:00.000Z");
  });

  it("ignores DEV_TODAY in production and when malformed", () => {
    vi.stubEnv("DEV_TODAY", "2026-10-04");
    vi.stubEnv("NODE_ENV", "production");
    expect(serverNow().toISOString().slice(0, 10)).not.toBe("2026-10-04");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_TODAY", "soon");
    expect(Math.abs(serverNow().getTime() - Date.now())).toBeLessThan(1000);
  });
});
