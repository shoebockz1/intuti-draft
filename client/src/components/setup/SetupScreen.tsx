import { useApp } from "../../context/AppContext";
import { useRouter } from "../../router/Router";
import DraftOrderTab from "./DraftOrderTab";
import ProtectedPlayersTab from "./ProtectedPlayersTab";
import OrderRandomizerTab from "./OrderRandomizerTab";

export default function SetupScreen() {
  const { setupTab, setSetupTab, draft, hardReset } = useApp();
  const { navigate } = useRouter();

  return (
    <div>
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1>Intuti</h1>
          <div className="league-sub">Fantasy Football · Draft Setup</div>
        </div>
      </div>

      {draft && (
        <div className="resume-banner">
          <span>
            Draft in progress —{" "}
            <button className="btn sm primary" onClick={() => navigate("/")}>
              View draft board
            </button>
          </span>
          {/* Reset lives here, admin-only, rather than on the shared board
              — see DraftScreen.tsx for why. No separate "soft reset" tier
              anymore: navigating away without wiping is just... navigating
              away, since this screen already only exists behind the
              commissioner passcode. hardReset still has its own native
              confirm() as the one safety check before it wipes anything. */}
          <button className="btn sm danger" onClick={() => void hardReset()}>
            Wipe draft &amp; start over
          </button>
        </div>
      )}

      <div className="top-tabs">
        <button className={`top-tab ${setupTab === "order" ? "active" : ""}`} onClick={() => setSetupTab("order")}>
          Draft order
        </button>
        <button className={`top-tab ${setupTab === "protected" ? "active" : ""}`} onClick={() => setSetupTab("protected")}>
          Protected players
        </button>
        <button className={`top-tab ${setupTab === "randomizer" ? "active" : ""}`} onClick={() => setSetupTab("randomizer")}>
          Order randomizer
        </button>
      </div>

      {setupTab === "order" && <DraftOrderTab />}
      {setupTab === "protected" && <ProtectedPlayersTab />}
      {setupTab === "randomizer" && <OrderRandomizerTab />}
    </div>
  );
}
