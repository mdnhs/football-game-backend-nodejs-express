"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auth_router_1 = require("./modules/auth/auth.router");
const player_router_1 = require("./modules/player/player.router");
const score_router_1 = require("./modules/score/score.router");
const leaderboard_router_1 = require("./modules/leaderboard/leaderboard.router");
const admin_router_1 = require("./modules/admin/admin.router");
const analytics_router_1 = require("./modules/analytics/analytics.router");
const qr_router_1 = require("./modules/qr/qr.router");
const admin_auth_router_1 = require("./modules/adminAuth/admin-auth.router");
const openapi_1 = require("./docs/openapi");
function createApp() {
    const app = (0, express_1.default)();
    app.use("/docs", (0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }), swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.openapiSpec, {
        customSiteTitle: "Football Game API Docs",
        swaggerOptions: { persistAuthorization: true },
    }));
    app.get("/openapi.json", (_req, res) => {
        res.json(openapi_1.openapiSpec);
    });
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: env_1.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE"],
    }));
    app.use(express_1.default.json({ limit: "50kb" }));
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.use("/api/v1/qr", qr_router_1.qrPublicRouter);
    app.use("/api/v1", rateLimiter_1.generalRateLimiter);
    app.use("/api/v1/auth", auth_router_1.authRouter);
    app.use("/api/v1/admin/auth", admin_auth_router_1.adminAuthRouter);
    app.use("/api/v1/players", player_router_1.playerRouter);
    app.use("/api/v1/scores", score_router_1.scoreRouter);
    app.use("/api/v1/leaderboard", leaderboard_router_1.leaderboardRouter);
    app.use("/api/v1/admin", admin_router_1.adminRouter);
    app.use("/api/v1/admin/qr-codes", qr_router_1.qrAdminRouter);
    app.use("/api/v1/analytics", analytics_router_1.analyticsRouter);
    app.use((_req, res) => {
        res.status(404).json({ error: true, message: "Route not found", data: null, status: 404 });
    });
    app.use(errorHandler_1.errorHandler);
    return app;
}
