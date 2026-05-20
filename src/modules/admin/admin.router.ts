import { Router } from "express";
import { adminAuthMiddleware } from "../../middleware/adminAuth";
import {
  listPlayers,
  blockPlayer,
  unblockPlayer,
  flagScore,
  getDailyWinners,
  exportWinners,
  updateSettings,
  getFlaggedScores,
} from "./admin.controller";

export const adminRouter = Router();

adminRouter.use(adminAuthMiddleware);

adminRouter.get("/players", listPlayers);
adminRouter.patch("/players/:id/block", blockPlayer);
adminRouter.patch("/players/:id/unblock", unblockPlayer);
adminRouter.patch("/scores/:id/flag", flagScore);
adminRouter.get("/winners", getDailyWinners);
adminRouter.get("/winners/export", exportWinners);
adminRouter.get("/scores/flagged", getFlaggedScores);
adminRouter.patch("/settings", updateSettings);
