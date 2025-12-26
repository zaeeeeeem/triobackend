"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = exports.UploadService = void 0;
/* eslint-disable no-undef */
const sharp_1 = __importDefault(require("sharp"));
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const uuid_1 = require("uuid");
const s3_1 = __importStar(require("../config/s3"));
const errors_1 = require("../utils/errors");
const env_1 = require("../config/env");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
const s3Helpers_1 = require("../utils/s3Helpers");
class UploadService {
    allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
    minDimension = 800;
    bucket = env_1.env.AWS_S3_BUCKET;
    basePrefix = env_1.env.AWS_S3_BASE_PREFIX;
    async uploadProductImages(productId, files) {
        // Check max images limit
        const existingImages = await database_1.default.productImage.count({
            where: { productId },
        });
        if (existingImages + files.length > env_1.env.MAX_FILES_PER_PRODUCT) {
            throw new errors_1.ValidationError(`Maximum ${env_1.env.MAX_FILES_PER_PRODUCT} images allowed per product`);
        }
        const uploadedImages = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Validate file
            this.validateFile(file);
            // Process and upload image
            const imageUrls = await this.processAndUploadImage(file, productId);
            // Save to database
            const image = await database_1.default.productImage.create({
                data: {
                    productId,
                    originalUrl: imageUrls.original,
                    mediumUrl: imageUrls.medium,
                    thumbnailUrl: imageUrls.thumbnail,
                    altText: `${productId} image ${i + 1}`,
                    position: existingImages + i,
                },
            });
            uploadedImages.push(await this.withSignedUrls(image));
        }
        return uploadedImages;
    }
    async deleteProductImage(imageId) {
        const image = await database_1.default.productImage.findUnique({
            where: { id: imageId },
        });
        if (!image) {
            throw new errors_1.ValidationError('Image not found');
        }
        try {
            // Delete from S3
            const keys = [
                (0, s3Helpers_1.extractS3KeyFromUrl)(image.originalUrl),
                (0, s3Helpers_1.extractS3KeyFromUrl)(image.mediumUrl),
                (0, s3Helpers_1.extractS3KeyFromUrl)(image.thumbnailUrl),
            ];
            await Promise.all(keys.map((key) => this.deleteFromS3(key).catch((err) => {
                logger_1.logger.error(`Failed to delete image from S3: ${key}`, err);
            })));
        }
        catch (error) {
            logger_1.logger.error('Error deleting images from S3:', error);
        }
        // Delete from database
        await database_1.default.productImage.delete({ where: { id: imageId } });
        // Reorder remaining images
        await this.reorderImages(image.productId);
    }
    async reorderProductImages(productId, imageIds) {
        const images = await database_1.default.productImage.findMany({
            where: { productId },
        });
        if (images.length !== imageIds.length) {
            throw new errors_1.ValidationError('Image IDs do not match product images');
        }
        // Update positions
        await Promise.all(imageIds.map((imageId, index) => database_1.default.productImage.update({
            where: { id: imageId },
            data: { position: index },
        })));
    }
    validateFile(file) {
        // Check file size
        if (file.size > env_1.env.MAX_FILE_SIZE) {
            throw new errors_1.ValidationError(`File size exceeds ${env_1.env.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        }
        // Check file format
        const format = file.mimetype.split('/')[1];
        if (!this.allowedFormats.includes(format)) {
            throw new errors_1.ValidationError(`Invalid file format. Allowed: ${this.allowedFormats.join(', ')}`);
        }
    }
    async processAndUploadImage(file, productId) {
        try {
            // Validate dimensions
            const metadata = await (0, sharp_1.default)(file.buffer).metadata();
            if (!metadata.width ||
                !metadata.height ||
                metadata.width < this.minDimension ||
                metadata.height < this.minDimension) {
                throw new errors_1.ValidationError(`Image dimensions must be at least ${this.minDimension}x${this.minDimension}px`);
            }
            const timestamp = Date.now();
            const uniqueId = (0, uuid_1.v4)();
            // Generate three versions: original, medium, thumbnail
            const [original, medium, thumbnail] = await Promise.all([
                this.uploadToS3(await (0, sharp_1.default)(file.buffer)
                    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 90 })
                    .toBuffer(), `${this.basePrefix}/products/${productId}/original-${uniqueId}-${timestamp}.webp`, 'image/webp'),
                this.uploadToS3(await (0, sharp_1.default)(file.buffer)
                    .resize(600, 600, { fit: 'cover' })
                    .webp({ quality: 85 })
                    .toBuffer(), `${this.basePrefix}/products/${productId}/medium-${uniqueId}-${timestamp}.webp`, 'image/webp'),
                this.uploadToS3(await (0, sharp_1.default)(file.buffer)
                    .resize(200, 200, { fit: 'cover' })
                    .webp({ quality: 80 })
                    .toBuffer(), `${this.basePrefix}/products/${productId}/thumb-${uniqueId}-${timestamp}.webp`, 'image/webp'),
            ]);
            return {
                original,
                medium,
                thumbnail,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Error processing image:', error);
            throw new errors_1.ValidationError(`Failed to process image: ${message}`);
        }
    }
    async uploadToS3(buffer, key, contentType) {
        try {
            const upload = new lib_storage_1.Upload({
                client: s3_1.default,
                params: {
                    Bucket: this.bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: contentType,
                },
            });
            await upload.done();
            const publicUrl = (0, s3_1.getPublicUrl)(key);
            logger_1.logger.debug(`Uploaded image to S3: ${publicUrl}`);
            return publicUrl;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error(`Failed to upload to S3: ${key}`, error);
            throw new errors_1.ValidationError(`Failed to upload image: ${message}`);
        }
    }
    async deleteFromS3(key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            await s3_1.default.send(command);
            logger_1.logger.debug(`Deleted image from S3: ${key}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete from S3: ${key}`, error);
            throw error;
        }
    }
    async withSignedUrls(image) {
        const [signedOriginalUrl, signedMediumUrl, signedThumbnailUrl] = await Promise.all([
            (0, s3Helpers_1.getSignedUrlFromStoredUrl)(image.originalUrl),
            (0, s3Helpers_1.getSignedUrlFromStoredUrl)(image.mediumUrl),
            (0, s3Helpers_1.getSignedUrlFromStoredUrl)(image.thumbnailUrl),
        ]);
        return {
            ...image,
            signedOriginalUrl,
            signedMediumUrl,
            signedThumbnailUrl,
        };
    }
    async reorderImages(productId) {
        const images = await database_1.default.productImage.findMany({
            where: { productId },
            orderBy: { position: 'asc' },
        });
        await Promise.all(images.map((image, index) => database_1.default.productImage.update({
            where: { id: image.id },
            data: { position: index },
        })));
    }
}
exports.UploadService = UploadService;
exports.uploadService = new UploadService();
//# sourceMappingURL=upload.service.js.map