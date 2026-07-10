import { APP_VERSION_LABEL } from "../../version";

// Small, unobtrusive build-version indicator — see scripts/generate-version.mjs.
// Derived entirely from git at build time (commit count + short SHA), so it
// ticks up automatically with every commit and can't be forgotten/go stale
// the way a manually-maintained version number could. The point: after any
// deploy, a glance here (or GET /api/health) confirms the live site actually
// picked up the latest commit.
export default function VersionBadge() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 6,
        right: 8,
        fontSize: 9,
        color: "var(--text3)",
        opacity: 0.6,
        letterSpacing: "0.03em",
        pointerEvents: "none",
        zIndex: 998, // just under the toast (999)
      }}
    >
      {APP_VERSION_LABEL}
    </div>
  );
}
