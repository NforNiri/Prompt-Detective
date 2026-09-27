"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import type { ShareMethod, ShareResult } from "@/lib/game/events";
import { buildShareText } from "@/lib/game/share";
import type { SavedGame } from "@/lib/game/state";
import { en } from "@/lib/i18n/en";
import { createLogger } from "@/lib/logger";
import { SITE_URL } from "@/lib/site";

const log = createLogger("share");

async function share(text: string): Promise<{ method: ShareMethod; result: ShareResult }> {
  // Native share sheet on phones (WhatsApp, Messages...), clipboard everywhere else.
  if (typeof navigator.share === "function" && navigator.canShare?.({ text }) !== false) {
    try {
      await navigator.share({ text });
      return { method: "native", result: "shared" };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return { method: "native", result: "cancelled" };
      log.warn("native share failed, trying clipboard", { name: error instanceof Error ? error.name : "unknown" });
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return { method: "clipboard", result: "copied" };
  } catch {
    // In-app browsers (WhatsApp, Instagram) often block the async clipboard API.
    return { method: "clipboard", result: legacyCopy(text) ? "copied" : "failed" };
  }
}

function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    // Deprecated, but still the only option where the async clipboard API is blocked.
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

export function ShareButton({ puzzleId, game }: { puzzleId: number; game: SavedGame }) {
  const [toast, setToast] = useState<string | null>(null);

  async function handleClick() {
    const text = buildShareText({
      puzzleId,
      state: game,
      url: SITE_URL,
      strings: { title: en.appName, slotLabels: en.slots },
    });
    const outcome = await share(text);
    track("share_clicked", { puzzle_id: puzzleId, ...outcome });
    if (outcome.result === "copied" || outcome.result === "failed") {
      setToast(outcome.result === "copied" ? en.end.copied : en.end.shareFailed);
      setTimeout(() => setToast(null), 2500);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent font-semibold text-ink"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {en.end.share}
      </button>
      <p
        role="status"
        aria-live="polite"
        className={`fixed inset-x-4 bottom-6 z-40 mx-auto max-w-sm rounded-lg bg-fg px-4 py-3 text-center text-sm font-semibold text-ink shadow-lg transition-opacity ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {toast}
      </p>
    </>
  );
}
