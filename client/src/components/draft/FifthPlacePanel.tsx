import { useApp } from "../../context/AppContext";
import { getFifthJumpInfo } from "./fifthPlace";

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

  const { winnerName, player, location, pending } = getFifthJumpInfo(draft);

  return (
    <div className="panel p-fifth">
      <div className="slabel">5th Place Jump Pick</div>
      {!player && pending ? (
        <div style={{ fontSize: 12, color: "var(--purple)", lineHeight: 1.5 }}>
          On the clock now — {winnerName ?? "?"} is taking the jump pick.
        </div>
      ) : !player ? (
        <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
          Not yet triggered — {winnerName ?? "?"} is this year's 5th place winner and will jump the order once the
          2nd unprotected pick is made.
        </div>
      ) : (
        <div style={{ fontSize: 12 }}>
          <div style={{ color: "var(--text)", marginBottom: 2 }}>{winnerName ?? "?"}</div>
          <div style={{ color: "var(--purple)", marginBottom: 2 }}>{player}</div>
          {location && <div style={{ fontSize: 10, color: "var(--text3)" }}>{location}</div>}
        </div>
      )}
    </div>
  );
}
