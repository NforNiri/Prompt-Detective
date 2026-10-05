import { createLogger } from "@/lib/logger";

// Every localStorage access goes through here. When storage is blocked (private
// mode, disabled cookies) values live in memory for the session instead.

const log = createLogger("storage");
const memory = new Map<string, string>();
let available: boolean | null = null;

/** Anything with a zod-style safeParse: full zod, zod/mini or a hand-written check. */
export interface Validator<T> {
  safeParse(input: unknown): { success: true; data: T } | { success: false };
}

export const STORAGE_KEYS = {
  device: "pd:device",
  game: (puzzleId: number) => `pd:game:${puzzleId}`,
  stats: "pd:stats",
  howTo: "pd:howto",
} as const;

export function storageAvailable(): boolean {
  if (available !== null) return available;
  try {
    const probe = "pd:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
    log.warn("localStorage is unavailable, keeping progress in memory");
  }
  return available;
}

export function readString(key: string): string | null {
  if (storageAvailable()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // Fall through to memory.
    }
  }
  return memory.get(key) ?? null;
}

export function writeString(key: string, value: string): void {
  memory.set(key, value);
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    log.warn(`write failed for ${key}`, { message: error instanceof Error ? error.message : String(error) });
  }
}

export function removeKey(key: string): void {
  memory.delete(key);
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clean up if storage refuses.
  }
}

/** Parses and validates a stored JSON value. Corrupt or outdated values read as null. */
export function readJson<T>(key: string, schema: Validator<T>): T | null {
  const raw = readString(key);
  if (raw === null) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    log.warn(`ignoring invalid stored value for ${key}`);
  } catch {
    log.warn(`ignoring unparseable stored value for ${key}`);
  }
  return null;
}

export function writeJson(key: string, value: unknown): void {
  writeString(key, JSON.stringify(value));
}

export function getDeviceId(): string {
  const existing = readString(STORAGE_KEYS.device);
  if (existing) return existing;
  const id = crypto.randomUUID();
  writeString(STORAGE_KEYS.device, id);
  return id;
}
