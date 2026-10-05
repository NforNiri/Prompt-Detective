import type { PostHog } from "posthog-js";
import { DEFAULT_BUDGET } from "@/lib/game/state";
import type { AnalyticsEvents, EventName } from "@/lib/game/events";
import { createLogger, isDebugEnabled } from "@/lib/logger";
import { storageAvailable } from "@/lib/storage";

// The only way events leave the app. A typed wrapper around posthog-js.
//
// Performance: the SDK (~95 KB) loads when the browser is idle, after the puzzle
// image, because loading it during startup cost ~15 Lighthouse points. Events fired
// before then are queued. The guess-budget flag does not wait for the SDK: it comes
// from one small request to PostHog's flags endpoint, and the SDK is bootstrapped
// with that value. Without a key (tests, local runs) events are only logged.

const log = createLogger("analytics");

export const BUDGET_FLAG = "guess-budget";
export const FLAG_TIMEOUT_MS = 1500;
/** Upper bound on how long the SDK waits for an idle moment. */
export const SDK_IDLE_TIMEOUT_MS = 2500;
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
/** The variant this game actually used, or null when it fell back to the default budget. */
let flagValue: string | null = null;
const listeners = new Set<Listener>();

const RECENT_LIMIT = 50;

function config(): { key: string; host: string } | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  return key && host ? { key, host } : null;
}

function whenIdle(task: () => void): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(task, { timeout: SDK_IDLE_TIMEOUT_MS });
  } else {
    setTimeout(task, 1000);
  }
}

/** Schedules the SDK load for the next idle moment. Safe to call more than once. */
export function initAnalytics(distinctId: string): Promise<PostHog | null> {
  if (loading) return loading;
  const settings = config();
  if (!settings || typeof window === "undefined") {
    log.info("PostHog disabled (no key), events are logged only");
    loading = Promise.resolve(null);
    return loading;
  }
  loading = new Promise<void>((resolve) => whenIdle(resolve))
    .then(() => import("posthog-js"))
    .then(({ default: posthog }) => {
      posthog.init(settings.key, {
        api_host: settings.host,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        // No surveys, toolbar or recorder: don't pull extra scripts from PostHog's CDN.
        disable_surveys: true,
        disable_external_dependency_loading: true,
        // Project settings can switch these on remotely; they would try to load blocked scripts.
        // Web Vitals come from Vercel Analytics instead.
        capture_dead_clicks: false,
        capture_performance: false,
        person_profiles: "identified_only",
        persistence: storageAvailable() ? "localStorage" : "memory",
        // Same id as guess_log.device_id, so server and analytics data can be joined.
        bootstrap: {
          distinctID: distinctId,
          ...(flagValue ? { featureFlags: { [BUDGET_FLAG]: flagValue } } : {}),
        },
        loaded: (ph) => {
          if (isDebugEnabled()) ph.debug(true);
        },
      });
      client = posthog;
      // Record the experiment exposure only when this game used the flag's budget.
      if (flagValue) posthog.getFeatureFlag(BUDGET_FLAG);
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

/** Reads one flag from PostHog's flags endpoint (v2 response format) without the SDK. */
async function fetchFlag(distinctId: string): Promise<string | null> {
  const settings = config();
  if (!settings) return null;
  const response = await fetch(`${settings.host}/flags/?v=2`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: settings.key, distinct_id: distinctId }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { flags?: Record<string, { enabled?: boolean; variant?: string | null }> };
  const flag = data.flags?.[BUDGET_FLAG];
  return flag?.enabled && typeof flag.variant === "string" ? flag.variant : null;
}

/**
 * The budget for a new game. Falls back to 10 if the flag does not arrive within
 * 1.5 s, PostHog is off, or the variant is unknown.
 */
export async function resolveBudget(distinctId: string): Promise<number> {
  const variant = await withTimeout(
    fetchFlag(distinctId).catch(() => null),
    FLAG_TIMEOUT_MS,
  );
  const budget = variant ? BUDGET_BY_VARIANT[variant] : undefined;
  flagValue = budget ? variant : null;
  log.debug(`flag ${BUDGET_FLAG}`, { variant, budget: budget ?? DEFAULT_BUDGET, used: flagValue !== null });
  return budget ?? DEFAULT_BUDGET;
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
