// Thin (state, action) => state reducer wrapper around the pure engine
// functions in engine.ts (mirrors client/src/engine/draftReducer.ts, which
// wraps the same engine functions for React's useReducer on the client).
// Not currently wired into a React-style dispatch loop server-side — see
// draft/store.ts, which calls the engine functions directly for the same
// effect — but kept as a faithful copy per the client/server engine parity
// requirement (HANDOFF.md), and available if a future server-side consumer
// wants the same (state, action) => state shape.
//
// Toast messages are carried on state.lastToast — the UI layer is
// responsible for displaying and then clearing it (DISMISS_TOAST).

import type { DraftState } from "./types";
import { draftUnprotected, keepOwn, undo } from "./engine";

export type DraftAction =
  | { type: "INIT"; state: DraftState }
  | { type: "RESET" }
  | { type: "DRAFT_UNPROTECTED"; playerName: string }
  | { type: "KEEP_OWN"; protIdx: number }
  | { type: "UNDO" }
  | { type: "DISMISS_TOAST" };

export function draftReducer(state: DraftState | null, action: DraftAction): DraftState | null {
  switch (action.type) {
    case "INIT":
      return action.state;
    case "RESET":
      return null;
    case "DRAFT_UNPROTECTED": {
      if (!state) return state;
      const { state: next, toast } = draftUnprotected(state, action.playerName);
      return { ...next, lastToast: toast ?? null };
    }
    case "KEEP_OWN": {
      if (!state) return state;
      const { state: next, toast } = keepOwn(state, action.protIdx);
      return { ...next, lastToast: toast ?? null };
    }
    case "UNDO": {
      if (!state) return state;
      const { state: next, toast } = undo(state);
      return { ...next, lastToast: toast ?? null };
    }
    case "DISMISS_TOAST":
      return state ? { ...state, lastToast: null } : state;
    default:
      return state;
  }
}
