"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedUrlFromStoredUrl = exports.extractS3KeyFromUrl = void 0;
const env_1 = require("../config/env");
const s3_1 = require("../config/s3");
/**
 * Extracts the object key from a stored S3/MinIO URL.
 */
const extractS3KeyFromUrl = (url) => {
    if (env_1.env.AWS_S3_PUBLIC_URL && url.startsWith(`${env_1.env.AWS_S3_PUBLIC_URL}/`)) {
        return url.replace(`${env_1.env.AWS_S3_PUBLIC_URL}/`, '');
    }
    const parts = url.split('.amazonaws.com/');
    return parts.length > 1 ? parts[1] : url;
};
exports.extractS3KeyFromUrl = extractS3KeyFromUrl;
/**
 * Generates a signed URL for the provided stored object URL.
 */
const getSignedUrlFromStoredUrl = async (url) => {
    const key = (0, exports.extractS3KeyFromUrl)(url);
    return (0, s3_1.getSignedUrlForKey)(key);
};
exports.getSignedUrlFromStoredUrl = getSignedUrlFromStoredUrl;
//# sourceMappingURL=s3Helpers.js.map