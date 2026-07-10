import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy server/.env.example to server/.env and fill it in.`,
    );
  }
  return value;
}

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-insecure-secret",
  // Shared passcode gating the commissioner-only setup screens (Draft Order,
  // Protected Players, Order Randomizer tabs, Start Draft, Undo, Reset). This
  // is a trusted-friend-group tool — a single shared secret, not per-user
  // accounts. Left empty by default so an unconfigured server can never be
  // logged into (see routes/commissioner.ts, which rejects login attempts
  // when this is empty rather than treating "" === "" as a match).
  commissionerPasscode: process.env.COMMISSIONER_PASSCODE ?? "",
  yahoo: {
    clientId: process.env.YAHOO_CLIENT_ID ?? "",
    clientSecret: process.env.YAHOO_CLIENT_SECRET ?? "",
    redirectUri: process.env.YAHOO_REDIRECT_URI ?? "https://localhost:4000/api/yahoo/callback",
    leagueId: process.env.YAHOO_LEAGUE_ID ?? "101893",
  },
  // Optional — if either is unset, the server just runs without persistence
  // (in-memory only, same as before). See persistence/draftPersistence.ts.
  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  },
};

/** Call this before touching any Yahoo route so we fail with a clear message, not a cryptic 401 from Yahoo. */
export function requireYahooConfig(): void {
  required("YAHOO_CLIENT_ID");
  required("YAHOO_CLIENT_SECRET");
}
