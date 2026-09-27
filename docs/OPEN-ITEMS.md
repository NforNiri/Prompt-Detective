# Open items

Last updated: 2026-09-27 (after Day 3). Close items by deleting them or moving them to "Done".

## Decisions needed (Niri)

| Item | Options | Notes |
|---|---|---|
| Public repo exposes all answers | Make repo private until after launch / keep future puzzles out of git / accept | `content/puzzles/*.json` holds every answer through Nov 5. Already in git history, so only going private hides them. |
| Live Vercel page shows "Couldn't load today's case" | Show a placeholder in production until Oct 4 / leave it | Production has no env vars yet and no puzzle exists for real dates before launch. Fixed for real on Day 7. |
| Project lives in OneDrive | Move to e.g. `C:\dev\prompt-detective` / stay | OneDrive truncated the 106 MB Next binary during a reinstall (dev server would not start). A plain folder move; git does not care. |

## Content

| Item | Due | Notes |
|---|---|---|
| Image #25 (mermaid) | Before Oct 28 | Missing. The zip's 0025 was #26's image, renamed. |
| Images #27 to #33 | Oct 30 to Nov 5 | Not generated yet (Nano Banana daily limit). |
| Regenerate #24 (gorilla, graffiti) | Before Oct 27 | QA fail: no gym visible, and the background is giant graffiti letters. |
| Regenerate #14 (blacksmith, cubism) | Before Oct 17 | QA weak: reads as oil painting, not cubism. Saturday puzzle, so the style must be fair. |
| Puzzles 34 to 60 | Runbook Day 4 | Spec prompt batches 4 to 6, then split and validate. |
| Images 31 to 60 | Runbook Day 5 | Then QA per docs/04-CONTENT-PIPELINE.md. |
| Puzzle 0002 prompt says "pixar style" | Any time | The pipeline rules say no brands. Low risk; consider "animated movie style 3d render". |

## Checks only Niri can do

- Day 3 acceptance on a real phone: open http://192.168.0.70:3000 on the same Wi-Fi (allow Node through Windows Firewall on private networks if it does not load).
- Sign the scope doc: add "LOCKED" and the date to docs/00-SCOPE.md.
- Install the Playwright browser before Day 6: `npx playwright install chromium`.

## Data hygiene before launch

- `guess_log` holds test rows from curl and UI play (all dated before Oct 4). Delete them before launch, or filter by `created_at >= '2026-10-04'` in analysis.
- `puzzles` rows 1 to 3 use `dev/` image paths from the seed script. The Day 5 upload script overwrites them.
- Day 7: set production env vars in Vercel, with a new `IP_HASH_SALT` (not the local one). Leave `NEXT_PUBLIC_DEV_TODAY` unset in production.

## Spec changes made during the build (for review)

All are written into docs/02-TECH-SPEC.md or the content pipeline doc.

- Guesses and normalization allow digits ("3d render", "8-bit").
- `puzzles.prompt` column, needed by /api/reveal. The migration also creates the `puzzles` bucket.
- `NEXT_PUBLIC_DEV_TODAY` pins the date in development only.
- Saved game adds `hintAt`, `solved`, `hintLetter`, `reveal` (and `startedAt` on Day 4) to the spec's client state.
- Images are 16:9, not square.
- Vercel Web Analytics added for page views and Web Vitals. Game events stay in PostHog.
- Game address is prompt-detective-puce.vercel.app (the plain subdomain belongs to someone else).

## Known tooling issues

- npm prunes rolldown's platform bindings from package-lock.json on repeat installs (npm/cli#4828). The Windows binding is pinned so local tests work. After adding a package, regenerate the lockfile so it lists all 15 platforms, or CI on Linux will break.
