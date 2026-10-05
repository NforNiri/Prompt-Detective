# Open items

Last updated: 2026-10-05 (after Day 4; launch moved to Sunday Oct 11). Close items by deleting them or moving them to "Done".

## Decisions needed (Niri)

| Item | Options | Notes |
|---|---|---|
| Public repo exposes all answers | Make repo private until after launch / keep future puzzles out of git / accept | `content/puzzles/*.json` holds every answer through Nov 12. Already in git history, so only going private hides them. |
| Live Vercel page shows "Couldn't load today's case" | Show a placeholder in production until Oct 11 / leave it | Production has no env vars yet and no puzzle exists for real dates before launch. Fixed for real on Day 7. |
| Project lives in OneDrive | Move to e.g. `C:\dev\prompt-detective` / stay | OneDrive truncated the 106 MB Next binary during a reinstall (dev server would not start). A plain folder move; git does not care. |

## Content

| Item | Due | Notes |
|---|---|---|
| Puzzle 0002 prompt says "pixar style" | Any time | The pipeline rules say no brands. Low risk. |
| Upload puzzles 4 to 60 | Runbook Day 7 | All 60 images exist and pass strict validation. Rows 1 to 3 are already uploaded. |

## Checks only Niri can do

- Day 4 acceptance: play a full game on localhost with PostHog open at Activity > Live events and confirm every event arrives; paste a share result into WhatsApp and check the grid.
- Before week 5 (A/B test): create the `guess-budget` multivariate flag in PostHog with variants `control` and `short`. Until it exists, every game uses 10 guesses (the code falls back after 1.5 s at most).

- Day 3 acceptance on a real phone: open http://192.168.0.70:3000 on the same Wi-Fi (allow Node through Windows Firewall on private networks if it does not load).
- Sign the scope doc: add "LOCKED" and the date to docs/00-SCOPE.md.
- Install the Playwright browser before Day 6: `npx playwright install chromium`.

## Data hygiene before launch

- `guess_log` holds test rows from curl and UI play (all dated before Oct 11). Delete them before launch, or filter by `created_at >= '2026-10-11'` in analysis.
- Rows 1 to 3 now use real uploads (UUID filenames). Three orphaned placeholder files remain in the bucket under `dev/` (0001-23f16b4f, 0002-0f5a9b2e, 0003-2eb5b09f); delete them in Supabase Storage. The seed script now cleans up after itself.
- Day 7: set production env vars in Vercel, with a new `IP_HASH_SALT` (not the local one). Leave `NEXT_PUBLIC_DEV_TODAY` unset in production.

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

## Known tooling issues

- npm prunes rolldown's platform bindings from package-lock.json on repeat installs (npm/cli#4828). The Windows binding is pinned so local tests work. After adding a package, regenerate the lockfile so it lists all 15 platforms, or CI on Linux will break.
