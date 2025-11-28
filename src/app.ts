import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './config/swagger';
import routes from './routes';

const app: Application = express();

// ========================================
// SWAGGER MUST BE REGISTERED FIRST
// (before any middleware that adds security headers)
// ========================================
// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TRIO API Documentation',
  })
);

// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ========================================
// Security middleware - AFTER Swagger
// ========================================
// NOTE: For production with HTTPS, use app.use(helmet()) with default settings
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP to allow Swagger UI on HTTP
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// CORS configuration - allow frontend origins and same-origin for Swagger
const allowedOrigins = [
  ...env.ALLOWED_ORIGINS,
  `http://localhost:${env.PORT}`, // Allow same-origin for Swagger UI
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use(`/api/${env.API_VERSION}`, routes);

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
app.use(errorHandler);

export default app;
