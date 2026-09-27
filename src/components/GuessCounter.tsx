import { en } from "@/lib/i18n/en";

export function GuessCounter({ left, total }: { left: number; total: number }) {
  return (
    <div className="flex items-center justify-between gap-3" aria-label={en.counter.left(left, total)} role="group">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted">{en.counter.label}</span>
      <span className="flex items-center gap-2">
        <span className="flex gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`size-2 rounded-full ${i < left ? "bg-accent" : "bg-border"}`} />
          ))}
        </span>
        <span className="font-typewriter text-lg font-bold tabular-nums" aria-hidden="true">
          {left}
        </span>
      </span>
    </div>
  );
}
