"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const redis = new ioredis_1.default({
    host: env_1.env.REDIS_HOST,
    port: env_1.env.REDIS_PORT,
    password: env_1.env.REDIS_PASSWORD || undefined,
    db: env_1.env.REDIS_DB,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});
redis.on('connect', () => {
    logger_1.logger.info('Redis connected successfully');
});
redis.on('error', (error) => {
    logger_1.logger.error('Redis connection error:', error);
});
exports.default = redis;
// Cache helper functions
exports.cache = {
    async get(key) {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    },
    async set(key, value, ttlSeconds = 300) {
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(value));
        }
        catch (error) {
            logger_1.logger.error(`Cache set error for key ${key}:`, error);
        }
    },
    async del(key) {
        try {
            if (Array.isArray(key)) {
                if (key.length > 0) {
                    await redis.del(...key);
                }
            }
            else {
                await redis.del(key);
            }
        }
        catch (error) {
            logger_1.logger.error(`Cache delete error for key ${key}:`, error);
        }
    },
    async invalidatePattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        }
        catch (error) {
            logger_1.logger.error(`Cache invalidate pattern error for ${pattern}:`, error);
        }
    },
};
//# sourceMappingURL=redis.js.map