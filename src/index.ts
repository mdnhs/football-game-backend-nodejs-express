import { createApp } from './app';
import { env } from './config/env';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { bootstrapDefaultAdmin } from './modules/adminAuth/admin-auth.service';

async function main() {
  await redis.connect();
  logger.info('Redis connected');

  await bootstrapDefaultAdmin();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Docs: http://localhost:${env.PORT}/docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      redis.quit().finally(() => process.exit(0));
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
