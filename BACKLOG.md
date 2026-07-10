# Intuti Draft Tool — Backlog

Living list of open items needed to make this fully functional and live for all 10 owners.
Statuses: **Not started** / **In progress** / **Done, but untested**

Last updated: 2026-07-09 (late night)

---

## Blocking — needed before any real multi-owner draft

- **Not started** — Final human review pass of the "Load 2025 rosters" fixture data close to draft day, to catch any roster moves/trades since the source screenshots were taken.
- **Not started** — Full 18-round, 10-owner rehearsal draft on the hosted version of the new server-authoritative architecture — only individual mechanics have been spot-checked so far, not a full run-through.
- **Not started** — Optimize the mobile/tablet experience. The site is confirmed *reachable* on phones (loads correctly off-network), but the layout itself was designed/tested on desktop and hasn't been reviewed or tuned for small touch screens — owners will likely be using phones during the actual draft, so this is about usability there (tap targets, board scroll/layout, panel stacking, etc.), not just "does it load."
- **Not started** — Draft-day reminder: upgrade Render from Free to the paid Starter tier ($7/mo, prorated) the night before / morning of the draft to eliminate cold-start delays, then downgrade back to Free afterward. **Do this only when no draft is in progress** — switching instance types restarts the server, which would wipe the live draft (no persistence yet, see below). Also remember to actually downgrade afterward or it'll keep billing $7/mo indefinitely.

## Pending on external parties

- **In progress** — Yahoo Fantasy Sports API access application submitted; waiting on Yahoo's review, no timeline given.
- **Not started** — "Import from Yahoo" UI (setup-screen button to pull team names + rosters) — blocked on the above approval. Server-side OAuth plumbing already exists.

## Deferred features (explicitly, by prior decision)

- **Not started** — Trades. Requirements only partially resolved (see `HANDOFF.md` Section 3) — pick-rebalancing mechanics still undesigned.

## Hardening / lower-risk gaps

- **Not started** — Draft state persistence. Everything (live draft, transaction log, pre-reset snapshots) is in-memory only on the server — a crash or restart mid-draft loses it all, with no recovery. Acceptable for now, worth a decision before trusting it on the actual draft day.
- **Not started** — Rate limiting on `/api/commissioner/login` (low risk given this is a private trusted-friend tool, but there's currently nothing stopping repeated passcode guesses if the URL became known).
- **Not started** — Session store. Express's default in-memory session store logs its own warning about not being production-safe (no pruning of expired sessions, doesn't scale past one process). Low priority — we're intentionally running one instance and sessions are short-lived — but worth a look if the app runs long-term.

---

## How this file works

- New requirements/ideas get added here as they come up in conversation.
- When work starts on an item, flip it to **In progress**.
- When work is verified working, it moves to `DONE.md` (see status conventions there — "Done, but untested" items stay here until actually verified, then move once confirmed).
