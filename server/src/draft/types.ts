// Framework-agnostic types for the Intuti draft engine.
// These mirror the state shape used in the original single-file prototype
// (intuti-draft-prototype.html) exactly — do not redesign the shape, only
// the organization/typing.

export const ROUNDS = 18;
export const NUM_OWNERS = 10;

export interface ProtectedPlayer {
  name: string;
  used: boolean;
}

export interface Owner {
  name: string;
  idx: number;
  sealBroken: boolean;
  isFifth: boolean;
  protected: ProtectedPlayer[];
}

export type PickType = "kept" | "unprotected" | "fifth-jump" | null;

export interface Pick {
  round: number;
  slot: number;
  ownerIdx: number;
  player: string | null;
  type: PickType;
  isSkipped: boolean;
  isFifthJump: boolean;
}

/** One entry in the undo history stack — a full snapshot taken before each pick. */
export interface HistorySnapshot {
  picks: Pick[];
  owners: Owner[];
  cur: number;
  unprotCount: number;
  fifthJumpUsed: boolean;
  fifthJumpPending: boolean;
}

export interface DraftState {
  owners: Owner[];
  fifthPos: number;
  picks: Pick[];
  cur: number;
  unprotCount: number;
  fifthJumpUsed: boolean;
  fifthJumpPending: boolean;
  history: HistorySnapshot[];
  /** Transient toast message set by the last reducer action, if any. UI clears it after display. */
  lastToast?: string | null;
}

/** Setup-phase data — exists before a DraftState is created via startDraft. */
export interface SetupState {
  ownerNames: string[];
  protectedPlayers: ProtectedPlayer[][];
  fifthPos: number;
}
