"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const swagger_1 = require("./config/swagger");
const routes_1 = __importDefault(require("./routes"));
const console_1 = require("console");
const app = (0, express_1.default)();
// ========================================
// SWAGGER MUST BE REGISTERED FIRST
// (before any middleware that adds security headers)
// ========================================
// Swagger documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TRIO API Documentation',
}));
// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.swaggerSpec);
});
// ========================================
// Security middleware - AFTER Swagger
// ========================================
// NOTE: For production with HTTPS, use app.use(helmet()) with default settings
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable CSP to allow Swagger UI on HTTP
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
}));
// ========================================
// CORS
// ========================================
app.use((req, res, next) => {
    const origin = req.headers.origin;
    (0, console_1.warn)('Request Origin:', origin);
    if (env_1.env.ALLOWED_ORIGINS.includes(origin) || '') {
        (0, console_1.warn)(env_1.env.ALLOWED_ORIGINS);
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
app.use(rateLimiter_1.generalLimiter);
// Request logging
app.use((req, _res, next) => {
    logger_1.logger.http(`${req.method} ${req.path}`);
    next();
});
// API routes
app.use(`/api/${env_1.env.API_VERSION}`, routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Cannot ${req.method} ${req.path}`,
        },
    });
});
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map