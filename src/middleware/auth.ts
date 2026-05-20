import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type {
  JwtPayload,
  PendingJwtPayload,
} from "../modules/auth/auth.service";

function isPending(p: JwtPayload): p is PendingJwtPayload {
  return (p as PendingJwtPayload).pending === true;
}

export interface AuthRequest extends Request {
  playerId?: string;
  phone?: string;
  firebaseUid?: string;
  pending?: boolean;
  qrRef?: string;
  jwtPayload?: JwtPayload;
}

function decodeToken(req: AuthRequest, res: Response): JwtPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return null;
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as JwtPayload;
    return payload;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const payload = decodeToken(req, res);
  if (!payload) return;

  req.jwtPayload = payload;

  if (isPending(payload)) {
    req.firebaseUid = payload.firebaseUid;
    req.phone = payload.phone;
    req.pending = true;
    req.qrRef = payload.qrRef;
  } else {
    req.playerId = payload.playerId;
    req.phone = payload.phone;
    req.pending = false;
  }

  next();
}

export function requireFullAccount(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.pending || !req.playerId) {
    res
      .status(403)
      .json({ error: "Profile incomplete. Call /api/auth/complete-profile." });
    return;
  }
  next();
}
