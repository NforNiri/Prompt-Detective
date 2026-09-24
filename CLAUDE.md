# CLAUDE.md: Prompt Detective

Daily AI image puzzle. Players guess the 4 hidden prompt words (WHO, DOING, WHERE, STYLE) within a shared budget of 10 guesses.

## Read first
- docs/00-SCOPE.md: what is in and out. The kill list is binding. Do not build anything on it.
- docs/01-GDD.md: rules and feel.
- docs/02-TECH-SPEC.md: architecture, data model, API contracts, events. Follow it exactly, and ask before deviating.
- docs/03-RUNBOOK.md: today's tasks and acceptance criteria.

## Commands
- `npm run dev`: local dev
- `npm run test`: Vitest unit tests
- `npm run test:e2e`: Playwright smoke test
- `npm run lint` and `npm run typecheck`
- `npm run content:validate`: validate content/puzzles
- `npm run content:upload -- --dry-run`: upload puzzles

## Rules
- TypeScript strict. No `any`. Shared types live in `src/lib/game/types.ts`.
- `src/lib/game/*` is pure: no fetch, no storage, no Date.now() without injection. Everything there has unit tests.
- Answers never reach the client before the game ends. Never add slots data to the puzzle endpoint response.
- The Supabase service role key is used only in `src/lib/supabase-server.ts`, and only from route handlers.
- Validate every route input with zod. Return errors as `{ error: { code, message } }`.
- Wrap every localStorage access in try/catch. The game must work with storage blocked.
- Use `createLogger(namespace)` from `src/lib/logger.ts` for all logging, with no bare console.log. Log state transitions, API calls with timing, and flag values at debug level.
- Send analytics only through the typed `track()` in `src/lib/analytics.ts`. Event names and properties must match the spec table.
- Mobile first. Design at 375px width first. Tap targets at least 44px.
- Accessibility: tier state is never shown by color alone. Full keyboard play.
- UI strings live in `src/lib/i18n/en.ts`, never hardcoded, so Hebrew (RTL) can be added in v1.1 without refactoring. Use logical CSS properties (ms-, me-, ps-, pe-) instead of left and right.
- Small commits with conventional messages (feat:, fix:, test:, chore:, docs:).

## Definition of done for any task
Typecheck, lint and unit tests pass. The behavior is checked in the browser at 375px. The DebugPanel shows the new logs and events.

## Next.js 16 notes
@AGENTS.md
