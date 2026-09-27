import { en } from "@/lib/i18n/en";

const ICON_BUTTON = "grid size-11 place-items-center rounded-full border border-border text-muted hover:text-fg";

export function Header({ onHelp, onStats }: { onHelp: () => void; onStats: () => void }) {
  return (
    <header className="flex h-14 items-center justify-between">
      <h1 className="flex items-center gap-2 font-typewriter text-xl font-bold tracking-tight">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="10" cy="10" r="6.5" />
          <path d="M15 15l6 6" strokeLinecap="round" />
        </svg>
        {en.appName}
      </h1>
      <div className="flex gap-2">
        <button type="button" onClick={onStats} aria-label={en.header.stats} className={ICON_BUTTON}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 20V10M12 20V4M19 20v-7" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" onClick={onHelp} aria-label={en.header.help} className={`${ICON_BUTTON} text-lg font-semibold`}>
          ?
        </button>
      </div>
    </header>
  );
}
