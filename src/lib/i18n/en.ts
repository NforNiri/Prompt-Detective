import type { SlotKey } from "@/lib/game/types";

export interface Strings {
  appName: string;
  tagline: string;
  comingSoon: string;
  slots: Record<SlotKey, string>;
}

export const en: Strings = {
  appName: "Prompt Detective",
  tagline: "Guess the 4 hidden words behind today's AI image.",
  comingSoon: "First case opens Sunday, October 4.",
  slots: {
    who: "WHO",
    doing: "DOING",
    where: "WHERE",
    style: "STYLE",
  },
};
