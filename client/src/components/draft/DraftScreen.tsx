import { useApp } from "../../context/AppContext";
import OnClockPanel from "./OnClockPanel";
import PickPanel from "./PickPanel";
import ProtectedPanel from "./ProtectedPanel";
import StatusPanel from "./StatusPanel";
import FifthPlacePanel from "./FifthPlacePanel";
import Board from "./Board";
import BoardLegend from "./BoardLegend";
import PageNav from "../common/PageNav";
import ResearchSidebar from "./ResearchSidebar";

export default function DraftScreen() {
  const { draft, isCommissioner, undoLastPick, myOwnerIdx, setWhoAmIOpen } = useApp();

  if (!draft) return null;

  const me = draft.owners[myOwnerIdx];

  // historyDepth comes from the server; the array is always empty over the wire.
  const undoDisabled = (draft.historyDepth ?? draft.history.length) === 0;

  return (
    <div>
      <div className="draft-header">
        <div>
          <h1>Intuti</h1>
          <div className="league-sub">Fantasy Football · Live Draft</div>
        </div>
        <div className="header-actions">
          {me && (
            <button
              className="btn sm"
              onClick={() => setWhoAmIOpen(true)}
              title="Change who you're viewing this as"
            >
              You: {me.name} (change)
            </button>
          )}
          <div className="counter-pill">
            Unprotected: <span className="counter-big">{draft.unprotCount}</span>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>/3</span>
          </div>
          {isCommissioner && (
            // Undo is commissioner-only per HANDOFF.md — it mutates shared
            // state, unlike making a pick, which is open to everyone. Hidden
            // entirely (not just disabled) for non-commissioner viewers.
            // Reset lives on /admin only now, not on the shared board — see
            // SetupScreen.tsx. Keeping something this destructive off the
            // screen everyone's looking at during a live draft, even though
            // it was already commissioner-gated here too, reduces the
            // chance of a stray click on a shared/passed-around device.
            <button className="btn sm" disabled={undoDisabled} onClick={() => void undoLastPick()}>
              ↩ Undo
            </button>
          )}
        </div>
      </div>

      {/* The only addition to this screen from the tab-workspace work. "/"
          is the default landing page, so without a link out nobody would ever
          discover /boardonly or /rosters — especially on a phone, where this
          screen's panels are exactly the thing those pages exist to escape. */}
      <PageNav className="page-nav-standalone" />

      <BoardLegend />

      <div className="draft-layout">
        {/* The p-* classes carry the mobile stacking order (see draft.css).
            They're explicit rather than :nth-child so inserting a panel here
            can't silently reshuffle the phone layout. */}
        <div className="sidebar">
          <div className="panel p-onclock">
            <OnClockPanel />
          </div>
          <div className="panel p-pick">
            <PickPanel />
          </div>
          <div className="panel p-protected">
            <ProtectedPanel />
          </div>
          <div className="panel p-status">
            <StatusPanel />
          </div>
          <FifthPlacePanel />
        </div>
        <div className="board-outer">
          <Board />
        </div>
        <div className="right-sidebar">
          <ResearchSidebar />
        </div>
      </div>
    </div>
  );
}
