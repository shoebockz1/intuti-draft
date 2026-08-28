import { useState } from "react";
import { useApp } from "../../context/AppContext";
import TeamRosterView from "./TeamRosterView";
import { AppLink } from "../../router/Router";

export default function ResearchSidebar() {
  const { draft } = useApp();
  const [rosterOpen, setRosterOpen] = useState(true);
  const [faOpen, setFaOpen] = useState(true);

  if (!draft) return null;

  return (
    <>
      {/* TEAM ROSTER PANEL */}
      <div className="rpanel">
        <div className="rpanel-header" onClick={() => setRosterOpen(!rosterOpen)}>
          <span className="rpanel-title">Team roster</span>
          <span className={`rpanel-toggle ${rosterOpen ? "open" : ""}`}>▾</span>
        </div>
        <div className={`rpanel-body ${rosterOpen ? "open" : ""}`}>
          <TeamRosterView />
        </div>
      </div>

      {/* FREE AGENTS PANEL — points at the dedicated /players research page
          (position tabs, browse-all sorted by prominence, injury status)
          rather than duplicating a second search UI in this narrow sidebar. */}
      <div className="rpanel">
        <div className="rpanel-header" onClick={() => setFaOpen(!faOpen)}>
          <span className="rpanel-title">Free agents</span>
          <span className={`rpanel-toggle ${faOpen ? "open" : ""}`}>▾</span>
        </div>
        <div className={`rpanel-body ${faOpen ? "open" : ""}`}>
          <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5, marginBottom: 10 }}>
            Browse by position, sorted by ranking, with injury status and one-click drafting.
          </div>
          <AppLink className="btn sm primary" style={{ width: "100%" }} to="/players">
            Open free agent research →
          </AppLink>
        </div>
      </div>
    </>
  );
}
