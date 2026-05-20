import { Router } from "express";
import { adminAuthMiddleware } from "../../middleware/adminAuth";
import { getDashboard, getDistribution } from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.use(adminAuthMiddleware);

analyticsRouter.get("/dashboard", getDashboard);
analyticsRouter.get("/distribution", getDistribution);
