"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { ApiClientError, apiClient } from "@/lib/api-client";
import { appNow } from "@/lib/clock";
import { localDateString } from "@/lib/game/date";
import {
  DEFAULT_BUDGET,
  canUseHint,
  checkGuess,
  gameReducer,
  initialModel,
  savedGameSchema,
  type GameAction,
  type GameModel,
  type GuessCheck,
} from "@/lib/game/state";
import { guessesUsed } from "@/lib/game/stats";
import type { SlotKey } from "@/lib/game/types";
import { createLogger } from "@/lib/logger";
import { STORAGE_KEYS, getDeviceId, readJson, readString, storageAvailable, writeJson, writeString } from "@/lib/storage";

const log = createLogger("game");

function statusOf(model: GameModel): string {
  return model.phase === "ready" ? model.game.status : model.phase;
}

export interface GameControls {
  model: GameModel;
  selectSlot: (slot: SlotKey) => void;
  submitGuess: (guess: string) => Promise<GuessCheck>;
  requestHint: () => Promise<void>;
  dismissNotice: () => void;
  markHowToSeen: () => void;
  retry: () => void;
}

export function useGame(): GameControls {
  const [model, rawDispatch] = useReducer(gameReducer, undefined, initialModel);
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

  // Load today's puzzle and any saved progress for it.
  useEffect(() => {
    let cancelled = false;
    const date = localDateString(appNow());
    log.debug("loading puzzle", { date, attempt: loadAttempt });
    apiClient
      .puzzle(date)
      .then((puzzle) => {
        if (cancelled) return;
        const saved = readJson(STORAGE_KEYS.game(puzzle.id), savedGameSchema);
        dispatch({
          type: "LOADED",
          puzzle,
          saved,
          budget: DEFAULT_BUDGET,
          firstVisit: readString(STORAGE_KEYS.howTo) === null,
          storageOk: storageAvailable(),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const reason = error instanceof ApiClientError && error.status === 404 ? "not_found" : "network";
        dispatch({ type: "LOAD_FAILED", reason });
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, loadAttempt]);

  // Persist progress after every change once the puzzle is known.
  useEffect(() => {
    if (model.phase === "ready" && model.puzzle) writeJson(STORAGE_KEYS.game(model.puzzle.id), model.game);
  }, [model.phase, model.puzzle, model.game]);

  // Log state transitions.
  const lastStatus = useRef<string | null>(null);
  useEffect(() => {
    const status = statusOf(model);
    if (lastStatus.current !== status) {
      log.info(`state ${lastStatus.current ?? "init"} -> ${status}`, {
        puzzleId: model.puzzle?.id,
        guessesUsed: guessesUsed(model.game),
      });
      lastStatus.current = status;
    }
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
      const slot = current.selectedSlot;
      const guess = raw.trim();
      try {
        const result = await apiClient.guess({
          puzzleId: current.puzzle.id,
          date: current.puzzle.date,
          slot,
          guess,
          deviceId: getDeviceId(),
          guessIndex: guessesUsed(current.game) + 1,
        });
        dispatch({ type: "GUESS_RESULT", slot, guess, result });
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
    const slot = current.selectedSlot;
    dispatch({ type: "USE_HINT" });
    try {
      const { firstLetter } = await apiClient.hint({
        puzzleId: current.puzzle.id,
        date: current.puzzle.date,
        slot,
        deviceId: getDeviceId(),
      });
      dispatch({ type: "HINT_RESULT", slot, letter: firstLetter });
    } catch {
      dispatch({ type: "HINT_FAILED" });
    } finally {
      busy.current = false;
    }
  }, [dispatch]);

  const selectSlot = useCallback((slot: SlotKey) => dispatch({ type: "SELECT_SLOT", slot }), [dispatch]);
  const dismissNotice = useCallback(() => dispatch({ type: "DISMISS_NOTICE" }), [dispatch]);
  const markHowToSeen = useCallback(() => writeString(STORAGE_KEYS.howTo, "1"), []);

  return { model, selectSlot, submitGuess, requestHint, dismissNotice, markHowToSeen, retry: retryLoad };
}
