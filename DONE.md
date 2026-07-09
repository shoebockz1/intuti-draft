# Intuti Draft Tool — Done

Items completed and verified working, moved off `BACKLOG.md`.

Last updated: 2026-07-09

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

---

## How this file works

- Items land here only once actually verified (built, checked, working) — not just "written."
- See `BACKLOG.md` for everything still open.
