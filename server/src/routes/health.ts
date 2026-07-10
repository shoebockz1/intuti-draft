import { Router } from "express";
import { isPersistenceEnabled } from "../persistence/draftPersistence";
import { APP_VERSION_LABEL, APP_VERSION_SHA } from "../version";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "intuti-server",
    timestamp: new Date().toISOString(),
    persistenceEnabled: isPersistenceEnabled(),
    version: APP_VERSION_LABEL,
    commit: APP_VERSION_SHA,
  });
});
