import Image from "next/image";
import { en } from "@/lib/i18n/en";

export function ImageCard({ imageUrl, puzzleId }: { imageUrl: string | null; puzzleId: number | null }) {
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
    </div>
  );
}
