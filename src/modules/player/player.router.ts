import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { getMe, getDifficulty, getPlaysRemaining } from "./player.controller";

export const playerRouter = Router();

playerRouter.use(authMiddleware);

playerRouter.get("/me", getMe);
playerRouter.get("/me/difficulty", getDifficulty);
playerRouter.get("/me/plays-remaining", getPlaysRemaining);
