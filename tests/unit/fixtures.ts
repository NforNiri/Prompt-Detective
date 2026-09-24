import raw0001 from "../../content/puzzles/0001.json";
import raw0002 from "../../content/puzzles/0002.json";
import raw0003 from "../../content/puzzles/0003.json";
import { puzzleSchema } from "@/lib/game/types";

export const rawPuzzles = [raw0001, raw0002, raw0003];
export const puzzle1 = puzzleSchema.parse(raw0001);
