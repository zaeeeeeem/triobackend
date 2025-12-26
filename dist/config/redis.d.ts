import Redis from 'ioredis';
declare const redis: Redis;
export default redis;
export declare const cache: {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string | string[]): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
};
//# sourceMappingURL=redis.d.ts.map