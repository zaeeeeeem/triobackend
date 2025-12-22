"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = exports.ProductController = exports.productValidation = void 0;
const express_validator_1 = require("express-validator");
const product_service_1 = require("../services/product.service");
const upload_service_1 = require("../services/upload.service");
const apiResponse_1 = require("../utils/apiResponse");
const client_1 = require("@prisma/client");
exports.productValidation = {
    create: [
        (0, express_validator_1.body)('name').optional().trim().isLength({ min: 2, max: 255 }),
        (0, express_validator_1.body)('title').optional().trim().isLength({ min: 2, max: 255 }),
        (0, express_validator_1.body)('description').optional().trim(),
        (0, express_validator_1.body)('section').isIn(Object.values(client_1.Section)),
        (0, express_validator_1.body)('price').isFloat({ min: 0.01, max: 999999 }),
        (0, express_validator_1.body)('compareAtPrice').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('costPrice').optional().isFloat({ min: 0 }),
        (0, express_validator_1.body)('sku')
            .trim()
            .notEmpty()
            .matches(/^[A-Z0-9-]+$/i),
        (0, express_validator_1.body)('stockQuantity').isInt({ min: 0 }),
        (0, express_validator_1.body)('trackQuantity').optional().isBoolean(),
        (0, express_validator_1.body)('continueSellingOutOfStock').optional().isBoolean(),
        (0, express_validator_1.body)('status').optional().isIn(Object.values(client_1.ProductStatus)),
        (0, express_validator_1.body)('tags').optional().isArray(),
        (0, express_validator_1.body)('collections').optional().isArray(),
    ],
    update: [
        (0, express_validator_1.param)('id').isUUID(),
        (0, express_validator_1.body)('name').optional().trim().isLength({ min: 2, max: 255 }),
        (0, express_validator_1.body)('title').optional().trim().isLength({ min: 2, max: 255 }),
        (0, express_validator_1.body)('price').optional().isFloat({ min: 0.01, max: 999999 }),
        (0, express_validator_1.body)('sku')
            .optional()
            .trim()
            .matches(/^[A-Z0-9-]+$/i),
        (0, express_validator_1.body)('stockQuantity').optional().isInt({ min: 0 }),
    ],
    getById: [(0, express_validator_1.param)('id').isUUID()],
    delete: [(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.query)('force').optional().isBoolean()],
    list: [
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
        (0, express_validator_1.query)('section').optional().isIn(Object.values(client_1.Section)),
        (0, express_validator_1.query)('status').optional().isIn(Object.values(client_1.ProductStatus)),
        (0, express_validator_1.query)('availability').optional().isIn(Object.values(client_1.ProductAvailability)),
        (0, express_validator_1.query)('mostDiscounted').optional().isBoolean(),
    ],
};
class ProductController {
    async createProduct(req, res, next) {
        try {
            const product = await product_service_1.productService.createProduct(req.body, req.user.sub);
            apiResponse_1.ApiResponseHandler.success(res, { product }, 'Product created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async getProduct(req, res, next) {
        try {
            const product = await product_service_1.productService.getProductById(req.params.id);
            apiResponse_1.ApiResponseHandler.success(res, { product });
        }
        catch (error) {
            next(error);
        }
    }
    async listProducts(req, res, next) {
        try {
            const { products, totalItems, page, limit } = await product_service_1.productService.listProducts(req.query, req.user?.role, req.user?.assignedSection);
            apiResponse_1.ApiResponseHandler.paginated(res, products, page, limit, totalItems);
        }
        catch (error) {
            next(error);
        }
    }
    async updateProduct(req, res, next) {
        try {
            const product = await product_service_1.productService.updateProduct(req.params.id, req.body, req.user.sub);
            apiResponse_1.ApiResponseHandler.success(res, { product }, 'Product updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async deleteProduct(req, res, next) {
        try {
            const force = req.query.force === 'true';
            const result = await product_service_1.productService.deleteProduct(req.params.id, force);
            apiResponse_1.ApiResponseHandler.success(res, result, 'Product deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async uploadImages(req, res, next) {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                apiResponse_1.ApiResponseHandler.error(res, 'NO_FILES', 'No files uploaded', 400);
                return;
            }
            const images = await upload_service_1.uploadService.uploadProductImages(req.params.id, req.files);
            apiResponse_1.ApiResponseHandler.success(res, { images }, `${images.length} images uploaded successfully`, 201);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteImage(req, res, next) {
        try {
            await upload_service_1.uploadService.deleteProductImage(req.params.imageId);
            apiResponse_1.ApiResponseHandler.success(res, null, 'Image deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async reorderImages(req, res, next) {
        try {
            const { imageIds } = req.body;
            await upload_service_1.uploadService.reorderProductImages(req.params.id, imageIds);
            apiResponse_1.ApiResponseHandler.success(res, null, 'Images reordered successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async bulkUpdate(req, res, next) {
        try {
            const { productIds, updates } = req.body;
            const result = await product_service_1.productService.bulkUpdateProducts(productIds, updates, req.user.sub);
            apiResponse_1.ApiResponseHandler.success(res, result, `${result.updated} products updated successfully`);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkDelete(req, res, next) {
        try {
            const { productIds } = req.body;
            const force = req.query.force === 'true';
            const result = await product_service_1.productService.bulkDeleteProducts(productIds, force);
            apiResponse_1.ApiResponseHandler.success(res, result, `${result.deleted} products deleted successfully`);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
exports.productController = new ProductController();
//# sourceMappingURL=product.controller.js.map