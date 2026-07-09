// Pure, framework-agnostic draft engine.
//
// This is a faithful transliteration of the logic in
// intuti-draft-prototype.html (buildSnake / startDraft / draftUnprotected /
// keepOwn / insertFifthJump / markFinalRoundSkip / undoPick). The behavior
// here is authoritative and tested — see HANDOFF.md Section 2 for the rules
// this implements. Do not "fix" or reinterpret the seal / 5th-place-jump
// semantics; transliterate, don't redesign.

import type {
  DraftState,
  HistorySnapshot,
  Owner,
  Pick,
  ProtectedPlayer,
} from "./types";
import { ROUNDS } from "./types";

/** Deep clone helper — mirrors the prototype's JSON.parse(JSON.stringify(...)) snapshotting. */
function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Build the continuous 10-owner, 18-round snake draft order.
 * Round order reverses every round (no reset between rounds).
 */
export function buildSnake(n: number, rounds: number): Pick[] {
  const picks: Pick[] = [];
  for (let r = 0; r < rounds; r++) {
    const row = Array.from({ length: n }, (_, i) => (r % 2 === 0 ? i : n - 1 - i));
    row.forEach((ownerIdx, slot) => {
      picks.push({
        round: r + 1,
        slot: slot + 1,
        ownerIdx,
        player: null,
        type: null,
        isSkipped: false,
        isFifthJump: false,
      });
    });
  }
  return picks;
}

/** Construct a fresh DraftState from setup-phase data (equivalent to the prototype's startDraft()). */
export function createDraftState(
  ownerNames: string[],
  protectedPlayers: ProtectedPlayer[][],
  fifthPos: number,
  numOwners = ownerNames.length,
  rounds = ROUNDS,
): DraftState {
  const owners: Owner[] = ownerNames.map((name, i) => ({
    name,
    idx: i,
    sealBroken: false,
    isFifth: i === fifthPos,
    protected: protectedPlayers[i].map((p) => ({ ...p, used: false })),
  }));

  return {
    owners,
    fifthPos,
    picks: buildSnake(numOwners, rounds),
    cur: 0,
    unprotCount: 0,
    fifthJumpUsed: false,
    fifthJumpPending: false,
    history: [],
  };
}

export function getCurPick(state: DraftState): Pick | null {
  return state.picks[state.cur] ?? null;
}

export function getCurOwner(state: DraftState): Owner | null {
  const pick = getCurPick(state);
  return pick ? state.owners[pick.ownerIdx] : null;
}

function snapshot(state: DraftState): HistorySnapshot {
  return deepClone({
    picks: state.picks,
    owners: state.owners,
    cur: state.cur,
    unprotCount: state.unprotCount,
    fifthJumpUsed: state.fifthJumpUsed,
    fifthJumpPending: state.fifthJumpPending,
  });
}

/**
 * Insert the 5th-place jump pick immediately after the current pick.
 * Mirrors insertFifthJump() in the prototype exactly: splices in a new pick
 * at S.cur + 1 (before S.cur is incremented by the caller), so that once the
 * caller does S.cur++, it lands exactly on the newly inserted jump pick.
 */
function insertFifthJump(state: DraftState): string {
  const nextIdx = state.cur + 1;
  const refPick = state.picks[state.cur];
  state.picks.splice(nextIdx, 0, {
    round: refPick.round,
    slot: refPick.slot,
    ownerIdx: state.fifthPos,
    player: null,
    type: null,
    isSkipped: false,
    isFifthJump: true,
  });
  markFinalRoundSkip(state);
  return `${state.owners[state.fifthPos].name} gets the jump pick!`;
}

/**
 * Round 18 balancing skip: find the 5th-place owner's last not-yet-played,
 * non-jump pick in the final round and mark it isSkipped. Mirrors
 * markFinalRoundSkip() exactly.
 */
function markFinalRoundSkip(state: DraftState): void {
  const finalPicks = state.picks.filter(
    (p) => p.round === ROUNDS && p.ownerIdx === state.fifthPos && !p.isFifthJump && !p.player,
  );
  if (finalPicks.length > 0) finalPicks[finalPicks.length - 1].isSkipped = true;
}

export interface EngineResult {
  state: DraftState;
  toast?: string;
}

/**
 * Draft an unprotected player for the current pick. Mirrors draftUnprotected()
 * in the prototype exactly, including that isFifthJump picks never touch
 * sealBroken or unprotCount.
 */
export function draftUnprotected(state: DraftState, playerName: string): EngineResult {
  const trimmed = playerName.trim();
  if (!trimmed) {
    return { state, toast: "Enter a player name" };
  }

  const next = deepClone(state);
  next.history.push(snapshot(state));

  const pick = getCurPick(next);
  const owner = getCurOwner(next);
  if (!pick || !owner) return { state: next };

  const isFifthJump = next.fifthJumpPending && pick.ownerIdx === next.fifthPos;

  pick.player = trimmed;

  let toast: string | undefined;

  if (isFifthJump) {
    pick.type = "fifth-jump";
    next.fifthJumpUsed = true;
    next.fifthJumpPending = false;
    next.cur++;
  } else {
    pick.type = "unprotected";
    next.unprotCount++;
    if (!owner.sealBroken) {
      owner.sealBroken = true;
      toast = `${owner.name}'s seal broken!`;
    }
    if (next.unprotCount === 2 && !next.fifthJumpUsed) {
      next.fifthJumpPending = true;
      const jumpToast = insertFifthJump(next);
      toast = jumpToast; // matches prototype: the jump toast supersedes the seal-broken toast (last showToast wins)
    }
    next.cur++;
  }

  return { state: next, toast };
}

/** Keep one of the current owner's own protected players. Mirrors keepOwn() exactly. */
export function keepOwn(state: DraftState, protIdx: number): EngineResult {
  const next = deepClone(state);
  next.history.push(snapshot(state));

  const pick = getCurPick(next);
  const owner = getCurOwner(next);
  if (!pick || !owner) return { state: next };

  owner.protected[protIdx].used = true;
  pick.player = owner.protected[protIdx].name;
  pick.type = "kept";
  next.cur++;

  return { state: next };
}

/** Undo the most recent pick via the history stack. Mirrors undoPick() exactly. */
export function undo(state: DraftState): EngineResult {
  if (!state.history.length) return { state };
  const next = deepClone(state);
  const prev = next.history.pop() as HistorySnapshot;
  next.picks = prev.picks;
  next.owners = prev.owners;
  next.cur = prev.cur;
  next.unprotCount = prev.unprotCount;
  next.fifthJumpUsed = prev.fifthJumpUsed;
  next.fifthJumpPending = prev.fifthJumpPending;

  return { state: next, toast: "Pick undone" };
}

/** Whether the current on-clock pick is the 5th-place owner's jump pick. */
export function isCurrentPickFifthJump(state: DraftState): boolean {
  const pick = getCurPick(state);
  if (!pick) return false;
  return state.fifthJumpPending && pick.ownerIdx === state.fifthPos;
}

/** Whether the "Own player" tab should be available for the current owner (hasOwn in the prototype). */
export function ownerHasKeepableProtected(owner: Owner | null): boolean {
  if (!owner) return false;
  return !owner.sealBroken && owner.protected.some((p) => !p.used);
}
