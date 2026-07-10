import { Router } from "express";
import { isPersistenceEnabled } from "../persistence/draftPersistence";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "intuti-server",
    timestamp: new Date().toISOString(),
    persistenceEnabled: isPersistenceEnabled(),
  });
});
