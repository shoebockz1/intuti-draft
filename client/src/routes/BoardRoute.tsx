import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { fetchDraftState, isDraftInProgress } from "../api/draft";
import DraftScreen from "../components/draft/DraftScreen";

const POLL_INTERVAL_MS = 2000;

// "/" — the shared, live-updating draft board. This is the default view
// everyone gets (per HANDOFF.md: trusted friend group, no per-owner
// accounts/turn-locking). Polls the server's authoritative DraftState while
// mounted; stops polling on unmount. Shows a holding view until a draft
// exists.
export default function BoardRoute() {
  const { draft, setDraft } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchDraftState();
        if (cancelled) return;
        setDraft(isDraftInProgress(data) ? data : null);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to reach server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [setDraft]);

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
