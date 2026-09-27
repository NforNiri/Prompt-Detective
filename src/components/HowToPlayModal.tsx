"use client";

import { useEffect, useRef, useState } from "react";
import { SLOT_KEYS } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";
import { TierBadge } from "./TierBadge";

interface HowToPlayModalProps {
  open: boolean;
  onClose: (panelReached: number, skipped: boolean) => void;
}

const EXAMPLE_WORDS = en.howTo.example.split(" · ");

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const panels = en.howTo.panels;
  const last = step === panels.length - 1;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close(skipped: boolean) {
    const reached = step + 1;
    setStep(0);
    onClose(reached, skipped);
  }

  const panel = panels[step]!;
  return (
    <dialog
      ref={ref}
      aria-labelledby="howto-title"
      onCancel={(e) => {
        e.preventDefault();
        close(true);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-surface p-0 text-fg"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {en.howTo.title} · {en.howTo.step(step + 1, panels.length)}
          </p>
          {!last && (
            <button type="button" onClick={() => close(true)} className="min-h-11 px-2 text-sm text-muted hover:text-fg">
              {en.howTo.skip}
            </button>
          )}
        </div>

        <h2 id="howto-title" className="font-typewriter text-2xl font-bold">
          {panel.title}
        </h2>
        <p className="text-fg/90">{panel.body}</p>

        {step === 0 && (
          <div className="grid grid-cols-2 gap-2" aria-hidden="true">
            {SLOT_KEYS.map((slot, i) => (
              <div key={slot} className="rounded-md border border-border bg-bg p-2">
                <p className="text-[10px] font-bold tracking-widest text-muted">{en.slots[slot]}</p>
                <p className="font-typewriter text-sm">{EXAMPLE_WORDS[i]}</p>
              </div>
            ))}
          </div>
        )}
        {step === 1 && (
          <ul className="flex flex-col gap-2">
            {(["solved", "hot", "warm", "cold"] as const).map((tier) => (
              <li key={tier} className="flex items-center gap-3 text-sm">
                <span className="w-20">
                  <TierBadge tier={tier} />
                </span>
                {en.tierMeaning[tier]}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="h-12 flex-1 rounded-lg border border-border font-semibold"
            >
              {en.howTo.back}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => (last ? close(false) : setStep(step + 1))}
            className="h-12 flex-[2] rounded-lg bg-accent font-semibold text-ink"
          >
            {last ? en.howTo.done : en.howTo.next}
          </button>
        </div>
      </div>
    </dialog>
  );
}
