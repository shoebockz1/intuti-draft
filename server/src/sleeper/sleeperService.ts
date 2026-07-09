// Sleeper API integration — free, no-auth NFL player database used to back
// protected-player search and the "fill with test data" button.
// See HANDOFF.md Section 4 for the agreed plan/requirements.

const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";

// Sleeper's own docs say this endpoint should be hit at most once/day and the
// result cached client-side (server-side, in our case) rather than refetched
// on every request.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const FANTASY_POSITIONS = new Set(["QB", "RB", "WR", "TE", "K", "DEF"]);

/** Shape we actually care about from Sleeper's raw player object. Sleeper's
 * real payload has many more fields (birth_date, college, injury_status,
 * etc.) that we don't currently need. */
interface SleeperRawPlayer {
  player_id?: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
  team?: string | null;
  status?: string | null;
  years_exp?: number | null;
}

export interface NormalizedPlayer {
  playerId: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  status: string | null;
  isRookie: boolean;
}

interface Cache {
  players: NormalizedPlayer[];
  fetchedAt: number;
}

let cache: Cache | null = null;
// In-flight fetch promise, so concurrent requests during a cold cache don't
// trigger multiple simultaneous ~5MB downloads from Sleeper.
let inFlight: Promise<NormalizedPlayer[]> | null = null;

function isCacheFresh(c: Cache | null): c is Cache {
  return c !== null && Date.now() - c.fetchedAt < CACHE_TTL_MS;
}

function normalize(raw: Record<string, SleeperRawPlayer>): NormalizedPlayer[] {
  const out: NormalizedPlayer[] = [];

  for (const key of Object.keys(raw)) {
    const p = raw[key];
    if (!p || !p.player_id) continue;

    const position = p.position ?? "";
    if (!FANTASY_POSITIONS.has(position)) continue;

    const fullName =
      p.full_name ?? [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
    if (!fullName) continue;

    const isRookie = p.years_exp === 0;

    // Best-effort "currently relevant" filter to keep long-retired players
    // out of the list. Sleeper only exposes a live roster snapshot, not
    // historical roster data, so this is a deliberate approximation, not a
    // precise "were they on a roster at any point in the season" filter:
    //   - Keep anyone currently assigned to an NFL team (team is non-null).
    //   - Keep rookies with years_exp === 0 even if they don't have a team
    //     yet (e.g. incoming draft class players not yet rostered).
    //   - Drop everyone else, including previously-rostered veterans who are
    //     now a free agent / off all rosters (team === null with a defined
    //     years_exp) — some of these may still be fantasy-relevant (e.g.
    //     players who were rostered earlier in a season and then released or
    //     placed on IR by a team that later cut them), but Sleeper's
    //     snapshot gives us no way to distinguish "currently unrostered
    //     journeyman" from "retired a decade ago" without additional
    //     historical data we don't have. Do not "fix" this into false
    //     precision — it's a known, accepted limitation.
    const hasTeam = p.team != null;
    if (!hasTeam && !isRookie) continue;

    out.push({
      playerId: p.player_id,
      fullName,
      position,
      nflTeam: p.team ?? null,
      status: p.status ?? null,
      isRookie,
    });
  }

  return out;
}

async function fetchAndCache(): Promise<NormalizedPlayer[]> {
  const res = await fetch(SLEEPER_PLAYERS_URL);
  if (!res.ok) {
    throw new Error(`Sleeper players fetch failed: ${res.status} ${res.statusText}`);
  }
  const raw = (await res.json()) as Record<string, SleeperRawPlayer>;
  const players = normalize(raw);
  cache = { players, fetchedAt: Date.now() };
  return players;
}

/** Returns the cached, filtered/tagged player list, fetching+caching from
 * Sleeper first if the cache is empty or older than 24h. */
export async function getPlayers(): Promise<NormalizedPlayer[]> {
  if (isCacheFresh(cache)) return cache.players;

  if (!inFlight) {
    inFlight = fetchAndCache().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Case-insensitive substring search on fullName over the cached list. */
export async function searchPlayers(query: string): Promise<NormalizedPlayer[]> {
  const players = await getPlayers();
  const q = query.trim().toLowerCase();
  if (!q) return players;
  return players.filter((p) => p.fullName.toLowerCase().includes(q));
}
