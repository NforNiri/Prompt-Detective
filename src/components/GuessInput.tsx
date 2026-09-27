"use client";

import { forwardRef, useState, type FormEvent } from "react";
import type { GuessCheck } from "@/lib/game/state";
import type { SlotKey } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";

interface GuessInputProps {
  slot: SlotKey;
  solved: boolean;
  /** A guess is being checked: changes the button label. */
  pending: boolean;
  /** Any request in flight: the input turns read-only. */
  busy: boolean;
  message: string | null;
  onSubmit: (guess: string) => Promise<GuessCheck>;
  onType: () => void;
}

export const GuessInput = forwardRef<HTMLInputElement, GuessInputProps>(function GuessInput(
  { slot, solved, pending, busy, message, onSubmit, onType },
  ref,
) {
  const [value, setValue] = useState("");
  const label = en.slots[slot];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // React clears currentTarget after the await, so grab the input first.
    const input = event.currentTarget.querySelector("input");
    const check = await onSubmit(value);
    if (check === "ok") setValue("");
    // Rejected guesses stay in the box, selected, so the next keystroke replaces them.
    if (check === "duplicate" || check === "invalid") input?.select();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="guess" className="sr-only">
        {en.input.label(label)}
      </label>
      <div className="flex gap-2">
        <input
          ref={ref}
          id="guess"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onType();
          }}
          disabled={solved}
          // Read-only rather than disabled while checking: a disabled input drops keyboard focus.
          readOnly={busy}
          placeholder={solved ? en.input.slotSolved(label) : en.input.placeholder(en.slotQuestions[slot])}
          maxLength={40}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          aria-describedby={message ? "guess-message" : undefined}
          className="h-12 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 font-typewriter text-lg placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:border-accent disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={solved || busy || !value.trim()}
          className="h-12 shrink-0 rounded-lg bg-accent px-4 font-semibold text-ink disabled:opacity-50"
        >
          {pending ? en.input.checking : en.input.submit}
        </button>
      </div>
      <p id="guess-message" className="min-h-5 text-sm text-muted">
        {message}
      </p>
    </form>
  );
});
