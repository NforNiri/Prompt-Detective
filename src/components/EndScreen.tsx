import { buildShareRows } from "@/lib/game/share";
import type { SavedGame } from "@/lib/game/state";
import { guessesUsed } from "@/lib/game/stats";
import { SLOT_KEYS } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";
import { Countdown } from "./Countdown";
import { ShareButton } from "./ShareButton";

interface EndScreenProps {
  puzzleId: number;
  game: SavedGame;
  onStats: () => void;
}

export function EndScreen({ puzzleId, game, onStats }: EndScreenProps) {
  const won = game.status === "won";
  const rows = buildShareRows(game);

  return (
    <section aria-labelledby="end-title" className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <h2 id="end-title" className={`font-typewriter text-2xl font-bold ${won ? "text-tier-solved" : "text-fg"}`}>
          {won ? en.end.won : en.end.lost}
        </h2>
        <p className="text-sm text-muted">{won ? en.end.wonDetail(guessesUsed(game), game.budget) : en.end.lostDetail}</p>
      </div>

      <figure className="flex flex-col gap-1">
        <figcaption className="text-xs font-semibold uppercase tracking-widest text-muted">{en.end.promptLabel}</figcaption>
        <blockquote className="font-typewriter text-lg leading-snug">
          {game.reveal ? `“${game.reveal.prompt}”` : en.end.loadingPrompt}
        </blockquote>
      </figure>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{en.end.recapTitle}</h3>
        <ul className="flex flex-col gap-1">
          {SLOT_KEYS.map((slot) => {
            const guesses = game.guesses.filter((g) => g.slot === slot).length;
            return (
              <li key={slot} className="flex items-center gap-3">
                <span className="sr-only">{en.end.recapRow(en.slots[slot], guesses, Boolean(game.solved[slot]))}</span>
                <span aria-hidden="true" className="w-14 text-[11px] font-bold tracking-widest text-muted">
                  {en.slots[slot]}
                </span>
                <span aria-hidden="true" className="text-lg leading-none tracking-[0.15em]">
                  {rows[slot]}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <ShareButton puzzleId={puzzleId} game={game} />
      <button type="button" onClick={onStats} className="h-12 w-full rounded-lg border border-border font-semibold">
        {en.end.stats}
      </button>
      <Countdown />
    </section>
  );
}
