# Prompt Detective: Content Pipeline

Goal: 60 QA'd puzzles before launch, which covers about 8 weeks of runway. Budget: about 5 hours total, spread over days 2 to 5.

## Pipeline
```
1. SPEC     Claude drafts puzzle JSON in batches of 10       (content/puzzles/NNNN.json)
2. LINT     scripts/validate-puzzles.ts                      (schema + rules below)
3. RENDER   Nano Banana generates the image from the prompt  (content/images/NNNN.png)
4. QA       Human checks the image against the 4 slots       (pass / regenerate / rewrite slot)
5. SHIP     scripts/upload-puzzles.ts                        (webp -> bucket -> upsert row)
```
Track the QA reject rate per batch. It is a real content ops metric for the case study, for example "first-pass image acceptance rose from 60% to 85% after prompt template v2".

## Step 1: Claude spec prompt (paste into Claude, one batch of 10 at a time)
```
You are the content designer for Prompt Detective, a daily puzzle where players
guess the 4 hidden words of an AI image prompt.
Template: "[WHO] [DOING] in/at [WHERE], [STYLE]".

Generate puzzles {START} to {END} as a JSON array matching this schema exactly:
{ "id": int, "publishDate": "YYYY-MM-DD", "difficulty": 1-5, "locale": "en",
  "prompt": string, "slots": { "who"|"doing"|"where"|"style":
  { "answer": string, "accepted": string[], "hot": string[], "warm": string[] } } }

Rules:
- publishDate starts at {START_DATE} (a Sunday) and increases by 1 day per puzzle.
- difficulty follows the weekday: Sun 1, Mon 2, Tue 2, Wed 3, Thu 3, Fri 4, Sat 5.
- STYLE: Sun very common (photo, cartoon, watercolor). Wed-Thu mid (oil painting,
  pixel art, claymation). Fri-Sat niche (ukiyo-e, art nouveau, synthwave, bauhaus).
- WHO must be clearly visible and concrete (an animal, a person type, an object).
  No real people, no brands, no copyrighted characters.
- DOING must be something an image can show in one frame.
- accepted: 2 to 6 entries. The answer itself, common synonyms, and short forms
  a player would type. Include singular only; the engine handles plurals.
- hot: 3 to 8 near-misses. warm: 5 to 12 related words.
- No word may appear in more than one tier of the same slot.
- Don't reuse a WHO or STYLE answer within any 14-day window.
- Mix themes: animals, food, jobs, sports, fantasy, sci-fi, everyday life.
- prompt = the full image prompt, ending with: "no text, no letters, no watermark".
Return only the JSON array.
```
Then split the array into one file per puzzle with a small script (Claude Code writes it on day 2).

## Step 3: Nano Banana render
Image prompt = the `prompt` field. The "no text" suffix matters: text in the image would leak the answers.
Output: square, 1024x1024 or larger.

Access, with $0 budget: generate in the Gemini app manually and save as `content/images/NNNN.png`. At about 2 minutes per image including retries, 60 images take about 2 hours. Split this across two evenings. If the Gemini API is available on your current plan, Claude Code can write a batch script instead. Check the current model name in Google AI Studio before scripting.

## Step 4: QA checklist (per image, about 30 seconds)
- [ ] WHO is obvious within 2 seconds.
- [ ] DOING is readable from the pose or action.
- [ ] WHERE is identifiable and not hidden by the subject.
- [ ] STYLE is actually the named style, not a generic "digital art" look.
- [ ] No text, letters, logos or watermarks.
- [ ] Nothing disturbing, and nothing that looks like a real person.
Fail -> regenerate up to 2 times -> if it still fails, rewrite the weakest slot (usually STYLE) and regenerate.

## Validator rules (scripts/validate-puzzles.ts)
Errors that block upload:
- Schema mismatch (zod, shared with the app types).
- `answer` missing from `accepted` after normalization.
- Any word in two tiers of the same slot after normalization.
- Tier sizes outside the ranges above.
- Duplicate `id` or `publishDate`, or a gap in the dates.
- Difficulty does not match the weekday.
- Image file missing for a puzzle.
Warnings:
- WHO or STYLE repeated within 14 days.
- An accepted entry longer than 3 words (players rarely type that much).
Output: a colored console table (puzzle, status, issues) and a non-zero exit code on errors, so it can run in CI.

## Step 5: Upload (scripts/upload-puzzles.ts)
- Converts PNG to WebP (sharp, quality 82, max 1024px, target under 200KB).
- Uploads to bucket `puzzles/` as `{uuid}.webp`.
- Upserts the row by `id`. It is idempotent: re-running updates the row and replaces the image.
- Supports `--dry-run` and `--only=0012,0013`.

## Weekly content ops (after launch, 30 minutes on Sundays)
1. Query `guess_log` for the top 20 COLD guesses per slot from the past week.
2. Promote real near-misses to HOT or WARM, and real synonyms to ACCEPTED, in the puzzle source files for similar future puzzles.
3. Log each change in `docs/CONTENT-LOG.md`. This log becomes a key case study artifact: design decisions backed by player data.
