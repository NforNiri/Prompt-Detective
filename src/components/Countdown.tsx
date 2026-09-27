"use client";

import { useEffect, useState } from "react";
import { appNow } from "@/lib/clock";
import { msUntilLocalMidnight } from "@/lib/game/date";
import { en } from "@/lib/i18n/en";

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Time until the next puzzle at local midnight. */
export function Countdown() {
  const [ms, setMs] = useState(() => msUntilLocalMidnight(appNow()));

  useEffect(() => {
    const timer = setInterval(() => setMs(msUntilLocalMidnight(appNow())), 1000);
    return () => clearInterval(timer);
  }, []);

  const ready = ms <= 1000;
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">{en.end.nextCase}</p>
      {ready ? (
        <p className="flex items-center gap-3">
          {en.end.newCaseReady}
          <button type="button" onClick={() => window.location.reload()} className="min-h-11 font-semibold text-accent underline">
            {en.end.openNewCase}
          </button>
        </p>
      ) : (
        <p className="font-typewriter text-3xl font-bold tabular-nums" role="timer" aria-live="off">
          {format(ms)}
        </p>
      )}
    </div>
  );
}
