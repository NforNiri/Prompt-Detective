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
