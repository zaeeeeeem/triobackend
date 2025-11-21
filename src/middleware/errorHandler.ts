import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { ApiResponseHandler } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const normalizeDetails = (details?: unknown): Record<string, unknown> | undefined => {
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

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${error.message}`, { stack: error.stack });
  void _next;

  // Handle custom AppError
  if (error instanceof AppError) {
    return ApiResponseHandler.error(
      res,
      error.code,
      error.message,
      error.statusCode,
      normalizeDetails(error.details)
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.[0] || 'field';
      return ApiResponseHandler.error(res, 'DUPLICATE_ENTRY', `${field} already exists`, 409, {
        field,
      });
    }
    if (error.code === 'P2025') {
      // Record not found
      return ApiResponseHandler.error(res, 'NOT_FOUND', 'Resource not found', 404);
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return ApiResponseHandler.error(res, 'VALIDATION_ERROR', error.message, 400);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return ApiResponseHandler.error(res, 'INVALID_TOKEN', 'Invalid token', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return ApiResponseHandler.error(res, 'TOKEN_EXPIRED', 'Token expired', 401);
  }

  // Default server error
  return ApiResponseHandler.error(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred',
    500
  );
};
