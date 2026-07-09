import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { NUM_OWNERS } from "../../engine/types";
import { randPlayerName } from "../../data/testNames";

export default function ProtectedPlayersTab() {
  const { ownerNames, protectedPlayers, setProtectedPlayers, setSetupTab, startDraft, showToast } = useApp();
  const [inputs, setInputs] = useState<string[]>(() => Array.from({ length: NUM_OWNERS }, () => ""));

  function addProt(i: number) {
    const name = inputs[i].trim();
    if (!name) return;
    const next = protectedPlayers.map((arr, idx) => (idx === i ? [...arr, { name, used: false }] : arr));
    setProtectedPlayers(next);
    const nextInputs = [...inputs];
    nextInputs[i] = "";
    setInputs(nextInputs);
  }

  function removeProt(i: number, j: number) {
    const next = protectedPlayers.map((arr, idx) => (idx === i ? arr.filter((_, k) => k !== j) : arr));
    setProtectedPlayers(next);
  }

  function fillTestData() {
    const used = new Set<string>();
    protectedPlayers.forEach((arr) => arr.forEach((p) => used.add(p.name)));
    const next = protectedPlayers.map((arr) => {
      const needed = Math.max(0, 17 - arr.length);
      const additions = Array.from({ length: needed }, () => ({ name: randPlayerName(used), used: false }));
      return [...arr, ...additions];
    });
    setProtectedPlayers(next);
    showToast("Test data filled — add your last player per owner");
  }

  function clearTestData() {
    setProtectedPlayers(Array.from({ length: NUM_OWNERS }, () => []));
    showToast("Protected players cleared");
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button className="btn sm" onClick={fillTestData}>
          Fill with test data (17 per owner)
        </button>
        <button className="btn sm danger" onClick={clearTestData}>
          Clear all
        </button>
        <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 4 }}>
          For testing only — replaces real rosters before draft day
        </span>
      </div>

      {ownerNames.map((name, i) => (
        <div style={{ marginBottom: 14 }} key={i}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="slabel" style={{ marginBottom: 0 }}>
              {name || `Owner ${i + 1}`}
            </div>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>
              {protectedPlayers[i].length} player{protectedPlayers[i].length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6, minHeight: 20 }}>
            {protectedPlayers[i].map((p, j) => (
              <span className="prot-tag" key={j}>
                {p.name}
                <span className="prot-tag-x" onClick={() => removeProt(i, j)}>
                  ×
                </span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              placeholder="Player name"
              style={{ flex: 1 }}
              value={inputs[i]}
              onChange={(e) => {
                const next = [...inputs];
                next[i] = e.target.value;
                setInputs(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") addProt(i);
              }}
            />
            <button className="btn sm" onClick={() => addProt(i)}>
              Add
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "1.25rem", display: "flex", gap: 8 }}>
        <button className="btn" onClick={() => setSetupTab("order")}>
          ← Back
        </button>
        <button className="btn primary" onClick={startDraft}>
          Start draft
        </button>
      </div>
    </div>
  );
}
