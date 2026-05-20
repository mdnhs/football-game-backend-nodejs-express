import { Request, Response, NextFunction } from "express";
import {
  getDashboardStats,
  getScoreDistribution,
} from "./analytics.service";
import { ok } from "../../utils/response";

export async function getDashboard(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await getDashboardStats();
    ok(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function getDistribution(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const buckets = await getScoreDistribution();
    ok(res, buckets);
  } catch (err) {
    next(err);
  }
}
