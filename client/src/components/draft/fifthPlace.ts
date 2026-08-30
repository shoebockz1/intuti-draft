import type { DraftState } from "../../engine/types";

export interface FifthJumpInfo {
  /** This year's 5th place winner. */
  winnerName: string | null;
  /** Player taken with the jump pick — null until the jump has actually happened. */
  player: string | null;
  /** Where in the draft the jump landed, e.g. "After Round 1, Pick 2". Null until taken. */
  location: string | null;
  /** Triggered and on the clock, but the pick hasn't been made yet. */
  pending: boolean;
}

// Shared by FifthPlacePanel (the full panel on "/") and the one-line summary
// on /boardonly, so the two can't drift apart.
//
// Worth keeping in one place: "when" the jump happened means *where in the
// draft*, not wall-clock time. That was originally built as a timestamp and
// had to be corrected (see DONE.md) — an easy thing to get wrong again if a
// second copy of this logic existed.
export function getFifthJumpInfo(draft: DraftState): FifthJumpInfo {
  const winner = draft.owners[draft.fifthPos];
  const jumpPick = draft.picks.find((p) => p.isFifthJump && p.player != null);

  return {
    winnerName: winner?.name ?? null,
    player: jumpPick?.player ?? null,
    // insertFifthJump gives the jump pick the same round/slot as the pick it
    // follows, so these fields already describe where it landed.
    location: jumpPick ? `After Round ${jumpPick.round}, Pick ${jumpPick.slot}` : null,
    // The armed-but-not-yet-taken window. Without this, that state rendered
    // identically to "not yet triggered" — so at the exact moment the winner
    // was on the clock for the jump, both summaries claimed it hadn't happened.
    pending: draft.fifthJumpPending && !jumpPick,
  };
}
