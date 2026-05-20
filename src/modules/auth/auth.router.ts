import { Router } from "express";
import { verifyOtp } from "./auth.controller";
import { otpRateLimiter } from "../../middleware/rateLimiter";

export const authRouter = Router();

authRouter.post("/verify", otpRateLimiter, verifyOtp);
