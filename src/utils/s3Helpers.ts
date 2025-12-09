import { env } from '../config/env';
import { getSignedUrlForKey } from '../config/s3';

/**
 * Extracts the object key from a stored S3/MinIO URL.
 */
export const extractS3KeyFromUrl = (url: string): string => {
  if (env.AWS_S3_PUBLIC_URL && url.startsWith(`${env.AWS_S3_PUBLIC_URL}/`)) {
    return url.replace(`${env.AWS_S3_PUBLIC_URL}/`, '');
  }

  const parts = url.split('.amazonaws.com/');
  return parts.length > 1 ? parts[1] : url;
};

/**
 * Generates a signed URL for the provided stored object URL.
 */
export const getSignedUrlFromStoredUrl = async (url: string): Promise<string> => {
  const key = extractS3KeyFromUrl(url);
  return getSignedUrlForKey(key);
};
