import { Router } from "express";
import { config } from "../config";

// POST /api/commissioner/login, GET /api/commissioner/status, POST /api/commissioner/logout.
// A single shared passcode gates the commissioner-only setup screens and the
// destructive draft actions (start, undo, hard reset) — see HANDOFF.md and
// routes/draft.ts. This is a trusted friend group: no per-user accounts.

export const commissionerRouter = Router();

commissionerRouter.post("/login", (req, res) => {
  const { passcode } = (req.body ?? {}) as { passcode?: unknown };

  // Reject everything (including a blank passcode) when the server has no
  // configured passcode, rather than letting "" === "" match by accident.
  if (!config.commissionerPasscode) {
    res.status(500).json({ error: "Commissioner passcode is not configured on the server." });
    return;
  }

  if (typeof passcode !== "string" || passcode !== config.commissionerPasscode) {
    res.status(401).json({ error: "Incorrect passcode." });
    return;
  }

  req.session.isCommissioner = true;
  res.json({ isCommissioner: true });
});

commissionerRouter.get("/status", (req, res) => {
  res.json({ isCommissioner: req.session.isCommissioner === true });
});

commissionerRouter.post("/logout", (req, res) => {
  req.session.isCommissioner = false;
  res.json({ isCommissioner: false });
});
