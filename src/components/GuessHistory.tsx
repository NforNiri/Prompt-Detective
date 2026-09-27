import type { SavedGame } from "@/lib/game/state";
import { en } from "@/lib/i18n/en";
import { TierBadge } from "./TierBadge";

export function GuessHistory({ game }: { game: SavedGame }) {
  const rows = game.guesses.map((g, i) => ({ ...g, index: i }));
  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-2">
      <h2 id="history-title" className="text-xs font-semibold uppercase tracking-widest text-muted">
        {en.history.title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{en.history.empty}</p>
      ) : (
        <ol className="flex flex-col-reverse divide-y divide-y-reverse divide-border rounded-lg border border-border bg-surface">
          {rows.map((g) => (
            <li key={g.index} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="w-12 shrink-0 text-[11px] font-bold tracking-widest text-muted">{en.slots[g.slot]}</span>
                <span className="truncate font-typewriter">{g.guess}</span>
              </span>
              <TierBadge tier={g.tier} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
