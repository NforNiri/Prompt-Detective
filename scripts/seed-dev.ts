// npm run db:seed-dev
// Upserts puzzles 0001-0003 into Supabase with placeholder image paths so the
// API can be exercised before the real upload script (Day 5). The upload script
// later overwrites these rows by id.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { puzzleSchema } from "../src/lib/game/types";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
  process.exit(1);
}

const rows = ["0001", "0002", "0003"].map((id) => {
  const p = puzzleSchema.parse(JSON.parse(readFileSync(`content/puzzles/${id}.json`, "utf8")));
  return {
    id: p.id,
    publish_date: p.publishDate,
    image_path: `dev/${id}.webp`,
    difficulty: p.difficulty,
    slots: p.slots,
    prompt: p.prompt,
    locale: p.locale,
  };
});

const db = createClient(url, key, { auth: { persistSession: false } });
const { error } = await db.from("puzzles").upsert(rows, { onConflict: "id" });
if (error) {
  console.error(`Seed failed: ${error.message}`);
  process.exit(1);
}
console.log(`Seeded puzzles ${rows.map((r) => `#${r.id} (${r.publish_date})`).join(", ")}`);
