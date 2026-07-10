import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useRouter } from "../router/Router";
import { useDraftPolling } from "../hooks/useDraftPolling";
import { queryPlayers, type RemotePlayer } from "../api/players";
import { getPlayerStatus } from "../engine/playerStatus";
import { POSITION_STAT_COLUMNS } from "../data/freeAgentColumns";
import { defaultDirectionFor, sortPlayers, type SortState } from "../data/freeAgentSort";

// "/players" — dedicated Free Agent research page. Separate from the compact
// sidebar widget on the draft board: this is for actually browsing/filtering
// by position and sorting by prominence/rank, not just searching for one
// name you already have in mind. Requires a draft to be in progress (same as
// the board) since "available / drafted / protected" status only means
// anything in the context of a live draft.
//
// Polls the live DraftState itself (useDraftPolling) rather than relying on
// whatever the board last had, since this page is meant to be open on its
// own — including, plausibly, in a second tab/device someone keeps open
// purely for research while the board runs elsewhere.

const POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"] as const;
const SEARCH_DEBOUNCE_MS = 250;

type StatusFilter = "available" | "drafted" | "all";

export default function FreeAgentsRoute() {
  const { draft, draftUnprotectedPick } = useApp();
  const { navigate } = useRouter();
  const { loading, error } = useDraftPolling();

  const [position, setPosition] = useState<(typeof POSITIONS)[number]>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("available");
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const run = () => {
      setFetching(true);
      queryPlayers({ position: position === "ALL" ? undefined : position, search })
        .then((results) => {
          setPlayers(results);
          setFetchError(null);
        })
        .catch(() => {
          setPlayers([]);
          setFetchError("Couldn't load players — the server or Sleeper may be unreachable.");
        })
        .finally(() => setFetching(false));
    };

    // Position-tab clicks feel better instant; only the free-text search box needs debouncing.
    if (search) {
      debounceRef.current = setTimeout(run, SEARCH_DEBOUNCE_MS);
    } else {
      run();
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [position, search]);

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
        <p style={{ color: "var(--text3)", margin: "12px 0" }}>No draft in progress yet.</p>
        <button className="btn" onClick={() => navigate("/")}>
          ← Back to board
        </button>
      </div>
    );
  }

  const canDraft = draft.cur < draft.picks.length;
  const statColumns = position === "ALL" ? [] : (POSITION_STAT_COLUMNS[position] ?? []);
  const baseColumnCount = 6; // Player, Pos, Team, Injury, Rank, Status
  const validSortColumnIds = ["name", "pos", "team", "injury", "rank", ...statColumns.map((c) => c.key)];

  // Most owners are here to see who's left, not to re-confirm who's already
  // gone — so "available" is the default view. Drafted+protected are
  // grouped into one toggle state (not split into two tabs), and "All" is
  // there for the rarer case of wanting to see everyone regardless of status.
  const filteredPlayers = players.filter((p) => {
    if (statusFilter === "all") return true;
    const status = getPlayerStatus(draft, p.fullName);
    return statusFilter === "available" ? status.kind === "available" : status.kind !== "available";
  });

  // A stat column's sort only applies while that column is actually shown —
  // e.g. switching from QB to K makes "passYd" meaningless. Rather than
  // clearing the sort state outright, just ignore it until it's valid again
  // (switching back to QB re-applies it automatically).
  const activeSort = sort && validSortColumnIds.includes(sort.columnId) ? sort : null;
  const visiblePlayers = sortPlayers(filteredPlayers, activeSort);

  function toggleSort(columnId: string) {
    setSort((prev) => {
      if (prev?.columnId === columnId) {
        return { columnId, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { columnId, direction: defaultDirectionFor(columnId) };
    });
  }

  function sortIndicator(columnId: string): string {
    if (activeSort?.columnId !== columnId) return "";
    return activeSort.direction === "asc" ? " ▲" : " ▼";
  }

  return (
    <div>
      <div className="draft-header">
        <div>
          <h1>Intuti</h1>
          <div className="league-sub">Free Agent Research</div>
        </div>
        <button className="btn sm" onClick={() => navigate("/")}>
          ← Back to board
        </button>
      </div>

      <div className="fa-toolbar">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            className={`fa-tab ${position === pos ? "active" : ""}`}
            onClick={() => setPosition(pos)}
          >
            {pos}
          </button>
        ))}
        <div className="fa-status-toggle">
          <button
            className={`fa-tab ${statusFilter === "available" ? "active" : ""}`}
            onClick={() => setStatusFilter("available")}
          >
            Available
          </button>
          <button
            className={`fa-tab ${statusFilter === "drafted" ? "active" : ""}`}
            onClick={() => setStatusFilter("drafted")}
          >
            Drafted/Protected
          </button>
          <button
            className={`fa-tab ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Players
          </button>
        </div>
        <input
          type="text"
          className="fa-search-input"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {fetchError && <div className="warn" style={{ marginBottom: 10 }}>{fetchError}</div>}

      <div className="fa-table-wrap">
        <table className="fa-table">
          <thead>
            <tr>
              <th className="fa-sortable" onClick={() => toggleSort("name")}>
                Player{sortIndicator("name")}
              </th>
              <th className="fa-sortable" onClick={() => toggleSort("pos")}>
                Pos{sortIndicator("pos")}
              </th>
              <th className="fa-sortable" onClick={() => toggleSort("team")}>
                Team{sortIndicator("team")}
              </th>
              <th className="fa-sortable" onClick={() => toggleSort("injury")}>
                Injury{sortIndicator("injury")}
              </th>
              <th className="fa-sortable" onClick={() => toggleSort("rank")}>
                Rank{sortIndicator("rank")}
              </th>
              {statColumns.map((col) => (
                <th key={col.key} className="fa-sortable" onClick={() => toggleSort(col.key)}>
                  {col.label}
                  {sortIndicator(col.key)}
                </th>
              ))}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fetching && (
              <tr className="fa-empty-row">
                <td colSpan={baseColumnCount + statColumns.length}>Loading players…</td>
              </tr>
            )}
            {!fetching && visiblePlayers.length === 0 && (
              <tr className="fa-empty-row">
                <td colSpan={baseColumnCount + statColumns.length}>No matches.</td>
              </tr>
            )}
            {!fetching &&
              visiblePlayers.map((p) => {
                const status = getPlayerStatus(draft, p.fullName);
                return (
                  <tr key={p.playerId}>
                    <td className="fa-player-name">
                      {p.fullName}
                      {p.isRookie && <span className="fa-rookie-tag">ROOKIE</span>}
                    </td>
                    <td>{p.position}</td>
                    <td>{p.nflTeam ?? "—"}</td>
                    <td className={p.injuryStatus ? "fa-injury" : ""}>{p.injuryStatus ?? "—"}</td>
                    <td>{p.posRank ?? "—"}</td>
                    {statColumns.map((col) => (
                      <td key={col.key}>{p.stats?.[col.key] ?? "—"}</td>
                    ))}
                    <td>
                      {status.kind === "available" && canDraft && (
                        <button
                          className="btn xs"
                          onClick={() => void draftUnprotectedPick(p.fullName)}
                          title="Drafts this player as the current unprotected pick — will break the on-the-clock owner's seal if not already broken."
                        >
                          Draft
                        </button>
                      )}
                      {status.kind === "available" && !canDraft && (
                        <span className="roster-status rs-free">available</span>
                      )}
                      {status.kind === "drafted" && <span className="roster-status rs-protected">drafted</span>}
                      {status.kind === "protected" && (
                        <span className="roster-status rs-protected">protected — {status.ownerName}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
