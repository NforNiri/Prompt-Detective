// npm run audit:bundle (after npm run build)
// Fails if puzzle answers reached the client bundle in .next/static. Exits 1 on a leak so it can run in CI.
//
// Single words alone prove nothing ("mouse", "track" and "safari" all occur in library code), so a leak is:
// - any puzzle's prompt, or
// - any multi-word answer or accepted phrase ("golden retriever", "riding a bicycle"), or
// - one file holding 3 or more of a puzzle's 4 answers as quoted strings.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { displayPrompt } from "../src/lib/game/prompt";
import { puzzleSchema } from "../src/lib/game/schemas";
import { SLOT_KEYS, type Puzzle } from "../src/lib/game/types";

const STATIC_DIR = ".next/static";
const PUZZLE_DIR = "content/puzzles";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(phrase)}(?![\\p{L}\\p{N}])`, "u").test(haystack);
}

function containsQuoted(haystack: string, word: string): boolean {
  return [`"${word}"`, `'${word}'`, `\`${word}\``].some((quoted) => haystack.includes(quoted));
}

if (!existsSync(STATIC_DIR)) {
  console.error(`${STATIC_DIR} not found. Run npm run build first.`);
  process.exit(1);
}

const puzzles: Puzzle[] = readdirSync(PUZZLE_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => puzzleSchema.parse(JSON.parse(readFileSync(join(PUZZLE_DIR, f), "utf8"))));

const chunks = walk(STATIC_DIR)
  .filter((f) => /\.(js|css|json|txt|html)$/.test(f))
  .map((f) => ({ file: relative(STATIC_DIR, f), text: readFileSync(f, "utf8").toLowerCase() }));

const leaks: string[] = [];
for (const puzzle of puzzles) {
  const id = `#${puzzle.id}`;
  const prompt = displayPrompt(puzzle.prompt).toLowerCase();
  const phrases = new Set(
    SLOT_KEYS.flatMap((slot) => [puzzle.slots[slot].answer, ...puzzle.slots[slot].accepted])
      .map((p) => p.toLowerCase())
      .filter((p) => p.includes(" ")),
  );
  const answers = SLOT_KEYS.map((slot) => puzzle.slots[slot].answer.toLowerCase());

  for (const { file, text } of chunks) {
    if (text.includes(prompt)) leaks.push(`${id} prompt in ${file}`);
    for (const phrase of phrases) if (containsPhrase(text, phrase)) leaks.push(`${id} "${phrase}" in ${file}`);
    const quoted = answers.filter((a) => containsQuoted(text, a));
    if (quoted.length >= 3) leaks.push(`${id} answers ${quoted.join(", ")} together in ${file}`);
  }
}

if (leaks.length > 0) {
  console.error(`\x1b[31mBundle audit failed: ${leaks.length} leak(s)\x1b[0m`);
  for (const leak of leaks) console.error(`  ${leak}`);
  process.exit(1);
}
console.log(`\x1b[32mBundle audit passed:\x1b[0m ${chunks.length} client files, ${puzzles.length} puzzles, no answers found.`);
