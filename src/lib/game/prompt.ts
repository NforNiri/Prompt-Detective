export const PROMPT_SUFFIX = "no text, no letters, no watermark";

/** The image prompt as players see it on the end screen, without the generation-only suffix. */
export function displayPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed.endsWith(PROMPT_SUFFIX)) return trimmed;
  return trimmed.slice(0, -PROMPT_SUFFIX.length).replace(/[\s,]+$/, "");
}
