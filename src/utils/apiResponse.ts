import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class ApiResponseHandler {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(res: Response, items: T[], page: number, limit: number, totalItems: number) {
    const totalPages = Math.ceil(totalItems / limit);
    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    };
    return res.status(200).json(response);
  }
}
