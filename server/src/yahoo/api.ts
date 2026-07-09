import { collectionValues, flattenMeta } from "./parse";

/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

async function yahooGet(path: string, accessToken: string): Promise<any> {
  const res = await fetch(`${BASE}${path}${path.includes("?") ? "&" : "?"}format=json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export interface YahooTeam {
  teamKey: string;
  teamId: string;
  name: string;
}

export interface YahooPlayer {
  playerKey: string;
  name: string;
  position: string;
  nflTeam: string;
  status: string | null;
}

export interface YahooTeamRoster extends YahooTeam {
  players: YahooPlayer[];
}

/** Resolves the NFL game key for a given season, e.g. season="2025" -> "449". */
export async function getNflGameKey(season: string, accessToken: string): Promise<string> {
  const data = await yahooGet(`/games;seasons=${season};game_codes=nfl`, accessToken);
  const games = collectionValues(data?.fantasy_content?.games);
  const game = games[0]?.game;
  const gameMeta = Array.isArray(game) ? flattenMeta(game) : game;
  const gameKey = gameMeta?.game_key;
  if (!gameKey) {
    throw new Error(`Could not resolve NFL game key for season ${season} from Yahoo's response.`);
  }
  return String(gameKey);
}

export async function getLeagueTeams(leagueKey: string, accessToken: string): Promise<YahooTeam[]> {
  const data = await yahooGet(`/league/${leagueKey}/teams`, accessToken);
  const teamsWrap = data?.fantasy_content?.league?.[1]?.teams;
  const teamEntries = collectionValues(teamsWrap);

  return teamEntries.map((entry: any) => {
    const teamMetaArr = entry.team?.[0];
    const meta = flattenMeta(teamMetaArr);
    return {
      teamKey: String(meta.team_key),
      teamId: String(meta.team_id),
      name: String(meta.name),
    };
  });
}

function parsePlayerEntry(entry: any): YahooPlayer {
  const playerMetaArr = entry.player?.[0];
  const meta = flattenMeta(playerMetaArr);
  const positionObj = meta.display_position ?? meta.primary_position ?? "";
  return {
    playerKey: String(meta.player_key),
    name: String(meta.name?.full ?? meta.name ?? "Unknown"),
    position: String(positionObj),
    nflTeam: String(meta.editorial_team_abbr ?? ""),
    status: meta.status ?? null,
  };
}

export async function getTeamRoster(
  team: YahooTeam,
  accessToken: string,
  season: string,
): Promise<YahooTeamRoster> {
  const data = await yahooGet(`/team/${team.teamKey}/roster;season=${season}`, accessToken);
  const rosterWrap = data?.fantasy_content?.team?.[1]?.roster;
  const playersWrap = rosterWrap?.["0"]?.players ?? rosterWrap?.players;
  const playerEntries = collectionValues(playersWrap);

  return {
    ...team,
    players: playerEntries.map(parsePlayerEntry),
  };
}

/** High-level: resolve the league for a season and pull every team's full roster. */
export async function getLeagueRostersForSeason(
  leagueId: string,
  season: string,
  accessToken: string,
): Promise<YahooTeamRoster[]> {
  const gameKey = await getNflGameKey(season, accessToken);
  const leagueKey = `${gameKey}.l.${leagueId}`;
  const teams = await getLeagueTeams(leagueKey, accessToken);

  const rosters: YahooTeamRoster[] = [];
  for (const team of teams) {
    // Sequential on purpose — Yahoo's API rate-limits aggressively and this only
    // needs to run once a year, not on every keystroke.
    rosters.push(await getTeamRoster(team, accessToken, season));
  }
  return rosters;
}
