import { useApp } from "../../context/AppContext";
import OnClockPanel from "./OnClockPanel";
import PickPanel from "./PickPanel";
import ProtectedPanel from "./ProtectedPanel";
import StatusPanel from "./StatusPanel";
import Board from "./Board";
import ResearchSidebar from "./ResearchSidebar";
import WhoAmIModal from "../modals/WhoAmIModal";
import ResetModal from "../modals/ResetModal";

export default function DraftScreen() {
  const { draft, isCommissioner, undoLastPick, rightSidebarOpen, setRightSidebarOpen, setResetModalOpen } = useApp();

  if (!draft) return null;

  const undoDisabled = draft.history.length === 0;

  return (
    <div>
      <div className="draft-header">
        <div>
          <h1>Intuti</h1>
          <div className="league-sub">Fantasy Football · Live Draft</div>
        </div>
        <div className="header-actions">
          <div className="counter-pill">
            Unprotected: <span className="counter-big">{draft.unprotCount}</span>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>/3</span>
          </div>
          <button className="btn sm toggle-right-btn" onClick={() => setRightSidebarOpen(!rightSidebarOpen)}>
            {rightSidebarOpen ? "Research ◂" : "Research ▸"}
          </button>
          {isCommissioner && (
            <>
              {/* Undo/Reset are commissioner-only per HANDOFF.md — these mutate/destroy
                  shared state, unlike making a pick, which is open to everyone. Hidden
                  entirely (not just disabled) for non-commissioner viewers. */}
              <button className="btn sm" disabled={undoDisabled} onClick={() => void undoLastPick()}>
                ↩ Undo
              </button>
              <button className="btn sm danger" onClick={() => setResetModalOpen(true)}>
                Reset
              </button>
            </>
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
      <ResetModal />
    </div>
  );
}
