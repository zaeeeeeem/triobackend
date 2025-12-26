"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSectionAccess = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
const authenticate = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        if (!roles.includes(req.user.role)) {
            throw new errors_1.ForbiddenError('Insufficient permissions');
        }
        next();
    };
};
exports.authorize = authorize;
const checkSectionAccess = (section) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        // Admins have access to all sections
        if (req.user.role === client_1.UserRole.ADMIN) {
            return next();
        }
        // Managers can only access their assigned section
        if (req.user.role === client_1.UserRole.MANAGER) {
            if (req.user.assignedSection !== section) {
                throw new errors_1.ForbiddenError(`You can only access ${req.user.assignedSection} section`);
            }
        }
        next();
    };
};
exports.checkSectionAccess = checkSectionAccess;
//# sourceMappingURL=auth.js.map