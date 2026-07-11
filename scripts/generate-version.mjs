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

// Public repo — see below for why this needs to be hardcoded rather than
// read from `git remote -v`.
const GITHUB_REPO = "shoebockz1/intuti-draft";

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

// Render's build step doesn't do a normal `git clone` — it's a shallow
// checkout with NO remote configured at all (`git remote -v` there prints
// nothing), confirmed by reading Render's actual build log. That means
// `git fetch --unshallow` (the first fix attempt) has nothing to fetch
// from — it silently no-ops instead of erroring, which is exactly why it
// looked fixed in a local shallow-clone simulation (which still has its
// origin remote) but did nothing on Render. Deepening the clone is a dead
// end in this environment.
//
// Instead, when the local checkout is shallow, ask GitHub's REST API for
// the count directly: its commits endpoint paginates, and with
// per_page=1 the `page=` number on the "last" rel link equals the exact
// commit count reachable from the given SHA — no repo history needed
// locally at all. Verified against this repo: both agreed exactly (39).
// Requires outbound internet access at build time (Render's build step
// already needs this for `npm install`) and only works because this repo
// is public; a private repo would need an auth token.
async function getCommitCountFromGitHub(sha) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/commits?sha=${sha}&per_page=1`;
  const res = await fetch(url, { headers: { "User-Agent": "intuti-draft-version-script" } });
  console.log(`[version] GET ${url} -> ${res.status}`);
  if (!res.ok) {
    throw new Error(`GitHub API responded ${res.status} ${res.statusText}`);
  }
  const link = res.headers.get("link");
  if (!link) {
    // No Link header at all means there's only one page — i.e. one commit total.
    return 1;
  }
  const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (!match) {
    throw new Error(`Couldn't find a "last" page number in Link header: ${link}`);
  }
  return parseInt(match[1], 10);
}

const sha = git("git rev-parse --short HEAD") ?? "unknown";
const fullSha = git("git rev-parse HEAD") ?? sha;
const isShallow = git("git rev-parse --is-shallow-repository") === "true";

let count;
if (!isShallow) {
  // Full local history (normal dev checkout) — git already has the exact
  // answer, no need to touch the network.
  count = git("git rev-list --count HEAD") ?? "0";
} else {
  try {
    count = String(await getCommitCountFromGitHub(fullSha));
    console.log(`[version] GitHub-derived commit count: ${count}`);
  } catch (err) {
    console.log(`[version] GitHub commit-count lookup FAILED: ${err.message} — falling back to local git rev-list (likely inaccurate on a shallow clone)`);
    count = git("git rev-list --count HEAD") ?? "0";
  }
}

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
