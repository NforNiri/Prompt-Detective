// npm run db:seed-dev [-- 1 2 3 4]
// Upserts puzzles (default 1-3) into Neon for local play before the real upload
// script (Day 5). Uses content/images/NNNN.(png|jpg|webp) when it exists, otherwise a generated
// placeholder card. The file name includes a content hash so a new image gets a new URL.
// The upload script later overwrites these rows by id.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { put, del } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";
import { puzzleSchema } from "../src/lib/game/schemas";

const MAX_WIDTH = 1376;
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

function placeholderSvg(id: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1376" height="768" viewBox="0 0 1376 768">
  <defs><radialGradient id="lamp" cx="50%" cy="38%" r="65%">
    <stop offset="0" stop-color="#2a2418"/><stop offset="1" stop-color="#0b0d10"/></radialGradient></defs>
  <rect width="1376" height="768" fill="url(#lamp)"/>
  <g fill="none" stroke="#e2b45c" stroke-width="28" stroke-linecap="round">
    <circle cx="650" cy="300" r="120"/><path d="M738 388l136 136"/></g>
  <text x="688" y="640" text-anchor="middle" font-family="Courier New, monospace" font-size="72" font-weight="700" fill="#ebe8e1">CASE #${id}</text>
  <text x="688" y="700" text-anchor="middle" font-family="Courier New, monospace" font-size="40" fill="#a3a6ad">placeholder image</text>
</svg>`;
}

async function imageFor(id: number, file: string): Promise<{ webp: Buffer; source: string }> {
  const real = IMAGE_EXTENSIONS.map((ext) => `content/images/${file}.${ext}`).find((p) => existsSync(p));
  const input = real ? readFileSync(real) : Buffer.from(placeholderSvg(id));
  // Keep the aspect ratio: the game shows the whole image in a 16:9 frame.
  const webp = await sharp(input).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  return { webp, source: real ?? "placeholder" };
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const dbUrl = process.env.DATABASE_URL;
  if (!token || !dbUrl) {
    console.error("BLOB_READ_WRITE_TOKEN and DATABASE_URL must be set (see .env.local)");
    process.exit(1);
  }
  const ids = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const sql = neon(dbUrl);

  for (const id of ids.length ? ids : [1, 2, 3]) {
    const file = String(id).padStart(4, "0");
    const p = puzzleSchema.parse(JSON.parse(readFileSync(`content/puzzles/${file}.json`, "utf8")));
    const { webp, source } = await imageFor(p.id, file);
    const hash = createHash("sha256").update(webp).digest("hex").slice(0, 8);
    const imagePath = `dev/${file}-${hash}.webp`;

    const before = await sql`
      SELECT image_path FROM puzzles WHERE id = ${p.id} LIMIT 1
    ` as unknown as { image_path: string }[];
    
    await put(imagePath, webp, {
      access: "public",
      contentType: "image/webp",
      token,
    });

    await sql`
      INSERT INTO puzzles (id, publish_date, image_path, difficulty, slots, prompt, locale)
      VALUES (${p.id}, ${p.publishDate}, ${imagePath}, ${p.difficulty}, ${JSON.stringify(p.slots)}, ${p.prompt}, ${p.locale})
      ON CONFLICT (id) 
      DO UPDATE SET 
        publish_date = EXCLUDED.publish_date,
        image_path = EXCLUDED.image_path,
        difficulty = EXCLUDED.difficulty,
        slots = EXCLUDED.slots,
        prompt = EXCLUDED.prompt,
        locale = EXCLUDED.locale
    `;
    
    // Delete the image this row pointed at before, so dev runs do not pile up orphans.
    if (before[0] && before[0].image_path !== imagePath) {
      try {
        await del(before[0].image_path, { token });
      } catch {
        // Orphan cleanup is best effort
      }
    }
    console.log(`#${p.id} ${p.publishDate}  ${source} -> ${imagePath} (${Math.round(webp.length / 1024)} KB)`);
  }
}

main().catch((error: unknown) => {
  console.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
