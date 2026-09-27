// npm run content:validate [-- --strict]
// Checks content/puzzles/*.json against docs/04-CONTENT-PIPELINE.md. Exits 1 on errors so it can run in CI.
// --strict: a missing image in content/images is an error (use before upload).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validatePuzzles, type ValidationIssue } from "../src/lib/game/validate";

const PUZZLE_DIR = "content/puzzles";
const IMAGE_DIR = "content/images";
const strict = process.argv.includes("--strict");

const color = { red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m", dim: "\x1b[2m", reset: "\x1b[0m" };

const files = readdirSync(PUZZLE_DIR).filter((f) => f.endsWith(".json")).sort();
const sources = files.map((file) => {
  try {
    return { source: file, data: JSON.parse(readFileSync(join(PUZZLE_DIR, file), "utf8")) as unknown };
  } catch (error) {
    return { source: file, data: { parseError: String(error) } };
  }
});

const imageIds = new Set(
  existsSync(IMAGE_DIR)
    ? readdirSync(IMAGE_DIR)
        .map((f) => /^(\d{4})\.(?:png|jpe?g|webp)$/i.exec(f)?.[1])
        .filter((id): id is string => id !== undefined)
        .map(Number)
    : [],
);

const { puzzles, issues } = validatePuzzles(sources, { imageIds, requireImages: strict });

const bySource = new Map<string, ValidationIssue[]>();
for (const issue of issues) bySource.set(issue.source, [...(bySource.get(issue.source) ?? []), issue]);

const rows = files.map((file) => {
  const list = bySource.get(file) ?? [];
  const status = list.some((i) => i.level === "error") ? "ERROR" : list.length ? "WARN" : "OK";
  return { file, status, list };
});

const pad = (s: string, n: number) => s.padEnd(n);
console.log(`${pad("puzzle", 12)}${pad("status", 8)}issues`);
for (const { file, status, list } of rows) {
  const c = status === "ERROR" ? color.red : status === "WARN" ? color.yellow : color.green;
  const [first, ...rest] = list.length ? list.map((i) => `${i.level === "error" ? "✗" : "!"} ${i.message}`) : [""];
  console.log(`${pad(file, 12)}${c}${pad(status, 8)}${color.reset}${first}`);
  for (const line of rest) console.log(`${pad("", 20)}${line}`);
}

const errors = issues.filter((i) => i.level === "error").length;
const warnings = issues.length - errors;
const summary = `${puzzles.length} valid of ${files.length} files, ${errors} errors, ${warnings} warnings${strict ? " (strict)" : ""}`;
console.log(`\n${errors ? color.red : color.green}${summary}${color.reset}`);
if (!strict && warnings) console.log(`${color.dim}Missing images are warnings until --strict.${color.reset}`);
process.exit(errors ? 1 : 0);
