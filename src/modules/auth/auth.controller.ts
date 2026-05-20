import { Request, Response, NextFunction } from "express";
import { verifyOtpSchema } from "./auth.schema";
import { verifyFirebaseToken, BlockedAccountError } from "./auth.service";
import { ok, fail } from "../../utils/response";

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = verifyOtpSchema.parse(req.body);
    const result = await verifyFirebaseToken(input);
    ok(res, result, 201);
  } catch (err) {
    if (err instanceof BlockedAccountError) {
      fail(res, err.message, 403);
      return;
    }
    next(err);
  }
}
