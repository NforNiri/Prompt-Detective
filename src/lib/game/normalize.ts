const SMART_APOSTROPHES = /[\u2018\u2019\u02BC]/g;
const DISALLOWED_CHARS = /[^\p{L}\p{N}\s'-]/gu;
const LEADING_ARTICLE = /^(?:a|an|the)\s+/;

// Plural-only nouns that the suffix rules below would break.
const INVARIANT_WORDS = new Set([
  "binoculars",
  "clothes",
  "glasses",
  "goggles",
  "jeans",
  "news",
  "pajamas",
  "pants",
  "scissors",
  "series",
  "shorts",
  "species",
  "trousers",
]);

/**
 * NFKC -> lowercase -> trim -> strip chars outside [\p{L}\p{N}\s'-] -> collapse spaces
 * -> drop a leading article. Phone keyboards type curly apostrophes, so those
 * become straight ones first.
 */
export function normalize(input: string): string {
  const cleaned = input
    .normalize("NFKC")
    .toLowerCase()
    .replace(SMART_APOSTROPHES, "'")
    .trim()
    .replace(DISALLOWED_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.replace(LEADING_ARTICLE, "");
}

function singularizeWord(word: string): string {
  if (word.length < 4 || INVARIANT_WORDS.has(word)) return word;
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (/(?:ss|x|z|ch|sh)es$/.test(word)) return word.slice(0, -2);
  if (!word.endsWith("s") || /(?:ss|us|is)$/.test(word)) return word;
  return word.slice(0, -1);
}

/** Naive English singular of the last word. Expects normalized input. */
export function singularize(input: string): string {
  const words = input.split(" ");
  const last = words.pop() ?? "";
  words.push(singularizeWord(last));
  return words.join(" ");
}

/** The forms a word is compared under: normalized, plus its singular. */
export function variants(input: string): Set<string> {
  const normalized = normalize(input);
  return new Set([normalized, singularize(normalized)]);
}
