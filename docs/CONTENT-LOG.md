# Content log

Content ops decisions and QA results. This log feeds the case study (see docs/04-CONTENT-PIPELINE.md).

## 2026-09-27: Image QA, batch 1 (puzzles 1 to 26)

Source: Nano Banana in the Gemini app, prompt template v1 (the puzzle's `prompt` field, unchanged). 25 images generated before the daily limit. The images came out 16:9 (2752x1536, #1 at 1376x768), not square.

| Result | Puzzles | Count |
|---|---|---|
| Pass | 1, 2, 4 to 13, 15 to 23, 26 | 23 |
| Pass, borderline | 3 (reads more as an old commuter than a fisherman) | (in the 23) |
| Weak, regenerate | 14 (cubism came out as oil painting) | 1 |
| Fail, regenerate | 24 (no gym visible; background is graffiti letterforms) | 1 |

First-pass acceptance: 23 of 25 (92%) counting #14 as a reject, 24 of 25 (96%) if #14 is kept.

Notes:
- Styles that tend to add lettering (comic book, graffiti) need the closest check. #10's neon signs have unreadable glyphs and pass. #24 fails.
- Single-word styles for niche art movements ("cubism") drift toward generic painting. Template v2 idea: "in the style of X, <one visual trait of X>", e.g. "in the style of cubism, geometric fragmented shapes".
- Decision: keep 16:9. A square crop cut clues at the edges (#3, #7, #9, #20, #23). The game card is now 16:9.
- File mix-up: the zip's 0025 was #26's image. Renamed. #25 is still missing.

## 2026-10-05: Reschedule and puzzles 34 to 60

- Launch moved from Oct 4 to Sunday Oct 11. Every publishDate moved +7 days, so weekday difficulty is unchanged. Puzzle 60 is now Dec 9.
- Puzzles 34 to 60 written in three batches (content/raw/batch-04 to 06): 0 validator errors. Two HOT words removed because typo tolerance would have scored them SOLVED ("toasting" vs "roasting" in #44, vs "tasting" in #56).
- New style in rotation: renaissance painting (#42, a Saturday).
- Prompt template v2 applied to the two image redos: #14 adds "geometric fragmented shapes" to cubism, #24 asks for "benches and dumbbell racks" so the gym is visible.

## 2026-10-05: Image QA, batch 2 (brand + puzzles 14, 24, 25, 27 to 60)

Source: Nano Banana in the Gemini app, prompts from docs/NANO-BANANA-PROMPTS.md. 41 files arrived in one folder, saved in order but with five brand images and no #44, so everything was mapped by content, not position.

| Result | Puzzles | Count |
|---|---|---|
| Pass | 14 (v2), 25, 27 to 32, 34 to 37, 39 to 43, 45 to 47, 49 to 55, 57 to 60 | 30 |
| Pass with a note | 24 v2 (gym now clear; graffiti is on the walls rather than the art style), 33 (a readable EXIT sign, no answer leak), 38 (shows a girl: answer list fixed), 48 (art deco is in the decor; the render looks photographic) | 4 |
| Weak | 56 (pointillism dots only visible up close; reads as a realistic painting on a phone) | 1 |
| Missing | 44 (dragon roasting marshmallows) | 1 |

First-pass acceptance: 34 of 35 delivered puzzle images (97%), up from 92% in batch 1. Prompt template v2 fixed both batch 1 rejects (#14 now strongly cubist, #24 now shows a gym).

Brand: logo, icon, link-preview banner and texture all usable, plus one unrequested desk scene (kept as content/brand/extra-desk-portrait.jpg). The logo and icon came out 9:16 instead of square; brand:build crops the center square.

Content change from QA: #38 WHO now accepts "girl" and "schoolgirl" (they were HOT, but the image shows a schoolgirl).

Rejected v1 images are kept in content/images/rejected/ for before and after comparisons.

## 2026-10-05: #44 delivered

#44 (dragon roasting marshmallows, crayon drawing) passes QA on the first try. All 60 puzzle images now exist; #56 stays as is (weak style, accepted).
