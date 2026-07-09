import { Router } from "express";
import { getPlayers, searchPlayers } from "../sleeper/sleeperService";

// GET /api/players — full filtered/tagged Sleeper player list (from cache,
//   fetching+caching from Sleeper first if the cache is empty/stale).
// GET /api/players?search=... — case-insensitive substring match on fullName,
//   so the client can do a live search box without downloading the whole list.
//
// See HANDOFF.md Section 4 for the agreed plan. Not yet built: /api/players/pool
// (the eventual free-agent draft pool with live available/drafted status) — that
// is explicitly future scope, see TODO comments in ProtectedPanel.tsx / ResearchSidebar.tsx.

export const playersRouter = Router();

playersRouter.get("/", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const players = search ? await searchPlayers(search) : await getPlayers();
    res.json({ players });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch/serve players:", err);
    res.status(502).json({ error: "Failed to fetch player data from Sleeper." });
  }
});
