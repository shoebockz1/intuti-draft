import { Router } from "express";
import { requireCommissioner } from "../middleware/requireCommissioner";
import * as draftStore from "../draft/store";
import type { ProtectedPlayer } from "../draft/types";

// Mounted at /api/draft. Viewing the board (GET /state) is open to everyone.
// Making a pick (keep-own or draft-unprotected) is open to everyone too —
// per HANDOFF.md this is a trusted friend group with no per-owner turn
// locking; anyone present can submit a pick on behalf of whoever's on the
// clock. Setup (start) and destructive actions (undo, hard reset) are
// commissioner-only.

export const draftRouter = Router();

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error.";
}

draftRouter.get("/state", (_req, res) => {
  const state = draftStore.getDraftState();
  if (!state) {
    res.json({ started: false });
    return;
  }
  res.json(state);
});

// Read-only history of every draft action ("what happened and when"). Open
// to everyone — same visibility as /state, no commissioner gate needed since
// it doesn't mutate anything.
draftRouter.get("/log", (_req, res) => {
  res.json({ log: draftStore.getTransactionLog() });
});

draftRouter.post("/start", requireCommissioner, (req, res) => {
  const body = (req.body ?? {}) as {
    ownerNames?: unknown;
    protectedPlayers?: unknown;
    fifthPos?: unknown;
  };

  if (
    !Array.isArray(body.ownerNames) ||
    !Array.isArray(body.protectedPlayers) ||
    typeof body.fifthPos !== "number"
  ) {
    res.status(400).json({ error: "Expected { ownerNames: string[], protectedPlayers: ProtectedPlayer[][], fifthPos: number }." });
    return;
  }

  const state = draftStore.startDraft(
    body.ownerNames as string[],
    body.protectedPlayers as ProtectedPlayer[][],
    body.fifthPos,
  );
  res.json(state);
});

draftRouter.post("/pick/keep", (req, res) => {
  const { protIdx } = (req.body ?? {}) as { protIdx?: unknown };
  if (typeof protIdx !== "number") {
    res.status(400).json({ error: "Expected { protIdx: number }." });
    return;
  }
  try {
    const { state, toast } = draftStore.pickKeepOwn(protIdx);
    res.json({ state, toast });
  } catch (err) {
    res.status(409).json({ error: errorMessage(err) });
  }
});

draftRouter.post("/pick/unprotected", (req, res) => {
  const { playerName } = (req.body ?? {}) as { playerName?: unknown };
  if (typeof playerName !== "string") {
    res.status(400).json({ error: "Expected { playerName: string }." });
    return;
  }
  try {
    const { state, toast } = draftStore.pickUnprotectedPlayer(playerName);
    res.json({ state, toast });
  } catch (err) {
    res.status(409).json({ error: errorMessage(err) });
  }
});

draftRouter.post("/undo", requireCommissioner, (_req, res) => {
  try {
    const { state, toast } = draftStore.undoLastPick();
    res.json({ state, toast });
  } catch (err) {
    res.status(409).json({ error: errorMessage(err) });
  }
});

// No POST /api/draft/reset/soft route, intentionally.
//
// In the original single-tab client, "soft reset" (Return to setup) just
// navigated the local `screen` state back to "setup" while leaving the
// in-memory DraftState untouched — there was no data mutation, only a view
// change, and a "Draft in progress — resume" banner reappeared on the setup
// screen because the state was still sitting right there in the same
// useReducer.
//
// Now that the draft lives here on the server and setup/board are separate
// client routes (/admin and /), that same "soft reset" is still purely a
// view change: the server's authoritative DraftState doesn't need to change
// at all when the commissioner switches from looking at the board to
// looking at setup — it just keeps running server-side regardless of what
// anyone is looking at, and the admin screen can independently show a
// "draft in progress" banner by checking GET /api/draft/state. So there is
// nothing for a server route to do here; see AppContext.softReset on the
// client, which just calls navigate("/admin").

draftRouter.post("/reset/hard", requireCommissioner, (_req, res) => {
  draftStore.resetHard();
  res.json({ started: false });
});

// Pre-reset safety net — hard reset snapshots the current state+log before
// wiping (see draft/store.ts). Commissioner-only, same as the reset/undo
// actions it protects against.
draftRouter.get("/snapshots", requireCommissioner, (_req, res) => {
  res.json({ snapshots: draftStore.listSnapshots() });
});

draftRouter.post("/snapshots/:id/restore", requireCommissioner, (req, res) => {
  try {
    const state = draftStore.restoreSnapshot(req.params.id);
    res.json(state);
  } catch (err) {
    res.status(404).json({ error: errorMessage(err) });
  }
});
