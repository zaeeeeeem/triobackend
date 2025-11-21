/* eslint-disable no-undef */
import sharp from 'sharp';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import s3Client, { getPublicUrl } from '../config/s3';
import { ValidationError } from '../utils/errors';
import { env } from '../config/env';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export interface ImageUploadResult {
  original: string;
  medium: string;
  thumbnail: string;
}

export class UploadService {
  private readonly allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
  private readonly minDimension = 800;
  private readonly bucket = env.AWS_S3_BUCKET;
  private readonly basePrefix = env.AWS_S3_BASE_PREFIX;

  async uploadProductImages(productId: string, files: Express.Multer.File[]): Promise<unknown[]> {
    // Check max images limit
    const existingImages = await prisma.productImage.count({
      where: { productId },
    });

    if (existingImages + files.length > env.MAX_FILES_PER_PRODUCT) {
      throw new ValidationError(`Maximum ${env.MAX_FILES_PER_PRODUCT} images allowed per product`);
    }

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      this.validateFile(file);

      // Process and upload image
      const imageUrls = await this.processAndUploadImage(file, productId);

      // Save to database
      const image = await prisma.productImage.create({
        data: {
          productId,
          originalUrl: imageUrls.original,
          mediumUrl: imageUrls.medium,
          thumbnailUrl: imageUrls.thumbnail,
          altText: `${productId} image ${i + 1}`,
          position: existingImages + i,
        },
      });

      uploadedImages.push(image);
    }

    return uploadedImages;
  }

  async deleteProductImage(imageId: string): Promise<void> {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new ValidationError('Image not found');
    }

    try {
      // Delete from S3
      const keys = [
        this.extractKeyFromUrl(image.originalUrl),
        this.extractKeyFromUrl(image.mediumUrl),
        this.extractKeyFromUrl(image.thumbnailUrl),
      ];

      await Promise.all(
        keys.map((key) =>
          this.deleteFromS3(key).catch((err) => {
            logger.error(`Failed to delete image from S3: ${key}`, err);
          })
        )
      );
    } catch (error) {
      logger.error('Error deleting images from S3:', error);
    }

    // Delete from database
    await prisma.productImage.delete({ where: { id: imageId } });

    // Reorder remaining images
    await this.reorderImages(image.productId);
  }

  async reorderProductImages(productId: string, imageIds: string[]): Promise<void> {
    const images = await prisma.productImage.findMany({
      where: { productId },
    });

    if (images.length !== imageIds.length) {
      throw new ValidationError('Image IDs do not match product images');
    }

    // Update positions
    await Promise.all(
      imageIds.map((imageId, index) =>
        prisma.productImage.update({
          where: { id: imageId },
          data: { position: index },
        })
      )
    );
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > env.MAX_FILE_SIZE) {
      throw new ValidationError(`File size exceeds ${env.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Check file format
    const format = file.mimetype.split('/')[1];
    if (!this.allowedFormats.includes(format)) {
      throw new ValidationError(`Invalid file format. Allowed: ${this.allowedFormats.join(', ')}`);
    }
  }

  private async processAndUploadImage(
    file: Express.Multer.File,
    productId: string
  ): Promise<ImageUploadResult> {
    try {
      // Validate dimensions
      const metadata = await sharp(file.buffer).metadata();

      if (
        !metadata.width ||
        !metadata.height ||
        metadata.width < this.minDimension ||
        metadata.height < this.minDimension
      ) {
        throw new ValidationError(
          `Image dimensions must be at least ${this.minDimension}x${this.minDimension}px`
        );
      }

      const timestamp = Date.now();
      const uniqueId = uuidv4();

      // Generate three versions: original, medium, thumbnail
      const [original, medium, thumbnail] = await Promise.all([
        this.uploadToS3(
          await sharp(file.buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 90 })
            .toBuffer(),
          `${this.basePrefix}/products/${productId}/original-${uniqueId}-${timestamp}.webp`,
          'image/webp'
        ),
        this.uploadToS3(
          await sharp(file.buffer)
            .resize(600, 600, { fit: 'cover' })
            .webp({ quality: 85 })
            .toBuffer(),
          `${this.basePrefix}/products/${productId}/medium-${uniqueId}-${timestamp}.webp`,
          'image/webp'
        ),
        this.uploadToS3(
          await sharp(file.buffer)
            .resize(200, 200, { fit: 'cover' })
            .webp({ quality: 80 })
            .toBuffer(),
          `${this.basePrefix}/products/${productId}/thumb-${uniqueId}-${timestamp}.webp`,
          'image/webp'
        ),
      ]);

      return {
        original,
        medium,
        thumbnail,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing image:', error);
      throw new ValidationError(`Failed to process image: ${message}`);
    }
  }

  private async uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read', // Make images publicly accessible
        },
      });

      await upload.done();

      const publicUrl = getPublicUrl(key);
      logger.debug(`Uploaded image to S3: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to upload to S3: ${key}`, error);
      throw new ValidationError(`Failed to upload image: ${message}`);
    }
  }

  private async deleteFromS3(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await s3Client.send(command);
      logger.debug(`Deleted image from S3: ${key}`);
    } catch (error) {
      logger.error(`Failed to delete from S3: ${key}`, error);
      throw error;
    }
  }

  private extractKeyFromUrl(url: string): string {
    // Extract key from public URL
    // For MinIO: http://localhost:9000/trio-media/app/uploads/products/...
    // For S3: https://bucket.s3.region.amazonaws.com/app/uploads/products/...

    if (env.AWS_S3_PUBLIC_URL && url.startsWith(env.AWS_S3_PUBLIC_URL)) {
      // MinIO or custom endpoint
      return url.replace(`${env.AWS_S3_PUBLIC_URL}/`, '');
    }

    // AWS S3
    const urlParts = url.split('.amazonaws.com/');
    return urlParts.length > 1 ? urlParts[1] : url;
  }

  private async reorderImages(productId: string): Promise<void> {
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
    });

    await Promise.all(
      images.map((image, index) =>
        prisma.productImage.update({
          where: { id: image.id },
          data: { position: index },
        })
      )
    );
  }
}

export const uploadService = new UploadService();
