import express, { Application } from 'express';
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

// ========================================
// TEMPORARY ALLOW-ALL CORS
// ========================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

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
