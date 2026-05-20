import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  getPlayer,
  getPlayerDifficulty,
  getDailyPlaysRemaining,
} from "./player.service";
import { ok, fail } from "../../utils/response";

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.playerId) return fail(res, "Unauthorized", 401);
    const player = await getPlayer(req.playerId);
    ok(res, player);
  } catch (err) {
    next(err);
  }
}

export async function getDifficulty(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.playerId) return fail(res, "Unauthorized", 401);
    const level = await getPlayerDifficulty(req.playerId);
    ok(res, { level });
  } catch (err) {
    next(err);
  }
}

export async function getPlaysRemaining(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.playerId) return fail(res, "Unauthorized", 401);
    const remaining = await getDailyPlaysRemaining(req.playerId);
    ok(res, { remaining });
  } catch (err) {
    next(err);
  }
}
