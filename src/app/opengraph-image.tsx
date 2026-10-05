import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SLOT_KEYS } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";

// Link preview for WhatsApp and social. Built once at build time. Uses the Nano Banana
// background from public/brand/og-background.jpg when `npm run brand:build` made one.

export const alt = en.meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AMBER = "#e2b45c";
const INK = "#0b0d10";

async function background(): Promise<string | null> {
  const file = join(process.cwd(), "public/brand/og-background.jpg");
  if (!existsSync(file)) return null;
  return `data:image/jpeg;base64,${(await readFile(file)).toString("base64")}`;
}

export default async function Image() {
  const bg = await background();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          color: "#ebe8e1",
          background: bg ? INK : `radial-gradient(circle at 78% 30%, #3a2f18 0%, ${INK} 60%)`,
          position: "relative",
        }}
      >
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img only
          <img src={bg} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <rect x="20" y="18" width="7" height="7" fill={AMBER} />
            <rect x="27" y="25" width="7" height="7" fill={AMBER} opacity="0.6" />
            <circle cx="28" cy="28" r="15" fill="none" stroke={AMBER} strokeWidth="5" />
            <path d="M39 39l13 13" stroke={AMBER} strokeWidth="7" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>{en.appName}</div>
        </div>
        <div style={{ fontSize: 38, marginTop: 24, maxWidth: 760, color: "#cfccc5" }}>{en.tagline}</div>
        <div style={{ display: "flex", gap: 18, marginTop: 56 }}>
          {SLOT_KEYS.map((slot) => (
            <div
              key={slot}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 200,
                padding: "18px 20px",
                borderRadius: 14,
                border: "3px solid #2c313a",
                background: "rgba(20,23,28,0.9)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: AMBER, letterSpacing: 3 }}>{en.slots[slot]}</div>
              <div style={{ fontSize: 34, color: "#6b7079", marginTop: 6 }}>? ? ?</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
