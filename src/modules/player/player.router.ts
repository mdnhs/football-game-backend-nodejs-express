import { Router } from "express";
import { authMiddleware, requireFullAccount } from "../../middleware/auth";
import { getMe, getDifficulty, getPlaysRemaining } from "./player.controller";

export const playerRouter = Router();

playerRouter.use(authMiddleware, requireFullAccount);

playerRouter.get("/me", getMe);
playerRouter.get("/me/difficulty", getDifficulty);
playerRouter.get("/me/plays-remaining", getPlaysRemaining);
