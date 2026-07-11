// Persists the server's authoritative draft state to Upstash Redis (a free-
// tier REST-based key-value store) so it survives process restarts and
// redeploys — Render's filesystem is ephemeral, so writing to local disk
// would not actually solve this; only external storage does. See
// BACKLOG.md's "Draft state persistence" item for the reasoning.
//
// Deliberately optional: if UPSTASH_REDIS_REST_URL/TOKEN aren't set (e.g.
// local dev without an Upstash account), the app runs exactly as it did
// before — in-memory only, no errors, just a one-time console note.

import { Redis } from "@upstash/redis";
import { config, isProduction } from "../config";
import type { DraftState } from "../draft/types";
import type { DraftSnapshot, TransactionLogEntry } from "../draft/store";

// Namespaced by environment on purpose: local dev's .env was set up with
// the same Upstash credentials as production (there's only one free-tier
// database), and a local test session silently overwrote a real live draft
// through this shared key as a result — confirmed via production's own
// snapshot history showing test-draft data. Keying dev traffic separately
// means that mistake is now structurally impossible even if dev and prod
// point at the same Redis instance again in the future. Production keeps
// the original key so existing persisted data there isn't orphaned.
const REDIS_KEY = isProduction ? "intuti:draft-state" : "intuti:draft-state:dev";

export interface PersistedPayload {
  draftState: DraftState | null;
  transactionLog: TransactionLogEntry[];
  snapshots: DraftSnapshot[];
}

const enabled = Boolean(config.upstash.url && config.upstash.token);

let client: Redis | null = null;
if (enabled) {
  client = new Redis({ url: config.upstash.url, token: config.upstash.token });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[persistence] UPSTASH_REDIS_REST_URL/TOKEN not set — running without persistence. " +
      "A server restart will lose any in-progress draft.",
  );
}

export function isPersistenceEnabled(): boolean {
  return enabled;
}

/** Fire-and-forget from callers' perspective — a Redis hiccup should never
 * block or fail an actual draft pick. Errors are logged, not thrown. */
export async function savePersistedState(payload: PersistedPayload): Promise<void> {
  if (!client) return;
  try {
    await client.set(REDIS_KEY, JSON.stringify(payload));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[persistence] Failed to save draft state to Redis:", err);
  }
}

/** Called once at server startup, before the server accepts requests — see index.ts. */
export async function loadPersistedState(): Promise<PersistedPayload | null> {
  if (!client) return null;
  try {
    const raw = await client.get<string | PersistedPayload>(REDIS_KEY);
    if (!raw) return null;
    // @upstash/redis auto-parses JSON-looking strings for us in some SDK
    // versions and not others — handle both a still-string and an
    // already-parsed-object result rather than assuming one.
    return typeof raw === "string" ? (JSON.parse(raw) as PersistedPayload) : raw;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[persistence] Failed to load draft state from Redis — starting fresh:", err);
    return null;
  }
}
