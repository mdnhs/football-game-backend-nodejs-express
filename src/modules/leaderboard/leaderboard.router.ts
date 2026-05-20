import { Router } from "express";
import { authMiddleware, requireFullAccount } from "../../middleware/auth";
import {
  getDaily,
  getCampaign,
  getMyRank,
} from "./leaderboard.controller";

export const leaderboardRouter = Router();

leaderboardRouter.use(authMiddleware, requireFullAccount);

leaderboardRouter.get("/daily", getDaily);
leaderboardRouter.get("/campaign", getCampaign);
leaderboardRouter.get("/my-rank", getMyRank);
