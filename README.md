# Intuti — Fantasy Draft Tool

A purpose-built draft tool for the "Intuti" 10-owner keeper league, replacing
ClickyDraft. See `HANDOFF.md` for the full domain spec (seal mechanic, 5th
place jump rule, etc.) — that document remains the source of truth for
behavior. `intuti-draft-prototype.html` is the original single-file
prototype this project replaces; it's kept for reference only.

## Project structure

```
client/   React + TypeScript + Vite frontend (all draft UI + engine)
server/   Node + Express + TypeScript backend (health check + placeholder
          routes for future Sleeper API proxying — no integration yet)
```

Draft state currently lives entirely in the browser (React context, in
memory, no persistence) — matching the prototype. The server does not talk
to the client for anything draft-related yet.

### Client internals

- `client/src/engine/` — framework-agnostic draft engine (pure functions +
  a `(state, action) => state` reducer). This is the highest-value, most
  carefully-ported part — see `draftEngine.ts` for `buildSnake`,
  `draftUnprotected`, `keepOwn`, `insertFifthJump`, `markFinalRoundSkip`,
  and `undo`.
- `client/src/context/AppContext.tsx` — top-level app state (setup data,
  screen navigation, the draft reducer, toast, modals).
- `client/src/components/setup/` — Setup screen (Draft Order / Protected
  Players / Order Randomizer tabs).
- `client/src/components/draft/` — Live draft screen (on-clock panel, pick
  panel, protected panel, status panel, board, research sidebar).
- `client/src/components/modals/` — Who-Am-I identity modal, two-tier reset
  modal.
- `client/src/styles/` — global CSS (theme variables + per-area stylesheets),
  ported from the prototype's `<style>` block.

## Running locally

Requires Node 18+ (developed/tested on Node 24).

### First-time setup

```bash
npm run install:all
```

(equivalent to running `npm install` in both `client/` and `server/`)

### Run both client and server together

From the repo root:

```bash
npm run dev
```

This runs the Vite dev server (client, default `http://localhost:5173`) and
the Express dev server (server, `http://localhost:4000`) concurrently.

### Run them separately

```bash
npm run dev:client   # client only, http://localhost:5173
npm run dev:server   # server only, http://localhost:4000
```

Or `cd client && npm run dev` / `cd server && npm run dev` directly.

### Build for production

```bash
npm run build
```

Builds the client (`client/dist/`, static assets ready to deploy) and
compiles the server (`server/dist/`). Run the compiled server with
`npm start --prefix server` (or `cd server && npm start`).

### Type-checking only

```bash
npm run typecheck
```

## Deployment notes

Sized for cheap hosting (e.g. Render's free/hobby tier, ~$0–5/month):

- `client/` builds to static files — deploy as a static site.
- `server/` is a small Express app — deploy as a Node web service. It
  currently only exposes `GET /api/health` and a placeholder
  `GET /api/players` route; no database, no required environment
  variables yet.

## What's not built yet (by design)

- **Sleeper API integration** — protected-player search, real test-data
  names, and the free-agent pool are all still placeholders. See the TODO
  comments in `client/src/components/draft/ProtectedPanel.tsx`,
  `client/src/components/draft/ResearchSidebar.tsx`, and
  `server/src/routes/players.ts`.
- **Trades** — deliberately out of scope; still being designed with the
  league commissioner (see `HANDOFF.md` Section 3).
- **Yahoo OAuth roster import** — deferred; see `HANDOFF.md` Section 4.
- **Backend persistence** — draft state is in-memory in the browser only;
  refreshing the page loses state (matches the prototype's behavior).
