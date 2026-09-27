import type { SavedGame } from "@/lib/game/state";
import { guessesUsed } from "@/lib/game/stats";
import { en } from "@/lib/i18n/en";

// Result and full prompt. Recap, countdown and share are added with the rest of the end screen (runbook Day 4).
export function EndScreen({ game }: { game: SavedGame }) {
  const won = game.status === "won";
  return (
    <section aria-labelledby="end-title" className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <h2 id="end-title" className={`font-typewriter text-2xl font-bold ${won ? "text-tier-solved" : "text-fg"}`}>
        {won ? en.end.won : en.end.lost}
      </h2>
      <p className="text-sm text-muted">{won ? en.end.wonDetail(guessesUsed(game), game.budget) : en.end.lostDetail}</p>
      <figure className="flex flex-col gap-1">
        <figcaption className="text-xs font-semibold uppercase tracking-widest text-muted">{en.end.promptLabel}</figcaption>
        <blockquote className="font-typewriter text-lg leading-snug">
          {game.reveal ? `“${game.reveal.prompt}”` : en.end.loadingPrompt}
        </blockquote>
      </figure>
    </section>
  );
}
