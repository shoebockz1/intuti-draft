import { useApp } from "../context/AppContext";
import { useDraftPolling } from "../hooks/useDraftPolling";
import PageHeader from "../components/common/PageHeader";
import OnClockBar from "../components/common/OnClockBar";
import Board from "../components/draft/Board";
import BoardLegend from "../components/draft/BoardLegend";
import { getFifthJumpInfo } from "../components/draft/fifthPlace";

// "/boardonly" — the draft board with none of the side panels.
//
// Exists because on a phone the panels dominate "/": even after the touch
// pass, the board starts roughly 880px down the page, so the thing everyone
// actually wants to look at is buried under two and a half screens of
// controls. This page gives the board the whole viewport.
//
// Deliberately read-only. Picks are made on "/" — see the "Make a pick" link
// in OnClockBar. Keeping this page incapable of mutating the draft means an
// owner can leave it open on a spare screen or a passed-around phone without
// any chance of a stray tap landing a pick.
export default function BoardOnlyRoute() {
  const { draft } = useApp();
  const { loading, error } = useDraftPolling();

  if (loading) {
    return <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text3)" }}>Loading…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text3)" }}>
        Can't reach the server: {error}
      </div>
    );
  }

  if (!draft) {
    return (
      <div>
        <PageHeader subtitle="Draft Board" />
        <p style={{ color: "var(--text3)", padding: "2rem 0", textAlign: "center" }}>
          Waiting for the commissioner to start the draft…
        </p>
      </div>
    );
  }

  const fifth = getFifthJumpInfo(draft);

  return (
    <div>
      <PageHeader subtitle="Draft Board" />
      <OnClockBar />

      {/* The board alone cannot be trusted to show the 5th place jump pick:
          the jump and the winner's own natural turn can fall in the same
          round, and the board renders one pick per (round, owner) cell, so
          the natural pick wins the cell and the jump's player disappears
          entirely. That's the whole reason FifthPlacePanel exists on "/", and
          a bare board here would reintroduce the same blind spot. */}
      <div className="fifth-line">
        <span className="fifth-line-label">5th-place pick:</span>
        {fifth.player ? (
          <>
            <span className="fifth-line-player">{fifth.player}</span>
            <span className="fifth-line-meta">
              {" "}
              — {fifth.winnerName} · {fifth.location}
            </span>
          </>
        ) : fifth.pending ? (
          <span className="fifth-line-player">
            on the clock now — {fifth.winnerName ?? "?"} is taking the jump pick
          </span>
        ) : (
          <span className="fifth-line-meta">
            not yet triggered — {fifth.winnerName ?? "?"} jumps the order once the 2nd unprotected pick is made
          </span>
        )}
      </div>

      <BoardLegend />

      {/* Ten columns cannot fit a phone held upright, but they fit landscape
          comfortably (~726px of board in ~788px of viewport), so point that
          out rather than leaving people scrolling sideways. Portrait-only. */}
      <div className="rotate-hint">Rotate your phone to see all 10 teams without scrolling.</div>

      <div className="board-outer">
        <Board />
      </div>
    </div>
  );
}
