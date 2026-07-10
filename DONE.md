# Intuti Draft Tool — Done

Items completed and verified working, moved off `BACKLOG.md`.

Last updated: 2026-07-10

---

- **Done** — Project scaffolded: React + TypeScript + Vite client, Node + Express + TypeScript server, replacing the single-file HTML prototype.
- **Done** — Draft engine (seal mechanic, 5th-place-winner jump pick, round-18 balancing skip, undo history) ported faithfully from the prototype and verified in-browser against the worked example in `HANDOFF.md`.
- **Done** — Sleeper API integration: free NFL player search wired into the Protected Players setup tab, with the original free-text entry kept as a fallback. Server caches Sleeper's player dump for 24h per their own rate-limit guidance.
- **Done** — Real 2025-season roster data (all 10 teams, transcribed from roster screenshots and cross-checked against Sleeper for spelling) replaced the fake-name "Fill with test data" button — now "Load 2025 rosters," loading real team names and real players in one click.
- **Done** — Yahoo OAuth server-side plumbing built (login/callback/token refresh/league-roster fetch), local HTTPS via mkcert set up for the dev server to satisfy Yahoo's HTTPS-only redirect requirement.
- **Done** — Yahoo Fantasy Sports API access application submitted (see Backlog — approval itself is still pending, that part isn't done).
- **Done** — GitHub repo created (`shoebockz1/intuti-draft`), PR workflow exercised end-to-end (Sleeper integration PR reviewed, tested, and merged).
- **Done** — Draft state moved server-side: the server now holds the one authoritative live draft (in-memory), and every browser polls it, so multiple viewers see the same real board instead of independent blank copies.
- **Done** — Commissioner-only access control: a shared passcode gates setup (Draft Order / Protected Players / Order Randomizer / Start Draft) and destructive actions (Undo, Hard Reset, snapshot restore). Making a pick stays open to everyone once a draft is running, by design (trusted friend group, no per-owner turn locking).
- **Done** — Transaction log (`GET /api/draft/log`) recording every start/keep/unprotected/undo/reset/restore action.
- **Done** — Pre-hard-reset snapshot safety net — the server saves the last 5 pre-reset states, restorable via a commissioner-only endpoint. Verified end-to-end: wiped a live draft, restored it, confirmed the exact prior pick and on-the-clock owner came back correctly.
- **Done** — Fixed a session-cookie bug (`SameSite=Lax` silently dropping the commissioner session on cross-scheme `fetch()` POSTs) found during verification of the above.
- **Done** — Added a "You: `<name>` (change)" control so an owner can correct a wrong "Who are you?" selection instead of it being stuck for the session.
- **Done** — Restructured the server to serve the built client as static files (with an SPA fallback) in production, collapsing client + server into one deployable service and sidestepping the cross-origin cookie complexity entirely for hosting.
- **Done** — Real commissioner passcode set (replacing the local test placeholder), both in local `.env` and on Render.
- **Done** — App deployed to Render at `https://intuti-draft-board.onrender.com`. Fixed a build failure along the way: Render's build step runs with `NODE_ENV=production` already set, which is also npm's own signal to skip devDependencies — broke the build since `vite`/`typescript`/`@types/node` all live there. Fixed with `--include=dev` on both installs, verified by reproducing the exact failure locally before pushing the fix.
- **Done** — Verified the live production deployment end-to-end via direct requests: health check, static site + SPA routing on both `/` and `/admin`, commissioner login with session persistence across requests, and the Yahoo OAuth redirect all confirmed working against the real hosted URL (not just localhost).
- **Done** — Fixed /admin losing all setup data (owner names, protected players, 5th place) on revisit after starting a draft — it now pre-fills from the live server-side DraftState instead of resetting to blank defaults. Surfaced and fixed a related danger: re-clicking "Start draft" while one's already in progress now requires explicit confirmation instead of silently overwriting it.
- **Done** — Moved Reset off the shared board entirely (Undo stays); it now lives only on the commissioner-gated `/admin` screen, reducing the chance of a stray click on a shared/passed-around device during a live draft. Dropped the now-pointless "soft reset" tier in the process. Verified with a full click-through on the live production site: setup data retention, the wipe-guard confirmation prompt, and Reset's absence from the board all confirmed working.
- **Done** — Hosting fully confirmed reachable: loaded `https://intuti-draft-board.onrender.com` from a phone on cellular data (off Robin's home network), proving it's genuinely reachable by devices other than the one it was built on — this was the actual goal of hosting it in the first place.
- **Done** — Free Agents research panel wired up (first pass): live search reusing the existing Sleeper-backed endpoint, cross-referenced against the polled live draft to show available/drafted/still-protected status, and drafts directly through the same pick-making path as the Unprotected tab.
- **Done** — Upgraded Free Agents into a dedicated `/players` research page (superseding the sidebar-only search from the item above, per feedback that this needed to be a much bigger part of the experience): position tabs (ALL/QB/RB/WR/TE/K/DEF), browse-everyone-sorted-by-ranking when nothing's typed, always-visible position column, and new data fields (injury status, age/experience) pulled from Sleeper. Extracted the board's polling into a shared `useDraftPolling` hook so this new page gets live status independently of the board route. Verified end-to-end in a real draft: position filter (RB tab, 257 correctly rank-sorted results), combined position+search filtering, real injury status data flowing through (Mahomes showed "Questionable"), and a live draft-from-table click that correctly broke the seal and advanced the turn. **Note**: verified in local dev only so far — not yet re-deployed to the Render production site (Auto-Deploy is off; needs a manual "Deploy latest commit" before it's live for owners).

---

## How this file works

- Items land here only once actually verified (built, checked, working) — not just "written."
- See `BACKLOG.md` for everything still open.
