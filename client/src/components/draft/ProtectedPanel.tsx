import { useApp } from "../../context/AppContext";
import { getCurOwner } from "../../engine/draftEngine";

// TODO (player list phase): replace hardcoded "free" label with live availability status.
// Each player in a broken-seal roster should show "drafted" if they've been picked by someone
// else since the seal broke, or "available" if still unclaimed. This requires a shared
// availability map (playerName -> {status, draftedBy}) that gets updated on every pick.
// Same map drives the free agent search pool status. Wire in during Sleeper API integration.
export default function ProtectedPanel() {
  const { draft, dispatchDraft } = useApp();
  if (!draft) return null;

  const owner = getCurOwner(draft);
  if (!owner) return null;

  if (!owner.protected.length) {
    return (
      <div>
        <div className="slabel">Previous roster</div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>None</div>
      </div>
    );
  }

  return (
    <div>
      {owner.sealBroken ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div className="slabel" style={{ marginBottom: 0 }}>
            {owner.name}'s previous roster
          </div>
          <span style={{ fontSize: 9, color: "var(--red)" }}>now available</span>
        </div>
      ) : (
        <div className="slabel">{owner.name}'s protected</div>
      )}

      {owner.protected.map((p, i) => (
        <div className={`prot-item ${p.used ? "used" : ""}`} key={i}>
          <span className="prot-item-name" style={owner.sealBroken && !p.used ? { color: "var(--text3)" } : undefined}>
            {p.name}
          </span>
          {p.used ? (
            <span style={{ fontSize: 9, color: "var(--text3)" }}>kept</span>
          ) : owner.sealBroken ? (
            <span style={{ fontSize: 9, color: "var(--red)" }}>free</span>
          ) : (
            <button className="btn xs" onClick={() => dispatchDraft({ type: "KEEP_OWN", protIdx: i })}>
              Keep
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
