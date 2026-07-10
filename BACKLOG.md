# Intuti Draft Tool — Backlog

Living list of open items needed to make this fully functional and live for all 10 owners.
Statuses: **Not started** / **In progress** / **Done, but untested**

Last updated: 2026-07-10 (night)

---

## Blocking — needed before any real multi-owner draft

- **Not started** — Final human review pass of the "Load 2025 rosters" fixture data close to draft day, to catch any roster moves/trades since the source screenshots were taken.
- **Not started** — Full 18-round, 10-owner rehearsal draft on the hosted version of the new server-authoritative architecture — only individual mechanics have been spot-checked so far, not a full run-through.
- **Not started** — Optimize the mobile/tablet experience. The site is confirmed *reachable* on phones (loads correctly off-network), but the layout itself was designed/tested on desktop and hasn't been reviewed or tuned for small touch screens — owners will likely be using phones during the actual draft, so this is about usability there (tap targets, board scroll/layout, panel stacking, etc.), not just "does it load."
- **Not started** — Draft-day reminder: upgrade Render from Free to the paid Starter tier ($7/mo, prorated) the night before / morning of the draft to eliminate cold-start delays, then downgrade back to Free afterward. Now that draft state persists to Redis (see Done), a restart during the switch no longer wipes an in-progress draft — still best done when nothing's actively happening, since each save is an async best-effort write (a pick made in the exact instant of a restart could theoretically be lost), but the "restart = catastrophe" risk is gone. Remember to actually downgrade afterward or it'll keep billing $7/mo indefinitely.

## Pending on external parties

- **In progress** — Yahoo Fantasy Sports API access application submitted; waiting on Yahoo's review, no timeline given.
- **Not started** — "Import from Yahoo" UI (setup-screen button to pull team names + rosters) — blocked on the above approval. Server-side OAuth plumbing already exists.

## Deferred features (explicitly, by prior decision)

- **Not started** — Trades. Requirements only partially resolved (see `HANDOFF.md` Section 3) — pick-rebalancing mechanics still undesigned.

## Hardening / lower-risk gaps

- **Not started** — Rate limiting on `/api/commissioner/login` (low risk given this is a private trusted-friend tool, but there's currently nothing stopping repeated passcode guesses if the URL became known).
- **Not started** — Session store. Express's default in-memory session store logs its own warning about not being production-safe (no pruning of expired sessions, doesn't scale past one process). Directly observed during the persistence testing: restarting the server logs the commissioner out (their session lives in the same in-memory store, unlike the draft data, which now survives via Redis). Low-stakes today — just re-enter the passcode — but worth fixing alongside future hardening, especially since we now expect restarts to be non-catastrophic and might do them more casually (e.g. the draft-day plan-switch).

---

## How this file works

- New requirements/ideas get added here as they come up in conversation.
- When work starts on an item, flip it to **In progress**.
- When work is verified working, it moves to `DONE.md` (see status conventions there — "Done, but untested" items stay here until actually verified, then move once confirmed).
