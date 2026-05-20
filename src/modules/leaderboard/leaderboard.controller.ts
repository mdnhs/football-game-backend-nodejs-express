import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  getDailyLeaderboard,
  getCampaignLeaderboard,
  getPlayerRank,
} from "./leaderboard.service";
import { ok, fail } from "../../utils/response";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getDaily(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const date = (req.query.date as string) || today();
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const data = await getDailyLeaderboard(date, limit);
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getCampaign(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const limit = Math.min(500, Number(req.query.limit) || 100);
    const data = await getCampaignLeaderboard(limit);
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getMyRank(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.playerId) return fail(res, "Unauthorized", 401);
    const type = (req.query.type as "daily" | "campaign") || "campaign";
    const date = (req.query.date as string) || today();
    const result = await getPlayerRank(req.playerId, type, date);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}
