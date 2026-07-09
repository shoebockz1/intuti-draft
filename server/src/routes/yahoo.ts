import crypto from "node:crypto";
import { Router } from "express";
import { config, requireYahooConfig } from "../config";
import { buildAuthorizeUrl, exchangeCodeForTokens, ensureFreshToken } from "../yahoo/oauth";
import { getLeagueRostersForSeason } from "../yahoo/api";

export const yahooRouter = Router();

yahooRouter.get("/login", (req, res) => {
  try {
    requireYahooConfig();
  } catch (err) {
    res.status(500).send((err as Error).message);
    return;
  }
  const state = crypto.randomBytes(16).toString("hex");
  req.session.yahooOauthState = state;
  res.redirect(buildAuthorizeUrl(state));
});

yahooRouter.get("/callback", async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;
  if (typeof error === "string") {
    res.status(400).send(`Yahoo login failed: ${error} — ${errorDescription ?? "no details given"}`);
    return;
  }
  if (typeof code !== "string" || typeof state !== "string" || state !== req.session.yahooOauthState) {
    res.status(400).send("Yahoo login failed: invalid or expired state. Please try connecting again.");
    return;
  }
  req.session.yahooOauthState = undefined;

  try {
    const tokens = await exchangeCodeForTokens(code);
    req.session.yahooTokens = tokens;
    res.redirect(`${config.clientOrigin}/?yahoo=connected`);
  } catch (err) {
    res.status(500).send(`Yahoo login failed: ${(err as Error).message}`);
  }
});

yahooRouter.get("/status", (req, res) => {
  res.json({ connected: Boolean(req.session.yahooTokens) });
});

yahooRouter.post("/logout", (req, res) => {
  req.session.yahooTokens = undefined;
  res.json({ connected: false });
});

/**
 * Pulls every team's 2025-season roster for the configured league.
 * This is the endpoint the setup screen's future "Import from Yahoo" button
 * will call to populate team names + protected players.
 */
yahooRouter.get("/rosters", async (req, res) => {
  const tokens = req.session.yahooTokens;
  if (!tokens) {
    res.status(401).json({ error: "Not connected to Yahoo. Call /api/yahoo/login first." });
    return;
  }

  const season = typeof req.query.season === "string" ? req.query.season : "2025";

  try {
    const fresh = await ensureFreshToken(tokens);
    if (fresh !== tokens) req.session.yahooTokens = fresh;

    const rosters = await getLeagueRostersForSeason(config.yahoo.leagueId, season, fresh.accessToken);
    res.json({ season, rosters });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});
