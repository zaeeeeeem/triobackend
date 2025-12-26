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
export declare class ApiResponseHandler {
    static success<T>(res: Response, data: T, message?: string, statusCode?: number): Response<any, Record<string, any>>;
    static error(res: Response, code: string, message: string, statusCode?: number, details?: Record<string, unknown>): Response<any, Record<string, any>>;
    static paginated<T>(res: Response, items: T[], page: number, limit: number, totalItems: number): Response<any, Record<string, any>>;
}
//# sourceMappingURL=apiResponse.d.ts.map