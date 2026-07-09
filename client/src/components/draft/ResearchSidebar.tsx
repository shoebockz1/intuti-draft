import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { searchPlayers, type RemotePlayer } from "../../api/players";
import { getPlayerStatus } from "../../engine/playerStatus";

const SEARCH_DEBOUNCE_MS = 200;
const MAX_RESULTS = 12;

export default function ResearchSidebar() {
  const { draft, myOwnerIdx, draftUnprotectedPick } = useApp();
  const [rosterOpen, setRosterOpen] = useState(true);
  const [faOpen, setFaOpen] = useState(true);
  const [selectedOwnerIdx, setSelectedOwnerIdx] = useState(myOwnerIdx);

  const [faQuery, setFaQuery] = useState("");
  const [faResults, setFaResults] = useState<RemotePlayer[]>([]);
  const [faError, setFaError] = useState<string | null>(null);
  const [faLoading, setFaLoading] = useState(false);
  const faDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedOwnerIdx(myOwnerIdx);
  }, [myOwnerIdx]);

  useEffect(() => {
    return () => {
      if (faDebounce.current) clearTimeout(faDebounce.current);
    };
  }, []);

  function handleFaQueryChange(value: string) {
    setFaQuery(value);
    if (faDebounce.current) clearTimeout(faDebounce.current);

    const query = value.trim();
    if (!query) {
      setFaResults([]);
      setFaError(null);
      return;
    }

    faDebounce.current = setTimeout(() => {
      setFaLoading(true);
      searchPlayers(query)
        .then((results) => {
          setFaResults(results.slice(0, MAX_RESULTS));
          setFaError(null);
        })
        .catch(() => {
          setFaResults([]);
          setFaError("Player search unavailable — server or Sleeper may be unreachable.");
        })
        .finally(() => setFaLoading(false));
    }, SEARCH_DEBOUNCE_MS);
  }

  if (!draft) return null;
  const owner = draft.owners[selectedOwnerIdx];

  // Whether there's an actual live pick to draft into right now (defensive —
  // ResearchSidebar only renders while a draft exists, but a completed draft
  // has no current pick left).
  const canDraft = draft.cur < draft.picks.length;

  return (
    <>
      {/* TEAM ROSTER PANEL */}
      <div className="rpanel">
        <div className="rpanel-header" onClick={() => setRosterOpen(!rosterOpen)}>
          <span className="rpanel-title">Team roster</span>
          <span className={`rpanel-toggle ${rosterOpen ? "open" : ""}`}>▾</span>
        </div>
        <div className={`rpanel-body ${rosterOpen ? "open" : ""}`}>
          <select
            style={{ width: "100%", marginBottom: 10, fontSize: 12 }}
            value={selectedOwnerIdx}
            onChange={(e) => setSelectedOwnerIdx(parseInt(e.target.value, 10))}
          >
            {draft.owners.map((o) => (
              <option value={o.idx} key={o.idx}>
                {o.name}
              </option>
            ))}
          </select>

          {owner && (
            <div>
              {!owner.protected.length ? (
                <div style={{ fontSize: 11, color: "var(--text3)" }}>No protected players entered.</div>
              ) : (
                <>
                  {owner.sealBroken ? (
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--red)",
                        marginBottom: 8,
                        paddingBottom: 6,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      Seal broken — roster now public
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--green)",
                        marginBottom: 8,
                        paddingBottom: 6,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      Seal intact
                    </div>
                  )}
                  {owner.protected.map((p, i) => {
                    // Once a seal is broken, a still-unused protected player
                    // isn't necessarily still sitting there — someone may
                    // have already drafted them via the Unprotected path.
                    // Reflect that live instead of always saying "free".
                    const stillFree = owner.sealBroken && getPlayerStatus(draft, p.name).kind !== "drafted";
                    return (
                      <div className={`roster-item ${p.used ? "used" : ""}`} key={i}>
                        <span className="roster-item-name">{p.name}</span>
                        {p.used ? (
                          <span className="roster-status rs-kept">kept</span>
                        ) : owner.sealBroken ? (
                          <span className={`roster-status ${stillFree ? "rs-free" : "rs-protected"}`}>
                            {stillFree ? "free" : "drafted"}
                          </span>
                        ) : (
                          <span className="roster-status rs-protected">protected</span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FREE AGENTS PANEL */}
      <div className="rpanel">
        <div className="rpanel-header" onClick={() => setFaOpen(!faOpen)}>
          <span className="rpanel-title">Free agents</span>
          <span className={`rpanel-toggle ${faOpen ? "open" : ""}`}>▾</span>
        </div>
        <div className={`rpanel-body ${faOpen ? "open" : ""}`}>
          <input
            type="text"
            placeholder="Search any NFL player…"
            style={{ width: "100%", marginBottom: 8, fontSize: 12 }}
            value={faQuery}
            onChange={(e) => handleFaQueryChange(e.target.value)}
          />

          {faError && <div className="warn">{faError}</div>}
          {!faError && faLoading && <div style={{ fontSize: 11, color: "var(--text3)" }}>Searching…</div>}
          {!faError && !faLoading && faQuery.trim() && faResults.length === 0 && (
            <div style={{ fontSize: 11, color: "var(--text3)" }}>No matches.</div>
          )}
          {!faQuery.trim() && !faError && (
            <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
              Search any NFL player to see if they're available, already drafted, or still someone's protected pick —
              and draft them straight from here if it's a valid pick right now.
            </div>
          )}

          {faResults.map((p) => {
            const status = getPlayerStatus(draft, p.fullName);
            return (
              <div className="roster-item" key={p.playerId}>
                <span className="roster-item-name">
                  {p.fullName}
                  {p.isRookie ? " (rookie)" : ""}
                  <span style={{ color: "var(--text3)", fontSize: 10 }}>
                    {" — "}
                    {p.position}
                    {p.nflTeam ? ` ${p.nflTeam}` : ""}
                  </span>
                </span>
                {status.kind === "available" && canDraft && (
                  <button
                    className="btn xs"
                    onClick={() => void draftUnprotectedPick(p.fullName)}
                    title="This will draft this player as the current unprotected pick — will break the on-the-clock owner's seal if not already broken."
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
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
