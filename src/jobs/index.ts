import { tokenCleanupJob } from './tokenCleanup.job';
import { logger } from '../utils/logger';

/**
 * Start all cron jobs
 */
export function startJobs(): void {
  logger.info('Starting background jobs...');
  tokenCleanupJob.start();
}

/**
 * Stop all cron jobs
 */
export function stopJobs(): void {
  logger.info('Stopping background jobs...');
  tokenCleanupJob.stop();
}

export { tokenCleanupJob };
