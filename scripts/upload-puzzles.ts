// npm run content:upload -- [--dry-run] [--only=0012,0013 | --only=1-26]
// Ships puzzles to Supabase (docs/04-CONTENT-PIPELINE.md, step 5):
//   validate -> image to WebP (max 1376px wide, under 200 KB) -> upload as {uuid}.webp -> upsert row.
// Idempotent: re-running a puzzle uploads a fresh image, points the row at it and deletes the old file,
// so the URL changes and no CDN serves a stale image. --dry-run touches nothing remote.
import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { validatePuzzles } from "../src/lib/game/validate";
import type { Puzzle } from "../src/lib/game/types";

const PUZZLE_DIR = "content/puzzles";
const IMAGE_DIR = "content/images";
const BUCKET = "puzzles";
const MAX_WIDTH = 1376;
const TARGET_BYTES = 200 * 1024;
// Tried in order until one fits. Busy textures (mosaic, embroidery) need a smaller width, not mush.
const ENCODINGS: { width: number; quality: number }[] = [
  { width: MAX_WIDTH, quality: 82 },
  { width: MAX_WIDTH, quality: 74 },
  { width: MAX_WIDTH, quality: 66 },
  { width: 1200, quality: 70 },
  { width: 1024, quality: 70 },
  { width: 1024, quality: 60 },
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyArg = args.find((a) => a.startsWith("--only="))?.slice("--only=".length);

function parseOnly(value: string | undefined): Set<number> | null {
  if (!value) return null;
  const ids = new Set<number>();
  for (const part of value.split(",")) {
    const [from, to] = part.split("-").map((n) => Number.parseInt(n, 10));
    if (from === undefined || Number.isNaN(from)) throw new Error(`bad --only value: ${part}`);
    for (let id = from; id <= (to ?? from); id++) ids.add(id);
  }
  return ids;
}

function imageFile(id: number): string | undefined {
  const base = String(id).padStart(4, "0");
  return ["png", "jpg", "jpeg", "webp"].map((ext) => join(IMAGE_DIR, `${base}.${ext}`)).find(existsSync);
}

/** The first WebP encoding that fits the size budget, largest and sharpest first. */
async function toWebp(file: string): Promise<{ data: Buffer; quality: number; width: number; height: number }> {
  let last: { data: Buffer; quality: number; width: number; height: number } | null = null;
  for (const { width, quality } of ENCODINGS) {
    const { data, info } = await sharp(readFileSync(file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    last = { data, quality, width: info.width, height: info.height };
    if (data.length <= TARGET_BYTES) break;
  }
  return last!;
}

function kb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

async function main() {
  const only = parseOnly(onlyArg);
  const files = readdirSync(PUZZLE_DIR).filter((f) => f.endsWith(".json")).sort();
  const sources = files.map((file) => ({ source: file, data: JSON.parse(readFileSync(join(PUZZLE_DIR, file), "utf8")) as unknown }));

  // Content rules run on the full set (date gaps need neighbors). Missing images only block selected puzzles.
  const imageIds = new Set(files.map((f) => Number.parseInt(f, 10)).filter((id) => imageFile(id)));
  const { puzzles, issues } = validatePuzzles(sources, { imageIds, requireImages: false });
  const selected = puzzles.filter((p) => !only || only.has(p.id));
  const blocking = issues.filter(
    (i) => (i.level === "error" && (i.puzzleId === null || !only || only.has(i.puzzleId))) ||
      (i.message.startsWith("image for") && i.puzzleId !== null && selected.some((p) => p.id === i.puzzleId)),
  );

  console.log(`${dryRun ? "DRY RUN: " : ""}${selected.length} puzzle(s) selected of ${puzzles.length}\n`);
  if (blocking.length) {
    for (const i of blocking) console.log(`  ✗ ${i.source}: ${i.message}`);
    if (!dryRun) {
      console.error(`\n${blocking.length} blocking issue(s). Fix them or narrow --only. Nothing uploaded.`);
      process.exit(1);
    }
    console.log("");
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dryRun && (!url || !key)) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local)");
    process.exit(1);
  }
  const db = dryRun ? null : createClient(url!, key!, { auth: { persistSession: false } });

  const existing = new Map<number, string>();
  if (db) {
    const { data, error } = await db.from("puzzles").select("id, image_path").in("id", selected.map((p) => p.id));
    if (error) throw new Error(`reading existing rows: ${error.message}`);
    for (const row of data as { id: number; image_path: string }[]) existing.set(row.id, row.image_path);
  }

  let uploaded = 0;
  let skipped = 0;
  for (const p of selected as Puzzle[]) {
    const label = `#${String(p.id).padStart(2, " ")} ${p.publishDate}`;
    const file = imageFile(p.id);
    if (!file) {
      console.log(`${label}  no image, skipped`);
      skipped++;
      continue;
    }
    const webp = await toWebp(file);
    const imagePath = `${randomUUID()}.webp`;
    const summary = `${file} -> ${webp.width}x${webp.height} q${webp.quality} ${kb(webp.data.length)}`;
    if (!db) {
      console.log(`${label}  would upload ${summary}`);
      continue;
    }

    const upload = await db.storage.from(BUCKET).upload(imagePath, webp.data, { contentType: "image/webp", upsert: false });
    if (upload.error) throw new Error(`#${p.id} upload: ${upload.error.message}`);
    const { error } = await db.from("puzzles").upsert(
      {
        id: p.id,
        publish_date: p.publishDate,
        image_path: imagePath,
        difficulty: p.difficulty,
        slots: p.slots,
        prompt: p.prompt,
        locale: p.locale,
      },
      { onConflict: "id" },
    );
    if (error) {
      await db.storage.from(BUCKET).remove([imagePath]);
      throw new Error(`#${p.id} upsert: ${error.message}`);
    }
    const previous = existing.get(p.id);
    if (previous && previous !== imagePath) await db.storage.from(BUCKET).remove([previous]);
    console.log(`${label}  uploaded ${summary}${previous ? " (replaced old image)" : ""}`);
    uploaded++;
  }

  console.log(`\n${dryRun ? "Dry run done" : `${uploaded} uploaded`}, ${skipped} skipped for missing images.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
