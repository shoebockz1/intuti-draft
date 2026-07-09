import "express-session";
import type { YahooTokenSet } from "../yahoo/oauth";

declare module "express-session" {
  interface SessionData {
    yahooTokens?: YahooTokenSet;
    yahooOauthState?: string;
    /** Set true by POST /api/commissioner/login on a correct passcode. Gates setup + destructive draft routes. */
    isCommissioner?: boolean;
  }
}
