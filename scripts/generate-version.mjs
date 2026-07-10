#!/usr/bin/env node
// Generates a small version.ts file with a build version derived entirely
// from git — no manual step to remember or forget. The commit count is a
// friendly, always-increasing number (v1, v2, v3, ...); the short SHA next
// to it lets you confirm it's the *exact* commit, not just "a newer one."
// Run automatically via each package's predev/prebuild npm script — see
// client/package.json and server/package.json.
//
// Output file is generated, not committed (see .gitignore) — it would go
// stale/conflict-prone the moment it's checked in, and the whole point is
// that it's always freshly derived at build time.

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function git(cmd) {
  try {
    return execSync(cmd, { cwd: repoRoot }).toString().trim();
  } catch {
    return null;
  }
}

// Render's build step clones with only the latest commit (a "shallow"
// clone), not the repo's full history — `git rev-list --count HEAD` on a
// shallow clone only sees the commits that were actually fetched, which is
// 1, not the real count. Detected exactly this in production: it reported
// "v1" instead of the real ~35. Deepen the clone first so the count is
// accurate. Wrapped in try/catch (via git()'s own handling) since this
// needs network access to the origin remote — if that's ever unavailable
// for some reason, fall back to whatever `git rev-list` can see rather than
// fail the whole build over a version-label nicety.
if (git("git rev-parse --is-shallow-repository") === "true") {
  git("git fetch --unshallow --quiet");
}

const count = git("git rev-list --count HEAD") ?? "0";
const sha = git("git rev-parse --short HEAD") ?? "unknown";

const outPath = process.argv[2];
if (!outPath) {
  console.error("Usage: generate-version.mjs <output-file-path-relative-to-repo-root>");
  process.exit(1);
}

const content = `// Auto-generated at build time by scripts/generate-version.mjs — do not edit or commit.
export const APP_VERSION_COUNT = ${JSON.stringify(count)};
export const APP_VERSION_SHA = ${JSON.stringify(sha)};
export const APP_VERSION_LABEL = \`v${count} (${sha})\`;
`;

writeFileSync(resolve(repoRoot, outPath), content);
console.log(`[version] Generated ${outPath}: v${count} (${sha})`);
