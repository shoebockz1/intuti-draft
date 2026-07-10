import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { useRouter } from "../../router/Router";
import { getPlayerStatus } from "../../engine/playerStatus";

export default function ResearchSidebar() {
  const { draft, myOwnerIdx } = useApp();
  const { navigate } = useRouter();
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
          <button className="btn sm primary" style={{ width: "100%" }} onClick={() => navigate("/players")}>
            Open free agent research →
          </button>
        </div>
      </div>
    </>
  );
}
