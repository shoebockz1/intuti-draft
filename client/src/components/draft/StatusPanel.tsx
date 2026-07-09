import { useApp } from "../../context/AppContext";

export default function StatusPanel() {
  const { draft } = useApp();
  if (!draft) return null;

  return (
    <div>
      <div className="slabel">Seals</div>
      {draft.owners.map((o) => (
        <div className="status-row" key={o.idx}>
          <span className="status-name">{o.name}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className={`dot ${o.sealBroken ? "d-broken" : "d-intact"}`} />
            <span style={{ fontSize: 10, color: "var(--text3)" }}>{o.sealBroken ? "broken" : "intact"}</span>
            {o.isFifth && !draft.fifthJumpUsed && <span style={{ fontSize: 10, color: "var(--amber)" }}>★</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
