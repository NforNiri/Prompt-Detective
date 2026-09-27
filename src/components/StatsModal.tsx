"use client";

import { useEffect, useRef } from "react";
import { DISTRIBUTION_MAX, DISTRIBUTION_MIN, displayStreak, winPercentage } from "@/lib/game/stats";
import type { Stats } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";

interface StatsModalProps {
  open: boolean;
  stats: Stats;
  todayPuzzleId: number | null;
  /** Guesses used in today's win, highlighted in the distribution. */
  todayGuesses: number | null;
  onClose: () => void;
}

export function StatsModal({ open, stats, todayPuzzleId, todayGuesses, onClose }: StatsModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const buckets = Array.from({ length: DISTRIBUTION_MAX - DISTRIBUTION_MIN + 1 }, (_, i) => DISTRIBUTION_MIN + i);
  const counts = buckets.map((n) => stats.distribution[n] ?? 0);
  const max = Math.max(1, ...counts);
  const tiles = [
    { label: en.stats.played, value: stats.played },
    { label: en.stats.winPct, value: winPercentage(stats) },
    { label: en.stats.currentStreak, value: todayPuzzleId === null ? stats.currentStreak : displayStreak(stats, todayPuzzleId) },
    { label: en.stats.maxStreak, value: stats.maxStreak },
  ];

  return (
    <dialog
      ref={ref}
      aria-labelledby="stats-title"
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-surface p-0 text-fg"
    >
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between">
          <h2 id="stats-title" className="font-typewriter text-2xl font-bold">
            {en.stats.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={en.stats.close}
            className="grid size-11 place-items-center rounded-full text-xl text-muted hover:text-fg"
          >
            ×
          </button>
        </div>

        <dl className="grid grid-cols-4 gap-2 text-center">
          {tiles.map((t) => (
            <div key={t.label} className="flex flex-col-reverse gap-1">
              <dt className="text-[11px] leading-tight text-muted">{t.label}</dt>
              <dd className="font-typewriter text-2xl font-bold tabular-nums">{t.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{en.stats.distribution}</h3>
          {stats.won === 0 ? (
            <p className="text-sm text-muted">{en.stats.distributionHint}</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {buckets.map((n, i) => {
                const count = counts[i]!;
                const today = n === todayGuesses;
                return (
                  <li key={n} className="flex items-center gap-2">
                    <span className="sr-only">{en.stats.distributionRow(n, count)}</span>
                    <span aria-hidden="true" className="w-4 text-end font-typewriter text-sm tabular-nums">
                      {n}
                    </span>
                    <span aria-hidden="true" className="flex-1">
                      <span
                        className={`block min-w-7 rounded px-2 py-0.5 text-end text-xs font-bold tabular-nums ${
                          today ? "bg-tier-solved text-ink" : "bg-surface-2 text-fg"
                        }`}
                        style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
                      >
                        {count}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </dialog>
  );
}
