import { useApp } from "../../context/AppContext";
import DraftOrderTab from "./DraftOrderTab";
import ProtectedPlayersTab from "./ProtectedPlayersTab";
import OrderRandomizerTab from "./OrderRandomizerTab";

export default function SetupScreen() {
  const { setupTab, setSetupTab, resumeBannerVisible, resumeDraft } = useApp();

  return (
    <div>
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1>Intuti</h1>
          <div className="league-sub">Fantasy Football · Draft Setup</div>
        </div>
      </div>

      {resumeBannerVisible && (
        <div className="resume-banner">
          Draft in progress —{" "}
          <button className="btn sm primary" onClick={resumeDraft}>
            Resume draft
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
