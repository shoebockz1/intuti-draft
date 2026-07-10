import type { DraftState } from "./types";

// Cross-references a player name against the live DraftState to determine
// whether they're actually draftable right now. Matching is by NAME STRING,
// not a stable player ID — ProtectedPlayer and Pick only ever stored plain
// name strings (see types.ts), including free-text entries that never
// resolved to a real Sleeper player_id at all. This is a best-effort match,
// same caveat as the Sleeper roster cross-check done during setup: a
// genuinely different spelling won't match. Good enough for a private
// league's live research aid, not a source of truth.
//
// Names are compared after normalizing away suffixes (Jr./Sr./II/III/IV),
// punctuation, and case — found via real QA: Sleeper's canonical name for a
// player is often suffix-free ("James Cook", "Travis Etienne") while
// hand-transcribed roster data included the suffix ("James Cook III",
// "Travis Etienne Jr."), so an exact-string match silently failed and a
// rostered player showed up as "available." Comparing normalized forms
// fixes this regardless of which side (if either) has the suffix.
export type PlayerStatus = { kind: "available" } | { kind: "drafted" } | { kind: "protected"; ownerName: string };

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (e.g. accented letters)
    .replace(/[.']/g, "")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPlayerStatus(draft: DraftState, playerName: string): PlayerStatus {
  const target = normalizeName(playerName);

  const alreadyDrafted = draft.picks.some((p) => p.player != null && normalizeName(p.player) === target);
  if (alreadyDrafted) return { kind: "drafted" };

  const protectingOwner = draft.owners.find(
    (o) => !o.sealBroken && o.protected.some((pp) => normalizeName(pp.name) === target && !pp.used),
  );
  if (protectingOwner) return { kind: "protected", ownerName: protectingOwner.name };

  return { kind: "available" };
}
