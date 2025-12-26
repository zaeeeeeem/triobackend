"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedUrlForKey = exports.getPublicUrl = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const s3ClientConfig = {
    region: env_1.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: env_1.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: env_1.env.AWS_S3_SECRET_ACCESS_KEY,
    },
};
exports.s3Client = new client_s3_1.S3Client(s3ClientConfig);
logger_1.logger.info('S3 Client initialized', {
    region: env_1.env.AWS_S3_REGION,
    bucket: env_1.env.AWS_S3_BUCKET,
    endpoint: env_1.env.AWS_S3_ENDPOINT || 'AWS S3',
});
// Helper function to generate public URL
const getPublicUrl = (key) => {
    if (env_1.env.AWS_S3_PUBLIC_URL) {
        // For MinIO or custom endpoint
        return `${env_1.env.AWS_S3_PUBLIC_URL}/${key}`;
    }
    // For AWS S3
    return `https://${env_1.env.AWS_S3_BUCKET}.s3.${env_1.env.AWS_S3_REGION}.amazonaws.com/${key}`;
};
exports.getPublicUrl = getPublicUrl;
const getSignedUrlForKey = async (key, expiresIn = env_1.env.S3_SIGNED_URL_TTL) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: env_1.env.AWS_S3_BUCKET,
        Key: key,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn });
};
exports.getSignedUrlForKey = getSignedUrlForKey;
exports.default = exports.s3Client;
//# sourceMappingURL=s3.js.map