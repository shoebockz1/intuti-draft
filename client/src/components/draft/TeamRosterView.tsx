import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getPlayerStatus } from "../../engine/playerStatus";

// One team's previous-season roster and what has become of each player.
//
// Shared deliberately between the draft board's right sidebar and the
// standalone /rosters page rather than copied. The status rules are subtle —
// a broken seal does NOT mean a player is still available, since someone may
// already have drafted them — and they have been wrong before: the name
// suffix mismatch bug in DONE.md ("James Cook III" vs Sleeper's "James Cook")
// was exactly a status-correctness bug in this logic. Two copies would mean
// only one of them gets the next fix.
//
// Four states, all meaningful during a live draft:
//   kept      — the owner spent a pick keeping them
//   protected — seal intact, still sealed to this owner
//   free      — seal broken and nobody has taken them yet
//   drafted   — seal broken and someone else already has
export default function TeamRosterView() {
  const { draft, myOwnerIdx } = useApp();
  const [selectedOwnerIdx, setSelectedOwnerIdx] = useState(myOwnerIdx);

  // Follow the viewer's identity when it's set/changed, but leave their
  // manual selection alone otherwise — this panel is for looking at anyone.
  useEffect(() => {
    setSelectedOwnerIdx(myOwnerIdx);
  }, [myOwnerIdx]);

  if (!draft) return null;

  const owner = draft.owners[selectedOwnerIdx];

  return (
    <div>
      <select
        className="roster-select"
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
            <div className="roster-empty">No protected players entered.</div>
          ) : (
            <>
              {owner.sealBroken ? (
                <div className="roster-seal broken">Seal broken — roster now public</div>
              ) : (
                <div className="roster-seal intact">Seal intact</div>
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
  );
}
