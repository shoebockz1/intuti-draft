// The server's single, in-memory, authoritative DraftState, plus an
// append-only transaction log and a small pre-reset snapshot store. There's
// exactly one league / one draft at a time (see HANDOFF.md — no
// multi-tenancy needed), so plain module-level variables are sufficient —
// no database.
//
// Every mutation below also fires an async, best-effort write to Upstash
// Redis (see persistence/draftPersistence.ts) so state survives a server
// restart/redeploy, not just live in process memory. Persistence is
// optional — if not configured, these calls are silent no-ops and behavior
// is identical to before.

import type { DraftState, ProtectedPlayer } from "./types";
import { createDraftState, draftUnprotected, keepOwn, undo as undoEngine } from "./engine";
import { loadPersistedState, savePersistedState } from "../persistence/draftPersistence";

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

let draftState: DraftState | null = null;

export function getDraftState(): DraftState | null {
  return draftState;
}

/** Bundles current in-memory state and fires an async, best-effort save —
 * called at the end of every mutation below. Never awaited by callers of
 * those mutations; a slow/failed Redis write should never delay or fail an
 * actual draft pick (see savePersistedState's own error handling). */
function persistNow(): void {
  void savePersistedState({ draftState, transactionLog, snapshots });
}

/** Called once at server startup, before the server accepts requests — see
 * index.ts. Populates the module-level state from Redis if anything was
 * saved there; leaves everything at its fresh-boot defaults otherwise
 * (including when persistence isn't configured at all). */
export async function hydrateFromPersistence(): Promise<void> {
  const payload = await loadPersistedState();
  if (!payload) return;
  draftState = payload.draftState;
  transactionLog = payload.transactionLog;
  snapshots = payload.snapshots;
}

// ---------------------------------------------------------------------------
// Transaction log — a human-readable, append-only record of "what happened
// and when," separate from DraftState (which only holds the data needed to
// render/replay the board). Appended to from inside the same operations
// below that already mutate draftState, rather than reverse-engineered from
// state diffs elsewhere.
// ---------------------------------------------------------------------------

export type TransactionAction =
  | "start"
  | "keep"
  | "unprotected"
  | "fifth-jump"
  | "undo"
  | "soft-reset" // currently never appended — soft reset is a pure client-side navigation with no server mutation, see routes/draft.ts
  | "hard-reset"
  | "restore";

export interface TransactionLogEntry {
  timestamp: string; // ISO 8601
  action: TransactionAction;
  ownerName?: string;
  playerName?: string;
  detail?: string;
}

let transactionLog: TransactionLogEntry[] = [];

function appendLog(entry: Omit<TransactionLogEntry, "timestamp">): void {
  transactionLog.push({ timestamp: new Date().toISOString(), ...entry });
}

export function getTransactionLog(): TransactionLogEntry[] {
  return transactionLog;
}

// ---------------------------------------------------------------------------
// Pre-reset snapshots — a small safety net so a commissioner who fat-fingers
// "Wipe everything" (or wipes prematurely) can get the draft back. Captured
// only on hard reset (the only operation that actually discards state);
// soft reset never mutates server state at all, so there's nothing to
// snapshot there. Keeps the last MAX_SNAPSHOTS, oldest dropped first.
// ---------------------------------------------------------------------------

export interface DraftSnapshot {
  id: string;
  timestamp: string;
  state: DraftState;
  log: TransactionLogEntry[];
}

export interface SnapshotSummary {
  id: string;
  timestamp: string;
  round: number;
  pickNumber: number;
  picksCompleted: number;
}

const MAX_SNAPSHOTS = 5;
let snapshots: DraftSnapshot[] = [];

function pushSnapshot(): void {
  if (!draftState) return;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  snapshots.push({
    id,
    timestamp: new Date().toISOString(),
    state: deepClone(draftState),
    log: deepClone(transactionLog),
  });
  if (snapshots.length > MAX_SNAPSHOTS) snapshots.shift();
}

/** Newest first, with just enough summary info for a commissioner to tell snapshots apart. */
export function listSnapshots(): SnapshotSummary[] {
  return [...snapshots].reverse().map((s) => {
    const pick = s.state.picks[s.state.cur] ?? s.state.picks[s.state.picks.length - 1];
    return {
      id: s.id,
      timestamp: s.timestamp,
      round: pick?.round ?? s.state.picks[s.state.picks.length - 1].round,
      pickNumber: s.state.cur + 1,
      picksCompleted: s.state.picks.filter((p) => p.player !== null).length,
    };
  });
}

export function restoreSnapshot(id: string): DraftState {
  const snap = snapshots.find((s) => s.id === id);
  if (!snap) {
    throw new Error("Snapshot not found.");
  }
  draftState = deepClone(snap.state);
  transactionLog = deepClone(snap.log);
  appendLog({ action: "restore", detail: `Restored from pre-reset snapshot ${id}` });
  persistNow();
  return draftState;
}

// ---------------------------------------------------------------------------
// State mutations — each wraps the corresponding pure engine call and
// appends a transaction log entry describing what happened.
// ---------------------------------------------------------------------------

export function startDraft(
  ownerNames: string[],
  protectedPlayers: ProtectedPlayer[][],
  fifthPos: number,
): DraftState {
  draftState = createDraftState(ownerNames, protectedPlayers, fifthPos);
  transactionLog = [];
  appendLog({
    action: "start",
    detail: `Draft started — ${ownerNames.length} owners, 5th place: ${ownerNames[fifthPos] ?? "?"}`,
  });
  persistNow();
  return draftState;
}

export interface PickResult {
  state: DraftState;
  toast?: string;
}

function requireInProgress(): DraftState {
  if (!draftState) {
    throw new Error("No draft is currently in progress.");
  }
  return draftState;
}

/** Keep one of the current owner's own protected players. Open to everyone — see HANDOFF.md, no per-owner turn locking. */
export function pickKeepOwn(protIdx: number): PickResult {
  const current = requireInProgress();
  const ownerName = current.owners[current.picks[current.cur]?.ownerIdx]?.name;
  const pickIdx = current.cur;
  const { state, toast } = keepOwn(current, protIdx);
  draftState = state;
  const filledPick = state.picks[pickIdx];
  appendLog({ action: "keep", ownerName, playerName: filledPick?.player ?? undefined });
  persistNow();
  return { state, toast };
}

/** Draft any unprotected player for the current pick. Open to everyone. */
export function pickUnprotectedPlayer(playerName: string): PickResult {
  const current = requireInProgress();
  const ownerName = current.owners[current.picks[current.cur]?.ownerIdx]?.name;
  const pickIdx = current.cur;
  const { state, toast } = draftUnprotected(current, playerName);
  draftState = state;
  const filledPick = state.picks[pickIdx];
  const action: TransactionAction = filledPick?.type === "fifth-jump" ? "fifth-jump" : "unprotected";
  appendLog({ action, ownerName, playerName: filledPick?.player ?? undefined });
  persistNow();
  return { state, toast };
}

/** Undo the most recent pick. Commissioner-only — enforced at the route level. */
export function undoLastPick(): PickResult {
  const current = requireInProgress();
  const undonePick = current.cur > 0 ? current.picks[current.cur - 1] : undefined;
  const ownerName = undonePick ? current.owners[undonePick.ownerIdx]?.name : undefined;
  const { state, toast } = undoEngine(current);
  draftState = state;
  appendLog({ action: "undo", ownerName, playerName: undonePick?.player ?? undefined });
  persistNow();
  return { state, toast };
}

/** Hard reset — snapshots the current state+log (if any), then wipes both back to empty. Commissioner-only — enforced at the route level. */
export function resetHard(): void {
  if (draftState) {
    appendLog({ action: "hard-reset", detail: "Draft wiped by commissioner." });
    pushSnapshot();
  }
  draftState = null;
  transactionLog = [];
  // Persist even after wiping — this saves the pre-reset snapshot pushed
  // above, so it's still restorable even if the server restarts before
  // anyone gets around to using it.
  persistNow();
}
