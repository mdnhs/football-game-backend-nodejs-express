import { Request, Response, NextFunction } from "express";
import {
  checkPhoneSchema,
  verifyOtpSchema,
  completeProfileSchema,
} from "./auth.schema";
import {
  checkPhone,
  verifyOtp,
  completeProfile,
  BlockedAccountError,
} from "./auth.service";
import { ok, fail } from "../../utils/response";
import type { AuthRequest } from "../../middleware/auth";

export async function checkPhoneHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = checkPhoneSchema.parse(req.body);
    const result = await checkPhone(input);
    ok(res, result);
  } catch (err) {
    if (err instanceof BlockedAccountError) {
      fail(res, err.message, 403);
      return;
    }
    next(err);
  }
}

export async function verifyOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = verifyOtpSchema.parse(req.body);
    const result = await verifyOtp(input);
    ok(res, result, 200);
  } catch (err) {
    if (err instanceof BlockedAccountError) {
      fail(res, err.message, 403);
      return;
    }
    next(err);
  }
}

export async function completeProfileHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.jwtPayload) return fail(res, "Unauthorized", 401);
    const input = completeProfileSchema.parse(req.body);
    const result = await completeProfile(req.jwtPayload, input);
    ok(res, result, 201);
  } catch (err) {
    if (err instanceof BlockedAccountError) {
      fail(res, err.message, 403);
      return;
    }
    next(err);
  }
}
