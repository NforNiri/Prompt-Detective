import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// storage.ts caches whether localStorage works, so each test loads a fresh copy.
async function loadStorage() {
  vi.resetModules();
  return import("@/lib/storage");
}

function workingStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

function blockedStorage(): Storage {
  const fail = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("storage with localStorage available", () => {
  it("round-trips validated JSON", async () => {
    vi.stubGlobal("window", { localStorage: workingStorage() });
    const storage = await loadStorage();
    expect(storage.storageAvailable()).toBe(true);
    storage.writeJson("pd:test", { a: 1 });
    expect(storage.readJson("pd:test", z.object({ a: z.number() }))).toEqual({ a: 1 });
  });

  it("reads corrupt or outdated values as null", async () => {
    const local = workingStorage();
    vi.stubGlobal("window", { localStorage: local });
    const storage = await loadStorage();
    local.setItem("pd:bad-json", "{nope");
    local.setItem("pd:old-shape", JSON.stringify({ a: "one" }));
    expect(storage.readJson("pd:bad-json", z.object({ a: z.number() }))).toBeNull();
    expect(storage.readJson("pd:old-shape", z.object({ a: z.number() }))).toBeNull();
    expect(storage.readJson("pd:missing", z.object({ a: z.number() }))).toBeNull();
  });

  it("creates the device id once and keeps it", async () => {
    vi.stubGlobal("window", { localStorage: workingStorage() });
    const storage = await loadStorage();
    const id = storage.getDeviceId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(storage.getDeviceId()).toBe(id);
  });
});

describe("storage with localStorage blocked", () => {
  it("never throws and keeps values in memory for the session", async () => {
    vi.stubGlobal("window", { localStorage: blockedStorage() });
    const storage = await loadStorage();
    expect(storage.storageAvailable()).toBe(false);
    expect(() => storage.writeJson("pd:game:1", { a: 1 })).not.toThrow();
    expect(storage.readJson("pd:game:1", z.object({ a: z.number() }))).toEqual({ a: 1 });
    expect(storage.getDeviceId()).toBe(storage.getDeviceId());
  });

  it("falls back to memory when storage starts failing mid-session", async () => {
    const local = workingStorage();
    vi.stubGlobal("window", { localStorage: local });
    const storage = await loadStorage();
    expect(storage.storageAvailable()).toBe(true);
    local.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
    local.getItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
    expect(() => storage.writeString("pd:x", "1")).not.toThrow();
    expect(storage.readString("pd:x")).toBe("1");
  });

  it("handles a missing window (server render) without throwing", async () => {
    vi.stubGlobal("window", undefined);
    const storage = await loadStorage();
    expect(storage.storageAvailable()).toBe(false);
    expect(storage.readString("pd:x")).toBeNull();
  });
});
