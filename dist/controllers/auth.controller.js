"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = exports.authValidation = void 0;
const express_validator_1 = require("express-validator");
const auth_service_1 = require("../services/auth.service");
const apiResponse_1 = require("../utils/apiResponse");
const client_1 = require("@prisma/client");
exports.authValidation = {
    register: [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_1.body)('password').isLength({ min: 8 }),
        (0, express_validator_1.body)('firstName').trim().notEmpty(),
        (0, express_validator_1.body)('lastName').trim().notEmpty(),
        (0, express_validator_1.body)('role').optional().isIn(Object.values(client_1.UserRole)),
    ],
    login: [(0, express_validator_1.body)('email').isEmail().normalizeEmail(), (0, express_validator_1.body)('password').notEmpty()],
    refresh: [(0, express_validator_1.body)('refreshToken').notEmpty()],
    changePassword: [(0, express_validator_1.body)('oldPassword').notEmpty(), (0, express_validator_1.body)('newPassword').isLength({ min: 8 })],
};
class AuthController {
    async register(req, res, next) {
        try {
            const user = await auth_service_1.authService.register(req.body);
            apiResponse_1.ApiResponseHandler.success(res, { user }, 'User registered successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.login(email, password);
            apiResponse_1.ApiResponseHandler.success(res, result, 'Login successful');
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await auth_service_1.authService.refreshAccessToken(refreshToken);
            apiResponse_1.ApiResponseHandler.success(res, result, 'Token refreshed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            await auth_service_1.authService.logout(refreshToken);
            apiResponse_1.ApiResponseHandler.success(res, null, 'Logout successful');
        }
        catch (error) {
            next(error);
        }
    }
    async logoutAll(req, res, next) {
        try {
            await auth_service_1.authService.logoutAll(req.user.sub);
            apiResponse_1.ApiResponseHandler.success(res, null, 'Logged out from all devices successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getActiveSessions(req, res, next) {
        try {
            const sessions = await auth_service_1.authService.getActiveSessions(req.user.sub);
            apiResponse_1.ApiResponseHandler.success(res, { sessions }, 'Active sessions retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;
            await auth_service_1.authService.changePassword(req.user.sub, oldPassword, newPassword);
            apiResponse_1.ApiResponseHandler.success(res, null, 'Password changed successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map