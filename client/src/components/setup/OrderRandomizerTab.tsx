import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { NUM_OWNERS } from "../../engine/types";

// Standalone shuffle utility, intentionally separate from the live draft's
// fixed order (see HANDOFF.md Section 2 — order is randomized ahead of time,
// days before the draft, not at draft-start).
export default function OrderRandomizerTab() {
  const { ownerNames, protectedPlayers, setOwnerNames, setProtectedPlayers, randOrder, setRandOrder, setSetupTab, showToast } =
    useApp();

  const [inputs, setInputs] = useState<string[]>(() => Array.from({ length: NUM_OWNERS }, (_, i) => ownerNames[i] || ""));
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());

  function runRandomizer() {
    const names = inputs.map((v, i) => v.trim() || `Owner ${i + 1}`);
    const shuffled = [...names];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setRandOrder(shuffled);
    setHighlighted(new Set());
    shuffled.forEach((_, i) => {
      setTimeout(() => setHighlighted((prev) => new Set(prev).add(i)), i * 70 + 150);
    });
    setTimeout(() => setHighlighted(new Set()), shuffled.length * 70 + 700);
  }

  function copyRandOrder() {
    if (!randOrder) {
      showToast("Randomize first");
      return;
    }
    navigator.clipboard.writeText(randOrder.map((n, i) => `${i + 1}. ${n}`).join("\n")).then(() => showToast("Copied to clipboard"));
  }

  function useRandOrder() {
    if (!randOrder) return;
    const names = inputs.map((v, i) => v.trim() || `Owner ${i + 1}`);
    const origProts = protectedPlayers.map((p) => [...p]);
    const nextNames = [...ownerNames];
    const nextProts = [...protectedPlayers];
    randOrder.forEach((rname, newPos) => {
      const origIdx = names.indexOf(rname);
      nextNames[newPos] = rname;
      nextProts[newPos] = origIdx >= 0 ? origProts[origIdx].map((p) => ({ ...p })) : [];
    });
    setOwnerNames(nextNames);
    setProtectedPlayers(nextProts);
    setSetupTab("order");
    showToast("Order applied!");
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {inputs.map((v, i) => (
          <input
            key={i}
            type="text"
            value={v}
            placeholder={`Owner ${i + 1}`}
            onChange={(e) => {
              const next = [...inputs];
              next[i] = e.target.value;
              setInputs(next);
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <button className="btn primary" onClick={runRandomizer}>
          Randomize
        </button>
        <button className="btn" onClick={copyRandOrder}>
          Copy order
        </button>
      </div>
      {randOrder && (
        <div>
          {randOrder.map((n, i) => (
            <div className={`rand-row ${highlighted.has(i) ? "rand-hi" : ""}`} key={i}>
              <span className="rand-pos">{i + 1}</span>
              <span className="rand-name">{n}</span>
            </div>
          ))}
        </div>
      )}
      {randOrder && (
        <button className="btn sm" style={{ marginTop: 8 }} onClick={useRandOrder}>
          Use this order in setup →
        </button>
      )}
    </div>
  );
}
