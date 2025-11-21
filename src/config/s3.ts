import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { env } from './env';
import { logger } from '../utils/logger';

const s3ClientConfig: S3ClientConfig = {
  region: env.AWS_S3_REGION,
  credentials: {
    accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
  },
};

// MinIO-specific configuration
if (env.AWS_S3_ENDPOINT) {
  s3ClientConfig.endpoint = env.AWS_S3_ENDPOINT;
  s3ClientConfig.forcePathStyle = env.AWS_S3_FORCE_PATH_STYLE;
}

export const s3Client = new S3Client(s3ClientConfig);

logger.info('S3 Client initialized', {
  region: env.AWS_S3_REGION,
  bucket: env.AWS_S3_BUCKET,
  endpoint: env.AWS_S3_ENDPOINT || 'AWS S3',
});

// Helper function to generate public URL
export const getPublicUrl = (key: string): string => {
  if (env.AWS_S3_PUBLIC_URL) {
    // For MinIO or custom endpoint
    return `${env.AWS_S3_PUBLIC_URL}/${key}`;
  }
  // For AWS S3
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${key}`;
};

export default s3Client;
