import { Prisma, Section, ProductStatus, ProductAvailability } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { cache } from '../config/redis';
import { env } from '../config/env';

export interface CreateProductDto {
  name?: string;
  title?: string;
  description?: string;
  section: Section;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  stockQuantity: number;
  trackQuantity?: boolean;
  continueSellingOutOfStock?: boolean;
  status?: ProductStatus;
  tags?: string[];
  collections?: string[];
  cafeAttributes?: Prisma.InputJsonValue;
  flowersAttributes?: Prisma.InputJsonValue;
  booksAttributes?: Prisma.InputJsonValue;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  section?: never; // Prevent changing section
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  section?: Section;
  status?: ProductStatus;
  availability?: ProductAvailability;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  tags?: string;
  collections?: string;
  // Section-specific filters
  category?: string;
  caffeineContent?: string;
  arrangementType?: string;
  colors?: string;
  author?: string;
  genre?: string;
  format?: string;
  condition?: string;
  language?: string;
}

export interface ProductListResult {
  products: unknown[];
  totalItems: number;
  page: number;
  limit: number;
}

export class ProductService {
  async createProduct(data: CreateProductDto, userId: string) {
    // Validate section-specific requirements
    this.validateSectionData(data);

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw new ConflictError(`SKU ${data.sku} already exists`);
    }

    // Calculate availability
    const availability = this.calculateAvailability(
      data.stockQuantity,
      data.continueSellingOutOfStock || false
    );

    // Create product
    const product = await prisma.product.create({
      data: {
        ...data,
        availability,
        trackQuantity: data.trackQuantity ?? true,
        status: data.status || ProductStatus.DRAFT,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        images: true,
        variants: true,
      },
    });

    // Create corresponding inventory item
    await this.createInventoryItem(product);

    // Invalidate cache
    await this.invalidateProductCache(product.section);

    return product;
  }

  async getProductById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        variants: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundError('Product', id);
    }

    return product;
  }

  async listProducts(
    params: ProductQueryParams,
    userRole?: string,
    userSection?: Section
  ): Promise<ProductListResult> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || env.DEFAULT_PAGE_SIZE, env.MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    // Apply section filter based on user role
    if (userRole === 'MANAGER' && userSection) {
      where.section = userSection;
    } else if (params.section) {
      where.section = params.section;
    }

    // Search
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (params.status) {
      where.status = params.status;
    }

    // Availability filter
    if (params.availability) {
      where.availability = params.availability;
    }

    // Price filters
    if (params.minPrice || params.maxPrice) {
      where.price = {};
      if (params.minPrice) {
        where.price.gte = params.minPrice;
      }
      if (params.maxPrice) {
        where.price.lte = params.maxPrice;
      }
    }

    // Stock filters
    if (params.minStock || params.maxStock) {
      where.stockQuantity = {};
      if (params.minStock) {
        where.stockQuantity.gte = params.minStock;
      }
      if (params.maxStock) {
        where.stockQuantity.lte = params.maxStock;
      }
    }

    // Tags filter
    if (params.tags) {
      where.tags = { hasSome: params.tags.split(',') };
    }

    // Collections filter
    if (params.collections) {
      where.collections = { hasSome: params.collections.split(',') };
    }

    // Section-specific filters
    if (params.section === Section.CAFE) {
      if (params.category) {
        where.cafeAttributes = { path: ['category'], equals: params.category };
      }
      if (params.caffeineContent) {
        where.cafeAttributes = { path: ['caffeineContent'], equals: params.caffeineContent };
      }
    }

    if (params.section === Section.FLOWERS) {
      if (params.arrangementType) {
        where.flowersAttributes = { path: ['arrangementType'], equals: params.arrangementType };
      }
    }

    if (params.section === Section.BOOKS) {
      if (params.author) {
        where.booksAttributes = { path: ['author'], string_contains: params.author };
      }
      if (params.format) {
        where.booksAttributes = { path: ['format'], equals: params.format };
      }
    }

    // Sorting
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    if (sortBy === 'name' || sortBy === 'title') {
      orderBy[params.section === Section.BOOKS ? 'title' : 'name'] = sortOrder;
    } else if (sortBy === 'price' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Try to get from cache
    const cacheKey = `products:list:${JSON.stringify({ where, orderBy, skip, limit })}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached as ProductListResult;
    }

    // Execute query
    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            take: 1,
            orderBy: { position: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      totalItems,
      page,
      limit,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return result;
  }

  async updateProduct(id: string, data: UpdateProductDto, userId: string) {
    const existingProduct = await this.getProductById(id);

    // Validate SKU uniqueness if changed
    if (data.sku && data.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (duplicateSku) {
        throw new ConflictError(`SKU ${data.sku} already exists for another product`);
      }
    }

    // Validate section-specific data if provided
    if (data.cafeAttributes || data.flowersAttributes || data.booksAttributes) {
      this.validateSectionData({ ...existingProduct, ...data } as CreateProductDto);
    }

    // Recalculate availability if stock changed
    let availability = existingProduct.availability;
    if (data.stockQuantity !== undefined || data.continueSellingOutOfStock !== undefined) {
      availability = this.calculateAvailability(
        data.stockQuantity ?? existingProduct.stockQuantity,
        data.continueSellingOutOfStock ?? existingProduct.continueSellingOutOfStock
      );
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        availability,
        updatedBy: userId,
      },
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        variants: true,
      },
    });

    // Invalidate cache
    await this.invalidateProductCache(product.section);

    return product;
  }

  async deleteProduct(id: string, force: boolean = false) {
    const product = await this.getProductById(id);

    // Check for active orders
    const activeOrders = await prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          fulfillmentStatus: { in: ['UNFULFILLED', 'PARTIAL'] },
        },
      },
    });

    if (activeOrders > 0 && !force) {
      throw new ConflictError('Cannot delete product with active orders', {
        activeOrders,
      });
    }

    if (force) {
      // Hard delete
      await prisma.product.delete({ where: { id } });
    } else {
      // Soft delete
      await prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }

    // Invalidate cache
    await this.invalidateProductCache(product.section);

    return { id, deletedAt: new Date() };
  }

  async bulkUpdateProducts(productIds: string[], updates: UpdateProductDto, userId: string) {
    const results = { updated: 0, failed: 0, errors: [] as unknown[] };

    for (const id of productIds) {
      try {
        await this.updateProduct(id, updates, userId);
        results.updated++;
      } catch (error: unknown) {
        results.failed++;
        if (error instanceof Error) {
          results.errors.push({ productId: id, error: error.message });
        } else {
          results.errors.push({ productId: id, error: 'Unknown error' });
        }
      }
    }

    return results;
  }

  async bulkDeleteProducts(productIds: string[], force: boolean = false) {
    const results = { deleted: 0, failed: 0, errors: [] as unknown[] };

    for (const id of productIds) {
      try {
        await this.deleteProduct(id, force);
        results.deleted++;
      } catch (error: unknown) {
        results.failed++;
        if (error instanceof Error) {
          results.errors.push({ productId: id, error: error.message });
        } else {
          results.errors.push({ productId: id, error: 'Unknown error' });
        }
      }
    }

    return results;
  }

  private validateSectionData(data: CreateProductDto) {
    if (data.section === Section.CAFE) {
      if (!data.name) {
        throw new ValidationError('Name is required for cafe products');
      }
      if (!data.cafeAttributes) {
        throw new ValidationError('Cafe attributes are required for cafe products');
      }
    }

    if (data.section === Section.FLOWERS) {
      if (!data.name) {
        throw new ValidationError('Name is required for flower products');
      }
      if (!data.flowersAttributes) {
        throw new ValidationError('Flowers attributes are required for flower products');
      }
    }

    if (data.section === Section.BOOKS) {
      if (!data.title) {
        throw new ValidationError('Title is required for book products');
      }
      if (!data.booksAttributes) {
        throw new ValidationError('Books attributes are required for book products');
      }
    }
  }

  private calculateAvailability(
    stockQuantity: number,
    continueSellingOutOfStock: boolean
  ): ProductAvailability {
    if (stockQuantity > 0) {
      return ProductAvailability.AVAILABLE;
    }

    return continueSellingOutOfStock
      ? ProductAvailability.AVAILABLE
      : ProductAvailability.OUT_OF_STOCK;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createInventoryItem(product: any) {
    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        productName: product.name || product.title,
        sku: product.sku,
        section: product.section,
        onHand: product.stockQuantity,
        available: product.stockQuantity,
        committed: 0,
        incoming: 0,
        location: 'Main Warehouse',
        costPrice: product.costPrice || 0,
        sellingPrice: product.price,
        status: product.stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
        reorderPoint: 10,
        reorderQuantity: 50,
      },
    });
  }

  private async invalidateProductCache(section?: Section) {
    await cache.invalidatePattern('products:list:*');
    if (section) {
      await cache.invalidatePattern(`products:${section}:*`);
    }
  }
}

export const productService = new ProductService();
