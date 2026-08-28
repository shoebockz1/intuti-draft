import { useApp } from "../../context/AppContext";
import { getCurOwner, getCurPick } from "../../engine/draftEngine";
import { AppLink } from "../../router/Router";

// Compact "whose turn is it" strip for the standalone pages.
//
// This is the cost of splitting the workspace across tabs: on "/" the clock
// sits right next to the pick controls, but someone parked on the players or
// rosters page has no idea their turn came up. Every secondary page carries
// this, and since none of them can take a pick, it links back to "/" where
// picks are actually made.
export default function OnClockBar() {
  const { draft } = useApp();
  if (!draft) return null;

  const owner = getCurOwner(draft);
  const pick = getCurPick(draft);

  return (
    <div className="onclock-bar">
      {owner && pick ? (
        <div>
          <span className="onclock-bar-label">On the clock</span>
          <span className="onclock-bar-name">{owner.name}</span>
          <span className="onclock-bar-meta">
            Pick {draft.cur + 1} · Round {pick.round}
          </span>
          {owner.sealBroken ? (
            <span className="badge b-broken">Seal broken</span>
          ) : (
            <span className="badge b-intact">Seal intact</span>
          )}
        </div>
      ) : (
        <div className="onclock-bar-name">Draft complete</div>
      )}

      <div className="onclock-bar-actions">
        <span className="counter-pill">
          Unprotected: <span className="counter-big">{draft.unprotCount}</span>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>/3</span>
        </span>
        {owner && pick && (
          <AppLink to="/" className="btn sm primary">
            Make a pick →
          </AppLink>
        )}
      </div>
    </div>
  );
}
