import { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { productService } from '../services/product.service';
import { uploadService } from '../services/upload.service';
import { ApiResponseHandler } from '../utils/apiResponse';
import { Section, ProductStatus, ProductAvailability } from '@prisma/client';

export const productValidation = {
  create: [
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('title').optional().trim().isLength({ min: 2, max: 255 }),
    body('description').optional().trim(),
    body('section').isIn(Object.values(Section)),
    body('price').isFloat({ min: 0.01, max: 999999 }),
    body('compareAtPrice').optional().isFloat({ min: 0 }),
    body('costPrice').optional().isFloat({ min: 0 }),
    body('sku')
      .trim()
      .notEmpty()
      .matches(/^[A-Z0-9-]+$/i),
    body('stockQuantity').isInt({ min: 0 }),
    body('trackQuantity').optional().isBoolean(),
    body('continueSellingOutOfStock').optional().isBoolean(),
    body('status').optional().isIn(Object.values(ProductStatus)),
    body('tags').optional().isArray(),
    body('collections').optional().isArray(),
  ],
  update: [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('title').optional().trim().isLength({ min: 2, max: 255 }),
    body('price').optional().isFloat({ min: 0.01, max: 999999 }),
    body('sku')
      .optional()
      .trim()
      .matches(/^[A-Z0-9-]+$/i),
    body('stockQuantity').optional().isInt({ min: 0 }),
  ],
  getById: [param('id').isUUID()],
  delete: [param('id').isUUID(), query('force').optional().isBoolean()],
  list: [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('section').optional().isIn(Object.values(Section)),
    query('status').optional().isIn(Object.values(ProductStatus)),
    query('availability').optional().isIn(Object.values(ProductAvailability)),
    query('mostDiscounted').optional().isBoolean(),
  ],
};

export class ProductController {
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body, req.user!.sub);
      ApiResponseHandler.success(res, { product }, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id);
      ApiResponseHandler.success(res, { product });
    } catch (error) {
      next(error);
    }
  }

  async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { products, totalItems, page, limit } = await productService.listProducts(
        req.query,
        req.user?.role,
        req.user?.assignedSection
      );

      ApiResponseHandler.paginated(res, products, page, limit, totalItems);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params.id, req.body, req.user!.sub);
      ApiResponseHandler.success(res, { product }, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const force = req.query.force === 'true';
      const result = await productService.deleteProduct(req.params.id, force);
      ApiResponseHandler.success(res, result, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        ApiResponseHandler.error(res, 'NO_FILES', 'No files uploaded', 400);
        return;
      }

      const images = await uploadService.uploadProductImages(req.params.id, req.files);
      ApiResponseHandler.success(
        res,
        { images },
        `${images.length} images uploaded successfully`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await uploadService.deleteProductImage(req.params.imageId);
      ApiResponseHandler.success(res, null, 'Image deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async reorderImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageIds } = req.body;
      await uploadService.reorderProductImages(req.params.id, imageIds);
      ApiResponseHandler.success(res, null, 'Images reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productIds, updates } = req.body;
      const result = await productService.bulkUpdateProducts(productIds, updates, req.user!.sub);
      ApiResponseHandler.success(res, result, `${result.updated} products updated successfully`);
    } catch (error) {
      next(error);
    }
  }

  async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productIds } = req.body;
      const force = req.query.force === 'true';
      const result = await productService.bulkDeleteProducts(productIds, force);
      ApiResponseHandler.success(res, result, `${result.deleted} products deleted successfully`);
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
