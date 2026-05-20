import { Router } from "express";
import {
  checkPhoneHandler,
  verifyOtpHandler,
  completeProfileHandler,
} from "./auth.controller";
import { otpRateLimiter } from "../../middleware/rateLimiter";
import { authMiddleware } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/check-phone", checkPhoneHandler);
authRouter.post("/verify-otp", otpRateLimiter, verifyOtpHandler);
authRouter.post("/complete-profile", authMiddleware, completeProfileHandler);
