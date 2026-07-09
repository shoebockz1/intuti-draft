import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { commissionerLogin, commissionerStatus } from "../api/commissioner";
import { fetchDraftState, isDraftInProgress } from "../api/draft";
import { useRouter } from "../router/Router";
import SetupScreen from "../components/setup/SetupScreen";

// "/admin" — commissioner-only setup flow (Draft Order / Protected Players /
// Order Randomizer tabs, Start Draft). Anyone can load this URL, but nothing
// beyond the passcode form renders until GET /api/commissioner/status
// confirms a valid commissioner session (set by a successful
// POST /api/commissioner/login).
export default function AdminRoute() {
  const { isCommissioner, setIsCommissioner, setDraft, setOwnerNames, setProtectedPlayers, setFifthPos } = useApp();
  const { navigate } = useRouter();
  const [checking, setChecking] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    commissionerStatus()
      .then((ok) => {
        if (!cancelled) setIsCommissioner(ok);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setIsCommissioner]);

  // Keep the local draft mirror fresh while sitting on /admin (e.g. so the
  // "draft in progress" resume banner in SetupScreen reflects reality, and
  // so navigating to "/" right after Start Draft shows current data
  // immediately instead of waiting for the board's first poll tick).
  //
  // If a draft is already in progress, also pre-fill the setup form fields
  // (owner names, protected players, 5th place) from that live state. Before
  // this, revisiting /admin after starting a draft showed blank defaults —
  // the setup form never had any memory of what was actually submitted,
  // only the server's DraftState did. This runs once per /admin visit, not
  // on a poll loop, so it won't clobber in-progress edits.
  useEffect(() => {
    fetchDraftState()
      .then((data) => {
        if (isDraftInProgress(data)) {
          setDraft(data);
          setOwnerNames(data.owners.map((o) => o.name));
          setProtectedPlayers(data.owners.map((o) => o.protected));
          setFifthPos(data.fifthPos);
        } else {
          setDraft(null);
        }
      })
      .catch(() => {
        // Best-effort only — BoardRoute's own polling is the source of truth once there.
      });
  }, [setDraft, setOwnerNames, setProtectedPlayers, setFifthPos]);

  async function submitLogin() {
    setLoginError(null);
    setLoggingIn(true);
    try {
      const ok = await commissionerLogin(passcode);
      if (ok) {
        setIsCommissioner(true);
      } else {
        setLoginError("Incorrect passcode.");
      }
    } finally {
      setLoggingIn(false);
    }
  }

  if (checking) {
    return <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text3)" }}>Loading…</div>;
  }

  if (!isCommissioner) {
    return (
      <div className="wai-overlay" style={{ position: "static", minHeight: "100vh" }}>
        <div className="wai-box">
          <h2>Commissioner login</h2>
          <p>Enter the shared passcode to access draft setup.</p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitLogin();
            }}
            placeholder="Passcode"
            style={{ width: "100%", marginBottom: 8 }}
          />
          {loginError && <div className="warn">{loginError}</div>}
          <button className="btn primary" style={{ width: "100%" }} onClick={submitLogin} disabled={loggingIn}>
            Enter
          </button>
          <button className="btn sm" style={{ width: "100%", marginTop: 8 }} onClick={() => navigate("/")}>
            View draft board instead
          </button>
        </div>
      </div>
    );
  }

  return <SetupScreen />;
}
