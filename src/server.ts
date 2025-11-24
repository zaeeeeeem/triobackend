import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/database';
import redis from './config/redis';
import { startJobs, stopJobs } from './jobs';
import process from 'process';

const PORT = env.PORT;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, closing server gracefully...`);

  try {
    // Stop background jobs
    stopJobs();

    // Close database connection
    await prisma.$disconnect();
    logger.info('Database connection closed');

    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║   TRIO SHOPIFY SERVER                         ║
║   Environment: ${env.NODE_ENV.padEnd(31)}║
║   Port: ${String(PORT).padEnd(37)} ║
║   API Version: ${env.API_VERSION.padEnd(30)} ║
╚═══════════════════════════════════════════════╝
  `);

  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✓ Database connected successfully');

    // Test Redis connection
    await redis.ping();
    logger.info('✓ Redis connected successfully');

    // Start background jobs
    startJobs();

    logger.info(`✓ Server is ready and listening on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default server;
