import type { SavedGame } from "@/lib/game/state";
import { en } from "@/lib/i18n/en";

interface HintButtonProps {
  game: SavedGame;
  enabled: boolean;
  pending: boolean;
  onHint: () => void;
}

export function HintButton({ game, enabled, pending, onHint }: HintButtonProps) {
  if (game.hintUsed && game.hintLetter) {
    return (
      <p className="flex min-h-11 items-center gap-2 text-sm text-muted">
        <span aria-hidden="true">💡</span>
        {en.hint.used(en.slots[game.hintUsed], game.hintLetter)}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onHint}
      disabled={!enabled}
      className="flex min-h-11 w-full items-center justify-between rounded-lg border border-dashed border-border px-3 text-sm enabled:hover:border-accent disabled:opacity-50"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true">💡</span>
        {pending ? en.hint.checking : en.hint.button}
      </span>
      <span className="text-muted">{en.hint.cost}</span>
    </button>
  );
}
