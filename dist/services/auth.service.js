"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../config/database"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
class AuthService {
    async register(data) {
        // Check if user already exists
        const existingUser = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new errors_1.ValidationError('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        // Create user
        const user = await database_1.default.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || client_1.UserRole.STAFF,
                assignedSection: data.assignedSection,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                assignedSection: true,
                isActive: true,
                createdAt: true,
            },
        });
        return user;
    }
    async login(email, password) {
        // Find user
        const user = await database_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        if (!user.isActive) {
            throw new errors_1.UnauthorizedError('Account is inactive');
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Generate tokens
        const userPayload = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            assignedSection: user.assignedSection ?? undefined,
        };
        const accessToken = this.generateAccessToken(userPayload);
        const refreshToken = this.generateRefreshToken(userPayload);
        // Calculate expiration from env (use ms library for parsing)
        const expiresAt = this.calculateTokenExpiration(env_1.env.JWT_REFRESH_EXPIRES_IN);
        // Cleanup: Delete expired tokens for this user
        await database_1.default.refreshToken.deleteMany({
            where: {
                userId: user.id,
                expiresAt: { lt: new Date() },
            },
        });
        // Enforce session limit: Keep only the most recent N-1 tokens
        const activeTokens = await database_1.default.refreshToken.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });
        const maxSessions = env_1.env.MAX_ACTIVE_SESSIONS_PER_USER;
        if (activeTokens.length >= maxSessions) {
            // Delete oldest tokens to make room for new one
            const tokensToDelete = activeTokens.slice(maxSessions - 1);
            await database_1.default.refreshToken.deleteMany({
                where: {
                    id: { in: tokensToDelete.map((t) => t.id) },
                },
            });
        }
        // Save new refresh token
        await database_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                assignedSection: user.assignedSection,
            },
            accessToken,
            refreshToken,
        };
    }
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
            // Check if refresh token exists in database
            const storedToken = await database_1.default.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });
            if (!storedToken || storedToken.userId !== decoded.sub) {
                // Reuse detection: If token was already used (deleted), invalidate all user tokens
                if (!storedToken && decoded.sub) {
                    await database_1.default.refreshToken.deleteMany({
                        where: { userId: decoded.sub },
                    });
                }
                throw new errors_1.UnauthorizedError('Invalid refresh token');
            }
            // Check if token is expired
            if (storedToken.expiresAt < new Date()) {
                await database_1.default.refreshToken.delete({ where: { token: refreshToken } });
                throw new errors_1.UnauthorizedError('Refresh token expired');
            }
            // Generate new tokens (token rotation)
            const userPayload = {
                id: storedToken.user.id,
                email: storedToken.user.email,
                firstName: storedToken.user.firstName,
                lastName: storedToken.user.lastName,
                role: storedToken.user.role,
                assignedSection: storedToken.user.assignedSection ?? undefined,
            };
            const newAccessToken = this.generateAccessToken(userPayload);
            const newRefreshToken = this.generateRefreshToken(userPayload);
            // Calculate expiration for new refresh token
            const expiresAt = this.calculateTokenExpiration(env_1.env.JWT_REFRESH_EXPIRES_IN);
            // Delete old refresh token and create new one (token rotation)
            await database_1.default.$transaction([
                database_1.default.refreshToken.delete({ where: { token: refreshToken } }),
                database_1.default.refreshToken.create({
                    data: {
                        token: newRefreshToken,
                        userId: storedToken.user.id,
                        expiresAt,
                    },
                }),
            ]);
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            if (error instanceof errors_1.UnauthorizedError) {
                throw error;
            }
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
    }
    async logout(refreshToken) {
        await database_1.default.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async logoutAll(userId) {
        // Delete all refresh tokens for this user
        await database_1.default.refreshToken.deleteMany({
            where: { userId },
        });
    }
    async getActiveSessions(userId) {
        const sessions = await database_1.default.refreshToken.findMany({
            where: {
                userId,
                expiresAt: { gte: new Date() }, // Only active (non-expired) sessions
            },
            select: {
                id: true,
                createdAt: true,
                expiresAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return sessions;
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        // Verify old password
        const isPasswordValid = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid current password');
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password
        await database_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }
    generateAccessToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            assignedSection: user.assignedSection,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
    }
    generateRefreshToken(user) {
        const payload = {
            sub: user.id,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
            expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
        });
    }
    calculateTokenExpiration(expiresIn) {
        // Parse time string like "7d", "24h", "60m", "3600s"
        const expiresAt = new Date();
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            // Default to 7 days if invalid format
            expiresAt.setDate(expiresAt.getDate() + 7);
            return expiresAt;
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's': // seconds
                expiresAt.setSeconds(expiresAt.getSeconds() + value);
                break;
            case 'm': // minutes
                expiresAt.setMinutes(expiresAt.getMinutes() + value);
                break;
            case 'h': // hours
                expiresAt.setHours(expiresAt.getHours() + value);
                break;
            case 'd': // days
                expiresAt.setDate(expiresAt.getDate() + value);
                break;
            default:
                expiresAt.setDate(expiresAt.getDate() + 7);
        }
        return expiresAt;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map