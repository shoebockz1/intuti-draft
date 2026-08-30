// A session store backed by the same Upstash Redis instance the draft state
// uses, so the commissioner's login survives a restart.
//
// Why this exists: express-session defaults to MemoryStore, which is
// per-process and gone on restart. Render's free tier spins down when idle and
// restarts on redeploy, so the commissioner was being silently logged out
// mid-draft — and Undo, Reset and snapshot restore are all commissioner-gated,
// which means the recovery tools disappeared at exactly the moment something
// had gone wrong enough to need them. QA hit this for real during the v47
// rehearsal: `/api/commissioner/status` flipped to false part-way through and
// blocked several checks. MemoryStore is also documented as leaking memory and
// not for production use.
//
// Built on @upstash/redis (already a dependency for draft persistence) rather
// than connect-redis + ioredis, because the credentials we have are Upstash's
// REST ones and a second Redis client for one small job isn't worth it.

import { Redis } from "@upstash/redis";
import session from "express-session";
import type { SessionData, Store } from "express-session";
import { config, isProduction } from "../config";

// Namespaced by environment for the same reason the draft state key is: local
// dev and production have shared one free-tier Upstash database before, and a
// dev session overwriting a production one would be its own small disaster.
const KEY_PREFIX = isProduction ? "intuti:session:" : "intuti:session:dev:";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // mirrors the cookie's 1-day maxAge

function ttlFor(sess: SessionData): number {
  const maxAge = sess.cookie?.maxAge;
  if (typeof maxAge === "number" && maxAge > 0) return Math.ceil(maxAge / 1000);
  return DEFAULT_TTL_SECONDS;
}

class UpstashSessionStore extends session.Store {
  constructor(private readonly client: Redis) {
    super();
  }

  private key(sid: string): string {
    return `${KEY_PREFIX}${sid}`;
  }

  // Every callback below reports success even when Redis fails, deliberately.
  // A store error would otherwise surface as a 500 on an ordinary request; the
  // worst honest outcome of an unreachable session store is "you appear logged
  // out", which is exactly what happened before this existed. Degrade to that
  // rather than breaking the request.
  get(sid: string, callback: (err: unknown, session?: SessionData | null) => void): void {
    this.client
      .get<string | SessionData>(this.key(sid))
      .then((raw) => {
        if (!raw) return callback(null, null);
        // @upstash/redis auto-parses JSON-looking strings in some SDK versions
        // and not others — handle both, same as draftPersistence does.
        const parsed = typeof raw === "string" ? (JSON.parse(raw) as SessionData) : raw;
        callback(null, parsed);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[session] Failed to read session from Redis:", err);
        callback(null, null);
      });
  }

  set(sid: string, sess: SessionData, callback?: (err?: unknown) => void): void {
    this.client
      .set(this.key(sid), JSON.stringify(sess), { ex: ttlFor(sess) })
      .then(() => callback?.())
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[session] Failed to write session to Redis:", err);
        callback?.();
      });
  }

  destroy(sid: string, callback?: (err?: unknown) => void): void {
    this.client
      .del(this.key(sid))
      .then(() => callback?.())
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[session] Failed to delete session from Redis:", err);
        callback?.();
      });
  }

  // Keeps an active session from expiring mid-draft. Without touch(), the TTL
  // would count down from login regardless of activity.
  touch(sid: string, sess: SessionData, callback?: () => void): void {
    this.client
      .expire(this.key(sid), ttlFor(sess))
      .then(() => callback?.())
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[session] Failed to refresh session TTL in Redis:", err);
        callback?.();
      });
  }
}

/**
 * Returns a Redis-backed session store, or `undefined` when Upstash isn't
 * configured — in which case express-session falls back to MemoryStore and
 * behaviour is exactly as it was before. Local dev without an Upstash account
 * keeps working, it just doesn't survive restarts.
 */
export function createSessionStore(): Store | undefined {
  if (!config.upstash.url || !config.upstash.token) {
    // eslint-disable-next-line no-console
    console.warn(
      "[session] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory sessions. " +
        "The commissioner will be logged out on every restart.",
    );
    return undefined;
  }
  return new UpstashSessionStore(new Redis({ url: config.upstash.url, token: config.upstash.token }));
}
