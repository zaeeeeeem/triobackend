import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many create requests, please try again later',
    },
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many upload requests, please try again later',
    },
  },
});

export const bulkLimiter = rateLimit({
  windowMs: 300000, // 5 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many bulk operations, please try again later',
    },
  },
});
