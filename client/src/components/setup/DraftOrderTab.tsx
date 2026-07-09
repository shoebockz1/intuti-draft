import { useApp } from "../../context/AppContext";
import { NUM_OWNERS } from "../../engine/types";

export default function DraftOrderTab() {
  const { ownerNames, setOwnerNames, protectedPlayers, setProtectedPlayers, fifthPos, setFifthPos, setSetupTab } =
    useApp();

  function updateName(i: number, value: string) {
    const next = [...ownerNames];
    next[i] = value;
    setOwnerNames(next);
  }

  function moveOwner(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= NUM_OWNERS) return;
    const nextNames = [...ownerNames];
    [nextNames[i], nextNames[j]] = [nextNames[j], nextNames[i]];
    setOwnerNames(nextNames);

    const nextProt = [...protectedPlayers];
    [nextProt[i], nextProt[j]] = [nextProt[j], nextProt[i]];
    setProtectedPlayers(nextProt);
  }

  function commitNames() {
    const next = ownerNames.map((n, i) => n.trim() || `Owner ${i + 1}`);
    setOwnerNames(next);
  }

  function goToProtected() {
    commitNames();
    setSetupTab("protected");
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
        <div>
          <div className="slabel" style={{ marginBottom: 10 }}>
            Owner names in pick order — 1 picks first
          </div>
          <div id="order-list">
            {ownerNames.map((name, i) => (
              <div className="order-row" key={i}>
                <span className="order-num">{i + 1}</span>
                <input
                  className="order-input"
                  value={name}
                  placeholder={`Owner ${i + 1}`}
                  onChange={(e) => updateName(i, e.target.value)}
                  onBlur={commitNames}
                />
                <button className="btn xs" onClick={() => moveOwner(i, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button className="btn xs" onClick={() => moveOwner(i, 1)} disabled={i === NUM_OWNERS - 1}>
                  ↓
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="slabel" style={{ marginBottom: 10 }}>
            5th place winner
          </div>
          <div className="panel" style={{ padding: "12px 14px" }}>
            <div className="info" style={{ marginBottom: 8 }}>
              The 5th place winner receives a special jump pick after the 2nd unprotected selection.
            </div>
            <select style={{ width: "100%" }} value={fifthPos} onChange={(e) => setFifthPos(parseInt(e.target.value, 10))}>
              {ownerNames.map((n, i) => (
                <option value={i} key={i}>
                  {n || `Owner ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div style={{ marginTop: "1.25rem", display: "flex", gap: 8 }}>
        <button className="btn primary" onClick={goToProtected}>
          Next: protected players →
        </button>
      </div>
    </div>
  );
}
