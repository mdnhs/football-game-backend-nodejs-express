import { Router } from "express";
import { authMiddleware, requireFullAccount } from "../../middleware/auth";
import { scoreRateLimiter } from "../../middleware/rateLimiter";
import { submit } from "./score.controller";

export const scoreRouter = Router();

scoreRouter.post(
  "/",
  authMiddleware,
  requireFullAccount,
  scoreRateLimiter,
  submit,
);
