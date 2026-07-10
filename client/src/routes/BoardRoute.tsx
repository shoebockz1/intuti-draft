import { useApp } from "../context/AppContext";
import { useDraftPolling } from "../hooks/useDraftPolling";
import DraftScreen from "../components/draft/DraftScreen";

// "/" — the shared, live-updating draft board. This is the default view
// everyone gets (per HANDOFF.md: trusted friend group, no per-owner
// accounts/turn-locking). Polls the server's authoritative DraftState while
// mounted; stops polling on unmount. Shows a holding view until a draft
// exists.
export default function BoardRoute() {
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
      <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <h1>Intuti</h1>
        <div className="league-sub" style={{ marginBottom: 12 }}>
          Fantasy Football · Live Draft
        </div>
        <p style={{ color: "var(--text3)" }}>Waiting for the commissioner to start the draft…</p>
      </div>
    );
  }

  return <DraftScreen />;
}
