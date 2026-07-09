import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getCurOwner, getCurPick, isCurrentPickFifthJump, ownerHasKeepableProtected } from "../../engine/draftEngine";

type PTab = "unprot" | "own";

// The prototype had a documented bug where the pick-panel tab got stuck on
// the first pick because the active tab wasn't re-derived from state. Fixed
// by re-deriving the default tab every time the current pick changes (not
// on every re-render, and not left as stale UI state).
export default function PickPanel() {
  const { draft, dispatchDraft, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<PTab>("unprot");
  const [playerName, setPlayerName] = useState("");

  const owner = draft ? getCurOwner(draft) : null;
  const pick = draft ? getCurPick(draft) : null;
  const hasOwn = ownerHasKeepableProtected(owner);

  useEffect(() => {
    setActiveTab(hasOwn ? "own" : "unprot");
    setPlayerName("");
    // Re-derive whenever the pick being made changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.cur]);

  if (!draft || !owner || !pick) return null;

  const isFifthJump = isCurrentPickFifthJump(draft);

  let warning: React.ReactNode = null;
  if (!owner.sealBroken && !isFifthJump) {
    warning = <div className="warn">This will break {owner.name}'s seal — their remaining protected players become available to everyone.</div>;
  }
  if (isFifthJump && !owner.sealBroken) {
    warning = <div className="info">5th place jump — seal stays intact after this pick.</div>;
  }
  if (isFifthJump && owner.sealBroken) {
    warning = <div className="info">5th place jump pick.</div>;
  }

  function submitDraftUnprotected() {
    if (!playerName.trim()) {
      showToast("Enter a player name");
      return;
    }
    dispatchDraft({ type: "DRAFT_UNPROTECTED", playerName });
    setPlayerName("");
  }

  return (
    <div>
      <div className="slabel">Make pick</div>
      <div className="pick-tabs">
        <button className={`ptab ${activeTab === "unprot" ? "active" : ""}`} onClick={() => setActiveTab("unprot")}>
          Unprotected
        </button>
        <button
          className={`ptab ${activeTab === "own" ? "active" : ""}`}
          onClick={() => setActiveTab("own")}
          disabled={!hasOwn}
        >
          Own player
        </button>
      </div>

      {activeTab === "unprot" && (
        <div>
          <input
            type="text"
            className="pick-input"
            placeholder="Player name"
            style={{ marginBottom: 6 }}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitDraftUnprotected();
            }}
          />
          {warning}
          <button className="btn primary" style={{ width: "100%", marginTop: 8 }} onClick={submitDraftUnprotected}>
            Draft player
          </button>
        </div>
      )}

      {activeTab === "own" && (
        <div>
          <div className="info">Use Keep buttons below, or switch to Unprotected to break seal.</div>
        </div>
      )}
    </div>
  );
}
