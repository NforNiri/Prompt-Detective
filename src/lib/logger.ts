// Namespaced logger. Every entry is printed to the console and kept in a
// 200-entry ring buffer that the DebugPanel (?debug=1) renders live.
// Debug level is on only with ?debug=1 or in development.

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: number;
  time: number;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: unknown;
}

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export const LOG_BUFFER_SIZE = 200;

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "#8b93a1",
  info: "#5aa9ff",
  warn: "#f5a524",
  error: "#ff4d6d",
};

type Listener = (entries: readonly LogEntry[]) => void;

let entries: readonly LogEntry[] = [];
let nextId = 1;
let debugOverride: boolean | null = null;
const listeners = new Set<Listener>();

function detectDebug(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("debug") === "1";
  } catch {
    return false;
  }
}

export function isDebugEnabled(): boolean {
  return debugOverride ?? detectDebug();
}

/** Force debug on or off (tests, DebugPanel). Pass null to go back to auto-detection. */
export function setDebugEnabled(value: boolean | null): void {
  debugOverride = value;
}

/** Current buffer. The array is replaced on every write, so it is a stable snapshot for useSyncExternalStore. */
export function getLogEntries(): readonly LogEntry[] {
  return entries;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearLogs(): void {
  entries = [];
  for (const listener of listeners) listener(entries);
}

function print(entry: LogEntry): void {
  const time = new Date(entry.time).toISOString().slice(11, 23);
  const extra = entry.data === undefined ? [] : [entry.data];
  const method = console[entry.level];
  if (typeof window === "undefined") {
    method(`${time} ${entry.level.toUpperCase()} [${entry.namespace}] ${entry.message}`, ...extra);
    return;
  }
  method(
    `%c${time} %c${entry.namespace}%c ${entry.message}`,
    "color:#8b93a1",
    `color:${LEVEL_COLORS[entry.level]};font-weight:600`,
    "color:inherit",
    ...extra,
  );
}

function write(level: LogLevel, namespace: string, message: string, data: unknown): void {
  if (level === "debug" && !isDebugEnabled()) return;
  const entry: LogEntry = { id: nextId++, time: Date.now(), level, namespace, message };
  if (data !== undefined) entry.data = data;
  entries = [...entries.slice(-(LOG_BUFFER_SIZE - 1)), entry];
  print(entry);
  for (const listener of listeners) listener(entries);
}

export function createLogger(namespace: string): Logger {
  return {
    debug: (message, data) => write("debug", namespace, message, data),
    info: (message, data) => write("info", namespace, message, data),
    warn: (message, data) => write("warn", namespace, message, data),
    error: (message, data) => write("error", namespace, message, data),
  };
}
