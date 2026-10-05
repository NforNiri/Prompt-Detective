// npm run brand:build
// Builds the PWA icons and the link-preview background into public/brand/.
// Uses the Nano Banana art in content/brand/ when it exists (see
// docs/NANO-BANANA-PROMPTS.md), otherwise the vector mark in src/app/icon.svg.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";

const OUT = "public/brand";
const BG = "#0b0d10";
const find = (name: string) => ["png", "jpg", "jpeg", "webp"].map((e) => `content/brand/${name}.${e}`).find(existsSync);

async function main() {
  mkdirSync(OUT, { recursive: true });
  const art = find("icon");
  const source = art ? readFileSync(art) : readFileSync("src/app/icon.svg");
  console.log(`icon source: ${art ?? "src/app/icon.svg (placeholder)"}`);

  // Plain icons use the art edge to edge. The maskable icon pads it so phones can crop to a circle.
  for (const size of [192, 512]) {
    await sharp(source, { density: 600 }).resize(size, size, { fit: "cover" }).png().toFile(`${OUT}/icon-${size}.png`);
  }
  await sharp(source, { density: 600 }).resize(180, 180, { fit: "cover" }).flatten({ background: BG }).png().toFile("src/app/apple-icon.png");
  const inner = await sharp(source, { density: 600 }).resize(410, 410, { fit: "cover" }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile(`${OUT}/icon-maskable-512.png`);

  const og = find("og-background");
  if (og) {
    await sharp(readFileSync(og)).resize(1200, 630, { fit: "cover", position: "right" }).jpeg({ quality: 80 }).toFile(`${OUT}/og-background.jpg`);
    console.log(`og background: ${og}`);
  } else {
    console.log("og background: none yet, the generated preview uses a plain gradient");
  }
  console.log(`wrote ${OUT}/`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
