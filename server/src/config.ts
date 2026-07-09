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
  yahoo: {
    clientId: process.env.YAHOO_CLIENT_ID ?? "",
    clientSecret: process.env.YAHOO_CLIENT_SECRET ?? "",
    redirectUri: process.env.YAHOO_REDIRECT_URI ?? "https://localhost:4000/api/yahoo/callback",
    leagueId: process.env.YAHOO_LEAGUE_ID ?? "101893",
  },
};

/** Call this before touching any Yahoo route so we fail with a clear message, not a cryptic 401 from Yahoo. */
export function requireYahooConfig(): void {
  required("YAHOO_CLIENT_ID");
  required("YAHOO_CLIENT_SECRET");
}
