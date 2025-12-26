/**
 * Extracts the object key from a stored S3/MinIO URL.
 */
export declare const extractS3KeyFromUrl: (url: string) => string;
/**
 * Generates a signed URL for the provided stored object URL.
 */
export declare const getSignedUrlFromStoredUrl: (url: string) => Promise<string>;
//# sourceMappingURL=s3Helpers.d.ts.map