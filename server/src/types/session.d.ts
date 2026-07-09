import "express-session";
import type { YahooTokenSet } from "../yahoo/oauth";

declare module "express-session" {
  interface SessionData {
    yahooTokens?: YahooTokenSet;
    yahooOauthState?: string;
  }
}
