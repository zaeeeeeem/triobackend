"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const isRecord = (value) => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};
const normalizeDetails = (details) => {
    if (!details || Array.isArray(details)) {
        return undefined;
    }
    if (isRecord(details)) {
        return details;
    }
    if (typeof details === 'string') {
        return { message: details };
    }
    return undefined;
};
const errorHandler = (error, _req, res, _next) => {
    logger_1.logger.error(`Error: ${error.message}`, { stack: error.stack });
    void _next;
    // Handle custom AppError
    if (error instanceof errors_1.AppError) {
        return apiResponse_1.ApiResponseHandler.error(res, error.code, error.message, error.statusCode, normalizeDetails(error.details));
    }
    // Handle Prisma errors
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            // Unique constraint violation
            const field = error.meta?.target?.[0] || 'field';
            return apiResponse_1.ApiResponseHandler.error(res, 'DUPLICATE_ENTRY', `${field} already exists`, 409, {
                field,
            });
        }
        if (error.code === 'P2025') {
            // Record not found
            return apiResponse_1.ApiResponseHandler.error(res, 'NOT_FOUND', 'Resource not found', 404);
        }
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
        return apiResponse_1.ApiResponseHandler.error(res, 'VALIDATION_ERROR', error.message, 400);
    }
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return apiResponse_1.ApiResponseHandler.error(res, 'INVALID_TOKEN', 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
        return apiResponse_1.ApiResponseHandler.error(res, 'TOKEN_EXPIRED', 'Token expired', 401);
    }
    // Default server error
    return apiResponse_1.ApiResponseHandler.error(res, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred', 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map