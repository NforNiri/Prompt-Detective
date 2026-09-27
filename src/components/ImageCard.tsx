import Image from "next/image";
import { en } from "@/lib/i18n/en";

export function ImageCard({ imageUrl, puzzleId }: { imageUrl: string | null; puzzleId: number | null }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface">
      {imageUrl && puzzleId !== null ? (
        <Image
          src={imageUrl}
          alt={en.image.alt(puzzleId)}
          fill
          priority
          sizes="(max-width: 480px) 100vw, 448px"
          className="object-cover"
        />
      ) : (
        <div className="size-full bg-surface-2 motion-safe:animate-pulse" />
      )}
    </div>
  );
}
