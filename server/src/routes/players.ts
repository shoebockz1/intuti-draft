import { Router } from "express";

// Placeholder route structure for future Sleeper API proxying.
// Not implemented yet — see HANDOFF.md Section 4 for the agreed plan:
//   - GET /api/players/search?q=... -> proxy Sleeper player search for protected-player
//     entry (with manual free-text fallback always preserved).
//   - GET /api/players/random?count=... -> upgrade "fill with test data" to pull real
//     Sleeper names instead of the generated fake ones.
//   - GET /api/players/pool -> the eventual free-agent draft pool with available/drafted
//     status, filtered to players active on an NFL roster at any point in the 2025 season
//     (including injured/IR) plus incoming 2026 rookies, excluding long-retired players.
// No Sleeper integration yet — this file exists only so the route is wired up and ready.

export const playersRouter = Router();

playersRouter.get("/", (_req, res) => {
  res.json({
    message: "Player routes not implemented yet — Sleeper API integration is a future step.",
  });
});
