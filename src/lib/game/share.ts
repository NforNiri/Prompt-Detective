import { guessesUsed } from "./stats";
import { SLOT_KEYS, type GameState, type SlotKey, type Tier } from "./types";

export const SHARE_SQUARES: Record<Tier | "hint", string> = {
  solved: "🟩",
  hot: "🟧",
  warm: "🟨",
  cold: "⬛",
  hint: "💡",
};

export interface ShareStrings {
  title: string;
  slotLabels: Record<SlotKey, string>;
}

export interface ShareInput {
  puzzleId: number;
  state: GameState;
  url: string;
  strings: ShareStrings;
}

/** One row of squares per slot, in guess order, with the hint square where it was used. */
export function buildShareRows(state: GameState): Record<SlotKey, string> {
  const rows = {} as Record<SlotKey, string>;
  for (const slot of SLOT_KEYS) {
    const squares: string[] = [];
    state.guesses.forEach((g, i) => {
      if (state.hintUsed === slot && state.hintAt === i) squares.push(SHARE_SQUARES.hint);
      if (g.slot === slot) squares.push(SHARE_SQUARES[g.tier]);
    });
    if (state.hintUsed === slot && (state.hintAt === null || state.hintAt >= state.guesses.length)) {
      squares.push(SHARE_SQUARES.hint);
    }
    rows[slot] = squares.join("");
  }
  return rows;
}

/**
 * Prompt Detective #12  7/10
 * WHO    🟩
 * ...
 * prompt-detective.vercel.app
 */
export function buildShareText({ puzzleId, state, url, strings }: ShareInput): string {
  if (state.status === "playing") throw new Error("buildShareText: game is not finished");

  const score = state.status === "won" ? String(guessesUsed(state)) : "X";
  const rows = buildShareRows(state);
  const width = Math.max(...SLOT_KEYS.map((k) => strings.slotLabels[k].length)) + 2;

  return [
    `${strings.title} #${puzzleId}  ${score}/${state.budget}`,
    ...SLOT_KEYS.map((k) => `${strings.slotLabels[k].padEnd(width)}${rows[k]}`.trimEnd()),
    url,
  ].join("\n");
}
