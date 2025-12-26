/**
 * Token Cleanup Job
 * Deletes expired refresh tokens from the database
 * Runs on a configurable schedule (default: daily at 2 AM)
 */
export declare class TokenCleanupJob {
    private task;
    start(): void;
    stop(): void;
    /**
     * Cleanup method - can be called manually for testing
     */
    cleanup(): Promise<number>;
}
export declare const tokenCleanupJob: TokenCleanupJob;
//# sourceMappingURL=tokenCleanup.job.d.ts.map