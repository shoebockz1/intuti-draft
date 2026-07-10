import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { fetchDraftState, isDraftInProgress } from "../api/draft";

const POLL_INTERVAL_MS = 2000;

// Polls the server's authoritative DraftState into context while the calling
// component is mounted, stops on unmount. Extracted out of BoardRoute so any
// route that needs live draft status (e.g. the Free Agents research page,
// which needs to know who's already been drafted while browsing) can share
// the same polling behavior instead of the draft mirror going stale the
// moment you navigate off "/".
export function useDraftPolling() {
  const { setDraft } = useApp();
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

  return { loading, error };
}
