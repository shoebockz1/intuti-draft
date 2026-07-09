import { useApp } from "../../context/AppContext";
import { getCurOwner, getCurPick, isCurrentPickFifthJump } from "../../engine/draftEngine";

export default function OnClockPanel() {
  const { draft } = useApp();
  if (!draft) return null;

  const owner = getCurOwner(draft);
  const pick = getCurPick(draft);

  if (!owner || !pick) {
    return <div style={{ fontSize: 13, color: "var(--text3)" }}>Draft complete!</div>;
  }

  const isFifthJump = isCurrentPickFifthJump(draft);

  return (
    <div>
      <div className="slabel">On the clock</div>
      <div className="clock-name">{owner.name}</div>
      <div className="clock-meta">
        Pick {draft.cur + 1} &nbsp;·&nbsp; Round {pick.round}
      </div>
      <div style={{ marginTop: 5 }}>
        {owner.sealBroken ? (
          <span className="badge b-broken">Seal broken</span>
        ) : (
          <span className="badge b-intact">Seal intact</span>
        )}
        {owner.isFifth && !draft.fifthJumpUsed && <span className="badge b-fifth">★ 5th place</span>}
        {isFifthJump && <span className="badge b-jump">Jump pick</span>}
      </div>
    </div>
  );
}
