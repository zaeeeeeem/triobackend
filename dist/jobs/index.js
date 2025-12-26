"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenCleanupJob = void 0;
exports.startJobs = startJobs;
exports.stopJobs = stopJobs;
const tokenCleanup_job_1 = require("./tokenCleanup.job");
Object.defineProperty(exports, "tokenCleanupJob", { enumerable: true, get: function () { return tokenCleanup_job_1.tokenCleanupJob; } });
const logger_1 = require("../utils/logger");
/**
 * Start all cron jobs
 */
function startJobs() {
    logger_1.logger.info('Starting background jobs...');
    tokenCleanup_job_1.tokenCleanupJob.start();
}
/**
 * Stop all cron jobs
 */
function stopJobs() {
    logger_1.logger.info('Stopping background jobs...');
    tokenCleanup_job_1.tokenCleanupJob.stop();
}
//# sourceMappingURL=index.js.map