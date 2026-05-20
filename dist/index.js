"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const redis_1 = require("./config/redis");
const logger_1 = require("./utils/logger");
async function main() {
    await redis_1.redis.connect();
    logger_1.logger.info("Redis connected");
    const app = (0, app_1.createApp)();
    const server = app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
        logger_1.logger.info(`Docs: http://localhost:${env_1.env.PORT}/docs`);
    });
    const shutdown = async (signal) => {
        logger_1.logger.info(`${signal} received, shutting down`);
        server.close(() => {
            redis_1.redis.quit().finally(() => process.exit(0));
        });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
main().catch((err) => {
    logger_1.logger.error("Failed to start server:", err);
    process.exit(1);
});
