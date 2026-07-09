import fs from "node:fs";
import path from "node:path";
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

const app = express();

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
