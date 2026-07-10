import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { fetchDraftState, fetchTransactionLog, isDraftInProgress } from "../api/draft";

const POLL_INTERVAL_MS = 2000;

// Polls the server's authoritative DraftState (and transaction log) into
// context while the calling component is mounted, stops on unmount.
// Extracted out of BoardRoute so any route that needs live draft status
// (e.g. the Free Agents research page, which needs to know who's already
// been drafted while browsing) can share the same polling behavior instead
// of the draft mirror going stale the moment you navigate off "/".
export function useDraftPolling() {
  const { setDraft, setTransactionLog } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchDraftState();
        if (cancelled) return;
        const inProgress = isDraftInProgress(data);
        setDraft(inProgress ? data : null);
        setError(null);
        // Only worth fetching the log while a draft actually exists — avoids
        // a pointless request on every poll tick of the "waiting" screen.
        if (inProgress) {
          fetchTransactionLog()
            .then((log) => {
              if (!cancelled) setTransactionLog(log);
            })
            .catch(() => {
              // Best-effort — the log backs a nice-to-have panel, not core
              // draft functionality, so a hiccup here shouldn't surface an error.
            });
        }
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
  }, [setDraft, setTransactionLog]);

  return { loading, error };
}
