import Image from "next/image";
import type { GameStatus } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";

interface ImageCardProps {
  imageUrl: string | null;
  puzzleId: number | null;
  status: GameStatus | null;
  /** Stamp in with motion only when the game ended just now, not on a reload. */
  animateStamp: boolean;
}

export function ImageCard({ imageUrl, puzzleId, status, animateStamp }: ImageCardProps) {
  const ended = status === "won" || status === "lost";
  return (
    // 16:9, the Nano Banana default, so the whole image shows and no clue is cropped.
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface">
      {imageUrl && puzzleId !== null ? (
        <Image
          src={imageUrl}
          alt={en.image.alt(puzzleId)}
          fill
          priority
          sizes="(max-width: 480px) 100vw, 448px"
          className="object-contain"
        />
      ) : (
        <div className="size-full bg-surface-2 motion-safe:animate-pulse" />
      )}
      {ended && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            style={{ "--stamp-rotate": "-8deg", transform: "rotate(-8deg)" } as React.CSSProperties}
            className={`${animateStamp ? "anim-stamp" : ""} rounded-md border-4 bg-ink/90 px-4 py-1 font-typewriter text-3xl font-bold tracking-widest uppercase ${
              status === "won" ? "border-tier-solved text-tier-solved" : "border-fg/80 text-fg/90"
            }`}
          >
            {status === "won" ? en.end.stampWon : en.end.stampLost}
          </span>
        </div>
      )}
    </div>
  );
}
