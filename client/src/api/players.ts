// Thin client for the server's Sleeper-backed /api/players route.
// See HANDOFF.md Section 4 and server/src/sleeper/sleeperService.ts.

// The server always runs over HTTPS locally on port 4000 (see server/src/index.ts
// and its mkcert-based cert setup) — there's no env-based config on the client
// side yet, so this mirrors the server's fixed dev port directly.
const API_BASE = "https://localhost:4000";

export interface RemotePlayer {
  playerId: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  status: string | null;
  isRookie: boolean;
}

interface PlayersResponse {
  players: RemotePlayer[];
}

/** Fetch the full (cached, filtered) player list from the server. Throws on
 * network failure or non-2xx — callers should catch and fall back gracefully
 * (e.g. to the fake-name generator) since this depends on both our server
 * being up and Sleeper being reachable. */
export async function fetchAllPlayers(): Promise<RemotePlayer[]> {
  const res = await fetch(`${API_BASE}/api/players`);
  if (!res.ok) throw new Error(`Failed to fetch players: ${res.status}`);
  const data = (await res.json()) as PlayersResponse;
  return data.players;
}

/** Search players by (case-insensitive substring) name via the server, so the
 * client doesn't need to download/hold the whole ~1000+ player list just to
 * power a search box. */
export async function searchPlayers(query: string): Promise<RemotePlayer[]> {
  const res = await fetch(`${API_BASE}/api/players?search=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Failed to search players: ${res.status}`);
  const data = (await res.json()) as PlayersResponse;
  return data.players;
}
