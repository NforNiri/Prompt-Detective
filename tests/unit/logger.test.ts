import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LOG_BUFFER_SIZE,
  clearLogs,
  createLogger,
  getLogEntries,
  isDebugEnabled,
  setDebugEnabled,
  subscribe,
} from "@/lib/logger";

beforeEach(() => {
  clearLogs();
  for (const level of ["debug", "info", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation(() => {});
  }
});

afterEach(() => {
  setDebugEnabled(null);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("records namespaced entries and prints them", () => {
    createLogger("game").info("state change", { from: "loading", to: "playing" });
    const [entry] = getLogEntries();
    expect(entry).toMatchObject({ level: "info", namespace: "game", message: "state change" });
    expect(entry?.data).toEqual({ from: "loading", to: "playing" });
    expect(console.info).toHaveBeenCalledOnce();
    expect(vi.mocked(console.info).mock.calls[0]?.[0]).toContain("[game] state change");
  });

  it("drops debug entries unless debug is enabled", () => {
    const log = createLogger("api");
    setDebugEnabled(false);
    log.debug("hidden");
    expect(getLogEntries()).toHaveLength(0);
    setDebugEnabled(true);
    log.debug("shown");
    expect(getLogEntries().map((e) => e.message)).toEqual(["shown"]);
    expect(console.debug).toHaveBeenCalledOnce();
  });

  it("auto-detects debug from NODE_ENV when not overridden", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDebugEnabled()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(isDebugEnabled()).toBe(false);
  });

  it(`keeps only the last ${LOG_BUFFER_SIZE} entries`, () => {
    const log = createLogger("spam");
    for (let i = 0; i < LOG_BUFFER_SIZE + 25; i++) log.warn(`entry ${i}`);
    const entries = getLogEntries();
    expect(entries).toHaveLength(LOG_BUFFER_SIZE);
    expect(entries[0]?.message).toBe("entry 25");
    expect(entries.at(-1)?.message).toBe(`entry ${LOG_BUFFER_SIZE + 24}`);
  });

  it("notifies subscribers with a new snapshot until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    const before = getLogEntries();
    createLogger("ui").error("boom");
    expect(listener).toHaveBeenCalledWith(getLogEntries());
    expect(getLogEntries()).not.toBe(before);
    unsubscribe();
    createLogger("ui").error("again");
    expect(listener).toHaveBeenCalledOnce();
  });
});
