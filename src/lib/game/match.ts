import { variants } from "./normalize";
import { SLOT_KEYS, type MatchResult, type Slot, type SlotKey, type Slots } from "./types";

export const TYPO_MIN_LENGTH = 5;
export const TYPO_MAX_DISTANCE = 1;

export interface CompiledSlot {
  accepted: ReadonlySet<string>;
  /** Accepted variants long enough for typo tolerance. */
  typoTargets: readonly string[];
  hot: ReadonlySet<string>;
  warm: ReadonlySet<string>;
}

function variantSet(words: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const word of words) for (const v of variants(word)) out.add(v);
  return out;
}

export function compileSlot(slot: Slot): CompiledSlot {
  const accepted = variantSet([slot.answer, ...slot.accepted]);
  return {
    accepted,
    typoTargets: [...accepted].filter((a) => a.length >= TYPO_MIN_LENGTH),
    hot: variantSet(slot.hot),
    warm: variantSet(slot.warm),
  };
}

/** Precompute all four slots once per puzzle load so each lookup is O(1). */
export function compileSlots(slots: Slots): Record<SlotKey, CompiledSlot> {
  return Object.fromEntries(SLOT_KEYS.map((key) => [key, compileSlot(slots[key])])) as Record<
    SlotKey,
    CompiledSlot
  >;
}

export function levenshtein(a: string, b: string): number {
  const s = [...a];
  const t = [...b];
  let prev = Array.from({ length: t.length + 1 }, (_, j) => j);
  for (let i = 1; i <= s.length; i++) {
    const row = [i];
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = row;
  }
  return prev[t.length]!;
}

const compiledCache = new WeakMap<Slot, CompiledSlot>();

function isCompiled(slot: Slot | CompiledSlot): slot is CompiledSlot {
  return slot.accepted instanceof Set;
}

function compileCached(slot: Slot): CompiledSlot {
  let compiled = compiledCache.get(slot);
  if (!compiled) {
    compiled = compileSlot(slot);
    compiledCache.set(slot, compiled);
  }
  return compiled;
}

function intersects(values: ReadonlySet<string>, set: ReadonlySet<string>): boolean {
  for (const v of values) if (set.has(v)) return true;
  return false;
}

/** Tier for one guess against one slot. Accepted beats typo beats hot beats warm. */
export function matchGuess(guess: string, slot: Slot | CompiledSlot): MatchResult {
  const target = isCompiled(slot) ? slot : compileCached(slot);
  const guessVariants = variants(guess);
  guessVariants.delete("");
  if (guessVariants.size === 0) return { tier: "cold", typo: false };

  if (intersects(guessVariants, target.accepted)) return { tier: "solved", typo: false };

  for (const v of guessVariants) {
    for (const a of target.typoTargets) {
      if (Math.abs(v.length - a.length) <= TYPO_MAX_DISTANCE && levenshtein(v, a) <= TYPO_MAX_DISTANCE) {
        return { tier: "solved", typo: true };
      }
    }
  }

  if (intersects(guessVariants, target.hot)) return { tier: "hot", typo: false };
  if (intersects(guessVariants, target.warm)) return { tier: "warm", typo: false };
  return { tier: "cold", typo: false };
}
