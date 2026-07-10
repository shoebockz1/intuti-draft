import { Router } from "express";
import { queryPlayers } from "../sleeper/sleeperService";

// GET /api/players — full rank-sorted Sleeper player list (from cache,
//   fetching+caching from Sleeper first if the cache is empty/stale).
// GET /api/players?search=... — case-insensitive substring match on fullName.
// GET /api/players?position=RB — exact position filter (QB/RB/WR/TE/K/DEF).
// Both params are optional and combine — this backs both the quick search
// dropdown in setup and the dedicated Free Agents research page, which needs
// to browse an entire position sorted by prominence, not just search-to-find.

export const playersRouter = Router();

playersRouter.get("/", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const position = typeof req.query.position === "string" ? req.query.position : undefined;
    const players = await queryPlayers({ search, position });
    res.json({ players });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch/serve players:", err);
    res.status(502).json({ error: "Failed to fetch player data from Sleeper." });
  }
});
