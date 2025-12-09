import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_VERSION: process.env.API_VERSION || 'v1',

  // Server URL (for Swagger and public access)
  SERVER_URL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`,

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),

  // AWS S3 / MinIO
  AWS_S3_REGION: process.env.AWS_S3_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET!,
  AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID!,
  AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  AWS_S3_BASE_PREFIX: process.env.AWS_S3_BASE_PREFIX || 'app/uploads',

  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  MAX_FILES_PER_PRODUCT: parseInt(process.env.MAX_FILES_PER_PRODUCT || '10', 10),

  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),

  // Session Management (Admin Users)
  MAX_ACTIVE_SESSIONS_PER_USER: parseInt(process.env.MAX_ACTIVE_SESSIONS_PER_USER || '5', 10),

  // Token Cleanup Cron Job
  TOKEN_CLEANUP_CRON_SCHEDULE: process.env.TOKEN_CLEANUP_CRON_SCHEDULE || '0 2 * * *', // Daily at 2 AM
  ENABLE_TOKEN_CLEANUP_JOB: process.env.ENABLE_TOKEN_CLEANUP_JOB !== 'false', // Enabled by default

  // Customer Authentication (separate from admin auth)
  CUSTOMER_JWT_SECRET: process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET!,
  CUSTOMER_JWT_EXPIRES_IN: process.env.CUSTOMER_JWT_EXPIRES_IN || '24h',
  CUSTOMER_REFRESH_EXPIRES_IN: process.env.CUSTOMER_REFRESH_EXPIRES_IN || '30d',
  GUEST_TOKEN_EXPIRES_IN: parseInt(process.env.GUEST_TOKEN_EXPIRES_IN || '604800', 10), // 7 days in seconds
  MAX_CUSTOMER_SESSIONS: parseInt(process.env.MAX_CUSTOMER_SESSIONS || '5', 10),

  // Email Service (SMTP)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'TRIO Shopify',
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'noreply@trio.com',

  // Frontend URL (for email links)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'AWS_S3_BUCKET',
  'AWS_S3_ACCESS_KEY_ID',
  'AWS_S3_SECRET_ACCESS_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
