import * as cron from 'node-cron';
import prisma from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Token Cleanup Job
 * Deletes expired refresh tokens from the database
 * Runs on a configurable schedule (default: daily at 2 AM)
 */
export class TokenCleanupJob {
  private task: cron.ScheduledTask | null = null;

  start(): void {
    if (!env.ENABLE_TOKEN_CLEANUP_JOB) {
      logger.info('Token cleanup job is disabled');
      return;
    }

    const schedule = env.TOKEN_CLEANUP_CRON_SCHEDULE;
    logger.info(`Starting token cleanup job with schedule: ${schedule}`);

    this.task = cron.schedule(schedule, async () => {
      await this.cleanup();
    });

    logger.info('Token cleanup job started successfully');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      logger.info('Token cleanup job stopped');
    }
  }

  /**
   * Cleanup method - can be called manually for testing
   */
  async cleanup(): Promise<number> {
    try {
      const now = new Date();
      logger.info('Running token cleanup job...');

      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });

      logger.info(`Token cleanup completed: ${result.count} expired tokens deleted`);
      return result.count;
    } catch (error) {
      logger.error('Error during token cleanup:', error);
      return 0;
    }
  }
}

export const tokenCleanupJob = new TokenCleanupJob();
