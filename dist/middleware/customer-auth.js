"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalCustomerAuth = exports.requireEmailVerification = exports.authenticateCustomer = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
const database_1 = __importDefault(require("../config/database"));
/**
 * Middleware to authenticate customer JWT tokens
 * Validates the access token and attaches customer info to request
 */
const authenticateCustomer = async (req, _res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify JWT token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_1.env.CUSTOMER_JWT_SECRET);
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new errors_1.UnauthorizedError('Token expired');
            }
            throw new errors_1.UnauthorizedError('Invalid token');
        }
        // Validate token type
        if (decoded.type !== 'customer') {
            throw new errors_1.UnauthorizedError('Invalid token type');
        }
        // Verify customer still exists and is active
        const customer = await database_1.default.customer.findFirst({
            where: {
                id: decoded.sub,
                deletedAt: null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                status: true,
                emailVerified: true,
            },
        });
        if (!customer) {
            throw new errors_1.UnauthorizedError('Customer not found');
        }
        if (customer.status === 'SUSPENDED') {
            throw new errors_1.ForbiddenError('Account suspended. Please contact support.');
        }
        if (customer.status === 'INACTIVE') {
            throw new errors_1.ForbiddenError('Account inactive. Please reactivate your account.');
        }
        // Attach customer info to request
        req.customer = customer;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateCustomer = authenticateCustomer;
/**
 * Middleware to require email verification
 * Must be used after authenticateCustomer
 */
const requireEmailVerification = (req, _res, next) => {
    if (!req.customer) {
        throw new errors_1.UnauthorizedError('Authentication required');
    }
    if (!req.customer.emailVerified) {
        throw new errors_1.ForbiddenError('Email verification required. Please check your email.');
    }
    next();
};
exports.requireEmailVerification = requireEmailVerification;
/**
 * Optional customer authentication
 * Attaches customer info if token is present and valid, but doesn't fail if not
 * Useful for endpoints that work for both guests and authenticated customers
 */
const optionalCustomerAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // If no token, continue without customer info
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.CUSTOMER_JWT_SECRET);
            if (decoded.type === 'customer') {
                const customer = await database_1.default.customer.findFirst({
                    where: {
                        id: decoded.sub,
                        deletedAt: null,
                        status: 'ACTIVE',
                    },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        status: true,
                        emailVerified: true,
                    },
                });
                if (customer) {
                    req.customer = customer;
                }
            }
        }
        catch (error) {
            // Invalid token, but continue without customer info
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.optionalCustomerAuth = optionalCustomerAuth;
//# sourceMappingURL=customer-auth.js.map