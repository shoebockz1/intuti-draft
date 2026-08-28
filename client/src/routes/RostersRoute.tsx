import { useApp } from "../context/AppContext";
import { useDraftPolling } from "../hooks/useDraftPolling";
import PageHeader from "../components/common/PageHeader";
import OnClockBar from "../components/common/OnClockBar";
import TeamRosterView from "../components/draft/TeamRosterView";

// "/rosters" — last year's rosters, one team at a time.
//
// The reference tab from the ClickyDraft workflow: during a draft you want to
// be able to pull up any team's previous-season roster and see who they've
// kept, who's still sealed to them, and — once their seal breaks — who of
// theirs is still on the board. Read-only; the same view is also embedded in
// the draft board's right sidebar (shared TeamRosterView, not a copy).
export default function RostersRoute() {
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
        <PageHeader subtitle="Last Year's Rosters" />
        <p style={{ color: "var(--text3)", padding: "2rem 0", textAlign: "center" }}>
          Waiting for the commissioner to start the draft…
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader subtitle="Last Year's Rosters" />
      <OnClockBar />
      <div className="panel roster-page-panel">
        <TeamRosterView />
      </div>
    </div>
  );
}
