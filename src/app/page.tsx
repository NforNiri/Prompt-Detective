import { en } from "@/lib/i18n/en";

// Placeholder until the playable game lands (runbook Day 3).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{en.appName}</h1>
      <p className="text-muted">{en.tagline}</p>
      <p className="text-sm text-muted">{en.comingSoon}</p>
    </main>
  );
}
