"use client";

import { useRef, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { canUseHint, guessesLeft, type Notice } from "@/lib/game/state";
import { en } from "@/lib/i18n/en";
import type { SlotKey } from "@/lib/game/types";
import { EndScreen } from "./EndScreen";
import { GuessCounter } from "./GuessCounter";
import { GuessHistory } from "./GuessHistory";
import { GuessInput } from "./GuessInput";
import { Header } from "./Header";
import { HintButton } from "./HintButton";
import { HowToPlayModal } from "./HowToPlayModal";
import { ImageCard } from "./ImageCard";
import { SlotTiles } from "./SlotTiles";

function noticeText(notice: Notice | null): string | null {
  if (!notice) return null;
  switch (notice.kind) {
    case "result": {
      const text = en.notices.result(en.tiers[notice.tier], notice.guess, en.slots[notice.slot]);
      return notice.typo ? `${text} ${en.notices.typo}` : text;
    }
    case "hint":
      return en.notices.hint(en.slots[notice.slot], notice.letter);
    case "duplicate":
      return en.notices.duplicate(notice.guess, en.slots[notice.slot]);
    case "invalid":
      return en.notices.invalid;
    case "error":
      return en.notices.error;
  }
}

export function Game() {
  const { model, selectSlot, submitGuess, requestHint, dismissNotice, markHowToSeen, retry } = useGame();
  const [howToOpen, setHowToOpen] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { game, puzzle, phase, pending, selectedSlot } = model;

  const showHowTo = howToOpen ?? (phase === "ready" && model.firstVisit);
  const playing = phase === "ready" && game.status === "playing";
  const message = noticeText(model.notice);

  function handleSelect(slot: SlotKey) {
    selectSlot(slot);
    inputRef.current?.focus();
  }

  return (
    <>
      <Header onHelp={() => setHowToOpen(true)} />

      <div className="flex flex-col gap-4">
        <ImageCard imageUrl={puzzle?.imageUrl ?? null} puzzleId={puzzle?.id ?? null} />

        {phase === "loading" && <p className="text-center text-muted">{en.load.loading}</p>}

        {phase === "error" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p>{model.loadError === "not_found" ? en.load.notFound : en.load.network}</p>
            {model.loadError === "network" && (
              <button type="button" onClick={retry} className="h-12 rounded-lg border border-border px-5 font-semibold">
                {en.load.retry}
              </button>
            )}
          </div>
        )}

        {phase === "ready" && (
          <>
            {!playing && <EndScreen game={game} />}
            {playing && <GuessCounter left={guessesLeft(game)} total={game.budget} />}

            <SlotTiles game={game} selected={selectedSlot} disabled={Boolean(pending)} onSelect={handleSelect} />

            {playing && (
              <>
                <GuessInput
                  ref={inputRef}
                  slot={selectedSlot}
                  solved={Boolean(game.solved[selectedSlot])}
                  pending={pending?.kind === "guess"}
                  busy={Boolean(pending)}
                  message={message}
                  onSubmit={submitGuess}
                  onType={dismissNotice}
                />
                <HintButton game={game} enabled={canUseHint(model)} pending={pending?.kind === "hint"} onHint={requestHint} />
              </>
            )}

            <GuessHistory game={game} />

            {!model.storageOk && <p className="text-xs text-muted">{en.storageNote}</p>}
          </>
        )}
      </div>

      {/* Screen readers hear every result, hint and error. */}
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>

      <HowToPlayModal
        open={showHowTo}
        onClose={() => {
          markHowToSeen();
          setHowToOpen(false);
        }}
      />
    </>
  );
}
