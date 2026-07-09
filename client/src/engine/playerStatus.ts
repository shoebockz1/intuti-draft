import type { DraftState } from "./types";

// Cross-references a player name against the live DraftState to determine
// whether they're actually draftable right now. Matching is by NAME STRING
// EQUALITY, not a stable player ID — ProtectedPlayer and Pick only ever
// stored plain name strings (see types.ts), including free-text entries
// that never resolved to a real Sleeper player_id at all. This is a
// best-effort match, same caveat as the Sleeper roster cross-check done
// during setup: a slightly different spelling won't match. Good enough for
// a private league's live research aid, not a source of truth.
export type PlayerStatus = { kind: "available" } | { kind: "drafted" } | { kind: "protected"; ownerName: string };

export function getPlayerStatus(draft: DraftState, playerName: string): PlayerStatus {
  const alreadyDrafted = draft.picks.some((p) => p.player === playerName);
  if (alreadyDrafted) return { kind: "drafted" };

  const protectingOwner = draft.owners.find(
    (o) => !o.sealBroken && o.protected.some((pp) => pp.name === playerName && !pp.used),
  );
  if (protectingOwner) return { kind: "protected", ownerName: protectingOwner.name };

  return { kind: "available" };
}
