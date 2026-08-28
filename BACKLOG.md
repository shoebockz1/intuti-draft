# Intuti Draft Tool — Backlog

Living list of open items needed to make this fully functional and live for all 10 owners.
Statuses: **Not started** / **In progress** / **Done, but untested**

Last updated: 2026-08-28

---

## Blocking — needed before any real multi-owner draft

- **Not started** — Final human review pass of the "Load 2025 rosters" fixture data close to draft day, to catch any roster moves/trades since the source screenshots were taken.
- **Not started** — Full 18-round, 10-owner rehearsal draft on the hosted version of the new server-authoritative architecture — only individual mechanics have been spot-checked so far, not a full run-through.
- **Done, but untested** — Optimize the mobile/tablet experience. The site was confirmed *reachable* on phones, but the layout had never been tuned for small touch screens. Root cause found: there were **zero media queries in the codebase**, and the draft screen's fixed `200px 1fr 210px` grid meant the two sidebars alone (410px) overflowed a 375px phone, collapsing the board's `1fr` track to **0px** — so the board spilled out of the page and the whole document scrolled sideways. Fixed across three routes:
  - Draft screen stacks below 1080px, reordered so the phone reading order is *on the clock → make a pick → keep buttons → board → status → 5th place → research* (uses `display: contents` to promote the sidebar's panels to grid items). Board stays a horizontal scroller on phones with the round-number column pinned left; at tablet widths columns narrow to 66px so all 10 owners fit with no scroll at all.
  - Every interactive control now meets a 40–44px touch target — previously **all 28 were under it**, with "Keep" (the most-pressed control in the draft) at 42×19px. Focusable inputs raised to 16px to stop iOS Safari auto-zooming the page on focus.
  - Setup screen's `1fr 320px` and randomizer's `1fr 1fr` grids stack instead of running off-screen (the 5th-place panel used to be half off a phone); `/players` toolbar tabs became one scrolling strip with the player-name column pinned.
  - Board column widths moved out of the `<colgroup>`'s inline styles into CSS so breakpoints can actually control them; th/td widths removed so the colgroup is the single source of truth (having both made the higher-specificity cell rule silently win).
  - Set `build.cssTarget: 'safari14'` in `vite.config.ts`. Vite's default baseline was minifying every media query into modern range syntax (`@media (width<=640px)`), which Safari only understands from 16.4 — an owner on an older iPhone would have silently gotten *none* of this and been handed the desktop board.

  Verified in-browser against a live local draft with the real 2025 rosters at 375px, 768px and 1280px: no page-level horizontal scroll on any route, correct stacking order, board scrolls/fits as intended, a real Keep pick still advances the clock, and **desktop is byte-for-byte unchanged** (70px columns, no board scroll, 3-column layout). Typecheck, lint and production build all pass. **Still untested on an actual phone** — real-device touch scrolling, iOS Safari quirks and genuine tap comfort haven't been confirmed, and it hasn't been deployed to Render yet. Do that before moving this to `DONE.md`.
- **Not started** — Draft-day reminder: upgrade Render from Free to the paid Starter tier ($7/mo, prorated) the night before / morning of the draft to eliminate cold-start delays, then downgrade back to Free afterward. Now that draft state persists to Redis (see Done), a restart during the switch no longer wipes an in-progress draft — still best done when nothing's actively happening, since each save is an async best-effort write (a pick made in the exact instant of a restart could theoretically be lost), but the "restart = catastrophe" risk is gone. Remember to actually downgrade afterward or it'll keep billing $7/mo indefinitely.

- **Done, but untested** (all three phases) — Multi-page "tab workspace" so owners can mimic the ClickyDraft workflow they've used for 5 years: several browser tabs open at once (board / available players / last year's rosters) instead of one dense screen. On a phone the same pages become full-screen views, which fixes the real mobile complaint — even after the touch pass above, the board still starts ~880px down `/` on a 375px screen, buried under the side panels. Deliberately **additive**: `/` keeps its current desktop and mobile layout unchanged.

  **Phase 1 — enablers — DONE** (each fixes a standing bug on its own merits, independent of the pages):
  1. `<AppLink>` anchor component in the router. Today there are **zero `<a>` elements in the entire app** — every navigation is a `<button onClick={navigate()}>`, so nobody can ctrl/cmd-click, middle-click or "open in new tab". The multi-tab workflow is structurally unreachable from the UI until this exists. Plain left-clicks still route client-side; modifier/middle clicks fall through to the browser. Programmatic redirects (post-login, post-reset) stay as `navigate()`.
  2. Visibility-gate `useDraftPolling` — skip ticks while `document.hidden`, poll immediately on becoming visible again. Each tab currently polls every 2s and fires 2 requests per tick (state + log), so 3 tabs × 10 owners would be ~30 req/s sustained for a 3-hour draft on a Render free instance; gating keeps it at today's ~10 req/s. Also fixes iOS suspending background-tab timers, which leaves a phone showing a stale board on wake.
  3. Persist `myOwnerIdx` to localStorage (currently `useState(0)`, so every tab and every reload silently defaults to whoever is first in the draft order), and lift `WhoAmIModal` to app level. Latent bug it fixes: the modal's trigger fires on any route but it only *renders* inside `DraftScreen`, so opening `/players` in a fresh tab sets `whoAmIOpen = true` with nothing to show, and the modal then pops unexpectedly on a later navigation to `/`.

  **Phase 2 — the pages — DONE** (mostly relocating existing components, no new draft logic):
  4. `/boardonly` — the draft board with no side panels, **read-only** (no picks; use `/` to pick). Keeps the legend and the unprotected counter. Above the board, a single line of text — "5th-place pick: `<status>`" — because the board alone can silently hide the jump pick: the jump and the winner's natural turn can share a round and the board renders only one pick per (round, owner) cell, so the natural pick wins the cell and the jump's player vanishes. This is the same failure `FifthPlacePanel` was built for; a bare board would reintroduce it. Landscape matters here — at 812px wide the full 10-column board fits with no horizontal scroll (726px at desktop column widths), so keep the sticky round column and show a "rotate for the full board" hint in portrait.
  5. `/rosters` — last year's rosters for reference: toggle through each team, per-player status, and whether that team's seal is intact. Extract the existing Team Roster panel out of `ResearchSidebar` into a shared `TeamRosterView` used by **both** the sidebar and the new page, rather than copying it — status logic drift is a live risk here (the "James Cook III" vs "James Cook" suffix bug in DONE.md was exactly a status-correctness bug, and two copies means only one gets fixed). Keep all four states, not just kept/free: **kept** / **protected** (seal intact) / **free** (seal broken, unclaimed) / **drafted** (seal broken, someone took them).
  6. Shared compact header on the three secondary pages: who's on the clock plus links between pages. On `/boardonly` the on-clock line links back to `/`, since that's where picks are made.

  **Phase 3 — discoverability — DONE:** a small link row on `/` so the new pages are findable at all, especially on a phone, since `/` stays the default landing page. The page list lives in one shared `PageNav` used by both the standalone pages' header and the main board, so adding a page later surfaces it everywhere at once. On desktop this costs `/` a single 24px row and nothing else; on phones it renders as a 2x2 grid of 40px targets (a flex row left the fourth link stranded full-width on its own line, reading like a different kind of control).

  Verify visibility-gated polling against the real Render instance before draft day, not just locally — it's the one piece resting on a production-load assumption.

  **Verified in-browser (local, live draft, real 2025 rosters):** hidden tab makes **0** draft-API calls over 6s (was ~12) and re-polls at 0ms on becoming visible; plain clicks route client-side while ctrl/cmd-clicks fall through to the browser; identity persists across reloads with no re-prompt and re-prompts when the owner names change. `/boardonly` renders the board with no side panels and **zero** Keep buttons (read-only confirmed); `/rosters` shows all 10 teams, seal banners, and live kept/protected/free/drafted statuses; `/` is unchanged (same 3-column layout, all five panels, 20 Keep buttons).

  The 5th-place line earned its place immediately — a real jump was triggered end-to-end (two unprotected picks, then the jump) and the jump player **did not appear in any board cell**, exactly the hidden-cell failure from DONE.md. The text row surfaced it correctly ("Delta Jumpwood — The Paulyators · After Round 1, Pick 3"), matching FifthPlacePanel on `/` since both now read the same shared helper. On a phone the board moved from ~881px down `/` to **385px** on `/boardonly`, and in landscape all 10 teams fit with **no horizontal scroll at all** (749px board in a 749px container).

  Also fixed in passing: the roster team `<select>` carried an inline `font-size: 12px`, which beat the 16px touch rule and kept triggering iOS Safari's focus-zoom. Now a class, 16px/44px on mobile.

  Phase 3 verified too: all four pages reachable from `/`, full nav round-trip (`/` -> `/boardonly` -> `/rosters` -> `/players` -> `/`) with correct active states and **no full page reload** at any hop; `/` desktop still `200px 783px 210px` with all five panels, 20 Keep buttons, 70px board columns and no board scroll. Production SPA fallback is `/^(?!/api).*/`, so the new routes need no server change to deep-link. Build output confirmed still emitting classic media-query syntax (0 modern range queries) including the new `orientation: portrait` rule.

  **Still untested on a real phone**, and not yet deployed to Render — same caveat as the mobile item above.

## Pending on external parties

- **In progress** — Yahoo Fantasy Sports API access application submitted; waiting on Yahoo's review, no timeline given.
- **Not started** — "Import from Yahoo" UI (setup-screen button to pull team names + rosters) — blocked on the above approval. Server-side OAuth plumbing already exists.

## Deferred features (explicitly, by prior decision)

- **Not started** — Trades. Requirements only partially resolved (see `HANDOFF.md` Section 3) — pick-rebalancing mechanics still undesigned.

- **Will not do (decided 2026-08-28)** — Optimistic-concurrency guard on picks (sending `expectedPick`/`ownerIdx` so the server 409s a pick submitted from a stale view). Raised while scoping the multi-page work: `POST /api/draft/pick/keep` takes only `{ protIdx }` and applies it to whoever is on the clock when it arrives, so a stale client can in principle land a pick on the wrong owner. **Robin has assessed this as an acceptable risk and it is not being built**: the draft runs live in-person plus Zoom, the group is trusted, there is ample time between picks, and Undo already exists as a backstop. Recorded so it is not re-litigated — do not re-raise this unless the draft format changes (e.g. owners picking asynchronously/unsupervised).

## Hardening / lower-risk gaps

- **Not started** — Rate limiting on `/api/commissioner/login` (low risk given this is a private trusted-friend tool, but there's currently nothing stopping repeated passcode guesses if the URL became known).
- **Not started** — Session store. Express's default in-memory session store logs its own warning about not being production-safe (no pruning of expired sessions, doesn't scale past one process). Directly observed during the persistence testing: restarting the server logs the commissioner out (their session lives in the same in-memory store, unlike the draft data, which now survives via Redis). Low-stakes today — just re-enter the passcode — but worth fixing alongside future hardening, especially since we now expect restarts to be non-catastrophic and might do them more casually (e.g. the draft-day plan-switch).
- **Not started** — Provision a genuinely separate Upstash Redis database for local dev, instead of relying solely on the key-namespace split (see Done — "Namespaced the Redis persistence key by environment"). The key namespace already makes prod/dev collisions structurally impossible today, so this is defense-in-depth, not urgent — but a fully separate database (and `.env` credentials) removes the shared-blast-radius entirely, e.g. protects against a future code change that reads the key name from somewhere the namespace logic doesn't cover.

## Future — after this draft, not blocking anything upcoming

- **Not started** — Archive completed drafts so they can be loaded/viewed later. Today there's only ever "the one live draft" — no concept of draft history across years. Needs: a save-on-completion step, storage for past drafts (Redis works fine for one; a small number of yearly archives is still tiny data, so no new infra needed), and a read-only view to browse an archived draft's board/log.
- **Not started** — Explore auto-loading a completed draft's results directly into the real 2026 Yahoo league. **Likely blocked by more than just the pending Yahoo approval**: the application currently in review only requested *read-only* access (`fspt-r` scope) — writing roster data into a Yahoo league is a separate, write-level permission (`fspt-w`) that hasn't been requested at all yet. Worth confirming the actual mechanics of "set a Yahoo roster via API" are even something Yahoo's API supports for this use case before assuming it's just a scope bump away.
- **Not started** — After the 2026 season ends, extract real rosters from Yahoo the same way "Load 2025 rosters" works now, but automated instead of manual screenshots. Once Yahoo read access is approved, the existing (already-built, currently unused) server-side Yahoo roster-fetch plumbing could pull team names + players directly, generating a `rosters2026.ts`-equivalent fixture without the screenshot-and-transcribe process. Note team names may change year to year — worth designing for that rather than assuming stability.

---

## How this file works

- New requirements/ideas get added here as they come up in conversation.
- When work starts on an item, flip it to **In progress**.
- When work is verified working, it moves to `DONE.md` (see status conventions there — "Done, but untested" items stay here until actually verified, then move once confirmed).
