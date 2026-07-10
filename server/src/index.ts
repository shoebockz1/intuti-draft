import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import express from "express";
import cors from "cors";
import session from "express-session";
import { config } from "./config";
import { healthRouter } from "./routes/health";
import { playersRouter } from "./routes/players";
import { yahooRouter } from "./routes/yahoo";
import { commissionerRouter } from "./routes/commissioner";
import { draftRouter } from "./routes/draft";
import { hydrateFromPersistence } from "./draft/store";

// In production (Render) the client and server are one deployed service —
// this same process serves the built React app's static files alongside the
// API, so there's no cross-origin request at all and TLS is terminated at
// Render's edge (this process only ever speaks plain HTTP internally). In
// local dev, the client runs separately under Vite for hot-reload, and this
// process still terminates HTTPS itself via mkcert (see below).
const isProduction = process.env.NODE_ENV === "production";

const app = express();

// Render sits in front of this process as a reverse proxy — without this,
// Express can't tell the original request was HTTPS (it sees plain HTTP
// internally), which breaks secure-cookie handling.
if (isProduction) app.set("trust proxy", 1);

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // we always serve over https, even locally (see certs/ + mkcert)
      httpOnly: true,
      // The client (http://localhost:5173) and server (https://localhost:4000)
      // differ in scheme, which browsers' "schemeful same-site" rules treat as
      // cross-site even though it's the same host. SameSite=Lax then silently
      // drops the cookie on plain fetch()/XHR POSTs (it only allows it on
      // top-level navigations, which is why the Yahoo OAuth redirect flow
      // never hit this but commissioner login + draft actions did). "None"
      // requires Secure, which we already set.
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 1 day — plenty for a once-a-year import session
    },
  }),
);

app.use("/api/health", healthRouter);
app.use("/api/players", playersRouter);
app.use("/api/yahoo", yahooRouter);
app.use("/api/commissioner", commissionerRouter);
app.use("/api/draft", draftRouter);

// Hydrate any persisted draft state from Redis before accepting requests —
// otherwise a request could race the load and see a false "no draft"
// briefly after every restart. See draft/store.ts and persistence/draftPersistence.ts.
async function start(): Promise<void> {
  await hydrateFromPersistence();

  if (isProduction) {
    // Compiled to server/dist/index.js at runtime, so ../../client/dist
    // resolves to <repo root>/client/dist — the Vite build output.
    const clientDist = path.join(__dirname, "..", "..", "client", "dist");
    app.use(express.static(clientDist));
    // SPA fallback: any non-API GET (e.g. "/" or "/admin", or a hard refresh
    // on either) serves index.html and lets the client-side router take over.
    // Must come after the API routers above so /api/* 404s normally instead
    // of getting swallowed here.
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });

    http.createServer(app).listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Intuti server listening on port ${config.port} (production, TLS terminated upstream)`);
    });
  } else {
    const certDir = path.join(__dirname, "..", "certs");
    const keyPath = path.join(certDir, "localhost+2-key.pem");
    const certPath = path.join(certDir, "localhost+2.pem");

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      // eslint-disable-next-line no-console
      console.error(
        `Missing local HTTPS certificate. Expected files at:\n  ${keyPath}\n  ${certPath}\n` +
          `Generate them with: mkcert localhost 127.0.0.1 ::1 (run from server/certs/)`,
      );
      process.exit(1);
    }

    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    https.createServer(httpsOptions, app).listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Intuti server listening on https://localhost:${config.port}`);
    });
  }
}

void start();
