// npm run content:split [-- content/raw/batch-01.json ...] [--force]
// Splits batch arrays (default: every file in content/raw) into content/puzzles/NNNN.json.
// Existing puzzle files are kept unless --force, because content/puzzles is the source of truth.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { puzzleSchema } from "../src/lib/game/types";

const RAW_DIR = "content/raw";
const PUZZLE_DIR = "content/puzzles";
const args = process.argv.slice(2);
const force = args.includes("--force");
const inputs = args.filter((a) => !a.startsWith("--"));
const batches = inputs.length
  ? inputs
  : readdirSync(RAW_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => join(RAW_DIR, f));

let written = 0;
let skipped = 0;
let failed = 0;
for (const batch of batches) {
  const items: unknown = JSON.parse(readFileSync(batch, "utf8"));
  if (!Array.isArray(items)) {
    console.error(`${batch}: expected a JSON array`);
    failed++;
    continue;
  }
  for (const item of items) {
    const parsed = puzzleSchema.safeParse(item);
    if (!parsed.success) {
      console.error(`${batch}: skipping invalid puzzle: ${parsed.error.issues[0]?.message ?? "schema error"}`);
      failed++;
      continue;
    }
    const file = join(PUZZLE_DIR, `${String(parsed.data.id).padStart(4, "0")}.json`);
    if (existsSync(file) && !force) {
      skipped++;
      continue;
    }
    writeFileSync(file, `${JSON.stringify(parsed.data, null, 2)}\n`);
    written++;
  }
}
console.log(`${written} written, ${skipped} skipped (already exist${force ? "" : ", use --force to overwrite"}), ${failed} invalid`);
process.exit(failed ? 1 : 0);
