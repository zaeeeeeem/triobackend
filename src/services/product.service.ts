import { Prisma, Section, ProductStatus, ProductAvailability, ProductImage } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';
import { cache } from '../config/redis';
import { env } from '../config/env';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
  ProductListResult,
  CreateCafeProductDto,
  CreateFlowersProductDto,
  CreateBooksProductDto,
} from '../types/product.types';
import { getSignedUrlFromStoredUrl } from '../utils/s3Helpers';

type ProductWithImages = Record<string, unknown> & { images?: ProductImage[] };

export class ProductService {
  async createProduct(data: CreateProductDto, userId: string) {
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

    // Create product based on section
    const product = await prisma.$transaction(async (tx) => {
      // Create base product
      const baseProduct = await tx.product.create({
        data: {
          sku: data.sku,
          section: data.section,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          costPrice: data.costPrice,
          stockQuantity: data.stockQuantity,
          trackQuantity: data.trackQuantity ?? true,
          continueSellingOutOfStock: data.continueSellingOutOfStock || false,
          availability,
          status: data.status || ProductStatus.DRAFT,
          tags: data.tags || [],
          collections: data.collections || [],
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Create section-specific product
      if (data.section === Section.CAFE) {
        const cafeData = data as CreateCafeProductDto;
        await tx.cafeProduct.create({
          data: {
            productId: baseProduct.id,
            name: cafeData.cafeAttributes.name,
            description: cafeData.cafeAttributes.description,
            category: cafeData.cafeAttributes.category,
            origin: cafeData.cafeAttributes.origin,
            roastLevel: cafeData.cafeAttributes.roastLevel,
            caffeineContent: cafeData.cafeAttributes.caffeineContent,
            size: cafeData.cafeAttributes.size,
            temperature: cafeData.cafeAttributes.temperature,
            allergens: cafeData.cafeAttributes.allergens || [],
            calories: cafeData.cafeAttributes.calories,
          },
        });
      } else if (data.section === Section.FLOWERS) {
        const flowersData = data as CreateFlowersProductDto;
        await tx.flowersProduct.create({
          data: {
            productId: baseProduct.id,
            name: flowersData.flowersAttributes.name,
            description: flowersData.flowersAttributes.description,
            arrangementType: flowersData.flowersAttributes.arrangementType,
            occasion: flowersData.flowersAttributes.occasion,
            colors: flowersData.flowersAttributes.colors || [],
            flowerTypes: flowersData.flowersAttributes.flowerTypes || [],
            size: flowersData.flowersAttributes.size,
            seasonality: flowersData.flowersAttributes.seasonality,
            careInstructions: flowersData.flowersAttributes.careInstructions,
            vaseIncluded: flowersData.flowersAttributes.vaseIncluded || false,
          },
        });
      } else if (data.section === Section.BOOKS) {
        const booksData = data as CreateBooksProductDto;
        await tx.booksProduct.create({
          data: {
            productId: baseProduct.id,
            title: booksData.booksAttributes.title,
            description: booksData.booksAttributes.description,
            author: booksData.booksAttributes.author,
            isbn: booksData.booksAttributes.isbn,
            publisher: booksData.booksAttributes.publisher,
            publishDate: booksData.booksAttributes.publishDate
              ? new Date(booksData.booksAttributes.publishDate)
              : undefined,
            language: booksData.booksAttributes.language || 'English',
            pageCount: booksData.booksAttributes.pageCount,
            format: booksData.booksAttributes.format,
            genre: booksData.booksAttributes.genre,
            condition: booksData.booksAttributes.condition || 'New',
            edition: booksData.booksAttributes.edition,
            dimensions: booksData.booksAttributes.dimensions,
            weight: booksData.booksAttributes.weight,
          },
        });
      }

      // Fetch complete product with relations
      return tx.product.findUnique({
        where: { id: baseProduct.id },
        include: {
          cafeProduct: true,
          flowersProduct: true,
          booksProduct: true,
          images: true,
          variants: true,
        },
      });
    });

    if (!product) {
      throw new Error('Failed to create product');
    }

    // Create corresponding inventory item
    await this.createInventoryItem(product);

    // Invalidate cache
    await this.invalidateProductCache(product.section);

    return this.addSignedUrlsToProduct(product);
  }

  async getProductById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        cafeProduct: true,
        flowersProduct: true,
        booksProduct: true,
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

    return this.addSignedUrlsToProduct(product);
  }

  async listProducts(
    params: ProductQueryParams,
    userRole?: string,
    userSection?: Section
  ): Promise<ProductListResult> {
    const page = Number(params.page) || 1;
    const limit = Math.min(Number(params.limit) || env.DEFAULT_PAGE_SIZE, env.MAX_PAGE_SIZE);
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

    // Search - need to handle section-specific fields
    if (params.search) {
      where.OR = [
        { sku: { contains: params.search, mode: 'insensitive' } },
        {
          cafeProduct: {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
            ],
          },
        },
        {
          flowersProduct: {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
            ],
          },
        },
        {
          booksProduct: {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
              { author: { contains: params.search, mode: 'insensitive' } },
            ],
          },
        },
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
      const cafeWhere: Record<string, unknown> = {};
      if (params.cafeCategory) {
        cafeWhere.category = params.cafeCategory;
      }
      if (params.caffeineContent) {
        cafeWhere.caffeineContent = params.caffeineContent;
      }
      if (params.origin) {
        cafeWhere.origin = params.origin;
      }
      if (Object.keys(cafeWhere).length > 0) {
        (where as Record<string, unknown>).cafeProduct = cafeWhere;
      }
    }

    if (params.section === Section.FLOWERS) {
      const flowersWhere: Record<string, unknown> = {};
      if (params.arrangementType) {
        flowersWhere.arrangementType = params.arrangementType;
      }
      if (params.occasion) {
        flowersWhere.occasion = params.occasion;
      }
      if (params.seasonality) {
        flowersWhere.seasonality = params.seasonality;
      }
      if (Object.keys(flowersWhere).length > 0) {
        (where as Record<string, unknown>).flowersProduct = flowersWhere;
      }
    }

    if (params.section === Section.BOOKS) {
      const booksWhere: Record<string, unknown> = {};
      if (params.author) {
        booksWhere.author = { contains: params.author, mode: 'insensitive' };
      }
      if (params.genre) {
        // Check if genre array contains the specified genre
        booksWhere.genre = { has: params.genre };
      }
      if (params.format) {
        booksWhere.format = params.format;
      }
      if (Object.keys(booksWhere).length > 0) {
        (where as Record<string, unknown>).booksProduct = booksWhere;
      }
    }

    // Handle mostDiscounted filter
    if (params.mostDiscounted) {
      // Fetch all products with compareAtPrice to calculate discount
      const productsWithDiscount = await prisma.product.findMany({
        where: {
          ...where,
          compareAtPrice: { not: null, gt: 0 },
          price: { gt: 0 },
        },
        include: {
          cafeProduct: true,
          flowersProduct: true,
          booksProduct: true,
          images: {
            take: 1,
            orderBy: { position: 'asc' },
          },
        },
      });

      // Calculate discount percentage and sort
      const productsWithDiscountCalc = productsWithDiscount.map((product) => {
        const compareAt = Number(product.compareAtPrice);
        const price = Number(product.price);
        const discountPercentage = compareAt > 0 ? ((compareAt - price) / compareAt) * 100 : 0;
        return {
          ...product,
          discountPercentage,
        };
      });

      // Sort by discount percentage descending and take top 7
      const topDiscounted = productsWithDiscountCalc
        .sort((a, b) => b.discountPercentage - a.discountPercentage)
        .slice(0, 7);

      return {
        products: await this.addSignedUrlsToProducts(topDiscounted as ProductWithImages[]),
        totalItems: topDiscounted.length,
        page: 1,
        limit: 7,
      };
    }

    // Sorting
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortOrder = params.sortOrder || 'desc';

    if (params.sortBy === 'price' || params.sortBy === 'createdAt' || params.sortBy === 'updatedAt') {
      orderBy[params.sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Try to get from cache
    const cacheKey = `products:list:${JSON.stringify({ where, orderBy, skip, limit })}`;
    const cached = await cache.get<ProductListResult>(cacheKey);
    if (cached) {
      const productsWithSignedUrls = await this.addSignedUrlsToProducts(
        cached.products as ProductWithImages[]
      );
      return {
        ...cached,
        products: productsWithSignedUrls,
      };
    }

    // Execute query
    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          cafeProduct: true,
          flowersProduct: true,
          booksProduct: true,
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
    await cache.set(cacheKey, result, 1);

    return {
      ...result,
      products: await this.addSignedUrlsToProducts(products as ProductWithImages[]),
    };
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

    // Recalculate availability if stock changed
    let availability = existingProduct.availability;
    if (data.stockQuantity !== undefined || data.continueSellingOutOfStock !== undefined) {
      availability = this.calculateAvailability(
        data.stockQuantity ?? existingProduct.stockQuantity,
        data.continueSellingOutOfStock ?? existingProduct.continueSellingOutOfStock
      );
    }

    // Update product based on section
    const product = await prisma.$transaction(async (tx) => {
      // Update base product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          sku: data.sku,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          costPrice: data.costPrice,
          stockQuantity: data.stockQuantity,
          trackQuantity: data.trackQuantity,
          continueSellingOutOfStock: data.continueSellingOutOfStock,
          availability,
          status: data.status,
          tags: data.tags,
          collections: data.collections,
          updatedBy: userId,
        },
      });

      // Update section-specific product
      if (existingProduct.section === Section.CAFE && 'cafeAttributes' in data && data.cafeAttributes) {
        await tx.cafeProduct.update({
          where: { productId: id },
          data: {
            name: data.cafeAttributes.name,
            description: data.cafeAttributes.description,
            category: data.cafeAttributes.category,
            origin: data.cafeAttributes.origin,
            roastLevel: data.cafeAttributes.roastLevel,
            caffeineContent: data.cafeAttributes.caffeineContent,
            size: data.cafeAttributes.size,
            temperature: data.cafeAttributes.temperature,
            allergens: data.cafeAttributes.allergens,
            calories: data.cafeAttributes.calories,
          },
        });
      } else if (existingProduct.section === Section.FLOWERS && 'flowersAttributes' in data && data.flowersAttributes) {
        await tx.flowersProduct.update({
          where: { productId: id },
          data: {
            name: data.flowersAttributes.name,
            description: data.flowersAttributes.description,
            arrangementType: data.flowersAttributes.arrangementType,
            occasion: data.flowersAttributes.occasion,
            colors: data.flowersAttributes.colors,
            flowerTypes: data.flowersAttributes.flowerTypes,
            size: data.flowersAttributes.size,
            seasonality: data.flowersAttributes.seasonality,
            careInstructions: data.flowersAttributes.careInstructions,
            vaseIncluded: data.flowersAttributes.vaseIncluded,
          },
        });
      } else if (existingProduct.section === Section.BOOKS && 'booksAttributes' in data && data.booksAttributes) {
        await tx.booksProduct.update({
          where: { productId: id },
          data: {
            title: data.booksAttributes.title,
            description: data.booksAttributes.description,
            author: data.booksAttributes.author,
            isbn: data.booksAttributes.isbn,
            publisher: data.booksAttributes.publisher,
            publishDate: data.booksAttributes.publishDate
              ? new Date(data.booksAttributes.publishDate)
              : undefined,
            language: data.booksAttributes.language,
            pageCount: data.booksAttributes.pageCount,
            format: data.booksAttributes.format,
            genre: data.booksAttributes.genre,
            condition: data.booksAttributes.condition,
            edition: data.booksAttributes.edition,
            dimensions: data.booksAttributes.dimensions,
            weight: data.booksAttributes.weight,
          },
        });
      }

      // Fetch complete product with relations
      return tx.product.findUnique({
        where: { id: updatedProduct.id },
        include: {
          cafeProduct: true,
          flowersProduct: true,
          booksProduct: true,
          images: {
            orderBy: { position: 'asc' },
          },
          variants: true,
        },
      });
    });

    if (!product) {
      throw new Error('Failed to update product');
    }

    // Invalidate cache
    await this.invalidateProductCache(product.section);

    return this.addSignedUrlsToProduct(product);
  }

  async deleteProduct(id: string, force: boolean = false) {
    const product = await this.getProductById(id);

    // Check for active orders (not delivered or cancelled)
    const activeOrders = await prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          orderStatus: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
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
    const results = { updated: 0, failed: 0, errors: [] as Record<string, unknown>[] };

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
    const results = { deleted: 0, failed: 0, errors: [] as Record<string, unknown>[] };

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

  private async createInventoryItem(product: Record<string, unknown>) {
    const productName =
      product.section === Section.BOOKS
        ? (product.booksProduct as Record<string, unknown>)?.title
        : product.section === Section.CAFE
        ? (product.cafeProduct as Record<string, unknown>)?.name
        : (product.flowersProduct as Record<string, unknown>)?.name;

    await prisma.inventoryItem.create({
      data: {
        productId: product.id as string,
        productName: productName as string,
        sku: product.sku as string,
        section: product.section as Section,
        onHand: product.stockQuantity as number,
        available: product.stockQuantity as number,
        committed: 0,
        incoming: 0,
        location: 'Main Warehouse',
        costPrice: (product.costPrice as number) || 0,
        sellingPrice: product.price as number,
        status: (product.stockQuantity as number) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
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

  private async addSignedUrlsToProducts<T extends ProductWithImages>(products: T[]): Promise<T[]> {
    return Promise.all(products.map((product) => this.addSignedUrlsToProduct(product)));
  }

  private async addSignedUrlsToProduct<T extends ProductWithImages>(product: T): Promise<T> {
    if (!product.images || product.images.length === 0) {
      return product;
    }

    const imagesWithSignedUrls = await this.addSignedUrlsToImages(product.images);
    return {
      ...product,
      images: imagesWithSignedUrls,
    };
  }

  private async addSignedUrlsToImages(images: ProductImage[]): Promise<
    (ProductImage & {
      signedOriginalUrl: string;
      signedMediumUrl: string;
      signedThumbnailUrl: string;
    })[]
  > {
    return Promise.all(
      images.map(async (image) => {
        const [signedOriginalUrl, signedMediumUrl, signedThumbnailUrl] = await Promise.all([
          getSignedUrlFromStoredUrl(image.originalUrl),
          getSignedUrlFromStoredUrl(image.mediumUrl),
          getSignedUrlFromStoredUrl(image.thumbnailUrl),
        ]);

        return {
          ...image,
          signedOriginalUrl,
          signedMediumUrl,
          signedThumbnailUrl,
        };
      })
    );
  }
}

export const productService = new ProductService();
