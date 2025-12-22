"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const database_1 = __importDefault(require("./config/database"));
const redis_1 = __importDefault(require("./config/redis"));
const jobs_1 = require("./jobs");
const process_1 = __importDefault(require("process"));
const PORT = env_1.env.PORT;
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}, closing server gracefully...`);
    try {
        // Stop background jobs
        (0, jobs_1.stopJobs)();
        // Close database connection
        await database_1.default.$disconnect();
        logger_1.logger.info('Database connection closed');
        // Close Redis connection
        await redis_1.default.quit();
        logger_1.logger.info('Redis connection closed');
        process_1.default.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown:', error);
        process_1.default.exit(1);
    }
};
// Start server
const server = app_1.default.listen(PORT, async () => {
    logger_1.logger.info(`
╔═══════════════════════════════════════════════╗
║   TRIO SHOPIFY SERVER                         ║
║   Environment: ${env_1.env.NODE_ENV.padEnd(31)}║
║   Port: ${String(PORT).padEnd(37)} ║
║   API Version: ${env_1.env.API_VERSION.padEnd(30)} ║
╚═══════════════════════════════════════════════╝
  `);
    try {
        // Test database connection
        await database_1.default.$connect();
        logger_1.logger.info('✓ Database connected successfully');
        // Test Redis connection
        await redis_1.default.ping();
        logger_1.logger.info('✓ Redis connected successfully');
        // Start background jobs
        (0, jobs_1.startJobs)();
        logger_1.logger.info(`✓ Server is ready and listening on port ${PORT}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process_1.default.exit(1);
    }
});
// Handle shutdown signals
process_1.default.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process_1.default.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught errors
process_1.default.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});
process_1.default.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
exports.default = server;
//# sourceMappingURL=server.js.map