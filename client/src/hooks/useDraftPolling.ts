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
//
// Polling is gated on tab visibility. Owners keep several tabs open at once
// (board / players / rosters, mirroring the ClickyDraft workflow), and each
// tick costs two requests — state plus log. Ungated, ten owners with three
// tabs each would hold a free-tier Render instance at ~30 req/s for a
// three-hour draft, to render pages nobody is looking at. A hidden tab
// skips the network entirely and re-syncs the moment it's brought forward,
// so the whole multi-tab workspace costs the server no more than one tab.
//
// This also covers phones, where the problem is the opposite one: iOS
// suspends background timers outright, so a backgrounded tab wakes up
// showing a stale board. The visibilitychange poll makes coming back to the
// tab an immediate refresh rather than a wait of up to POLL_INTERVAL_MS.
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

    function tick() {
      if (document.hidden) return;
      void poll();
    }

    function onVisibilityChange() {
      if (!document.hidden) void poll();
    }

    // Always run once on mount, even if the tab starts hidden — otherwise a
    // background tab would sit on the "Loading…" state indefinitely and show
    // it when brought forward.
    void poll();

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [setDraft, setTransactionLog]);

  return { loading, error };
}
