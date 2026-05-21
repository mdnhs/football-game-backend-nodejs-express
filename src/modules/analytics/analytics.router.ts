import { Router } from "express";
import { adminJwtAuth, requirePermission } from "../../middleware/adminAuth";
import { getDashboard, getDistribution } from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.use(adminJwtAuth);

analyticsRouter.get("/dashboard", requirePermission("admin.dashboard.view"), getDashboard);
analyticsRouter.get("/distribution", requirePermission("admin.dashboard.view"), getDistribution);
