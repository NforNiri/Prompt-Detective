# Open items

Last updated: 2026-10-06 (Day 6 checks done; playtest pending; launch Sunday Oct 11). Close items by deleting them or moving them to "Done".

## Decisions needed (Niri)

| Item | Options | Notes |
|---|---|---|
| Public repo exposes all answers | Make repo private until after launch / keep future puzzles out of git / accept | `content/puzzles/*.json` holds every answer through Dec 9. Already in git history, so only going private hides them. |
| Live page says there is no case today until Oct 11 | Show a "first case opens Sunday" placeholder / leave it | Production works (env vars set, functions in Frankfurt); there is simply no puzzle before launch. |
| Project lives in OneDrive | Move to e.g. `C:\dev\prompt-detective` / stay | OneDrive truncated the 106 MB Next binary during a reinstall (dev server would not start). A plain folder move; git does not care. |

## Day 6

- Playtest with 5 people, then fill in docs/PLAYTEST-01.md (template ready). Claude fixes the top 3.
- Preview link for testers: https://prompt-detective-git-preview-niris-projects.vercel.app (behind Vercel login; see the playtest doc).

## Content

| Item | Due | Notes |
|---|---|---|
| Puzzle 0002 prompt says "pixar style" | Any time | The pipeline rules say no brands. Low risk. |
| Upload puzzles 4 to 60 | Runbook Day 7 | All 60 images exist and pass strict validation. Rows 1 to 3 are already uploaded. |

## Checks only Niri can do

- Day 4 acceptance: play a full game on localhost with PostHog open at Activity > Live events and confirm every event arrives; paste a share result into WhatsApp and check the grid.
- Before week 5 (A/B test): create the `guess-budget` multivariate flag in PostHog with variants `control` and `short`. Until it exists, every game uses 10 guesses (the code falls back after 1.5 s at most).

- Day 3 acceptance on a real phone: play the preview link on mobile data and install it to the home screen.
- Sign the scope doc: add "LOCKED" and the date to docs/00-SCOPE.md.

## Data hygiene before launch

- `guess_log` holds test rows from curl and UI play (all dated before Oct 11). Delete them before launch, or filter by `created_at >= '2026-10-11'` in analysis.
- The e2e test writes guess_log rows under device `00000000-0000-4000-8000-00000000e2e0`. Exclude that device in analysis; it keeps writing rows after launch whenever the test runs.
- Three orphaned placeholder files under `dev/` in the bucket (0001-23f16b4f, 0002-0f5a9b2e, 0003-2eb5b09f): delete them in Supabase Storage if not done yet.

## Spec changes made during the build (for review)

All are written into docs/02-TECH-SPEC.md or the content pipeline doc.

- Guesses and normalization allow digits ("3d render", "8-bit").
- `puzzles.prompt` column, needed by /api/reveal. The migration also creates the `puzzles` bucket.
- `NEXT_PUBLIC_DEV_TODAY` pins the date in dev, local production builds and Vercel previews; never on Vercel production.
- Saved game adds `hintAt`, `solved`, `hintLetter`, `reveal` and `startedAt` to the spec's client state.
- `share_clicked.result` values defined as shared/copied/cancelled/failed.
- PostHog runs with surveys and external scripts off, and uses the device id as distinct_id so guess_log and analytics can be joined.
- Images are 16:9, not square.
- Vercel Web Analytics added for page views and Web Vitals (renders only on Vercel). Game events stay in PostHog.
- The home page renders per request with today's puzzle image in the HTML (visitor timezone from Vercel's header). Lighthouse mobile went from 75 to 93-95.
- PostHog SDK loads at idle; the budget flag comes from a direct /flags request. Zod schemas moved to schemas.ts; the browser uses zod/mini.
- Game address is prompt-detective-puce.vercel.app (the plain subdomain belongs to someone else).
- Vercel functions run in Frankfurt (vercel.json), next to the Supabase database.
- CSP allows inline scripts instead of using nonces (nonces need a proxy on every request). The spec said "strict CSP".

## Known tooling issues

- npm prunes rolldown's platform bindings from package-lock.json on repeat installs (npm/cli#4828). The Windows binding is pinned so local tests work. After adding a package, regenerate the lockfile so it lists all 15 platforms, or CI on Linux will break.
