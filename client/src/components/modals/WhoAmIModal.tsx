import { useApp } from "../../context/AppContext";

// Honest, low-tech stand-in for identity — there's no login system. Shown
// automatically whenever the draft screen is entered/resumed. The selected
// identity defaults the Team Roster research panel to that owner's own team.
export default function WhoAmIModal() {
  const { draft, whoAmIOpen, setWhoAmIOpen, myOwnerIdx, setMyOwnerIdx } = useApp();

  if (!whoAmIOpen || !draft) return null;

  return (
    <div className="wai-overlay">
      <div className="wai-box">
        <h2>Who are you?</h2>
        <p>Select your name so your team roster defaults in the research panel.</p>
        <select value={myOwnerIdx} onChange={(e) => setMyOwnerIdx(parseInt(e.target.value, 10))}>
          {draft.owners.map((o) => (
            <option value={o.idx} key={o.idx}>
              {o.name}
            </option>
          ))}
        </select>
        <button className="btn primary" style={{ width: "100%" }} onClick={() => setWhoAmIOpen(false)}>
          Confirm
        </button>
      </div>
    </div>
  );
}
