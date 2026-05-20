import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { generalRateLimiter } from "./middleware/rateLimiter";
import { authRouter } from "./modules/auth/auth.router";
import { playerRouter } from "./modules/player/player.router";
import { scoreRouter } from "./modules/score/score.router";
import { leaderboardRouter } from "./modules/leaderboard/leaderboard.router";
import { adminRouter } from "./modules/admin/admin.router";
import { analyticsRouter } from "./modules/analytics/analytics.router";
import { qrAdminRouter, qrPublicRouter } from "./modules/qr/qr.router";
import { adminAuthRouter } from "./modules/adminAuth/admin-auth.router";
import { openapiSpec } from "./docs/openapi";

export function createApp() {
  const app = express();

  app.use(
    "/docs",
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: "Football Game API Docs",
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  app.get("/openapi.json", (_req, res) => {
    res.json(openapiSpec);
  });

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
    }),
  );

  app.use(express.json({ limit: "50kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/qr", qrPublicRouter);

  app.use("/api/v1", generalRateLimiter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin/auth", adminAuthRouter);
  app.use("/api/v1/players", playerRouter);
  app.use("/api/v1/scores", scoreRouter);
  app.use("/api/v1/leaderboard", leaderboardRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/admin/qr-codes", qrAdminRouter);
  app.use("/api/v1/analytics", analyticsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: true, message: "Route not found", data: null, status: 404 });
  });

  app.use(errorHandler);

  return app;
}
