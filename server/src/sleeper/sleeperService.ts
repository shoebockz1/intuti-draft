// Sleeper API integration — free, no-auth NFL player database + season stats
// used to back protected-player search, the "fill with test data" button,
// and the Free Agent research page. See HANDOFF.md Section 4 for the agreed
// plan/requirements.

const SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl";
const STATS_SEASON = "2025"; // matches "Load 2025 rosters" elsewhere — protecting 2025 rosters, drafting for 2026.
const SLEEPER_STATS_URL = `https://api.sleeper.app/v1/stats/nfl/regular/${STATS_SEASON}`;

// Sleeper's own docs say the players endpoint should be hit at most once/day
// and the result cached client-side (server-side, in our case) rather than
// refetched on every request. Applying the same policy to the stats
// endpoint, which is a similarly large full-league dump.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const FANTASY_POSITIONS = new Set(["QB", "RB", "WR", "TE", "K", "DEF"]);

/** Shape we actually care about from Sleeper's raw player object. Sleeper's
 * real payload has many more fields (birth_date, college, height/weight,
 * various other-platform IDs, etc.) that we don't currently need. */
interface SleeperRawPlayer {
  player_id?: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
  team?: string | null;
  status?: string | null;
  years_exp?: number | null;
  injury_status?: string | null;
  age?: number | null;
  search_rank?: number | null;
  depth_chart_order?: number | null;
}

/** Raw per-player season stat fields we care about, across all positions —
 * verified directly against Sleeper's real /v1/stats/nfl/regular/{season}
 * response (field names are not documented anywhere reliable, so these were
 * confirmed by inspecting real player payloads, not guessed). Every field is
 * optional since a given player object only contains keys relevant to what
 * they actually recorded (a kicker has no pass_yd key at all, not pass_yd:0). */
interface SleeperRawStats {
  gp?: number;
  pos_rank_std?: number;
  // passing (QB)
  pass_cmp?: number;
  pass_att?: number;
  pass_yd?: number;
  pass_td?: number;
  pass_int?: number;
  // rushing (QB/RB)
  rush_att?: number;
  rush_yd?: number;
  rush_td?: number;
  // receiving (RB/WR/TE)
  rec?: number;
  rec_tgt?: number;
  rec_yd?: number;
  rec_td?: number;
  // kicking (K)
  fgm?: number;
  fga?: number;
  xpm?: number;
  xpa?: number;
  // team defense (DEF) — player_id for these entries is the team abbreviation itself
  sack?: number;
  int?: number;
  fum_rec?: number;
  def_td?: number;
  pts_allow?: number;
}

/** Raw stat counts, already mapped to camelCase and narrowed to whatever's
 * relevant for this player's position — see POSITION_STAT_KEYS below for
 * which keys appear for which position. Deliberately raw counting stats
 * only (receptions, yards, TDs, etc.), not fantasy points — see HANDOFF.md
 * discussion: points depend on league scoring settings we don't track,
 * raw production doesn't. */
export type PlayerStats = Partial<{
  passCmp: number;
  passAtt: number;
  passYd: number;
  passTd: number;
  passInt: number;
  rushAtt: number;
  rushYd: number;
  rushTd: number;
  rec: number;
  recTgt: number;
  recYd: number;
  recTd: number;
  fgm: number;
  fga: number;
  xpm: number;
  xpa: number;
  sack: number;
  int: number;
  fumRec: number;
  defTd: number;
  ptsAllow: number;
}>;

const POSITION_STAT_KEYS: Record<string, (keyof PlayerStats)[]> = {
  QB: ["passCmp", "passAtt", "passYd", "passTd", "passInt", "rushYd", "rushTd"],
  RB: ["rushAtt", "rushYd", "rushTd", "rec", "recYd", "recTd"],
  WR: ["rec", "recTgt", "recYd", "recTd"],
  TE: ["rec", "recTgt", "recYd", "recTd"],
  K: ["fgm", "fga", "xpm", "xpa"],
  DEF: ["sack", "int", "fumRec", "defTd", "ptsAllow"],
};

const RAW_TO_CAMEL: Record<keyof SleeperRawStats, keyof PlayerStats | null> = {
  gp: null,
  pos_rank_std: null,
  pass_cmp: "passCmp",
  pass_att: "passAtt",
  pass_yd: "passYd",
  pass_td: "passTd",
  pass_int: "passInt",
  rush_att: "rushAtt",
  rush_yd: "rushYd",
  rush_td: "rushTd",
  rec: "rec",
  rec_tgt: "recTgt",
  rec_yd: "recYd",
  rec_td: "recTd",
  fgm: "fgm",
  fga: "fga",
  xpm: "xpm",
  xpa: "xpa",
  sack: "sack",
  int: "int",
  fum_rec: "fumRec",
  def_td: "defTd",
  pts_allow: "ptsAllow",
};

export interface NormalizedPlayer {
  playerId: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  status: string | null;
  isRookie: boolean;
  /** e.g. "Questionable" / "Out" / "IR" — distinct from the generic roster `status` above. */
  injuryStatus: string | null;
  age: number | null;
  yearsExp: number | null;
  /** Sleeper's own relevance ranking — lower is more prominent/well-known. Used to sort
   * "browse everyone" (no position filter) so stars surface before deep bench players. Not
   * present for every player (mainly deep/inactive ones); those sort last. */
  searchRank: number | null;
  /** 1 = starter at that position on their team, per Sleeper's depth chart. Null if unknown. */
  depthChartOrder: number | null;
  /** Standard-scoring fantasy rank within this player's position for the 2025 season (1 = best
   * at that position). Used as the sort key once a specific position is selected — a raw
   * cross-position comparison (a WR ranked 5th vs a QB ranked 5th) isn't meaningful, so this
   * only drives sorting/display when browsing one position at a time, not the "ALL" view. */
  posRank: number | null;
  gamesPlayed: number | null;
  /** Raw 2025 season counting stats, position-appropriate keys only (see POSITION_STAT_KEYS).
   * Null if Sleeper has no stat record for this player at all (e.g. an incoming rookie who
   * hasn't played an NFL snap yet). */
  stats: PlayerStats | null;
}

interface PlayersCache {
  players: NormalizedPlayer[];
  fetchedAt: number;
}

let cache: PlayersCache | null = null;
// In-flight fetch promise, so concurrent requests during a cold cache don't
// trigger multiple simultaneous large downloads from Sleeper.
let inFlight: Promise<NormalizedPlayer[]> | null = null;

function isCacheFresh(c: PlayersCache | null): c is PlayersCache {
  return c !== null && Date.now() - c.fetchedAt < CACHE_TTL_MS;
}

function extractStats(raw: SleeperRawStats | undefined, position: string): { stats: PlayerStats | null; posRank: number | null; gamesPlayed: number | null } {
  if (!raw) return { stats: null, posRank: null, gamesPlayed: null };

  const wantedKeys = new Set(POSITION_STAT_KEYS[position] ?? []);
  const stats: PlayerStats = {};
  for (const [rawKey, camelKey] of Object.entries(RAW_TO_CAMEL) as [keyof SleeperRawStats, keyof PlayerStats | null][]) {
    if (!camelKey || !wantedKeys.has(camelKey)) continue;
    const value = raw[rawKey];
    if (typeof value === "number") stats[camelKey] = value;
  }

  return {
    stats: Object.keys(stats).length > 0 ? stats : null,
    posRank: typeof raw.pos_rank_std === "number" ? raw.pos_rank_std : null,
    gamesPlayed: typeof raw.gp === "number" ? raw.gp : null,
  };
}

function normalize(
  raw: Record<string, SleeperRawPlayer>,
  statsRaw: Record<string, SleeperRawStats>,
): NormalizedPlayer[] {
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

    const { stats, posRank, gamesPlayed } = extractStats(statsRaw[p.player_id], position);

    out.push({
      playerId: p.player_id,
      fullName,
      position,
      nflTeam: p.team ?? null,
      status: p.status ?? null,
      isRookie,
      injuryStatus: p.injury_status ?? null,
      age: p.age ?? null,
      yearsExp: p.years_exp ?? null,
      searchRank: p.search_rank ?? null,
      depthChartOrder: p.depth_chart_order ?? null,
      posRank,
      gamesPlayed,
      stats,
    });
  }

  // Sort once here so the "ALL positions" browse view gets a consistent
  // "most prominent players first" order for free — Sleeper's own relevance
  // ranking, lower is more well-known. Players without a rank (mostly deep
  // bench/inactive) sort after everyone who has one. Once a specific
  // position is selected, queryPlayers() re-sorts by posRank instead — see
  // there for why cross-position rank comparison isn't meaningful.
  out.sort((a, b) => {
    if (a.searchRank != null && b.searchRank != null) return a.searchRank - b.searchRank;
    if (a.searchRank != null) return -1;
    if (b.searchRank != null) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  return out;
}

async function fetchAndCache(): Promise<NormalizedPlayer[]> {
  const [playersRes, statsRes] = await Promise.all([
    fetch(SLEEPER_PLAYERS_URL),
    fetch(SLEEPER_STATS_URL),
  ]);
  if (!playersRes.ok) {
    throw new Error(`Sleeper players fetch failed: ${playersRes.status} ${playersRes.statusText}`);
  }
  // Stats failing shouldn't take down the whole player list — fall back to
  // no stats data (players list still works, just without stat columns)
  // rather than erroring the entire /api/players endpoint over it.
  const statsRaw: Record<string, SleeperRawStats> = statsRes.ok
    ? ((await statsRes.json()) as Record<string, SleeperRawStats>)
    : {};

  const raw = (await playersRes.json()) as Record<string, SleeperRawPlayer>;
  const players = normalize(raw, statsRaw);
  cache = { players, fetchedAt: Date.now() };
  return players;
}

/** Returns the cached, filtered/tagged player list (with merged season
 * stats), fetching+caching from Sleeper first if the cache is empty or
 * older than 24h. */
export async function getPlayers(): Promise<NormalizedPlayer[]> {
  if (isCacheFresh(cache)) return cache.players;

  if (!inFlight) {
    inFlight = fetchAndCache().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export interface PlayerQuery {
  /** Case-insensitive substring match on fullName. Omit/empty to not filter by name. */
  search?: string;
  /** Exact position code (QB/RB/WR/TE/K/DEF), case-insensitive. Omit/empty for all positions. */
  position?: string;
}

/** Filters the cached player list by name substring and/or exact position
 * (both optional, combine as AND). Calling with neither returns the full
 * list sorted by overall prominence (searchRank) — "browse all free agents"
 * with nothing selected. Calling with a position filters to just that
 * position AND re-sorts by that position's standard-scoring fantasy rank
 * (posRank) instead — cross-position searchRank order doesn't reflect
 * fantasy value the way an in-position rank does. */
export async function queryPlayers({ search, position }: PlayerQuery = {}): Promise<NormalizedPlayer[]> {
  let players = await getPlayers();

  const pos = position?.trim().toUpperCase();
  if (pos) {
    players = players.filter((p) => p.position === pos);
    players = [...players].sort((a, b) => {
      if (a.posRank != null && b.posRank != null) return a.posRank - b.posRank;
      if (a.posRank != null) return -1;
      if (b.posRank != null) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
  }

  const q = search?.trim().toLowerCase();
  if (q) {
    players = players.filter((p) => p.fullName.toLowerCase().includes(q));
  }

  return players;
}
