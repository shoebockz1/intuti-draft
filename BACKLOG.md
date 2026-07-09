# Intuti Draft Tool — Backlog

Living list of open items needed to make this fully functional and live for all 10 owners.
Statuses: **Not started** / **In progress** / **Done, but untested**

Last updated: 2026-07-09 (night)

---

## Blocking — needed before any real multi-owner draft

- **Done, but untested** — Host the app on Render (`https://intuti-draft-board.onrender.com`) so all 10 owners can reach it. Live and verified via curl and a real browser: health check, static site + SPA routing (`/` and `/admin`), commissioner login/session persistence, Yahoo OAuth redirect, and a full setup→start→revisit→wipe-guard walkthrough all confirmed working. Still not done: everything so far has been from Robin's own computer — nobody has loaded the URL from a genuinely separate device yet, which is the actual test of "can the other 9 owners reach this."
- **Not started** — Final human review pass of the "Load 2025 rosters" fixture data close to draft day, to catch any roster moves/trades since the source screenshots were taken.
- **Not started** — Full 18-round, 10-owner rehearsal draft on the hosted (or at least multi-browser) version of the new server-authoritative architecture — only individual mechanics have been spot-checked so far, not a full run-through.
- **Not started** — Mobile layout testing — owners will likely be on phones, layout hasn't been checked there yet.

## Pending on external parties

- **In progress** — Yahoo Fantasy Sports API access application submitted; waiting on Yahoo's review, no timeline given.
- **Not started** — "Import from Yahoo" UI (setup-screen button to pull team names + rosters) — blocked on the above approval. Server-side OAuth plumbing already exists.

## Deferred features (explicitly, by prior decision)

- **Not started** — Trades. Requirements only partially resolved (see `HANDOFF.md` Section 3) — pick-rebalancing mechanics still undesigned.
- **Not started** — Free Agents research panel — still a labeled placeholder, not wired to live Sleeper availability data or the pick-making flow.

## Hardening / lower-risk gaps

- **Not started** — Draft state persistence. Everything (live draft, transaction log, pre-reset snapshots) is in-memory only on the server — a crash or restart mid-draft loses it all, with no recovery. Acceptable for now, worth a decision before trusting it on the actual draft day.
- **Not started** — Rate limiting on `/api/commissioner/login` (low risk given this is a private trusted-friend tool, but there's currently nothing stopping repeated passcode guesses if the URL became known).
- **Not started** — Session store. Express's default in-memory session store logs its own warning about not being production-safe (no pruning of expired sessions, doesn't scale past one process). Low priority — we're intentionally running one instance and sessions are short-lived — but worth a look if the app runs long-term.

---

## How this file works

- New requirements/ideas get added here as they come up in conversation.
- When work starts on an item, flip it to **In progress**.
- When work is verified working, it moves to `DONE.md` (see status conventions there — "Done, but untested" items stay here until actually verified, then move once confirmed).
