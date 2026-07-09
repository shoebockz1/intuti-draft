import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";

export default function ResearchSidebar() {
  const { draft, myOwnerIdx } = useApp();
  const [rosterOpen, setRosterOpen] = useState(true);
  const [faOpen, setFaOpen] = useState(true);
  const [selectedOwnerIdx, setSelectedOwnerIdx] = useState(myOwnerIdx);

  useEffect(() => {
    setSelectedOwnerIdx(myOwnerIdx);
  }, [myOwnerIdx]);

  if (!draft) return null;
  const owner = draft.owners[selectedOwnerIdx];

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
                  {owner.protected.map((p, i) => (
                    <div className={`roster-item ${p.used ? "used" : ""}`} key={i}>
                      <span className="roster-item-name">{p.name}</span>
                      {p.used ? (
                        <span className="roster-status rs-kept">kept</span>
                      ) : owner.sealBroken ? (
                        // TODO (player list phase): replace 'free' with live 'available'/'drafted' status
                        <span className="roster-status rs-free">free</span>
                      ) : (
                        <span className="roster-status rs-protected">protected</span>
                      )}
                    </div>
                  ))}
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
          <div style={{ textAlign: "center", padding: "20px 8px" }}>
            <div style={{ fontSize: 20, marginBottom: 8, color: "var(--text3)" }}>⚡</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Player list not connected</div>
            <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
              Free agent search will be available once a live player API is connected. Players will show available / drafted
              status in real time.
            </div>
            {/* TODO: wire Sleeper API here. Add search input + scrollable player list.
                Each row: player name, position, team, status badge (available/drafted).
                Drafting from here should call the same pick-making logic as the
                Unprotected tab (dispatchDraft({ type: "DRAFT_UNPROTECTED", playerName }))
                with the player prefilled, not a separate code path. */}
          </div>
        </div>
      </div>
    </>
  );
}
