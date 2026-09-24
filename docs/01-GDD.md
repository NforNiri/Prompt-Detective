# Prompt Detective: One-Page GDD

## Fantasy
"I can read the machine's mind." The player works backwards from an AI image to the words that made it.

## Core loop (about 3 minutes)
Look at the image -> pick a slot -> type a guess -> read the feedback tier -> adjust -> solve all 4 slots or run out of guesses -> see the full prompt -> share.

## Retention loop (daily)
New puzzle at local midnight -> streak at risk -> play -> share grid -> friends click -> they get a streak -> repeat.
Main hooks: streak loss aversion, a result that is fun to share, and one puzzle a day so players always want more.

## Rules
1. Each puzzle has one image generated from this template:
   `[WHO] [DOING] in/at [WHERE], [STYLE]`
   Example: "a fox | playing chess | on a frozen lake | ukiyo-e woodblock print"
2. The 4 slots are shown as empty word tiles under the image.
3. The player has 10 guesses shared across all slots.
4. A guess targets one slot. The server returns one tier:
   - SOLVED: matches an accepted answer (lemmatized, typo tolerant). The tile locks in green.
   - HOT: very close in meaning. Orange.
   - WARM: related. Yellow.
   - COLD: unrelated. Grey.
5. Hint (once per puzzle): reveals the first letter of the chosen slot and costs 1 guess.
6. Win = all 4 slots solved within budget. Loss = budget runs out. Either way, the full prompt is revealed.
7. A repeated identical guess on the same slot is rejected and does not cost a guess.

## Why the slot structure (design rationale)
Free-text prompt guessing fails because there are unlimited valid descriptions. Fixed slots turn an open problem into 4 small closed ones. Each slot has its own difficulty, which gives a natural ramp inside one puzzle:
- WHO: easy. It is the most visible element and teaches the mechanic.
- DOING: medium.
- WHERE: medium.
- STYLE: hard. This is where expert players stand out, and it creates the "how did you get that" moments people share.

## Guess economy
- 4 slots, and a perfect game uses 4 guesses. The budget of 10 leaves 6 for mistakes.
- The hint costs 1 guess, a real trade-off at 2 guesses left.
- Target: an average winning game uses 6 to 8 guesses. Tune the budget and the tier lists from playtest data.

## Weekly difficulty curve
Like the NYT puzzles, difficulty rises through the week. Israeli week, Sunday start.
| Day | Difficulty | STYLE slot |
|---|---|---|
| Sun | 1 | Very common (photo, cartoon, watercolor) |
| Mon | 2 | Common |
| Tue | 2 | Common |
| Wed | 3 | Mid (oil painting, pixel art, claymation) |
| Thu | 3 | Mid |
| Fri | 4 | Niche (ukiyo-e, art nouveau, synthwave) |
| Sat | 5 | Niche, plus a harder WHO or DOING |
Weekend players have more time, so they get the hardest puzzles.

## Share grid
```
Prompt Detective #12  7/10
WHO    [green]
DOING  [yellow][green]
WHERE  [grey][yellow][orange][green]
STYLE  [grey][hint][green]
prompt-detective-puce.vercel.app
```
The free Vercel subdomain is used because the budget is $0. `prompt-detective.vercel.app` belongs to another project, so the game lives at `prompt-detective-puce.vercel.app`. A custom domain is optional later.
Each bracket is a colored square emoji in the real output. The grid shows how the player got there without spoiling the answers.

## UX flow
First visit: how-to-play modal (3 panels, skippable) -> puzzle.
Returning visit: straight to today's puzzle, or to the end screen if already played.
End screen: result, full prompt, stats, share button, next puzzle countdown.

## Tone and look
Noir detective with a light touch. Dark background, a magnifying glass motif, a typewriter font for the answer tiles and a clean sans-serif for the UI. The image is the hero. Everything else stays quiet.

## Accessibility
Tier colors always come with a text label or icon so no one depends on color alone. Full keyboard play. Minimum tap target 44px. Respect prefers-reduced-motion.
