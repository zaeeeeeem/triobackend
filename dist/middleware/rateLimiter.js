"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkLimiter = exports.uploadLimiter = exports.createLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX_REQUESTS,
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
exports.createLimiter = (0, express_rate_limit_1.default)({
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
exports.uploadLimiter = (0, express_rate_limit_1.default)({
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
exports.bulkLimiter = (0, express_rate_limit_1.default)({
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
//# sourceMappingURL=rateLimiter.js.map