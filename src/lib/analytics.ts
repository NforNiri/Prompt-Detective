import type { PostHog } from "posthog-js";
import { DEFAULT_BUDGET } from "@/lib/game/state";
import type { AnalyticsEvents, EventName } from "@/lib/game/events";
import { createLogger, isDebugEnabled } from "@/lib/logger";
import { storageAvailable } from "@/lib/storage";

// The only way events leave the app. A typed wrapper around posthog-js, which is
// loaded lazily so it stays off the critical path. Events fired before it loads
// are queued. Without a key (tests, local runs without .env) events are only logged.

const log = createLogger("analytics");

export const BUDGET_FLAG = "guess-budget";
export const FLAG_TIMEOUT_MS = 1500;
const BUDGET_BY_VARIANT: Record<string, number> = { control: 10, short: 8 };

export interface TrackedEvent {
  id: number;
  time: number;
  name: EventName;
  props: Record<string, unknown>;
}

type Listener = (events: readonly TrackedEvent[]) => void;

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
let queue: { name: EventName; props: Record<string, unknown> }[] = [];
let recent: readonly TrackedEvent[] = [];
let nextId = 1;
let flagValue: string | null = null;
const listeners = new Set<Listener>();

const RECENT_LIMIT = 50;

/** Starts loading PostHog. Safe to call more than once. */
export function initAnalytics(distinctId: string): Promise<PostHog | null> {
  if (loading) return loading;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host || typeof window === "undefined") {
    log.info("PostHog disabled (no key), events are logged only");
    loading = Promise.resolve(null);
    return loading;
  }
  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        // No surveys, toolbar or recorder: don't pull extra scripts from PostHog's CDN.
        disable_surveys: true,
        disable_external_dependency_loading: true,
        person_profiles: "identified_only",
        persistence: storageAvailable() ? "localStorage" : "memory",
        // Same id as guess_log.device_id, so server and analytics data can be joined.
        bootstrap: { distinctID: distinctId },
        loaded: (ph) => {
          if (isDebugEnabled()) ph.debug(true);
        },
      });
      client = posthog;
      for (const event of queue) posthog.capture(event.name, event.props);
      log.debug(`PostHog ready, flushed ${queue.length} queued events`);
      queue = [];
      return posthog;
    })
    .catch((error: unknown) => {
      log.warn("PostHog failed to load", { message: error instanceof Error ? error.message : String(error) });
      return null;
    });
  return loading;
}

export function track<K extends EventName>(name: K, props: AnalyticsEvents[K]): void {
  const payload = props as Record<string, unknown>;
  log.debug(`event ${name}`, payload);
  recent = [...recent.slice(-(RECENT_LIMIT - 1)), { id: nextId++, time: Date.now(), name, props: payload }];
  for (const listener of listeners) listener(recent);
  if (client) client.capture(name, payload);
  else queue.push({ name, props: payload });
}

/**
 * Reads the guess-budget flag once, for a new game. Falls back to 10 if flags
 * do not arrive within 1.5 s or PostHog is off.
 */
export async function resolveBudget(): Promise<number> {
  const posthog = await withTimeout(loading ?? Promise.resolve(null), FLAG_TIMEOUT_MS);
  if (!posthog) return fallback("no client");
  const variant = await withTimeout(
    new Promise<string | null>((resolve) => {
      const off = posthog.onFeatureFlags(() => {
        off();
        const value = posthog.getFeatureFlag(BUDGET_FLAG);
        resolve(typeof value === "string" ? value : null);
      });
    }),
    FLAG_TIMEOUT_MS,
  );
  flagValue = variant;
  const budget = (variant && BUDGET_BY_VARIANT[variant]) || DEFAULT_BUDGET;
  log.debug(`flag ${BUDGET_FLAG}`, { variant, budget });
  return budget;
}

function fallback(reason: string): number {
  log.debug(`flag ${BUDGET_FLAG} fallback`, { reason, budget: DEFAULT_BUDGET });
  return DEFAULT_BUDGET;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

export function getFlagValue(): string | null {
  return flagValue;
}

export function getTrackedEvents(): readonly TrackedEvent[] {
  return recent;
}

export function subscribeEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper: back to a fresh, unloaded state. */
export function resetAnalyticsForTests(): void {
  client = null;
  loading = null;
  queue = [];
  recent = [];
  flagValue = null;
  listeners.clear();
}
