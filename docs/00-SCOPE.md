# Prompt Detective: Scope (v1.0)

Owner: Niri Levy
Build window: 7 days
Status: LOCKED on Day 1. Changes go to the kill list or to v1.1. Nothing gets added during the build.

## One line
A daily web puzzle. Every day there is one AI image. Work out the 4 hidden words of the prompt that made it before your guesses run out, then share your result grid.

## Why this project exists (portfolio goal)
Show an Israeli mobile F2P hiring manager four things:
1. I can design a core loop and a retention loop, and ship both.
2. I can run a content pipeline (60 puzzles made in one batch, with QA).
3. I instrument before I launch, and I make decisions from data (funnel, D1/D7, an A/B test).
4. I ship on time by cutting scope on purpose (this document).

## Target player
Casual players who already play daily games (Wordle, Connections, Framed, Contexto). Plays on mobile, in portrait, 3 to 5 minutes a day, often from a link shared in WhatsApp.

## MVP feature list (must ship)
1. Daily puzzle: one image, 4 slots (WHO, DOING, WHERE, STYLE), a shared budget of 10 guesses.
2. Guess feedback tiers: SOLVED, HOT, WARM, COLD. Typo tolerance on the answer word.
3. Hint: reveals the first letter of one slot. Costs 1 guess. One hint per puzzle.
4. End screen: win or loss, full prompt revealed, countdown to the next puzzle.
5. Share: a colored square grid with the puzzle number and the URL. Uses the Web Share API, falls back to copying to the clipboard.
6. Local stats: games played, win percentage, current streak, max streak, guess distribution.
7. How-to-play modal shown on the first visit.
8. Analytics: PostHog events, funnel, retention, and a feature flag for the A/B test.
9. Server-side answer checking. Answers never reach the client until the puzzle ends.
10. Debug panel (?debug=1) with a live event log.

## Kill list (explicitly NOT in v1.0)
- Accounts and login. Stats stay on the device.
- Leaderboards.
- Archive of past puzzles. It would hurt daily scarcity. Candidate for v1.2.
- Hebrew content. The UI is i18n-ready from day 1. Hebrew puzzles ship in week 5 as v1.1.
- Image blur or tile reveal mechanic.
- Sound and music.
- Native app. PWA install only.
- User-submitted puzzles.
- Multiplayer or versus modes.

## Success metrics (hypotheses, measured by end of week 5)
| Metric | Target | Why |
|---|---|---|
| Unique players | 500 | Enough for directional retention data |
| Completion rate (finished / started) | 60% to 75% | Below 60 means too hard, above 75 means too easy |
| Win rate | 55% to 70% | Wordle-like satisfaction band |
| D1 retention | 25% or more | Benchmark for daily word games with organic traffic |
| D7 retention | 10% or more | Shows the streak loop works |
| Share rate (share clicks / completions) | 8% or more | Main acquisition channel |

These are targets, not benchmarks from a source. The case study reports actual results against them, honestly.

## A/B test (starts week 5)
- Variable: guess budget, 10 (control) vs 8 (variant).
- Primary metric: D1 retention. Guardrail: completion rate.
- Honest caveat: with about 500 players the test is underpowered for small effects. The case study includes the power calculation and treats the result as directional. Knowing this is part of what the project demonstrates.

## Risks
| Risk | Mitigation |
|---|---|
| Guessing exact words is frustrating (the synonym problem) | Curated accepted-answer lists plus HOT/WARM tiers. Playtest on day 6. |
| The image does not clearly show a slot | QA gate in the content pipeline. Every image is checked against its 4 slots. |
| Another game already uses the name | Day 1 name and domain check. Backup names: Promptography, Four Words, Reverse Prompt. |
| Players cheat by reading network calls | Server-side validation. Answers are released only when the puzzle ends. |
| Day 7 slips | Day 6 is a feature freeze. Day 7 is launch and tracking checks only. |

## Definition of done
- Live on a public Vercel URL.
- 60 puzzles loaded and QA'd.
- PostHog confirms all events from a real phone.
- Lighthouse mobile performance 90 or higher.
- The repo is public on GitHub with a README, a screenshot and a link to the live game.
