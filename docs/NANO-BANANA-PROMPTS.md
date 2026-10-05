# Nano Banana prompts

Status (2026-10-05): everything below is generated, including #44. QA results are in docs/CONTENT-LOG.md.

Everything still to generate before and after launch: 4 brand images and 37 puzzle images. Generated 2026-10-05 from the puzzle files, so each prompt matches what the end screen reveals.

## How to use this file

1. Open the Gemini app and use Nano Banana (image generation).
2. Paste one prompt exactly as written. Keep the default 16:9 for puzzle images; brand images say their shape.
3. Save with the filename shown. Puzzle images go in `content/images/`, brand images in `content/brand/`. Both folders stay out of git. `.jpg` or `.png` is fine.
4. Quick check before saving (30 seconds, from docs/04-CONTENT-PIPELINE.md):
   - WHO is obvious within 2 seconds, DOING reads from the pose, WHERE is visible.
   - The style really is the named style, not generic digital art.
   - No text, letters, signs, logos or watermarks anywhere. Lettering can give away answers.
   - Nothing that looks like a real person.
5. If it fails, regenerate up to 2 times. If it still fails, tell Claude which slot is weak and the prompt gets rewritten.
6. When a batch is saved, tell Claude: the images get QA'd, logged in docs/CONTENT-LOG.md and uploaded.

Budget: 41 images at about 25 per day is two days. Do the brand images and the puzzles closest to launch first.

## 1. Brand assets (4 images)

Text such as the game name gets added in code with real fonts, because AI-drawn lettering comes out garbled. So none of these should contain words.

Every brand prompt ends with the same art direction, so the logo, icon and link preview match. Keep this block if you make more brand art later.

```
Style: noir detective mood, near-black charcoal background (#0b0d10), a single warm amber desk-lamp glow (#e2b45c), crisp flat vector shapes with a few chunky pixel-art squares as accents, high contrast, minimal, subtle film grain. No text, no letters, no watermark.
```

### A. Logo mark · square (1:1) · save as `content/brand/logo.png`

```
A logo mark: a bold magnifying glass, slightly tilted, whose lens shows a few chunky square pixels, as if zooming into an AI-generated image. Centered on a plain background with lots of empty space around it. Simple enough to read at 32 pixels. Style: noir detective mood, near-black charcoal background (#0b0d10), a single warm amber desk-lamp glow (#e2b45c), crisp flat vector shapes with a few chunky pixel-art squares as accents, high contrast, minimal, subtle film grain. No text, no letters, no watermark.
```

### B. App icon · square (1:1) · save as `content/brand/icon.png`

One image becomes the 192 and 512 pixel icons and the browser tab icon. Phones crop icons into circles and rounded squares, so the symbol must sit well inside the edges.

```
An app icon: a bold magnifying glass with chunky square pixels inside the lens, filling only the middle 60 percent of a square tile, plain near-black background reaching every edge, no border, no rounded corners, no frame. Style: noir detective mood, near-black charcoal background (#0b0d10), a single warm amber desk-lamp glow (#e2b45c), crisp flat vector shapes with a few chunky pixel-art squares as accents, high contrast, minimal, subtle film grain. No text, no letters, no watermark.
```

### C. Link preview background · wide (16:9) · save as `content/brand/og-background.png`

This is the picture that appears when someone shares the link on WhatsApp or social media. The title and tagline get added on top in code, on the empty left side.

```
A wide banner: a detective's desk at night under an amber desk lamp, a printed photo of a strange AI-generated scene under a magnifying glass, four blank index cards laid in a row beneath it. Keep the left third of the image dark and empty. Style: noir detective mood, near-black charcoal background (#0b0d10), a single warm amber desk-lamp glow (#e2b45c), crisp flat vector shapes with a few chunky pixel-art squares as accents, high contrast, minimal, subtle film grain. No text, no letters, no watermark.
```

### D. Background texture · square (1:1) · save as `content/brand/texture.png` · optional

Skip this one if you are short on images. The game looks fine on flat black.

```
A seamless, very subtle dark paper texture with faint film grain, almost black (#0b0d10), no objects, no shapes, low contrast so text stays readable on top. No text, no letters, no watermark.
```

## 2. Puzzle images (37)

In launch order. #14 and #24 replace images that failed QA. Puzzles 1 to 13, 15 to 23 and 26 already have images. Entries marked "Check for text" use styles or scenes that tend to add signs or lettering.

### 0014 · Sat Oct 24 · difficulty 5 · REDO

Redo. The first image read as an oil painting, not cubism. The prompt now adds "geometric fragmented shapes".

```
a blacksmith forging a sword in a forge, cubism, geometric fragmented shapes, no text, no letters, no watermark
```

### 0024 · Tue Nov 3 · difficulty 2 · REDO

Redo. The first image had no gym and a background of graffiti letters. The prompt now asks for gym equipment.

Check for text: graffiti lettering.

```
a gorilla lifting weights in a gym with benches and dumbbell racks, graffiti, no text, no letters, no watermark
```

### 0025 · Wed Nov 4 · difficulty 3

```
a mermaid combing her hair on a rock in the sea, paper cutout, no text, no letters, no watermark
```

### 0027 · Fri Nov 6 · difficulty 4

```
a detective inspecting clues with a magnifying glass in a dark alley, film noir, no text, no letters, no watermark
```

### 0028 · Sat Nov 7 · difficulty 5

```
a gondolier rowing a gondola along a venice canal, pointillism, no text, no letters, no watermark
```

### 0029 · Sun Nov 8 · difficulty 1

```
a rabbit planting carrots in a vegetable garden, watercolor, no text, no letters, no watermark
```

### 0030 · Mon Nov 9 · difficulty 2

```
a sloth hanging from a ceiling lamp in an office, 3d render, no text, no letters, no watermark
```

### 0031 · Tue Nov 10 · difficulty 2

```
a firefighter rescuing a cat from a tall tree, pencil sketch, no text, no letters, no watermark
```

### 0032 · Wed Nov 11 · difficulty 3

```
a wizard brewing a potion in a cave, pixel art, no text, no letters, no watermark
```

### 0033 · Thu Nov 12 · difficulty 3

```
a chef flipping pancakes in a diner, oil painting, no text, no letters, no watermark
```

### 0034 · Fri Nov 13 · difficulty 4

```
a frog fishing from a wooden bridge, ukiyo-e, no text, no letters, no watermark
```

### 0035 · Sat Nov 14 · difficulty 5

```
a florist arranging a bouquet in a greenhouse, art nouveau, no text, no letters, no watermark
```

### 0036 · Sun Nov 15 · difficulty 1

```
a panda eating bamboo in a bamboo forest, photograph, no text, no letters, no watermark
```

### 0037 · Mon Nov 16 · difficulty 2

Check for text: comic speech bubbles, building signs.

```
a ninja climbing a skyscraper at night, comic book, no text, no letters, no watermark
```

### 0038 · Tue Nov 17 · difficulty 2

Check for text: Japanese shop signs and banners.

```
a student eating ramen in a ramen shop, anime, no text, no letters, no watermark
```

### 0039 · Wed Nov 18 · difficulty 3

```
a penguin ice skating on a frozen pond, claymation, no text, no letters, no watermark
```

### 0040 · Thu Nov 19 · difficulty 3

```
a lion roaring on a rocky cliff, stained glass, no text, no letters, no watermark
```

### 0041 · Fri Nov 20 · difficulty 4

Check for text: retro sign text.

```
a cowboy riding a horse through a desert at sunset, synthwave, no text, no letters, no watermark
```

### 0042 · Sat Nov 21 · difficulty 5

```
an astronomer using a telescope in an observatory, renaissance painting, no text, no letters, no watermark
```

### 0043 · Sun Nov 22 · difficulty 1

```
a pig taking a bath in a bathroom, cartoon, no text, no letters, no watermark
```

### 0044 · Mon Nov 23 · difficulty 2

```
a dragon roasting marshmallows at a campfire, crayon drawing, no text, no letters, no watermark
```

### 0045 · Tue Nov 24 · difficulty 2

```
a spaceship landing on the moon, chalk drawing, no text, no letters, no watermark
```

### 0046 · Wed Nov 25 · difficulty 3

```
a fox running through a snowy forest, low poly, no text, no letters, no watermark
```

### 0047 · Thu Nov 26 · difficulty 3

```
a peacock spreading its feathers in a palace garden, mosaic, no text, no letters, no watermark
```

### 0048 · Fri Nov 27 · difficulty 4

Check for text: nightclub sign, poster text.

```
a jazz singer performing in a nightclub, art deco, no text, no letters, no watermark
```

### 0049 · Sat Nov 28 · difficulty 5

```
a juggler juggling balls at a circus, bauhaus, no text, no letters, no watermark
```

### 0050 · Sun Nov 29 · difficulty 1

```
an elephant spraying water at a river, watercolor, no text, no letters, no watermark
```

### 0051 · Mon Nov 30 · difficulty 2

```
a teddy bear having a tea party in a playroom, 3d render, no text, no letters, no watermark
```

### 0052 · Tue Dec 1 · difficulty 2

```
a carpenter building a chair in a woodshop, pencil sketch, no text, no letters, no watermark
```

### 0053 · Wed Dec 2 · difficulty 3

```
a mouse sailing a paper boat down a stream, pixel art, no text, no letters, no watermark
```

### 0054 · Thu Dec 3 · difficulty 3

```
a shepherd herding sheep on a hillside, oil painting, no text, no letters, no watermark
```

### 0055 · Fri Dec 4 · difficulty 4

Check for text: shop signs.

```
a black cat walking along a rooftop at night, film noir, no text, no letters, no watermark
```

### 0056 · Sat Dec 5 · difficulty 5

```
a sommelier tasting wine in a wine cellar, pointillism, no text, no letters, no watermark
```

### 0057 · Sun Dec 6 · difficulty 1

```
a giraffe eating leaves in the savanna, photograph, no text, no letters, no watermark
```

### 0058 · Mon Dec 7 · difficulty 2

```
a submarine exploring a coral reef, paper cutout, no text, no letters, no watermark
```

### 0059 · Tue Dec 8 · difficulty 2

Check for text: labels on bottles.

```
a scientist mixing chemicals in a laboratory, comic book, no text, no letters, no watermark
```

### 0060 · Wed Dec 9 · difficulty 3

```
a snowman building a sandcastle on a beach, claymation, no text, no letters, no watermark
```

