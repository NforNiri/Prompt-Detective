"use client";

import { useState, useSyncExternalStore } from "react";
import { getFlagValue, getTrackedEvents, subscribeEvents } from "@/lib/analytics";
import { getRecentApiCalls, subscribeApiCalls } from "@/lib/api-client";
import type { GameModel } from "@/lib/game/state";
import { en } from "@/lib/i18n/en";
import { getLogEntries, subscribe as subscribeLogs, type LogLevel } from "@/lib/logger";

// Shown with ?debug=1. Live logger buffer, analytics events, game state, flag value
// and the last API calls, so behavior can be checked on a real phone.

type Tab = "logs" | "events" | "state" | "api";

const NO_ITEMS: readonly never[] = [];
const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "text-muted",
  info: "text-sky-300",
  warn: "text-tier-warm",
  error: "text-red-400",
};

function time(ms: number): string {
  return new Date(ms).toISOString().slice(11, 23);
}

export function DebugPanel({ model, onResetToday }: { model: GameModel; onResetToday: () => void }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("logs");
  const logs = useSyncExternalStore(subscribeLogs, getLogEntries, () => NO_ITEMS);
  const events = useSyncExternalStore(subscribeEvents, getTrackedEvents, () => NO_ITEMS);
  const calls = useSyncExternalStore(subscribeApiCalls, getRecentApiCalls, () => NO_ITEMS);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={en.debug.open}
        className="fixed bottom-4 end-4 z-50 min-h-11 rounded-full bg-fuchsia-600 px-4 text-xs font-bold text-white shadow-lg"
      >
        {en.debug.title}
      </button>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "logs", label: en.debug.logs, count: logs.length },
    { id: "events", label: en.debug.events, count: events.length },
    { id: "state", label: en.debug.state },
    { id: "api", label: en.debug.api, count: calls.length },
  ];

  return (
    <section
      aria-label={en.debug.title}
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[55vh] flex-col border-t-2 border-fuchsia-600 bg-black/95 font-mono text-[11px] text-fg"
    >
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`min-h-9 rounded px-2 ${tab === t.id ? "bg-fuchsia-600 text-white" : "text-muted"}`}
          >
            {t.label}
            {t.count !== undefined ? ` ${t.count}` : ""}
          </button>
        ))}
        <span className="ms-auto flex items-center gap-1">
          <button type="button" onClick={onResetToday} className="min-h-9 rounded border border-border px-2">
            {en.debug.resetToday}
          </button>
          <button type="button" onClick={() => setOpen(false)} aria-label={en.debug.close} className="min-h-9 px-2 text-base">
            ×
          </button>
        </span>
      </div>
      <p className="border-b border-border px-2 py-1 text-tier-warm">{en.debug.flag(getFlagValue() ?? "default", model.game.budget)}</p>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {tab === "logs" && (
          <ol className="flex flex-col-reverse">
            {logs.map((e) => (
              <li key={e.id} className="border-b border-white/5 py-0.5">
                <span className="text-muted">{time(e.time)} </span>
                <span className={LEVEL_COLOR[e.level]}>{e.namespace}</span> {e.message}
                {e.data !== undefined && <span className="text-muted"> {JSON.stringify(e.data)}</span>}
              </li>
            ))}
          </ol>
        )}
        {tab === "events" &&
          (events.length === 0 ? (
            <p className="text-muted">{en.debug.empty}</p>
          ) : (
            <ol className="flex flex-col-reverse">
              {events.map((e) => (
                <li key={e.id} className="border-b border-white/5 py-0.5">
                  <span className="text-muted">{time(e.time)} </span>
                  <span className="text-tier-solved">{e.name}</span> <span className="text-muted">{JSON.stringify(e.props)}</span>
                </li>
              ))}
            </ol>
          ))}
        {tab === "state" && (
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify({ phase: model.phase, selectedSlot: model.selectedSlot, pending: model.pending, game: model.game }, null, 2)}
          </pre>
        )}
        {tab === "api" &&
          (calls.length === 0 ? (
            <p className="text-muted">{en.debug.empty}</p>
          ) : (
            <ol className="flex flex-col-reverse gap-1">
              {calls.map((c) => (
                <li key={c.id} className="border-b border-white/5 py-0.5">
                  <span className="text-muted">{time(c.time)} </span>
                  {c.method} {c.path}{" "}
                  <span className={c.status >= 200 && c.status < 300 ? "text-tier-solved" : "text-red-400"}>{c.status}</span>{" "}
                  <span className="text-tier-warm">{c.ms}ms</span>
                  <pre className="whitespace-pre-wrap break-all text-muted">{JSON.stringify(c.body)}</pre>
                </li>
              ))}
            </ol>
          ))}
      </div>
    </section>
  );
}
