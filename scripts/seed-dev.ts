// npm run db:seed-dev [-- 1 2 3 4]
// Upserts puzzles (default 1-3) into Supabase for local play before the real upload
// script (Day 5). Uses content/images/NNNN.png when it exists, otherwise a generated
// placeholder card. The file name includes a content hash so a new image gets a new URL.
// The upload script later overwrites these rows by id.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { puzzleSchema } from "../src/lib/game/types";

const BUCKET = "puzzles";

function placeholderSvg(id: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs><radialGradient id="lamp" cx="50%" cy="38%" r="65%">
    <stop offset="0" stop-color="#2a2418"/><stop offset="1" stop-color="#0b0d10"/></radialGradient></defs>
  <rect width="1024" height="1024" fill="url(#lamp)"/>
  <g fill="none" stroke="#e2b45c" stroke-width="28" stroke-linecap="round">
    <circle cx="470" cy="420" r="150"/><path d="M580 530l170 170"/></g>
  <text x="512" y="820" text-anchor="middle" font-family="Courier New, monospace" font-size="72" font-weight="700" fill="#ebe8e1">CASE #${id}</text>
  <text x="512" y="890" text-anchor="middle" font-family="Courier New, monospace" font-size="40" fill="#a3a6ad">placeholder image</text>
</svg>`;
}

async function imageFor(id: number, file: string): Promise<{ webp: Buffer; source: string }> {
  const real = `content/images/${file}.png`;
  const input = existsSync(real) ? readFileSync(real) : Buffer.from(placeholderSvg(id));
  const webp = await sharp(input).resize(1024, 1024, { fit: "cover" }).webp({ quality: 82 }).toBuffer();
  return { webp, source: existsSync(real) ? real : "placeholder" };
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
    process.exit(1);
  }
  const ids = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const db = createClient(url, key, { auth: { persistSession: false } });

  for (const id of ids.length ? ids : [1, 2, 3]) {
    const file = String(id).padStart(4, "0");
    const p = puzzleSchema.parse(JSON.parse(readFileSync(`content/puzzles/${file}.json`, "utf8")));
    const { webp, source } = await imageFor(p.id, file);
    const hash = createHash("sha256").update(webp).digest("hex").slice(0, 8);
    const imagePath = `dev/${file}-${hash}.webp`;

    const upload = await db.storage.from(BUCKET).upload(imagePath, webp, { contentType: "image/webp", upsert: true });
    if (upload.error) throw new Error(`upload ${imagePath}: ${upload.error.message}`);

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
    if (error) throw new Error(`upsert #${p.id}: ${error.message}`);
    console.log(`#${p.id} ${p.publishDate}  ${source} -> ${imagePath} (${Math.round(webp.length / 1024)} KB)`);
  }
}

main().catch((error: unknown) => {
  console.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
