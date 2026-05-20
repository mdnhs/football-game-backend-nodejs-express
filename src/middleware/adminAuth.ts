import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const secret = req.headers["x-admin-secret"];

  if (secret !== env.ADMIN_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
