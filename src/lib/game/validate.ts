import { daysBetween, expectedDifficulty } from "./date";
import { levenshtein, TYPO_MAX_DISTANCE, TYPO_MIN_LENGTH } from "./match";
import { normalize, variants } from "./normalize";
import { PROMPT_SUFFIX } from "./prompt";
import { puzzleSchema, SLOT_KEYS, type Puzzle, type Slot, type SlotKey } from "./types";

// Content rules from docs/04-CONTENT-PIPELINE.md "Validator rules", plus two engine
// checks: tier words that typo tolerance would score SOLVED, and answers missing
// from the image prompt.

export type IssueLevel = "error" | "warning";

export interface ValidationIssue {
  puzzleId: number | null;
  source: string;
  level: IssueLevel;
  message: string;
}

export interface PuzzleSource {
  /** File name, used in messages and checked against the id (e.g. "0012.json"). */
  source: string;
  data: unknown;
}

export interface ValidateOptions {
  /** Puzzle ids that have an image. Omit to skip the image check. */
  imageIds?: ReadonlySet<number>;
  /** Missing images are errors (upload) instead of warnings (drafting). */
  requireImages?: boolean;
}

export interface ValidationResult {
  puzzles: Puzzle[];
  issues: ValidationIssue[];
}

export const REPEAT_WINDOW_DAYS = 14;
export const MAX_ACCEPTED_WORDS = 3;

type Tier = "accepted" | "hot" | "warm";

function wordCount(s: string): number {
  return normalize(s).split(" ").filter(Boolean).length;
}

function checkSlot(key: SlotKey, slot: Slot, report: (level: IssueLevel, message: string) => void): void {
  const acceptedNorm = slot.accepted.map(normalize);
  if (!acceptedNorm.includes(normalize(slot.answer))) {
    report("error", `${key}: answer "${slot.answer}" is not in accepted`);
  }

  const tiers: [Tier, string[]][] = [
    ["accepted", slot.accepted],
    ["hot", slot.hot],
    ["warm", slot.warm],
  ];
  const owner = new Map<string, Tier>();
  for (const [tier, words] of tiers) {
    const seen = new Set<string>();
    for (const word of words) {
      const n = normalize(word);
      if (seen.has(n)) report("warning", `${key}.${tier}: "${word}" is listed twice`);
      seen.add(n);
      for (const v of variants(word)) {
        const other = owner.get(v);
        if (other && other !== tier) report("error", `${key}: "${word}" (${tier}) is also in ${other} (as "${v}")`);
        if (!other) owner.set(v, tier);
      }
    }
  }

  for (const word of slot.accepted) {
    if (wordCount(word) > MAX_ACCEPTED_WORDS) {
      report("warning", `${key}: accepted "${word}" is longer than ${MAX_ACCEPTED_WORDS} words`);
    }
  }

  const typoTargets = [...owner].filter(([v, t]) => t === "accepted" && v.length >= TYPO_MIN_LENGTH).map(([v]) => v);
  for (const word of [...slot.hot, ...slot.warm]) {
    for (const v of variants(word)) {
      const hit = typoTargets.find(
        (a) => Math.abs(a.length - v.length) <= TYPO_MAX_DISTANCE && levenshtein(a, v) <= TYPO_MAX_DISTANCE,
      );
      if (hit) {
        report("warning", `${key}: "${word}" is one typo from accepted "${hit}", so it scores SOLVED`);
        break;
      }
    }
  }
}

export function validatePuzzles(sources: readonly PuzzleSource[], options: ValidateOptions = {}): ValidationResult {
  const issues: ValidationIssue[] = [];
  const parsed: { source: string; puzzle: Puzzle }[] = [];

  for (const { source, data } of sources) {
    const result = puzzleSchema.safeParse(data);
    if (!result.success) {
      const detail = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      issues.push({ puzzleId: null, source, level: "error", message: `schema: ${detail}` });
      continue;
    }
    parsed.push({ source, puzzle: result.data });
  }

  parsed.sort((a, b) => a.puzzle.id - b.puzzle.id);
  const ids = new Set<number>();
  const dates = new Map<string, number>();

  parsed.forEach(({ source, puzzle: p }, index) => {
    const report = (level: IssueLevel, message: string) => issues.push({ puzzleId: p.id, source, level, message });

    const expectedFile = `${String(p.id).padStart(4, "0")}.json`;
    if (source.endsWith(".json") && !source.endsWith(expectedFile)) report("error", `file name should be ${expectedFile}`);
    if (ids.has(p.id)) report("error", `duplicate id ${p.id}`);
    ids.add(p.id);
    const sameDate = dates.get(p.publishDate);
    if (sameDate !== undefined) report("error", `publishDate ${p.publishDate} is also used by #${sameDate}`);
    dates.set(p.publishDate, p.id);

    const prev = parsed[index - 1]?.puzzle;
    if (prev && prev.id !== p.id && daysBetween(prev.publishDate, p.publishDate) !== p.id - prev.id) {
      report("error", `date gap: #${prev.id} is ${prev.publishDate}, #${p.id} is ${p.publishDate}`);
    }

    const difficulty = expectedDifficulty(p.publishDate);
    if (p.difficulty !== difficulty) report("error", `difficulty ${p.difficulty} should be ${difficulty} for its weekday`);

    if (!p.prompt.trim().endsWith(PROMPT_SUFFIX)) report("error", `prompt must end with "${PROMPT_SUFFIX}"`);
    const promptNorm = normalize(p.prompt);
    for (const key of SLOT_KEYS) {
      if (!promptNorm.includes(normalize(p.slots[key].answer))) {
        report("warning", `${key}: answer "${p.slots[key].answer}" does not appear in the prompt`);
      }
      checkSlot(key, p.slots[key], report);
    }

    if (options.imageIds && !options.imageIds.has(p.id)) {
      report(options.requireImages ? "error" : "warning", `image ${String(p.id).padStart(4, "0")}.png is missing`);
    }
  });

  // WHO and STYLE answers should not repeat within 14 days.
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      const a = parsed[i]!.puzzle;
      const b = parsed[j]!;
      if (daysBetween(a.publishDate, b.puzzle.publishDate) >= REPEAT_WINDOW_DAYS) break;
      for (const key of ["who", "style"] as const) {
        if (normalize(a.slots[key].answer) === normalize(b.puzzle.slots[key].answer)) {
          issues.push({
            puzzleId: b.puzzle.id,
            source: b.source,
            level: "warning",
            message: `${key} "${b.puzzle.slots[key].answer}" repeats #${a.id} within ${REPEAT_WINDOW_DAYS} days`,
          });
        }
      }
    }
  }

  return { puzzles: parsed.map((p) => p.puzzle), issues };
}
