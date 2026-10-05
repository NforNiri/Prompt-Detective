import type { SlotKey, Tier } from "@/lib/game/types";

// Every UI string. A Hebrew file with the same shape ships in v1.1.

export interface Strings {
  appName: string;
  tagline: string;
  meta: { title: string; description: string; ogAlt: string };
  slots: Record<SlotKey, string>;
  /** What each slot asks for, shown under the label and in the input placeholder. */
  slotQuestions: Record<SlotKey, string>;
  tiers: Record<Tier, string>;
  tierMeaning: Record<Tier, string>;
  header: { help: string; stats: string };
  image: { alt: (puzzleId: number) => string };
  counter: { label: string; left: (left: number, total: number) => string };
  tile: {
    empty: string;
    hintLetter: (letter: string) => string;
    lastGuess: (guess: string, tier: string) => string;
    solved: (answer: string) => string;
    revealed: (answer: string) => string;
    selected: string;
  };
  input: {
    label: (slot: string) => string;
    placeholder: (question: string) => string;
    submit: string;
    checking: string;
    slotSolved: (slot: string) => string;
  };
  hint: { button: string; cost: string; used: (slot: string, letter: string) => string; checking: string };
  history: { title: string; empty: string };
  notices: {
    result: (tier: string, guess: string, slot: string) => string;
    typo: string;
    hint: (slot: string, letter: string) => string;
    duplicate: (guess: string, slot: string) => string;
    invalid: string;
    error: string;
  };
  load: { loading: string; notFound: string; network: string; retry: string };
  storageNote: string;
  end: {
    won: string;
    lost: string;
    wonDetail: (used: number, total: number) => string;
    lostDetail: string;
    promptLabel: string;
    loadingPrompt: string;
    stampWon: string;
    stampLost: string;
    recapTitle: string;
    recapRow: (slot: string, guesses: number, solved: boolean) => string;
    nextCase: string;
    newCaseReady: string;
    openNewCase: string;
    share: string;
    copied: string;
    shareFailed: string;
    stats: string;
  };
  stats: {
    title: string;
    played: string;
    winPct: string;
    currentStreak: string;
    maxStreak: string;
    distribution: string;
    distributionHint: string;
    distributionRow: (guesses: number, count: number) => string;
    close: string;
  };
  debug: {
    title: string;
    open: string;
    close: string;
    logs: string;
    events: string;
    state: string;
    api: string;
    flag: (value: string, budget: number) => string;
    resetToday: string;
    empty: string;
  };
  howTo: {
    title: string;
    panels: { title: string; body: string }[];
    example: string;
    next: string;
    back: string;
    skip: string;
    done: string;
    step: (current: number, total: number) => string;
  };
}

export const en: Strings = {
  appName: "Prompt Detective",
  tagline: "Guess the 4 hidden words behind today's AI image.",
  meta: {
    title: "Prompt Detective: a daily AI image puzzle",
    description:
      "One AI image a day. Find the 4 hidden words of the prompt that made it: who, doing, where and style. 10 guesses, 1 hint, a new case every midnight.",
    ogAlt: "Prompt Detective: guess the 4 hidden words behind today's AI image",
  },
  slots: { who: "WHO", doing: "DOING", where: "WHERE", style: "STYLE" },
  slotQuestions: {
    who: "Who or what is it?",
    doing: "What is it doing?",
    where: "Where is it?",
    style: "What art style?",
  },
  tiers: { solved: "Solved", hot: "Hot", warm: "Warm", cold: "Cold" },
  tierMeaning: {
    solved: "That's the word.",
    hot: "Very close in meaning.",
    warm: "Related.",
    cold: "Not related.",
  },
  header: { help: "How to play", stats: "Statistics" },
  image: { alt: (id) => `Case #${id}: the AI image to investigate` },
  counter: { label: "Guesses left", left: (left, total) => `${left} of ${total} guesses left` },
  tile: {
    empty: "Not guessed yet",
    hintLetter: (letter) => `Starts with ${letter.toUpperCase()}`,
    lastGuess: (guess, tier) => `Last guess ${guess}: ${tier}`,
    solved: (answer) => `Solved: ${answer}`,
    revealed: (answer) => `Not solved. The answer was ${answer}`,
    selected: "Selected",
  },
  input: {
    label: (slot) => `Your guess for ${slot}`,
    placeholder: (question) => question,
    submit: "Guess",
    checking: "Checking…",
    slotSolved: (slot) => `${slot} is solved. Pick another word.`,
  },
  hint: {
    button: "Hint: first letter",
    cost: "Costs 1 guess",
    used: (slot, letter) => `Hint used: ${slot} starts with ${letter.toUpperCase()}`,
    checking: "Getting hint…",
  },
  history: { title: "Your guesses", empty: "No guesses yet. Pick a word and start with what you see." },
  notices: {
    result: (tier, guess, slot) => `${tier}: "${guess}" for ${slot}.`,
    typo: "Close enough, typo forgiven.",
    hint: (slot, letter) => `${slot} starts with ${letter.toUpperCase()}.`,
    duplicate: (guess, slot) => `You already tried "${guess}" for ${slot}. No guess used.`,
    invalid: "Use letters, numbers, spaces, hyphens or apostrophes.",
    error: "Couldn't reach the server. No guess used, try again.",
  },
  load: {
    loading: "Opening today's case…",
    notFound: "No case today. Check back tomorrow.",
    network: "Couldn't load today's case.",
    retry: "Try again",
  },
  storageNote: "Your browser is blocking storage, so progress and stats won't be saved.",
  end: {
    won: "Case closed",
    lost: "The case went cold",
    wonDetail: (used, total) => `Solved with ${used} of ${total} guesses.`,
    lostDetail: "Out of guesses. Here's what the machine was told:",
    promptLabel: "The prompt",
    loadingPrompt: "Unsealing the file…",
    stampWon: "Case closed",
    stampLost: "Cold case",
    recapTitle: "How you got there",
    recapRow: (slot, guesses, solved) =>
      `${slot}: ${guesses} ${guesses === 1 ? "guess" : "guesses"}, ${solved ? "solved" : "not solved"}`,
    nextCase: "Next case in",
    newCaseReady: "A new case is open.",
    openNewCase: "Open it",
    share: "Share result",
    copied: "Result copied. Paste it anywhere.",
    shareFailed: "Couldn't share. Try again.",
    stats: "Statistics",
  },
  stats: {
    title: "Statistics",
    played: "Played",
    winPct: "Win %",
    currentStreak: "Current streak",
    maxStreak: "Max streak",
    distribution: "Guesses per win",
    distributionHint: "Win a case to see your spread.",
    distributionRow: (guesses, count) => `${count} ${count === 1 ? "win" : "wins"} in ${guesses} guesses`,
    close: "Close",
  },
  debug: {
    title: "Debug",
    open: "Open debug panel",
    close: "Close debug panel",
    logs: "Logs",
    events: "Events",
    state: "State",
    api: "API",
    flag: (value, budget) => `guess-budget: ${value} (budget ${budget})`,
    resetToday: "Reset today",
    empty: "Nothing yet.",
  },
  howTo: {
    title: "How to play",
    panels: [
      {
        title: "Read the machine's mind",
        body: "Every day there's one AI image. Your job is to find the 4 words of the prompt that made it: WHO, DOING, WHERE and STYLE.",
      },
      {
        title: "Follow the heat",
        body: "Pick a word, type a guess. Each guess comes back Solved, Hot (very close), Warm (related) or Cold. Small typos are forgiven.",
      },
      {
        title: "10 guesses, 1 hint",
        body: "All 4 words share 10 guesses. One hint shows a first letter and costs a guess. A new case opens every midnight.",
      },
    ],
    example: "fox · playing chess · frozen lake · ukiyo-e",
    next: "Next",
    back: "Back",
    skip: "Skip",
    done: "Start investigating",
    step: (current, total) => `Step ${current} of ${total}`,
  },
};
