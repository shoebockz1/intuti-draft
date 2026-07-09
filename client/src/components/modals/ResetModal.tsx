import { useApp } from "../../context/AppContext";

// Two-tier reset, explicitly requested to protect against accidental data loss
// mid-draft. Soft reset (primary action) preserves in-memory state and shows
// a resume banner on the setup screen. Hard reset (secondary, de-emphasized
// danger action) requires an additional native confirm() before wiping
// everything — see softReset/hardReset in AppContext.
export default function ResetModal() {
  const { resetModalOpen, setResetModalOpen, softReset, hardReset } = useApp();

  if (!resetModalOpen) return null;

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <h2>Reset draft?</h2>
        <p>
          This will return to the setup screen. Your draft history will be preserved — you can resume from where you left
          off. To permanently wipe the draft, confirm below.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="modal-btns">
            <button className="btn" onClick={() => setResetModalOpen(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={softReset}>
              Return to setup
            </button>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 2 }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>Permanent wipe — cannot be undone</div>
            <div className="modal-btns">
              <button className="btn danger" onClick={hardReset}>
                Wipe everything &amp; start over
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
