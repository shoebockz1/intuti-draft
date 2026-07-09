// Thin client for the server's authoritative draft state (/api/draft/*).
// See server/src/routes/draft.ts and server/src/draft/store.ts. The server
// holds the one true DraftState now — the client no longer owns it via a
// local reducer, it only mirrors what the server returns (see AppContext).

import type { DraftState, ProtectedPlayer } from "../engine/types";

const API_BASE = "https://localhost:4000";

/** GET /api/draft/state shape when no draft is in progress. */
export interface NotStarted {
  started: false;
}

export type DraftStateResponse = DraftState | NotStarted;

export function isDraftInProgress(data: DraftStateResponse): data is DraftState {
  return (data as Partial<DraftState>).owners !== undefined;
}

export interface PickResponse {
  state: DraftState;
  toast?: string;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
  }
  return data;
}

export async function fetchDraftState(): Promise<DraftStateResponse> {
  const res = await fetch(`${API_BASE}/api/draft/state`, { credentials: "include" });
  return jsonOrThrow<DraftStateResponse>(res);
}

export async function startDraftOnServer(
  ownerNames: string[],
  protectedPlayers: ProtectedPlayer[][],
  fifthPos: number,
): Promise<DraftState> {
  const res = await fetch(`${API_BASE}/api/draft/start`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerNames, protectedPlayers, fifthPos }),
  });
  return jsonOrThrow<DraftState>(res);
}

/** Keep one of the current owner's own protected players. Open to everyone — no commissioner session required. */
export async function pickKeepOwn(protIdx: number): Promise<PickResponse> {
  const res = await fetch(`${API_BASE}/api/draft/pick/keep`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ protIdx }),
  });
  return jsonOrThrow<PickResponse>(res);
}

/** Draft any unprotected player for the current pick. Open to everyone — no commissioner session required. */
export async function pickUnprotected(playerName: string): Promise<PickResponse> {
  const res = await fetch(`${API_BASE}/api/draft/pick/unprotected`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  return jsonOrThrow<PickResponse>(res);
}

export async function undoPick(): Promise<PickResponse> {
  const res = await fetch(`${API_BASE}/api/draft/undo`, {
    method: "POST",
    credentials: "include",
  });
  return jsonOrThrow<PickResponse>(res);
}

export async function hardResetDraft(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/draft/reset/hard`, {
    method: "POST",
    credentials: "include",
  });
  await jsonOrThrow(res);
}
