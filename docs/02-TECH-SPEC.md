# Prompt Detective: Tech Spec

## Stack
| Layer | Choice | Cost |
|---|---|---|
| App | Next.js (App Router) + TypeScript (strict) + Tailwind | Free |
| Hosting | Vercel Hobby | Free |
| DB + storage | Supabase free tier (Postgres + public Storage bucket) | Free |
| Analytics + flags | PostHog Cloud free tier | Free |
| Traffic analytics | Vercel Web Analytics (`@vercel/analytics`): page views and Web Vitals only, cookieless. Game events stay in PostHog | Free (Hobby) |
| Validation | zod | Free |
| Tests | Vitest (unit), Playwright (smoke e2e) | Free |

## Architecture
```
Browser (Next.js client)
  |  localStorage: game state per puzzle, stats, deviceId
  |  posthog-js: events + feature flag "guess-budget"
  v
Next.js route handlers on Vercel (server only)
  GET  /api/puzzle?date=YYYY-MM-DD   -> public puzzle data (no answers)
  POST /api/guess                     -> tier for one guess
  POST /api/hint                      -> first letter of one slot
  POST /api/reveal                    -> full answers (end of game)
  |  service role key, server side only
  v
Supabase Postgres (RLS on, zero anon policies) + Storage bucket "puzzles" (public images)
```
Design pattern: a pure-function game core (`src/lib/game/*`) with no I/O, called by thin route handlers. The core is fully unit-testable and can be reused by the Hebrew version and by the content validator script.

## Repo structure
```
prompt-detective/
  CLAUDE.md
  docs/                        00-SCOPE, 01-GDD, 02-TECH-SPEC, 03-RUNBOOK, 04-CONTENT-PIPELINE
  content/
    schema/puzzle.schema.json
    puzzles/0001.json ...      one file per puzzle, source of truth
    images/                    raw generated images (gitignored if large)
  scripts/
    validate-puzzles.ts        schema + overlap + QA checks
    upload-puzzles.ts          optimize image -> upload -> upsert row
  supabase/migrations/0001_init.sql
  src/
    app/
      page.tsx, layout.tsx, globals.css
      api/puzzle/route.ts, api/guess/route.ts, api/hint/route.ts, api/reveal/route.ts
    components/                ImageCard, SlotTiles, GuessInput, GuessHistory, HintButton,
                               EndScreen, StatsModal, HowToPlayModal, ShareButton, Countdown, DebugPanel
    lib/
      game/types.ts, normalize.ts, match.ts, share.ts, stats.ts, date.ts
      logger.ts, analytics.ts, supabase-server.ts, rate-limit.ts, i18n/en.ts
  tests/unit/*.test.ts, tests/e2e/smoke.spec.ts
```

## Data model (supabase/migrations/0001_init.sql)
```sql
create table public.puzzles (
  id            integer primary key,              -- puzzle number (#1, #2 ...)
  publish_date  date not null unique,
  image_path    text not null,                    -- random uuid filename in bucket
  difficulty    smallint not null check (difficulty between 1 and 5),
  slots         jsonb not null,                   -- answers + tiers, server only
  locale        text not null default 'en',
  created_at    timestamptz not null default now()
);

create table public.guess_log (
  id           bigint generated always as identity primary key,
  puzzle_id    integer not null references public.puzzles(id),
  device_id    uuid not null,
  slot         text not null check (slot in ('who','doing','where','style')),
  guess_norm   text not null check (char_length(guess_norm) <= 40),
  tier         text not null check (tier in ('solved','hot','warm','cold')),
  guess_index  smallint not null,
  ip_hash      text not null,
  created_at   timestamptz not null default now()
);
create index guess_log_rate_idx on public.guess_log (ip_hash, created_at desc);
create index guess_log_puzzle_idx on public.guess_log (puzzle_id, slot, tier);

alter table public.puzzles   enable row level security;
alter table public.guess_log enable row level security;
-- No policies on purpose: anon and authenticated roles get nothing.
-- Only the server (service role) reads and writes.
```
`guess_log` is design data as well as telemetry. It powers the "most common wrong guesses" section of the case study and shows which tier lists need tuning.

## Slot JSON shape (inside puzzles.slots, and in content/puzzles/*.json)
```json
{
  "who":   { "answer": "fox", "accepted": ["fox","red fox","vixen"], "hot": ["wolf","coyote","jackal"], "warm": ["dog","animal","cat"] },
  "doing": { "answer": "playing chess", "accepted": ["playing chess","chess","plays chess"], "hot": ["playing a board game","checkers"], "warm": ["playing","thinking","game"] },
  "where": { "answer": "frozen lake", "accepted": ["frozen lake","icy lake","ice"], "hot": ["lake","pond","ice rink"], "warm": ["snow","winter","water"] },
  "style": { "answer": "ukiyo-e", "accepted": ["ukiyo-e","ukiyoe","woodblock","woodblock print","japanese woodblock"], "hot": ["japanese print","japanese art","printmaking"], "warm": ["japanese","print","traditional"] }
}
```

## API contracts
All inputs are validated with zod. Every error returns `{ error: { code, message } }`.

GET `/api/puzzle?date=2026-10-04`
- The date must be within [UTC today - 1, UTC today + 1]. That covers every timezone and blocks fetching future puzzles.
- 200: `{ id, date, imageUrl, difficulty, slots: ["who","doing","where","style"] }`
- 404: no puzzle for that date.

POST `/api/guess`
- Body: `{ puzzleId: int, date: string, slot: SlotKey, guess: string(1..40, /^[\p{L}\p{N}\s'-]+$/u), deviceId: uuid, guessIndex: int(1..12) }`
- Checks: the date window as above, puzzleId must match the date, rate limit of 30 guesses per minute per ip_hash.
- 200: `{ tier: "solved"|"hot"|"warm"|"cold", typo: boolean, answer?: string }`. `answer` is present only when tier is solved.
- 429: rate limited.

POST `/api/hint`
- Body: `{ puzzleId, date, slot, deviceId }`
- 200: `{ firstLetter: "f" }`

POST `/api/reveal`
- Body: `{ puzzleId, date, deviceId }`
- 200: `{ prompt: "a fox playing chess on a frozen lake, ukiyo-e woodblock print", answers: { who, doing, where, style } }`

## Matching engine (src/lib/game/match.ts)
```
normalize(s):
  NFKC -> lowercase -> trim -> strip chars not in [\p{L}\p{N}\s'-] -> collapse spaces
  -> drop a leading article (a|an|the)
singularize(s): naive English rules on the last word: ies->y, (s|x|z|ch|sh)es->base, s->base (not for "ss")
variants(s) = { normalize(s), singularize(normalize(s)) }

matchGuess(guess, slot):
  V = variants(guess)
  if V intersects variants(slot.accepted)                    -> solved
  if any v in V, a in accepted: len(a) >= 5 and lev(v,a) <= 1 -> solved, typo = true
  if V intersects variants(slot.hot)                         -> hot
  if V intersects variants(slot.warm)                        -> warm
  else                                                       -> cold
```
Precompute the variant sets once per puzzle load (a Map per slot) so each lookup is O(1).

## Client state (localStorage, all access wrapped in try/catch)
- `pd:device` = uuid v4
- `pd:game:{puzzleId}` = `{ guesses: [{slot, guess, tier}], hintUsed: slot|null, status: "playing"|"won"|"lost", budget }`
- `pd:stats` = `{ played, won, currentStreak, maxStreak, lastPlayedPuzzleId, distribution: {4..10: n} }`
- If storage is unavailable, the game runs in memory and shows a small "stats won't be saved" note.

## Analytics events (src/lib/analytics.ts, a typed wrapper around posthog-js)
| Event | Properties |
|---|---|
| puzzle_viewed | puzzle_id, difficulty, is_returning, streak |
| guess_submitted | puzzle_id, slot, tier, guess_index, typo |
| hint_used | puzzle_id, slot, guess_index |
| slot_solved | puzzle_id, slot, guess_index |
| puzzle_completed | puzzle_id, result (won/lost), guesses_used, hint_used, budget, duration_sec |
| share_clicked | puzzle_id, method (native/clipboard), result |
| stats_opened | puzzle_id |
| howto_completed | skipped (bool), panel_reached |

Feature flag `guess-budget`: variants `control` (10) and `short` (8). Read the flag once per puzzle and store it in the game state, so a player never switches budgets mid-game.

PostHog dashboards: funnel (viewed -> first guess -> completed -> shared), retention (puzzle_viewed to puzzle_viewed, daily), per-slot solve rate, guesses-used distribution.

## Logging
- `src/lib/logger.ts`: `createLogger(namespace)` returns debug/info/warn/error. The output is styled console logs with a timestamp and namespace. Debug level is on only when `?debug=1` or `NODE_ENV=development`.
- Every log entry is also pushed into a 200-entry ring buffer. `DebugPanel` (shown with ?debug=1) renders it live, together with the current game state, the feature flag value and the last API responses.
- Server side: one JSON log line per request with `{ route, status, ms, puzzleId }`. Never log a raw guess together with the IP, and never log answers.

## Security
- The service role key exists only in server env vars. The client gets only `NEXT_PUBLIC_POSTHOG_KEY` and the host.
- Answers never appear in the client bundle or in the puzzle endpoint.
- Image filenames are random UUIDs, so future images cannot be found by guessing filenames.
- IPs are stored only as a salted SHA-256 hash (`IP_HASH_SALT`).
- Security headers are set in next.config: a strict CSP (self, the Supabase storage host, the PostHog host; Vercel Analytics loads from the same origin at /_vercel/insights), `X-Content-Type-Options`, `Referrer-Policy`.
- Every input is validated with zod. Guesses are length-limited and restricted to letters, digits, spaces, apostrophes and hyphens (digits so answers like "3d render" and "8-bit" work).

## Env vars
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
IP_HASH_SALT=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_LAUNCH_DATE=2026-10-04   # puzzle #1 date, used for display only
```

## Tests
Unit (Vitest), with at least 90% coverage of `src/lib/game`:
- normalize: case, articles, punctuation, unicode, Hebrew letters and digits pass through.
- singularize: foxes, cities, glasses (unchanged), chess (unchanged).
- matchGuess: every tier, typo tolerance on and off by length, hot beats warm, accepted beats hot.
- share: the exact output string for a won game, a lost game, and a game with a hint.
- stats: streak continues, breaks after a skipped day, loss resets the streak, distribution updates.
- date: local date string, the date window check around midnight UTC.
E2E (Playwright, mobile viewport): load a seeded test puzzle, play a winning game, check that the share text reaches the clipboard.

## Architecture decisions (ADRs)
1. Curated tier lists instead of word embeddings. Embeddings need a vector model per language (Hebrew morphology makes that worse) and give noisy scores. Claude-generated lists with human QA are predictable, cost nothing and work in Hebrew. Trade-off: guesses outside the lists come back COLD. `guess_log` shows the missed near-misses so the lists can be expanded weekly.
2. The server validates guesses, the client holds game state. The server does not enforce the guess budget. A cheater can only spoil the puzzle for themselves, and this removes the need for accounts and session storage. The answers are still protected.
3. No accounts in v1. Sign-up friction would hurt D1. Stats live on the device.
4. A Next.js monolith on Vercel. One deploy target and one repo. Nothing in this project needs separate services.
5. The puzzle rolls over at local midnight, like Wordle. The server window of plus or minus 1 day covers every timezone.
