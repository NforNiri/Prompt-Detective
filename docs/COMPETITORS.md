# Prompt Detective: Name Check and Competitors

Status: DRAFT, researched 2026-09-24. Needs review by Niri.

## Name check

Verdict: usable, with low to moderate risk. No game with players or press uses the name "Prompt Detective". The name is used by several small AI tools that reverse-engineer prompts from images or text, and by one early GitHub project with the same core idea as ours. The exact subdomain `prompt-detective.vercel.app` is taken. No trademark search was done.

| Name use | URL | How close | Risk |
|---|---|---|---|
| "Prompt Detective" Custom GPT by Sarthak Garg; reverse-engineers prompts behind GPT outputs, needs ChatGPT Plus | https://theresanaiforthat.com/gpt/prompt-detective/ , https://robopost.app/en/toolpasta/tools/prompt-detective | Same "find the hidden prompt" idea, but a chatbot tool, not a game | Low |
| Other "Prompt Detective" GPTs (Dannie Clemmons on AIPRM; one on YesChat) | https://app.aiprm.com/gpts/g-7C57UvTjG/prompt-detective , https://www.yeschat.ai/gpts-2OTo9yt7kD-Prompt-Detective | Prompt-analysis chatbots | Low |
| prompt-detective.vercel.app, titled "Prompt Detective - AI Video & Image Analysis" | https://prompt-detective.vercel.app | Tool that analyzes images/video, not a game. Owner not confirmed (the title matches the two repos in the next row) | Medium: blocks our preferred URL |
| GitHub okaditya84/Prompt-Detective and iamhm119/prompt-detective: Streamlit tool that extracts generation prompts from AI images and video, 0 and 1 stars | https://github.com/okaditya84/Prompt-Detective , https://github.com/iamhm119/prompt-detective , https://promptdetective.streamlit.app/ | Utility, not a game | Low |
| GitHub SatoshiRoppongi/prompt_detective: players view AI images and guess the hidden prompt, scored by similarity; started as a Solana wagering game, moving to free points (June 2025); 0 stars | https://github.com/SatoshiRoppongi/prompt_detective | Same concept. No live deployment found | Medium if it launches, low today |
| GitHub akileshjayakumar/the-prompt-detective: teaches the CO-STAR prompt framework by diagnosing bad prompts | https://github.com/akileshjayakumar/the-prompt-detective , thepromptdetective.vercel.app (not visited) | Educational game, different mechanic | Low |
| GitHub julesbly/prompt-detective: interrogate three AI suspects in a museum theft, built for an AI course | https://github.com/julesbly/prompt-detective | Different genre | Low |
| GitHub WillbsoluteVodka/prompt-detective: classroom "reverse prompt engineering practice page" with Student A / Student B inputs | https://github.com/WillbsoluteVodka/prompt-detective , https://prompt-detective-sage.vercel.app | Similar idea, classroom tool, no daily puzzle | Low |
| GitHub NforNiri/Prompt-Detective, deployed at prompt-detective-puce.vercel.app | https://github.com/NforNiri/Prompt-Detective | This project. Confirmed by Niri | None |

Not found: no "Prompt Detective" result on itch.io search (https://itch.io/search?q=prompt+detective), Product Hunt search (https://www.producthunt.com/search?q=prompt%20detective), or in a web search for Google Play / App Store listings. GitHub search returned 14 repos, all with 0 or 1 stars (https://github.com/search?q=%22prompt+detective%22&type=repositories).

Vercel subdomain: `prompt-detective.vercel.app` is taken (live page, not a DEPLOYMENT_NOT_FOUND 404). We need another subdomain or a custom domain. Decision (2026-09-24): keep `prompt-detective-puce.vercel.app`, the address Vercel assigned to this project.

Backup names:
- Promptography: one web search found no game or app with this name. Looks free, but it is harder to spell and says less about the game.
- Four Words: taken. "Four Words: Word Puzzle" is a Google Play word-association game (https://play.google.com/store/apps/details?id=com.rodaplayworks.fourwords, seen in search results; the store page did not load for me). fourword.xyz also exists (content not readable). The phrase also collides with Quordle-style "4 words" games in search. Not recommended.
- Reverse Prompt: used by many image-to-prompt tools (PrompTessor, Puter's Reverse Prompt Generator, promptreverse.app). No game, but it reads as a utility and would be buried in search. Not recommended.

## Direct competitors

### 1. Promptle (promptle.app)
- URL: https://promptle.app/
- What the player does: looks at a daily AI image and guesses its secret 5-word prompt. Each guess must be exactly 5 words.
- Scoring: Wordle-style colors per word: green (right word, right position), yellow (right word, wrong position), gray (not in prompt). 6 attempts. The FAQ says you must guess "the exact words" and does not mention synonyms. Prompts are human-curated.
- Daily or unlimited: daily ("Day 190" when visited), with streaks and Today / All-time leaderboards. The same site also hosts a second daily game, Prompt Pyramid.
- Platform: web.
- Traction: leaderboards exist; the page showed "No completions yet today" when I visited. No player counts, reviews, or press found.
- How we differ: fixed WHO/DOING/WHERE/STYLE slots instead of an unstructured 5-word string, so players know what each blank means. HOT/WARM tiers reward near-misses through synonym lists; Promptle only accepts exact words. A shared 10-guess budget across 4 slots instead of 6 full-sentence guesses. A hint, a Sunday-to-Saturday difficulty curve, and a planned Hebrew version.

### 2. Promptdle (iOS)
- URL: https://apps.apple.com/us/app/promptdle/id6446601897
- What the player does: finds 5 words used in the prompt behind a daily AI image. Words can be nouns, verbs, adjectives; filler words like "the" are ignored.
- Scoring: per-word colors. Red is wrong, orange is "almost correct", green is correct. 25 guesses per the App Store text (a toolai.io listing says 5 chances, so the rules may have changed).
- Daily or unlimited: daily ("Every 24 hours").
- Platform: iOS app by Joachim Leonfellner. Last update v1.0.7 on January 31, 2024. The listed web site promptdle.com now 301-redirects to an unrelated author site, so the web version appears to be gone.
- Traction: App Store says it has not received enough ratings to show a score.
- How we differ: Promptdle's orange "almost" tier is the closest thing to our HOT/WARM tiers, so the near-miss feedback idea is not new. We add named slots, a four-level tier scale instead of three, a hint, a weekly difficulty curve, a share grid, and a live mobile web version. Promptdle looks inactive, which leaves the "tiered feedback" niche open.

### 3. Unprompted
- URL: https://unpromptedgame.com/ and https://store.steampowered.com/app/2129130/
- What the player does: types words that might be in the prompt of an AI image. Correct words fill blanks in the prompt.
- Scoring: points for matched words, unlimited guesses without penalty. On Steam, spending 10 points reveals one word.
- Daily or unlimited: web version has three new images every day plus a "Yesterday" tab. The Steam version is a paid game (listed at 18.50 ILS) with 1,500+ images in 7 galleries, released March 7, 2023 by Matt Eshleman.
- Platform: web and Steam (PC).
- Traction: Steam shows "Positive (100% of 16)" user reviews. Social accounts on Twitter, YouTube, Facebook, Instagram are linked. No player counts found.
- How we differ: Unprompted has no guess limit, so there is no tension or score to share. We use a fixed 10-guess budget, a share grid, one puzzle per day instead of three, slot structure, and tiers. Unprompted's hint is similar to ours (reveal one word for a cost), and its prompts are open-ended.

## Other games found

| Game | URL | What it is |
|---|---|---|
| Twin Pics | https://twinpics.ai/ | Daily: describe an image, AI generates a match, scored 0 to 100. Site claims 266,000+ players and 5,000+ classrooms. Largest traction found in this space |
| Piicasso | https://www.piicasso.com/ | Daily: 3 AI images from one secret phrase, 3 strikes (from search snippets; page content did not load) |
| Promptle (NightCafe) | https://nightcafe.studio/blogs/blog/promptle-nightcafe-daily-ai-prompt-game | Daily: turn one AI image into another in 5 prompt edits, scored on content, style, placement, color, 90% to win. Inside NightCafe Creator (post dated July 30, 2026) |
| Promptle (promptle.online) | https://www.indiehackers.com/post/promptle-ai-prompt-guessing-game-4ccda96b45 | Guess the prompt, closer guess scores higher; daily, PvP, leaderboards. Indie Hackers post March 2026, 6 upvotes |
| Promptle (promptle.quest) | https://dev.to/nithya_subramaniam_223c76/promptle-the-daily-ai-prompt-challenge-14fm | Text-only: write a prompt to match a hidden AI response, 3 tries a day |
| GuessPrompt | https://guessprompt.com/ | Daily "Prompt of the Day"; guessing rules not visible on the page |
| PixGuess | https://apps.apple.com/pw/app/pixguess-ai-image-quiz-game/id6547844042 | iOS level-based quiz, type the word behind an AI image, daily challenges. Too few ratings to display |
| AI Guessr | https://pobbles9.itch.io/ai-guessr | itch.io browser game, guess the prompt, scored 0 to 100 by similarity, unlimited |
| Find The Prompt | https://www.fastcompany.com/90815870/guess-the-prompt-behind-these-ai-generated-images | Daily missing-letter prompt game by Nicolas LeRoux, covered by Fast Company (article blocked, known only from search snippet; no live URL found) |
| Impromptu, Prompt Theory | https://impromptu.fun/ , https://www.prompttheory.com/ | AI art party game; "Guess the generated image". Pages did not show rules |
| Framed (reference) | https://framed.wtf/ | Daily movie guess from film frames, limited attempts, shareable results. Closest daily-image comparable outside AI |

## Positioning

- The core idea is taken. At least four products use the name "Promptle" alone. Our pitch cannot be "guess the AI prompt"; it has to be the slot structure and the tiers.
- Slot structure is our clearest difference. Every competitor I found uses a free word string (Promptle, Promptdle) or blanks in an open sentence (Unprompted). Four labeled slots make the puzzle readable on day one and make the share grid meaningful (one row per slot).
- Tiered feedback is less unique than it looks. Promptdle already has an orange "almost" color. Our advantage is four tiers and curated synonym lists, but that is content work every day, and it is where players will complain if "puppy" is COLD for "dog".
- The weekly difficulty curve and a Hebrew version did not appear in any competitor I found. Hebrew is a real gap; the curve is an easy feature for others to copy.
- Where others are stronger: Twin Pics has real scale (266,000+ players claimed) and a classroom channel; Unprompted has a paid Steam version and 1,500+ images; Promptle has leaderboards and a second game. We start with no accounts, so no leaderboards or cross-device streaks.

## Sources

- https://prompt-detective.vercel.app
- https://theresanaiforthat.com/gpt/prompt-detective/
- https://robopost.app/en/toolpasta/tools/prompt-detective
- https://chatgpt.com/g/g-ZEs3VdGI3-prompt-detective
- https://app.aiprm.com/gpts/g-7C57UvTjG/prompt-detective
- https://www.yeschat.ai/gpts-2OTo9yt7kD-Prompt-Detective
- https://github.com/search?q=%22prompt+detective%22&type=repositories
- https://github.com/okaditya84/Prompt-Detective
- https://github.com/iamhm119/prompt-detective
- https://github.com/SatoshiRoppongi/prompt_detective
- https://github.com/akileshjayakumar/the-prompt-detective
- https://github.com/julesbly/prompt-detective
- https://github.com/WillbsoluteVodka/prompt-detective
- https://prompt-detective-sage.vercel.app
- https://github.com/NforNiri/Prompt-Detective
- https://itch.io/search?q=prompt+detective
- https://www.producthunt.com/search?q=prompt%20detective
- https://play.google.com/store/apps/details?id=com.rodaplayworks.fourwords
- https://fourword.xyz/
- https://promptessor.com/reverse-prompt
- https://puter.com/app/reverse-prompt-generator
- https://promptreverse.app/
- https://promptle.app/
- https://promptle.app/faq
- https://promptle.app/how-to-play
- https://apps.apple.com/us/app/promptdle/id6446601897
- https://www.toolai.io/ai/promptdle
- https://promptdle.com/ (redirects to https://chrishernandezauthor.com/)
- https://unpromptedgame.com/
- https://store.steampowered.com/app/2129130/
- https://twinpics.ai/
- https://www.piicasso.com/
- https://nightcafe.studio/blogs/blog/promptle-nightcafe-daily-ai-prompt-game
- https://www.indiehackers.com/post/promptle-ai-prompt-guessing-game-4ccda96b45
- https://dev.to/nithya_subramaniam_223c76/promptle-the-daily-ai-prompt-challenge-14fm
- https://guessprompt.com/
- https://apps.apple.com/pw/app/pixguess-ai-image-quiz-game/id6547844042
- https://pobbles9.itch.io/ai-guessr
- https://www.fastcompany.com/90815870/guess-the-prompt-behind-these-ai-generated-images
- https://impromptu.fun/
- https://www.prompttheory.com/
- https://framed.wtf/
