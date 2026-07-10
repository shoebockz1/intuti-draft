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

// Verbose on purpose — this whole script exists to make deploys verifiable,
// so its own diagnostics need to show up in Render's build log rather than
// silently swallowing errors the way the first version of this script did
// (which is exactly what hid the shallow-clone bug below from showing its
// real cause). Every git() call logs the command and either its result or
// the actual stderr, not just null.
function git(cmd) {
  try {
    const out = execSync(cmd, { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
    console.log(`[version] $ ${cmd} -> ${JSON.stringify(out)}`);
    return out;
  } catch (err) {
    const stderr = err?.stderr?.toString().trim() || err?.message || String(err);
    console.log(`[version] $ ${cmd} -> FAILED: ${stderr}`);
    return null;
  }
}

// Render's build step clones with only the latest commit (a "shallow"
// clone), not the repo's full history — `git rev-list --count HEAD` on a
// shallow clone only sees the commits that were actually fetched, which is
// 1, not the real count. Confirmed exactly this in production once already;
// the first fix attempt (git fetch --unshallow) didn't actually resolve it
// there even though it worked against a locally-reproduced shallow clone —
// hence the verbose logging above, to see what Render's environment
// actually does differently before guessing at a second fix blind.
const isShallow = git("git rev-parse --is-shallow-repository");
if (isShallow === "true") {
  git("git remote -v");
  git("git fetch --unshallow --quiet");
  git("git rev-parse --is-shallow-repository"); // confirm whether it actually became non-shallow
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
