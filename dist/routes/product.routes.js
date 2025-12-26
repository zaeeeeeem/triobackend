"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const product_controller_1 = require("../controllers/product.controller");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// NOTE: GET endpoints (list and getById) are PUBLIC for customer browsing
// All other endpoints require authentication
/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products
 *     description: Get a paginated list of products with optional filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name, title, author, description, or SKU
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *           enum: [CAFE, FLOWERS, BOOKS]
 *         description: Filter by section
 *       - in: query
 *         name: cafeCategory
 *         schema:
 *           type: string
 *         description: Filter by cafe category (when section=CAFE)
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author (when section=BOOKS)
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre (when section=BOOKS)
 *       - in: query
 *         name: arrangementType
 *         schema:
 *           type: string
 *         description: Filter by arrangement type (when section=FLOWERS)
 *       - in: query
 *         name: seasonality
 *         schema:
 *           type: string
 *         description: Filter by seasonality (when section=FLOWERS)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, stockQuantity, createdAt, updatedAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: mostDiscounted
 *         schema:
 *           type: boolean
 *         description: When true, returns top 7 products with highest discount percentage (based on compareAtPrice vs price)
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUBLIC endpoint - no authentication required
router.get('/', (0, validation_1.validate)(product_controller_1.productValidation.list), product_controller_1.productController.listProducts);
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product (Admin and Manager only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - section
 *               - sku
 *               - price
 *               - stockQuantity
 *             properties:
 *               sku:
 *                 type: string
 *                 example: CAFE-ESP-001
 *               price:
 *                 type: number
 *                 example: 15.99
 *               compareAtPrice:
 *                 type: number
 *                 example: 19.99
 *               costPrice:
 *                 type: number
 *                 example: 8.50
 *               stockQuantity:
 *                 type: integer
 *                 example: 100
 *               trackQuantity:
 *                 type: boolean
 *                 example: true
 *               continueSellingOutOfStock:
 *                 type: boolean
 *                 example: false
 *               section:
 *                 type: string
 *                 enum: [CAFE, FLOWERS, BOOKS]
 *                 example: CAFE
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [organic, fair-trade]
 *               collections:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [limited-run]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DRAFT]
 *                 example: DRAFT
 *               cafeAttributes:
 *                 type: object
 *                 description: Required when section is CAFE. Contains cafe-specific product details.
 *                 required:
 *                   - name
 *                   - category
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Espresso Blend Coffee
 *                   description:
 *                     type: string
 *                     example: Rich and smooth espresso blend
 *                   category:
 *                     type: string
 *                     example: Coffee Beans
 *                   origin:
 *                     type: string
 *                     example: Colombia
 *                   roastLevel:
 *                     type: string
 *                     example: Medium
 *                   caffeineContent:
 *                     type: string
 *                     example: High
 *                   size:
 *                     type: string
 *                     example: 250g
 *                   temperature:
 *                     type: string
 *                     example: Hot
 *                   allergens:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [nuts]
 *                   calories:
 *                     type: integer
 *                     example: 150
 *               flowersAttributes:
 *                 type: object
 *                 description: Required when section is FLOWERS. Contains flower-specific product details.
 *                 required:
 *                   - name
 *                   - arrangementType
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Spring Bouquet
 *                   description:
 *                     type: string
 *                     example: Beautiful arrangement of seasonal spring flowers
 *                   arrangementType:
 *                     type: string
 *                     example: Bouquet
 *                   occasion:
 *                     type: string
 *                     example: Birthday
 *                   colors:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [red, pink, white]
 *                   flowerTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [roses, tulips, lilies]
 *                   size:
 *                     type: string
 *                     example: Medium
 *                   seasonality:
 *                     type: string
 *                     example: Spring
 *                   careInstructions:
 *                     type: string
 *                     example: Keep in cool water, change water daily
 *                   vaseIncluded:
 *                     type: boolean
 *                     example: true
 *               booksAttributes:
 *                 type: object
 *                 description: Required when section is BOOKS. Contains book-specific product details.
 *                 required:
 *                   - title
 *                   - author
 *                   - format
 *                   - genre
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: The Great Novel
 *                   description:
 *                     type: string
 *                     example: An epic tale of adventure and discovery
 *                   author:
 *                     type: string
 *                     example: Jane Doe
 *                   isbn:
 *                     type: string
 *                     example: 978-1234567890
 *                   publisher:
 *                     type: string
 *                     example: Penguin Books
 *                   publishDate:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-01-15T00:00:00Z
 *                   language:
 *                     type: string
 *                     example: English
 *                   pageCount:
 *                     type: integer
 *                     example: 350
 *                   format:
 *                     type: string
 *                     example: Hardcover
 *                   genre:
 *                     type: string
 *                     example: Fiction
 *                   condition:
 *                     type: string
 *                     example: New
 *                   edition:
 *                     type: string
 *                     example: First Edition
 *                   dimensions:
 *                     type: string
 *                     example: 8.5 x 5.5 x 1.2 inches
 *                   weight:
 *                     type: integer
 *                     example: 500
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PROTECTED endpoint - requires authentication
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER), rateLimiter_1.createLimiter, (0, validation_1.validate)(product_controller_1.productValidation.create), product_controller_1.productController.createProduct);
/**
 * @swagger
 * /products/bulk:
 *   patch:
 *     summary: Bulk update products
 *     description: Update multiple products at once (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *               - updates
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of product IDs to update
 *                 example: ["uuid1", "uuid2", "uuid3"]
 *               updates:
 *                 type: object
 *                 description: Fields to update for all selected products
 *                 properties:
 *                   isActive:
 *                     type: boolean
 *                   isFeatured:
 *                     type: boolean
 *                   category:
 *                     type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Products updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PROTECTED endpoint - Admin only
router.patch('/bulk', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), rateLimiter_1.bulkLimiter, product_controller_1.productController.bulkUpdate);
/**
 * @swagger
 * /products/bulk:
 *   delete:
 *     summary: Bulk delete products
 *     description: Delete multiple products at once (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of product IDs to delete
 *                 example: ["uuid1", "uuid2", "uuid3"]
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Permanently delete the products
 *     responses:
 *       200:
 *         description: Products deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PROTECTED endpoint - Admin only
router.delete('/bulk', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), rateLimiter_1.bulkLimiter, product_controller_1.productController.bulkDelete);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve a single product by its ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUBLIC endpoint - no authentication required
router.get('/:id', (0, validation_1.validate)(product_controller_1.productValidation.getById), product_controller_1.productController.getProduct);
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     description: Update an existing product (Admin and Manager only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *               price:
 *                 type: number
 *               compareAtPrice:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *               trackQuantity:
 *                 type: boolean
 *               continueSellingOutOfStock:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               collections:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DRAFT, ARCHIVED]
 *               cafeAttributes:
 *                 type: object
 *                 description: Update cafe-specific attributes (only for CAFE products)
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   origin:
 *                     type: string
 *                   roastLevel:
 *                     type: string
 *                   caffeineContent:
 *                     type: string
 *                   size:
 *                     type: string
 *                   temperature:
 *                     type: string
 *                   allergens:
 *                     type: array
 *                     items:
 *                       type: string
 *                   calories:
 *                     type: integer
 *               flowersAttributes:
 *                 type: object
 *                 description: Update flower-specific attributes (only for FLOWERS products)
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   arrangementType:
 *                     type: string
 *                   occasion:
 *                     type: string
 *                   colors:
 *                     type: array
 *                     items:
 *                       type: string
 *                   flowerTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   size:
 *                     type: string
 *                   seasonality:
 *                     type: string
 *                   careInstructions:
 *                     type: string
 *                   vaseIncluded:
 *                     type: boolean
 *               booksAttributes:
 *                 type: object
 *                 description: Update book-specific attributes (only for BOOKS products)
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   author:
 *                     type: string
 *                   isbn:
 *                     type: string
 *                   publisher:
 *                     type: string
 *                   publishDate:
 *                     type: string
 *                     format: date-time
 *                   language:
 *                     type: string
 *                   pageCount:
 *                     type: integer
 *                   format:
 *                     type: string
 *                   genre:
 *                     type: string
 *                   condition:
 *                     type: string
 *                   edition:
 *                     type: string
 *                   dimensions:
 *                     type: string
 *                   weight:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PROTECTED endpoint - requires authentication
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER), (0, validation_1.validate)(product_controller_1.productValidation.update), product_controller_1.productController.updateProduct);
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product
 *     description: Delete a product (soft delete by default, force delete with ?force=true) - Admin only
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Permanently delete the product
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PROTECTED endpoint - Admin only
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN), (0, validation_1.validate)(product_controller_1.productValidation.delete), product_controller_1.productController.deleteProduct);
/**
 * @swagger
 * /products/{id}/images:
 *   post:
 *     summary: Upload product images
 *     description: Upload multiple images for a product (Admin and Manager only, max 10 images)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *                 description: Product images (max 10 files)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedImages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           url:
 *                             type: string
 *                             format: uri
 *                           position:
 *                             type: integer
 *       400:
 *         description: Validation error or file upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PROTECTED endpoint - requires authentication
router.post('/:id/images', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER), rateLimiter_1.uploadLimiter, upload.array('images', 10), product_controller_1.productController.uploadImages);
/**
 * @swagger
 * /products/{id}/images/reorder:
 *   put:
 *     summary: Reorder product images
 *     description: Change the display order of product images (Admin and Manager only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageOrder
 *             properties:
 *               imageOrder:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of image IDs in desired order
 *                 example: ["uuid1", "uuid2", "uuid3"]
 *     responses:
 *       200:
 *         description: Images reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Images reordered successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PROTECTED endpoint - requires authentication
router.put('/:id/images/reorder', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER), product_controller_1.productController.reorderImages);
/**
 * @swagger
 * /products/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete product image
 *     description: Delete a specific image from a product (Admin and Manager only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Image deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PROTECTED endpoint - requires authentication
router.delete('/:id/images/:imageId', auth_1.authenticate, (0, auth_1.authorize)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER), product_controller_1.productController.deleteImage);
exports.default = router;
//# sourceMappingURL=product.routes.js.map