import { headers } from "next/headers";
import { Game } from "@/components/Game";
import type { PublicPuzzle } from "@/lib/game/types";
import { createLogger } from "@/lib/logger";
import { getPublicPuzzle, toPublicPuzzle } from "@/lib/puzzle-repo";
import { visitorLocalDate } from "@/lib/visitor-date";

const log = createLogger("page");

// Rendered per request: today's image goes into the first HTML, so it starts loading
// before any JavaScript runs (the LCP element). Public data only, never answers.
async function loadInitialPuzzle(date: string): Promise<PublicPuzzle | null> {
  try {
    const row = await getPublicPuzzle(date);
    return row ? toPublicPuzzle(row) : null;
  } catch (error) {
    log.warn("initial puzzle failed, the client will fetch it", { message: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export default async function Home() {
  const timeZone = (await headers()).get("x-vercel-ip-timezone");
  const initialPuzzle = await loadInitialPuzzle(visitorLocalDate(timeZone));
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10">
      <Game initialPuzzle={initialPuzzle} />
    </main>
  );
}
