import { DATE_PATTERN } from "./types";

// Date strings are YYYY-MM-DD. Anything that needs "now" takes it as an argument.

const DAY_MS = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The player's local calendar date. The puzzle rolls over at local midnight. */
export function localDateString(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function utcDateString(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function parseUtc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

/** True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const ms = parseUtc(value);
  return !Number.isNaN(ms) && utcDateString(new Date(ms)) === value;
}

export function addDays(date: string, days: number): string {
  return utcDateString(new Date(parseUtc(date) + days * DAY_MS));
}

/** Whole days from `from` to `to`. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseUtc(to) - parseUtc(from)) / DAY_MS);
}

/**
 * Server-side guard: [UTC today - 1, UTC today + 1] covers every timezone's
 * local "today" and blocks fetching future puzzles.
 */
export function isDateInWindow(date: string, now: Date): boolean {
  if (!isValidDateString(date)) return false;
  return Math.abs(daysBetween(utcDateString(now), date)) <= 1;
}

export function msUntilLocalMidnight(now: Date): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekday(date: string): number {
  return new Date(parseUtc(date)).getUTCDay();
}

// Israeli week, Sunday start. See docs/01-GDD.md "Weekly difficulty curve".
const DIFFICULTY_BY_WEEKDAY = [1, 2, 2, 3, 3, 4, 5] as const;

export function expectedDifficulty(date: string): number {
  return DIFFICULTY_BY_WEEKDAY[weekday(date)]!;
}
