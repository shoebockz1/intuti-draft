// Thin client for the server's Sleeper-backed /api/players route.
// See HANDOFF.md Section 4 and server/src/sleeper/sleeperService.ts.

import { API_BASE } from "./config";

export interface RemotePlayer {
  playerId: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  status: string | null;
  isRookie: boolean;
  injuryStatus: string | null;
  age: number | null;
  yearsExp: number | null;
  searchRank: number | null;
  depthChartOrder: number | null;
}

interface PlayersResponse {
  players: RemotePlayer[];
}

export interface PlayerQuery {
  search?: string;
  position?: string;
}

/** Query players by name substring and/or exact position (both optional,
 * combine as AND). The server returns results pre-sorted by Sleeper's own
 * relevance ranking, so no client-side sorting is needed. Calling with
 * neither filter returns the full rank-sorted list — this is what powers
 * "browse all free agents" with no search text. */
export async function queryPlayers({ search, position }: PlayerQuery = {}): Promise<RemotePlayer[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (position) params.set("position", position);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/players${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`Failed to fetch players: ${res.status}`);
  const data = (await res.json()) as PlayersResponse;
  return data.players;
}

/** Fetch the full (cached, rank-sorted) player list from the server. Throws on
 * network failure or non-2xx — callers should catch and fall back gracefully
 * (e.g. to the fake-name generator) since this depends on both our server
 * being up and Sleeper being reachable. */
export async function fetchAllPlayers(): Promise<RemotePlayer[]> {
  return queryPlayers();
}

/** Search players by (case-insensitive substring) name via the server, so the
 * client doesn't need to download/hold the whole ~1000+ player list just to
 * power a search box. */
export async function searchPlayers(query: string): Promise<RemotePlayer[]> {
  return queryPlayers({ search: query });
}
