import { useApp } from "../../context/AppContext";
import OnClockPanel from "./OnClockPanel";
import PickPanel from "./PickPanel";
import ProtectedPanel from "./ProtectedPanel";
import StatusPanel from "./StatusPanel";
import Board from "./Board";
import ResearchSidebar from "./ResearchSidebar";
import WhoAmIModal from "../modals/WhoAmIModal";

export default function DraftScreen() {
  const { draft, isCommissioner, undoLastPick, rightSidebarOpen, setRightSidebarOpen, myOwnerIdx, setWhoAmIOpen } =
    useApp();

  if (!draft) return null;

  const me = draft.owners[myOwnerIdx];

  const undoDisabled = draft.history.length === 0;

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
          <button className="btn sm toggle-right-btn" onClick={() => setRightSidebarOpen(!rightSidebarOpen)}>
            {rightSidebarOpen ? "Research ◂" : "Research ▸"}
          </button>
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

      <div className="legend">
        <div className="legend-item">
          <div className="ldot" style={{ background: "rgba(186,117,23,.5)" }} />
          on clock
        </div>
        <div className="legend-item">
          <div className="ldot" style={{ background: "rgba(29,158,117,.4)" }} />
          kept own
        </div>
        <div className="legend-item">
          <div className="ldot" style={{ background: "rgba(55,138,221,.4)" }} />
          unprotected
        </div>
        <div className="legend-item">
          <div className="ldot" style={{ background: "rgba(127,119,221,.5)" }} />
          5th jump
        </div>
        <div className="legend-item">
          <div className="ldot" style={{ background: "var(--bg2)" }} />
          skipped
        </div>
      </div>

      <div className={`draft-layout ${rightSidebarOpen ? "with-right" : ""}`}>
        <div className="sidebar">
          <div className="panel">
            <OnClockPanel />
          </div>
          <div className="panel">
            <PickPanel />
          </div>
          <div className="panel" style={{ maxHeight: 200, overflowY: "auto" }}>
            <ProtectedPanel />
          </div>
          <div className="panel">
            <StatusPanel />
          </div>
        </div>
        <div className="board-outer">
          <Board />
        </div>
        {rightSidebarOpen && (
          <div className="right-sidebar">
            <ResearchSidebar />
          </div>
        )}
      </div>

      <WhoAmIModal />
    </div>
  );
}
