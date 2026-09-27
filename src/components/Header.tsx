import { en } from "@/lib/i18n/en";

export function Header({ onHelp }: { onHelp: () => void }) {
  return (
    <header className="flex h-14 items-center justify-between">
      <h1 className="flex items-center gap-2 font-typewriter text-xl font-bold tracking-tight">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="10" cy="10" r="6.5" />
          <path d="M15 15l6 6" strokeLinecap="round" />
        </svg>
        {en.appName}
      </h1>
      <button
        type="button"
        onClick={onHelp}
        aria-label={en.header.help}
        className="grid size-11 place-items-center rounded-full border border-border text-lg font-semibold text-muted hover:text-fg"
      >
        ?
      </button>
    </header>
  );
}
