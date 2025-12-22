"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseHandler = void 0;
class ApiResponseHandler {
    static success(res, data, message, statusCode = 200) {
        const response = {
            success: true,
            data,
            message,
        };
        return res.status(statusCode).json(response);
    }
    static error(res, code, message, statusCode = 500, details) {
        const response = {
            success: false,
            error: {
                code,
                message,
                details,
            },
        };
        return res.status(statusCode).json(response);
    }
    static paginated(res, items, page, limit, totalItems) {
        const totalPages = Math.ceil(totalItems / limit);
        const response = {
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
exports.ApiResponseHandler = ApiResponseHandler;
//# sourceMappingURL=apiResponse.js.map