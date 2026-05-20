import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  playerId?: string;
  phone?: string;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      playerId: string;
      phone: string;
    };
    req.playerId = payload.playerId;
    req.phone = payload.phone;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
