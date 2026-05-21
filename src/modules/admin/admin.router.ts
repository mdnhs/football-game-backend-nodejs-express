import { Router } from "express";
import { adminJwtAuth, requirePermission } from "../../middleware/adminAuth";
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

adminRouter.use(adminJwtAuth);

adminRouter.get("/players", requirePermission("admin.player.view_list"), listPlayers);
adminRouter.patch("/players/:id/block", requirePermission("admin.player.disable"), blockPlayer);
adminRouter.patch("/players/:id/unblock", requirePermission("admin.player.disable"), unblockPlayer);

adminRouter.get("/scores/flagged", requirePermission("admin.score.view_list"), getFlaggedScores);
adminRouter.patch("/scores/:id/flag", requirePermission("admin.score.flag"), flagScore);

adminRouter.get("/winners", requirePermission("admin.winner.view_list"), getDailyWinners);
adminRouter.get("/winners/export", requirePermission("admin.winner.view_list"), exportWinners);

adminRouter.patch("/settings", requirePermission("admin.settings.edit"), updateSettings);
