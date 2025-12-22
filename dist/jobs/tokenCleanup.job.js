"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenCleanupJob = exports.TokenCleanupJob = void 0;
const cron = __importStar(require("node-cron"));
const database_1 = __importDefault(require("../config/database"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
/**
 * Token Cleanup Job
 * Deletes expired refresh tokens from the database
 * Runs on a configurable schedule (default: daily at 2 AM)
 */
class TokenCleanupJob {
    task = null;
    start() {
        if (!env_1.env.ENABLE_TOKEN_CLEANUP_JOB) {
            logger_1.logger.info('Token cleanup job is disabled');
            return;
        }
        const schedule = env_1.env.TOKEN_CLEANUP_CRON_SCHEDULE;
        logger_1.logger.info(`Starting token cleanup job with schedule: ${schedule}`);
        this.task = cron.schedule(schedule, async () => {
            await this.cleanup();
        });
        logger_1.logger.info('Token cleanup job started successfully');
    }
    stop() {
        if (this.task) {
            this.task.stop();
            logger_1.logger.info('Token cleanup job stopped');
        }
    }
    /**
     * Cleanup method - can be called manually for testing
     */
    async cleanup() {
        try {
            const now = new Date();
            logger_1.logger.info('Running token cleanup job...');
            const result = await database_1.default.refreshToken.deleteMany({
                where: {
                    expiresAt: { lt: now },
                },
            });
            logger_1.logger.info(`Token cleanup completed: ${result.count} expired tokens deleted`);
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Error during token cleanup:', error);
            return 0;
        }
    }
}
exports.TokenCleanupJob = TokenCleanupJob;
exports.tokenCleanupJob = new TokenCleanupJob();
//# sourceMappingURL=tokenCleanup.job.js.map