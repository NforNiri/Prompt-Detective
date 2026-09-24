# Prompt Detective: 7-Day Runbook

Calendar: Day 1 = Sunday Sep 27, 2026. Day 7 = Saturday Oct 3. Puzzle #1 goes live Sunday Oct 4 (difficulty 1, the easiest day, which suits launch day).
Load: about 5 hours per day. Each day lists HUMAN tasks (you), CLAUDE CODE sessions (paste the prompt), and ACCEPTANCE criteria. Don't start the next day until today's acceptance criteria pass. If a day slips, cut from that day's "stretch" line, never from launch.

---

## Day 1 (Sun): Foundations and game core
HUMAN (1.5h)
1. Name check: search Google, itch.io, the App Store and Product Hunt for "Prompt Detective" and for similar games such as "guess the prompt" dailies. Write down 3 competitors and how we differ (slot structure, tiers, weekly difficulty curve). This becomes the competitor section of the case study. If the name is taken, pick a backup name from the scope doc now.
2. Create the public GitHub repo `NforNiri/prompt-detective`. Copy `CLAUDE.md`, `docs/` and `content/` into it.
3. Create a Supabase project in region eu-central (Frankfurt, closest to Israel). Create a PostHog project on EU cloud. Create a Vercel project linked to the repo. Put the keys in `.env.local` (never commit it).
4. Sign the scope doc. Seriously, write "LOCKED" and the date in it and commit it.

CLAUDE CODE: session 1
```
Read CLAUDE.md and all files in docs/. Then:
1. Scaffold Next.js (App Router, TypeScript strict, Tailwind, ESLint) in this repo
   without overwriting docs/, content/, CLAUDE.md.
2. Add Vitest (with coverage), Playwright, zod, and npm scripts exactly as listed in CLAUDE.md.
3. Implement src/lib/logger.ts per the tech spec (namespaced, styled console output,
   debug level gated by ?debug=1 or dev, 200-entry ring buffer with a subscribe() API).
4. Implement the pure game core in src/lib/game/: types.ts, normalize.ts, match.ts,
   share.ts, stats.ts, date.ts, following the "Matching engine", "Client state" and
   "Tests" sections of docs/02-TECH-SPEC.md.
5. Write the unit tests listed in the spec. Use content/puzzles/0001.json as a fixture.
Stop when typecheck, lint and tests pass with coverage of src/lib/game at 90% or more.
Show me the coverage table.
```
ACCEPTANCE: `npm run test` is green, game core coverage is 90% or higher, and `matchGuess("Dogs", who)` returns solved for puzzle 0001.

---

## Day 2 (Mon): Backend and content specs
HUMAN (2h)
1. Run the Claude spec prompt from docs/04-CONTENT-PIPELINE.md three times: puzzles 4 to 13, 14 to 23 and 24 to 33 (0001 to 0003 already exist). Save the output to `content/raw/batch-01.json` and so on.
2. Skim each batch. Throw out anything boring. Boring puzzles kill streaks faster than hard ones.

CLAUDE CODE: session 2
```
Read CLAUDE.md and docs/02-TECH-SPEC.md.
1. Create supabase/migrations/0001_init.sql exactly as in the spec. Apply it to my
   project (I'll paste it into the SQL editor if the CLI isn't linked, so print it).
2. Implement src/lib/supabase-server.ts (service role, server only, throws if it's
   imported on the client).
3. Implement the route handlers GET /api/puzzle, POST /api/guess, POST /api/hint and
   POST /api/reveal with zod validation, the date window check, salted IP hashing,
   the rate limit in src/lib/rate-limit.ts (30 per minute per ip_hash, via guess_log),
   guess_log inserts, and one JSON log line per request.
4. Write scripts/split-batch.ts (content/raw/*.json -> content/puzzles/NNNN.json) and
   scripts/validate-puzzles.ts with every rule in docs/04-CONTENT-PIPELINE.md, reusing
   the zod schema and normalize() from src/lib/game.
5. Add route tests with a mocked Supabase client for: happy path, bad input, future
   date, rate limit, and a check that the puzzle response never contains answers.
Show me curl examples for each route against local dev.
```
ACCEPTANCE: `content:validate` passes on 33 puzzles. The GET puzzle response contains no answer strings (a test asserts this). A curl guess of "dog" on the WHO slot of puzzle 1 returns solved, and "wolf" returns warm.

---

## Day 3 (Tue): Playable game UI
HUMAN (2.5h)
1. Render images for puzzles 1 to 30 in Nano Banana. Save them as `content/images/NNNN.png`.
2. Don't QA yet. Just generate. QA is batched tomorrow, because context switching is expensive.

CLAUDE CODE: session 3
```
Read CLAUDE.md, docs/01-GDD.md and docs/02-TECH-SPEC.md.
Build the playable game on src/app/page.tsx:
1. A useGame hook built as a reducer state machine:
   loading -> playing -> (won | lost), with actions SELECT_SLOT, SUBMIT_GUESS,
   GUESS_RESULT, USE_HINT, HINT_RESULT, REVEAL. Persist to localStorage per the spec
   with try/catch and an in-memory fallback. Log every transition with createLogger("game").
2. Components: ImageCard, SlotTiles (tap to select a slot, shows tier state with a
   label plus color), GuessInput (autofocus, enter to submit, rejects duplicate guesses
   without charging a guess), GuessHistory, HintButton, a guesses-left counter, and HowToPlayModal
   (3 panels, shown on first visit only).
3. Put all strings in src/lib/i18n/en.ts. Use logical CSS properties only.
4. Mobile first at 375px, dark noir theme, typewriter font for the tiles (use a
   Google Font through next/font).
Seed local dev with puzzles 0001 to 0003 and placeholder images so I can play end to end.
```
ACCEPTANCE: You can play a full game at 375px on your phone over the local network. Reloading mid-game restores state. Blocking storage in the browser does not crash the game.

---

## Day 4 (Wed): End screen, share, stats, analytics
HUMAN (2h)
1. Run the spec prompt for puzzles 34 to 60 (3 batches).
2. QA images 1 to 30 with the checklist. Regenerate failures. Record the reject rate in `docs/CONTENT-LOG.md`.

CLAUDE CODE: session 4
```
Read CLAUDE.md and docs/02-TECH-SPEC.md.
1. EndScreen: result, full prompt from /api/reveal, a 4-slot recap, a countdown to local
   midnight, and a share button.
2. ShareButton: builds the text with share.ts, uses navigator.share when available and
   falls back to clipboard with a "Copied" toast. Tracks share_clicked with method.
3. StatsModal: played, win %, current and max streak, and a guess-distribution bar chart
   (plain divs, no chart library).
4. src/lib/analytics.ts: a typed track() over posthog-js, one type per event from the spec
   table. Init with EU host, no autocapture, anonymous. Read the "guess-budget" flag once
   per puzzle and store it in game state. Fall back to 10 if the flag fails to load in 1.5s.
5. DebugPanel (?debug=1): live logger ring buffer, current game state JSON, flag value,
   the last 5 API responses with timing, and a "reset today" button for testing.
Wire every event from the spec table. Add unit tests for the track() payload builders.
```
ACCEPTANCE: A full game fires every spec event in the PostHog live view. The share text pastes correctly into WhatsApp. `?debug=1` shows live logs.

---

## Day 5 (Thu): Look, feel and assets
HUMAN (3h)
1. Nano Banana assets: a logo mark (magnifying glass plus a pixel motif), an OG image at 1200x630, PWA icons at 192 and 512, and a background texture. Keep one consistent art direction prompt and save it in the docs so the trailer and the portfolio page match later.
2. Render images for puzzles 31 to 60.

CLAUDE CODE: session 5
```
Read CLAUDE.md.
1. Polish: tile flip animation on each result, a shake on COLD, a stamp effect on SOLVED,
   all disabled under prefers-reduced-motion. A satisfying win moment that is visual only, no sound.
2. PWA: manifest, icons from public/brand/, theme color, installable. No offline caching
   of puzzle data.
3. SEO and sharing: metadata, an OG image, and a Twitter card.
4. Accessibility pass: keyboard-only play, focus rings, aria-live announcements for
   guess results, contrast of 4.5:1 or better on all text. Fix anything under WCAG AA.
5. Implement scripts/upload-puzzles.ts per docs/04-CONTENT-PIPELINE.md (sharp -> webp,
   uuid filename, idempotent upsert, --dry-run, --only).
Run Lighthouse mobile and report the scores.
```
ACCEPTANCE: Lighthouse mobile shows performance 90 or higher and accessibility 95 or higher. The app installs as a PWA on Android. The upload dry run lists 60 puzzles.

---

## Day 6 (Fri): FEATURE FREEZE. Playtest and harden
From now on, nothing new gets built. Only fixes.

HUMAN (3h)
1. QA images 31 to 60.
2. Playtest with 5 people who didn't build the game. Use a mix of people who play Wordle and people who don't.
   Script: send the link and say only "play today's puzzle, think out loud". Watch or screen-record. Do not help.
   Record: time to first guess, where they hesitate, which slot they try first, what they say at the end screen, and whether they share without being asked.
3. Write the top 5 issues in `docs/PLAYTEST-01.md`, ranked by severity times frequency. Fix the top 3.

CLAUDE CODE: session 6
```
Read CLAUDE.md and docs/PLAYTEST-01.md.
1. Fix the top 3 playtest issues. Explain each fix in one line in the playtest doc.
2. Playwright smoke test at a mobile viewport per the spec (seeded test puzzle, winning
   game, share text on the clipboard).
3. Security headers and CSP in next.config per the spec. Verify there are no CSP violations
   in the console with PostHog and Supabase images loading.
4. Audit: grep the client bundle for any answer strings from the seeded puzzle and fail
   if one is found. Add this as a test script.
```
ACCEPTANCE: The e2e test is green. There are no CSP errors. The bundle audit passes. The playtest doc lists problem, evidence and fix for each issue.

---

## Day 7 (Sat): Ship
HUMAN (3h)
1. Set production env vars in Vercel. Deploy.
2. Run `content:validate`, then `content:upload` for all 60 puzzles.
3. On your real phone, on mobile data, play the test puzzle and confirm every event in PostHog live view.
4. Build the PostHog dashboards: funnel, daily retention, per-slot solve rate, guesses-used distribution, share rate. Screenshot them empty. The before and after makes a good case study image.
5. Soft launch: send it to 10 friends tonight for tomorrow's puzzle #1.
6. Draft launch posts for Sunday: a LinkedIn post (a build-in-public angle, which also serves the job hunt), 3 WhatsApp groups, r/WebGames, and r/wordle (read each subreddit's self-promotion rules first).

CLAUDE CODE: session 7
```
Write README.md: a one-line pitch, a screenshot/GIF placeholder, the live link, how to play,
the tech stack, an architecture diagram (mermaid), the key design decisions (link to the ADRs
in docs/02-TECH-SPEC.md), local setup, and the content pipeline. Keep it scannable,
because recruiters will read the first 10 lines only.
Then run a final checklist: typecheck, lint, unit, e2e, bundle audit, Lighthouse, and
report pass/fail for each.
```
ACCEPTANCE: The definition of done from 00-SCOPE.md is met, every item.

---

## After launch (runs in the background during weeks 2 to 4)
- Daily, 5 minutes: check the PostHog funnel and scan guess_log for anything broken.
- Sundays, 30 minutes: the content ops loop from 04-CONTENT-PIPELINE.md.
- Weekly, 15 minutes: add a numbers snapshot to `docs/METRICS-LOG.md`. This log is the spine of the case study.
- Week 5: Hebrew v1.1 and the A/B test start.
