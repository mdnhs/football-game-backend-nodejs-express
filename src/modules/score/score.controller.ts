import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { submitScoreSchema } from "./score.schema";
import { submitScore, DailyLimitError } from "./score.service";
import { ok, fail } from "../../utils/response";

export async function submit(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.playerId) return fail(res, "Unauthorized", 401);
    const input = submitScoreSchema.parse(req.body);
    const result = await submitScore(req.playerId, input);
    ok(res, result, 201);
  } catch (err) {
    if (err instanceof DailyLimitError) {
      fail(res, err.message, 400);
      return;
    }
    next(err);
  }
}
