import type { PlayerStats, RemotePlayer } from "../api/players";

export type SortDirection = "asc" | "desc";
export interface SortState {
  columnId: string;
  direction: SortDirection;
}

// Fixed (always-present) columns use these ids; stat columns use their
// PlayerStats key directly as the id (e.g. "passYd"), since those are
// already unique and match what's rendered.
export const FIXED_SORT_COLUMNS = ["name", "pos", "team", "injury", "rank"] as const;

/** Ascending reads naturally for these (A→Z, best-rank-first); everything
 * else (raw counting stats) defaults to descending — most yards/TDs/etc.
 * first is what's actually useful to see first. */
export function defaultDirectionFor(columnId: string): SortDirection {
  return (FIXED_SORT_COLUMNS as readonly string[]).includes(columnId) ? "asc" : "desc";
}

function sortValue(p: RemotePlayer, columnId: string): string | number | null {
  switch (columnId) {
    case "name":
      return p.fullName;
    case "pos":
      return p.position;
    case "team":
      return p.nflTeam ?? "";
    case "injury":
      return p.injuryStatus ?? "";
    case "rank":
      return p.posRank;
    default:
      return p.stats?.[columnId as keyof PlayerStats] ?? 0;
  }
}

/** Nulls (only possible for "rank", where an unranked player is genuinely
 * unranked rather than "zero") always sort last regardless of direction —
 * flipping direction shouldn't make "unranked" appear to outrank everyone. */
function compare(a: string | number | null, b: string | number | null, direction: SortDirection): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  const cmp = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
  return direction === "asc" ? cmp : -cmp;
}

export function sortPlayers(players: RemotePlayer[], sort: SortState | null): RemotePlayer[] {
  if (!sort) return players;
  return [...players].sort((a, b) => compare(sortValue(a, sort.columnId), sortValue(b, sort.columnId), sort.direction));
}
