import type { SavedGame } from "@/lib/game/state";
import { SLOT_KEYS, type SlotKey, type Tier } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";
import { TIER_BORDER, TierBadge } from "./TierBadge";

interface SlotTilesProps {
  game: SavedGame;
  selected: SlotKey;
  disabled: boolean;
  onSelect: (slot: SlotKey) => void;
}

function lastGuess(game: SavedGame, slot: SlotKey): { guess: string; tier: Tier } | null {
  for (let i = game.guesses.length - 1; i >= 0; i--) {
    const g = game.guesses[i]!;
    if (g.slot === slot) return g;
  }
  return null;
}

export function SlotTiles({ game, selected, disabled, onSelect }: SlotTilesProps) {
  const over = game.status !== "playing";
  return (
    <div className="grid grid-cols-2 gap-2">
      {SLOT_KEYS.map((slot) => {
        const label = en.slots[slot];
        const answer = game.solved[slot];
        const revealed = over && !answer ? game.reveal?.answers[slot] : undefined;
        const last = lastGuess(game, slot);
        const hint = game.hintUsed === slot ? game.hintLetter : null;
        const isSelected = selected === slot && !over;
        const tier: Tier | null = answer ? "solved" : (last?.tier ?? null);

        let body: string;
        let description: string;
        if (answer) {
          body = answer;
          description = en.tile.solved(answer);
        } else if (revealed) {
          body = revealed;
          description = en.tile.revealed(revealed);
        } else if (last) {
          body = last.guess;
          description = en.tile.lastGuess(last.guess, en.tiers[last.tier]);
        } else {
          body = hint ? `${hint.toUpperCase()}…` : "· · ·";
          description = en.tile.empty;
        }
        if (hint && !answer) description += `. ${en.tile.hintLetter(hint)}`;

        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            disabled={disabled || over || Boolean(answer)}
            aria-pressed={isSelected}
            aria-label={`${label}. ${description}${isSelected ? `. ${en.tile.selected}` : ""}`}
            className={[
              "flex min-h-[76px] flex-col justify-between gap-1 rounded-lg border-2 bg-surface p-2.5 text-start transition-colors",
              tier ? TIER_BORDER[tier] : "border-border",
              isSelected ? "bg-surface-2 outline-2 outline-offset-2 outline-accent" : "",
              answer ? "cursor-default" : "enabled:hover:bg-surface-2",
              revealed ? "opacity-80" : "",
            ].join(" ")}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className={`text-[11px] font-bold tracking-widest ${isSelected ? "text-accent" : "text-muted"}`}>
                {label}
              </span>
              {tier && <TierBadge tier={tier} />}
            </span>
            <span
              className={`font-typewriter text-base leading-tight break-words ${
                answer ? "font-bold text-fg" : last || revealed ? "text-fg/80" : "text-muted"
              } ${revealed ? "italic" : ""}`}
            >
              {body}
            </span>
          </button>
        );
      })}
    </div>
  );
}
