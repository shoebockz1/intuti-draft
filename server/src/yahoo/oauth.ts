import { config } from "../config";

const AUTHORIZE_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

export interface YahooTokenSet {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when accessToken expires. */
  expiresAt: number;
}

/** Read-only Fantasy Sports scope — we never write back to Yahoo. */
const SCOPE = "fspt-r";

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.yahoo.clientId,
    redirect_uri: config.yahoo.redirectUri,
    response_type: "code",
    scope: SCOPE,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function basicAuthHeader(): string {
  const raw = `${config.yahoo.clientId}:${config.yahoo.clientSecret}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

function toTokenSet(body: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}): YahooTokenSet {
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
}

export async function exchangeCodeForTokens(code: string): Promise<YahooTokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: config.yahoo.redirectUri,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo token exchange failed (${res.status}): ${text}`);
  }

  return toTokenSet(
    (await res.json()) as { access_token: string; refresh_token: string; expires_in: number },
  );
}

export async function refreshTokens(refreshToken: string): Promise<YahooTokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      redirect_uri: config.yahoo.redirectUri,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo token refresh failed (${res.status}): ${text}`);
  }

  return toTokenSet(
    (await res.json()) as { access_token: string; refresh_token: string; expires_in: number },
  );
}

/** Returns a token guaranteed to be valid for at least another 60s, refreshing if needed. */
export async function ensureFreshToken(tokens: YahooTokenSet): Promise<YahooTokenSet> {
  if (tokens.expiresAt - Date.now() > 60_000) return tokens;
  return refreshTokens(tokens.refreshToken);
}
