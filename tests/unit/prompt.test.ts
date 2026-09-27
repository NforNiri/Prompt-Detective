import { afterEach, describe, expect, it, vi } from "vitest";
import { appNow } from "@/lib/clock";
import { localDateString } from "@/lib/game/date";
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

describe("appNow", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses NEXT_PUBLIC_DEV_TODAY in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEV_TODAY", "2026-10-04");
    const now = appNow();
    const real = new Date();
    expect(localDateString(now)).toBe("2026-10-04");
    expect(now.getHours()).toBe(real.getHours());
  });

  it("ignores NEXT_PUBLIC_DEV_TODAY in production and when malformed", () => {
    vi.stubEnv("NEXT_PUBLIC_DEV_TODAY", "2026-10-04");
    vi.stubEnv("NODE_ENV", "production");
    expect(localDateString(appNow())).toBe(localDateString(new Date()));
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEV_TODAY", "soon");
    expect(Math.abs(appNow().getTime() - Date.now())).toBeLessThan(1000);
  });
});
