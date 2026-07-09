# Intuti Fantasy Draft Tool — Claude Code Handoff

## Read this first

This is a full spec + project handoff for a custom fantasy football draft tool. Everything below was worked out over an extended requirements/prototyping conversation with Claude (chat). The prototype (`intuti-draft-prototype.html`, included in this folder) is a **working single-file HTML implementation of the core draft logic** — treat it as a reference implementation and a source of truth for behavior, not as production code to simply extend in place. It has real bugs fixed in it already; the fixes are documented below so they aren't reintroduced.

The user (Robin) has a Java/C# background, is comfortable reading and debugging code, but prefers Claude to lead on implementation while Robin drives requirements and reviews/tests output. Robin will test manually and report bugs/edge cases conversationally — expect an iterative build-review-fix loop.

---

## 1. Project purpose & context

Robin runs a 16-year-old fantasy football keeper league called **"Intuti"** with 10 owners. The league:
- Uses **Yahoo Fantasy Football** for the actual regular season (league ID: `101893`)
- Currently uses **ClickyDraft.com** for the annual draft, run manually to accommodate custom rules ClickyDraft doesn't support natively
- Wants a **purpose-built draft tool**, hosted on a personal website, to fully replace ClickyDraft

This draft tool is the **first major project** on what will become Robin's personal website. Long-term, Robin is open to this becoming a properly hosted web app (not just a static file) — cost-sensitivity was mentioned explicitly: **Robin is fine with hosting costs as long as they're low** (e.g. ~$0–5/month range, like Render's free/hobby tier).

---

## 2. The league's draft rules (this is the core domain logic — get this exactly right)

### Format
- 10 owners, 18 rounds, **continuous snake draft** (order reverses each round, no reset)
- Roster size: 18 players. Positions: QB, RB, WR, TE, K, DEF. **No position requirements** — an owner can skip an entire position (e.g. never draft a K) with no penalty.
- Draft is conducted mostly in-person, with some owners remote via video/audio/text.
- Robin (commissioner) manages the board/state, but says a couple of other trusted people may also need to be able to run it.

### Draft order
- Order is **randomized ahead of time** (about a week before draft day) using a randomizer tool, **not** at the start of the draft session itself.
- By draft day, everyone already knows their pick position.
- **Important distinction the first prototype got wrong initially:** the *live draft tool* should let Robin set/enter the order manually (already decided), while a **separate randomizer utility** exists to help decide that order ahead of time. Both are needed as distinct features. The current prototype has both (see Section 5).

### The "Seal" mechanic (core mechanic — this is what makes the league's draft unique)
- Going into the draft, each owner has **protection rights to their own players from the previous season**. These are that owner's "protected players."
- Each owner's protected roster starts **sealed** (protected/hidden from the general draft pool — not draftable by anyone but the owner).
- On an owner's turn, they choose one of two options:
  1. **Keep one of their own protected players.** This uses up that pick slot for the current season. The seal remains intact. They can keep doing this turn after turn indefinitely, as long as they keep choosing their own protected players.
  2. **Draft any unprotected player** (a rookie, a free agent, or another owner's now-unprotected player). Doing this **breaks their own seal** — their *entire remaining* protected roster immediately becomes available to every other owner, for the rest of the draft.
- Seal-breaking is **one-directional and permanent** for that owner, for that draft. Once broken, it cannot be restored (except for the one 5th-place-winner exception below).
- There is **no way to "pass"** on your own protected players without breaking the seal — choosing not to keep an own player is definitionally choosing to draft unprotected, which breaks the seal. (Robin confirmed there's no edge case they could think of that contradicts this.)
- Any protected players an owner never got around to drafting (because the draft ended, or because their seal never broke and they didn't pick them all) simply **go to free agency** after the draft — they are not "lost" but also not automatically part of the owner's roster.

### The "5th Place Winner" rule (a second mechanic layered on top of the seal mechanic)
This is the trickiest rule and deserves the most care.

- Each year, whoever finished **5th place** in the standings the previous season gets a special one-time bonus during the draft.
- The league **tracks a global (not per-owner) count of "unprotected picks made"** — i.e., every time *any* owner breaks their seal or drafts unprotected (including subsequent unprotected picks by an already-broken owner), the global counter increments.
- **Trigger:** the moment the **2nd unprotected pick** (global count) is made by anyone, the 5th place winner immediately **jumps the snake order** and gets awarded the very next pick — referred to as the "3rd unprotected pick" conceptually, though it's really "the bonus pick right after the 2nd unprotected pick."
- **The special benefit:** if the 5th place winner's seal is **still intact** at the moment this jump triggers, they get to draft **any unprotected player during their jump pick without it breaking their own seal.** This is the one exception to the seal being one-directional/immediate — it's a one-time exemption for this specific pick.
  - If the 5th place winner had **already broken their own seal** before this triggers, they still get the jump pick, they just don't get the seal-protection benefit (nothing to protect at that point).
- **After the jump pick, the snake order resumes exactly where it would have gone** — the owner who "would have" picked next still picks next. The jump does not skip/bump anyone else; it just inserts one extra pick.
- **If the 5th place winner is the one who makes the 1st or 2nd unprotected pick themselves**, the mechanic still triggers normally — count continues to apply globally regardless of who makes the qualifying picks.
- This entire mechanic **fires exactly once per draft.** After the jump pick is made, there is nothing further to track — the counter's job (for this purpose) is done. (Note: Robin said counting only needs to go to 3 and it's trivial to track manually, but the tool should still track and enforce it automatically.)
- **Balancing consequence:** because the 5th place winner ends up with one *extra* pick from the jump, they are **skipped once in the final round (Round 18)** to even out roster sizes at the end. This skip should be visually marked on the board, not silently applied.

### Worked example to sanity-check any implementation
1. Owner C is on the clock, seal intact, drafts an unprotected rookie → **seal breaks**, global unprotected count = 1.
2. Owner D is on the clock (their own seal may or may not already be broken), drafts unprotected → global unprotected count = 2. **This triggers the jump.**
3. Next pick is inserted: the 5th place winner (say, Owner H) jumps in. If Owner H's seal was still intact, they may draft **any unprotected player without breaking their own seal.** This is their "jump pick."
4. After Owner H's jump pick, the draft resumes with whoever was **actually next in the snake order** (i.e., the owner who would have picked right after Owner D, as if the jump pick were simply inserted extra, not a replacement).
5. In Round 18, Owner H's normal turn is **skipped** to balance the extra pick they got in step 3.

---

## 3. Known ambiguities / open design question — TRADES (not yet resolved, needs design work)

Robin explicitly wants **mid-draft trade handling** as the next feature, but this was **not fully scoped** before handoff. Here is the conversation state on this topic — please resume this discussion with Robin rather than guessing:

Questions that were asked but not yet answered by Robin:
1. What gets traded most often — draft picks, protected/rostered players, or both?
2. If a draft pick is traded (e.g. Owner A's Round 5 pick goes to Owner B), does Owner B pick in Owner A's original snake slot, or does it get appended as an extra pick elsewhere?
3. If a protected player is traded before being kept, does it move to the new owner's protected list? Critically: **could the new owner keep that traded player without it affecting their own seal status?** (This interacts directly with the seal mechanic and needs careful thought — a naive implementation could create exploitable edge cases, e.g. trading away your remaining protected players right before breaking your seal.)
4. Who approves/confirms a trade in the tool — commissioner-only entry, or does it need dual confirmation from both owners on-screen?
5. How urgent/frequent is this historically? (Robin hadn't clarified whether this is a rare edge case or a regular occurrence.)

**Recommendation for Claude Code:** Before building trade functionality, resume this requirements conversation with Robin using the questions above. Don't assume standard fantasy-trade semantics — this league's seal mechanic makes player trades non-trivial (a traded protected player's relationship to seal status is genuinely ambiguous and must be nailed down explicitly).

---

## 4. Data / integrations roadmap (discussed but only partially built)

### Sleeper API (player data) — intended next technical step, not yet implemented
- Robin does not use Sleeper for the league itself — it was proposed purely as a **free, no-auth-required player database** to source real NFL player names/positions for the draft pool.
- Plan agreed with Robin:
  - **Protected player entry** (setup screen) should let owners search/select from real Sleeper players instead of free-text entry (free-text is fine for now, but the real version needs search-select).
  - **"Fill with test data" button** (currently generates fake random names — see Section 5) should be upgraded to pull real random players from Sleeper's database once connected, for more realistic testing.
  - **The main draft pool** (unprotected/free-agent players) should eventually be sourced from Sleeper, with each player showing live status: **"available" or "drafted"** (this replaces a hardcoded "free" label used in protected-roster displays right now — see the TODO comments already in the prototype code).
- **Filtering requirements Robin specified:**
  - Include players who were on an active NFL roster at any point during the 2025 season, **including players who missed the entire season due to injury** (e.g. on IR) — they should still show up, since they're valid keeper/draft candidates.
  - **Exclude** long-retired players (the raw Sleeper database includes essentially everyone historically, which is too noisy).
  - **Include rookies** — the incoming 2026 draft class — but in a clearly labeled separate section/tag, since they won't have an NFL team yet. This maps naturally to the league's rule that rookies are always unprotected/available to anyone.
- Season framing: **protecting 2025 rosters, drafting for the 2026 season.**

### Yahoo Fantasy API (roster import) — discussed, explicitly deferred
- Robin's league's actual season play happens on Yahoo (league ID `101893`). Robin asked whether rosters (and possibly team names) could be auto-imported from Yahoo.
- **Established during the conversation:** Yahoo's Fantasy API requires full OAuth2 (a registered Yahoo Developer app with client ID/secret, plus a backend to handle the token exchange — this cannot be done from a static/client-only HTML file). A league ID alone is not sufficient to pull data.
- Cost estimate given to Robin: a small backend (e.g. Node.js on Render/Railway free or hobby tier) would run roughly **$0–5/month**.
- **Decision reached:** Given the import is only needed once a year and involves a manageable amount of manual entry (10 owners × ~15-20 protected players), **Robin agreed to deprioritize Yahoo OAuth import** in favor of manual entry with Sleeper-backed player search. Yahoo import was left as a **possible future nice-to-have**, not a current requirement. Don't build this unless Robin explicitly asks again.

---

## 5. Current prototype — feature inventory & implementation notes

File: `intuti-draft-prototype.html` (included in this folder). Pure HTML/CSS/JS, no build step, no backend, no persistence. It was built and iterated live in a chat artifact tool, so the code has some structural quirks (inline styles, some duplicated render logic) worth cleaning up in a proper project structure — but the **behavior** has been tested and refined across several rounds of user feedback and should be treated as correct/authoritative for the rules in Section 2.

### Setup screen (3 tabs)
1. **Draft Order tab** — manual, ordered list of 10 owner name inputs with ↑/↓ reordering controls (NOT auto-randomized on start — this was an explicit bug fix; earlier version incorrectly randomized order when clicking "start draft", which is wrong per Section 2). A **5th place winner dropdown** lives on this same tab (also relocated here per explicit request — it originally was a `prompt()` dialog at draft-start time, which was poor UX).
2. **Protected Players tab** — per-owner free-text player name entry (chip/tag UI, click × to remove). Includes:
   - **"Fill with test data (17 per owner)"** button — generates 17 unique fake-but-plausible NFL-style names per owner (deduped across the whole board) so Robin can test draft mechanics without hand-typing ~170 names. Tops up existing entries rather than overwriting if run again. Leaves room for Robin to manually add the 18th real/test player per owner.
   - **"Clear all"** button.
   - Per-owner live player count display.
   - **Note:** positions were deliberately removed from this entry flow — an earlier version asked for position at protected-player entry time, which Robin said was premature without a real player list. Don't reintroduce position selection here until real player data (with real positions) is wired in.
3. **Order Randomizer tab** — a **separate, standalone utility** (not tied to the live draft state) where names can be entered and shuffled with a visual animation, then copied to clipboard (e.g. to paste into a group chat) or applied directly into the Draft Order tab. This exists because Robin's actual workflow is: randomize order **days before** the draft using some tool, then everyone shows up already knowing their slot. This is distinct from — and should not be confused with — the live draft's fixed order.

### Live draft screen
- **On-clock panel**: current owner, pick number, round number, seal status badge, 5th-place-winner badge, jump-pick badge when applicable.
- **Pick panel**: two tabs — "Own player" (only enabled/shown as default when the current owner has unused protected players AND seal is still intact) and "Unprotected" (free-text player name entry + Draft button). Tab auto-defaults sensibly based on state. Contains contextual warning/info text (e.g. "this will break your seal" vs "jump pick, seal stays intact").
- **Protected players panel (left sidebar)**: shows the *current on-the-clock owner's* protected roster. Once an owner's seal breaks:
  - "Keep" buttons disappear entirely for that owner's remaining protected players (they are no longer keep-able, since anyone can now draft them).
  - Label changes from "protected" to "previous roster" with a "now available" indicator.
  - Remaining unkept players show a **"free"** status tag (in place of a Keep button) — **explicitly marked in code comments as a placeholder** to be replaced with live "available"/"drafted" status once real player data + a real draft pool exist (see Section 4, Sleeper API notes). Do not remove this TODO without wiring up real status tracking.
- **Owner seal status panel**: compact list of all 10 owners with a colored dot (green=intact, red=broken) and a star marking the 5th place winner (star disappears after their jump is used).
- **Draft board**: 10-column grid (owner × round), color-coded cells:
  - Amber = current pick
  - Green = kept own player
  - Blue = unprotected pick
  - Purple = 5th place jump pick
  - Grey/dimmed = skipped pick (the Round 18 balancing skip)
  - Fixed ~62px column width so all 10 owner columns fit without horizontal scroll on typical screens (explicit request — grid layout was chosen over an alternate "flowing list" layout Robin was offered and declined).
- **Global unprotected pick counter**: visible pill in the header, "X / 3" — tracks toward the 5th-place jump trigger (trigger is technically at count=2, jump pick itself is the "3rd", hence showing progress to 3).
- **Undo button**: steps back exactly one pick at a time via a history stack (deep-cloned state snapshots before each pick). Disabled when there's nothing to undo.
- **Reset — two-tier, explicitly requested by Robin after worrying about accidental data loss mid-draft:**
  - **Soft reset ("Return to setup")**: navigates back to the setup screen but **preserves the entire in-memory draft state**. A "Draft in progress — Resume draft" banner appears on the setup screen so it can be resumed exactly where it left off. This is the default/primary action in the reset modal.
  - **Hard reset ("Wipe everything & start over")**: a secondary, visually de-emphasized danger action within the same modal, requiring an **additional native `confirm()` step** on top of the modal itself (two confirmations total) before it wipes all state, owner names, and protected player entries back to defaults.
- **Right-hand research sidebar** (most recently added feature, collapsible via a "Research ▸/◂" toggle button in the header):
  - **"Who are you?" modal**: appears automatically whenever the draft screen is entered/resumed (there's no login system — this is an honest, low-tech stand-in for identity, explicitly acknowledged as a stopgap). The selected identity defaults the Team Roster panel to that owner's own team.
  - **Team Roster panel**: dropdown to freely switch and view **any** of the 10 owners' rosters (not just the one on the clock) — for research purposes during other people's picks. Shows the same seal-aware status logic as the main protected-players sidebar (protected/kept/free), independently of whose turn it currently is.
  - **Free Agents panel**: currently a **non-functional placeholder** with an explanatory message ("Player list not connected") and an inline TODO comment describing exactly what to build: a searchable list of available players sourced from Sleeper, each with a live status badge, and — importantly — **the ability to draft directly from this panel** (should call into the same pick-making logic as the main "Unprotected" tab, not a separate code path).
  - Both right-sidebar panels are individually collapsible (accordion-style headers with a rotating chevron).

### Explicit bug fixes already applied (do not regress these)
- Tab-switching in the pick panel used to get stuck on the first pick — fixed by properly re-deriving the default active tab (`own` vs `unprot`) every render based on current seal/protected state, rather than relying on stale UI state.
- Draft order used to randomize automatically on clicking "Start Draft" — removed; order is now whatever is manually entered/arranged in the Draft Order tab.
- Position selection was removed from protected-player setup entry (was premature/unnecessary before real player data exists).
- "Own player" tab now explicitly disables when `seal is broken`, not just when there are zero unused protected players — early logic only checked player count, which could incorrectly still allow keeping after a seal break in some states.

---

## 6. Explicit product/UX preferences Robin has stated (apply these going forward)

- Prefers **thorough requirements/edge-case discussion before implementation** — Robin's style is Q&A-heavy up front, then iterative build → review → fix cycles. Don't over-build ahead of confirmed requirements (the trade feature is the current example of "don't guess, ask first").
- Wants **destructive actions protected** (see the two-tier reset). Apply this same caution to any future destructive action (e.g. removing a trade, deleting a player entry mid-draft).
- Wants **manual entry fallback** preserved even after real player data is wired in — Robin specifically flagged that in past drafts, players who should have been on a list sometimes weren't, so any future Sleeper-backed search UI must include an escape hatch to type in a player manually.
- Is fine with **placeholder/non-functional UI being shown early** (e.g. the Free Agents panel) as long as it's clearly labeled — Robin likes seeing the intended layout/shape of a feature before it's wired up.
- Cost-conscious about hosting but **not cost-averse** — low hosting costs (single-digit dollars/month) are explicitly fine.
- Values being able to **test the tool with realistic (if fake) data** before real integrations exist — hence the "fill with test data" feature and the desire to eventually make that pull real Sleeper names instead of generated ones.

---

## 7. Suggested immediate next steps for Claude Code

1. Set up a proper project structure (recommend: a lightweight web app — e.g. a simple Node/Express or similar backend + static frontend, or a framework of your choice — sized appropriately for a low-cost personal hosting target, per Robin's stated budget comfort).
2. Port the prototype's draft logic (Section 5) into the new structure, preserving all documented behavior exactly. This is a good opportunity to clean up the inline-style/single-file structure without changing behavior.
3. **Before building trades**, resume the open requirements questions in Section 3 directly with Robin.
4. Wire in the Sleeper API per Section 4 (player search for protected-player setup, upgraded test-data fill, eventual free-agent pool) — this was the last fully-agreed-upon next technical step before the trade discussion came up and the decision to hand off to Claude Code was made.
5. Defer Yahoo OAuth import unless Robin explicitly revives it.

---

## 8. Reference file

`intuti-draft-prototype.html` — open directly in any browser, no build step required. Use it to verify behavior against this spec, and as a UI/UX reference for visual style (dark theme, Georgia serif typeface, amber/green/blue/purple color coding for pick types) that Robin has approved through several rounds of iteration.
