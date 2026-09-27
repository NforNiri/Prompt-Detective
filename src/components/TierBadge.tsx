import type { Tier } from "@/lib/game/types";
import { en } from "@/lib/i18n/en";

// Tier state is never color alone: every badge has a symbol and a word.
const STYLE: Record<Tier, { symbol: string; className: string }> = {
  solved: { symbol: "✓", className: "bg-tier-solved" },
  hot: { symbol: "▲▲", className: "bg-tier-hot" },
  warm: { symbol: "▲", className: "bg-tier-warm" },
  cold: { symbol: "▼", className: "bg-tier-cold" },
};

export const TIER_BORDER: Record<Tier, string> = {
  solved: "border-tier-solved",
  hot: "border-tier-hot",
  warm: "border-tier-warm",
  cold: "border-tier-cold",
};

export function TierBadge({ tier }: { tier: Tier }) {
  const { symbol, className } = STYLE[tier];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink ${className}`}
    >
      <span aria-hidden="true">{symbol}</span>
      {en.tiers[tier]}
    </span>
  );
}
