import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  listPlayers as svcListPlayers,
  blockPlayer as svcBlockPlayer,
  unblockPlayer as svcUnblockPlayer,
  flagScore as svcFlagScore,
  getDailyWinners as svcGetDailyWinners,
  exportWinnersCSV,
  updateCampaignSettings,
  getFlaggedScores as svcGetFlaggedScores,
} from "./admin.service";
import { parsePagination } from "../../utils/pagination";
import { ok, fail } from "../../utils/response";

const settingsSchema = z.object({
  campaignStart: z.string().optional(),
  campaignEnd: z.string().optional(),
  dailyPlayLimit: z.number().int().min(1).max(100).optional(),
  difficultyBase: z.number().min(0).max(1).optional(),
});

export async function listPlayers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = parsePagination(req);
    const result = await svcListPlayers(page, limit);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function blockPlayer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await svcBlockPlayer(String(req.params.id));
    ok(res, { blocked: true });
  } catch (err) {
    next(err);
  }
}

export async function unblockPlayer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await svcUnblockPlayer(String(req.params.id));
    ok(res, { blocked: false });
  } catch (err) {
    next(err);
  }
}

export async function flagScore(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await svcFlagScore(String(req.params.id));
    ok(res, { flagged: true });
  } catch (err) {
    next(err);
  }
}

export async function getDailyWinners(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const date =
      (req.query.date as string) || new Date().toISOString().split("T")[0];
    const data = await svcGetDailyWinners(date);
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

export async function exportWinners(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const date =
      (req.query.date as string) || new Date().toISOString().split("T")[0];
    const csv = await exportWinnersCSV(date);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="winners-${date}.csv"`,
    );
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = settingsSchema.parse(req.body);
    await updateCampaignSettings(input);
    ok(res, { updated: true });
  } catch (err) {
    next(err);
  }
}

export async function getFlaggedScores(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = parsePagination(req);
    const result = await svcGetFlaggedScores(page, limit);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}
