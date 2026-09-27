"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { initAnalytics, resolveBudget, track } from "@/lib/analytics";
import { ApiClientError, apiClient } from "@/lib/api-client";
import { appNow } from "@/lib/clock";
import { localDateString } from "@/lib/game/date";
import { guessSubmitted, puzzleCompleted, puzzleViewed, slotEvent } from "@/lib/game/events";
import {
  canUseHint,
  checkGuess,
  gameReducer,
  initialModel,
  savedGameSchema,
  type GameAction,
  type GameModel,
  type GuessCheck,
} from "@/lib/game/state";
import { emptyStats, guessesUsed, recordGame, statsSchema } from "@/lib/game/stats";
import type { SlotKey, Stats } from "@/lib/game/types";
import { createLogger } from "@/lib/logger";
import {
  STORAGE_KEYS,
  getDeviceId,
  readJson,
  readString,
  removeKey,
  storageAvailable,
  writeJson,
  writeString,
} from "@/lib/storage";

const log = createLogger("game");

function statusOf(model: GameModel): string {
  return model.phase === "ready" ? model.game.status : model.phase;
}

export interface GameControls {
  model: GameModel;
  stats: Stats;
  selectSlot: (slot: SlotKey) => void;
  submitGuess: (guess: string) => Promise<GuessCheck>;
  requestHint: () => Promise<void>;
  dismissNotice: () => void;
  markHowToSeen: () => void;
  retry: () => void;
  /** Debug only: forget today's game and reload. */
  resetToday: () => void;
}

export function useGame(): GameControls {
  const [model, rawDispatch] = useReducer(gameReducer, undefined, initialModel);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const modelRef = useRef(model);
  const busy = useRef(false);
  const [loadAttempt, retryLoad] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  const dispatch = useCallback((action: GameAction) => {
    log.debug(`action ${action.type}`);
    rawDispatch(action);
  }, []);

  // Load today's puzzle, saved progress and stats. A new game reads the budget flag once.
  useEffect(() => {
    let cancelled = false;
    const date = localDateString(appNow());
    log.debug("loading puzzle", { date, attempt: loadAttempt });
    void initAnalytics(getDeviceId());

    (async () => {
      try {
        const puzzle = await apiClient.puzzle(date);
        const saved = readJson(STORAGE_KEYS.game(puzzle.id), savedGameSchema);
        const storedStats = readJson(STORAGE_KEYS.stats, statsSchema) ?? emptyStats();
        const budget = saved ? saved.budget : await resolveBudget();
        if (cancelled) return;
        setStats(storedStats);
        dispatch({
          type: "LOADED",
          puzzle,
          saved,
          budget,
          firstVisit: readString(STORAGE_KEYS.howTo) === null,
          storageOk: storageAvailable(),
          now: Date.now(),
        });
        track("puzzle_viewed", puzzleViewed(puzzle, storedStats, saved !== null));
      } catch (error) {
        if (cancelled) return;
        const reason = error instanceof ApiClientError && error.status === 404 ? "not_found" : "network";
        dispatch({ type: "LOAD_FAILED", reason });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, loadAttempt]);

  // Persist progress after every change once the puzzle is known.
  useEffect(() => {
    if (model.phase === "ready" && model.puzzle) writeJson(STORAGE_KEYS.game(model.puzzle.id), model.game);
  }, [model.phase, model.puzzle, model.game]);

  // Log state transitions. A game that ends in this session also updates stats and fires puzzle_completed.
  const lastStatus = useRef<string | null>(null);
  useEffect(() => {
    const status = statusOf(model);
    const previous = lastStatus.current;
    if (previous === status) return;
    lastStatus.current = status;
    log.info(`state ${previous ?? "init"} -> ${status}`, {
      puzzleId: model.puzzle?.id,
      guessesUsed: guessesUsed(model.game),
    });

    const { puzzle, game } = model;
    if (previous !== "playing" || !puzzle || game.status === "playing") return;
    const current = readJson(STORAGE_KEYS.stats, statsSchema) ?? emptyStats();
    const next = recordGame(current, { puzzleId: puzzle.id, won: game.status === "won", guessesUsed: guessesUsed(game) });
    writeJson(STORAGE_KEYS.stats, next);
    setStats(next);
    track("puzzle_completed", puzzleCompleted(puzzle.id, game, Date.now()));
  }, [model]);

  // Fetch the full prompt once the game ends (also after a reload of a finished game).
  const { status, reveal } = model.game;
  const puzzle = model.puzzle;
  useEffect(() => {
    if (!puzzle || status === "playing" || reveal) return;
    let cancelled = false;
    apiClient
      .reveal({ puzzleId: puzzle.id, date: puzzle.date, deviceId: getDeviceId() })
      .then((result) => {
        if (!cancelled) dispatch({ type: "REVEAL", reveal: result });
      })
      .catch(() => log.warn("reveal failed"));
    return () => {
      cancelled = true;
    };
  }, [puzzle, status, reveal, dispatch]);

  const submitGuess = useCallback(
    async (raw: string): Promise<GuessCheck> => {
      const current = modelRef.current;
      const check = busy.current ? "blocked" : checkGuess(current, raw);
      dispatch({ type: "SUBMIT_GUESS", guess: raw });
      if (check !== "ok" || !current.puzzle) return check;

      busy.current = true;
      const { id: puzzleId, date } = current.puzzle;
      const slot = current.selectedSlot;
      const guess = raw.trim();
      const guessIndex = guessesUsed(current.game) + 1;
      try {
        const result = await apiClient.guess({ puzzleId, date, slot, guess, deviceId: getDeviceId(), guessIndex });
        dispatch({ type: "GUESS_RESULT", slot, guess, result });
        track("guess_submitted", guessSubmitted(puzzleId, slot, result, guessIndex));
        if (result.tier === "solved") track("slot_solved", slotEvent(puzzleId, slot, guessIndex));
      } catch {
        dispatch({ type: "GUESS_FAILED" });
      } finally {
        busy.current = false;
      }
      return check;
    },
    [dispatch],
  );

  const requestHint = useCallback(async () => {
    const current = modelRef.current;
    if (busy.current || !canUseHint(current) || !current.puzzle) return;
    busy.current = true;
    const { id: puzzleId, date } = current.puzzle;
    const slot = current.selectedSlot;
    const guessIndex = guessesUsed(current.game) + 1;
    dispatch({ type: "USE_HINT" });
    try {
      const { firstLetter } = await apiClient.hint({ puzzleId, date, slot, deviceId: getDeviceId() });
      dispatch({ type: "HINT_RESULT", slot, letter: firstLetter });
      track("hint_used", slotEvent(puzzleId, slot, guessIndex));
    } catch {
      dispatch({ type: "HINT_FAILED" });
    } finally {
      busy.current = false;
    }
  }, [dispatch]);

  const selectSlot = useCallback((slot: SlotKey) => dispatch({ type: "SELECT_SLOT", slot }), [dispatch]);
  const dismissNotice = useCallback(() => dispatch({ type: "DISMISS_NOTICE" }), [dispatch]);
  const markHowToSeen = useCallback(() => writeString(STORAGE_KEYS.howTo, "1"), []);
  const resetToday = useCallback(() => {
    const id = modelRef.current.puzzle?.id;
    if (id !== undefined) removeKey(STORAGE_KEYS.game(id));
    window.location.reload();
  }, []);

  return { model, stats, selectSlot, submitGuess, requestHint, dismissNotice, markHowToSeen, retry: retryLoad, resetToday };
}
