import { useApp } from "../../context/AppContext";

// Bottom-of-left-sidebar panel showing the 5th place winner's jump pick.
// Exists because the board itself can't reliably show this: the jump pick
// and the winner's own natural turn can share the same round, and the
// board only has one cell per (round, owner) — whichever pick is NOT the
// jump wins that cell, so the jump's player can end up completely hidden
// there. This panel is a dedicated, always-correct place to see it instead
// of trying to redesign the board's per-cell rendering. See conversation
// history / a real reproduction of the hidden-cell case before assuming
// this panel is redundant with the board.
export default function FifthPlacePanel() {
  const { draft } = useApp();

  if (!draft) return null;

  const winner = draft.owners[draft.fifthPos];
  const jumpPick = draft.picks.find((p) => p.isFifthJump && p.player != null);

  // "Where in the draft" the jump happened, not when in real time — the
  // jump pick is inserted with the same round/slot as the pick it follows
  // (see insertFifthJump in the engine), so those fields already say
  // exactly where it landed in the draft order.
  const location = jumpPick ? `After Round ${jumpPick.round}, Pick ${jumpPick.slot}` : null;

  return (
    <div className="panel">
      <div className="slabel">5th Place Jump Pick</div>
      {!jumpPick ? (
        <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
          Not yet triggered — {winner?.name ?? "?"} is this year's 5th place winner and will jump the order once the
          2nd unprotected pick is made.
        </div>
      ) : (
        <div style={{ fontSize: 12 }}>
          <div style={{ color: "var(--text)", marginBottom: 2 }}>{winner?.name ?? "?"}</div>
          <div style={{ color: "var(--purple)", marginBottom: 2 }}>{jumpPick.player}</div>
          {location && <div style={{ fontSize: 10, color: "var(--text3)" }}>{location}</div>}
        </div>
      )}
    </div>
  );
}
