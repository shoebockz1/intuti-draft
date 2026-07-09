import type { NextFunction, Request, Response } from "express";

/** Blocks the request with 403 unless the session was authenticated via POST /api/commissioner/login. */
export function requireCommissioner(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.isCommissioner) {
    res.status(403).json({ error: "Commissioner authentication required." });
    return;
  }
  next();
}
